import Foundation
import Combine
import SwiftUI

public struct DailyIntakeRecord: Identifiable {
    public var id = UUID()
    public var dayName: String
    public var date: Date
    public var totalMl: Int
    public var goalMl: Int
}

@MainActor
public final class HydrationViewModel: ObservableObject {
    @Published public var currentDayTotalMl: Int = 0
    @Published public var dailyGoalMl: Int = 2000
    @Published public var progressPercentage: Double = 0.0
    @Published public var remainingMl: Int = 2000
    @Published public var todayLogs: [HydrationLog] = []
    @Published public var weeklyHistory: [DailyIntakeRecord] = []
    @Published public var isReminderPaused: Bool = false
    @Published public var reminderIntervalMinutes: Int = 60
    @Published public var isLoading: Bool = false
    
    public init() {
        loadHydrationData()
    }
    
    public func loadHydrationData() {
        let prefs = StorageManager.shared.getPreferences()
        dailyGoalMl = prefs.dailyWaterGoalMl
        reminderIntervalMinutes = prefs.waterReminderIntervalMinutes
        isReminderPaused = StorageManager.shared.isHydrationPaused
        
        recalculateToday()
        calculateWeeklyHistory()
        
        Task {
            isLoading = true
            defer { isLoading = false }
            do {
                let summary = try await APIClient.shared.fetchTodayHydration()
                self.currentDayTotalMl = summary.totalMl
                self.dailyGoalMl = summary.dailyGoalMl
                self.remainingMl = summary.remainingMl
                self.progressPercentage = summary.progressPercentage
                self.todayLogs = summary.logs
                self.calculateWeeklyHistory()
            } catch {
                // Fallback to local
                self.recalculateToday()
            }
        }
    }
    
    private func recalculateToday() {
        let allLogs = StorageManager.shared.getHydrationLogs()
        let calendar = Calendar.current
        todayLogs = allLogs.filter { calendar.isDateInToday($0.loggedAt) }
        currentDayTotalMl = todayLogs.reduce(0) { $0 + $1.amountMl }
        remainingMl = max(0, dailyGoalMl - currentDayTotalMl)
        progressPercentage = dailyGoalMl > 0 ? min(1.0, Double(currentDayTotalMl) / Double(dailyGoalMl)) : 0.0
    }
    
    private func calculateWeeklyHistory() {
        let calendar = Calendar.current
        let allLogs = StorageManager.shared.getHydrationLogs()
        var history: [DailyIntakeRecord] = []
        
        let dayFormatter = DateFormatter()
        dayFormatter.dateFormat = "EEE"
        
        // Generate last 7 days including today
        for dayOffset in (0..<7).reversed() {
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: Date()) else { continue }
            let dayLogs = allLogs.filter { calendar.isDate($0.loggedAt, inSameDayAs: date) }
            let sum = dayLogs.reduce(0) { $0 + $1.amountMl }
            let name = dayOffset == 0 ? "Today" : dayFormatter.string(from: date)
            history.append(DailyIntakeRecord(dayName: name, date: date, totalMl: sum, goalMl: dailyGoalMl))
        }
        
        self.weeklyHistory = history
    }
    
    public func logWater(amountMl: Int) {
        guard amountMl > 0 else { return }
        
        let newLog = HydrationLog(amountMl: amountMl)
        StorageManager.shared.addHydrationLog(newLog)
        
        recalculateToday()
        calculateWeeklyHistory()
        HapticFeedback.shared.notification(.success)
        
        Task {
            _ = try? await APIClient.shared.logHydration(amountMl: amountMl)
        }
    }
    
    public func togglePauseReminders() {
        isReminderPaused.toggle()
        StorageManager.shared.isHydrationPaused = isReminderPaused
        
        if isReminderPaused {
            HydrationScheduler.shared.cancelAllHydrationReminders()
        } else {
            HydrationScheduler.shared.rescheduleHydrationReminders()
        }
        
        HapticFeedback.shared.impact(.medium)
    }
}
