import Foundation

public struct User: Codable, Identifiable, Hashable {
    public var id: String
    public var name: String
    public var email: String
    public var timezone: String
    public var createdAt: Date
    
    public init(
        id: String = UUID().uuidString,
        name: String,
        email: String,
        timezone: String = TimeZone.current.identifier,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.email = email
        self.timezone = timezone
        self.createdAt = createdAt
    }
}

public struct AuthResponse: Codable {
    public var user: User
    public var token: String
}
