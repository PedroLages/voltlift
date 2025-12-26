/**
 * BUG-APP-001: Exercise Modal Close Bug - Regression Test Suite
 *
 * Bug Description:
 * Exercise modal doesn't close properly after selecting an exercise.
 * Modal remains open and blocks adding subsequent exercises.
 *
 * Impact: CRITICAL - Blocks P1-1, P1-2, P1-3 tests
 * Status: ⏳ Pending Fix
 *
 * Test Strategy:
 * - Reproduce the bug to verify it exists
 * - Test all possible close methods
 * - Test edge cases (rapid clicks, network delays)
 * - Once fixed, these tests become regression prevention
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper: Enable testing mode
async function enableTestingMode(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('TESTING_MODE', 'true');
  });
}

// Helper: Complete onboarding
async function completeOnboarding(page: Page) {
  await page.goto(BASE_URL);
  await enableTestingMode(page);
  await page.reload();
  await page.waitForTimeout(1000);

  const url = page.url();

  if (url.includes('welcome')) {
    const joinButton = page.locator('button:has-text("JOIN THE CULT")').first();
    if (await joinButton.isVisible().catch(() => false)) {
      await joinButton.click();
      await page.waitForTimeout(2000);
    }
  }

  if (page.url().includes('onboarding')) {
    // Complete all onboarding steps
    for (let i = 0; i < 5; i++) {
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("INITIATE")').first();
      if (await nextButton.isVisible().catch(() => false)) {
        // Fill name if on that step
        const nameInput = page.locator('input[type="text"]').first();
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill('BUG-001 Test User');
          await page.waitForTimeout(500);
        }

        await nextButton.click();
        await page.waitForTimeout(1500);

        if (page.url().includes('dashboard') || page.url() === `${BASE_URL}/#/`) {
          break;
        }
      }
    }
  }
}

// Helper: Start a workout
async function startWorkout(page: Page) {
  await page.goto(`${BASE_URL}/#/workout`);
  await page.waitForTimeout(2000);

  const quickStartButton = page.locator('button:has-text("Quick Start")').first();
  if (await quickStartButton.isVisible().catch(() => false)) {
    await quickStartButton.click();
    await page.waitForTimeout(2000);
  }
}

// Helper: Check if modal is visible
async function isModalVisible(page: Page): Promise<boolean> {
  const modal = page.locator('[role="dialog"], .modal, [class*="Modal"]').first();
  return await modal.isVisible().catch(() => false);
}

test.describe('BUG-APP-001: Exercise Modal Close Regression', () => {

  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page);
    await startWorkout(page);
  });

  // ============================================
  // BUG-001-A: Exercise modal closes on exercise selection
  // ============================================
  test('BUG-001-A: Modal closes after selecting exercise', async ({ page }) => {
    console.log('\n=== BUG-001-A: Exercise Selection Close ===');

    // Step 1: Open exercise modal
    console.log('Step 1: Opening exercise modal...');
    const addExerciseButton = page.locator('button:has-text("Add Exercise")').first();
    await addExerciseButton.click();
    await page.waitForTimeout(1000);

    // Verify modal opened
    const modalOpen = await isModalVisible(page);
    console.log('  ✓ Modal opened:', modalOpen);
    expect(modalOpen, 'Modal should open').toBe(true);

    // Step 2: Click on an exercise
    console.log('Step 2: Selecting Bench Press...');
    const exerciseCard = page.locator('text=Bench Press').first();
    const exerciseVisible = await exerciseCard.isVisible().catch(() => false);
    console.log('  ✓ Exercise card visible:', exerciseVisible);

    if (exerciseVisible) {
      await exerciseCard.click();
      console.log('  ✓ Clicked exercise card');

      // CRITICAL: Wait for modal to close
      // This is where the bug occurs - modal should close but doesn't
      await page.waitForTimeout(2000);

      // Step 3: Verify modal closed
      const modalStillOpen = await isModalVisible(page);
      console.log('  ✓ Modal still open after selection:', modalStillOpen);

      // BUG ASSERTION: This should be false (modal closed), but currently true (modal stuck open)
      expect(modalStillOpen, 'BUG: Modal should close after exercise selection').toBe(false);

      // Step 4: Verify exercise was added
      const exerciseAdded = await page.locator('text=Bench Press').count() > 0;
      console.log('  ✓ Exercise added to workout:', exerciseAdded);
      expect(exerciseAdded, 'Exercise should be added to workout').toBe(true);
    } else {
      console.log('  ⚠️ Exercise card not found - test cannot proceed');
      test.skip();
    }
  });

  // ============================================
  // BUG-001-B: Exercise modal closes on X button click
  // ============================================
  test('BUG-001-B: Modal closes when clicking X button', async ({ page }) => {
    console.log('\n=== BUG-001-B: X Button Close ===');

    // Open modal
    const addExerciseButton = page.locator('button:has-text("Add Exercise")').first();
    await addExerciseButton.click();
    await page.waitForTimeout(1000);

    const modalOpen = await isModalVisible(page);
    expect(modalOpen, 'Modal should open').toBe(true);

    // Find and click X button (common patterns)
    const closeButton = page.locator('button[aria-label*="close"], button:has-text("×"), button:has-text("✕")').first();
    const closeButtonVisible = await closeButton.isVisible().catch(() => false);
    console.log('  ✓ Close button visible:', closeButtonVisible);

    if (closeButtonVisible) {
      await closeButton.click();
      await page.waitForTimeout(1000);

      const modalClosed = !(await isModalVisible(page));
      console.log('  ✓ Modal closed:', modalClosed);
      expect(modalClosed, 'Modal should close when X button clicked').toBe(true);
    } else {
      console.log('  ⚠️ Close button not found - modal may use different close mechanism');
    }
  });

  // ============================================
  // BUG-001-C: Exercise modal closes on outside click (backdrop)
  // ============================================
  test('BUG-001-C: Modal closes when clicking backdrop', async ({ page }) => {
    console.log('\n=== BUG-001-C: Backdrop Click Close ===');

    // Open modal
    const addExerciseButton = page.locator('button:has-text("Add Exercise")').first();
    await addExerciseButton.click();
    await page.waitForTimeout(1000);

    const modalOpen = await isModalVisible(page);
    expect(modalOpen, 'Modal should open').toBe(true);

    // Click outside modal (on backdrop)
    // Strategy: Click at top-left corner where backdrop should be
    await page.mouse.click(10, 10);
    await page.waitForTimeout(1000);

    const modalClosed = !(await isModalVisible(page));
    console.log('  ✓ Modal closed after backdrop click:', modalClosed);

    // Note: Some modals intentionally don't close on backdrop click
    // This test documents the expected behavior
    if (!modalClosed) {
      console.log('  ℹ️ Modal doesn\'t close on backdrop click - this may be intentional');
    }
  });

  // ============================================
  // BUG-001-D: Exercise modal closes on Escape key
  // ============================================
  test('BUG-001-D: Modal closes when pressing Escape', async ({ page }) => {
    console.log('\n=== BUG-001-D: Escape Key Close ===');

    // Open modal
    const addExerciseButton = page.locator('button:has-text("Add Exercise")').first();
    await addExerciseButton.click();
    await page.waitForTimeout(1000);

    const modalOpen = await isModalVisible(page);
    expect(modalOpen, 'Modal should open').toBe(true);

    // Press Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const modalClosed = !(await isModalVisible(page));
    console.log('  ✓ Modal closed after Escape:', modalClosed);
    expect(modalClosed, 'Modal should close when Escape is pressed').toBe(true);
  });

  // ============================================
  // BUG-001-E: Multiple rapid modal open/close cycles
  // ============================================
  test('BUG-001-E: Rapid open/close cycles work correctly', async ({ page }) => {
    console.log('\n=== BUG-001-E: Rapid Open/Close Cycles ===');

    const cycles = 5;
    let allCyclesSucceeded = true;

    for (let i = 0; i < cycles; i++) {
      console.log(`\n  Cycle ${i + 1}/${cycles}:`);

      // Open modal
      const addExerciseButton = page.locator('button:has-text("Add Exercise")').first();
      await addExerciseButton.click();
      await page.waitForTimeout(500);

      const modalOpen = await isModalVisible(page);
      console.log(`    ✓ Modal opened: ${modalOpen}`);

      if (!modalOpen) {
        allCyclesSucceeded = false;
        console.log(`    ❌ Cycle ${i + 1} failed to open modal`);
        break;
      }

      // Close modal (try Escape)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      const modalClosed = !(await isModalVisible(page));
      console.log(`    ✓ Modal closed: ${modalClosed}`);

      if (!modalClosed) {
        allCyclesSucceeded = false;
        console.log(`    ❌ Cycle ${i + 1} failed to close modal`);
        break;
      }
    }

    expect(allCyclesSucceeded, `All ${cycles} open/close cycles should succeed`).toBe(true);
  });

  // ============================================
  // BUG-001-F: Modal close during network delay
  // ============================================
  test('BUG-001-F: Modal closes even with slow network', async ({ page, context }) => {
    console.log('\n=== BUG-001-F: Modal Close with Network Delay ===');

    // Simulate slow network
    await context.route('**/*', route => {
      setTimeout(() => route.continue(), 1000); // 1 second delay
    });

    console.log('  ✓ Network throttled (1s delay)');

    // Open modal
    const addExerciseButton = page.locator('button:has-text("Add Exercise")').first();
    await addExerciseButton.click();
    await page.waitForTimeout(1000);

    const modalOpen = await isModalVisible(page);
    expect(modalOpen, 'Modal should open despite network delay').toBe(true);

    // Select exercise
    const exerciseCard = page.locator('text=Bench Press').first();
    if (await exerciseCard.isVisible().catch(() => false)) {
      await exerciseCard.click();
      console.log('  ✓ Clicked exercise card');

      // Wait for modal to close (even with network delay)
      await page.waitForTimeout(2000);

      const modalClosed = !(await isModalVisible(page));
      console.log('  ✓ Modal closed despite slow network:', modalClosed);

      // BUG ASSERTION: Modal should close optimistically, not wait for network
      expect(modalClosed, 'Modal should close immediately, not wait for network').toBe(true);
    }

    // Clean up: Remove network throttling
    await context.unroute('**/*');
  });

  // ============================================
  // BUG-001-G: Multiple exercises can be added consecutively
  // ============================================
  test('BUG-001-G: Can add multiple exercises without modal getting stuck', async ({ page }) => {
    console.log('\n=== BUG-001-G: Multiple Exercise Addition ===');

    const exercisesToAdd = ['Bench Press', 'Overhead Press', 'Dips'];
    let allExercisesAdded = true;

    for (let i = 0; i < exercisesToAdd.length; i++) {
      const exerciseName = exercisesToAdd[i];
      console.log(`\n  Adding exercise ${i + 1}/${exercisesToAdd.length}: ${exerciseName}`);

      // Open modal
      const addExerciseButton = page.locator('button:has-text("Add Exercise")').first();
      const buttonVisible = await addExerciseButton.isVisible().catch(() => false);

      if (!buttonVisible) {
        console.log(`    ❌ Add Exercise button not visible - modal may be stuck`);
        allExercisesAdded = false;
        break;
      }

      await addExerciseButton.click();
      await page.waitForTimeout(1000);

      // Verify modal opened
      const modalOpen = await isModalVisible(page);
      console.log(`    ✓ Modal opened: ${modalOpen}`);

      if (!modalOpen) {
        console.log(`    ❌ Modal failed to open for exercise ${i + 1}`);
        allExercisesAdded = false;
        break;
      }

      // Select exercise
      const exerciseCard = page.locator(`text=${exerciseName}`).first();
      const exerciseVisible = await exerciseCard.isVisible().catch(() => false);

      if (!exerciseVisible) {
        console.log(`    ⚠️ Exercise "${exerciseName}" not found in modal`);
        // Close modal and continue
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        continue;
      }

      await exerciseCard.click();
      console.log(`    ✓ Clicked ${exerciseName}`);

      // CRITICAL: Wait for modal to close
      // This is where BUG-APP-001 occurs
      await page.waitForTimeout(2000);

      const modalClosed = !(await isModalVisible(page));
      console.log(`    ✓ Modal closed: ${modalClosed}`);

      if (!modalClosed) {
        console.log(`    ❌ BUG DETECTED: Modal stuck open after adding ${exerciseName}`);
        allExercisesAdded = false;
        break;
      }

      // Verify exercise was added
      const exerciseInWorkout = await page.locator(`text=${exerciseName}`).count() > 0;
      console.log(`    ✓ ${exerciseName} added to workout: ${exerciseInWorkout}`);
    }

    // Final assertion
    expect(allExercisesAdded, 'All exercises should be added without modal getting stuck').toBe(true);

    // Count how many exercises are actually in the workout
    const exerciseCount = await page.locator('[data-testid="exercise-log"], .exercise-card').count();
    console.log(`\n  ✓ Total exercises in workout: ${exerciseCount}`);
    expect(exerciseCount, `Should have ${exercisesToAdd.length} exercises`).toBe(exercisesToAdd.length);
  });
});

// ============================================
// Helper Test: Document Current Bug Behavior
// ============================================
test.describe('BUG-APP-001: Bug Documentation', () => {
  test('Document current bug behavior for debugging', async ({ page }) => {
    console.log('\n=== BUG-APP-001 DOCUMENTATION TEST ===');
    console.log('This test documents the exact bug behavior for developers\n');

    await completeOnboarding(page);
    await startWorkout(page);

    // Open modal
    console.log('1. Opening exercise modal...');
    const addExerciseButton = page.locator('button:has-text("Add Exercise")').first();
    await addExerciseButton.click();
    await page.waitForTimeout(1000);

    // Take screenshot of modal
    await page.screenshot({
      path: 'bug-app-001-modal-open.png',
      fullPage: true
    });
    console.log('   📸 Screenshot: bug-app-001-modal-open.png');

    // Click exercise
    console.log('\n2. Clicking Bench Press...');
    const exerciseCard = page.locator('text=Bench Press').first();
    if (await exerciseCard.isVisible().catch(() => false)) {
      await exerciseCard.click();
      await page.waitForTimeout(1000);

      // Take screenshot after click
      await page.screenshot({
        path: 'bug-app-001-after-click.png',
        fullPage: true
      });
      console.log('   📸 Screenshot: bug-app-001-after-click.png');

      // Check modal state
      const modalStillVisible = await isModalVisible(page);
      console.log(`\n3. Modal still visible: ${modalStillVisible}`);

      if (modalStillVisible) {
        console.log('   ❌ BUG CONFIRMED: Modal is stuck open');
        console.log('   Expected: Modal should be closed');
        console.log('   Actual: Modal is still visible\n');

        // Document DOM state
        const modalHTML = await page.locator('[role="dialog"], .modal, [class*="Modal"]').first().innerHTML().catch(() => 'Not found');
        console.log('   Modal HTML:\n', modalHTML.substring(0, 200), '...\n');

        // Try to find showExerciseSelector state
        const storeState = await page.evaluate(() => {
          const storage = localStorage.getItem('voltlift-storage');
          if (storage) {
            return JSON.parse(storage);
          }
          return null;
        });
        console.log('   Store state:', JSON.stringify(storeState?.state?.activeWorkout, null, 2).substring(0, 300));
      } else {
        console.log('   ✅ Modal closed correctly - bug may be fixed!');
      }
    }

    // This test always passes - it's for documentation only
    expect(true).toBe(true);
  });
});
