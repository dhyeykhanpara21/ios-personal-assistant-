import SwiftUI

public struct RootView: View {
    @ObservedObject private var authManager = AuthManager.shared
    @State private var selectedTab: Int = 0
    
    public init() {}
    
    public var body: some View {
        Group {
            if authManager.isAuthenticated {
                mainTabView
            } else {
                AuthView()
            }
        }
    }
    
    private var mainTabView: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
            
            TasksView()
                .tabItem {
                    Label("Tasks", systemImage: "checklist")
                }
                .tag(1)
            
            RemindersView()
                .tabItem {
                    Label("Reminders", systemImage: "bell.badge.fill")
                }
                .tag(2)
            
            HydrationView()
                .tabItem {
                    Label("Hydration", systemImage: "drop.fill")
                }
                .tag(3)
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(4)
        }
        .tint(.blue)
    }
}
