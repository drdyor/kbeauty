import WidgetKit
import SwiftUI

// MARK: - Lock Screen Widget
// Supports .accessoryInline, .accessoryCircular, .accessoryRectangular

struct LockScreenWidget: Widget {
    let kind: String = "GuardianLockWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GuardianTimelineProvider()) { entry in
            LockScreenWidgetView(entry: entry)
        }
        .configurationDisplayName("Guardian")
        .description("Quick glance at your next event or session")
        .supportedFamilies([.accessoryInline, .accessoryCircular, .accessoryRectangular])
    }
}

struct LockScreenWidgetView: View {
    let entry: GuardianEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .accessoryInline:
            InlineWidgetView(entry: entry)
        case .accessoryCircular:
            CircularWidgetView(entry: entry)
        case .accessoryRectangular:
            RectangularWidgetView(entry: entry)
        default:
            EmptyView()
        }
    }
}

// MARK: - Inline Widget (Lock Screen Top)

struct InlineWidgetView: View {
    let entry: GuardianEntry
    
    var body: some View {
        if let session = entry.activeSession {
            Label(
                "\(session.focusModeLabel): \(formatTime(session.remainingTime))",
                systemImage: "headphones"
            )
        } else if let event = entry.nextEvent {
            Label(
                "\(event.displayTitle.isEmpty ? "Event" : event.displayTitle) \(event.countdownText)",
                systemImage: event.isStressful ? "bolt.fill" : "calendar"
            )
        } else {
            Label("Guardian: All clear", systemImage: "moon.fill")
        }
    }
    
    private func formatTime(_ seconds: TimeInterval) -> String {
        let minutes = Int(seconds) / 60
        return "\(minutes)m"
    }
}

// MARK: - Circular Widget (Lock Screen)

struct CircularWidgetView: View {
    let entry: GuardianEntry
    
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            
            if let session = entry.activeSession {
                // Show session progress as circular gauge
                Gauge(value: session.progressPercentage, in: 0...100) {
                    Text("🎧")
                        .font(.system(size: 20))
                }
                .gaugeStyle(.accessoryCircularCapacity)
            } else if let event = entry.nextEvent {
                // Show event icon
                VStack {
                    if event.isStressful {
                        Text("⚡")
                            .font(.system(size: 24))
                    } else {
                        Text("📅")
                            .font(.system(size: 24))
                    }
                }
            } else {
                // No events
                Text("🌙")
                    .font(.system(size: 24))
            }
        }
        .widgetURL(makeDeepLink())
    }
    
    private func makeDeepLink() -> URL {
        if let session = entry.activeSession {
            return DeepLinkHandler.makeSessionResumeLink()
        } else if let event = entry.nextEvent, let mode = event.suggestedFocusMode {
            return DeepLinkHandler.makeModeLink(modeId: mode)
        } else {
            return URL(string: "guardian://open?screen=home")!
        }
    }
}

// MARK: - Rectangular Widget (Lock Screen)

struct RectangularWidgetView: View {
    let entry: GuardianEntry
    
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            
            VStack(alignment: .leading, spacing: 2) {
                if let session = entry.activeSession {
                    // Active session
                    HStack {
                        Text("🎧")
                        Text("ACTIVE")
                            .font(.system(size: 10, weight: .bold))
                        Spacer()
                    }
                    
                    Text(session.focusModeLabel)
                        .font(.system(size: 14, weight: .semibold))
                        .lineLimit(1)
                    
                    Text(formatTime(session.remainingTime))
                        .font(.system(size: 16, weight: .bold))
                } else if let event = entry.nextEvent {
                    // Next event
                    HStack {
                        if event.isStressful {
                            Text("⚡ PREP")
                                .font(.system(size: 10, weight: .bold))
                        } else {
                            Text("📅 NEXT")
                                .font(.system(size: 10, weight: .bold))
                        }
                        Spacer()
                        
                        if let bodyState = entry.bodyState {
                            Text(bodyState.badgeText)
                                .font(.system(size: 12))
                        }
                    }
                    
                    if !event.displayTitle.isEmpty {
                        Text(event.displayTitle)
                            .font(.system(size: 12, weight: .medium))
                            .lineLimit(1)
                    }
                    
                    Text(event.countdownText)
                        .font(.system(size: 14, weight: .bold))
                } else {
                    // All clear
                    HStack {
                        Text("🌙")
                        Text("All clear")
                            .font(.system(size: 12, weight: .medium))
                    }
                    
                    if let bodyState = entry.bodyState {
                        Text(bodyState.recommendation)
                            .font(.system(size: 10))
                            .lineLimit(2)
                    }
                }
            }
        }
        .widgetURL(makeDeepLink())
    }
    
    private func makeDeepLink() -> URL {
        if let session = entry.activeSession {
            return DeepLinkHandler.makeSessionResumeLink()
        } else if let event = entry.nextEvent, let mode = event.suggestedFocusMode {
            return DeepLinkHandler.makeModeLink(modeId: mode)
        } else {
            return URL(string: "guardian://open?screen=home")!
        }
    }
    
    private func formatTime(_ seconds: TimeInterval) -> String {
        let minutes = Int(seconds) / 60
        let secs = Int(seconds) % 60
        return String(format: "%d:%02d", minutes, secs)
    }
}
