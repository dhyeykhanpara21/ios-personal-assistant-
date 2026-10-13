import XCTest
@testable import SiriLife

final class TaskTests: XCTestCase {
    
    func testTaskInitializationAndDefaults() {
        let task = TaskItem(title: "Complete Luphonix Architecture")
        XCTAssertFalse(task.isCompleted)
        XCTAssertEqual(task.priority, .medium)
        XCTAssertEqual(task.category, .other)
        XCTAssertEqual(task.recurrenceRule, .none)
        XCTAssertTrue(task.subtasks.isEmpty)
    }
    
    func testTaskOverdueCalculation() {
        let pastDate = Date().addingTimeInterval(-3600) // 1 hour ago
        let futureDate = Date().addingTimeInterval(3600) // 1 hour later
        
        let overdueTask = TaskItem(title: "Submit report", dueAt: pastDate, isCompleted: false)
        XCTAssertTrue(overdueTask.isOverdue)
        
        let completedPastTask = TaskItem(title: "Old finished task", dueAt: pastDate, isCompleted: true)
        XCTAssertFalse(completedPastTask.isOverdue)
        
        let futureTask = TaskItem(title: "Upcoming task", dueAt: futureDate, isCompleted: false)
        XCTAssertFalse(futureTask.isOverdue)
    }
    
    func testTaskDueTodayCalculation() {
        let now = Date()
        let todayTask = TaskItem(title: "Call dentist", dueAt: now)
        XCTAssertTrue(todayTask.isDueToday)
        
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: now)!
        let tomorrowTask = TaskItem(title: "Grocery run", dueAt: tomorrow)
        XCTAssertFalse(tomorrowTask.isDueToday)
    }
    
    func testSubtaskManagement() {
        let sub1 = SubTask(title: "Install Turso libSQL")
        let sub2 = SubTask(title: "Write App Intents")
        
        var task = TaskItem(title: "Build Luphonix", subtasks: [sub1, sub2])
        XCTAssertEqual(task.subtasks.count, 2)
        XCTAssertFalse(task.subtasks[0].isCompleted)
        
        task.subtasks[0].isCompleted = true
        XCTAssertTrue(task.subtasks[0].isCompleted)
    }
    
    func testPriorityOrdering() {
        let high = Priority.high
        let medium = Priority.medium
        let low = Priority.low
        
        XCTAssertGreaterThan(high.sortOrder, medium.sortOrder)
        XCTAssertGreaterThan(medium.sortOrder, low.sortOrder)
    }
}
