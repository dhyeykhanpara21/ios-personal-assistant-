import Foundation
import Combine
import SwiftUI

@MainActor
public final class ReminderViewModel: ObservableObject {
    @Published public var reminders: [ReminderItem] = []
    @Published public var selectedCategory: ItemCategory? = nil
    @Published public var isLoading: Bool = false
    @Published public var errorMessage: String? = nil
    
    public init() {
        loadReminders()
    }
    
    public func loadReminders() {
        reminders = StorageManager.shared.getReminders()
        
        Task {
            isLoading = true
            defer { isLoading = false }
            do {
                let fetched = try await APIClient.shared.fetchReminders()
                self.reminders = fetched
                NotificationManager.shared.reconcileAllNotifications()
            } catch {
                self.errorMessage = error.localizedDescription
            }
        }
    }
    
    public var filteredReminders: [ReminderItem] {
        var list = reminders
        if let cat = selectedCategory {
            list = list.filter { $0.category == cat }
        }
        return list.sorted { $0.effectiveScheduledDate < $1.effectiveScheduledDate }
    }
    
    public func createReminder(
        title: String,
        description: String? = nil,
        scheduledAt: Date,
        recurrenceRule: RecurrenceRule = .none,
        category: ItemCategory = .other,
        priority: Priority = .medium
    ) {
        guard !title.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        let newReminder = ReminderItem(
            title: title.trimmingCharacters(in: .whitespaces),
            description: description,
            scheduledAt: scheduledAt,
            recurrenceRule: recurrenceRule,
            category: category,
            priority: priority,
            isEnabled: true
        )
        
        reminders.insert(newReminder, at: 0)
        StorageManager.shared.saveReminders(reminders)
        NotificationManager.shared.scheduleReminderNotification(for: newReminder)
        HapticFeedback.shared.notification(.success)
        
        Task {
            _ = try? await APIClient.shared.createReminder(newReminder)
        }
    }
    
    public func toggleReminderEnabled(_ reminder: ReminderItem) {
        guard let index = reminders.firstIndex(where: { $0.id == reminder.id }) else { return }
        reminders[index].isEnabled.toggle()
        reminders[index].updatedAt = Date()
        
        let updated = reminders[index]
        StorageManager.shared.saveReminders(reminders)
        
        if updated.isEnabled {
            NotificationManager.shared.scheduleReminderNotification(for: updated)
        } else {
            NotificationManager.shared.cancelReminderNotification(id: updated.id)
        }
        
        HapticFeedback.shared.impact(.light)
        
        Task {
            _ = try? await APIClient.shared.updateReminder(updated)
        }
    }
    
    public func completeReminder(_ reminder: ReminderItem) {
        guard let index = reminders.firstIndex(where: { $0.id == reminder.id }) else { return }
        
        if reminder.recurrenceRule != .none,
           let next = reminder.recurrenceRule.nextDate(after: reminder.scheduledAt) {
            // Recurring reminder advances to next cycle!
            reminders[index].scheduledAt = next
            reminders[index].snoozedUntil = nil
            reminders[index].isCompleted = false
            reminders[index].updatedAt = Date()
            
            NotificationManager.shared.scheduleReminderNotification(for: reminders[index])
        } else {
            // One-time reminder is marked completed
            reminders[index].isCompleted = true
            reminders[index].updatedAt = Date()
            NotificationManager.shared.cancelReminderNotification(id: reminder.id)
        }
        
        StorageManager.shared.saveReminders(reminders)
        HapticFeedback.shared.notification(.success)
        
        let updated = reminders[index]
        Task {
            _ = try? await APIClient.shared.updateReminder(updated)
        }
    }
    
    public func snoozeReminder(_ reminder: ReminderItem, minutes: Int = 15) {
        guard let index = reminders.firstIndex(where: { $0.id == reminder.id }) else { return }
        let snoozeDate = Date().addingTimeInterval(Double(minutes * 60))
        reminders[index].snoozedUntil = snoozeDate
        reminders[index].updatedAt = Date()
        
        StorageManager.shared.saveReminders(reminders)
        NotificationManager.shared.snoozeReminder(id: reminder.id, minutes: minutes)
        HapticFeedback.shared.notification(.warning)
        
        Task {
            _ = try? await APIClient.shared.snoozeReminder(id: reminder.id, minutes: minutes)
        }
    }
    
    public func deleteReminder(_ reminder: ReminderItem) {
        reminders.removeAll(where: { $0.id == reminder.id })
        StorageManager.shared.saveReminders(reminders)
        NotificationManager.shared.cancelReminderNotification(id: reminder.id)
        HapticFeedback.shared.impact(.heavy)
        
        Task {
            _ = try? await APIClient.shared.deleteReminder(id: reminder.id)
        }
    }
}
