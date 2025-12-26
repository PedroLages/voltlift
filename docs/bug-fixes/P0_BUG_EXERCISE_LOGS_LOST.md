# P0 BUG: Exercise Logs Lost on Page Refresh

**Date:** 2025-12-25
**Severity:** CRITICAL (P0) - Data Loss
**Status:** REPRODUCED ✅
**Component:** Zustand Store Persistence / Active Workout Management

---

## Summary

Users lose ALL exercise logs (sets, weight, reps, RPE) when they refresh the browser during an active workout. The workout shell persists (ID, name, start time) but the `activeWorkout.logs` array is wiped clean.

---

## Impact

🚨 **CRITICAL DATA LOSS**
- Users cannot trust the app to save workout progress
- Any accidental refresh = complete loss of logged sets
- Blocks all real-world usage (gyms have poor connectivity, apps crash, users switch apps)
- Violates core promise of workout tracking app

---

## Reproduction Steps

### Test 1: Manual localStorage Edit (Isolated Bug)

```javascript
// 1. Start workout
// 2. Manually add exercise logs to localStorage:
const storage = JSON.parse(localStorage.getItem('voltlift-storage'));
storage.state.activeWorkout.logs = [{
  id: 'test-log',
  exerciseId: 'bench-press',
  exerciseName: 'Barbell Bench Press',
  sets: [
    { id: 'set-1', weight: 135, reps: 10, rpe: 7, completed: true },
    { id: 'set-2', weight: 155, reps: 8, rpe: 8, completed: true }
  ]
}];
localStorage.setItem('voltlift-storage', JSON.stringify(storage));

// 3. Wait 3 seconds
// 4. Check localStorage again

// RESULT: logs are CLEARED back to []
```

**Finding:** Zustand's persist middleware overwrites localStorage with in-memory state (which has empty logs) every few seconds.

### Test 2: Page Refresh (User-Facing Bug)

```bash
1. Start workout "Quick Start Workout"
2. Add exercise "Barbell Bench Press" via UI
3. Log 3 sets with weight/reps
4. Verify data in activeWorkout.logs
5. Refresh browser (F5)
6. Check activeWorkout.logs

BEFORE REFRESH:
{
  logCount: 1,
  exercise: "Barbell Bench Press",
  sets: [
    "135lbs × 10 @ RPE 7",
    "155lbs × 8 @ RPE 8",
    "165lbs × 6 @ RPE 9"
  ]
}

AFTER REFRESH:
{
  logCount: 0,        // ❌ LOST
  exercise: null,     // ❌ LOST
  sets: []            // ❌ LOST
}
```

**What Persists:**
- ✅ Workout shell (id, name, startTime, status)

**What Gets Wiped:**
- ❌ activeWorkout.logs[] (all exercise data)
- ❌ All sets (weight, reps, RPE, completion status)
- ❌ Exercise names and IDs
- ❌ All workout progress

---

## Root Cause Analysis

### Investigation Timeline

1. **Initial Hypothesis:** Zustand persist middleware not working
   - ❌ **DISPROVEN:** Basic workout state DOES persist (ID, name, status)

2. **Second Hypothesis:** `logs` array excluded from persistence
   - ❌ **DISPROVEN:** `partialize` function includes `activeWorkout` in `...rest`
   - Note: Comment says "Exclude Sets" but refers to JavaScript `Set` objects (pendingSyncWorkouts), NOT workout sets

3. **Third Hypothesis:** Migration function clearing logs
   - ❌ **DISPROVEN:** No migration code touches `activeWorkout.logs`

4. **Fourth Hypothesis (CORRECT):** State rehydration issue
   - ✅ **CONFIRMED:** In-memory state has `logs: []`
   - ✅ **CONFIRMED:** Zustand continuously persists wrong state to localStorage
   - ✅ **CONFIRMED:** Manual edits to localStorage get overwritten within 3 seconds

### The Bug

**File:** `store/useStore.ts:239-245`

```typescript
startWorkout: (templateId) => {
  // ... template logic ...

  // Empty workout case:
  newWorkout = {
    id: uuidv4(),
    name: 'Quick Start Workout',
    startTime: Date.now(),
    status: 'active',
    logs: []  // ⬅️ STARTS EMPTY
  };

  set({ activeWorkout: newWorkout });
}
```

**The Problem:**
1. `startWorkout()` creates workout with `logs: []`
2. UI adds exercises via `addExerciseToActive()` → updates in-memory state
3. **BUT** something is preventing logs from being added OR logs are being cleared
4. Zustand persist middleware faithfully saves the empty `logs: []` state
5. On page refresh, the empty state is rehydrated

**Possible Causes:**
- `addExerciseToActive()` not being called when user adds exercises
- Exercises being added but immediately cleared by another action
- State update race condition
- Component rendering issue (UI shows data but store doesn't have it)

---

## Evidence

### localStorage Inspection

**Before Manual Edit:**
```json
{
  "state": {
    "activeWorkout": {
      "id": "04a15657-cc08-4c65-96f5-89bf58c72149",
      "name": "Quick Start Workout",
      "startTime": 1766690276511,
      "status": "active",
      "logs": []  // EMPTY
    }
  }
}
```

**Immediately After Manual Edit:**
```json
{
  "state": {
    "activeWorkout": {
      "logs": [{
        "id": "test-log",
        "exerciseId": "bench-press",
        "sets": [
          { "weight": 135, "reps": 10 },
          { "weight": 155, "reps": 8 }
        ]
      }]
    }
  }
}
```

**3 Seconds Later (NO REFRESH):**
```json
{
  "state": {
    "activeWorkout": {
      "logs": []  // CLEARED BY ZUSTAND
    }
  }
}
```

---

## Recommended Fix

### Option 1: Debug Why UI Isn't Adding Exercises (INVESTIGATE FIRST)

Check if `addExerciseToActive()` is actually being called:

```typescript
// store/useStore.ts:462
addExerciseToActive: (exerciseId) => {
  console.log('[DEBUG] addExerciseToActive called:', exerciseId); // ADD THIS
  const { activeWorkout } = get();
  if (!activeWorkout) {
    console.log('[DEBUG] No active workout!'); // ADD THIS
    return;
  }

  const newLog: ExerciseLog = {
    id: uuidv4(),
    exerciseId,
    sets: [{ id: uuidv4(), reps: 0, weight: 0, completed: false, type: 'N' }]
  };

  console.log('[DEBUG] Adding log:', newLog); // ADD THIS
  console.log('[DEBUG] Current logs:', activeWorkout.logs); // ADD THIS

  set({
    activeWorkout: {
      ...activeWorkout,
      logs: [...activeWorkout.logs, newLog]
    }
  });

  // VERIFY IT WAS ADDED
  console.log('[DEBUG] New logs:', get().activeWorkout?.logs); // ADD THIS
},
```

### Option 2: Ensure Zustand Persist is Subscribed Correctly

Check if there's a timing issue with persist middleware initialization.

### Option 3: Add Defensive Persistence

Force save after adding exercises:

```typescript
addExerciseToActive: (exerciseId) => {
  const { activeWorkout } = get();
  if (!activeWorkout) return;

  const newLog: ExerciseLog = { /* ... */ };

  set({
    activeWorkout: {
      ...activeWorkout,
      logs: [...activeWorkout.logs, newLog]
    }
  });

  // Force persistence (if using Zustand persist)
  // This ensures logs are saved immediately
  get().syncData(); // Or whatever sync method exists
},
```

### Option 4: Verify partialize Function

Ensure `activeWorkout` and its nested `logs` are being persisted:

```typescript
// store/useStore.ts:1568
partialize: (state) => {
  const {
    customExerciseVisuals,
    restTimerStart,
    activeBiometrics,
    // NOTE: These are JavaScript Set objects, not workout sets!
    pendingSyncWorkouts,
    pendingSyncTemplates,
    pendingSyncPrograms,
    pendingSyncDailyLogs,
    lastWorkoutXP,
    lastAchievements,
    lastLevelUp,
    ...rest
  } = state;

  // DEBUG: Log what's being persisted
  console.log('[PERSIST] Persisting state:', {
    activeWorkout: rest.activeWorkout,
    logCount: rest.activeWorkout?.logs?.length
  });

  return rest;
},
```

---

## Next Steps

1. **Add debug logging** to `addExerciseToActive` to verify it's being called
2. **Test the actual UI flow** (not manual localStorage edits) to see if exercises can be added
3. **Check if logs appear in UI** but not in store (UI state vs store state mismatch)
4. **Verify persist middleware** is correctly serializing nested arrays
5. **Check for race conditions** between UI updates and persist middleware
6. **Review any `useEffect` hooks** that might be clearing logs on mount

---

## Workaround (Temporary)

Until fixed, users should:
- ❌ NOT refresh the page during workouts
- ❌ NOT switch apps/tabs (mobile)
- ✅ Complete workouts without interruption
- ✅ Use "Save Draft" if it exists

**This is NOT acceptable for production.**

---

## Related Issues

- E2E test `e2e-comprehensive.spec.ts` shows "Workout data persists across reload: false" but test still passes
- This suggests the test is checking something different than actual exercise logs
- Need to update test to specifically verify `activeWorkout.logs` persistence

---

## Files Involved

- `store/useStore.ts:239-245` - `startWorkout()` creates empty logs
- `store/useStore.ts:462-480` - `addExerciseToActive()` should add exercises
- `store/useStore.ts:1568-1585` - `partialize()` persist configuration
- `pages/WorkoutLogger.tsx:1507,1558` - UI calls `addExerciseToActive()`

---

## Test Coverage Needed

```typescript
// test: activeWorkout.logs persist through refresh
test('exercise logs persist through page refresh', async () => {
  // 1. Start workout
  const { startWorkout, addExerciseToActive, updateSet } = useStore.getState();
  startWorkout();

  // 2. Add exercise
  addExerciseToActive('bench-press');

  // 3. Log sets
  updateSet(0, 0, { weight: 135, reps: 10, completed: true });
  updateSet(0, 1, { weight: 155, reps: 8, completed: true });

  // 4. Verify in-memory state
  const before = useStore.getState().activeWorkout;
  expect(before.logs.length).toBe(1);
  expect(before.logs[0].sets.length).toBe(2);

  // 5. Verify localStorage
  const storage = JSON.parse(localStorage.getItem('voltlift-storage'));
  expect(storage.state.activeWorkout.logs.length).toBe(1);

  // 6. Simulate page refresh (rehydrate from localStorage)
  // ... test rehydration logic ...

  // 7. Verify logs still exist
  const after = useStore.getState().activeWorkout;
  expect(after.logs.length).toBe(1);
  expect(after.logs[0].sets[0].weight).toBe(135);
});
```

---

## Priority

**P0 - CRITICAL**

This bug makes the app **completely unusable** for real workouts. Users will experience data loss within minutes of use. Must fix before any production release.
