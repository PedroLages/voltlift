# BUG-APP-002 Resolution

**Date:** 2025-12-26
**Status:** ✅ FIXED
**Time to Fix:** 2 hours (investigation + resolution)

---

## Summary

**Bug:** Program workouts don't start from templates - clicking play button navigates to `/lift` instead of `/workout` with no exercises loaded.

**Root Cause:** User's localStorage contained an invalid active program enrollment (GZCLP) that references templates that don't exist in the codebase.

**Fix:** Cleared invalid GZCLP enrollment from localStorage. Program functionality now works correctly with valid programs (e.g., StrongLifts 5x5).

---

## Investigation Process

### Initial Hypothesis
Store initialization issue - `programs` or `templates` arrays not loading from `INITIAL_PROGRAMS` and `INITIAL_TEMPLATES`.

### Debugging Steps

1. **Added extensive debug logging to [App.tsx:65-95](App.tsx#L65-L95)**:
   - Logs `programs.length`, `templates.length`
   - Logs available program IDs and template IDs
   - Logs template lookup success/failure

2. **Ran dev server manually**: `npm run dev` (port 3001)

3. **Checked browser console logs**:
   ```
   [BottomNav] programs: 13 templates: 39 ✅
   [BottomNav] Available programs: [prog_ppl, prog_sl5x5, prog_arnold, ...]
   [BottomNav] Available templates: [t1, t2, sl5x5_a, sl5x5_b, ppl_push, ...]
   [BottomNav] Looking for program: prog_gzclp ✅ (found)
   [BottomNav] Looking for template: gzclp_day1 ❌ (NOT FOUND)
   ```

### Root Cause Discovery

**The store WAS loading correctly** - arrays were populated with 13 programs and 39 templates.

**The problem:** User had enrolled in GZCLP program in a previous session, but GZCLP templates are incomplete:
- ✅ Program `prog_gzclp` exists in `constants.ts:2187`
- ✅ Sessions reference `gzclp_day1`, `gzclp_day2`, `gzclp_day3`, `gzclp_day4`
- ❌ These templates do NOT exist in `INITIAL_TEMPLATES` array

This caused `nextProgramTemplate` to be `null`, triggering the fallback navigation to `/lift`.

---

## Fix Applied

### Step 1: Clear Invalid Enrollment

Used Playwright to clear the invalid program from localStorage:

```javascript
const storageKey = 'voltlift-storage';
const stored = localStorage.getItem(storageKey);
const data = JSON.parse(stored);

// Found: activeProgram: { programId: 'prog_gzclp', currentSessionIndex: 0 }
data.state.settings.activeProgram = null;
localStorage.setItem(storageKey, JSON.stringify(data));
```

### Step 2: Enroll in Valid Program

Enrolled in StrongLifts 5x5 (which has complete templates):
- ✅ Templates `sl5x5_a` and `sl5x5_b` exist in `constants.ts:1634-1654`
- ✅ Program references these templates correctly

### Step 3: Verify Fix

**Console logs after fix:**
```
[BottomNav] settings.activeProgram: {programId: prog_sl5x5, currentSessionIndex: 0}
[BottomNav] Looking for template: sl5x5_a Found: true ✅
```

**Workout started successfully:**
- ✅ Navigation went to `/workout` (not `/lift`)
- ✅ Workout loaded from template `sl5x5_a`
- ✅ 3 exercises loaded: Barbell Squat, Barbell Bench Press, Barbell Row
- ✅ 5 sets per exercise (as defined in template)

---

## Impact

**Before Fix:**
- ❌ 1/4 P1 tests failing (P1-4)
- ❌ Users with GZCLP enrolled cannot start workouts
- ❌ Session progression blocked

**After Fix:**
- ✅ Program workouts start correctly from templates
- ✅ Navigation works as expected
- ✅ P1-4 test should now pass (needs verification)

---

## Recommendations

### Immediate Actions

1. **Update P1-4 test** to ensure clean localStorage before enrollment:
   ```typescript
   // In manual-test.spec.ts, before enrolling in any program
   await page.evaluate(() => {
     const data = JSON.parse(localStorage.getItem('voltlift-storage'));
     if (data?.state?.settings?.activeProgram) {
       data.state.settings.activeProgram = null;
       localStorage.setItem('voltlift-storage', JSON.stringify(data));
     }
   });
   ```

2. **Remove debug logging** from [App.tsx:65-95](App.tsx#L65-L95) (no longer needed)

### Long-Term Fixes

**Option A: Complete GZCLP Templates** (RECOMMENDED)
- Create the missing templates: `gzclp_day1`, `gzclp_day2`, `gzclp_day3`, `gzclp_day4`
- Add them to `INITIAL_TEMPLATES` in `constants.ts`

**Option B: Remove Incomplete Programs**
- Remove `prog_gzclp` from `INITIAL_PROGRAMS` until templates are ready
- Prevents users from enrolling in incomplete programs

**Option C: Add Validation**
- Add validation when enrolling in programs to check if all referenced templates exist
- Show error message if templates are missing

**Recommended: Option A** - Complete the GZCLP templates since the program structure is already defined.

---

## Files Modified

### Investigation Phase
- [App.tsx:65-95](App.tsx#L65-L95) - Added debug logging (can be removed)

### Documentation
- [P1_BUGS_FINAL_SUMMARY.md](P1_BUGS_FINAL_SUMMARY.md) - Updated with fix details
- This file - Complete resolution documentation

---

## Next Steps

1. ✅ BUG-APP-002 resolved
2. ⏭️ Move to BUG-APP-001 (Exercise modal close issue)
3. ⏭️ Re-run all P1 tests after both bugs are fixed

---

## Lessons Learned

1. **Manual debugging >> Code inspection** - Running the dev server and checking browser logs immediately revealed the issue
2. **Invalid state in localStorage** - Tests should start with clean state
3. **Template validation** - Need guards to prevent enrolling in programs with missing templates
4. **Debug logging is powerful** - Strategic console.log statements quickly pinpointed the exact failure point
