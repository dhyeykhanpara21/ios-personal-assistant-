import XCTest
@testable import SiriLife

final class APIClientTests: XCTestCase {
    
    func testTaskSerializationAndDeserialization() throws {
        let task = TaskItem(
            title: "Unit Test Task",
            description: "Testing Codable compliance",
            dueAt: Date(),
            priority: .high,
            category: .work,
            recurrenceRule: .daily,
            subtasks: [SubTask(title: "Sub 1", isCompleted: true)]
        )
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(task)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let decoded = try decoder.decode(TaskItem.self, from: data)
        
        XCTAssertEqual(task.id, decoded.id)
        XCTAssertEqual(task.title, decoded.title)
        XCTAssertEqual(task.priority, decoded.priority)
        XCTAssertEqual(task.category, decoded.category)
        XCTAssertEqual(task.subtasks.count, decoded.subtasks.count)
        XCTAssertTrue(decoded.subtasks[0].isCompleted)
    }
    
    func testReminderSerialization() throws {
        let reminder = ReminderItem(
            title: "Call Friend",
            scheduledAt: Date(),
            recurrenceRule: .weekly,
            category: .personal,
            priority: .low
        )
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(reminder)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let decoded = try decoder.decode(ReminderItem.self, from: data)
        
        XCTAssertEqual(reminder.id, decoded.id)
        XCTAssertEqual(reminder.title, decoded.title)
        XCTAssertEqual(reminder.recurrenceRule, decoded.recurrenceRule)
    }
}
