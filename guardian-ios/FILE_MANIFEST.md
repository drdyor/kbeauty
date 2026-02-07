# Guardian iOS - Complete File Manifest

## All Files Created (Total: 20)

### 📁 Documentation (5 files)

```
guardian-ios/
├── README.md                          ✅ Main setup guide with architecture overview
├── QUICK_START.md                     ✅ 5-minute overview for busy developers
├── INTEGRATION_GUIDE.md               ✅ Detailed integration walkthrough
├── WEB_MODIFICATIONS.md               ✅ Exact web app code changes needed
├── IMPLEMENTATION_COMPLETE.md         ✅ Comprehensive summary (what's done, next steps)
└── FILE_MANIFEST.md                   ✅ This file (complete inventory)
```

### 📁 GuardianCore (1 file) - Shared Models

Used by both main app and widget extension.

```
GuardianCore/
└── Models.swift                       ✅ 336 lines
    ├── GuardianState (main state schema)
    ├── CalendarEvent (with privacy tiers)
    ├── PrivacyTier enum (public/busy/private)
    ├── SurfaceOption enum (calendar/placeholder/symbol/private)
    ├── PrivateTile (icon-only private goals)
    ├── SuggestedAction (AI-generated items)
    ├── BodyState (sleep + HR tracking)
    ├── ActiveSession (current focus session)
    ├── StressKeyword (event classification)
    ├── CalendarRule (user-trainable rules)
    └── Helper extensions (Date utilities)
```

### 📁 GuardianApp (10 files) - Main iOS Application

#### App Entry Point
```
GuardianApp/
├── GuardianApp.swift                  ✅ 11 lines (main app entry)
```

#### Views (2 files)
```
├── Views/
│   ├── ContentView.swift              ✅ 143 lines
│   │   ├── Permission flow (calendar + health)
│   │   ├── PermissionView component
│   │   ├── PermissionCard component
│   │   └── Color hex extension
│   └── WebViewContainer.swift         ✅ 55 lines
│       ├── WKWebView wrapper
│       ├── Bridge script injection
│       └── Deep link handler integration
```

#### Services (4 files)
```
├── Services/
│   ├── CalendarService.swift          ✅ 227 lines
│   │   ├── EventKit authorization
│   │   ├── Fetch events (next 24-72h)
│   │   ├── Stress analysis (keyword detection)
│   │   ├── Privacy tier determination
│   │   ├── Focus mode suggestion
│   │   ├── Calendar rule management (user-trainable)
│   │   ├── Guardian calendar creation
│   │   └── Placeholder event writing
│   ├── HealthKitService.swift         ✅ 177 lines
│   │   ├── HealthKit authorization
│   │   ├── Fetch sleep duration (last night)
│   │   ├── Fetch resting HR (optional)
│   │   ├── Compute body state (simple MVP logic)
│   │   └── Calculate HR baseline (7-day avg)
│   ├── EventClassifier.swift          ✅ 109 lines
│   │   ├── PreparationProtocol struct
│   │   ├── Generate 3h/1h/15m timeline
│   │   ├── Map events to Focus Modes
│   │   ├── Get next preparation step
│   │   └── Widget display text generation
│   └── IntentOrchestrator.swift       ✅ 161 lines
│       ├── OpenRouter API integration
│       ├── Privacy contract (JSON schema)
│       ├── AI request/response models
│       ├── Suggest item with privacy rules
│       ├── Execute action (calendar/private)
│       └── Emoji extraction helper
```

#### State Management (1 file)
```
├── State/
│   └── SharedStore.swift              ✅ 128 lines
│       ├── App Group file URL management
│       ├── Write guardian_state.json (ONLY iOS native)
│       ├── Read state (all components)
│       ├── Notify widgets on update
│       ├── Quick update methods
│       └── Debug state printer
```

#### Bridges (2 files)
```
└── Bridges/
    ├── WebBridge.swift                ✅ 149 lines
    │   ├── WKScriptMessageHandler implementation
    │   ├── Receive messages from web (sessionStarted, etc.)
    │   ├── Send messages to web (state updates)
    │   ├── Trigger mode selection from native
    │   └── Bridge JavaScript injection script
    └── DeepLinkHandler.swift          ✅ 46 lines
        ├── Parse deep link URLs
        ├── Extract mode parameters
        ├── Store pending mode
        └── Generate deep link URLs for widgets
```

### 📁 GuardianWidget (4 files) - Widget Extension

```
GuardianWidget/
├── GuardianWidgetBundle.swift         ✅ 10 lines
│   └── Register HomeScreenWidget + LockScreenWidget
├── WidgetTimelineProvider.swift       ✅ 82 lines
│   ├── TimelineProvider implementation
│   ├── Generate timeline entries at 3h/1h/15m before events
│   ├── Placeholder state
│   └── GuardianEntry model
├── HomeScreenWidget.swift             ✅ 239 lines
│   ├── Widget configuration
│   ├── HomeScreenWidgetView (family switcher)
│   ├── SmallWidgetView (compact event/session display)
│   ├── MediumWidgetView (event + private tiles)
│   └── Deep link generation
└── LockScreenWidget.swift             ✅ 199 lines
    ├── Widget configuration
    ├── LockScreenWidgetView (family switcher)
    ├── InlineWidgetView (lock screen top)
    ├── CircularWidgetView (lock screen circular)
    ├── RectangularWidgetView (lock screen rectangular)
    └── Deep link generation
```

## File Statistics

| Category | Files | Total Lines | Purpose |
|----------|-------|-------------|---------|
| Documentation | 6 | ~2,000 | Setup guides, integration docs |
| Models | 1 | 336 | Shared data structures |
| App Views | 3 | 209 | SwiftUI views + entry point |
| Services | 4 | 674 | Calendar, Health, Classification, AI |
| State | 1 | 128 | App Group storage management |
| Bridges | 2 | 195 | Web↔Native, Deep links |
| Widgets | 4 | 530 | Home + Lock screen widgets |
| **TOTAL** | **21** | **~4,072** | **Complete iOS infrastructure** |

## What Each File Does (One-Line Summary)

| File | One-Line Purpose |
|------|------------------|
| `README.md` | Master setup guide with architecture diagrams |
| `QUICK_START.md` | 5-minute overview for fast onboarding |
| `INTEGRATION_GUIDE.md` | Step-by-step integration walkthrough |
| `WEB_MODIFICATIONS.md` | Exact code changes for web app |
| `IMPLEMENTATION_COMPLETE.md` | What's done, what's next, deliverables |
| `FILE_MANIFEST.md` | This inventory of all files |
| `Models.swift` | All data structures (state, events, tiles, body state) |
| `GuardianApp.swift` | iOS app entry point |
| `ContentView.swift` | Permission flow + main container |
| `WebViewContainer.swift` | WKWebView wrapper with bridge |
| `CalendarService.swift` | EventKit + stress detection + calendar writing |
| `HealthKitService.swift` | Sleep tracking + resting HR |
| `EventClassifier.swift` | Event → Focus Mode protocol mapper |
| `IntentOrchestrator.swift` | AI planning with OpenRouter + privacy |
| `SharedStore.swift` | App Group state management (ONLY writer) |
| `WebBridge.swift` | Bidirectional web ↔ native communication |
| `DeepLinkHandler.swift` | Parse & generate deep links |
| `GuardianWidgetBundle.swift` | Widget registration |
| `WidgetTimelineProvider.swift` | Timeline-based refresh strategy |
| `HomeScreenWidget.swift` | Small + Medium home screen widgets |
| `LockScreenWidget.swift` | Inline + Circular + Rectangular widgets |

## Key Architectural Patterns Used

1. **Single Writer Pattern**: Only iOS native writes guardian_state.json
2. **Timeline Provider Pattern**: Widgets refresh at strategic times (no background)
3. **Bridge Pattern**: Web ↔ Native communication via WKScriptMessageHandler
4. **Privacy First Pattern**: Three-tier routing (public/busy/private)
5. **User Trainable Pattern**: Calendar rules override keyword detection
6. **App Group Pattern**: Shared container for app + widget data

## Files You Need to Modify

Only **ONE** file needs manual editing:

| File | What to Change |
|------|----------------|
| `test-binaural-beats.html` | Add 4 code blocks (see `WEB_MODIFICATIONS.md`) |

Everything else is **copy-paste ready**.

## Dependencies

| Framework | Purpose | Required? |
|-----------|---------|-----------|
| SwiftUI | UI framework | ✅ Built-in |
| WebKit | WKWebView | ✅ Built-in |
| WidgetKit | Widgets | ✅ Built-in |
| EventKit | Calendar access | ✅ Add manually |
| HealthKit | Health data | ✅ Add manually |

## Build Configuration Requirements

| Setting | Value |
|---------|-------|
| iOS Deployment Target | 16.0+ |
| App Groups | `group.com.guardian.shared` |
| URL Scheme | `guardian://` |
| Permissions | Calendar (required), Health (optional) |

## Testing Checklist

Use this to verify all files are working:

### Unit Level
- [ ] Models.swift compiles without errors
- [ ] SharedStore.swift writes/reads JSON correctly
- [ ] CalendarService.swift fetches events
- [ ] HealthKitService.swift computes body state
- [ ] WebBridge.swift injects script
- [ ] DeepLinkHandler.swift parses URLs

### Integration Level
- [ ] ContentView shows permission flow
- [ ] WebViewContainer loads web app
- [ ] CalendarService → SharedStore → Widget pipeline
- [ ] HealthKitService → SharedStore → Widget pipeline
- [ ] Web app calls native via bridge
- [ ] Native triggers web mode selection

### Widget Level
- [ ] HomeScreenWidget Small displays correctly
- [ ] HomeScreenWidget Medium displays correctly
- [ ] LockScreenWidget Inline displays correctly
- [ ] LockScreenWidget Circular displays correctly
- [ ] LockScreenWidget Rectangular displays correctly
- [ ] Timeline refreshes at strategic times

### End-to-End
- [ ] Widget tap opens app to correct mode
- [ ] Session start updates widget
- [ ] Calendar event triggers preparation protocol
- [ ] Body state badge appears in widget
- [ ] Private tiles show as icons only

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-05 | 1.0 | Initial implementation with all feedback incorporated |

## File Ownership

| Component | Who Codes | Status |
|-----------|-----------|--------|
| Swift files | AI (completed) | ✅ Done |
| Documentation | AI (completed) | ✅ Done |
| Xcode project | User (pending) | ⏳ Week 1 |
| Web modifications | User (pending) | ⏳ Week 1 |
| TestFlight deploy | User (pending) | ⏳ Week 2 |

## What's NOT Included (Intentionally)

These were scope-cut based on feedback:

- ❌ Background tasks (BGTaskScheduler) - complexity risk
- ❌ Live Activities - post-MVP feature
- ❌ HRV tracking - inconsistent data
- ❌ Complex HR correlations - false positive risk
- ❌ HealthKit writes (mindfulness minutes) - not MVP critical
- ❌ Xcode project file (.xcodeproj) - user creates this

## Quick Navigation

Looking for something specific?

| I want to... | Go to... |
|--------------|----------|
| Set up Xcode project | `README.md` |
| Understand architecture | `README.md` or `IMPLEMENTATION_COMPLETE.md` |
| Modify web app | `WEB_MODIFICATIONS.md` |
| Debug integration | `INTEGRATION_GUIDE.md` |
| Find a specific model | `GuardianCore/Models.swift` |
| Understand widgets | `GuardianWidget/` folder |
| Add AI features | `IntentOrchestrator.swift` |
| Configure calendar | `CalendarService.swift` |
| Manage state | `SharedStore.swift` |

## Support

Stuck? Check:
1. Inline comments in Swift files (all have detailed explanations)
2. `INTEGRATION_GUIDE.md` Common Issues section
3. Console output (all services log their actions)

## Ready to Build?

1. Read `QUICK_START.md` (5 min)
2. Follow `README.md` setup (45 min)
3. Apply `WEB_MODIFICATIONS.md` changes (10 min)
4. Build & test (20 min)

**You're 80 minutes away from a working iOS app with widgets. Let's go! 🚀**
