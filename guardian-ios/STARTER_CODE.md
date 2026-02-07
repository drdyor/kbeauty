# Guardian iOS - Simplified Starter Code

This file contains simplified, copy-paste ready code for the Week 1 foundation tasks. Use these if you want a lighter starting point before adding the full feature set.

## Bundle IDs to Configure

Before copying code, choose your identifiers:

```
Main App Bundle ID: com.guardian.app (or com.yourname.guardian)
Widget Bundle ID: com.guardian.app.GuardianWidget
App Group ID: group.com.guardian.shared
```

Replace these in the code below.

---

## A) CalendarAuthorizationManager.swift

Handles iOS 17+ EventKit permission levels (fullAccess/writeOnly).

```swift
import EventKit

@MainActor
final class CalendarAuthorizationManager: ObservableObject {
    private let store = EKEventStore()

    @Published var status: EKAuthorizationStatus = EKEventStore.authorizationStatus(for: .event)

    func requestAccessIfNeeded() async throws -> Bool {
        let current = EKEventStore.authorizationStatus(for: .event)
        status = current

        switch current {
        case .authorized, .fullAccess:
            return true
        case .notDetermined:
            let granted: Bool
            if #available(iOS 17.0, *) {
                granted = try await store.requestFullAccessToEvents()
            } else {
                granted = try await store.requestAccess(to: .event)
            }
            status = EKEventStore.authorizationStatus(for: .event)
            return granted
        case .denied, .restricted, .writeOnly:
            return false
        @unknown default:
            return false
        }
    }

    func eventStore() -> EKEventStore { store }
}
```

**Reference:** [iOS WWDC23 EventKit Sample](https://github.com/gromb57/ios-wwdc23__AccessingCalendarUsingEventKitAndEventKitUI)

---

## B) CalendarService.swift

Fetch next 24-72h events. This is a simplified version of the full CalendarService.

```swift
import EventKit

struct CalendarEventLite: Codable, Hashable {
    let id: String
    let title: String
    let start: Date
    let end: Date
    let isAllDay: Bool
    let calendarTitle: String
    let location: String?
}

final class CalendarService {
    private let store: EKEventStore

    init(store: EKEventStore) {
        self.store = store
    }

    func fetchUpcomingEvents(hoursAhead: Int = 72, max: Int = 20) -> [CalendarEventLite] {
        let now = Date()
        let end = Calendar.current.date(byAdding: .hour, value: hoursAhead, to: now) 
            ?? now.addingTimeInterval(Double(hoursAhead) * 3600)

        let predicate = store.predicateForEvents(withStart: now, end: end, calendars: nil)
        let events = store.events(matching: predicate)
            .filter { $0.status != .canceled }
            .sorted { $0.startDate < $1.startDate }
            .prefix(max)

        return events.map {
            CalendarEventLite(
                id: $0.eventIdentifier ?? UUID().uuidString,
                title: $0.title ?? "(No title)",
                start: $0.startDate,
                end: $0.endDate,
                isAllDay: $0.isAllDay,
                calendarTitle: $0.calendar.title,
                location: $0.location
            )
        }
    }
}
```

**Reference:** [EventKit Predicate Gist](https://gist.github.com/michaelevensen/669d836b3bda4eae54612952e3a4e595)

---

## C) SharedStore.swift

App Group container file (NOT UserDefaults) for better widget reliability.

**CRITICAL:** iOS native app is the ONLY writer. Web requests updates via bridge.

```swift
import Foundation
import WidgetKit

// Minimal models for starter
struct PrivateTile: Codable, Hashable {
    let id: String
    let icon: String   // emoji or SF Symbol name
}

struct SuggestedAction: Codable, Hashable {
    let label: String
    let deeplink: String
}

struct BodyState: Codable, Hashable {
    let badge: String      // e.g. "Low sleep"
    let detail: String?
}

struct GuardianState: Codable, Hashable {
    let nextEvent: CalendarEventLite?
    let privateTiles: [PrivateTile]
    let suggestedAction: SuggestedAction?
    let bodyState: BodyState?
    let updatedAt: Date
}

final class SharedStore {
    static let shared = SharedStore()

    // CHANGE THIS to your App Group ID:
    private let appGroupId = "group.com.guardian.shared"
    private let fileName = "guardian_state.json"

    private var fileURL: URL? {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroupId)?
            .appendingPathComponent(fileName)
    }

    // ONLY iOS native app calls this (web requests updates via bridge)
    func writeState(_ state: GuardianState) throws {
        guard let url = fileURL else { 
            throw NSError(domain: "SharedStore", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "App Group container not found"
            ])
        }

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(state)

        try data.write(to: url, options: [.atomic])

        // Nudge widgets to refresh
        WidgetCenter.shared.reloadAllTimelines()
    }

    // Widget reads this (read-only)
    func readState() -> GuardianState? {
        guard let url = fileURL,
              let data = try? Data(contentsOf: url) else { return nil }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try? decoder.decode(GuardianState.self, from: data)
    }
}
```

**Reference:** [Flutter HomeWidget iOS Example](https://github.com/gskinnerTeam/flutter_home_widget_fork/blob/main/example/ios/HomeWidgetExample/HomeWidgetExample.swift)

---

## D) GuardianWidget.swift

Basic widget supporting all families with timeline refresh.

```swift
import WidgetKit
import SwiftUI

struct GuardianEntry: TimelineEntry {
    let date: Date
    let state: GuardianState
}

struct GuardianProvider: TimelineProvider {
    func placeholder(in context: Context) -> GuardianEntry {
        GuardianEntry(
            date: Date(),
            state: GuardianState(
                nextEvent: CalendarEventLite(
                    id: "demo",
                    title: "Team Sync",
                    start: Date().addingTimeInterval(2*3600),
                    end: Date().addingTimeInterval(3*3600),
                    isAllDay: false,
                    calendarTitle: "Work",
                    location: nil
                ),
                privateTiles: [
                    PrivateTile(id: "deepwork", icon: "🧠"),
                    PrivateTile(id: "nutrition", icon: "🥗")
                ],
                suggestedAction: SuggestedAction(
                    label: "Start 7-min grounding", 
                    deeplink: "guardian://open?screen=session&id=grounding7"
                ),
                bodyState: BodyState(badge: "Low sleep", detail: "5h 40m"),
                updatedAt: Date()
            )
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (GuardianEntry) -> Void) {
        let state = SharedStore.shared.readState() ?? placeholder(in: context).state
        completion(GuardianEntry(date: Date(), state: state))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GuardianEntry>) -> Void) {
        let state = SharedStore.shared.readState() ?? placeholder(in: context).state

        // IMPORTANT: iOS controls actual refresh frequency
        // We just provide suggested timeline entries
        let now = Date()
        let refresh = Calendar.current.date(byAdding: .minute, value: 30, to: now) 
            ?? now.addingTimeInterval(1800)

        let entry = GuardianEntry(date: now, state: state)
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

struct GuardianWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: GuardianProvider.Entry

    var body: some View {
        switch family {
        case .systemSmall, .accessoryRectangular:
            compactView
        case .systemMedium:
            mediumView
        case .accessoryInline:
            inlineView
        case .accessoryCircular:
            circularView
        default:
            compactView
        }
    }

    private var inlineView: some View {
        Text(inlineText())
    }

    private var circularView: some View {
        ZStack {
            Text("⏳")
            Text(shortCountdown()).font(.caption2)
        }
    }

    private var compactView: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Next").font(.caption).opacity(0.7)
            Text(entry.state.nextEvent?.title ?? "No upcoming events")
                .font(.headline)
                .lineLimit(2)

            Text(countdownText())
                .font(.subheadline)
                .opacity(0.9)

            HStack(spacing: 6) {
                ForEach(entry.state.privateTiles.prefix(4), id: \.self) { tile in
                    Text(tile.icon)
                }
                Spacer()
                if let badge = entry.state.bodyState?.badge {
                    Text(badge).font(.caption2).opacity(0.8)
                }
            }
        }
        .padding()
        .widgetURL(URL(string: entry.state.suggestedAction?.deeplink ?? "guardian://open"))
    }

    private var mediumView: some View {
        HStack {
            compactView
            Spacer()
        }
    }

    private func countdownText() -> String {
        guard let start = entry.state.nextEvent?.start else { return "" }
        let diff = Int(start.timeIntervalSinceNow)
        if diff <= 0 { return "Now" }
        let h = diff / 3600
        let m = (diff % 3600) / 60
        return "in \(h)h \(m)m"
    }

    private func shortCountdown() -> String {
        guard let start = entry.state.nextEvent?.start else { return "--" }
        let diff = max(0, Int(start.timeIntervalSinceNow))
        let m = diff / 60
        return "\(m)m"
    }

    private func inlineText() -> String {
        guard let t = entry.state.nextEvent?.title else { return "No events" }
        return "Next: \(t) \(countdownText())"
    }
}

@main
struct GuardianWidget: Widget {
    let kind = "GuardianWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GuardianProvider()) { entry in
            GuardianWidgetView(entry: entry)
        }
        .configurationDisplayName("Guardian")
        .description("Next event + private focus icons")
        .supportedFamilies([
            .systemSmall, .systemMedium,
            .accessoryInline, .accessoryCircular, .accessoryRectangular
        ])
    }
}
```

**Reference:** [WidgetKit Examples Repo](https://github.com/pawello2222/WidgetExamples)

---

## Xcode Setup Checklist

1. **Create iOS App (SwiftUI)**
   - Name: Guardian
   - Bundle ID: `com.guardian.app`
   - Interface: SwiftUI
   - Language: Swift

2. **Add Widget Extension**
   - File → New → Target → Widget Extension
   - Name: GuardianWidget
   - Bundle ID: `com.guardian.app.GuardianWidget`
   - Include Configuration Intent: NO

3. **Configure App Groups (BOTH targets)**
   - Main app: Signing & Capabilities → + Capability → App Groups
   - Add: `group.com.guardian.shared`
   - Widget: Same process, same group ID

4. **Add to Info.plist**
   ```xml
   <key>NSCalendarsUsageDescription</key>
   <string>Guardian shows your next events in widgets.</string>
   
   <key>CFBundleURLTypes</key>
   <array>
       <dict>
           <key>CFBundleURLSchemes</key>
           <array>
               <string>guardian</string>
           </array>
       </dict>
   </array>
   ```

5. **Test App Group Access**
   ```swift
   // In your ContentView or app entry point
   if let url = FileManager.default.containerURL(
       forSecurityApplicationGroupIdentifier: "group.com.guardian.shared"
   ) {
       print("✅ App Group URL: \(url.path)")
   } else {
       print("❌ App Group not accessible - check entitlements")
   }
   ```

---

## Quick Test Flow

1. **Build and run main app**
2. **Grant calendar permission**
3. **Fetch events and write to SharedStore:**
   ```swift
   let events = calendarService.fetchUpcomingEvents()
   let state = GuardianState(
       nextEvent: events.first,
       privateTiles: [PrivateTile(id: "test", icon: "🎯")],
       suggestedAction: nil,
       bodyState: nil,
       updatedAt: Date()
   )
   try? SharedStore.shared.writeState(state)
   ```
4. **Add widget to home screen** → Should show event
5. **Tap widget** → Should open app via deeplink

---

## Comparison: Starter vs Full Implementation

| Feature | Starter Code | Full Generated Files |
|---------|-------------|---------------------|
| Calendar Service | Basic fetch only | + Stress detection, user rules |
| Shared Store | Simple read/write | + Update helpers, debug tools |
| Widget | Basic display | + Smart timeline, multiple layouts |
| Health | Not included | HealthKit sleep tracking |
| AI Planning | Not included | OpenRouter integration |
| Privacy Routing | Not included | 3-tier classification |
| Deep Links | Basic support | Full router with mode mapping |
| Web Bridge | Not included | Bidirectional JS ↔ Native |

**Use Starter Code if:** You want to understand the basics first and add features incrementally.

**Use Full Implementation if:** You want all Week 2 features pre-built and just need to wire them together.

---

## GitHub References (Open These!)

- [WidgetKit Examples](https://github.com/pawello2222/WidgetExamples) - Best widget patterns
- [WidgetKit Demo](https://github.com/wojciech-kulik/WidgetKit-Demo) - Timelines + deeplinks
- [EventKit iOS17 Sample](https://github.com/gromb57/ios-wwdc23__AccessingCalendarUsingEventKitAndEventKitUI) - Modern permissions
- [SwiftUI Widget Sample](https://github.com/gfiocco/swiftui-widget-sample) - App Groups
- [Apple Fruta Sample](https://github.com/apple-sample-code/FrutaBuildingAFeatureRichAppWithSwiftUI) - Official Apple example

---

## Next Steps

1. Copy the code above into your Xcode project
2. Update bundle IDs and App Group ID
3. Test calendar permission flow
4. Verify widget displays events
5. Once working, upgrade to full implementation for Week 2 features
