# UIScene Lifecycle Fix

## Problem
Xcode warning: "`UIScene` lifecycle will soon be required. Failure to adopt will result in an assert in the future."

## Solution Implemented

### 1. Updated Info.plist
**File:** [ios/App/App/Info.plist](ios/App/App/Info.plist)

Added `UIApplicationSceneManifest` configuration:
```xml
<key>UIApplicationSceneManifest</key>
<dict>
    <key>UIApplicationSupportsMultipleScenes</key>
    <false/>
    <key>UISceneConfigurations</key>
    <dict>
        <key>UIWindowSceneSessionRoleApplication</key>
        <array>
            <dict>
                <key>UISceneConfigurationName</key>
                <string>Default Configuration</string>
                <key>UISceneDelegateClassName</key>
                <string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
                <key>UISceneStoryboardFile</key>
                <string>Main</string>
            </dict>
        </array>
    </dict>
</dict>
```

Removed legacy `UIMainStoryboardFile` key.

### 2. Updated AppDelegate.swift
**File:** [ios/App/App/AppDelegate.swift](ios/App/App/AppDelegate.swift)

Added UISceneSession lifecycle methods:
- `application(_:configurationForConnecting:options:)` - Creates scene configuration
- `application(_:didDiscardSceneSessions:)` - Handles scene session disposal

Removed `var window: UIWindow?` (now handled by SceneDelegate).

### 3. Created SceneDelegate.swift
**File:** [ios/App/App/SceneDelegate.swift](ios/App/App/SceneDelegate.swift)

New SceneDelegate class implementing `UIWindowSceneDelegate` with:
- `scene(_:willConnectTo:options:)` - Scene connection
- `sceneDidDisconnect(_:)` - Scene disconnection
- `sceneDidBecomeActive(_:)` - Scene activation
- `sceneWillResignActive(_:)` - Scene deactivation
- `sceneWillEnterForeground(_:)` - Foreground transition
- `sceneDidEnterBackground(_:)` - Background transition

## Next Steps (Manual Action Required)

⚠️ **IMPORTANT:** You need to add `SceneDelegate.swift` to the Xcode project:

1. Open Xcode: `npx cap open ios`
2. Right-click on the "App" folder in the Project Navigator
3. Select "Add Files to 'App'..."
4. Navigate to `ios/App/App/SceneDelegate.swift`
5. Check "Copy items if needed" and "Add to targets: App"
6. Click "Add"
7. Build the project (⌘+B) to verify no errors

## Verification

After adding the file to Xcode, the warning should disappear. Build and run the app to verify:
- App launches correctly with UIScene lifecycle
- No runtime warnings about UIScene
- All Capacitor plugins work as expected

## References
- [Apple Documentation: UIScene](https://developer.apple.com/documentation/uikit/app_and_environment/scenes)
- [Capacitor iOS Configuration](https://capacitorjs.com/docs/ios/configuration)
