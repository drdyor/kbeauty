import Foundation

// MARK: - Guardian State Schema
// This is the single source of truth for the widget
// ONLY written by iOS native app (never by web)

struct GuardianState: Codable {
    let nextEvent: CalendarEvent?
    let privateTiles: [PrivateTile]
    let suggestedAction: SuggestedAction?
    let bodyState: BodyState?
    let updatedAt: Date
    
    // Current active session (if any)
    let activeSession: ActiveSession?
}

// MARK: - Calendar Event Model

struct CalendarEvent: Codable, Identifiable {
    let id: String
    let title: String
    let startDate: Date
    let endDate: Date
    let isStressful: Bool
    let confidenceScore: Double // 0.0 to 1.0
    let privacyTier: PrivacyTier
    let suggestedFocusMode: String? // e.g., "deep_work", "calm"
    let preparationTime: TimeInterval? // seconds before event
    
    // For widget display
    var displayTitle: String {
        switch privacyTier {
        case .publicCalendar:
            return title
        case .busyPlaceholder:
            return "Focus Block"
        case .privateOnly:
            return "" // Icon only
        }
    }
    
    var countdownText: String {
        let interval = startDate.timeIntervalSinceNow
        if interval < 0 { return "In progress" }
        
        let hours = Int(interval) / 3600
        let minutes = (Int(interval) % 3600) / 60
        
        if hours > 0 {
            return "in \(hours)h \(minutes)m"
        } else if minutes > 0 {
            return "in \(minutes)m"
        } else {
            return "Soon"
        }
    }
}

// MARK: - Privacy Enums

enum PrivacyTier: String, Codable {
    case publicCalendar    // Full title visible, written to calendar
    case busyPlaceholder   // Generic title, real title in app only
    case privateOnly       // Icon only, never touches calendar
}

enum SurfaceOption: String, Codable {
    case privateOnly = "private_only"
    case symbolOnly = "symbol_only"
    case busyPlaceholder = "busy_placeholder"
    case calendarEvent = "calendar_event"
}

// MARK: - Private Tile Model

struct PrivateTile: Codable, Identifiable {
    let id: String
    let icon: String // Emoji
    let timeIntent: TimeIntent?
    let frequencyText: String? // e.g., "Daily", "3x/week"
    let lastCompleted: Date?
    
    enum TimeIntent: String, Codable {
        case none
        case suggestion   // AI suggested but not scheduled
        case explicit     // User set specific time
    }
}

// MARK: - Suggested Action Model

struct SuggestedAction: Codable {
    let id: String
    let titleFull: String
    let titleSafe: String
    let recommendedSurface: SurfaceOption
    let timeIntent: String
    let reasoning: String
    let requiresUserApproval: Bool
    let suggestedTime: Date?
}

// MARK: - Body State Model

struct BodyState: Codable {
    let lastUpdated: Date
    let sleepDuration: TimeInterval? // seconds
    let sleepQuality: SleepQuality?
    let restingHR: Int?
    let restingHRBaseline: Int?
    let recommendation: String
    let badgeText: String // For widget display
    let badgeColor: String // hex color
    
    enum SleepQuality: String, Codable {
        case good
        case fair
        case poor
        case unknown
    }
    
    // Compute simple body state
    static func compute(sleepHours: Double?, restingHR: Int?, baseline: Int?) -> BodyState {
        var recommendation = "Normal energy"
        var badgeText = "😊"
        var badgeColor = "#10b981" // green
        
        if let hours = sleepHours {
            if hours < 6 {
                recommendation = "Low sleep detected. Consider lighter focus modes."
                badgeText = "😴"
                badgeColor = "#ef4444" // red
            } else if hours < 7 {
                recommendation = "Moderate rest. Pacing recommended."
                badgeText = "🙂"
                badgeColor = "#f59e0b" // amber
            } else {
                recommendation = "Well rested. Full capacity available."
                badgeText = "😊"
                badgeColor = "#10b981" // green
            }
        }
        
        // Optional: Adjust based on resting HR
        if let hr = restingHR, let base = baseline, hr > base + 10 {
            recommendation += " Elevated HR detected."
            badgeText = "⚡"
            badgeColor = "#f59e0b" // amber
        }
        
        return BodyState(
            lastUpdated: Date(),
            sleepDuration: sleepHours.map { $0 * 3600 },
            sleepQuality: sleepHours.map { hours in
                if hours >= 7 { return .good }
                if hours >= 6 { return .fair }
                return .poor
            },
            restingHR: restingHR,
            restingHRBaseline: baseline,
            recommendation: recommendation,
            badgeText: badgeText,
            badgeColor: badgeColor
        )
    }
}

// MARK: - Active Session Model

struct ActiveSession: Codable {
    let sessionId: String
    let focusMode: String
    let focusModeLabel: String
    let startedAt: Date
    let plannedDuration: TimeInterval // seconds
    let primerUsed: Bool
    let primerId: String?
    
    var remainingTime: TimeInterval {
        let elapsed = Date().timeIntervalSince(startedAt)
        return max(0, plannedDuration - elapsed)
    }
    
    var progressPercentage: Double {
        let elapsed = Date().timeIntervalSince(startedAt)
        return min(100, (elapsed / plannedDuration) * 100)
    }
}

// MARK: - Event Classification Models

struct StressKeyword: Codable {
    let keyword: String
    let weight: Double
    let category: String
}

struct CalendarRule: Codable {
    let calendarName: String
    let isStressful: Bool // true = always stressful, false = never stressful
    let appliesTo: RuleScope
    
    enum RuleScope: String, Codable {
        case all
        case keywordMatch // only if keywords also match
    }
}

// MARK: - Helper Extensions

extension Date {
    var isToday: Bool {
        Calendar.current.isDateInToday(self)
    }
    
    var isWithinNext24Hours: Bool {
        let now = Date()
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: now)!
        return self > now && self < tomorrow
    }
    
    func hoursUntil() -> Double {
        return self.timeIntervalSinceNow / 3600
    }
}
