import Foundation
import Combine
import SwiftUI

@MainActor
public final class TaskViewModel: ObservableObject {
    @Published public var tasks: [TaskItem] = []
    @Published public var selectedFilter: TaskFilter = .today
    @Published public var selectedSort: TaskSort = .dueTime
    @Published public var searchQuery: String = ""
    @Published public var isLoading: Bool = false
    @Published public var errorMessage: String? = nil
    
    public init() {
        loadTasks()
    }
    
    public func loadTasks() {
        tasks = StorageManager.shared.getTasks()
        
        Task {
            isLoading = true
            defer { isLoading = false }
            do {
                let fetched = try await APIClient.shared.fetchTasks()
                self.tasks = fetched
            } catch {
                self.errorMessage = error.localizedDescription
            }
        }
    }
    
    // MARK: - Filtered & Sorted Tasks
    public var filteredTasks: [TaskItem] {
        var result = tasks
        
        // 1. Search filter
        if !searchQuery.trimmingCharacters(in: .whitespaces).isEmpty {
            let q = searchQuery.lowercased()
            result = result.filter {
                $0.title.lowercased().contains(q) ||
                ($0.description?.lowercased().contains(q) ?? false)
            }
        }
        
        // 2. Status / Time filter
        switch selectedFilter {
        case .today:
            result = result.filter { $0.isDueToday && !$0.isCompleted }
        case .upcoming:
            result = result.filter {
                guard let due = $0.dueAt else { return false }
                return due > Date() && !$0.isDueToday && !$0.isCompleted
            }
        case .overdue:
            result = result.filter { $0.isOverdue }
        case .completed:
            result = result.filter { $0.isCompleted }
        }
        
        // 3. Sorting
        switch selectedSort {
        case .dueTime:
            result.sort {
                guard let d1 = $0.dueAt else { return false }
                guard let d2 = $1.dueAt else { return true }
                return d1 < d2
            }
        case .priority:
            result.sort { $0.priority.sortOrder > $1.priority.sortOrder }
        case .createdDate:
            result.sort { $0.createdAt > $1.createdAt }
        case .title:
            result.sort { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
        }
        
        return result
    }
    
    // MARK: - Task Actions
    public func createTask(
        title: String,
        description: String? = nil,
        dueAt: Date? = nil,
        priority: Priority = .medium,
        category: ItemCategory = .personal,
        recurrenceRule: RecurrenceRule = .none,
        subtasks: [SubTask] = []
    ) {
        guard !title.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        let newTask = TaskItem(
            title: title.trimmingCharacters(in: .whitespaces),
            description: description,
            dueAt: dueAt,
            priority: priority,
            category: category,
            recurrenceRule: recurrenceRule,
            subtasks: subtasks
        )
        
        tasks.insert(newTask, at: 0)
        StorageManager.shared.saveTasks(tasks)
        HapticFeedback.shared.notification(.success)
        
        Task {
            _ = try? await APIClient.shared.createTask(newTask)
        }
    }
    
    public func toggleTaskCompletion(_ task: TaskItem) {
        guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
        tasks[index].isCompleted.toggle()
        tasks[index].updatedAt = Date()
        
        let updated = tasks[index]
        StorageManager.shared.saveTasks(tasks)
        HapticFeedback.shared.impact(.medium)
        
        Task {
            _ = try? await APIClient.shared.updateTask(updated)
        }
    }
    
    public func updateTask(_ task: TaskItem) {
        guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
        tasks[index] = task
        tasks[index].updatedAt = Date()
        
        StorageManager.shared.saveTasks(tasks)
        HapticFeedback.shared.impact(.light)
        
        Task {
            _ = try? await APIClient.shared.updateTask(task)
        }
    }
    
    public func deleteTask(_ task: TaskItem) {
        tasks.removeAll(where: { $0.id == task.id })
        StorageManager.shared.saveTasks(tasks)
        HapticFeedback.shared.impact(.heavy)
        
        Task {
            _ = try? await APIClient.shared.deleteTask(id: task.id)
        }
    }
    
    public func convertTaskToReminder(_ task: TaskItem) {
        let scheduled = task.dueAt ?? Date().addingTimeInterval(3600)
        let reminder = ReminderItem(
            title: task.title,
            description: task.description,
            scheduledAt: scheduled,
            recurrenceRule: task.recurrenceRule,
            category: task.category,
            priority: task.priority
        )
        
        StorageManager.shared.addReminder(reminder)
        NotificationManager.shared.scheduleReminderNotification(for: reminder)
        HapticFeedback.shared.notification(.success)
        
        Task {
            _ = try? await APIClient.shared.createReminder(reminder)
        }
    }
}
