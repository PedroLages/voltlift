# HealthKit Integration Guide

## Overview

IronPath now automatically imports sleep data from **Apple Health (HealthKit)** on iOS and **Google Health Connect** on Android. This eliminates manual sleep entry and improves recovery score accuracy.

## Features

✅ **Auto-import sleep data** from Apple Health/Health Connect
✅ **Privacy-first**: Health data never leaves your device
✅ **Seamless UX**: One-tap enable during daily check-in
✅ **Manual override**: Users can still adjust imported values
✅ **Visual feedback**: Clear indicators when data is auto-imported

## How It Works

### User Flow

1. **First Time**: User reaches the sleep step in Daily Wellness Check-in
2. **Prompt**: Banner appears offering to enable HealthKit integration
3. **Authorization**: User taps "Enable HealthKit" → iOS/Android permission dialog
4. **Auto-Import**: Sleep data automatically imported from last night
5. **Confirmation**: Visual indicator shows data source (HealthKit vs Manual)

### Technical Architecture

```
components/DailyWellnessCheckin.tsx
  ↓ (checks availability)
services/healthKitService.ts
  ↓ (requests permissions)
capacitor-health plugin
  ↓ (iOS/Android native bridge)
HealthKit (iOS) / Health Connect (Android)
```

## Implementation Details

### Files Modified/Created

1. **services/healthKitService.ts** (NEW)
   - `isHealthKitAvailable()` - Check if HealthKit is supported
   - `requestHealthPermissions()` - Request read permissions
   - `getSleepData(date)` - Fetch sleep hours for specific date
   - `getHRVData(date)` - Fetch Heart Rate Variability (future)
   - `getRestingHRData(date)` - Fetch Resting Heart Rate (future)

2. **components/DailyWellnessCheckin.tsx** (UPDATED)
   - Added HealthKit state management
   - Auto-fetch sleep data when step === 'sleep'
   - Show "Enable HealthKit" banner if not enabled
   - Display data source indicator
   - Mark data as 'manual' if user edits imported value

3. **types.ts** (UPDATED)
   - Added `healthKitEnabled?: boolean` to UserSettings

4. **ios/App/App/Info.plist** (UPDATED)
   - Added `NSHealthShareUsageDescription` privacy description
   - Added `NSHealthUpdateUsageDescription` (required by iOS)

5. **ios/App/App/App.entitlements** (NEW)
   - Enabled HealthKit capability for iOS app

### Permissions Required

**iOS (HealthKit)**:
- Read: Sleep Analysis
- Read: Heart Rate Variability (optional, future)
- Read: Resting Heart Rate (optional, future)

**Android (Health Connect)**:
- Read: Sleep duration
- Read: Heart Rate Variability (optional, future)
- Read: Resting Heart Rate (optional, future)

## Testing

### Local Development (Web)

HealthKit is **NOT available** in web browser. The service will:
- Return `false` from `isHealthKitAvailable()`
- Fall back to manual sleep entry
- No errors or crashes

### iOS Simulator

HealthKit has **limited functionality** in iOS Simulator:
- Permission dialogs work
- Data may not be available (simulator has no real health data)
- Test manual entry fallback

### iOS Device (Real Device)

HealthKit **fully functional** on real devices:
1. Build and deploy to physical iPhone
2. Navigate to Daily Wellness Check-in
3. Tap "Enable HealthKit" when prompted
4. Grant permissions in iOS dialog
5. Sleep data auto-imported from Apple Health

### Android Device

Health Connect **fully functional** on Android 14+:
1. Ensure Health Connect app is installed
2. Build and deploy to Android device
3. Navigate to Daily Wellness Check-in
4. Tap "Enable Health Connect" when prompted
5. Grant permissions in Android dialog
6. Sleep data auto-imported from Health Connect

## Privacy & Security

### Data Handling

✅ **Local-Only**: Health data processed entirely on device
✅ **No Cloud Sync**: Sleep hours stored in local Zustand store
✅ **User Control**: Users can disable HealthKit anytime
✅ **Transparent**: Clear UI indicators show data source

### Compliance

- **HIPAA**: Not applicable (wellness app, not medical)
- **GDPR**: Health data is local-only, not transmitted
- **iOS Privacy**: Uses official Apple HealthKit APIs
- **Android Privacy**: Uses official Health Connect APIs

## Future Enhancements

### Phase 2: HRV Integration

Heart Rate Variability (HRV) is the gold standard for recovery tracking:

```typescript
const hrv = await getHRVData(dateStr);

if (hrv > userBaseline * 1.1) {
  // HRV elevated = well-recovered = push harder
  recoveryScore += 20;
} else if (hrv < userBaseline * 0.9) {
  // HRV suppressed = fatigued = deload
  recoveryScore -= 20;
}
```

**Status**: Function exists but not integrated into UI/recovery calculation

### Phase 3: Resting Heart Rate

Resting HR trends indicate fitness improvement:

```typescript
const restingHR = await getRestingHRData(dateStr);

if (restingHR < userBaselineRHR - 5) {
  // Fitness improving!
  showInsight('Your cardiovascular fitness is improving! 🫀');
}
```

**Status**: Function exists but not integrated

### Phase 4: Historical Import

Auto-import last 30 days of sleep data on first enable:

```typescript
const historicalData = await importHistoricalHealthData(30);

// Backfill DailyLog with historical sleep
historicalData.forEach(data => {
  if (!dailyLogs[data.date]) {
    addDailyLog({ date: data.date, sleepHours: data.sleepHours });
  }
});
```

**Status**: Function exists (`importHistoricalHealthData`) but not called

## Troubleshooting

### "HealthKit not available" on iOS

**Cause**: Running in web browser or simulator without data
**Fix**: Test on real iOS device with Apple Health data

### Permission denied after tapping "Enable HealthKit"

**Cause**: User denied permission in iOS dialog
**Fix**: Go to iOS Settings → Privacy & Security → Health → IronPath → Enable Sleep

### Sleep data shows 0 hours despite Apple Health data

**Cause 1**: Date mismatch (checking wrong day)
**Fix**: Verify date string matches Apple Health sleep session date

**Cause 2**: No sleep data logged in Apple Health
**Fix**: Ensure user has sleep tracking enabled (Apple Watch or iPhone)

### Build error: "HealthKit capability not enabled"

**Cause**: Xcode project needs HealthKit capability
**Fix**:
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select "App" target
3. Signing & Capabilities tab
4. Click "+ Capability"
5. Add "HealthKit"

## Developer Notes

### Plugin Documentation

**capacitor-health** plugin docs: https://github.com/Ad-Scientiam/capacitor-health

### Example: Adding New Health Metrics

To add a new health metric (e.g., steps count):

```typescript
// 1. Add to healthKitService.ts
export async function getStepsData(date: string): Promise<number> {
  try {
    const result = await HealthConnect.queryData({
      type: 'steps',
      startDate: `${date}T00:00:00.000Z`,
      endDate: `${date}T23:59:59.999Z`
    });

    return result.data?.reduce((sum, reading) => sum + reading.value, 0) || 0;
  } catch (error) {
    console.error('Failed to fetch steps:', error);
    return 0;
  }
}

// 2. Update getHealthDataForDate()
export async function getHealthDataForDate(date: string): Promise<HealthData> {
  const [sleepHours, hrv, restingHR, steps] = await Promise.all([
    getSleepData(date),
    getHRVData(date),
    getRestingHRData(date),
    getStepsData(date) // NEW
  ]);

  return { sleepHours, hrv, restingHR, steps, date };
}

// 3. Update HealthData interface in healthKitService.ts
export interface HealthData {
  sleepHours: number;
  hrv?: number;
  restingHR?: number;
  steps?: number; // NEW
  date: string;
}

// 4. Update requestHealthPermissions() to include 'steps' in read array
```

## Competitive Comparison

| Feature | IronPath | WHOOP | Fitbod | Alpha Progression |
|---------|----------|-------|--------|-------------------|
| HealthKit Sleep Import | ✅ Free | ✅ $30/mo | ❌ Manual | ❌ Manual |
| Auto Recovery Score | ✅ Free | ✅ $30/mo | ❌ None | ❌ None |
| HRV Integration | 🚧 Ready | ✅ $30/mo | ❌ None | ❌ None |
| Privacy (Local-Only) | ✅ Yes | ❌ Cloud | ❌ Cloud | ❌ Cloud |

**IronPath Advantage**: Only free app with HealthKit auto-import + local-only privacy.

## Changelog

### v1.1.0 (2025-12-18)
- ✅ Initial HealthKit integration
- ✅ Auto-import sleep data
- ✅ iOS permissions and entitlements
- ✅ Android Health Connect support
- ✅ DailyWellnessCheckin UI integration
- 🚧 HRV and Resting HR (ready but not integrated)
- 🚧 Historical import (ready but not called)
