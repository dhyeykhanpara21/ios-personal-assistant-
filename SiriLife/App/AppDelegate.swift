import UIKit
import UserNotifications

public class AppDelegate: NSObject, UIApplicationDelegate {
    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
    ) -> Bool {
        // Configure UNUserNotificationCenter delegate and categories
        _ = NotificationManager.shared
        
        // Reconcile pending notifications on boot
        NotificationManager.shared.reconcileAllNotifications()
        HydrationScheduler.shared.rescheduleHydrationReminders()
        
        return true
    }
    
    public func applicationDidBecomeActive(_ application: UIApplication) {
        // Re-check notifications status and reconcile if date changed
        NotificationManager.shared.reconcileAllNotifications()
    }
}
