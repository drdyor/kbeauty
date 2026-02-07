import Foundation

// MARK: - Intent Orchestrator
// AI-powered planning with privacy routing
// Uses OpenRouter API with strict privacy contract

class IntentOrchestrator {
    
    private let openRouterAPIKey: String
    private let modelName = "anthropic/claude-3.5-sonnet" // or whatever you prefer
    private let calendarService: CalendarService
    
    init(apiKey: String, calendarService: CalendarService) {
        self.openRouterAPIKey = apiKey
        self.calendarService = calendarService
    }
    
    // MARK: - Privacy Contract (FEEDBACK: Strict JSON contract)
    
    struct AIRequest: Codable {
        let userPrompt: String
        let currentContext: Context
        
        struct Context: Codable {
            let existingEvents: [String]
            let privateTileCount: Int
            let bodyState: String?
        }
    }
    
    struct AIResponse: Codable {
        let suggestedItem: SuggestedItem
        let requiresUserApproval: Bool
        
        struct SuggestedItem: Codable {
            let titleFull: String
            let titleSafe: String
            let recommendedSurface: String // "private_only", "symbol_only", "busy_placeholder", "calendar_event"
            let timeIntent: String // "none", "suggestion", "explicit"
            let surfaceOptions: [String]
            let defaultSurface: String
            let reasoning: String
            let suggestedTime: Date?
        }
    }
    
    // MARK: - AI Planning with Privacy Rules
    
    func suggestItem(userPrompt: String, context: AIRequest.Context) async -> SuggestedAction? {
        let systemPrompt = """
        You are a privacy-first planning assistant for Guardian, a focus and wellness app.
        
        Your job is to classify user requests into one of four surfaces:
        1. **calendar_event**: Public work meetings, appointments (safe to show in shared calendar)
        2. **busy_placeholder**: Timed events that are sensitive (show as "Focus Block")
        3. **symbol_only**: Private habits/goals with emoji representation only
        4. **private_only**: Highly sensitive personal items (medical, therapy, relationships)
        
        CRITICAL PRIVACY RULES:
        - Medical, health, therapy, personal relationships → ALWAYS "private_only"
        - Hormones, medication, intimate habits → ALWAYS "private_only" or "symbol_only"
        - Work meetings, public appointments → "calendar_event"
        - Personal projects, creative time → "busy_placeholder"
        
        Respond ONLY with valid JSON matching the AIResponse schema.
        Always set requiresUserApproval: true for calendar writes.
        
        Example:
        {
          "suggestedItem": {
            "titleFull": "Testosterone injection",
            "titleSafe": "Health routine",
            "recommendedSurface": "private_only",
            "timeIntent": "suggestion",
            "surfaceOptions": ["private_only", "symbol_only"],
            "defaultSurface": "private_only",
            "reasoning": "Medical/hormonal activity must remain fully private",
            "suggestedTime": null
          },
          "requiresUserApproval": true
        }
        """
        
        let request = AIRequest(userPrompt: userPrompt, currentContext: context)
        
        guard let requestData = try? JSONEncoder().encode(request),
              let requestJSON = String(data: requestData, encoding: .utf8) else {
            return nil
        }
        
        let payload: [String: Any] = [
            "model": modelName,
            "messages": [
                ["role": "system", "content": systemPrompt],
                ["role": "user", "content": requestJSON]
            ],
            "temperature": 0.3, // Low temp for consistent classification
            "max_tokens": 500
        ]
        
        guard let response = try? await sendOpenRouterRequest(payload: payload) else {
            return nil
        }
        
        // Parse AI response and convert to SuggestedAction
        return convertToSuggestedAction(response)
    }
    
    // MARK: - OpenRouter API Call
    
    private func sendOpenRouterRequest(payload: [String: Any]) async throws -> AIResponse {
        let url = URL(string: "https://openrouter.ai/api/v1/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(openRouterAPIKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        // Parse OpenRouter response
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let choices = json["choices"] as? [[String: Any]],
              let firstChoice = choices.first,
              let message = firstChoice["message"] as? [String: Any],
              let content = message["content"] as? String,
              let contentData = content.data(using: .utf8) else {
            throw NSError(domain: "OpenRouter", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(AIResponse.self, from: contentData)
    }
    
    // MARK: - Convert to SuggestedAction Model
    
    private func convertToSuggestedAction(_ response: AIResponse) -> SuggestedAction {
        let item = response.suggestedItem
        
        let surface: SurfaceOption = {
            switch item.recommendedSurface {
            case "calendar_event": return .calendarEvent
            case "busy_placeholder": return .busyPlaceholder
            case "symbol_only": return .symbolOnly
            default: return .privateOnly
            }
        }()
        
        return SuggestedAction(
            id: UUID().uuidString,
            titleFull: item.titleFull,
            titleSafe: item.titleSafe,
            recommendedSurface: surface,
            timeIntent: item.timeIntent,
            reasoning: item.reasoning,
            requiresUserApproval: response.requiresUserApproval,
            suggestedTime: item.suggestedTime
        )
    }
    
    // MARK: - Execute Action (User Approved)
    
    func executeAction(_ action: SuggestedAction) async -> Bool {
        switch action.recommendedSurface {
        case .calendarEvent:
            // Write to Guardian calendar
            guard let time = action.suggestedTime else { return false }
            return await calendarService.writePlaceholderEvent(
                title: action.titleFull,
                startDate: time,
                durationMinutes: 30,
                guardianId: action.id
            )
            
        case .busyPlaceholder:
            // Write placeholder to calendar
            guard let time = action.suggestedTime else { return false }
            return await calendarService.writePlaceholderEvent(
                title: "Focus Block",
                startDate: time,
                durationMinutes: 30,
                guardianId: action.id
            )
            
        case .privateOnly, .symbolOnly:
            // Add to private tiles only
            let tile = PrivateTile(
                id: action.id,
                icon: extractEmoji(from: action.titleFull),
                timeIntent: action.timeIntent == "explicit" ? .explicit : .suggestion,
                frequencyText: nil,
                lastCompleted: nil
            )
            SharedStore.shared.addPrivateTile(tile)
            return true
        }
    }
    
    // MARK: - Helper
    
    private func extractEmoji(from text: String) -> String {
        // Simple emoji extraction (first emoji found)
        let emojiPattern = "[\\p{Emoji_Presentation}\\p{Emoji}\\uFE0F]"
        if let regex = try? NSRegularExpression(pattern: emojiPattern),
           let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) {
            return String(text[Range(match.range, in: text)!])
        }
        return "📌" // Default icon
    }
}
