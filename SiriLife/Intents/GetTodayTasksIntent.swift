import Foundation
import AppIntents

public struct GetTodayTasksIntent: AppIntent {
    public static var title: LocalizedStringResource = "Get Today's Tasks in Luphonix"
    public static var description = IntentDescription("Reads your pending tasks scheduled for today.")
    
    public init() {}
    
    public func perform() async throws -> some ProvidesDialog & ReturnsValue<[String]> {
        let allTasks = StorageManager.shared.getTasks()
        let todayPending = allTasks.filter { $0.isDueToday && !$0.isCompleted }
        
        let titles = todayPending.map { $0.title }
        let dialogMessage: LocalizedStringResource
        
        if titles.isEmpty {
            dialogMessage = "You have no pending tasks left for today in Luphonix. All clear!"
        } else if titles.count == 1 {
            dialogMessage = "You have 1 task today in Luphonix: \(titles[0])."
        } else {
            let taskListString = titles.prefix(4).joined(separator: ", ")
            dialogMessage = "You have \(titles.count) tasks today in Luphonix: \(taskListString)."
        }
        
        return .result(value: titles, dialog: IntentDialog(dialogMessage))
    }
}
