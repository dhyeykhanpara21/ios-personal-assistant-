import SwiftUI

public struct ReminderRowView: View {
    public var reminder: ReminderItem
    public var onToggleEnabled: () -> Void
    public var onComplete: () -> Void
    public var onSnooze: () -> Void
    public var onDelete: () -> Void
    
    public init(
        reminder: ReminderItem,
        onToggleEnabled: @escaping () -> Void,
        onComplete: @escaping () -> Void,
        onSnooze: @escaping () -> Void,
        onDelete: @escaping () -> Void
    ) {
        self.reminder = reminder
        self.onToggleEnabled = onToggleEnabled
        self.onComplete = onComplete
        self.onSnooze = onSnooze
        self.onDelete = onDelete
    }
    
    public var body: some View {
        HStack(alignment: .center, spacing: 14) {
            // Category Icon Circle
            ZStack {
                Circle()
                    .fill(reminder.category.color.opacity(0.15))
                    .frame(width: 42, height: 42)
                
                Image(systemName: reminder.category.iconName)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(reminder.category.color)
            }
            
            // Reminder Info
            VStack(alignment: .leading, spacing: 4) {
                Text(reminder.title)
                    .font(.system(.body, design: .rounded).weight(.semibold))
                    .foregroundColor(reminder.isEnabled ? .primary : .secondary)
                
                HStack(spacing: 8) {
                    Text(reminder.formattedScheduledTime)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if reminder.recurrenceRule != .none {
                        HStack(spacing: 3) {
                            Image(systemName: reminder.recurrenceRule.iconName)
                            Text(reminder.recurrenceRule.displayName)
                        }
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .clipShape(Capsule())
                    }
                    
                    if let snoozed = reminder.snoozedUntil, snoozed > Date() {
                        Text("Snoozed")
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.15))
                            .foregroundColor(.orange)
                            .clipShape(Capsule())
                    }
                }
            }
            
            Spacer()
            
            // Snooze & Done actions
            if reminder.isEnabled {
                Button(action: onSnooze) {
                    Image(systemName: "moon.zzz.fill")
                        .font(.system(size: 16))
                        .foregroundColor(.orange)
                        .padding(8)
                        .background(Color.orange.opacity(0.1))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                
                Button(action: onComplete) {
                    Image(systemName: "checkmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.green)
                        .padding(8)
                        .background(Color.green.opacity(0.1))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
            
            // Enabled toggle
            Toggle("", isOn: Binding(
                get: { reminder.isEnabled },
                set: { _ in onToggleEnabled() }
            ))
            .labelsHidden()
        }
        .padding(.vertical, 6)
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive, action: onDelete) {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}
