import Foundation
import WebKit

// MARK: - Web Bridge
// Bidirectional communication between WKWebView (web app) and native iOS

class WebBridge: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    private let store = SharedStore.shared
    
    // MARK: - Initialize Bridge
    
    func setupBridge(for webView: WKWebView) {
        self.webView = webView
        
        // Register message handlers for web → native communication
        let contentController = webView.configuration.userContentController
        contentController.add(self, name: "guardianBridge")
        
        print("✅ Web bridge initialized")
    }
    
    // MARK: - Receive Messages from Web (Web → Native)
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "guardianBridge",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            return
        }
        
        print("📨 Web → Native: \(action)")
        
        switch action {
        case "sessionStarted":
            handleSessionStarted(body)
        case "sessionEnded":
            handleSessionEnded(body)
        case "requestStateUpdate":
            sendStateToWeb()
        case "updatePrivateTile":
            handlePrivateTileUpdate(body)
        case "logEvent":
            handleLogEvent(body)
        default:
            print("⚠️ Unknown action: \(action)")
        }
    }
    
    // MARK: - Handle Web Actions
    
    private func handleSessionStarted(_ data: [String: Any]) {
        guard let sessionId = data["sessionId"] as? String,
              let focusMode = data["focusMode"] as? String,
              let label = data["label"] as? String,
              let duration = data["plannedDuration"] as? Double else {
            return
        }
        
        let session = ActiveSession(
            sessionId: sessionId,
            focusMode: focusMode,
            focusModeLabel: label,
            startedAt: Date(),
            plannedDuration: duration,
            primerUsed: data["primerUsed"] as? Bool ?? false,
            primerId: data["primerId"] as? String
        )
        
        store.updateActiveSession(session)
        print("✅ Session started: \(label)")
    }
    
    private func handleSessionEnded(_ data: [String: Any]) {
        store.updateActiveSession(nil)
        print("✅ Session ended")
    }
    
    private func handlePrivateTileUpdate(_ data: [String: Any]) {
        guard let tileId = data["id"] as? String,
              let icon = data["icon"] as? String else {
            return
        }
        
        let tile = PrivateTile(
            id: tileId,
            icon: icon,
            timeIntent: nil,
            frequencyText: data["frequency"] as? String,
            lastCompleted: data["lastCompleted"] as? Date
        )
        
        store.addPrivateTile(tile)
        print("✅ Private tile updated: \(icon)")
    }
    
    private func handleLogEvent(_ data: [String: Any]) {
        // Forward analytics to native tracking if needed
        print("📊 Event logged: \(data["eventType"] ?? "unknown")")
    }
    
    // MARK: - Send Messages to Web (Native → Web)
    
    func sendStateToWeb() {
        guard let webView = webView,
              let state = store.readState() else {
            return
        }
        
        // Convert state to JSON
        guard let jsonData = try? JSONEncoder().encode(state),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            return
        }
        
        // Inject state into web app
        let javascript = """
        if (window.guardianStateReceiver) {
            window.guardianStateReceiver(\(jsonString));
        }
        """
        
        webView.evaluateJavaScript(javascript) { _, error in
            if let error = error {
                print("❌ Failed to send state to web: \(error)")
            } else {
                print("✅ State sent to web")
            }
        }
    }
    
    func triggerModeSelection(_ modeId: String) {
        guard let webView = webView else { return }
        
        let javascript = """
        if (window.selectMode) {
            window.selectMode('\(modeId)');
        }
        """
        
        webView.evaluateJavaScript(javascript) { _, error in
            if let error = error {
                print("❌ Failed to trigger mode: \(error)")
            } else {
                print("✅ Mode triggered: \(modeId)")
            }
        }
    }
    
    // MARK: - Inject Bridge JavaScript (Add to web app)
    
    func getBridgeScript() -> String {
        return """
        // Guardian Native Bridge (injected by iOS)
        window.guardianNative = {
            postMessage: function(action, data) {
                window.webkit.messageHandlers.guardianBridge.postMessage({
                    action: action,
                    ...data
                });
            },
            
            sessionStarted: function(sessionId, focusMode, label, duration, primerUsed, primerId) {
                this.postMessage('sessionStarted', {
                    sessionId: sessionId,
                    focusMode: focusMode,
                    label: label,
                    plannedDuration: duration,
                    primerUsed: primerUsed,
                    primerId: primerId
                });
            },
            
            sessionEnded: function(sessionId) {
                this.postMessage('sessionEnded', { sessionId: sessionId });
            },
            
            updatePrivateTile: function(id, icon, frequency, lastCompleted) {
                this.postMessage('updatePrivateTile', {
                    id: id,
                    icon: icon,
                    frequency: frequency,
                    lastCompleted: lastCompleted
                });
            },
            
            requestState: function() {
                this.postMessage('requestStateUpdate', {});
            }
        };
        
        // Listen for mode changes from deep links
        window.guardianStateReceiver = function(state) {
            console.log('📱 Received state from native:', state);
            // Your web app can use this state to update UI
        };
        
        // Check for deep link mode on load
        window.addEventListener('load', function() {
            const hash = window.location.hash;
            if (hash.startsWith('#mode=')) {
                const modeId = hash.substring(6);
                if (window.selectMode) {
                    window.selectMode(modeId);
                }
            }
        });
        
        console.log('✅ Guardian native bridge loaded');
        """
    }
}
