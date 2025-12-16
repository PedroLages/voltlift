# Sync Architecture Analysis

**Date**: December 16, 2025
**Issue**: Profile pictures and other media not syncing across devices

---

## Current Sync Status

### ✅ Currently Synced to Cloud (Firebase/PocketBase)

| Data Type | Storage Method | Sync Status | Cross-Device Access |
|-----------|---------------|-------------|-------------------|
| Workout History | `backend.workouts.create/update()` | ✅ Synced | ✅ Yes |
| Templates | `backend.workouts.create()` | ✅ Synced | ✅ Yes |
| User Settings | `backend.settings.save()` | ✅ Synced | ✅ Yes |
| Daily Logs (Body Metrics) | `backend.dailyLogs.save()` | ✅ Synced | ✅ Yes |
| Programs | `backend.programs.create/update()` | ✅ Synced | ✅ Yes |
| Personal Records | Calculated from history | ✅ Derived | ✅ Yes |

### ❌ NOT Synced (Local IndexedDB Only)

| Data Type | Current Storage | Issue | Should Sync? |
|-----------|----------------|-------|-------------|
| **Profile Picture** | `saveImageToDB('profile-picture')` | ❌ Only in local browser | ✅ **YES** - Critical UX |
| **Progress Photos** | `saveImageToDB('progress-photo-*')` | ❌ Only in local browser | ✅ **YES** - Transformation tracking |
| **Custom Exercise Visuals** | `saveImageToDB('exercise-*')` | ❌ Only in local browser | ⚠️ **OPTIONAL** - Large files, can regenerate |

---

## Problem: Profile Picture Not Syncing

### Current Implementation (Profile.tsx:158-192)

```typescript
const handleProfilePictureUpload = async (event) => {
  const file = event.target.files?.[0];
  // ... validation ...

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target?.result as string;
    await saveImageToDB('profile-picture', base64);  // ❌ LOCAL ONLY!
    setProfilePicture(base64);
  };
  reader.readAsDataURL(file);
};
```

**Issue**: Uses `saveImageToDB()` which stores to IndexedDB (local browser storage).
**Result**: Profile picture exists ONLY in the browser where it was uploaded.
**Impact**: User can't see their profile picture on other devices/browsers.

### Backend Support Available (types.ts:122-135)

```typescript
storage: {
  uploadImage(id: string, dataUrl: string): Promise<string>;  // ✅ Available!
  getImageUrl(id: string): Promise<string | null>;
  getAllImages(): Promise<Record<string, string>>;
  deleteImage(id: string): Promise<void>;
}
```

**Backend DOES support image storage**, but Profile.tsx doesn't use it.

---

## Recommended Sync Architecture

### High Priority - MUST Sync

1. **Profile Picture**
   - **Why**: Core user identity, should be visible everywhere
   - **Storage**: `backend.storage.uploadImage('profile-picture', dataUrl)`
   - **Fallback**: Store URL in `settings.profilePictureUrl`
   - **Size Limit**: 5MB (already enforced)

2. **Progress Photos**
   - **Why**: Transformation tracking is a key feature
   - **Storage**: `backend.storage.uploadImage('progress-photo-{timestamp}', dataUrl)`
   - **Benefit**: Body comparison across devices

### Medium Priority - SHOULD Sync

3. **Workout Session Thumbnails** (future)
   - Quick visual recognition of past workouts
   - Small size, high value

### Low Priority - OPTIONAL Sync

4. **Custom Exercise Visuals**
   - **Why Optional**:
     - Large files (1K/2K/4K images)
     - Can be regenerated with AI (though costs API calls)
     - Not user-generated content
   - **Current**: 205 exercises × ~500KB each = ~100MB storage
   - **Recommendation**: Keep local, add regeneration button if missing

---

## Issues to Fix

### 1. ❌ Profile Picture Not Syncing

**Fix**: Change Profile.tsx to use `backend.storage.uploadImage()`
**Benefit**: Access profile picture from any device

### 2. ⏰ Time Format Issues (lastSync Display)

**Current**: `10:04:15 AM` (12-hour format)
**Problems**:
- Shows only time, not date
- Uses 12-hour format (AM/PM) even for KG users
- No indication if last sync was yesterday, last week, etc.

**Recommended Fixes**:
- Add date: `Dec 16, 10:04` or `2025-12-16 10:04`
- Use 24-hour format for KG users (international standard)
- Show relative time for recent syncs: "Just now", "2 hours ago"

### 3. 🔄 Force Sync Button Animation

**Current**: Spinner animation exists in code but may not be visible
**Issue**: Sync completes too quickly (500ms), animation not noticeable
**Fix**: Ensure minimum 1000ms display time for visual feedback

---

## Implementation Priority

### Phase 1 (Completed - December 16, 2025)
1. ✅ Fix lastSync time format (add date + 24h for KG users)
2. ✅ Fix Force Sync animation visibility
3. ✅ Analyze sync architecture (this document)
4. ✅ Migrate profile picture to use `backend.storage.uploadImage()`
5. ✅ Load profile picture from cloud on app start
6. ✅ Add sync indicator for profile picture upload
7. ✅ Migrate progress photos to cloud storage with lazy migration
8. ✅ Add uploading indicator for progress photo upload

### Phase 2 (Future Enhancements)
9. 🔧 Add settings preference for time format (12h vs 24h)
10. 🔧 Add relative time display ("2 hours ago")
11. 🔧 Add batch migration status UI for progress photos

---

## Sync Data Size Estimates

| Data Type | Average Size | Total Size (User with 100 workouts) |
|-----------|-------------|-----------------------------------|
| Workout History | ~5KB per workout | ~500KB |
| Templates | ~5KB per template | ~50KB (10 templates) |
| Settings | ~2KB | ~2KB |
| Daily Logs | ~1KB per day | ~365KB (1 year) |
| Programs | ~10KB per program | ~50KB (5 programs) |
| **Profile Picture** | ~500KB (compressed) | ~500KB |
| **Progress Photos** | ~500KB each | ~12MB (24 photos/year) |
| **Custom Exercise Visuals** | ~500KB each | ~100MB (205 exercises) |
| **TOTAL (without custom visuals)** | | **~14MB per user/year** |

**Conclusion**: Syncing profile picture and progress photos is feasible and valuable.

---

## Security Considerations

### Authentication Required
- ✅ All sync operations require user authentication
- ✅ Images stored with user ID prefix (privacy)
- ✅ Firebase Storage Rules enforce user-only access

### Data Privacy
- Profile pictures: Public to user only
- Progress photos: Private, user eyes only
- Workout data: Private, user eyes only

---

## Next Steps

1. Update Profile.tsx to use cloud storage for profile picture
2. Fix time format display bugs
3. Test sync across multiple devices
4. Document migration path for existing users with local-only profile pictures
