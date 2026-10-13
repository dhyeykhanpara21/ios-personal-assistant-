import Foundation

public struct HydrationLog: Codable, Identifiable, Hashable {
    public var id: String
    public var userId: String
    public var amountMl: Int
    public var loggedAt: Date
    
    public init(
        id: String = UUID().uuidString,
        userId: String = "",
        amountMl: Int,
        loggedAt: Date = Date()
    ) {
        self.id = id
        self.userId = userId
        self.amountMl = amountMl
        self.loggedAt = loggedAt
    }
    
    public var formattedTime: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: loggedAt)
    }
}

public struct DailyHydrationSummary: Codable {
    public var totalMl: Int
    public var dailyGoalMl: Int
    public var remainingMl: Int
    public var progressPercentage: Double
    public var logs: [HydrationLog]
    
    public init(
        totalMl: Int = 0,
        dailyGoalMl: Int = 2000,
        remainingMl: Int = 2000,
        progressPercentage: Double = 0.0,
        logs: [HydrationLog] = []
    ) {
        self.totalMl = totalMl
        self.dailyGoalMl = dailyGoalMl
        self.remainingMl = remainingMl
        self.progressPercentage = progressPercentage
        self.logs = logs
    }
}
