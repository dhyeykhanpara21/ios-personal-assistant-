import XCTest
@testable import SiriLife

final class ReminderTests: XCTestCase {
    
    func testRecurrenceDailyCalculation() {
        let calendar = Calendar.current
        let baseDate = Date()
        let daily = RecurrenceRule.daily
        
        let next = daily.nextDate(after: baseDate)
        XCTAssertNotNil(next)
        
        let diff = calendar.dateComponents([.day], from: baseDate, to: next!)
        XCTAssertEqual(diff.day, 1)
    }
    
    func testRecurrenceWeeklyCalculation() {
        let calendar = Calendar.current
        let baseDate = Date()
        let weekly = RecurrenceRule.weekly
        
        let next = weekly.nextDate(after: baseDate)
        XCTAssertNotNil(next)
        
        let diff = calendar.dateComponents([.day], from: baseDate, to: next!)
        XCTAssertEqual(diff.day, 7)
    }
    
    func testRecurrenceNoneReturnsNil() {
        let baseDate = Date()
        let none = RecurrenceRule.none
        XCTAssertNil(none.nextDate(after: baseDate))
    }
    
    func testSnoozeEffectiveDateCalculation() {
        let originalDate = Date().addingTimeInterval(3600)
        var reminder = ReminderItem(title: "Medicine", scheduledAt: originalDate)
        
        XCTAssertEqual(reminder.effectiveScheduledDate, originalDate)
        
        let snoozeTarget = Date().addingTimeInterval(5400)
        reminder.snoozedUntil = snoozeTarget
        XCTAssertEqual(reminder.effectiveScheduledDate, snoozeTarget)
    }
    
    func testReminderFormatting() {
        let todayDate = Date()
        let reminder = ReminderItem(title: "Drink Water", scheduledAt: todayDate)
        XCTAssertTrue(reminder.formattedScheduledTime.contains("Today at"))
    }
}
