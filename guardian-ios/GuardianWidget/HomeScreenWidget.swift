import WidgetKit
import SwiftUI

// MARK: - Home Screen Widget
// Supports .systemSmall and .systemMedium

struct HomeScreenWidget: Widget {
    let kind: String = "GuardianHomeWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GuardianTimelineProvider()) { entry in
            HomeScreenWidgetView(entry: entry)
        }
        .configurationDisplayName("Guardian")
        .description("Your next focus session or calendar event")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct HomeScreenWidgetView: View {
    let entry: GuardianEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            EmptyView()
        }
    }
}

// MARK: - Small Widget

struct SmallWidgetView: View {
    let entry: GuardianEntry
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color(hex: "#fce7f3"), Color(hex: "#e9d5ff")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(spacing: 8) {
                // Body state badge (if available)
                if let bodyState = entry.bodyState {
                    HStack {
                        Spacer()
                        Text(bodyState.badgeText)
                            .font(.system(size: 16))
                            .padding(6)
                            .background(Color(hex: bodyState.badgeColor).opacity(0.2))
                            .cornerRadius(8)
                    }
                }
                
                Spacer()
                
                // Active session OR next event
                if let session = entry.activeSession {
                    // Show active session
                    VStack(spacing: 4) {
                        Text("🎧")
                            .font(.system(size: 32))
                        Text(session.focusModeLabel)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(Color(hex: "#4c1d95"))
                            .multilineTextAlignment(.center)
                        Text(formatTime(session.remainingTime))
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(Color(hex: "#a591ff"))
                    }
                } else if let event = entry.nextEvent {
                    // Show next event
                    VStack(spacing: 4) {
                        if event.isStressful {
                            Text("⚡")
                                .font(.system(size: 28))
                        } else {
                            Text("📅")
                                .font(.system(size: 28))
                        }
                        
                        if !event.displayTitle.isEmpty {
                            Text(event.displayTitle)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(Color(hex: "#4c1d95"))
                                .lineLimit(2)
                                .multilineTextAlignment(.center)
                        }
                        
                        Text(event.countdownText)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color(hex: "#a591ff"))
                    }
                } else {
                    // No events or sessions
                    VStack(spacing: 8) {
                        Text("🌙")
                            .font(.system(size: 32))
                        Text("All clear")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(Color(hex: "#8b839a"))
                    }
                }
                
                Spacer()
            }
            .padding(12)
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

// MARK: - Medium Widget

struct MediumWidgetView: View {
    let entry: GuardianEntry
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#fce7f3"), Color(hex: "#e9d5ff")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            HStack(spacing: 12) {
                // Left side: Next event or session
                VStack(alignment: .leading, spacing: 8) {
                    // Header
                    HStack {
                        Text("🎧 Guardian")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(Color(hex: "#a591ff"))
                        Spacer()
                        if let bodyState = entry.bodyState {
                            Text(bodyState.badgeText)
                                .font(.system(size: 14))
                                .padding(4)
                                .background(Color(hex: bodyState.badgeColor).opacity(0.2))
                                .cornerRadius(6)
                        }
                    }
                    
                    Spacer()
                    
                    // Main content
                    if let session = entry.activeSession {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("ACTIVE")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(Color(hex: "#8b839a"))
                            Text(session.focusModeLabel)
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(Color(hex: "#4c1d95"))
                            Text(formatTime(session.remainingTime))
                                .font(.system(size: 22, weight: .bold))
                                .foregroundColor(Color(hex: "#a591ff"))
                        }
                    } else if let event = entry.nextEvent {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("NEXT EVENT")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(Color(hex: "#8b839a"))
                            
                            if !event.displayTitle.isEmpty {
                                Text(event.displayTitle)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(Color(hex: "#4c1d95"))
                                    .lineLimit(2)
                            }
                            
                            HStack(spacing: 4) {
                                if event.isStressful {
                                    Text("⚡")
                                        .font(.system(size: 14))
                                }
                                Text(event.countdownText)
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(Color(hex: "#a591ff"))
                            }
                            
                            if let mode = event.suggestedFocusMode {
                                Text("Prep: \(focusModeLabel(mode))")
                                    .font(.system(size: 10))
                                    .foregroundColor(Color(hex: "#8b839a"))
                            }
                        }
                    } else {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("All clear")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(Color(hex: "#4c1d95"))
                            Text("No upcoming events")
                                .font(.system(size: 11))
                                .foregroundColor(Color(hex: "#8b839a"))
                        }
                    }
                    
                    Spacer()
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                
                Divider()
                    .background(Color.white.opacity(0.3))
                
                // Right side: Private tiles
                VStack(alignment: .leading, spacing: 6) {
                    Text("PRIVATE")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(hex: "#8b839a"))
                    
                    if entry.privateTiles.isEmpty {
                        Text("—")
                            .font(.system(size: 24))
                            .foregroundColor(Color(hex: "#8b839a").opacity(0.3))
                    } else {
                        LazyVGrid(columns: [GridItem(.fixed(30)), GridItem(.fixed(30))], spacing: 8) {
                            ForEach(entry.privateTiles.prefix(4)) { tile in
                                Text(tile.icon)
                                    .font(.system(size: 24))
                            }
                        }
                    }
                }
                .frame(width: 80)
            }
            .padding(12)
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
    
    private func focusModeLabel(_ id: String) -> String {
        let labels: [String: String] = [
            "deep_work": "Deep Work",
            "study": "Study",
            "calm": "Calm",
            "sleep": "Sleep",
            "creative": "Creative",
            "reset": "Reset"
        ]
        return labels[id] ?? "Focus"
    }
}
