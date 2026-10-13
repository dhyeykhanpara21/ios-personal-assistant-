import Foundation
import Combine
import SwiftUI
import UserNotifications

@MainActor
public final class SettingsViewModel: ObservableObject {
    @Published public var preferences: UserPreferences = UserPreferences.default
    @Published public var notificationStatus: UNAuthorizationStatus = .notDetermined
    @Published public var selectedTheme: String = "system" // system, light, dark
    @Published public var isExporting: Bool = false
    @Published public var exportedDataString: String? = nil
    @Published public var isShowingExportSheet: Bool = false
    @Published public var isShowingDeleteConfirm: Bool = false
    @Published public var isSaving: Bool = false
    
    public init() {
        loadSettings()
        checkNotificationStatus()
    }
    
    public func loadSettings() {
        preferences = StorageManager.shared.getPreferences()
        
        Task {
            if let remotePrefs = try? await APIClient.shared.fetchPreferences() {
                self.preferences = remotePrefs
            }
        }
    }
    
    public func checkNotificationStatus() {
        Task {
            let status = await NotificationManager.shared.checkAuthorizationStatus()
            self.notificationStatus = status
        }
    }
    
    public func requestNotificationPermission() {
        Task {
            _ = await NotificationManager.shared.requestAuthorization()
            checkNotificationStatus()
            NotificationManager.shared.reconcileAllNotifications()
            HydrationScheduler.shared.rescheduleHydrationReminders()
        }
    }
    
    public func savePreferences() {
        isSaving = true
        preferences.updatedAt = Date()
        StorageManager.shared.savePreferences(preferences)
        
        // Reschedule hydration and reminders according to updated preferences
        HydrationScheduler.shared.rescheduleHydrationReminders()
        NotificationManager.shared.reconcileAllNotifications()
        HapticFeedback.shared.notification(.success)
        
        Task {
            _ = try? await APIClient.shared.updatePreferences(preferences)
            self.isSaving = false
        }
    }
    
    public func exportData() {
        isExporting = true
        Task {
            defer { self.isExporting = false }
            do {
                let json = try await APIClient.shared.exportUserData()
                self.exportedDataString = json
                self.isShowingExportSheet = true
                HapticFeedback.shared.notification(.success)
            } catch {
                // Local export fallback
                let encoder = JSONEncoder()
                encoder.outputFormatting = .prettyPrinted
                encoder.dateEncodingStrategy = .iso8601
                
                let localPayload: [String: Any] = [
                    "user": (try? encoder.encode(StorageManager.shared.getUser())) ?? Data(),
                    "tasks": (try? encoder.encode(StorageManager.shared.getTasks())) ?? Data(),
                    "reminders": (try? encoder.encode(StorageManager.shared.getReminders())) ?? Data(),
                    "hydration_logs": (try? encoder.encode(StorageManager.shared.getHydrationLogs())) ?? Data(),
                    "preferences": (try? encoder.encode(StorageManager.shared.getPreferences())) ?? Data()
                ]
                self.exportedDataString = "{\"status\": \"local_export\", \"timestamp\": \"\(Date())\"}"
                self.isShowingExportSheet = true
            }
        }
    }
    
    public func deleteAccount() {
        Task {
            _ = try? await APIClient.shared.deleteAccount()
            NotificationManager.shared.cancelReminderNotification(id: "all")
            HydrationScheduler.shared.cancelAllHydrationReminders()
            AuthManager.shared.logout()
        }
    }
}
