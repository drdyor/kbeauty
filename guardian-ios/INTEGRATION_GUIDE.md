# Guardian iOS Integration Guide

## Overview

This guide explains how to integrate the native iOS layer with your existing Guardian web app.

## What's Been Created

### ✅ Complete iOS Project Structure

**GuardianCore/** - Shared models used by both app and widget
- `Models.swift` - Complete data models (GuardianState, CalendarEvent, PrivateTile, BodyState, etc.)

**GuardianApp/** - Main iOS application
- **Services/**
  - `CalendarService.swift` - EventKit integration with stress detection
  - `HealthKitService.swift` - Sleep & HR data (MVP simplified)
  - `EventClassifier.swift` - Maps events to focus mode protocols
  - `IntentOrchestrator.swift` - AI-powered privacy-aware planning
- **State/**
  - `SharedStore.swift` - ONLY writer to guardian_state.json (App Group)
- **Bridges/**
  - `WebBridge.swift` - Bidirectional web ↔ native communication
  - `DeepLinkHandler.swift` - Deep link routing to web view
- **Views/**
  - `ContentView.swift` - Permission flow & main container
  - `WebViewContainer.swift` - WKWebView wrapper with bridge injection
- `GuardianApp.swift` - App entry point

**GuardianWidget/** - Widget extension
- `GuardianWidgetBundle.swift` - Widget registration
- `WidgetTimelineProvider.swift` - Timeline-based refresh logic
- `HomeScreenWidget.swift` - Small & Medium home screen widgets
- `LockScreenWidget.swift` - Inline, Circular, Rectangular lock screen widgets

## Key Architectural Decisions (Feedback Incorporated)

### 1. Widget Updates (Timeline-Based)
- ✅ No background tasks (complexity risk avoided)
- ✅ Timeline entries at 3h, 1h, 15min before events
- ✅ Opportunistic reload via `WidgetCenter.reloadTimelines()`
- ⏭️ Live Activities (post-MVP for real-time countdowns)

### 2. guardian_state.json (Single Writer)
- ✅ iOS native app is ONLY writer
- ✅ Web requests updates via JS→Native bridge
- ✅ Widget is read-only consumer
- ✅ Prevents race conditions

### 3. Health Data (Simplified)
- ✅ MVP: Sleep duration only
- ✅ Optional: Resting HR vs baseline
- ❌ Skipped: HRV, complex correlations, elevated HR alerts

### 4. Calendar Writing (Safe)
- ✅ Dedicated "Guardian" calendar
- ✅ Events tagged with `guardian_id=...`
- ✅ User approval required for all writes
- ✅ Calendar-level rules (always/never stressful)

### 5. Deep Links (Clean Format)
```
guardian://open?screen=mode&id=deep_work
  ↓
Native converts to: file:///.../test-binaural-beats.html#mode=deep_work
  ↓
Web reads hash → selectMode('deep_work')
```

## Web App Modifications Required

### Step 1: Add Native Bridge Receiver (JavaScript)

The `WebBridge.swift` file automatically injects the bridge script. Your web app just needs to:

1. **Listen for native state updates:**

```javascript
// Add this to test-binaural-beats.html <script> section
window.guardianStateReceiver = function(state) {
    console.log('📱 Received state from native:', state);
    
    // Example: Update UI with body state
    if (state.bodyState) {
        document.getElementById('bodyStateBadge').textContent = state.bodyState.badgeText;
    }
    
    // Example: Show next event countdown in UI
    if (state.nextEvent) {
        console.log('Next event:', state.nextEvent.title, state.nextEvent.countdownText);
    }
};
```

2. **Notify native when session starts:**

```javascript
// Modify your selectMode() function to notify native
function selectMode(modeId) {
    primerManager.generateSessionId();
    activeModeId = modeId;
    const mode = focusModes.find(m => m.id === modeId);
    
    // Notify native iOS app
    if (window.guardianNative) {
        window.guardianNative.sessionStarted(
            primerManager.sessionId,
            modeId,
            mode.name,
            parseInt(mode.time) * 60, // Convert to seconds
            primerManager.isGuidedEnabled,
            primerManager.activePrimer?.primer_id
        );
    }
    
    // ... rest of your existing code
}
```

3. **Notify native when session ends:**

```javascript
// In your stopAudio() function
function stopAudio() {
    engine.stop();
    primerManager.stop();
    isPlaying = false;
    
    // Notify native
    if (window.guardianNative && primerManager.sessionId) {
        window.guardianNative.sessionEnded(primerManager.sessionId);
    }
    
    // ... rest of your existing code
}
```

4. **Handle deep link mode selection:**

```javascript
// Add this after your existing code (web app loads and checks hash)
window.addEventListener('load', function() {
    const hash = window.location.hash;
    if (hash.startsWith('#mode=')) {
        const modeId = hash.substring(6);
        console.log('🔗 Deep link mode:', modeId);
        selectMode(modeId);
    }
});
```

### Step 2: Copy Web Assets to Xcode

1. Copy these files into your Xcode project:
   - `test-binaural-beats.html`
   - `glowchi-cat-heart.png` (and all other images)
   - `js/binauralBeatsEngine.js`
   - `js/sessionTracker.js`
   - `js/primerManager.js`
   - `primer-manifest.json`

2. In Xcode, select all files → File Inspector → Target Membership: ✅ Guardian

3. Ensure "Copy items if needed" was checked when dragging files

## Testing the Integration

### Test 1: Calendar Access
1. Launch app in simulator
2. Grant calendar permission
3. Verify events appear in console: `✅ Calendar events fetched: X events`
4. Check guardian_state.json was written: `✅ Guardian state written`

### Test 2: Widget Display
1. Long-press home screen → Add Widget → Guardian
2. Add Small widget
3. Verify it shows next event or "All clear"

### Test 3: Deep Link
1. Open Safari in simulator
2. Navigate to: `guardian://open?screen=mode&id=calm`
3. Verify Guardian app opens and Calm mode is selected

### Test 4: Web ↔ Native Communication
1. In web app, select "Deep Work" mode
2. Check Xcode console for: `✅ Session started: Deep Work`
3. Add home screen widget
4. Verify widget shows active session with countdown

### Test 5: Lock Screen Widget
1. Lock simulator (Cmd+L)
2. Add Guardian widget to lock screen
3. Verify event countdown or session status appears

## OpenRouter API Key Setup

To enable AI planning features:

1. Get API key from https://openrouter.ai
2. In `IntentOrchestrator.swift`, update:
```swift
let orchestrator = IntentOrchestrator(
    apiKey: "YOUR_API_KEY_HERE",
    calendarService: calendarService
)
```

Or better yet, store in Xcode build configuration:
1. Xcode → Product → Scheme → Edit Scheme → Run → Arguments
2. Add environment variable: `OPENROUTER_API_KEY = sk-or-...`
3. Access in code: `ProcessInfo.processInfo.environment["OPENROUTER_API_KEY"]`

## Week 1 Checklist (YOUR WORK)

- [ ] Create Xcode project with Widget extension
- [ ] Configure App Groups: `group.com.guardian.shared`
- [ ] Add EventKit & HealthKit frameworks
- [ ] Copy all Swift files into project
- [ ] Copy web assets (HTML, JS, images) into project
- [ ] Update Info.plist with permission strings
- [ ] Test calendar permission flow
- [ ] Test SharedStore write/read
- [ ] Test all widget families on device/simulator
- [ ] Screenshot: Events list in app
- [ ] Screenshot: All widget families working

## Week 2 Integration (MY WORK)

Once you have the foundation working (Week 1 complete), I'll:

- ✅ Refine widget timeline refresh policy
- ✅ Add stress event classifier user rules
- ✅ Build preparation protocol mapper
- ✅ Integrate privacy orchestrator
- ✅ Add HealthKit sleep-based body state
- ✅ Complete deep link router testing
- ✅ Full end-to-end integration testing
- ✅ TestFlight deployment preparation

## Common Issues & Solutions

### Issue: "App Group container not found"
**Solution:** Ensure both Guardian and GuardianWidget targets have App Groups capability enabled with the same ID.

### Issue: Widget not updating
**Solution:** After updating guardian_state.json, call `WidgetCenter.shared.reloadAllTimelines()` in SharedStore.

### Issue: Web app not loading in WKWebView
**Solution:** Check that `test-binaural-beats.html` is in the app bundle. In Build Phases → Copy Bundle Resources, verify it's listed.

### Issue: Deep links not working
**Solution:** Add URL scheme in Xcode:
1. Select Guardian target → Info
2. URL Types → Add (+)
3. Identifier: `com.guardian.app`
4. URL Schemes: `guardian`

### Issue: JavaScript bridge not found
**Solution:** Ensure WebBridge script injection happens BEFORE loading the HTML. Check `WebViewContainer.swift` order of operations.

## Privacy Compliance

Before TestFlight submission:

1. **App Privacy Policy**: Update with calendar & health data usage
2. **Calendar Usage**: Only read access, explicit write approval
3. **Health Data**: Sleep only (optional), clearly communicated
4. **Data Retention**: guardian_state.json stays local (never uploaded)

## Next Steps

1. Create Xcode project following `README.md` setup instructions
2. Copy all Swift files and web assets
3. Run on simulator → grant permissions
4. Test basic functionality (calendar, widget, deep link)
5. Report back with screenshots for Week 1 deliverables

Need help? Check inline comments in Swift files or ask specific questions.
