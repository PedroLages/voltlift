# Backend Migration Guide

This guide explains how to switch between Firebase (cloud) and PocketBase (self-hosted) backends.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Current Setup (Firebase)](#current-setup-firebase)
- [Switching to PocketBase (Unraid)](#switching-to-pocketbase-unraid)
- [Data Migration](#data-migration)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

IronPath uses a **backend abstraction layer** that allows seamless switching between cloud (Firebase) and self-hosted (PocketBase) backends.

```
┌─────────────────────────────┐
│   App Layer (React/Zustand) │
├─────────────────────────────┤
│  Backend Service Interface   │ ← Single unified API
├─────────────────────────────┤
│  Firebase  │  PocketBase     │ ← Swap via .env
│  (cloud)   │  (self-hosted)  │
└─────────────────────────────┘
```

**Benefits:**
- ✅ Same codebase for both backends
- ✅ Switch with one environment variable
- ✅ Easy data migration between backends
- ✅ No code changes needed when switching

---

## Current Setup (Firebase)

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (optional)
   - Enable Apple (optional, requires Apple Developer account)
4. Enable **Firestore Database**:
   - Go to Firestore Database > Create database
   - Start in **production mode**
   - Choose a location close to your users
5. Enable **Storage**:
   - Go to Storage > Get started
   - Start in **production mode**

### 2. Security Rules

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Workouts collection
    match /workouts/{workoutId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Settings collection
    match /settings/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Daily logs collection
    match /dailyLogs/{logId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Programs collection
    match /programs/{programId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
```

**Storage Rules** (`storage.rules`):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/exercise-images/{imageId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Firebase credentials:

```bash
VITE_BACKEND_TYPE=firebase

VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

---

## Switching to PocketBase (Unraid)

### 1. Deploy PocketBase on Unraid

**Option A: Docker Container (Recommended)**

1. Open Unraid Web UI
2. Go to **Docker** tab
3. Click **Add Container**
4. Configure:
   - **Name:** `pocketbase`
   - **Repository:** `ghcr.io/muchobien/pocketbase:latest`
   - **Port:** `8090:8090`
   - **Path:** `/mnt/user/appdata/pocketbase:/pb_data`
5. Click **Apply**

**Option B: Manual Installation**

```bash
# SSH into Unraid server
ssh root@your-unraid-server.local

# Download PocketBase
cd /mnt/user/appdata
mkdir pocketbase && cd pocketbase
wget https://github.com/pocketbase/pocketbase/releases/download/v0.20.0/pocketbase_0.20.0_linux_amd64.zip
unzip pocketbase_0.20.0_linux_amd64.zip

# Start PocketBase
./pocketbase serve --http="0.0.0.0:8090"
```

### 2. Configure PocketBase

1. Open PocketBase Admin UI: `http://your-unraid-server.local:8090/_/`
2. Create admin account
3. Create collections:

**Collections Schema:**

```javascript
// users (built-in, just enable)
// email, password, name, avatar

// workouts
{
  user: Relation(users, single),
  name: Text,
  startTime: Number,
  endTime: Number,
  status: Select(active, completed, template),
  sourceTemplateId: Text,
  logs: JSON,
  biometrics: JSON
}

// user_settings
{
  user: Relation(users, single),
  settings: JSON
}

// daily_logs
{
  user: Relation(users, single),
  date: Text,
  data: JSON
}

// programs
{
  user: Relation(users, single),
  program: JSON
}

// exercise_images
{
  user: Relation(users, single),
  exerciseId: Text,
  image: File
}
```

4. Set **API Rules** to require authentication:
   - Users can only access their own data
   - Example rule: `@request.auth.id != "" && user = @request.auth.id`

### 3. Update Environment Variables

Edit `.env.local`:

```bash
# Switch from Firebase to PocketBase
VITE_BACKEND_TYPE=pocketbase
VITE_POCKETBASE_URL=http://your-unraid-server.local:8090
```

### 4. Rebuild and Deploy

```bash
npm run build
```

Your app will now use PocketBase instead of Firebase! 🎉

---

## Data Migration

### Firebase → PocketBase

**Step 1: Export from Firebase**

Create `scripts/export-firebase.ts`:

```typescript
import { backend } from '../services/backend';
import fs from 'fs';

async function exportData() {
  // Must be logged in
  if (!backend.auth.isLoggedIn) {
    console.error('Please log in first');
    return;
  }

  const data = {
    workouts: await backend.workouts.getAll(),
    settings: await backend.settings.get(),
    dailyLogs: await backend.dailyLogs.getAll(),
    programs: await backend.programs.getAll(),
    // Note: Images will need separate handling
  };

  fs.writeFileSync('backup.json', JSON.stringify(data, null, 2));
  console.log('✅ Data exported to backup.json');
}

exportData();
```

**Step 2: Import to PocketBase**

```typescript
import { backend } from '../services/backend';
import fs from 'fs';

async function importData() {
  const data = JSON.parse(fs.readFileSync('backup.json', 'utf-8'));

  // Must be logged in
  if (!backend.auth.isLoggedIn) {
    console.error('Please log in first');
    return;
  }

  // Import workouts
  for (const workout of data.workouts) {
    await backend.workouts.create(workout);
  }

  // Import settings
  if (data.settings) {
    await backend.settings.save(data.settings);
  }

  // Import daily logs
  for (const [date, log] of Object.entries(data.dailyLogs)) {
    await backend.dailyLogs.save(date, log);
  }

  // Import programs
  for (const program of data.programs) {
    await backend.programs.create(program);
  }

  console.log('✅ Data imported successfully');
}

importData();
```

### PocketBase → Firebase

Reverse the process above:
1. Export from PocketBase using the export script
2. Switch `VITE_BACKEND_TYPE=firebase` in `.env.local`
3. Run the import script

---

## Troubleshooting

### "User not authenticated" Error

**Solution:** The backend abstraction requires authentication for all operations. Make sure the user is logged in:

```typescript
import { backend } from './services/backend';

// Check if user is logged in
if (!backend.auth.isLoggedIn) {
  console.error('Please log in first');
}
```

### CORS Issues with PocketBase

**Solution:** Enable CORS in PocketBase settings:

1. Open PocketBase Admin UI
2. Go to Settings > Application
3. Add your app URL to **Allowed Origins**:
   ```
   http://localhost:3000
   https://your-app-domain.com
   ```

### Firebase Auth Popup Blocked

**Solution:** Some browsers block popups by default. For Google/Apple Sign-In:

1. Use redirect flow instead of popup:
   ```typescript
   // In firebase.ts, replace signInWithPopup with:
   import { signInWithRedirect, getRedirectResult } from 'firebase/auth';
   ```

2. Handle redirect result on page load:
   ```typescript
   useEffect(() => {
     getRedirectResult(auth).then((result) => {
       if (result?.user) {
         // User logged in successfully
       }
     });
   }, []);
   ```

### Images Not Syncing

**Problem:** Firebase Storage URLs expire, or PocketBase files not accessible.

**Solution:**

1. **Firebase:** Ensure Storage CORS is configured:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

2. **PocketBase:** Ensure file URLs are public or authenticated:
   ```typescript
   const url = pb.getFileUrl(record, record.image);
   ```

---

## Performance Comparison

| Feature | Firebase | PocketBase |
|---------|----------|------------|
| **Setup Time** | 5 min | 15 min |
| **Monthly Cost** | Free tier: 50K reads, 20K writes | $0 (self-hosted) |
| **Latency** | ~200-500ms (global) | ~10-50ms (local network) |
| **Offline Support** | ✅ Built-in | ⚠️ Requires custom logic |
| **Real-time Sync** | ✅ Automatic | ✅ Manual polling |
| **File Storage** | 5GB free | Unlimited (your disk) |
| **Maintenance** | None | Server updates |

---

## Best Practices

### Development
- Use **Firebase** for rapid prototyping and testing
- Enables instant cross-device sync without server setup

### Production (Personal Use)
- Use **PocketBase on Unraid** for:
  - Complete data ownership
  - No usage limits
  - Local network speed
  - One-time setup cost

### Production (Public App)
- Use **Firebase** for:
  - Global user base
  - Managed infrastructure
  - Built-in DDoS protection
  - OAuth providers

---

## Questions?

- **Firebase Docs:** https://firebase.google.com/docs
- **PocketBase Docs:** https://pocketbase.io/docs
- **Backend Abstraction:** See `services/backend/types.ts` for interface

---

**Last Updated:** Dec 2024
**Status:** ✅ Production Ready
