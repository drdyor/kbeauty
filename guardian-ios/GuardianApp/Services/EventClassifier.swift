import Foundation

// MARK: - Event Classifier
// Analyzes calendar events and maps them to Focus Mode preparation protocols

class EventClassifier {
    
    // MARK: - Preparation Protocol
    
    struct PreparationProtocol {
        let eventId: String
        let timelineSteps: [TimelineStep]
        
        struct TimelineStep {
            let hoursBeforeEvent: Double
            let suggestedMode: String
            let modeLabel: String
            let duration: Int // minutes
            let notification: String
        }
    }
    
    // MARK: - Generate Protocol (FEEDBACK: Maps to existing primer manifest)
    
    func generateProtocol(for event: CalendarEvent) -> PreparationProtocol? {
        guard event.isStressful else {
            return nil // No protocol for non-stressful events
        }
        
        let hoursUntil = event.startDate.hoursUntil()
        
        if hoursUntil < 0.25 { // Less than 15 minutes
            return nil // Too late for prep
        }
        
        var steps: [PreparationProtocol.TimelineStep] = []
        
        // 3-hour preparation timeline for highly stressful events (confidence > 0.7)
        if event.confidenceScore > 0.7 && hoursUntil >= 3 {
            steps.append(
                .init(
                    hoursBeforeEvent: 3.0,
                    suggestedMode: "calm",
                    modeLabel: "Calm Nervous System",
                    duration: 15,
                    notification: "High-stress event in 3h. Begin calming protocol."
                )
            )
        }
        
        // 1-hour: Focus/Deep Work prep
        if hoursUntil >= 1 {
            steps.append(
                .init(
                    hoursBeforeEvent: 1.0,
                    suggestedMode: "deep_work",
                    modeLabel: "Deep Work",
                    duration: 25,
                    notification: "Event in 1h. Focus preparation recommended."
                )
            )
        }
        
        // 15-minute: Quick alpha reset
        if hoursUntil >= 0.25 {
            steps.append(
                .init(
                    hoursBeforeEvent: 0.25,
                    suggestedMode: "reset",
                    modeLabel: "Emotional Reset",
                    duration: 10,
                    notification: "Event in 15m. Quick alpha reset available."
                )
            )
        }
        
        guard !steps.isEmpty else {
            return nil
        }
        
        return PreparationProtocol(eventId: event.id, timelineSteps: steps)
    }
    
    // MARK: - Get Next Step
    
    func getNextStep(for event: CalendarEvent, protocol: PreparationProtocol) -> PreparationProtocol.TimelineStep? {
        let hoursUntil = event.startDate.hoursUntil()
        
        // Find the closest upcoming step
        return protocol.timelineSteps.first { step in
            hoursUntil <= step.hoursBeforeEvent + 0.1 // Small buffer
        }
    }
    
    // MARK: - Should Show Widget Badge
    
    func shouldShowPreparationBadge(for event: CalendarEvent) -> Bool {
        guard event.isStressful else { return false }
        
        let hoursUntil = event.startDate.hoursUntil()
        
        // Show badge when within preparation window
        return hoursUntil > 0 && hoursUntil <= 3
    }
    
    // MARK: - Widget Display Text
    
    func getWidgetDisplayText(for event: CalendarEvent, protocol: PreparationProtocol?) -> String {
        guard let protocol = protocol,
              let nextStep = getNextStep(for: event, protocol: protocol) else {
            return event.displayTitle
        }
        
        let hoursUntil = event.startDate.hoursUntil()
        
        if abs(hoursUntil - nextStep.hoursBeforeEvent) < 0.1 {
            // Currently at a preparation step
            return "⚡ \(nextStep.modeLabel) Ready"
        } else {
            // Upcoming event with prep available
            return "\(event.displayTitle) · Prep at \(formatPrepTime(nextStep.hoursBeforeEvent))"
        }
    }
    
    private func formatPrepTime(_ hours: Double) -> String {
        if hours >= 1 {
            return "\(Int(hours))h"
        } else {
            let minutes = Int(hours * 60)
            return "\(minutes)m"
        }
    }
}
