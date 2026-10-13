import SwiftUI

public struct RemindersView: View {
    @StateObject private var viewModel = ReminderViewModel()
    @State private var showingCreateSheet: Bool = false
    
    // New Reminder Form State
    @State private var newTitle: String = ""
    @State private var newDescription: String = ""
    @State private var newScheduledAt: Date = Date().addingTimeInterval(3600)
    @State private var newRecurrence: RecurrenceRule = .none
    @State private var newCategory: ItemCategory = .other
    @State private var newPriority: Priority = .medium
    
    public init() {}
    
    public var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category Filter Pills
                categoryFilterSection
                
                // Reminders List
                if viewModel.filteredReminders.isEmpty {
                    EmptyStateView(
                        iconName: "bell.badge",
                        title: "No Reminders Found",
                        description: "Schedule reminders for studying, drinking water, calling friends, or taking medicine.",
                        buttonTitle: "Add Reminder",
                        action: { resetForm(); showingCreateSheet = true }
                    )
                    .frame(maxHeight: .infinity)
                } else {
                    List {
                        ForEach(viewModel.filteredReminders) { reminder in
                            ReminderRowView(
                                reminder: reminder,
                                onToggleEnabled: {
                                    viewModel.toggleReminderEnabled(reminder)
                                },
                                onComplete: {
                                    viewModel.completeReminder(reminder)
                                },
                                onSnooze: {
                                    viewModel.snoozeReminder(reminder, minutes: 15)
                                },
                                onDelete: {
                                    viewModel.deleteReminder(reminder)
                                }
                            )
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Reminders")
            .toolbar {
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
                createReminderSheet
            }
            .refreshable {
                viewModel.loadReminders()
            }
        }
    }
    
    // MARK: - Category Filter Pills
    private var categoryFilterSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                Button(action: {
                    HapticFeedback.shared.selection()
                    viewModel.selectedCategory = nil
                }) {
                    Text("All")
                        .font(.subheadline)
                        .fontWeight(viewModel.selectedCategory == nil ? .bold : .medium)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            viewModel.selectedCategory == nil ? Color.blue : Color(.secondarySystemBackground)
                        )
                        .foregroundColor(viewModel.selectedCategory == nil ? .white : .primary)
                        .clipShape(Capsule())
                }
                
                ForEach(ItemCategory.allCases) { cat in
                    Button(action: {
                        HapticFeedback.shared.selection()
                        viewModel.selectedCategory = cat
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: cat.iconName)
                            Text(cat.displayName)
                        }
                        .font(.subheadline)
                        .fontWeight(viewModel.selectedCategory == cat ? .bold : .medium)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            viewModel.selectedCategory == cat ? cat.color : Color(.secondarySystemBackground)
                        )
                        .foregroundColor(viewModel.selectedCategory == cat ? .white : .primary)
                        .clipShape(Capsule())
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
    }
    
    // MARK: - Create Reminder Sheet
    private var createReminderSheet: some View {
        NavigationStack {
            Form {
                Section(header: Text("Reminder Details")) {
                    TextField("Reminder title (e.g., Study at 8 PM)", text: $newTitle)
                    TextField("Notes or description (optional)", text: $newDescription)
                }
                
                Section(header: Text("Schedule & Repeat")) {
                    DatePicker("Date & Time", selection: $newScheduledAt, in: Date()...)
                    Picker("Repeat Frequency", selection: $newRecurrence) {
                        ForEach(RecurrenceRule.allCases) { rule in
                            Label(rule.displayName, systemImage: rule.iconName).tag(rule)
                        }
                    }
                }
                
                Section(header: Text("Categorization")) {
                    Picker("Category", selection: $newCategory) {
                        ForEach(ItemCategory.allCases) { cat in
                            Label(cat.displayName, systemImage: cat.iconName).tag(cat)
                        }
                    }
                    Picker("Priority", selection: $newPriority) {
                        ForEach(Priority.allCases) { pri in
                            Label(pri.displayName, systemImage: pri.iconName).tag(pri)
                        }
                    }
                }
            }
            .navigationTitle("New Reminder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showingCreateSheet = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Schedule") {
                        viewModel.createReminder(
                            title: newTitle,
                            description: newDescription.isEmpty ? nil : newDescription,
                            scheduledAt: newScheduledAt,
                            recurrenceRule: newRecurrence,
                            category: newCategory,
                            priority: newPriority
                        )
                        showingCreateSheet = false
                    }
                    .disabled(newTitle.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
    
    private func resetForm() {
        newTitle = ""
        newDescription = ""
        newScheduledAt = Date().addingTimeInterval(3600)
        newRecurrence = .none
        newCategory = .other
        newPriority = .medium
    }
}
