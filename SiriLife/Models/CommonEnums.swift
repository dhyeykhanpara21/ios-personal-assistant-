import Foundation
import SwiftUI

// MARK: - Priority
public enum Priority: String, Codable, CaseIterable, Identifiable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    
    public var id: String { rawValue }
    
    public var displayName: String {
        switch self {
        case .low: return "Low"
        case .medium: return "Medium"
        case .high: return "High"
        }
    }
    
    public var color: Color {
        switch self {
        case .low: return .blue
        case .medium: return .orange
        case .high: return .red
        }
    }
    
    public var iconName: String {
        switch self {
        case .low: return "arrow.down.circle"
        case .medium: return "minus.circle"
        case .high: return "exclamationmark.triangle.fill"
        }
    }
    
    public var sortOrder: Int {
        switch self {
        case .high: return 3
        case .medium: return 2
        case .low: return 1
        }
    }
}

// MARK: - Category
public enum ItemCategory: String, Codable, CaseIterable, Identifiable {
    case personal = "personal"
    case work = "work"
    case study = "study"
    case health = "health"
    case other = "other"
    
    public var id: String { rawValue }
    
    public var displayName: String {
        switch self {
        case .personal: return "Personal"
        case .work: return "Work"
        case .study: return "Study"
        case .health: return "Health"
        case .other: return "Other"
        }
    }
    
    public var iconName: String {
        switch self {
        case .personal: return "person.crop.circle"
        case .work: return "briefcase.fill"
        case .study: return "book.closed.fill"
        case .health: return "heart.fill"
        case .other: return "tag.fill"
        }
    }
    
    public var color: Color {
        switch self {
        case .personal: return .purple
        case .work: return .blue
        case .study: return .green
        case .health: return .red
        case .other: return .gray
        }
    }
}

// MARK: - RecurrenceRule
public enum RecurrenceRule: String, Codable, CaseIterable, Identifiable {
    case none = "none"
    case daily = "daily"
    case weekly = "weekly"
    case weekdays = "weekdays"
    case hourly = "hourly"
    
    public var id: String { rawValue }
    
    public var displayName: String {
        switch self {
        case .none: return "Never"
        case .daily: return "Daily"
        case .weekly: return "Weekly"
        case .weekdays: return "Every Weekday"
        case .hourly: return "Every Hour"
        }
    }
    
    public var iconName: String {
        switch self {
        case .none: return "xmark"
        case .daily: return "repeat"
        case .weekly: return "calendar.badge.clock"
        case .weekdays: return "briefcase"
        case .hourly: return "clock.arrow.circlepath"
        }
    }
    
    /// Calculate the next scheduled date based on recurrence
    public func nextDate(after date: Date) -> Date? {
        let calendar = Calendar.current
        switch self {
        case .none:
            return nil
        case .hourly:
            return calendar.date(byAdding: .hour, value: 1, to: date)
        case .daily:
            return calendar.date(byAdding: .day, value: 1, to: date)
        case .weekly:
            return calendar.date(byAdding: .weekOfYear, value: 1, to: date)
        case .weekdays:
            var next = calendar.date(byAdding: .day, value: 1, to: date) ?? date
            while calendar.isDateInWeekend(next) {
                next = calendar.date(byAdding: .day, value: 1, to: next) ?? next
            }
            return next
        }
    }
}

// MARK: - TaskFilter
public enum TaskFilter: String, CaseIterable, Identifiable {
    case today = "Today"
    case upcoming = "Upcoming"
    case overdue = "Overdue"
    case completed = "Completed"
    
    public var id: String { rawValue }
}

// MARK: - TaskSort
public enum TaskSort: String, CaseIterable, Identifiable {
    case dueTime = "Due Date"
    case priority = "Priority"
    case createdDate = "Created"
    case title = "Title"
    
    public var id: String { rawValue }
}
