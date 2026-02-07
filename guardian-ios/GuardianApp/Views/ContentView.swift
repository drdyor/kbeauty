import SwiftUI
import EventKit
import HealthKit

struct ContentView: View {
    @StateObject private var calendarService = CalendarService()
    @StateObject private var healthService = HealthKitService()
    @StateObject private var deepLinkHandler = DeepLinkHandler()
    
    @State private var showPermissionSheet = false
    @State private var isInitialized = false
    
    var body: some View {
        ZStack {
            if isInitialized {
                WebViewContainer(
                    deepLinkHandler: deepLinkHandler,
                    calendarService: calendarService,
                    healthService: healthService
                )
            } else {
                PermissionView(
                    calendarService: calendarService,
                    healthService: healthService,
                    onComplete: {
                        isInitialized = true
                        startBackgroundUpdates()
                    }
                )
            }
        }
        .onAppear {
            checkInitialPermissions()
        }
        .onOpenURL { url in
            deepLinkHandler.handle(url: url)
        }
    }
    
    private func checkInitialPermissions() {
        let hasCalendar = calendarService.authorizationStatus == .authorized || 
                         calendarService.authorizationStatus == .fullAccess
        let hasHealth = healthService.authorizationStatus
        
        isInitialized = hasCalendar // Health is optional
    }
    
    private func startBackgroundUpdates() {
        // Fetch initial data
        Task {
            // Calendar events
            let events = await calendarService.fetchUpcomingEvents(hours: 72)
            if let nextEvent = events.first {
                SharedStore.shared.updateNextEvent(nextEvent)
            }
            
            // Health data
            if healthService.authorizationStatus {
                let bodyState = await healthService.computeBodyState()
                SharedStore.shared.updateBodyState(bodyState)
            }
            
            print("✅ Initial data loaded")
        }
        
        // Schedule periodic updates (every 15 minutes when app is active)
        Timer.scheduledTimer(withTimeInterval: 900, repeats: true) { _ in
            Task {
                await refreshData()
            }
        }
    }
    
    private func refreshData() async {
        let events = await calendarService.fetchUpcomingEvents(hours: 72)
        if let nextEvent = events.first {
            SharedStore.shared.updateNextEvent(nextEvent)
        }
        
        if healthService.authorizationStatus {
            let bodyState = await healthService.computeBodyState()
            SharedStore.shared.updateBodyState(bodyState)
        }
    }
}

// MARK: - Permission View

struct PermissionView: View {
    let calendarService: CalendarService
    let healthService: HealthKitService
    let onComplete: () -> Void
    
    @State private var calendarGranted = false
    @State private var healthGranted = false
    @State private var isRequesting = false
    
    var body: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // Logo/Icon
            Text("🎧")
                .font(.system(size: 80))
            
            Text("Guardian")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(Color(hex: "#a591ff"))
            
            Text("Focus • Calendar • Wellness")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(Color(hex: "#8b839a"))
            
            Spacer()
            
            VStack(spacing: 20) {
                PermissionCard(
                    icon: "📅",
                    title: "Calendar Access",
                    description: "Prepare for important events with timed focus protocols",
                    granted: calendarGranted
                )
                
                PermissionCard(
                    icon: "❤️",
                    title: "Health Data (Optional)",
                    description: "Optimize focus sessions based on sleep and recovery",
                    granted: healthGranted
                )
            }
            .padding(.horizontal, 20)
            
            Spacer()
            
            Button(action: {
                Task {
                    await requestPermissions()
                }
            }) {
                HStack {
                    if isRequesting {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Get Started")
                            .font(.system(size: 16, weight: .semibold))
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color(hex: "#a591ff"))
                .foregroundColor(.white)
                .cornerRadius(25)
            }
            .disabled(isRequesting)
            .padding(.horizontal, 40)
            .padding(.bottom, 40)
        }
        .background(
            LinearGradient(
                colors: [Color(hex: "#fce7f3"), Color(hex: "#e9d5ff")],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
        )
    }
    
    private func requestPermissions() async {
        isRequesting = true
        
        // Request calendar (required)
        calendarGranted = await calendarService.requestAccess()
        
        // Request health (optional)
        healthGranted = await healthService.requestAuthorization()
        
        isRequesting = false
        
        if calendarGranted {
            onComplete()
        }
    }
}

struct PermissionCard: View {
    let icon: String
    let title: String
    let description: String
    let granted: Bool
    
    var body: some View {
        HStack(spacing: 15) {
            Text(icon)
                .font(.system(size: 40))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(hex: "#4c1d95"))
                
                Text(description)
                    .font(.system(size: 12))
                    .foregroundColor(Color(hex: "#8b839a"))
                    .multilineTextAlignment(.leading)
            }
            
            Spacer()
            
            if granted {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            }
        }
        .padding(16)
        .background(Color.white.opacity(0.7))
        .cornerRadius(16)
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
