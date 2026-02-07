import Foundation
import EventKit
import UIKit

// MARK: - Calendar Service
// YOU CODE THIS (Days 1-2)
// Handles EventKit permissions and fetches events from user's calendar

class CalendarService: ObservableObject {
    private let eventStore = EKEventStore()
    
    @Published var authorizationStatus: EKAuthorizationStatus = .notDetermined
    @Published var events: [CalendarEvent] = []
    
    // User-defined calendar rules (FEEDBACK: allow calendar-level override)
    private var calendarRules: [String: CalendarRule] = [:]
    
    init() {
        checkAuthorizationStatus()
        loadCalendarRules()
    }
    
    // MARK: - Authorization
    
    func checkAuthorizationStatus() {
        if #available(iOS 17.0, *) {
            authorizationStatus = EKEventStore.authorizationStatus(for: .event)
        } else {
            authorizationStatus = EKEventStore.authorizationStatus(for: .event)
        }
    }
    
    func requestAccess() async -> Bool {
        do {
            if #available(iOS 17.0, *) {
                let granted = try await eventStore.requestFullAccessToEvents()
                await MainActor.run {
                    self.authorizationStatus = granted ? .fullAccess : .denied
                }
                return granted
            } else {
                return try await withCheckedThrowingContinuation { continuation in
                    eventStore.requestAccess(to: .event) { granted, error in
                        if let error = error {
                            continuation.resume(throwing: error)
                        } else {
                            continuation.resume(returning: granted)
                        }
                    }
                }
            }
        } catch {
            print("❌ Calendar access error: \(error)")
            return false
        }
    }
    
    // MARK: - Fetch Events
    
    func fetchUpcomingEvents(hours: Int = 72) async -> [CalendarEvent] {
        guard authorizationStatus == .authorized || authorizationStatus == .fullAccess else {
            print("⚠️ Calendar not authorized")
            return []
        }
        
        let startDate = Date()
        let endDate = Calendar.current.date(byAdding: .hour, value: hours, to: startDate)!
        
        let predicate = eventStore.predicateForEvents(
            withStart: startDate,
            end: endDate,
            calendars: nil
        )
        
        let ekEvents = eventStore.events(matching: predicate)
        
        let calendarEvents = ekEvents.map { ekEvent in
            convertToCalendarEvent(ekEvent)
        }
        
        await MainActor.run {
            self.events = calendarEvents
        }
        
        return calendarEvents
    }
    
    // MARK: - Event Conversion
    
    private func convertToCalendarEvent(_ ekEvent: EKEvent) -> CalendarEvent {
        // Determine if event is stressful
        let stressAnalysis = analyzeStress(for: ekEvent)
        
        // Determine privacy tier
        let privacyTier = determinePrivacyTier(for: ekEvent)
        
        // Suggest focus mode based on event type
        let suggestedMode = suggestFocusMode(for: ekEvent, isStressful: stressAnalysis.isStressful)
        
        return CalendarEvent(
            id: ekEvent.eventIdentifier,
            title: ekEvent.title ?? "Untitled Event",
            startDate: ekEvent.startDate,
            endDate: ekEvent.endDate,
            isStressful: stressAnalysis.isStressful,
            confidenceScore: stressAnalysis.confidence,
            privacyTier: privacyTier,
            suggestedFocusMode: suggestedMode,
            preparationTime: stressAnalysis.isStressful ? 3600 : nil // 1h prep for stressful events
        )
    }
    
    // MARK: - Stress Analysis (Simple Keyword Detection)
    
    private func analyzeStress(for event: EKEvent) -> (isStressful: Bool, confidence: Double) {
        let title = event.title?.lowercased() ?? ""
        let notes = event.notes?.lowercased() ?? ""
        let calendarName = event.calendar.title
        
        // FEEDBACK: Check calendar-level rules first
        if let rule = calendarRules[calendarName] {
            switch rule.appliesTo {
            case .all:
                return (rule.isStressful, 1.0) // High confidence from user rule
            case .keywordMatch:
                // Fall through to keyword detection
                break
            }
        }
        
        // Stress keywords with weights
        let stressKeywords: [(String, Double)] = [
            ("presentation", 0.9),
            ("interview", 0.95),
            ("review", 0.7),
            ("deadline", 0.8),
            ("meeting", 0.5),
            ("demo", 0.75),
            ("pitch", 0.85),
            ("exam", 0.9),
            ("test", 0.7),
            ("evaluation", 0.8)
        ]
        
        var totalWeight = 0.0
        var matchCount = 0
        
        for (keyword, weight) in stressKeywords {
            if title.contains(keyword) || notes.contains(keyword) {
                totalWeight += weight
                matchCount += 1
            }
        }
        
        if matchCount == 0 {
            return (false, 0.0)
        }
        
        let avgWeight = totalWeight / Double(matchCount)
        let isStressful = avgWeight >= 0.6
        
        return (isStressful, avgWeight)
    }
    
    // MARK: - Privacy Tier Determination
    
    private func determinePrivacyTier(for event: EKEvent) -> PrivacyTier {
        let title = event.title?.lowercased() ?? ""
        
        // Private keywords (never show in calendar)
        let privateKeywords = ["therapy", "doctor", "medical", "health", "personal", "private"]
        
        for keyword in privateKeywords {
            if title.contains(keyword) {
                return .privateOnly
            }
        }
        
        // Default to public calendar for work events
        return .publicCalendar
    }
    
    // MARK: - Focus Mode Suggestion
    
    private func suggestFocusMode(for event: EKEvent, isStressful: Bool) -> String? {
        let title = event.title?.lowercased() ?? ""
        
        if isStressful {
            // Suggest calming mode before stressful events
            return "calm"
        }
        
        if title.contains("creative") || title.contains("brainstorm") {
            return "creative"
        }
        
        if title.contains("study") || title.contains("learn") {
            return "study"
        }
        
        if title.contains("work") || title.contains("focus") {
            return "deep_work"
        }
        
        return nil
    }
    
    // MARK: - Calendar Rules Management (FEEDBACK: User-trainable)
    
    func setCalendarRule(calendarName: String, isStressful: Bool, scope: CalendarRule.RuleScope = .all) {
        calendarRules[calendarName] = CalendarRule(
            calendarName: calendarName,
            isStressful: isStressful,
            appliesTo: scope
        )
        saveCalendarRules()
        print("✅ Calendar rule set: \(calendarName) → \(isStressful ? "Stressful" : "Not Stressful")")
    }
    
    func removeCalendarRule(calendarName: String) {
        calendarRules.removeValue(forKey: calendarName)
        saveCalendarRules()
    }
    
    private func saveCalendarRules() {
        if let encoded = try? JSONEncoder().encode(calendarRules) {
            UserDefaults.standard.set(encoded, forKey: "guardian_calendar_rules")
        }
    }
    
    private func loadCalendarRules() {
        if let data = UserDefaults.standard.data(forKey: "guardian_calendar_rules"),
           let decoded = try? JSONDecoder().decode([String: CalendarRule].self, from: data) {
            calendarRules = decoded
        }
    }
    
    // MARK: - Write to Calendar (FEEDBACK: Dedicated Guardian calendar with tagging)
    
    func createGuardianCalendar() -> EKCalendar? {
        // Check if Guardian calendar already exists
        let calendars = eventStore.calendars(for: .event)
        if let existing = calendars.first(where: { $0.title == "Guardian" }) {
            return existing
        }
        
        // Create new Guardian calendar
        let calendar = EKCalendar(for: .event, eventStore: eventStore)
        calendar.title = "Guardian"
        calendar.cgColor = UIColor.purple.cgColor
        calendar.source = eventStore.defaultCalendarForNewEvents?.source
        
        do {
            try eventStore.saveCalendar(calendar, commit: true)
            print("✅ Guardian calendar created")
            return calendar
        } catch {
            print("❌ Failed to create Guardian calendar: \(error)")
            return nil
        }
    }
    
    func writePlaceholderEvent(title: String, startDate: Date, durationMinutes: Int, guardianId: String) async -> Bool {
        guard let guardianCalendar = createGuardianCalendar() else {
            return false
        }
        
        let event = EKEvent(eventStore: eventStore)
        event.title = title
        event.startDate = startDate
        event.endDate = Calendar.current.date(byAdding: .minute, value: durationMinutes, to: startDate)!
        event.calendar = guardianCalendar
        event.notes = "guardian_id=\(guardianId)" // Tag for identification
        
        do {
            try eventStore.save(event, span: .thisEvent, commit: true)
            print("✅ Placeholder event created: \(title)")
            return true
        } catch {
            print("❌ Failed to create event: \(error)")
            return false
        }
    }
}
