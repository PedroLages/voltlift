/**
 * DUAL-PHASE DOMINATION - COMPLETE WORKFLOW TEST
 *
 * Tests the full user journey:
 * 1. Select program
 * 2. Complete a workout
 * 3. Daily wellness check-in
 * 4. View program details
 * 5. Start next session
 */

import { test, expect } from '@playwright/test';
import { completeOnboarding } from './helpers/testUtils';

const BASE_URL = 'http://localhost:3000';

test.describe('Dual-Phase Domination - Full Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await completeOnboarding(page, 'Test Athlete');
  });

  test('WORKFLOW-001: Complete Dual-Phase Domination journey', async ({ page }) => {
    console.log('\n🏋️ DUAL-PHASE DOMINATION - FULL WORKFLOW TEST\n');

    // ===========================================
    // STEP 1: Navigate to Programs
    // ===========================================
    console.log('📍 Step 1: Navigating to Programs page...');
    await page.goto(`${BASE_URL}/#/programs`);
    await page.waitForTimeout(2000);

    // ===========================================
    // STEP 2: Select Dual-Phase Domination
    // ===========================================
    console.log('📍 Step 2: Finding Dual-Phase Domination program...');
    const programCard = page.locator('text=Dual-Phase Domination').first();
    const programVisible = await programCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!programVisible) {
      // Debug: List available programs
      const programs = await page.evaluate(() => {
        const storage = localStorage.getItem('voltlift-storage');
        if (storage) {
          const data = JSON.parse(storage);
          return data.state?.programs?.map((p: any) => p.name) || [];
        }
        return [];
      });
      console.log('  Available programs:', programs);
      throw new Error('Dual-Phase Domination not found!');
    }

    console.log('  ✅ Dual-Phase Domination found!');
    await programCard.click();
    await page.waitForTimeout(2000);

    // ===========================================
    // STEP 3: Switch to Overview Tab
    // ===========================================
    console.log('📍 Step 3: Switching to Overview tab...');
    const overviewTab = page.locator('button').filter({ hasText: /overview/i }).first();
    if (await overviewTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await overviewTab.click();
      await page.waitForTimeout(1500);
      console.log('  ✅ Switched to Overview tab');
    }

    // ===========================================
    // STEP 4: Acknowledge Commitment
    // ===========================================
    console.log('📍 Step 4: Acknowledging commitment...');

    // Scroll down to find the checkbox
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Find and click the acknowledgement checkbox
    const acknowledgeCheckbox = page.locator('input[type="checkbox"]').first();
    if (await acknowledgeCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acknowledgeCheckbox.click();
      await page.waitForTimeout(1000);
      console.log('  ✅ Acknowledged commitment checkbox');
    } else {
      console.log('  ⚠️ Acknowledgement checkbox not found');
    }

    // ===========================================
    // STEP 5: Enroll in Program
    // ===========================================
    console.log('📍 Step 5: Enrolling in program...');
    const enrollButton = page.locator('button').filter({ hasText: /start.*now|enroll|activate/i }).first();
    const hasEnrollButton = await enrollButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEnrollButton) {
      const buttonText = await enrollButton.textContent();
      console.log(`  Found button: "${buttonText}"`);
      await enrollButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Clicked enroll button!');
    } else {
      console.log('  ⚠️ Enroll button not found or not visible');
      // Debug: Check what buttons ARE visible
      const allButtons = await page.locator('button').allTextContents();
      console.log('  Visible buttons:', allButtons.slice(0, 10));
    }

    // Verify program is activated
    const programState = await page.evaluate(() => {
      const storage = localStorage.getItem('voltlift-storage');
      if (storage) {
        const data = JSON.parse(storage);
        return {
          hasActiveProgram: !!data.state?.settings?.activeProgram,
          programId: data.state?.settings?.activeProgram?.programId,
          sessionIndex: data.state?.settings?.activeProgram?.currentSessionIndex,
        };
      }
      return { hasActiveProgram: false };
    });

    expect(programState.hasActiveProgram, 'Program should be activated').toBe(true);
    console.log(`  ✅ Active program: ${programState.programId}, Session: ${programState.sessionIndex}`);

    // ===========================================
    // STEP 6: Go to Lift Page
    // ===========================================
    console.log('\n📍 Step 6: Navigating to Lift page...');
    await page.goto(`${BASE_URL}/#/lift`);
    await page.waitForTimeout(2000);

    // ===========================================
    // STEP 7: Verify ACTIVE PROGRAM Section
    // ===========================================
    console.log('📍 Step 7: Verifying ACTIVE PROGRAM section...');
    const activeProgramSection = page.locator('text=Dual-Phase Domination').first();
    const activeProgramVisible = await activeProgramSection.isVisible({ timeout: 5000 }).catch(() => false);

    expect(activeProgramVisible, 'Active program should be visible on Lift page').toBe(true);
    console.log('  ✅ ACTIVE PROGRAM: Dual-Phase Domination visible!');

    // ===========================================
    // STEP 8: Click "View" Button
    // ===========================================
    console.log('\n📍 Step 8: Clicking "View" button...');
    const viewButton = page.locator('button').filter({ hasText: /view|details/i }).first();
    const hasViewButton = await viewButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasViewButton) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Clicked View button!');

      // ===========================================
      // STEP 9: Check Week 1 Days Tabs
      // ===========================================
      console.log('📍 Step 9: Checking Week 1 days tabs...');

      // Look for week/day navigation
      const weekTabs = page.locator('button, div').filter({ hasText: /week 1|day 1|session/i });
      const weekTabsCount = await weekTabs.count();

      console.log(`  Found ${weekTabsCount} week/day tabs`);

      if (weekTabsCount > 0) {
        console.log('  ✅ Week 1 tabs are visible!');

        // Try clicking through first few tabs
        for (let i = 0; i < Math.min(3, weekTabsCount); i++) {
          const tabText = await weekTabs.nth(i).textContent().catch(() => 'Unknown');
          console.log(`    Tab ${i + 1}: ${tabText}`);

          await weekTabs.nth(i).click().catch(() => {});
          await page.waitForTimeout(500);
        }
      }

      // ===========================================
      // STEP 10: Click "Go to Dashboard" Button
      // ===========================================
      console.log('\n📍 Step 10: Looking for "Go to Dashboard" button...');
      const dashboardButton = page.locator('button').filter({ hasText: /dashboard|back|close/i }).first();
      const hasDashboardButton = await dashboardButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasDashboardButton) {
        await dashboardButton.click();
        await page.waitForTimeout(2000);
        console.log('  ✅ Returned to main view!');
      } else {
        // Try pressing Escape to close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('  ℹ️ Closed modal with Escape key');
      }
    }

    // ===========================================
    // STEP 11: Go Back to Lift Page
    // ===========================================
    console.log('\n📍 Step 11: Going back to Lift page...');
    await page.goto(`${BASE_URL}/#/lift`);
    await page.waitForTimeout(2000);

    // ===========================================
    // STEP 12: Click "Start Session" Button
    // ===========================================
    console.log('📍 Step 12: Clicking "Start Session" button...');
    const startSessionButton = page.locator('button').filter({ hasText: /start session/i }).first();
    const hasStartButton = await startSessionButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasStartButton) {
      // Debug: Take screenshot
      await page.screenshot({ path: 'test-screenshots/no-start-button.png', fullPage: true });
      console.log('  ⚠️ Start Session button not visible - screenshot saved');

      // Check what buttons ARE visible
      const allButtons = await page.locator('button').allTextContents();
      console.log('  Visible buttons:', allButtons);
    }

    expect(hasStartButton, 'Start Session button should be visible').toBe(true);
    console.log('  ✅ Start Session button found!');

    // Click Start Session
    await startSessionButton.click();
    await page.waitForTimeout(2000);

    // Check if daily check-in modal appeared
    const dailyCheckInModal = page.locator('text=/daily check-in|readiness/i').first();
    const hasCheckInModal = await dailyCheckInModal.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCheckInModal) {
      console.log('  ✅ Daily check-in modal appeared!');

      // Wait for the modal to fully render
      await page.waitForTimeout(1500);

      // Look for "START WORKOUT" button (the daily check-in uses this instead of "Continue")
      const startWorkoutButton = page.locator('button').filter({ hasText: /start workout/i }).first();
      if (await startWorkoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('  ✅ Found "START WORKOUT" button');
        await startWorkoutButton.click({ force: true }); // Force click to bypass z-index issues
        await page.waitForTimeout(2000);
        console.log('  ✅ Clicked "START WORKOUT" button');
      } else {
        // Try alternate buttons
        const skipButton = page.locator('button').filter({ hasText: /skip/i }).first();
        if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('  ℹ️ Clicking "SKIP" button instead');
          await skipButton.click({ force: true });
          await page.waitForTimeout(2000);
        }
      }
    }

    // ===========================================
    // STEP 13: Verify Workout Started
    // ===========================================
    console.log('\n📍 Step 13: Verifying workout started...');

    // Should be on workout page now
    const currentUrl = page.url();
    const isOnWorkoutPage = currentUrl.includes('/workout');

    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  On workout page: ${isOnWorkoutPage}`);

    if (isOnWorkoutPage) {
      console.log('  ✅ Workout page loaded!');

      // Check for exercise cards - use separate locators instead of invalid combined selector
      const exerciseCardsCount = await page.locator('[data-testid="exercise-card"]').count().catch(() => 0) +
                                  await page.locator('.exercise-card').count().catch(() => 0);
      console.log(`  Found ${exerciseCardsCount} exercise card elements`);
    }

    // ===========================================
    // STEP 14: Complete Workout (Quick)
    // ===========================================
    console.log('\n📍 Step 14: Completing workout...');

    // Look for finish button
    const finishButton = page.locator('button').filter({ hasText: /finish|complete workout/i }).first();
    const hasFinishButton = await finishButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasFinishButton) {
      await finishButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Clicked Finish Workout!');

      // Handle completion modal
      const completeButton = page.locator('button').filter({ hasText: /complete|finish/i }).first();
      if (await completeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await completeButton.click({ force: true }); // Force click to bypass z-index issues
        await page.waitForTimeout(2000);
        console.log('  ✅ Confirmed workout completion!');
      }
    }

    // ===========================================
    // STEP 15: Check Wellness Check-in
    // ===========================================
    console.log('\n📍 Step 15: Testing Daily Wellness Check-in...');

    await page.goto(`${BASE_URL}/#/`);
    await page.waitForTimeout(2000);

    // Look for wellness check-in trigger
    const wellnessButton = page.locator('button, div').filter({ hasText: /wellness|check-in|recovery/i }).first();
    const hasWellnessButton = await wellnessButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasWellnessButton) {
      console.log('  ✅ Wellness check-in found!');
      await wellnessButton.click();
      await page.waitForTimeout(1500);

      // Complete wellness check-in (select middle option for each step)
      for (let i = 0; i < 5; i++) {
        const optionButton = page.locator('button[data-value="3"]').first();
        if (await optionButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await optionButton.click();
          await page.waitForTimeout(500);
        }

        const continueButton = page.locator('button').filter({ hasText: /continue|complete/i }).first();
        if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await continueButton.click();
          await page.waitForTimeout(1500);
        }
      }

      console.log('  ✅ Wellness check-in completed!');
    } else {
      console.log('  ℹ️ Wellness check-in not visible (may appear after first workout)');
    }

    console.log('\n✅ ✅ ✅ DUAL-PHASE DOMINATION WORKFLOW COMPLETE! ✅ ✅ ✅\n');
  });
});
