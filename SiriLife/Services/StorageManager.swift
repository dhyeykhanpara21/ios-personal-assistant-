import Foundation

public final class StorageManager {
    public static let shared = StorageManager()
    
    public static let appGroupSuiteName = "group.com.luphonix.app"
    private let defaults: UserDefaults
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    
    private let tasksKey = "luphonix_tasks_cache"
    private let remindersKey = "luphonix_reminders_cache"
    private let hydrationKey = "luphonix_hydration_cache"
    private let preferencesKey = "luphonix_preferences_cache"
    private let userKey = "luphonix_user_cache"
    private let tokenKey = "luphonix_auth_token"
    private let hydrationPausedKey = "luphonix_hydration_paused"
    
    public init() {
        if let sharedDefaults = UserDefaults(suiteName: StorageManager.appGroupSuiteName) {
            self.defaults = sharedDefaults
        } else {
            self.defaults = UserDefaults.standard
        }
        
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
        
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
    }
    
    // MARK: - Auth Token
    public func saveAuthToken(_ token: String?) {
        if let token = token {
            defaults.set(token, forKey: tokenKey)
        } else {
            defaults.removeObject(forKey: tokenKey)
        }
    }
    
    public func getAuthToken() -> String? {
        defaults.string(forKey: tokenKey)
    }
    
    // MARK: - User
    public func saveUser(_ user: User?) {
        guard let user = user else {
            defaults.removeObject(forKey: userKey)
            return
        }
        if let data = try? encoder.encode(user) {
            defaults.set(data, forKey: userKey)
        }
    }
    
    public func getUser() -> User? {
        guard let data = defaults.data(forKey: userKey),
              let user = try? decoder.decode(User.self, from: data) else {
            return nil
        }
        return user
    }
    
    // MARK: - Tasks
    public func saveTasks(_ tasks: [TaskItem]) {
        if let data = try? encoder.encode(tasks) {
            defaults.set(data, forKey: tasksKey)
        }
    }
    
    public func getTasks() -> [TaskItem] {
        guard let data = defaults.data(forKey: tasksKey),
              let tasks = try? decoder.decode([TaskItem].self, from: data) else {
            return []
        }
        return tasks
    }
    
    public func addTask(_ task: TaskItem) {
        var tasks = getTasks()
        tasks.removeAll(where: { $0.id == task.id })
        tasks.insert(task, at: 0)
        saveTasks(tasks)
    }
    
    public func updateTask(_ task: TaskItem) {
        var tasks = getTasks()
        if let index = tasks.firstIndex(where: { $0.id == task.id }) {
            tasks[index] = task
            saveTasks(tasks)
        } else {
            addTask(task)
        }
    }
    
    public func deleteTask(id: String) {
        var tasks = getTasks()
        tasks.removeAll(where: { $0.id == id })
        saveTasks(tasks)
    }
    
    // MARK: - Reminders
    public func saveReminders(_ reminders: [ReminderItem]) {
        if let data = try? encoder.encode(reminders) {
            defaults.set(data, forKey: remindersKey)
        }
    }
    
    public func getReminders() -> [ReminderItem] {
        guard let data = defaults.data(forKey: remindersKey),
              let reminders = try? decoder.decode([ReminderItem].self, from: data) else {
            return []
        }
        return reminders
    }
    
    public func addReminder(_ reminder: ReminderItem) {
        var reminders = getReminders()
        reminders.removeAll(where: { $0.id == reminder.id })
        reminders.insert(reminder, at: 0)
        saveReminders(reminders)
    }
    
    public func updateReminder(_ reminder: ReminderItem) {
        var reminders = getReminders()
        if let index = reminders.firstIndex(where: { $0.id == reminder.id }) {
            reminders[index] = reminder
            saveReminders(reminders)
        } else {
            addReminder(reminder)
        }
    }
    
    public func deleteReminder(id: String) {
        var reminders = getReminders()
        reminders.removeAll(where: { $0.id == id })
        saveReminders(reminders)
    }
    
    // MARK: - Hydration
    public func saveHydrationLogs(_ logs: [HydrationLog]) {
        if let data = try? encoder.encode(logs) {
            defaults.set(data, forKey: hydrationKey)
        }
    }
    
    public func getHydrationLogs() -> [HydrationLog] {
        guard let data = defaults.data(forKey: hydrationKey),
              let logs = try? decoder.decode([HydrationLog].self, from: data) else {
            return []
        }
        return logs
    }
    
    public func addHydrationLog(_ log: HydrationLog) {
        var logs = getHydrationLogs()
        logs.insert(log, at: 0)
        saveHydrationLogs(logs)
    }
    
    public func getTodayHydrationTotal() -> Int {
        let calendar = Calendar.current
        let todayLogs = getHydrationLogs().filter { calendar.isDateInToday($0.loggedAt) }
        return todayLogs.reduce(0) { $0 + $1.amountMl }
    }
    
    public var isHydrationPaused: Bool {
        get { defaults.bool(forKey: hydrationPausedKey) }
        set { defaults.set(newValue, forKey: hydrationPausedKey) }
    }
    
    // MARK: - Preferences
    public func savePreferences(_ preferences: UserPreferences) {
        if let data = try? encoder.encode(preferences) {
            defaults.set(data, forKey: preferencesKey)
        }
    }
    
    public func getPreferences() -> UserPreferences {
        guard let data = defaults.data(forKey: preferencesKey),
              let prefs = try? decoder.decode(UserPreferences.self, from: data) else {
            return UserPreferences.default
        }
        return prefs
    }
    
    // MARK: - Clear All Cache (Logout)
    public func clearAll() {
        defaults.removeObject(forKey: tasksKey)
        defaults.removeObject(forKey: remindersKey)
        defaults.removeObject(forKey: hydrationKey)
        defaults.removeObject(forKey: preferencesKey)
        defaults.removeObject(forKey: userKey)
        defaults.removeObject(forKey: tokenKey)
        defaults.removeObject(forKey: hydrationPausedKey)
    }
}
