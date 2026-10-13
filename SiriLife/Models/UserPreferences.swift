import Foundation

public struct NotificationPreferences: Codable, Hashable {
    public var remindersSound: Bool
    public var waterSound: Bool
    public var vibration: Bool
    
    public init(remindersSound: Bool = true, waterSound: Bool = true, vibration: Bool = true) {
        self.remindersSound = remindersSound
        self.waterSound = waterSound
        self.vibration = vibration
    }
}

public struct UserPreferences: Codable, Hashable {
    public var userId: String
    public var dailyWaterGoalMl: Int
    public var waterReminderIntervalMinutes: Int
    public var wakingTime: String // "07:00"
    public var sleepingTime: String // "22:00"
    public var quietHoursEnabled: Bool
    public var notificationPreferences: NotificationPreferences
    public var updatedAt: Date
    
    public init(
        userId: String = "",
        dailyWaterGoalMl: Int = 2000,
        waterReminderIntervalMinutes: Int = 60,
        wakingTime: String = "07:00",
        sleepingTime: String = "22:00",
        quietHoursEnabled: Bool = true,
        notificationPreferences: NotificationPreferences = NotificationPreferences(),
        updatedAt: Date = Date()
    ) {
        self.userId = userId
        self.dailyWaterGoalMl = dailyWaterGoalMl
        self.waterReminderIntervalMinutes = waterReminderIntervalMinutes
        self.wakingTime = wakingTime
        self.sleepingTime = sleepingTime
        self.quietHoursEnabled = quietHoursEnabled
        self.notificationPreferences = notificationPreferences
        self.updatedAt = updatedAt
    }
    
    public static var `default`: UserPreferences {
        UserPreferences()
    }
    
    public var wakingComponents: (hour: Int, minute: Int) {
        parseTime(wakingTime, defaultHour: 7, defaultMinute: 0)
    }
    
    public var sleepingComponents: (hour: Int, minute: Int) {
        parseTime(sleepingTime, defaultHour: 22, defaultMinute: 0)
    }
    
    private func parseTime(_ timeStr: String, defaultHour: Int, defaultMinute: Int) -> (hour: Int, minute: Int) {
        let parts = timeStr.split(separator: ":")
        guard parts.count == 2,
              let h = Int(parts[0]),
              let m = Int(parts[1]) else {
            return (defaultHour, defaultMinute)
        }
        return (h, m)
    }
}
