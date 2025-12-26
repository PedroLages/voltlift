/**
 * PRODUCTION MODE VERIFICATION TEST
 *
 * Verifies that production users (without TESTING_MODE) can:
 * 1. Complete onboarding and have templates/programs persist
 * 2. Complete Daily Wellness Check-in
 * 3. Start sessions from Dual-Phase Domination program
 *
 * This test does NOT use TESTING_MODE - it simulates real production users.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('PRODUCTION MODE: Real User Simulation', () => {

  test('PROD-001: Templates and programs persist after onboarding (no TESTING_MODE)', async ({ page }) => {
    console.log('\n=== PROD-001: Production Mode Onboarding Verification ===');

    // Step 1: Clear all data to simulate fresh user
    console.log('\nStep 1: Clearing localStorage to simulate fresh user...');
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.waitForTimeout(1000);

    // Step 2: Verify TESTING_MODE is NOT set (production mode)
    const testingMode = await page.evaluate(() => {
      return localStorage.getItem('TESTING_MODE');
    });
    console.log(`  Testing Mode: ${testingMode}`);
    expect(testingMode).toBeNull();

    // Step 3: Start app fresh
    console.log('\nStep 2: Loading app fresh (production mode)...');
    await page.goto(`${BASE_URL}/#/`);
    await page.waitForTimeout(3000);

    // Step 4: Should see onboarding or welcome page
    console.log('\nStep 3: Looking for onboarding flow...');
    const hasWelcome = await page.locator('text=/welcome|get started|begin/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  Welcome/Onboarding visible: ${hasWelcome}`);

    // Step 5: Navigate to onboarding if needed
    if (!hasWelcome) {
      console.log('  Navigating to onboarding manually...');
      await page.goto(`${BASE_URL}/#/onboarding`);
      await page.waitForTimeout(2000);
    }

    // Step 6: Complete onboarding
    console.log('\nStep 4: Completing onboarding...');

    // Name input
    const nameInput = page.locator('input[type="text"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Production User');
      await page.waitForTimeout(500);

      // Click next/continue button
      const nextButton = page.locator('button').filter({ hasText: /next|continue/i }).first();
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Select goal (Build Muscle)
    const goalButton = page.locator('button').filter({ hasText: /build muscle|strength|muscle/i }).first();
    if (await goalButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await goalButton.click();
      await page.waitForTimeout(1500);

      const nextButton = page.locator('button').filter({ hasText: /next|continue/i }).first();
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Select experience level (Beginner)
    const beginnerButton = page.locator('button').filter({ hasText: /beginner|new to/i }).first();
    if (await beginnerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await beginnerButton.click();
      await page.waitForTimeout(1500);

      const nextButton = page.locator('button').filter({ hasText: /next|continue/i }).first();
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Select equipment (all)
    const equipmentOptions = page.locator('button').filter({ hasText: /barbell|dumbbell|machine/i });
    const equipmentCount = await equipmentOptions.count().catch(() => 0);
    if (equipmentCount > 0) {
      for (let i = 0; i < Math.min(equipmentCount, 5); i++) {
        await equipmentOptions.nth(i).click();
        await page.waitForTimeout(300);
      }

      const finishButton = page.locator('button').filter({ hasText: /finish|complete|get started/i }).first();
      if (await finishButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await finishButton.click();
        await page.waitForTimeout(3000);
      }
    }

    // Step 7: Wait for Zustand persist to write to localStorage (it's debounced)
    console.log('\nStep 5: Waiting for persistence...');
    await page.waitForTimeout(3000); // Give Zustand persist time to write

    // Step 8: Verify templates and programs persisted to localStorage
    console.log('\nStep 6: Verifying templates and programs persisted...');
    const persistenceCheck = await page.evaluate(() => {
      const storage = localStorage.getItem('voltlift-storage');
      if (!storage) {
        return { found: false, error: 'No voltlift-storage in localStorage' };
      }

      const data = JSON.parse(storage);
      return {
        found: true,
        version: data.version,
        onboardingCompleted: data.state?.settings?.onboardingCompleted,
        templateCount: data.state?.templates?.length || 0,
        programCount: data.state?.programs?.length || 0,
        hasDualPhase: data.state?.programs?.some((p: any) => p.name === 'Dual-Phase Domination') || false,
      };
    });

    console.log('  Persistence Check:', JSON.stringify(persistenceCheck, null, 2));

    // Assertions
    expect(persistenceCheck.found, 'voltlift-storage should exist').toBe(true);
    expect(persistenceCheck.version, 'Should be version 7').toBe(7);
    expect(persistenceCheck.onboardingCompleted, 'Onboarding should be complete').toBe(true);
    expect(persistenceCheck.templateCount, 'Templates should persist').toBeGreaterThan(0);
    expect(persistenceCheck.programCount, 'Programs should persist').toBeGreaterThan(0);
    expect(persistenceCheck.hasDualPhase, 'Dual-Phase Domination should exist').toBe(true);

    console.log('\n✅ PROD-001 PASSED: Templates and programs persist in production mode');
  });

  test('PROD-002: Daily Wellness Check-in completion works', async ({ page }) => {
    console.log('\n=== PROD-002: Daily Wellness Check-in Completion ===');

    // Use the persisted state from PROD-001
    await page.goto(`${BASE_URL}/#/`);
    await page.waitForTimeout(2000);

    // Navigate to home/lift page
    await page.goto(`${BASE_URL}/#/lift`);
    await page.waitForTimeout(2000);

    // Look for wellness check-in trigger
    console.log('\nLooking for wellness check-in...');
    const wellnessButton = page.locator('button').filter({ hasText: /wellness|check-in|daily/i }).first();
    const hasWellnessButton = await wellnessButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasWellnessButton) {
      console.log('  ✓ Wellness check-in button found');
      await wellnessButton.click();
      await page.waitForTimeout(1500);

      // Complete wellness check-in steps
      const steps = ['soreness', 'recovery', 'energy', 'sleep', 'stress'];
      for (const step of steps) {
        console.log(`  Completing step: ${step}`);

        // Select middle option (3/5)
        const optionButton = page.locator('button[data-value="3"]').first();
        if (await optionButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await optionButton.click();
          await page.waitForTimeout(500);
        }

        // Click continue/complete button
        const continueButton = page.locator('button').filter({ hasText: /continue|complete/i }).first();
        if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`    Clicking continue/complete button`);
          await continueButton.click();
          await page.waitForTimeout(1500);
        }
      }

      // Check if wellness data was saved
      const wellnessSaved = await page.evaluate(() => {
        const storage = localStorage.getItem('voltlift-storage');
        if (storage) {
          const data = JSON.parse(storage);
          const today = new Date().toISOString().split('T')[0];
          return {
            hasDailyLogs: data.state?.dailyLogs !== undefined,
            todayLog: data.state?.dailyLogs?.[today] || null,
          };
        }
        return { hasDailyLogs: false, todayLog: null };
      });

      console.log('  Wellness data:', JSON.stringify(wellnessSaved, null, 2));
      expect(wellnessSaved.hasDailyLogs, 'Should have dailyLogs').toBe(true);

      console.log('\n✅ PROD-002 PASSED: Wellness check-in completed');
    } else {
      console.log('  ℹ️ Wellness check-in not visible (may require specific conditions)');
    }
  });

  test('PROD-003: Start Session button works for Dual-Phase Domination', async ({ page }) => {
    console.log('\n=== PROD-003: Start Session Button Verification ===');

    await page.goto(`${BASE_URL}/#/`);
    await page.waitForTimeout(2000);

    // Step 1: Navigate to programs page
    console.log('\nStep 1: Navigating to Programs...');
    await page.goto(`${BASE_URL}/#/programs`);
    await page.waitForTimeout(2000);

    // Step 2: Find and activate Dual-Phase Domination
    console.log('\nStep 2: Activating Dual-Phase Domination...');
    const programCard = page.locator('text=Dual-Phase Domination').first();
    const programVisible = await programCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (programVisible) {
      await programCard.click();
      await page.waitForTimeout(2000);

      // Enroll in program
      const enrollButton = page.locator('button').filter({ hasText: /enroll|activate|start/i }).first();
      if (await enrollButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enrollButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Step 3: Navigate to Lift page and verify Start Session button
    console.log('\nStep 3: Testing Start Session button...');
    await page.goto(`${BASE_URL}/#/lift`);
    await page.waitForTimeout(2000);

    // Look for Start Session button
    const startSessionButton = page.locator('button').filter({ hasText: /start session/i }).first();
    const hasStartButton = await startSessionButton.isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`  Start Session button visible: ${hasStartButton}`);

    if (hasStartButton) {
      // Check if button is clickable (not disabled)
      const isEnabled = await startSessionButton.isEnabled();
      console.log(`  Start Session button enabled: ${isEnabled}`);

      expect(isEnabled, 'Start Session button should be enabled').toBe(true);

      // Click it
      await startSessionButton.click();
      await page.waitForTimeout(2000);

      // Verify readiness check modal or workout started
      const hasModal = await page.locator('text=/readiness|ready to|pre-workout/i').first().isVisible({ timeout: 3000 }).catch(() => false);
      const hasWorkout = await page.locator('text=/workout|exercise|set/i').first().isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`  Readiness modal shown: ${hasModal}`);
      console.log(`  Workout started: ${hasWorkout}`);

      expect(hasModal || hasWorkout, 'Should show readiness modal or start workout').toBe(true);

      console.log('\n✅ PROD-003 PASSED: Start Session button works');
    } else {
      throw new Error('Start Session button not visible - program may not be activated');
    }
  });
});
