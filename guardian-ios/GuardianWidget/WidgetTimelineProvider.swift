import WidgetKit
import SwiftUI

// MARK: - Widget Timeline Provider
// FEEDBACK: Timeline-based refresh (no background tasks)
// Opportunistic reload via WidgetCenter when app updates state

struct GuardianTimelineProvider: TimelineProvider {
    typealias Entry = GuardianEntry
    
    func placeholder(in context: Context) -> GuardianEntry {
        GuardianEntry(
            date: Date(),
            state: placeholderState()
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (GuardianEntry) -> Void) {
        let entry = GuardianEntry(
            date: Date(),
            state: SharedStore.shared.readState() ?? placeholderState()
        )
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<GuardianEntry>) -> Void) {
        let currentDate = Date()
        let state = SharedStore.shared.readState() ?? placeholderState()
        
        // Generate timeline entries
        var entries: [GuardianEntry] = []
        
        // Current entry
        entries.append(GuardianEntry(date: currentDate, state: state))
        
        // IMPORTANT: Widget refresh is iOS-controlled, not clock-based
        // We create timeline ENTRIES at strategic times, iOS decides actual refresh
        // For real-time countdown, use Live Activities (post-MVP)
        
        if let nextEvent = state.nextEvent {
            let hoursUntil = nextEvent.startDate.hoursUntil()
            
            // Add timeline entries at 3h, 1h, 15m before event
            let refreshPoints: [Double] = [3.0, 1.0, 0.25] // hours
            
            for hours in refreshPoints {
                if hoursUntil > hours {
                    let refreshDate = nextEvent.startDate.addingTimeInterval(-hours * 3600)
                    if refreshDate > currentDate {
                        entries.append(GuardianEntry(date: refreshDate, state: state))
                    }
                }
            }
            
            // Add entry at event time
            if nextEvent.startDate > currentDate {
                entries.append(GuardianEntry(date: nextEvent.startDate, state: state))
            }
        }
        
        // Default refresh in 30 minutes if no events (iOS controls actual timing)
        if entries.count == 1 {
            entries.append(GuardianEntry(
                date: currentDate.addingTimeInterval(1800),
                state: state
            ))
        }
        
        // Sort entries
        entries.sort { $0.date < $1.date }
        
        // Create timeline
        // iOS decides actual refresh frequency; we just provide the schedule
        let timeline = Timeline(
            entries: entries,
            policy: .after(entries.last!.date)
        )
        
        completion(timeline)
    }
    
    private func placeholderState() -> GuardianState {
        GuardianState(
            nextEvent: nil,
            privateTiles: [],
            suggestedAction: nil,
            bodyState: nil,
            updatedAt: Date(),
            activeSession: nil
        )
    }
}

// MARK: - Widget Entry

struct GuardianEntry: TimelineEntry {
    let date: Date
    let state: GuardianState
    
    // Convenience accessors
    var nextEvent: CalendarEvent? { state.nextEvent }
    var bodyState: BodyState? { state.bodyState }
    var activeSession: ActiveSession? { state.activeSession }
    var privateTiles: [PrivateTile] { state.privateTiles }
}
