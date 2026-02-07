# Guardian iOS - Native Shell + Widgets

Hybrid iOS app wrapping the Guardian web binaural beats experience with native widgets, calendar integration, and health correlation.

## Architecture

**Native Shell + Widget Extensions**
- iOS app wraps existing web UI via WKWebView
- WidgetKit extensions for Home Screen and Lock Screen
- Shared data layer via App Group (`group.com.guardian.shared`)
- EventKit for calendar reading
- HealthKit for body state correlation

## Project Structure

```
guardian-ios/
├── GuardianApp/               # Main iOS app
│   ├── Services/              # Native services
│   │   ├── CalendarService.swift
│   │   ├── HealthKitService.swift
│   │   ├── EventClassifier.swift
│   │   └── IntentOrchestrator.swift
│   ├── State/                 # State management
│   │   └── SharedStore.swift
│   ├── Bridges/               # Web ↔ Native bridge
│   │   ├── WebBridge.swift
│   │   └── DeepLinkHandler.swift
│   ├── Views/
│   │   ├── ContentView.swift
│   │   └── WebViewContainer.swift
│   └── GuardianApp.swift
├── GuardianWidget/            # Widget extension
│   ├── GuardianWidgetBundle.swift
│   ├── HomeScreenWidget.swift
│   ├── LockScreenWidget.swift
│   └── WidgetTimelineProvider.swift
├── GuardianCore/              # Shared models (app + widget)
│   ├── Models.swift
│   ├── GuardianState.swift
│   └── PrivacyEnums.swift
└── guardian-web/              # Existing web app (reference)
    └── test-binaural-beats.html
```

## Two Implementation Paths

### Path A: Simplified Starter (Recommended for Week 1)
Use the copy-paste code in `STARTER_CODE.md` to get widgets working in ~1 hour. Lighter, easier to understand, perfect for learning. Upgrade to full implementation in Week 2.

### Path B: Full Feature Set (All Generated Files)
Use all the generated Swift files for production-ready code with all Week 2 features pre-built. More comprehensive but steeper learning curve.

---

## Setup Instructions

### 1. Create Xcode Project

1. Open Xcode → Create New Project → iOS App
2. Name: `Guardian`
3. Bundle Identifier: `com.guardian.app` (or your choice)
4. Interface: SwiftUI
5. Language: Swift

### 2. Add Widget Extension

1. File → New → Target → Widget Extension
2. Name: `GuardianWidget`
3. Bundle Identifier: `com.guardian.app.GuardianWidget`
4. Include Configuration Intent: **NO**

### 3. Configure App Groups (CRITICAL)

1. Select **Guardian** target → Signing & Capabilities
2. Click `+ Capability` → App Groups
3. Add: `group.com.guardian.shared` (or your custom group ID)
4. Select **GuardianWidget** target → Repeat steps 2-3 with SAME group ID

⚠️ **Common Issue:** Both targets must use the exact same App Group ID or widgets won't see app data.

### 4. Add Frameworks

Select Guardian target → General → Frameworks, Libraries, and Embedded Content:
- EventKit.framework
- HealthKit.framework
- WebKit.framework

### 5. Update Info.plist

Add permission strings:
```xml
<key>NSCalendarsUsageDescription</key>
<string>Guardian needs calendar access to suggest preparation protocols before important events.</string>

<key>NSHealthShareUsageDescription</key>
<string>Guardian uses your health data to detect stress patterns and optimize focus sessions.</string>
```

### 6. Copy Swift Files

Copy all `.swift` files from this directory structure into your Xcode project, maintaining the folder organization.

### 7. Add Web Assets

1. Drag `test-binaural-beats.html` and its assets into the Xcode project
2. Ensure "Copy items if needed" is checked
3. Add to Target: Guardian (not the widget)

## Key Implementation Notes

### Widget Update Strategy (iOS Reality)
- iOS controls actual refresh frequency (not us)
- We provide Timeline entries at 3h, 1h, 15min before events
- `WidgetCenter.reloadTimelines()` when app updates state (opportunistic)
- NO background tasks (BGTaskScheduler) - removed due to complexity
- Live Activities for real-time countdowns = post-MVP feature

### Guardian State File (Single Writer Pattern)
- **iOS native app is the ONLY writer** to `guardian_state.json`
- Stored in App Group **container file** (NOT UserDefaults) for reliability
- Web app requests updates via JS→Native bridge
- Widget is read-only consumer
- Prevents race conditions and corrupted JSON

### Web Integration Timing (MOVED EARLIER)
- Originally Day 11 → Now **Day 2-3**
- Test deeplinks immediately
- Catch routing bugs early
- Verify bridge communication before building complex features

### Health Correlation (FEEDBACK INCORPORATED - SIMPLIFIED)
- MVP focuses on **sleep duration** (most reliable signal)
- Optional: resting HR vs baseline
- Skipped in MVP: HRV, complex correlations, HR-elevated alerts
- Body state badge based on: "Low sleep → lighten today"

### Calendar Write Strategy (FEEDBACK INCORPORATED)
- All placeholder events go to dedicated "Guardian" calendar
- Tag events with `guardian_id=...` in notes field
- User must explicitly approve each calendar write
- Never auto-creates events without approval

### Event Classification (FEEDBACK INCORPORATED)
- Keyword detection for stress indicators
- User can set calendar-level rules: "Always stressful" or "Never stressful"
- User feedback loop improves classification over time

### Deep Link Format (FEEDBACK INCORPORATED)
```
guardian://open?screen=mode&id=deep_work
  ↓
Native receives → WKWebView loads:
file:///.../test-binaural-beats.html#mode=deep_work
  ↓
Web JS reads hash → auto-selects mode
```

## Week 1 Deliverables (YOUR WORK)

**Day 1-2: iOS Project + Calendar**
- [ ] Xcode project created with Widget extension
- [ ] App Groups configured: `group.com.guardian.shared`
- [ ] CalendarAuthorizationManager working (permission flow)
- [ ] CalendarService fetches next 24-72h events
- [ ] Screenshot: Event list displayed in-app

**Day 2-3: Web Integration + Shared Storage** (MOVED EARLIER - catch routing bugs early)
- [ ] Integrate existing Guardian web app (WKWebView wrapper)
- [ ] SharedStore.swift reads/writes to App Group container (file-based, NOT UserDefaults)
- [ ] `guardian_state.json` schema implemented
- [ ] iOS app is ONLY writer (web requests updates via bridge)
- [ ] Test: App writes JSON → Widget reads it back correctly

**Day 3-5: Widget UI Shell**
- [ ] Home Screen widgets: `.systemSmall`, `.systemMedium`
- [ ] Lock Screen widgets: `.accessoryInline`, `.accessoryCircular`, `.accessoryRectangular`
- [ ] Widget displays: event title, countdown, stress indicator, private icons
- [ ] Timeline entries at 3h/1h/15m before events (NO background tasks)
- [ ] `WidgetCenter.reloadTimelines()` when app writes new state
- [ ] Screenshot: All widget families working on device/simulator

## Week 2 Integration (MY WORK)

Once you have the foundation working, I'll build:
- Smart timeline refresh policy
- Stress event classifier with user rules
- Focus Mode protocol mapper
- Privacy orchestrator with AI routing
- HealthKit sleep-based body state
- Deep link router
- Web↔Native bridge
- Full integration testing

## Success Criteria

MVP is complete when:
1. ✅ Widget shows next calendar event with countdown
2. ✅ Private goals show as icons only (no text)
3. ✅ Tap widget → opens Guardian web app to correct mode
4. ✅ Body state badge based on sleep duration
5. ✅ AI suggests items with privacy routing + user approval for calendar writes

## Privacy Architecture

### Three-Tier Routing System

**Tier 1: Public Calendar** (work meetings, appointments)
- Full event title visible
- Written to EventKit in "Guardian" calendar
- Shows in iOS Calendar app

**Tier 2: Busy Placeholder** (timed but sensitive)
- Calendar shows "Focus Block" or "Busy"
- Real title only visible in Guardian app
- Widget shows generic icon

**Tier 3: Private Icons Only** (personal goals, health, habits)
- NEVER touches calendar
- Widget shows emoji/icon only
- Full details only in unlocked app

### AI Planner Contract

```json
{
  "llm_output": {
    "suggested_item": {
      "title_full": "Testosterone injection",
      "title_safe": "Health routine",
      "recommended_surface": "private_only",
      "time_intent": "suggestion",
      "surface_options": ["private_only", "symbol_only"],
      "default_surface": "private_only",
      "reasoning": "medical/personal"
    },
    "requires_user_approval": true
  }
}
```

## Development Commands

```bash
# Build for simulator
xcodebuild -scheme Guardian -destination 'platform=iOS Simulator,name=iPhone 15 Pro'

# Run tests
xcodebuild test -scheme Guardian -destination 'platform=iOS Simulator,name=iPhone 15 Pro'

# Archive for TestFlight
xcodebuild archive -scheme Guardian -archivePath ./build/Guardian.xcarchive
```

## Reference Implementations

These GitHub repos have excellent patterns you can reference:

**Widgets + Families:**
- [pawello2222/WidgetExamples](https://github.com/pawello2222/WidgetExamples) - Comprehensive widget types & SwiftUI patterns
- [wojciech-kulik/WidgetKit-Demo](https://github.com/wojciech-kulik/WidgetKit-Demo) - Timelines + deeplinks
- [tigi44/WidgetKitExample](https://github.com/tigi44/WidgetKitExample) - iOS16+ widget examples

**App Groups / Shared Data:**
- [gfiocco/swiftui-widget-sample](https://github.com/gfiocco/swiftui-widget-sample) - AppStorage + suiteName pattern
- [Flutter HomeWidget iOS example](https://github.com/gskinnerTeam/flutter_home_widget_fork/blob/main/example/ios/HomeWidgetExample/HomeWidgetExample.swift) - Clean App Group file pattern

**EventKit Permissions:**
- [gromb57/ios-wwdc23__AccessingCalendarUsingEventKitAndEventKitUI](https://github.com/gromb57/ios-wwdc23__AccessingCalendarUsingEventKitAndEventKitUI) - Modern iOS 17+ access patterns

**Apple Official:**
- [Apple Fruta Sample](https://github.com/apple-sample-code/FrutaBuildingAFeatureRichAppWithSwiftUI) - Official sample with widgets

## Next Steps

1. Create the Xcode project following setup instructions
2. Configure App Groups: `group.com.guardian.shared`
3. Start implementing CalendarService.swift (use the template file)
4. Test calendar permission flow
5. Integrate web app early (Day 2-3) to catch routing issues
6. Report back with screenshot of calendar events list

Need help at any step? Check the inline comments in each Swift file or ask for clarification.
