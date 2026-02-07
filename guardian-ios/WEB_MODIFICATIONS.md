# Required Web App Modifications for iOS Integration

## Overview

Your existing `test-binaural-beats.html` needs minimal changes to integrate with the native iOS layer. The native bridge is automatically injected by `WebBridge.swift`.

## Modifications to test-binaural-beats.html

Add these code blocks to your existing JavaScript (in the `<script>` section):

### 1. Add Native State Receiver (Top of script section)

```javascript
// Guardian Native Bridge Receiver
window.guardianStateReceiver = function(state) {
    console.log('📱 Received state from native:', state);
    
    // Optional: Display body state badge in your UI
    if (state.bodyState) {
        console.log('Body state:', state.bodyState.badgeText, state.bodyState.recommendation);
        // You can add a UI element to show this if desired
    }
    
    // Optional: Show next calendar event in UI
    if (state.nextEvent) {
        console.log('Next event:', state.nextEvent.title, 'in', state.nextEvent.countdownText);
    }
};
```

### 2. Modify selectMode() Function

Find your existing `selectMode()` function and add this at the beginning:

```javascript
function selectMode(modeId) {
    // Generate new session ID for this session
    primerManager.generateSessionId();
    
    activeModeId = modeId;
    const mode = focusModes.find(m => m.id === modeId);
    
    console.log(`🎯 Mode selected: ${mode.name} (Session: ${primerManager.sessionId})`);
    
    // **ADD THIS BLOCK: Notify iOS native app**
    if (window.guardianNative) {
        const durationInSeconds = mode.time === 'Inf.' ? 3600 : parseInt(mode.time) * 60;
        window.guardianNative.sessionStarted(
            primerManager.sessionId,
            modeId,
            mode.name,
            durationInSeconds,
            primerManager.isGuidedEnabled,
            primerManager.activePrimer?.primer_id || null
        );
        console.log('✅ Native notified: session started');
    }
    // **END NEW BLOCK**
    
    // ... rest of your existing selectMode code
}
```

### 3. Modify stopAudio() Function

Find your existing `stopAudio()` function and add this before the rating modal:

```javascript
function stopAudio() {
    engine.stop();
    primerManager.stop();
    isPlaying = false;
    pauseBars.style.display = 'none';
    
    // **ADD THIS BLOCK: Notify iOS native app**
    if (window.guardianNative && primerManager.sessionId) {
        window.guardianNative.sessionEnded(primerManager.sessionId);
        console.log('✅ Native notified: session ended');
    }
    // **END NEW BLOCK**
    
    if (activeModeId && primerManager.sessionId) {
        const sessionDuration = totalSeconds - secondsRemaining;
        const completionPercentage = ((sessionDuration / totalSeconds) * 100).toFixed(1);
        
        tracker.logSession({
            event_type: 'session_complete',
            session_id: primerManager.sessionId,
            // ... rest of your existing code
        });
        
        // ... rest of your existing stopAudio code
    }
}
```

### 4. Add Deep Link Handler (Bottom of script section, before closing </script>)

```javascript
// Handle deep links from iOS widgets
window.addEventListener('load', function() {
    const hash = window.location.hash;
    if (hash.startsWith('#mode=')) {
        const modeId = hash.substring(6);
        console.log('🔗 Deep link detected, selecting mode:', modeId);
        
        // Small delay to ensure everything is initialized
        setTimeout(() => {
            if (typeof selectMode === 'function') {
                selectMode(modeId);
            }
        }, 500);
    }
});

// Also listen for hash changes (if user navigates via deep link while app is open)
window.addEventListener('hashchange', function() {
    const hash = window.location.hash;
    if (hash.startsWith('#mode=')) {
        const modeId = hash.substring(6);
        console.log('🔗 Hash changed, selecting mode:', modeId);
        selectMode(modeId);
    }
});
```

## Complete Modified JavaScript Section

Here's what the modifications look like in context:

```javascript
<script>
    // Existing imports
    const engine = window.binauralBeatsEngine;
    const tracker = window.sessionTracker;
    const primerManager = window.primerManager;

    // **NEW: Native bridge receiver**
    window.guardianStateReceiver = function(state) {
        console.log('📱 Received state from native:', state);
        if (state.bodyState) {
            console.log('Body state:', state.bodyState.badgeText, state.bodyState.recommendation);
        }
        if (state.nextEvent) {
            console.log('Next event:', state.nextEvent.title, 'in', state.nextEvent.countdownText);
        }
    };

    // Existing variables
    let selected = 'delta';
    let activeModeId = null;
    let isPlaying = false;
    
    // ... all your existing code ...

    function selectMode(modeId) {
        primerManager.generateSessionId();
        activeModeId = modeId;
        const mode = focusModes.find(m => m.id === modeId);
        
        console.log(`🎯 Mode selected: ${mode.name} (Session: ${primerManager.sessionId})`);
        
        // **NEW: Notify native**
        if (window.guardianNative) {
            const durationInSeconds = mode.time === 'Inf.' ? 3600 : parseInt(mode.time) * 60;
            window.guardianNative.sessionStarted(
                primerManager.sessionId,
                modeId,
                mode.name,
                durationInSeconds,
                primerManager.isGuidedEnabled,
                primerManager.activePrimer?.primer_id || null
            );
        }
        
        // ... rest of existing selectMode code ...
    }

    function stopAudio() {
        engine.stop();
        primerManager.stop();
        isPlaying = false;
        pauseBars.style.display = 'none';
        
        // **NEW: Notify native**
        if (window.guardianNative && primerManager.sessionId) {
            window.guardianNative.sessionEnded(primerManager.sessionId);
        }
        
        // ... rest of existing stopAudio code ...
    }

    // ... all your existing code ...

    // **NEW: Deep link handlers**
    window.addEventListener('load', function() {
        const hash = window.location.hash;
        if (hash.startsWith('#mode=')) {
            const modeId = hash.substring(6);
            console.log('🔗 Deep link detected:', modeId);
            setTimeout(() => {
                if (typeof selectMode === 'function') {
                    selectMode(modeId);
                }
            }, 500);
        }
    });

    window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        if (hash.startsWith('#mode=')) {
            const modeId = hash.substring(6);
            selectMode(modeId);
        }
    });
</script>
```

## Testing the Modifications

### In Safari (Before iOS Integration)
Your web app should still work exactly as before. The native bridge checks prevent errors:

```javascript
if (window.guardianNative) {
    // This only runs when in iOS app
}
```

### In iOS App
1. Open in Xcode simulator
2. Check console for:
   - `✅ Guardian native bridge loaded`
   - `📱 Received state from native: {...}`
   - `✅ Native notified: session started`

## Optional: Add Body State Display to UI

If you want to show the body state badge in your web UI:

```html
<!-- Add this somewhere in your HTML body -->
<div id="bodyStateDisplay" style="display: none; position: fixed; top: 10px; right: 10px; padding: 8px; background: rgba(255,255,255,0.9); border-radius: 12px;">
    <span id="bodyStateBadge">😊</span>
    <span id="bodyStateText" style="font-size: 11px; margin-left: 5px;">Well rested</span>
</div>
```

```javascript
// Update the receiver
window.guardianStateReceiver = function(state) {
    if (state.bodyState) {
        const display = document.getElementById('bodyStateDisplay');
        const badge = document.getElementById('bodyStateBadge');
        const text = document.getElementById('bodyStateText');
        
        if (display && badge && text) {
            display.style.display = 'block';
            badge.textContent = state.bodyState.badgeText;
            text.textContent = state.bodyState.recommendation.split('.')[0]; // First sentence
        }
    }
};
```

## Summary

**Required Changes:**
1. ✅ Add `guardianStateReceiver` function
2. ✅ Modify `selectMode()` to notify native
3. ✅ Modify `stopAudio()` to notify native
4. ✅ Add deep link hash handlers

**Result:**
- Web app works standalone (no breaking changes)
- iOS integration works seamlessly
- Widgets stay in sync with active sessions
- Deep links open specific modes

**Time Required:** ~10 minutes to add these 4 code blocks

Ready to implement? Copy the code blocks and test in Safari first, then integrate with iOS.
