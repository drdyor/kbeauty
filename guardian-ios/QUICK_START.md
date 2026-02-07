# Guardian iOS - Quick Start (5-Minute Overview)

## What Is This?

A **native iOS app + widgets** that wraps your existing Guardian web app, adding:
- 📅 Calendar integration (preparation protocols before events)
- ❤️ Health tracking (sleep-based body state)
- 🔔 Widgets (Home Screen + Lock Screen)
- 🤖 AI planning (privacy-first with OpenRouter)

## Architecture

```
┌─────────────────────────────────────┐
│   iOS Native Shell (SwiftUI)       │
│   ┌─────────────────────────────┐  │
│   │  WKWebView                   │  │
│   │  (Your web app loads here)  │  │
│   └─────────────────────────────┘  │
│                                     │
│   SharedStore.swift                 │
│   └─> guardian_state.json          │
│       (App Group storage)           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Widgets (WidgetKit)               │
│   ├─ HomeScreenWidget               │
│   └─ LockScreenWidget               │
│       (Read-only access to state)   │
└─────────────────────────────────────┘
```

## What You Get

**11 Swift Files (All Complete):**
- Models.swift - Data structures
- SharedStore.swift - State management
- CalendarService.swift - EventKit integration
- HealthKitService.swift - Sleep tracking
- EventClassifier.swift - Stress detection
- IntentOrchestrator.swift - AI planning
- WebBridge.swift - Web ↔ Native communication
- DeepLinkHandler.swift - Widget tap handling
- ContentView.swift - Permission flow
- WebViewContainer.swift - Web view wrapper
- 4 Widget files (Bundle, Timeline, Home, Lock)

**4 Documentation Files:**
- README.md - Complete setup guide
- INTEGRATION_GUIDE.md - Detailed integration
- WEB_MODIFICATIONS.md - Web app changes
- IMPLEMENTATION_COMPLETE.md - Full summary

## Your 10-Minute Path to Working App

1. **Xcode** → New Project → iOS App → "Guardian"
2. **Add Widget Extension** → "GuardianWidget"
3. **Configure App Groups** → "group.com.guardian.shared"
4. **Copy Swift files** → Drag `GuardianCore/`, `GuardianApp/`, `GuardianWidget/` into Xcode
5. **Copy web assets** → Drag `test-binaural-beats.html` + images + JS files
6. **Modify web app** → Add 4 code blocks (see `WEB_MODIFICATIONS.md`)
7. **Build & Run** → Cmd+R
8. **Grant calendar permission**
9. **Add widgets** → Long-press home screen
10. **Test deep link** → Safari: `guardian://open?screen=mode&id=calm`

## Key Files to Read

| Priority | File | What It Tells You |
|----------|------|-------------------|
| 🔥 First | `README.md` | Complete setup steps |
| 🔥 First | `WEB_MODIFICATIONS.md` | Web app code changes |
| 📖 Second | `INTEGRATION_GUIDE.md` | Deep dive on integration |
| 📖 Third | `IMPLEMENTATION_COMPLETE.md` | What's done, what's next |

## What Was Already Implemented

✅ All Swift template files  
✅ Widget timeline refresh logic  
✅ Calendar event fetching & stress detection  
✅ HealthKit sleep tracking  
✅ Privacy-aware AI orchestrator  
✅ Deep link routing  
✅ Web ↔ Native bridge  
✅ All widget UI (6 families)  

## What You Need to Do

📝 Create Xcode project  
📝 Copy files into Xcode  
📝 Add 4 code blocks to web app  
📝 Test on simulator  
📝 Screenshot deliverables  

## Feedback Incorporated

| Issue | Fix |
|-------|-----|
| Widget refresh too complex | Timeline-based (no background tasks) |
| Race condition risk | iOS native = only writer |
| Health scope too broad | Sleep only (simplified) |
| Calendar privacy | Dedicated calendar + tagging |
| Stress detection not trainable | Calendar-level rules |
| Deep link unclear | Clean format with hash routing |

## Time Estimate

- Xcode setup: 45 min
- Web modifications: 10 min  
- Testing: 20 min

**Total: ~75 minutes to working prototype**

## Questions?

Check the inline comments in any Swift file or read the detailed guides.

**Ready?** Open `README.md` for step-by-step instructions.
