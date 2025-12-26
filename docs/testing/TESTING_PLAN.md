# VoltLift Testing Plan

Find real bugs. Fix them. Write tests so they don't come back.

---

## What You Already Have

**Existing test files:**
- `e2e-comprehensive.spec.ts` - End-to-end flow testing
- `persistence-test.spec.ts` - Data persistence validation
- `profile-diagnostic.spec.ts` - Profile page diagnostics

**Automation:**
- `/design-review` - Accessibility + performance + brand audit (via Playwright)
- GitHub Actions - Security review and code review on PRs
- Playwright configured (`playwright.config.ts`)

**Known P0 bugs from CLAUDE.md:**
1. Workout session state management issues
2. Set logging not persisting properly
3. Rest timer not implemented
4. IndexedDB integration incomplete

---

## Step 1: Run What You Have (10 min)

```bash
# Start dev server
npm run dev

# In another terminal, run existing tests
npx playwright test

# View detailed results
npx playwright show-report
```

**Document:**
- ✅ What passes?
- ❌ What fails?
- ⚠️ What's not covered?

---

## Step 2: Reproduce P0 Bugs (30 min)

### Test 1: Workout Session State Management
```
1. npm run dev
2. Open http://localhost:3000
3. Complete onboarding (if needed)
4. Start new workout
5. Add exercise "Bench Press"
6. Log Set 1: 135 lbs × 10 reps
7. Log Set 2: 155 lbs × 8 reps
8. Refresh browser (F5)
9. → Is workout still there with both sets?
```

**Expected:** Workout preserved with all data
**Actual:** _[Document what actually happens]_

### Test 2: Set Logging Persistence
```
1. Complete a full workout (3 exercises, 3 sets each)
2. Tap "Complete Workout"
3. Navigate to History
4. → Does workout appear with all sets?
5. Open DevTools → Application → Local Storage
6. Check 'voltlift-storage' key
7. → Is completed workout in workoutHistory array?
```

**Expected:** Workout saved to localStorage and visible in history
**Actual:** _[Document what actually happens]_

### Test 3: Rest Timer
```
1. During a workout, look for rest timer UI
2. → Does it exist?
3. If yes: Start timer, does it count down?
4. If no: Confirmed missing feature
```

**Expected:** Rest timer functional between sets
**Actual:** _[Document what actually happens]_

### Test 4: IndexedDB Integration
```
1. Complete a workout with AI features enabled
2. Open DevTools → Application → IndexedDB
3. → Is there a voltlift database?
4. → Are AI-generated exercise images cached?
```

**Expected:** AI images stored in IndexedDB for offline access
**Actual:** _[Document what actually happens]_

---

## Step 3: Critical Path (1 hour)

Test the ONE flow that must work perfectly: **Start workout → Log sets → Complete → View history**

### Online + Offline Testing

**Part A: Online**
```
1. Start workout "Push Day"
2. Add: Bench Press, Overhead Press, Dips
3. Log 3 sets each with weight/reps
4. Complete workout
5. Fill out post-workout feedback
6. Complete daily wellness checkin
7. → Workout appears in history?
8. → Personal records detected?
9. → AI tip generated?
```

**Part B: Offline**
```
1. DevTools → Network → Offline
2. Start workout "Pull Day"
3. Add: Deadlift, Pull-ups, Rows
4. Log 3 sets each
5. Complete workout
6. → Does it save locally?
7. Go back online
8. → Does it sync to cloud (if Firebase configured)?
9. → Any error messages if sync fails?
```

**Part C: Refresh mid-workout**
```
1. Start workout, log 2 sets
2. Refresh browser
3. → Workout still there? Sets preserved?
```

---

## Step 4: Run Automated Checks (15 min)

### Design Review (Accessibility + Performance + Brand)
```bash
/design-review
```

This will automatically test:
- WCAG AA accessibility compliance
- Keyboard navigation
- Touch target sizes (≥ 44×44px)
- Color contrast ratios
- Performance benchmarks
- Responsive design (375px, 768px, 1440px)
- Brand consistency

**Output:** Markdown report with screenshots of issues

### Build Check
```bash
npm run build
```

- ✅ Build succeeds? No TypeScript errors?
- ⚠️ Any warnings about bundle size?
- 📦 Check `dist/` output size

---

## Step 5: Program Progression (30 min)

Programs are a core feature - progression must work.

```
1. Navigate to Programs page
2. Activate GZCLP (or any program)
3. Check: activeProgram.currentSessionIndex = 0
4. Start workout from program template
5. Complete the workout (match template exercises)
6. → Does currentSessionIndex advance to 1?
7. Complete Session 2
8. → Does currentSessionIndex advance to 2?

Edge cases:
- Complete a non-program workout → index unchanged?
- Skip a session manually → index behavior?
- Reach end of program (last session) → what happens?
```

---

## Step 6: Mobile Testing (30 min)

VoltLift is a Capacitor app - test on real device.

### iOS Device Testing
```bash
# Sync Capacitor
npx cap sync ios

# Open in Xcode
npx cap open ios

# Run on connected iPhone (not simulator)
```

**Test on real iPhone:**
1. Install app on device
2. Complete one full workout
3. Check:
   - Notch safe area handling (iPhone 14+)
   - Keyboard behavior when entering weight/reps
   - Background state (lock screen, switch apps)
   - Rest timer notifications (if implemented)
   - Touch targets comfortable for thumb

### Responsive Design (DevTools)
```
Chrome DevTools → Device Toolbar

Test at:
- iPhone SE (375px) - everything visible?
- iPhone 14 (390px) - safe areas?
- iPad (768px) - good use of space?
- Desktop (1440px) - not too wide?
```

---

## Step 7: Input Validation (15 min)

Try to break it with invalid inputs:

| Input | Expected Behavior | Actual |
|-------|-------------------|--------|
| Weight: -50 | Blocked or sanitized | ? |
| Weight: 0 | Allowed (deload) | ? |
| Reps: 0 | Allowed (failed set) or blocked? | ? |
| Reps: -5 | Blocked | ? |
| RPE: 15 | Blocked (max is 10) | ? |
| Exercise name: `<script>alert('xss')</script>` | Sanitized, no XSS | ? |

**Rapid-fire interactions:**
- Tap "Add Set" 10 times quickly → all sets added?
- Spam "Complete Workout" → only completes once?

---

## Step 8: Write Tests for Bugs Found (variable time)

**Only write tests for bugs you actually found.**

Example: If "workout not preserved on refresh" is broken:

```typescript
// Add to e2e-comprehensive.spec.ts or create new file
test('workout persists through browser refresh', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Start workout
  await page.click('text=Start Workout');
  await page.fill('[data-testid=workout-name]', 'Test Workout');

  // Add exercise and log set
  await page.click('text=Add Exercise');
  await page.click('text=Bench Press');
  await page.fill('[data-testid=weight-input]', '135');
  await page.fill('[data-testid=reps-input]', '10');
  await page.click('text=Add Set');

  // Refresh
  await page.reload();

  // Verify workout still exists
  await expect(page.locator('text=Test Workout')).toBeVisible();
  await expect(page.locator('text=135 lbs × 10 reps')).toBeVisible();
});
```

**Run new test:**
```bash
npx playwright test --grep "workout persists"
```

---

## Bug Documentation Template

When you find a bug, document it immediately:

```markdown
## BUG-001: Workout data lost on browser refresh

**Severity:** P0 (Critical)
**Component:** Workout Logger / State Management

**Steps to Reproduce:**
1. Start new workout
2. Add Bench Press
3. Log 2 sets (135×10, 155×8)
4. Refresh browser (F5)

**Expected:** Workout still present with both sets
**Actual:** Workout disappears, user returns to empty workout page

**Environment:**
- Browser: Chrome 120
- Device: Desktop (1440px)
- Mode: Online

**Root Cause (theory):**
Zustand persist middleware not saving to localStorage on set addition,
only on workout completion.

**Fix Priority:** Must fix before launch - users cannot lose workout data
```

---

## Execution Plan

### Session 1: Find the real bugs (1-2 hours)
- [ ] Run existing tests → document failures
- [ ] Reproduce 4 P0 bugs from CLAUDE.md
- [ ] Test critical path (start → log → complete → history)
- [ ] Test offline mode
- [ ] Create bug reports for issues found

### Session 2: Automated checks (30 min)
- [ ] Run `/design-review` on main pages
- [ ] Review accessibility issues
- [ ] Check performance benchmarks
- [ ] Test on real iPhone device

### Session 3: Fix and prevent (variable)
- [ ] Fix P0 bugs found
- [ ] Write regression tests for each fix
- [ ] Run full test suite to confirm fixes
- [ ] Update this doc with results

---

## Quick Commands

```bash
# Run all tests
npx playwright test

# Run tests with UI debugger
npx playwright test --ui

# Run specific test file
npx playwright test persistence-test.spec.ts

# View last test report
npx playwright show-report

# Start dev server
npm run dev

# Build for production
npm run build

# Run design review
/design-review

# Sync iOS app
npx cap sync ios && npx cap open ios
```

---

## Key Principles

1. **Run existing tests first** - Don't pretend you're starting from scratch
2. **Reproduce P0 bugs immediately** - They're already documented in CLAUDE.md
3. **Use automation you already have** - `/design-review` exists, use it
4. **Test on real iPhone** - Simulators lie about touch targets and safe areas
5. **Write regression tests** - But only for bugs you actually found and fixed
6. **Critical path must work** - Start workout → log sets → complete → view history

---

## Current Test Coverage

### ✅ TESTING COMPLETED - 2025-12-25

See [TESTING_SESSION_2025-12-25.md](TESTING_SESSION_2025-12-25.md) for full details.

**What's tested:**

- [x] ✅ All E2E tests pass (11 tests)
- [x] ✅ Onboarding flow
- [x] ✅ Workout creation and completion
- [x] ✅ Template management
- [x] ✅ Exercise library operations
- [x] ✅ History viewing
- [x] ✅ Analytics and progress tracking
- [x] ✅ Program enrollment
- [x] ✅ Empty states
- [x] ✅ Offline mode functionality
- [x] ✅ Workout persistence across reload
- [x] ✅ Keyboard navigation
- [x] ✅ Exercise log persistence (NEW regression test added)

**What's NOT tested (future work):**

- [ ] Mobile device testing on real iPhone
- [ ] HealthKit integration
- [ ] Program auto-progression logic
- [ ] Input validation edge cases
- [ ] Performance benchmarks (bundle size, load times)
- [ ] Design review (`/design-review` automation)

**P0 Bugs Status:**

- [x] ✅ Workout session state management - **NOT REPRODUCED** (Working correctly)
- [x] ✅ Set logging persistence - **NOT REPRODUCED** (All data persists through refresh)
- [x] ✅ Rest timer - **IMPLEMENTED** (Fully functional with countdown, +30s, skip)
- [x] ✅ IndexedDB integration - **WORKING** (VoltLiftAssets database ready for AI caching)

**Conclusion:** 🎉 All P0 bugs are RESOLVED. App is production-ready from critical functionality perspective.
