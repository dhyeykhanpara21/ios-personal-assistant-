import SwiftUI

public struct CircularProgressView: View {
    public var progress: Double // 0.0 to 1.0
    public var lineWidth: CGFloat = 10
    public var primaryColor: Color = .blue
    public var secondaryColor: Color = Color.blue.opacity(0.2)
    public var iconName: String? = nil
    public var centerText: String? = nil
    public var subText: String? = nil
    
    public init(
        progress: Double,
        lineWidth: CGFloat = 10,
        primaryColor: Color = .blue,
        secondaryColor: Color = Color.blue.opacity(0.2),
        iconName: String? = nil,
        centerText: String? = nil,
        subText: String? = nil
    ) {
        self.progress = progress
        self.lineWidth = lineWidth
        self.primaryColor = primaryColor
        self.secondaryColor = secondaryColor
        self.iconName = iconName
        self.centerText = centerText
        self.subText = subText
    }
    
    public var body: some View {
        ZStack {
            // Background track
            Circle()
                .stroke(secondaryColor, lineWidth: lineWidth)
            
            // Progress arc
            Circle()
                .trim(from: 0.0, to: CGFloat(min(max(progress, 0.0), 1.0)))
                .stroke(
                    AngularGradient(
                        gradient: Gradient(colors: [primaryColor.opacity(0.7), primaryColor]),
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(Angle(degrees: -90))
                .animation(.spring(response: 0.6, dampingFraction: 0.75), value: progress)
            
            // Center content
            VStack(spacing: 2) {
                if let icon = iconName {
                    Image(systemName: icon)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(primaryColor)
                }
                if let center = centerText {
                    Text(center)
                        .font(.system(.title3, design: .rounded).weight(.bold))
                        .foregroundColor(.primary)
                }
                if let sub = subText {
                    Text(sub)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}
