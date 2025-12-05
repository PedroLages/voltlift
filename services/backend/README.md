# Backend Abstraction Layer

This directory contains the backend abstraction layer that allows IronPath to work with multiple backend services (Firebase, PocketBase) without changing application code.

## Architecture

```
App (useAuthStore, useStore)
         ↓
    backend.ts (exports unified interface)
         ↓
    ┌────┴────┐
Firebase    PocketBase
```

## Files

- **`types.ts`** - TypeScript interfaces defining the backend service contract
- **`firebase.ts`** - Firebase implementation (Firestore, Auth, Storage)
- **`pocketbase.ts`** - PocketBase implementation (self-hosted backend)
- **`index.ts`** - Backend selector based on environment variables

## Usage

### Import the backend

```typescript
import { backend } from '../services/backend';
```

### Authentication

```typescript
// Check if authenticated
if (backend.auth.isLoggedIn) {
  console.log('User:', backend.auth.user);
}

// Login with email/password
const { user } = await backend.auth.login(email, password);

// Login with Google
const { user } = await backend.auth.loginWithGoogle();

// Login with Apple
const { user } = await backend.auth.loginWithApple();

// Register new user
const { user } = await backend.auth.register(email, password, name);

// Logout
await backend.auth.logout();

// Listen for auth changes
const unsubscribe = backend.auth.onAuthChange((user) => {
  console.log('Auth changed:', user);
});
```

### Workouts

```typescript
// Get all workouts
const workouts = await backend.workouts.getAll();

// Get templates only
const templates = await backend.workouts.getTemplates();

// Get workout history
const history = await backend.workouts.getHistory();

// Create workout
const workout = await backend.workouts.create({
  id: 'workout-123',
  name: 'Push Day',
  status: 'completed',
  startTime: Date.now(),
  logs: [...]
});

// Update workout
await backend.workouts.update('workout-123', {
  endTime: Date.now()
});

// Delete workout
await backend.workouts.delete('workout-123');

// Subscribe to real-time updates
const unsubscribe = backend.workouts.subscribe((action, workout) => {
  console.log(`Workout ${action}:`, workout);
});
```

### Settings

```typescript
// Get user settings
const settings = await backend.settings.get();

// Save settings
await backend.settings.save({
  name: 'John',
  units: 'lbs',
  defaultRestTimer: 90,
  ...
});
```

### Storage (Images)

```typescript
// Upload image (base64 data URL)
const url = await backend.storage.uploadImage('exercise-123', dataUrl);

// Get image URL
const url = await backend.storage.getImageUrl('exercise-123');

// Get all images
const images = await backend.storage.getAllImages();
// Returns: { 'exercise-123': 'https://...', 'exercise-456': 'https://...' }

// Delete image
await backend.storage.deleteImage('exercise-123');
```

## Switching Backends

### Use Firebase (Cloud)

```bash
# .env.local
VITE_BACKEND_TYPE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Use PocketBase (Self-hosted)

```bash
# .env.local
VITE_BACKEND_TYPE=pocketbase
VITE_POCKETBASE_URL=http://localhost:8090
```

## Adding a New Backend

To add support for a new backend (e.g., Supabase, AWS Amplify):

1. Create new file: `services/backend/supabase.ts`
2. Implement the `BackendService` interface from `types.ts`
3. Update `index.ts` to handle the new backend type
4. Add environment variables to `.env.example`

Example:

```typescript
// supabase.ts
import { BackendService } from './types';

export class SupabaseBackend implements BackendService {
  auth = { ... };
  workouts = { ... };
  settings = { ... };
  dailyLogs = { ... };
  programs = { ... };
  storage = { ... };
}
```

```typescript
// index.ts
if (config.type === 'supabase') {
  return new SupabaseBackend(config.supabase);
}
```

## Error Handling

All backend methods throw errors on failure. Wrap calls in try-catch:

```typescript
try {
  const workouts = await backend.workouts.getAll();
} catch (error) {
  console.error('Failed to fetch workouts:', error);
  // Handle error (show toast, retry, etc.)
}
```

## Offline Support

- **Firebase**: Built-in offline persistence via Firestore cache
- **PocketBase**: Requires manual implementation (localStorage fallback)

The app uses Zustand persist middleware for offline-first experience regardless of backend.

## Real-time Sync

Both backends support real-time subscriptions:

```typescript
// Subscribe to workout changes
const unsubscribe = backend.workouts.subscribe((action, workout) => {
  if (action === 'create') {
    // New workout created on another device
  } else if (action === 'update') {
    // Workout updated
  } else if (action === 'delete') {
    // Workout deleted
  }
});

// Cleanup when component unmounts
useEffect(() => {
  return () => unsubscribe();
}, []);
```

## Type Safety

All backend operations are fully typed. TypeScript will catch errors at compile-time:

```typescript
// ✅ Type-safe
const workout: WorkoutSession = await backend.workouts.create({ ... });

// ❌ TypeScript error - missing required fields
const workout = await backend.workouts.create({ name: 'Push Day' });
```

## Migration Guide

See [`docs/backend-migration-guide.md`](../../docs/backend-migration-guide.md) for detailed instructions on:
- Setting up Firebase
- Deploying PocketBase on Unraid
- Migrating data between backends
- Troubleshooting common issues

## Performance

### Firebase
- ✅ Global CDN (fast worldwide)
- ✅ Automatic caching and offline support
- ⚠️ Network latency (~200-500ms)

### PocketBase
- ✅ Local network speed (~10-50ms)
- ✅ No usage limits
- ⚠️ Requires manual offline logic

## Security

### Firebase
- Firestore Security Rules enforce user data isolation
- Storage Rules prevent unauthorized access
- OAuth tokens automatically refreshed

### PocketBase
- API Rules: `@request.auth.id != "" && user = @request.auth.id`
- File access controlled per-collection
- JWT tokens stored in localStorage

## Best Practices

1. **Always check authentication** before backend calls
2. **Handle errors gracefully** with try-catch
3. **Clean up subscriptions** in useEffect cleanup
4. **Use optimistic updates** for better UX
5. **Sync on login** to get latest data

```typescript
// ✅ Good
useEffect(() => {
  if (!backend.auth.isLoggedIn) return;

  const unsubscribe = backend.workouts.subscribe((action, workout) => {
    // Update local state
  });

  return () => unsubscribe();
}, [backend.auth.isLoggedIn]);
```

---

**Questions?** See the [migration guide](../../docs/backend-migration-guide.md) or check `types.ts` for interface definitions.
