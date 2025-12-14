# Capacitor Mobile App Guide

## Overview

IronPath is now configured as a hybrid mobile app using Capacitor. You can run it as a web app OR build it as a native iOS/Android app.

## Quick Start

### Open in Xcode (iOS)

```bash
npm run cap:run:ios
```

This will:
1. Build the web assets (`npm run build`)
2. Sync to the iOS project (`npx cap sync ios`)
3. Open Xcode automatically

Then in Xcode:
1. **Connect your iPhone** via USB
2. **Select your device** from the device dropdown (top toolbar)
3. **Click ▶️ Run** to install on your phone

### Development Workflow

#### Web Development (Recommended for UI work)
```bash
npm run dev
# Open http://localhost:3002 in browser
# Make changes, see instant hot reload
```

#### Test on Physical Device
After making changes:
```bash
npm run cap:build    # Build and sync
npm run cap:open:ios # Open in Xcode, then hit Run
```

#### Live Reload on Device (Advanced)
1. Uncomment these lines in `capacitor.config.ts`:
```typescript
server: {
  url: 'http://192.168.2.233:3002',  // Your dev server IP
  cleartext: true
}
```
2. Rebuild and run in Xcode
3. App will load from your dev server with live reload!
4. **Remember to comment out before production build**

## Available Native Plugins

### Installed and Ready to Use

```typescript
// Haptics - Better than navigator.vibrate()
import { Haptics, ImpactStyle } from '@capacitor/haptics';
await Haptics.impact({ style: ImpactStyle.Heavy });

// Camera - For progress photos
import { Camera, CameraResultType } from '@capacitor/camera';
const photo = await Camera.getPhoto({
  quality: 90,
  resultType: CameraResultType.Uri
});

// Status Bar - Native look
import { StatusBar, Style } from '@capacitor/status-bar';
await StatusBar.setStyle({ style: Style.Dark });
await StatusBar.setBackgroundColor({ color: '#000000' });

// Share - Share workouts
import { Share } from '@capacitor/share';
await Share.share({
  title: 'Check out my workout!',
  text: 'Just hit a new PR!',
  url: 'https://ironpath.app',
});

// Splash Screen - Control app launch
import { SplashScreen } from '@capacitor/splash-screen';
await SplashScreen.hide();

// Keyboard - Better mobile UX
import { Keyboard } from '@capacitor/keyboard';
Keyboard.addListener('keyboardWillShow', info => {
  console.log('keyboard will show with height:', info.keyboardHeight);
});
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Web dev server (fastest iteration) |
| `npm run build` | Build web assets for production |
| `npm run cap:sync` | Sync web assets to native projects |
| `npm run cap:build` | Build + sync |
| `npm run cap:open:ios` | Open Xcode |
| `npm run cap:run:ios` | Build + sync + open Xcode |

## Testing on Your iPhone

### Free (No Apple Developer Account)

1. Connect iPhone via USB
2. Run `npm run cap:run:ios`
3. In Xcode, select your device and click Run
4. **Trust your Mac** on iPhone when prompted
5. App installs! (lasts 7 days, then need to reinstall)

**Limitations:**
- App expires after 7 days
- Max 3 devices
- No push notifications
- No iCloud features

### Paid ($99/year Apple Developer)

With an Apple Developer account:
- Apps don't expire
- TestFlight beta distribution
- Push notifications work
- iCloud sync available
- Can publish to App Store

## Project Structure

```
IronPath/
├── src/                 # React source code
├── dist/                # Built web assets (created by npm run build)
├── ios/                 # Native iOS project (created by Capacitor)
│   └── App/
│       └── App/
│           ├── public/  # Web assets copied here
│           └── App.xcworkspace  # Open this in Xcode
├── capacitor.config.ts  # Capacitor configuration
└── package.json         # Added cap: scripts
```

## Common Issues

### "Build Failed" in Xcode
- Run `npm run cap:sync` to update native project
- Clean build folder: Xcode → Product → Clean Build Folder
- Check that `dist/` exists: `npm run build`

### App Shows Blank Screen
- Check Safari Web Inspector while app runs
- Make sure you ran `npm run build` before sync
- Verify `webDir: 'dist'` in capacitor.config.ts

### Changes Not Appearing
- Remember to rebuild: `npm run cap:build`
- For code changes, rebuild in Xcode too (⌘+B)

### Can't Install on Device
- Check device is trusted (iPhone Settings → General → Device Management)
- Make sure device is unlocked
- Try different USB cable/port

## Next Steps

### Improve Native Feel

1. **Better Haptics** - Replace `navigator.vibrate()` in SwipeableRow.tsx:
```typescript
// Before (web)
if (navigator.vibrate) navigator.vibrate([50, 50]);

// After (native)
import { Haptics, ImpactStyle } from '@capacitor/haptics';
await Haptics.impact({ style: ImpactStyle.Medium });
```

2. **Add Progress Photos** - Use Camera plugin in Profile/Progress section

3. **Rest Timer Notifications** - Add @capacitor/local-notifications for background alerts

4. **Native Splash Screen** - Add custom splash screen images in `ios/App/App/Assets.xcassets/`

5. **App Icon** - Replace default icon in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Plugin Reference](https://capacitorjs.com/docs/apis)
- [Capacitor Community Plugins](https://github.com/capacitor-community)
