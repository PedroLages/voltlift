# VoltLift Playwright Test Suite - Design Document

**Date:** 2025-12-26
**Status:** 🚧 In Progress

---

## Overview

Comprehensive Playwright test suite for VoltLift using **Page Object Model** architecture for maintainability, reusability, and scalability.

---

## Current Test Coverage Analysis

### Existing Tests

1. **`manual-test.spec.ts`** (969 lines)
   - ✅ P1-1: Critical Path - Online Full Workflow
   - ✅ P1-2: Critical Path - Offline Mode
   - ✅ P1-3: Input Validation (Security + Edge Cases)
   - ✅ P1-4: Program Progression
   - **Issues:** BUG-APP-001 (modal close), 15+ minute execution time

2. **`e2e-comprehensive.spec.ts`**
   - ✅ New user onboarding
   - ✅ Create and complete workout
   - ✅ Template management
   - ✅ Exercise library operations
   - ✅ History viewing
   - ✅ Progress tracking

3. **`persistence-test.spec.ts`**
   - ✅ Workout persistence across page reloads
   - ✅ localStorage verification

4. **`profile-diagnostic.spec.ts`**
   - ✅ Profile page diagnostics

### Missing Coverage

**Core Features:**
- ❌ **Rest Timer Functionality** (just implemented!)
- ❌ PR Detection and Celebration
- ❌ Progressive Overload Suggestions
- ❌ AI Coach Integration (Gemini API)
- ❌ Exercise Visual Generation
- ❌ Custom Exercise Creation
- ❌ Exercise Swapping
- ❌ Superset Functionality
- ❌ Gamification Features
- ❌ Biometrics Tracking
- ❌ Daily Wellness Checkin
- ❌ Settings Management (Units, Plates, Cloud Sync)

**Quality Checks:**
- ❌ WCAG AA Accessibility Compliance
- ❌ Performance Benchmarks (< 100ms set logging, < 200ms page transitions)
- ❌ Mobile Responsiveness (375px, 768px, 1440px)
- ❌ Keyboard Navigation
- ❌ Focus Management

**Known Bugs:**
- ❌ **BUG-APP-001:** Exercise modal doesn't close properly (blocks P1-1, P1-2, P1-3)

---

## New Test Suite Architecture

### Directory Structure

```
tests/
├── page-objects/          # Page Object Model classes
│   ├── BasePage.ts
│   ├── WelcomePage.ts
│   ├── OnboardingPage.ts
│   ├── DashboardPage.ts
│   ├── WorkoutLoggerPage.ts
│   ├── ProgramsPage.ts
│   ├── HistoryPage.ts
│   ├── ProfilePage.ts
│   └── ExerciseLibraryPage.ts
├── helpers/               # Test utilities and helpers
│   ├── testUtils.ts      # Common test functions
│   ├── mockData.ts       # Test data generators
│   └── assertions.ts     # Custom assertions
├── fixtures/              # Test fixtures and data
│   ├── exercises.json
│   ├── programs.json
│   └── templates.json
├── suites/               # Organized test suites
│   ├── auth/
│   │   └── onboarding.spec.ts
│   ├── workout/
│   │   ├── quick-start.spec.ts
│   │   ├── template-workout.spec.ts
│   │   ├── program-workout.spec.ts
│   │   └── rest-timer.spec.ts     # NEW!
│   ├── features/
│   │   ├── pr-detection.spec.ts   # NEW!
│   │   ├── progressive-overload.spec.ts  # NEW!
│   │   ├── ai-coach.spec.ts       # NEW!
│   │   ├── supersets.spec.ts      # NEW!
│   │   ├── gamification.spec.ts   # NEW!
│   │   └── biometrics.spec.ts     # NEW!
│   ├── settings/
│   │   ├── units.spec.ts
│   │   ├── plates.spec.ts
│   │   └── cloud-sync.spec.ts
│   ├── quality/
│   │   ├── accessibility.spec.ts  # NEW!
│   │   ├── performance.spec.ts    # NEW!
│   │   └── responsiveness.spec.ts # NEW!
│   └── regression/
│       ├── offline-mode.spec.ts
│       ├── input-validation.spec.ts
│       └── program-progression.spec.ts
└── reports/              # Test reports and screenshots
    ├── screenshots/
    └── traces/
```

---

## Page Object Model Design

### Base Page Class

**File:** `tests/page-objects/BasePage.ts`

**Responsibilities:**
- Common navigation methods
- Screenshot utilities
- Wait helpers
- localStorage manipulation
- Testing mode enablement

**Methods:**
```typescript
class BasePage {
  constructor(page: Page)

  // Navigation
  async goto(path: string): Promise<void>
  async waitForPageLoad(): Promise<void>

  // Testing utilities
  async enableTestingMode(): Promise<void>
  async clearStorage(): Promise<void>
  async screenshot(name: string): Promise<void>

  // localStorage helpers
  async getStorage(): Promise<any>
  async setStorage(data: any): Promise<void>

  // Wait helpers
  async waitForSelector(selector: string, timeout?: number): Promise<void>
  async waitForText(text: string, timeout?: number): Promise<void>
}
```

### Workout Logger Page Object

**File:** `tests/page-objects/WorkoutLoggerPage.ts`

**Responsibilities:**
- Start workouts (Quick Start, Template, Program)
- Add/remove exercises
- Log sets (weight, reps, RPE)
- Rest timer interactions
- Complete workout
- Handle modals

**Methods:**
```typescript
class WorkoutLoggerPage extends BasePage {
  // Workout actions
  async startQuickWorkout(): Promise<void>
  async startFromTemplate(templateName: string): Promise<void>
  async startFromProgram(): Promise<void>

  // Exercise management
  async addExercise(exerciseName: string): Promise<void>
  async removeExercise(index: number): Promise<void>
  async swapExercise(index: number, newExercise: string): Promise<void>

  // Set logging
  async logSet(exerciseIndex: number, setIndex: number, weight: number, reps: number, rpe?: number): Promise<void>
  async logMultipleSets(exerciseIndex: number, sets: Array<{weight: number, reps: number}>): Promise<void>

  // Rest timer (NEW!)
  async waitForRestTimer(): Promise<void>
  async skipRestTimer(): Promise<void>
  async addRestTime(seconds: number): Promise<void>
  async subtractRestTime(seconds: number): Promise<void>
  async minimizeRestTimer(): Promise<void>

  // Completion
  async completeWorkout(): Promise<void>
  async submitPostWorkoutFeedback(energy?: number): Promise<void>

  // Assertions
  async assertExerciseAdded(exerciseName: string): Promise<void>
  async assertSetLogged(exerciseIndex: number, setIndex: number): Promise<void>
  async assertRestTimerActive(): Promise<void>
}
```

---

## Test Suite Organization

### 1. REST TIMER TESTS (NEW!)

**File:** `tests/suites/workout/rest-timer.spec.ts`

**Test Cases:**
- ✅ REST-001: Category-based rest timer starts automatically
  - Complete set of Compound exercise → 180s timer
  - Complete set of Isolation exercise → 90s timer
  - Complete set of Cardio exercise → 60s timer
- ✅ REST-002: Mid-workout adjustments work correctly
  - +30s button extends timer
  - -15s button reduces timer (min 15s)
  - Skip button ends timer immediately
- ✅ REST-003: Timer persists across page refresh
  - Start timer, refresh page, timer resumes
- ✅ REST-004: Global default fallback
  - Exercise without category → uses global default (90s)
- ✅ REST-005: Timer overlay UI
  - Minimize button collapses to corner
  - Countdown displays correctly
  - Controls are accessible

### 2. PR DETECTION TESTS (NEW!)

**File:** `tests/suites/features/pr-detection.spec.ts`

**Test Cases:**
- ✅ PR-001: Detect weight PR
  - Complete set with higher weight than previous best
  - Verify PR badge appears in UI
  - Check localStorage stores PR
- ✅ PR-002: Detect volume PR
  - Complete workout with higher total volume
  - Verify PR celebration
- ✅ PR-003: Detect rep PR at same weight
  - Complete set with more reps at same weight
  - Verify PR detection
- ✅ PR-004: Multiple PRs in single workout
  - Break multiple PRs in one session
  - Verify all PRs are tracked

### 3. PROGRESSIVE OVERLOAD TESTS (NEW!)

**File:** `tests/suites/features/progressive-overload.spec.ts`

**Test Cases:**
- ✅ PO-001: AI suggestions appear after set completion
  - Complete set with high RPE → see suggestion
  - Complete set with low RPE → see different suggestion
- ✅ PO-002: Suggestion accuracy
  - Verify suggestions are appropriate based on RPE
  - Check if suggestions reference previous workout data
- ✅ PO-003: Suggestion acceptance
  - Accept suggestion → next set pre-filled
  - Decline suggestion → manual input

### 4. ACCESSIBILITY TESTS (NEW!)

**File:** `tests/suites/quality/accessibility.spec.ts`

**Test Cases:**
- ✅ A11Y-001: WCAG AA contrast ratios
  - Primary text: #ccff00 on #000 → 4.5:1 minimum
  - Secondary text: #9ca3af on #000 → 4.5:1 minimum
  - Button states: hover, active, focus
- ✅ A11Y-002: Keyboard navigation
  - Tab through all interactive elements
  - Enter/Space activate buttons
  - Escape closes modals
- ✅ A11Y-003: Focus management
  - Visible focus indicators
  - Focus trap in modals
  - Focus returns after modal close
- ✅ A11Y-004: ARIA labels
  - Buttons have aria-label
  - Forms have labels
  - Images have alt text
- ✅ A11Y-005: Screen reader compatibility
  - Semantic HTML
  - Proper heading hierarchy
  - Live regions for dynamic content

### 5. PERFORMANCE TESTS (NEW!)

**File:** `tests/suites/quality/performance.spec.ts`

**Test Cases:**
- ✅ PERF-001: Set logging speed
  - Measure time from input to localStorage update
  - Target: < 100ms
- ✅ PERF-002: Page transition speed
  - Dashboard → Workout Logger → History
  - Target: < 200ms per transition
- ✅ PERF-003: Rest timer accuracy
  - Verify countdown is accurate (±1 second)
- ✅ PERF-004: Workout completion speed
  - Measure time from click to history entry
  - Target: < 2 seconds
- ✅ PERF-005: Core Web Vitals
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1

### 6. RESPONSIVENESS TESTS (NEW!)

**File:** `tests/suites/quality/responsiveness.spec.ts`

**Test Cases:**
- ✅ RESP-001: Mobile (375px - iPhone SE)
  - All buttons accessible in thumb-zone (bottom 60%)
  - No horizontal scroll
  - Touch targets ≥ 44x44px
- ✅ RESP-002: Tablet (768px)
  - Layout adapts correctly
  - No overlapping elements
- ✅ RESP-003: Desktop (1440px)
  - Content doesn't stretch too wide
  - Proper use of whitespace

### 7. BUG REGRESSION TESTS (NEW!)

**File:** `tests/suites/regression/bug-app-001-modal-close.spec.ts`

**Purpose:** Reproduce and verify fix for BUG-APP-001 (Exercise Modal Close Bug)

**Test Cases:**
- ✅ BUG-001-A: Exercise modal closes on exercise selection
  - Open exercise library modal
  - Click on an exercise card
  - Verify modal closes automatically
  - Verify exercise is added to workout
- ✅ BUG-001-B: Exercise modal closes on X button click
  - Open exercise library modal
  - Click X button in top-right corner
  - Verify modal closes without adding exercise
- ✅ BUG-001-C: Exercise modal closes on outside click
  - Open exercise library modal
  - Click on backdrop/overlay
  - Verify modal closes without adding exercise
- ✅ BUG-001-D: Exercise modal closes on Escape key
  - Open exercise library modal
  - Press Escape key
  - Verify modal closes without adding exercise
- ✅ BUG-001-E: Multiple rapid modal open/close cycles
  - Open modal → close → open → close (repeat 5 times)
  - Verify no stuck modals or UI corruption
- ✅ BUG-001-F: Modal close during network delay
  - Simulate slow network
  - Open modal → select exercise
  - Verify modal closes even if exercise hasn't loaded yet

**Bug Context:**
- **Reported:** Blocks P1-1, P1-2, P1-3 tests
- **Symptom:** Exercise modal doesn't close properly after selection
- **Impact:** Tests timeout waiting for modal to close, prevents adding multiple exercises
- **Root Cause:** TBD - requires component investigation
- **Status:** ⏳ Pending Fix

---

## Test Helpers Design

### Test Utilities

**File:** `tests/helpers/testUtils.ts`

```typescript
// Onboarding helpers
export async function completeOnboarding(page: Page, name?: string): Promise<void>
export async function skipOnboarding(page: Page): Promise<void>

// Workout helpers
export async function createQuickWorkout(page: Page, exercises: string[]): Promise<void>
export async function logStandardSets(page: Page, exerciseCount: number): Promise<void>

// Exercise helpers
export async function addExerciseToWorkout(page: Page, exerciseName: string): Promise<void>
export async function closeExerciseModal(page: Page): Promise<void>

// Storage helpers
export async function getActiveWorkout(page: Page): Promise<any>
export async function getWorkoutHistory(page: Page): Promise<any[]>
export async function clearAllData(page: Page): Promise<void>

// Wait helpers
export async function waitForRestTimer(page: Page): Promise<void>
export async function waitForModal(page: Page, modalTitle: string): Promise<void>

// Screenshot helpers
export async function screenshotWithAnnotation(page: Page, name: string, annotation: string): Promise<void>
```

### Custom Assertions

**File:** `tests/helpers/assertions.ts`

```typescript
export async function assertWorkoutPersisted(page: Page, workoutId: string): Promise<void>
export async function assertPRDetected(page: Page, exerciseName: string, prType: 'weight' | 'reps' | 'volume'): Promise<void>
export async function assertRestTimerActive(page: Page, duration: number): Promise<void>
export async function assertAccessibilityCompliant(page: Page): Promise<void>
export async function assertPerformanceMetric(metricName: string, actual: number, target: number): Promise<void>
```

---

## Execution Strategy

### Test Prioritization

**P0 - Smoke Tests (Run on every commit):**
- Quick Start workout
- Set logging
- Workout completion
- localStorage persistence

**P1 - Core Features (Run on every PR):**
- All workout flows
- Rest timer
- PR detection
- Program progression
- Offline mode

**P2 - Quality (Run nightly):**
- Accessibility
- Performance
- Responsiveness
- Security/validation

**P3 - Regression (Run weekly):**
- All existing P1 tests
- Edge cases
- Cross-browser

### Parallel Execution

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'mobile', use: devices['iPhone 12'] },
    { name: 'tablet', use: devices['iPad Pro'] },
  ],
});
```

---

## Test Data Strategy

### Fixtures

**File:** `tests/fixtures/exercises.json`
```json
{
  "compound": ["Barbell Squat", "Barbell Deadlift", "Barbell Bench Press"],
  "isolation": ["Bicep Curl", "Tricep Extension", "Lateral Raise"],
  "cardio": ["Jump Rope", "Burpees", "Running"]
}
```

**File:** `tests/fixtures/programs.json`
```json
{
  "stronglifts": {
    "id": "prog_sl5x5",
    "name": "StrongLifts 5x5",
    "sessions": ["sl5x5_a", "sl5x5_b"]
  }
}
```

---

## Implementation Plan

### Phase 1: Foundation (Day 1)
- ✅ Create directory structure
- ✅ Implement BasePage class
- ✅ Implement WorkoutLoggerPage
- ✅ Create test helpers
- ✅ Setup fixtures

### Phase 2: Priority Tests (Day 2)
- ✅ Rest Timer tests (REST-001 through REST-005)
- ✅ PR Detection tests (PR-001 through PR-004)
- ✅ Progressive Overload tests (PO-001 through PO-003)

### Phase 3: Quality Tests (Day 3)
- ✅ Accessibility tests (A11Y-001 through A11Y-005)
- ✅ Performance tests (PERF-001 through PERF-005)
- ✅ Responsiveness tests (RESP-001 through RESP-003)

### Phase 4: Integration (Day 4)
- ✅ Integrate with existing tests
- ✅ Optimize execution time
- ✅ Setup CI/CD integration
- ✅ Documentation

---

## Success Metrics

**Code Quality:**
- ✅ All tests pass on first run
- ✅ < 5% flaky test rate
- ✅ Code coverage > 80%

**Performance:**
- ✅ Full test suite < 10 minutes
- ✅ Smoke tests < 2 minutes
- ✅ Individual test < 30 seconds

**Maintainability:**
- ✅ Page Object reuse > 70%
- ✅ Test helper reuse > 60%
- ✅ Clear, descriptive test names

---

## Next Steps

1. **Implement Page Objects** - Start with BasePage and WorkoutLoggerPage
2. **Create Test Helpers** - testUtils.ts and assertions.ts
3. **Write Rest Timer Tests** - Validate newly implemented feature
4. **Add Quality Tests** - Accessibility, performance, responsiveness
5. **Optimize Existing Tests** - Reduce P1-4 execution time
6. **Documentation** - README for running tests

---

## Files to Create

1. `tests/page-objects/BasePage.ts`
2. `tests/page-objects/WorkoutLoggerPage.ts`
3. `tests/page-objects/ProgramsPage.ts`
4. `tests/helpers/testUtils.ts`
5. `tests/helpers/assertions.ts`
6. `tests/fixtures/exercises.json`
7. `tests/suites/workout/rest-timer.spec.ts`
8. `tests/suites/features/pr-detection.spec.ts`
9. `tests/suites/quality/accessibility.spec.ts`
10. `tests/suites/quality/performance.spec.ts`
11. **`tests/suites/regression/bug-app-001-modal-close.spec.ts`** ← BUG-APP-001

---

## Conclusion

This comprehensive test suite design provides:
- ✅ **Modular architecture** with Page Object Model
- ✅ **Complete coverage** of existing and new features
- ✅ **Quality checks** for accessibility, performance, responsiveness
- ✅ **Maintainability** through reusable helpers and fixtures
- ✅ **Scalability** for future feature additions

**Estimated Implementation Time:** 3-4 days
**Estimated Test Execution Time:** < 10 minutes (full suite)
**Expected Benefits:** 80%+ code coverage, < 5% flaky tests, easy maintenance
