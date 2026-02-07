# Bundle ID Configuration Template

## Your Custom Identifiers

Replace these throughout the codebase:

```swift
// Main App Bundle ID
"com.guardian.app"  
// Replace with: com.yourname.guardian

// Widget Bundle ID  
"com.guardian.app.GuardianWidget"
// Replace with: com.yourname.guardian.GuardianWidget

// App Group ID
"group.com.guardian.shared"
// Replace with: group.com.yourname.guardian
```

## Files to Update

### 1. Xcode Project Settings

**Main App Target:**
- General → Bundle Identifier → `com.yourname.guardian`
- Signing & Capabilities → App Groups → `group.com.yourname.guardian`

**Widget Extension Target:**
- General → Bundle Identifier → `com.yourname.guardian.GuardianWidget`
- Signing & Capabilities → App Groups → `group.com.yourname.guardian` (MUST MATCH)

### 2. Swift Files

**GuardianApp/State/SharedStore.swift:**
```swift
private let appGroupID = "group.com.yourname.guardian"
```

**GuardianCore/Models.swift:**
No changes needed (doesn't reference bundle IDs)

**All other files:**
Use Xcode's search (Cmd+Shift+F) to find:
- `group.com.guardian.shared`
- Replace with your App Group ID

### 3. Info.plist

**URL Scheme (for deep links):**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>guardian</string>
        </array>
        <key>CFBundleURLName</key>
        <string>com.yourname.guardian</string>
    </dict>
</array>
```

Replace:
- `<string>guardian</string>` - Keep as-is (or customize URL scheme)
- `<string>com.yourname.guardian</string>` - Your main bundle ID

## Quick Search & Replace

Use these exact search terms in Xcode:

1. **Search:** `group.com.guardian.shared`  
   **Replace:** `group.com.yourname.guardian`

2. **Search:** `com.guardian.app.GuardianWidget`  
   **Replace:** `com.yourname.guardian.GuardianWidget`

3. **Search:** `com.guardian.app`  
   **Replace:** `com.yourname.guardian`

⚠️ **Order matters!** Do 2 before 3 (more specific first).

## Verification Checklist

After updating, verify:

- [ ] Both targets show same App Group in Capabilities
- [ ] Bundle IDs don't conflict with existing apps
- [ ] URL scheme is unique to your app
- [ ] SharedStore.swift references correct group ID
- [ ] App builds without "App Group not found" error

## Common Mistakes

### ❌ Mismatched App Groups
```
App: group.com.guardian.shared
Widget: group.com.guardian.widget  ← WRONG
```

### ✅ Correct (Both Match)
```
App: group.com.yourname.guardian
Widget: group.com.yourname.guardian  ← SAME
```

### ❌ Forgot to Update Code
Xcode project updated, but Swift files still have:
```swift
private let appGroupID = "group.com.guardian.shared"
```

### ✅ Correct
```swift
private let appGroupID = "group.com.yourname.guardian"
```

## Testing App Group Access

Add this to your `ContentView` or app entry point:

```swift
func testAppGroup() {
    let groupID = "group.com.yourname.guardian"
    
    if let url = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: groupID
    ) {
        print("✅ App Group URL: \(url.path)")
        
        // Try writing a test file
        let testFile = url.appendingPathComponent("test.txt")
        let testData = "Hello from Guardian".data(using: .utf8)!
        
        do {
            try testData.write(to: testFile)
            print("✅ App Group write successful")
            
            // Verify from widget side
            if let readData = try? Data(contentsOf: testFile),
               let text = String(data: readData, encoding: .utf8) {
                print("✅ App Group read successful: \(text)")
            }
        } catch {
            print("❌ App Group write failed: \(error)")
        }
    } else {
        print("❌ App Group not accessible")
        print("   Check: Signing & Capabilities → App Groups")
        print("   Ensure BOTH targets have the same group ID")
    }
}
```

Call this in your app's `onAppear` and check the console.

## Example: Complete Configuration

**Your chosen IDs:**
- Main: `com.glowchi.guardian`
- Widget: `com.glowchi.guardian.GuardianWidget`
- Group: `group.com.glowchi.guardian`

**Updated SharedStore.swift:**
```swift
private let appGroupID = "group.com.glowchi.guardian"
```

**Updated Info.plist:**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>guardian</string>
        </array>
        <key>CFBundleURLName</key>
        <string>com.glowchi.guardian</string>
    </dict>
</array>
```

**Xcode Targets:**
- Guardian → Bundle ID: `com.glowchi.guardian`
- Guardian → App Groups: `group.com.glowchi.guardian`
- GuardianWidget → Bundle ID: `com.glowchi.guardian.GuardianWidget`
- GuardianWidget → App Groups: `group.com.glowchi.guardian`

## Ready?

Once configured:
1. Build the main app
2. Check console for "✅ App Group URL:"
3. Build the widget
4. Add widget to home screen
5. Widget should read the same data

If you see "❌ App Group not accessible", double-check all IDs match exactly.
