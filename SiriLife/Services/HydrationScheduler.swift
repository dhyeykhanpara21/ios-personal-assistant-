import Foundation
import UserNotifications

public final class HydrationScheduler {
    public static let shared = HydrationScheduler()
    private let center = UNUserNotificationCenter.current()
    
    private init() {}
    
    // MARK: - Re-schedule Hydration Notifications
    public func rescheduleHydrationReminders() {
        // First, cancel all previous hydration notifications to prevent any duplicates
        cancelAllHydrationReminders()
        
        let prefs = StorageManager.shared.getPreferences()
        let isPaused = StorageManager.shared.isHydrationPaused
        
        guard !isPaused else {
            return
        }
        
        let intervalMinutes = max(15, prefs.waterReminderIntervalMinutes)
        let waking = prefs.wakingComponents
        let sleeping = prefs.sleepingComponents
        
        let calendar = Calendar.current
        let now = Date()
        
        // Generate daily reminder times between waking and sleeping
        let wakeMinutesFromMidnight = waking.hour * 60 + waking.minute
        let sleepMinutesFromMidnight = sleeping.hour * 60 + sleeping.minute
        
        guard sleepMinutesFromMidnight > wakeMinutesFromMidnight else {
            // Handle edge case if waking is greater than sleeping or overnight
            return
        }
        
        var currentSlotMinutes = wakeMinutesFromMidnight + intervalMinutes
        var slotIndex = 1
        
        while currentSlotMinutes < sleepMinutesFromMidnight {
            let slotHour = currentSlotMinutes / 60
            let slotMinute = currentSlotMinutes % 60
            
            var dateComponents = DateComponents()
            dateComponents.hour = slotHour
            dateComponents.minute = slotMinute
            
            let content = UNMutableNotificationContent()
            content.title = "Time to Hydrate! 💧"
            content.body = "Stay refreshed and drink a glass of water to reach your \(prefs.dailyWaterGoalMl) ml goal."
            content.sound = prefs.notificationPreferences.waterSound ? .default : nil
            content.categoryIdentifier = NotificationManager.hydrationCategoryIdentifier
            content.userInfo = ["type": "hydration", "slot": slotIndex]
            
            let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
            let request = UNNotificationRequest(
                identifier: "hydration_slot_\(slotIndex)",
                content: content,
                trigger: trigger
            )
            
            center.add(request)
            
            currentSlotMinutes += intervalMinutes
            slotIndex += 1
        }
    }
    
    // MARK: - Snooze Hydration Reminder
    public func snoozeWaterReminder(minutes: Int = 15) {
        let content = UNMutableNotificationContent()
        content.title = "Hydration Reminder (Snoozed) 💧"
        content.body = "Take a moment to drink some water now!"
        content.sound = .default
        content.categoryIdentifier = NotificationManager.hydrationCategoryIdentifier
        content.userInfo = ["type": "hydration", "snooze": true]
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: Double(minutes * 60), repeats: false)
        let request = UNNotificationRequest(
            identifier: "hydration_snooze",
            content: content,
            trigger: trigger
        )
        center.add(request)
    }
    
    // MARK: - Cancel All Hydration Notifications
    public func cancelAllHydrationReminders() {
        center.getPendingNotificationRequests { requests in
            let hydrationIds = requests
                .filter { $0.identifier.starts(with: "hydration_") }
                .map { $0.identifier }
            
            if !hydrationIds.isEmpty {
                self.center.removePendingNotificationRequests(withIdentifiers: hydrationIds)
                self.center.removeDeliveredNotifications(withIdentifiers: hydrationIds)
            }
        }
    }
}
