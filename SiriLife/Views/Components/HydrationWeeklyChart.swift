import SwiftUI

public struct HydrationWeeklyChart: View {
    public var records: [DailyIntakeRecord]
    public var goalMl: Int
    
    public init(records: [DailyIntakeRecord], goalMl: Int = 2000) {
        self.records = records
        self.goalMl = goalMl
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Last 7 Days")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("Goal: \(goalMl) ml")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            HStack(alignment: .bottom, spacing: 10) {
                ForEach(records) { rec in
                    VStack(spacing: 6) {
                        // Amount text
                        if rec.totalMl > 0 {
                            Text("\(rec.totalMl)")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(.secondary)
                        }
                        
                        // Bar
                        ZStack(alignment: .bottom) {
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .fill(Color.blue.opacity(0.12))
                                .frame(width: 28, height: 110)
                            
                            let heightRatio = min(1.2, Double(rec.totalMl) / Double(max(1, goalMl)))
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .fill(
                                    LinearGradient(
                                        colors: rec.totalMl >= goalMl ? [Color.cyan, Color.blue] : [Color.blue.opacity(0.6), Color.blue],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                                )
                                .frame(width: 28, height: max(6, CGFloat(heightRatio) * 110))
                        }
                        
                        // Day Label
                        Text(rec.dayName)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(rec.dayName == "Today" ? .blue : .secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 150)
        }
        .glassCard()
    }
}
