import Foundation

public struct ReminderItem: Codable, Identifiable, Hashable {
    public var id: String
    public var userId: String
    public var title: String
    public var description: String?
    public var scheduledAt: Date
    public var recurrenceRule: RecurrenceRule
    public var category: ItemCategory
    public var priority: Priority
    public var isEnabled: Bool
    public var isCompleted: Bool
    public var snoozedUntil: Date?
    public var createdAt: Date
    public var updatedAt: Date
    
    public init(
        id: String = UUID().uuidString,
        userId: String = "",
        title: String,
        description: String? = nil,
        scheduledAt: Date,
        recurrenceRule: RecurrenceRule = .none,
        category: ItemCategory = .other,
        priority: Priority = .medium,
        isEnabled: Bool = true,
        isCompleted: Bool = false,
        snoozedUntil: Date? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.userId = userId
        self.title = title
        self.description = description
        self.scheduledAt = scheduledAt
        self.recurrenceRule = recurrenceRule
        self.category = category
        self.priority = priority
        self.isEnabled = isEnabled
        self.isCompleted = isCompleted
        self.snoozedUntil = snoozedUntil
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    public var effectiveScheduledDate: Date {
        if let snoozedUntil = snoozedUntil, snoozedUntil > Date() {
            return snoozedUntil
        }
        return scheduledAt
    }
    
    public var isScheduledToday: Bool {
        Calendar.current.isDateInToday(effectiveScheduledDate)
    }
    
    public var formattedScheduledTime: String {
        let formatter = DateFormatter()
        let target = effectiveScheduledDate
        if Calendar.current.isDateInToday(target) {
            formatter.dateFormat = "'Today at' h:mm a"
        } else if Calendar.current.isDateInTomorrow(target) {
            formatter.dateFormat = "'Tomorrow at' h:mm a"
        } else {
            formatter.dateFormat = "MMM d, h:mm a"
        }
        return formatter.string(from: target)
    }
}
