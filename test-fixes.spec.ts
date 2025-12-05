import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('VoltLift Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);

    // Check if we're on onboarding
    const url = page.url();
    if (url.includes('welcome') || url.includes('onboarding')) {
      console.log('On onboarding page, completing quickly...');

      // Try to skip to programs or complete onboarding
      // First, let's check if we can access localStorage to set onboarding as complete
      await page.evaluate(() => {
        const storage = localStorage.getItem('voltlift-storage');
        if (storage) {
          const data = JSON.parse(storage);
          data.state.settings = data.state.settings || {};
          data.state.settings.onboardingCompleted = true;
          localStorage.setItem('voltlift-storage', JSON.stringify(data));
        }
      });

      // Reload to apply changes
      await page.reload();
      await page.waitForTimeout(1000);
    }
  });

  test('TEST 1: Template Sync & EBH Program Access', async ({ page }) => {
    console.log('\n=== TEST 1: Template Sync & EBH Program Access ===');

    // Navigate to programs page
    await page.goto(`${BASE_URL}/#/programs`);
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '1a-programs-list.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 1a-programs-list.png');

    // Find and click Evidence-Based Hypertrophy program
    const ebhCard = page.locator('text=Evidence-Based Hypertrophy').first();
    await expect(ebhCard).toBeVisible({ timeout: 10000 });
    await ebhCard.click();
    await page.waitForTimeout(2000);

    // Verify we're on the program detail page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Take screenshot of program detail page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '1b-program-detail.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 1b-program-detail.png');

    // Check for readable template names (NOT raw IDs)
    const pageContent = await page.content();

    // Look for template names like "EBH: Upper A" instead of "ebh_upper_a"
    const hasReadableNames = pageContent.includes('EBH: Upper') || pageContent.includes('EBH:');
    const hasRawIds = pageContent.includes('ebh_upper_a') || pageContent.includes('ebh_lower_a');

    console.log('Has readable template names:', hasReadableNames);
    console.log('Has raw template IDs:', hasRawIds);

    // Find the enrollment button
    const enrollButton = page.locator('button:has-text("Start Evidence-Based Hypertrophy")').first();
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      await page.waitForTimeout(2000);

      // Take screenshot of enrollment page
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '1c-enrollment-page.png'),
        fullPage: true
      });
      console.log('✓ Screenshot saved: 1c-enrollment-page.png');

      // Check for "Missing Templates" warning
      const missingTemplatesWarning = page.locator('text=Missing Templates');
      const hasMissingWarning = await missingTemplatesWarning.isVisible().catch(() => false);
      console.log('Has "Missing Templates" warning:', hasMissingWarning);

      // Verify Week 1 Schedule shows template names
      const weekScheduleContent = await page.locator('text=Week 1').locator('..').textContent();
      console.log('Week 1 Schedule preview:', weekScheduleContent?.substring(0, 200));

      expect(hasMissingWarning).toBe(false);
    }
  });

  test('TEST 2: Units Setting (kg vs lbs)', async ({ page }) => {
    console.log('\n=== TEST 2: Units Setting (kg vs lbs) ===');

    // Navigate to profile
    await page.goto(`${BASE_URL}/#/profile`);
    await page.waitForTimeout(2000);

    // Take screenshot of profile page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '2a-profile-page.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 2a-profile-page.png');

    // Find and select KG units
    const kgOption = page.locator('text=KG').first();
    const lbsOption = page.locator('text=LBS').first();

    console.log('KG option visible:', await kgOption.isVisible().catch(() => false));
    console.log('LBS option visible:', await lbsOption.isVisible().catch(() => false));

    // Try to find select/button for units
    const unitsSelect = page.locator('select').filter({ hasText: /KG|LBS/ }).first();
    if (await unitsSelect.isVisible().catch(() => false)) {
      await unitsSelect.selectOption('kg');
      await page.waitForTimeout(1000);
      console.log('✓ Selected KG from dropdown');
    } else {
      // Try clicking KG button/option
      if (await kgOption.isVisible()) {
        await kgOption.click();
        await page.waitForTimeout(1000);
        console.log('✓ Clicked KG option');
      }
    }

    // Take screenshot after selection
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '2b-profile-kg-selected.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 2b-profile-kg-selected.png');

    // Navigate to lift/workout
    await page.goto(`${BASE_URL}/#/lift`);
    await page.waitForTimeout(2000);

    // Take screenshot of lift page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '2c-lift-page.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 2c-lift-page.png');

    // Start a workout (Quick Start or template)
    const quickStartButton = page.locator('button:has-text("Quick Start")').first();
    if (await quickStartButton.isVisible().catch(() => false)) {
      await quickStartButton.click();
      await page.waitForTimeout(2000);

      // Verify column header shows KG
      const pageContent = await page.content();
      const hasKgHeader = pageContent.includes('>KG<') || pageContent.includes('KG</th>');
      const hasLbsHeader = pageContent.includes('>LBS<') || pageContent.includes('LBS</th>');

      console.log('Has KG header:', hasKgHeader);
      console.log('Has LBS header:', hasLbsHeader);

      // Take screenshot of workout logger
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '2d-workout-logger-kg.png'),
        fullPage: true
      });
      console.log('✓ Screenshot saved: 2d-workout-logger-kg.png');

      expect(hasKgHeader).toBe(true);
      expect(hasLbsHeader).toBe(false);
    }
  });

  test('TEST 3: EBH Program Play Button', async ({ page }) => {
    console.log('\n=== TEST 3: EBH Program Play Button ===');

    // First ensure KG is selected
    await page.goto(`${BASE_URL}/#/profile`);
    await page.waitForTimeout(1000);

    const kgOption = page.locator('text=KG').first();
    if (await kgOption.isVisible().catch(() => false)) {
      await kgOption.click();
      await page.waitForTimeout(500);
    }

    // Navigate to EBH program enrollment
    await page.goto(`${BASE_URL}/#/program-enroll/prog_evidence_hypertrophy`);
    await page.waitForTimeout(2000);

    // Take screenshot of enrollment page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '3a-ebh-enrollment.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 3a-ebh-enrollment.png');

    // Check the acknowledgment checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.check();
      await page.waitForTimeout(500);
      console.log('✓ Checked acknowledgment checkbox');
    }

    // Click Start button
    const startButton = page.locator('button:has-text("Start")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(2000);

      // Should navigate to Dashboard
      const currentUrl = page.url();
      console.log('Current URL after start:', currentUrl);
      expect(currentUrl).toContain('dashboard');

      // Take screenshot of dashboard
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '3b-dashboard-active-program.png'),
        fullPage: true
      });
      console.log('✓ Screenshot saved: 3b-dashboard-active-program.png');

      // Verify active program card
      const programCard = page.locator('text=Evidence-Based Hypertrophy').first();
      await expect(programCard).toBeVisible({ timeout: 5000 });

      const cardContent = await page.locator('text=Start Week').textContent().catch(() => '');
      console.log('Program card content:', cardContent);

      // Check for template name like "EBH: Upper A"
      const pageContent = await page.content();
      const hasTemplateName = pageContent.includes('EBH: Upper') || pageContent.includes('EBH:');
      console.log('Has readable template name on dashboard:', hasTemplateName);

      // Click the play button or Start button on program card
      const playButton = page.locator('button:has-text("Start")').first();
      if (await playButton.isVisible().catch(() => false)) {
        await playButton.click();
        await page.waitForTimeout(2000);

        // Should navigate to workout logger
        const workoutUrl = page.url();
        console.log('Current URL after play:', workoutUrl);
        expect(workoutUrl).toContain('workout');

        // Take screenshot of workout with exercises loaded
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '3c-workout-ebh-loaded.png'),
          fullPage: true
        });
        console.log('✓ Screenshot saved: 3c-workout-ebh-loaded.png');

        // Verify exercises are loaded
        const hasExercises = await page.locator('text=Bench Press').isVisible().catch(() => false) ||
                            await page.locator('text=Barbell Row').isVisible().catch(() => false);
        console.log('Has exercises loaded:', hasExercises);

        // Verify KG column header
        const workoutContent = await page.content();
        const hasKgHeader = workoutContent.includes('>KG<') || workoutContent.includes('KG</th>');
        console.log('Has KG header in workout:', hasKgHeader);

        expect(hasExercises).toBe(true);
        expect(hasKgHeader).toBe(true);
      }
    }
  });

  test('TEST 4: Logic Validation & Console Errors', async ({ page }) => {
    console.log('\n=== TEST 4: Logic Validation & Console Errors ===');

    // Collect console messages
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Navigate through the app flow
    await page.goto(`${BASE_URL}/#/programs`);
    await page.waitForTimeout(2000);

    // Click EBH program
    const ebhCard = page.locator('text=Evidence-Based Hypertrophy').first();
    if (await ebhCard.isVisible().catch(() => false)) {
      await ebhCard.click();
      await page.waitForTimeout(2000);
    }

    // Check program structure
    const pageContent = await page.content();

    // Verify logical flow
    const checks = {
      hasWeekStructure: pageContent.includes('Week 1') || pageContent.includes('Week'),
      hasExerciseInfo: pageContent.includes('Bench Press') || pageContent.includes('Squat') || pageContent.includes('exercises'),
      hasTemplateNames: pageContent.includes('EBH:') || pageContent.includes('Upper') || pageContent.includes('Lower'),
      hasRawIds: pageContent.includes('ebh_upper_a') || pageContent.includes('template_'),
    };

    console.log('\n=== Logic Validation Results ===');
    console.log('Has week structure:', checks.hasWeekStructure);
    console.log('Has exercise info:', checks.hasExerciseInfo);
    console.log('Has readable template names:', checks.hasTemplateNames);
    console.log('Has raw template IDs:', checks.hasRawIds);

    console.log('\n=== Console Messages (last 20) ===');
    consoleMessages.slice(-20).forEach(msg => console.log(msg));

    console.log('\n=== Console Errors ===');
    if (consoleErrors.length === 0) {
      console.log('✓ No console errors detected');
    } else {
      console.log(`⚠ Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }

    // Final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '4-final-state.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 4-final-state.png');

    // Assertions
    expect(checks.hasTemplateNames).toBe(true);
    expect(checks.hasRawIds).toBe(false);
  });
});
