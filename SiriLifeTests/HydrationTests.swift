import XCTest
@testable import SiriLife

final class HydrationTests: XCTestCase {
    
    func testDailyHydrationSummaryCalculations() {
        let goal = 2000
        let log1 = HydrationLog(amountMl: 250)
        let log2 = HydrationLog(amountMl: 500)
        let total = log1.amountMl + log2.amountMl
        
        let remaining = max(0, goal - total)
        let progress = Double(total) / Double(goal)
        
        let summary = DailyHydrationSummary(
            totalMl: total,
            dailyGoalMl: goal,
            remainingMl: remaining,
            progressPercentage: progress,
            logs: [log1, log2]
        )
        
        XCTAssertEqual(summary.totalMl, 750)
        XCTAssertEqual(summary.remainingMl, 1250)
        XCTAssertEqual(summary.progressPercentage, 0.375, accuracy: 0.001)
    }
    
    func testWakingAndSleepingTimeParsing() {
        let prefs = UserPreferences(
            dailyWaterGoalMl: 2500,
            waterReminderIntervalMinutes: 45,
            wakingTime: "06:30",
            sleepingTime: "23:15"
        )
        
        XCTAssertEqual(prefs.wakingComponents.hour, 6)
        XCTAssertEqual(prefs.wakingComponents.minute, 30)
        
        XCTAssertEqual(prefs.sleepingComponents.hour, 23)
        XCTAssertEqual(prefs.sleepingComponents.minute, 15)
    }
}
