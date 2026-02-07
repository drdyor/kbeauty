import SwiftUI
import WebKit
import UIKit

struct WebViewContainer: UIViewRepresentable {
    let deepLinkHandler: DeepLinkHandler
    let calendarService: CalendarService
    let healthService: HealthKitService
    
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        
        // Setup bridge
        let bridge = WebBridge()
        bridge.setupBridge(for: webView)
        
        // Store bridge in context
        context.coordinator.bridge = bridge
        
        // Inject bridge JavaScript
        let bridgeScript = WKUserScript(
            source: bridge.getBridgeScript(),
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        webView.configuration.userContentController.addUserScript(bridgeScript)
        
        // Load web app
        if let htmlPath = Bundle.main.path(forResource: "test-binaural-beats", ofType: "html") {
            let htmlURL = URL(fileURLWithPath: htmlPath)
            let htmlDirectory = htmlURL.deletingLastPathComponent()
            webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlDirectory)
            print("✅ Web app loaded: \(htmlPath)")
        } else {
            print("❌ Could not find test-binaural-beats.html")
        }
        
        return webView
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {
        // Handle deep link if pending
        if let modeId = deepLinkHandler.consumePendingMode() {
            context.coordinator.bridge?.triggerModeSelection(modeId)
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    class Coordinator {
        var bridge: WebBridge?
    }
}
