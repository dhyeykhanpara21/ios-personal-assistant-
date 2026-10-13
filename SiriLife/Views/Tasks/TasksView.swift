import SwiftUI

public struct TasksView: View {
    @StateObject private var viewModel = TaskViewModel()
    @State private var showingCreateSheet: Bool = false
    @State private var editingTask: TaskItem? = nil
    
    // New Task Form State
    @State private var newTitle: String = ""
    @State private var newDescription: String = ""
    @State private var newDueAt: Date = Date()
    @State private var hasDueDate: Bool = true
    @State private var newPriority: Priority = .medium
    @State private var newCategory: ItemCategory = .personal
    @State private var newRecurrence: RecurrenceRule = .none
    @State private var newSubtaskText: String = ""
    @State private var subtasks: [SubTask] = []
    
    public init() {}
    
    public var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Filter Segmented Picker
                filterPickerSection
                
                // Search Bar
                searchBarSection
                
                // Tasks List
                if viewModel.filteredTasks.isEmpty {
                    EmptyStateView(
                        iconName: "checklist",
                        title: "No \(viewModel.selectedFilter.rawValue) Tasks",
                        description: "You're all caught up! Tap the + button to create a new task.",
                        buttonTitle: "Create Task",
                        action: { resetForm(); showingCreateSheet = true }
                    )
                    .frame(maxHeight: .infinity)
                } else {
                    List {
                        ForEach(viewModel.filteredTasks) { task in
                            TaskRowView(
                                task: task,
                                onToggleComplete: {
                                    viewModel.toggleTaskCompletion(task)
                                },
                                onConvertReminder: {
                                    viewModel.convertTaskToReminder(task)
                                },
                                onDelete: {
                                    viewModel.deleteTask(task)
                                }
                            )
                            .contentShape(Rectangle())
                            .onTapGesture {
                                editingTask = task
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Tasks")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Picker("Sort By", selection: $viewModel.selectedSort) {
                            ForEach(TaskSort.allCases) { sort in
                                Text(sort.rawValue).tag(sort)
                            }
                        }
                    } label: {
                        Image(systemName: "arrow.up.arrow.down")
                            .font(.system(size: 14, weight: .semibold))
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        resetForm()
                        showingCreateSheet = true
                    }) {
                        Image(systemName: "plus")
                            .font(.system(size: 16, weight: .bold))
                    }
                }
            }
            .sheet(isPresented: $showingCreateSheet) {
                createTaskSheet
            }
            .sheet(item: $editingTask) { task in
                editTaskSheet(task: task)
            }
            .refreshable {
                viewModel.loadTasks()
            }
        }
    }
    
    // MARK: - Filter Picker
    private var filterPickerSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(TaskFilter.allCases) { filter in
                    Button(action: {
                        HapticFeedback.shared.selection()
                        viewModel.selectedFilter = filter
                    }) {
                        Text(filter.rawValue)
                            .font(.subheadline)
                            .fontWeight(viewModel.selectedFilter == filter ? .bold : .medium)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                viewModel.selectedFilter == filter
                                    ? Color.blue
                                    : Color(.secondarySystemBackground)
                            )
                            .foregroundColor(
                                viewModel.selectedFilter == filter ? .white : .primary
                            )
                            .clipShape(Capsule())
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
    }
    
    // MARK: - Search Bar
    private var searchBarSection: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            TextField("Search tasks...", text: $viewModel.searchQuery)
            if !viewModel.searchQuery.isEmpty {
                Button(action: { viewModel.searchQuery = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(8)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
        .padding(.horizontal, 16)
        .padding(.bottom, 6)
    }
    
    // MARK: - Create Task Sheet
    private var createTaskSheet: some View {
        NavigationStack {
            Form {
                Section(header: Text("Task Overview")) {
                    TextField("Title", text: $newTitle)
                    TextField("Description (optional)", text: $newDescription)
                }
                
                Section(header: Text("Date & Recurrence")) {
                    Toggle("Due Date", isOn: $hasDueDate)
                    if hasDueDate {
                        DatePicker("Due Time", selection: $newDueAt)
                    }
                    Picker("Repeat", selection: $newRecurrence) {
                        ForEach(RecurrenceRule.allCases) { rule in
                            Text(rule.displayName).tag(rule)
                        }
                    }
                }
                
                Section(header: Text("Details")) {
                    Picker("Priority", selection: $newPriority) {
                        ForEach(Priority.allCases) { p in
                            Label(p.displayName, systemImage: p.iconName).tag(p)
                        }
                    }
                    
                    Picker("Category", selection: $newCategory) {
                        ForEach(ItemCategory.allCases) { c in
                            Label(c.displayName, systemImage: c.iconName).tag(c)
                        }
                    }
                }
                
                Section(header: Text("Subtasks")) {
                    HStack {
                        TextField("New subtask", text: $newSubtaskText)
                        Button(action: {
                            if !newSubtaskText.trimmingCharacters(in: .whitespaces).isEmpty {
                                subtasks.append(SubTask(title: newSubtaskText.trimmingCharacters(in: .whitespaces)))
                                newSubtaskText = ""
                            }
                        }) {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.blue)
                        }
                        .disabled(newSubtaskText.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                    
                    ForEach(subtasks) { sub in
                        HStack {
                            Image(systemName: "circle")
                                .foregroundColor(.secondary)
                            Text(sub.title)
                        }
                    }
                    .onDelete { indices in
                        subtasks.remove(atOffsets: indices)
                    }
                }
            }
            .navigationTitle("New Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showingCreateSheet = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        viewModel.createTask(
                            title: newTitle,
                            description: newDescription.isEmpty ? nil : newDescription,
                            dueAt: hasDueDate ? newDueAt : nil,
                            priority: newPriority,
                            category: newCategory,
                            recurrenceRule: newRecurrence,
                            subtasks: subtasks
                        )
                        showingCreateSheet = false
                    }
                    .disabled(newTitle.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
    
    // MARK: - Edit Task Sheet
    private func editTaskSheet(task: TaskItem) -> some View {
        var copy = task
        return NavigationStack {
            Form {
                Section(header: Text("Task Overview")) {
                    TextField("Title", text: Binding(get: { copy.title }, set: { copy.title = $0 }))
                    TextField("Description", text: Binding(get: { copy.description ?? "" }, set: { copy.description = $0.isEmpty ? nil : $0 }))
                }
                
                Section(header: Text("Scheduling")) {
                    if copy.dueAt != nil {
                        DatePicker("Due Date", selection: Binding(
                            get: { copy.dueAt ?? Date() },
                            set: { copy.dueAt = $0 }
                        ))
                    }
                    Picker("Priority", selection: Binding(get: { copy.priority }, set: { copy.priority = $0 })) {
                        ForEach(Priority.allCases) { p in
                            Text(p.displayName).tag(p)
                        }
                    }
                    Picker("Category", selection: Binding(get: { copy.category }, set: { copy.category = $0 })) {
                        ForEach(ItemCategory.allCases) { c in
                            Text(c.displayName).tag(c)
                        }
                    }
                }
                
                Section {
                    Button(role: .destructive, action: {
                        viewModel.deleteTask(copy)
                        editingTask = nil
                    }) {
                        Label("Delete Task", systemImage: "trash")
                    }
                }
            }
            .navigationTitle("Edit Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { editingTask = nil }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Update") {
                        viewModel.updateTask(copy)
                        editingTask = nil
                    }
                }
            }
        }
    }
    
    private func resetForm() {
        newTitle = ""
        newDescription = ""
        newDueAt = Date()
        hasDueDate = true
        newPriority = .medium
        newCategory = .personal
        newRecurrence = .none
        newSubtaskText = ""
        subtasks = []
    }
}
