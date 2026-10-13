import Foundation
import Combine
import SwiftUI

@MainActor
public final class DashboardViewModel: ObservableObject {
    @Published public var greeting: String = "Welcome"
    @Published public var currentDateFormatted: String = ""
    @Published public var todayTasksTotal: Int = 0
    @Published public var todayTasksCompleted: Int = 0
    @Published public var tasksProgress: Double = 0.0
    @Published public var upcomingReminders: [ReminderItem] = []
    @Published public var waterIntakeMl: Int = 0
    @Published public var waterGoalMl: Int = 2000
    @Published public var waterProgress: Double = 0.0
    @Published public var isLoading: Bool = false
    
    public init() {
        updateDateAndGreeting()
        loadDashboardData()
    }
    
    public func updateDateAndGreeting() {
        let hour = Calendar.current.component(.hour, from: Date())
        let userName = AuthManager.shared.currentUser?.name ?? "Friend"
        
        switch hour {
        case 5..<12:
            greeting = "Good Morning, \(userName)"
        case 12..<17:
            greeting = "Good Afternoon, \(userName)"
        case 17..<22:
            greeting = "Good Evening, \(userName)"
        default:
            greeting = "Good Night, \(userName)"
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d"
        currentDateFormatted = formatter.string(from: Date())
    }
    
    public func loadDashboardData() {
        isLoading = true
        updateDateAndGreeting()
        
        // 1. Tasks
        let allTasks = StorageManager.shared.getTasks()
        let todayTasks = allTasks.filter { $0.isDueToday }
        todayTasksTotal = todayTasks.count
        todayTasksCompleted = todayTasks.filter { $0.isCompleted }.count
        tasksProgress = todayTasksTotal > 0 ? Double(todayTasksCompleted) / Double(todayTasksTotal) : 0.0
        
        // 2. Upcoming Reminders
        let allReminders = StorageManager.shared.getReminders()
        upcomingReminders = allReminders
            .filter { $0.isEnabled && !$0.isCompleted }
            .sorted(by: { $0.effectiveScheduledDate < $1.effectiveScheduledDate })
            .prefix(3)
            .map { $0 }
        
        // 3. Hydration
        let prefs = StorageManager.shared.getPreferences()
        waterGoalMl = prefs.dailyWaterGoalMl
        waterIntakeMl = StorageManager.shared.getTodayHydrationTotal()
        waterProgress = waterGoalMl > 0 ? min(1.0, Double(waterIntakeMl) / Double(waterGoalMl)) : 0.0
        
        isLoading = false
        
        // Async background refresh from backend API
        Task {
            _ = try? await APIClient.shared.fetchTasks()
            _ = try? await APIClient.shared.fetchReminders()
            _ = try? await APIClient.shared.fetchTodayHydration()
        }
    }
    
    public func quickLogWater(amountMl: Int = 250) {
        let log = HydrationLog(amountMl: amountMl)
        StorageManager.shared.addHydrationLog(log)
        waterIntakeMl += amountMl
        waterProgress = waterGoalMl > 0 ? min(1.0, Double(waterIntakeMl) / Double(waterGoalMl)) : 0.0
        HapticFeedback.shared.notification(.success)
        
        Task {
            _ = try? await APIClient.shared.logHydration(amountMl: amountMl)
        }
    }
}
