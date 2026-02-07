import Foundation
import SwiftUI

// MARK: - Deep Link Handler
// Format: guardian://open?screen=mode&id=deep_work
// Native converts to: file:///.../test-binaural-beats.html#mode=deep_work

class DeepLinkHandler: ObservableObject {
    @Published var pendingModeId: String?
    
    func handle(url: URL) {
        print("🔗 Deep link received: \(url)")
        
        guard url.scheme == "guardian",
              url.host == "open",
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let queryItems = components.queryItems else {
            print("⚠️ Invalid deep link format")
            return
        }
        
        // Parse query parameters
        let params = queryItems.reduce(into: [String: String]()) { dict, item in
            dict[item.name] = item.value
        }
        
        guard let screen = params["screen"], screen == "mode",
              let modeId = params["id"] else {
            print("⚠️ Missing required parameters")
            return
        }
        
        // Store pending mode for web view to consume
        pendingModeId = modeId
        print("✅ Mode selection pending: \(modeId)")
    }
    
    func consumePendingMode() -> String? {
        defer { pendingModeId = nil }
        return pendingModeId
    }
    
    // MARK: - Generate Deep Links (for widgets)
    
    static func makeModeLink(modeId: String) -> URL {
        return URL(string: "guardian://open?screen=mode&id=\(modeId)")!
    }
    
    static func makeSessionResumeLink() -> URL {
        return URL(string: "guardian://open?screen=session&action=resume")!
    }
}
