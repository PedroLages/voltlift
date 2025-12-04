import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('VoltLift Manual Testing', () => {
  test('Complete onboarding and test all fixes', async ({ page }) => {
    console.log('\n=== Starting Manual Test ===');

    // Step 1: Navigate to app
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Step 2: Complete onboarding if needed
    const url = page.url();
    console.log('Initial URL:', url);

    if (url.includes('welcome')) {
      console.log('On welcome page, clicking JOIN THE CULT...');
      await page.click('button:has-text("JOIN THE CULT")');
      await page.waitForTimeout(2000);
    }

    // Check if we're on onboarding
    if (page.url().includes('onboarding')) {
      console.log('On onboarding page, completing...');

      // Fill name
      const nameInput = page.locator('input[type="text"]').first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('Test User');
        await page.waitForTimeout(500);
      }

      // Select unit (try both button and select)
      const kgButton = page.locator('button:has-text("KG")');
      if (await kgButton.isVisible().catch(() => false)) {
        await kgButton.click();
        await page.waitForTimeout(500);
      }

      // Click Next or Complete button
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Complete"), button:has-text("Get Started")').first();
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '0-after-onboarding.png'),
      fullPage: true
    });
    console.log('✓ Completed onboarding, current URL:', page.url());

    // ============================================
    // TEST 1: Template Sync & EBH Program Access
    // ============================================
    console.log('\n=== TEST 1: Template Sync & EBH Program Access ===');

    await page.goto(`${BASE_URL}/#/programs`);
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '1a-programs-list.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 1a-programs-list.png');

    // Look for Evidence-Based Hypertrophy
    const pageContent1 = await page.content();
    const hasEBH = pageContent1.includes('Evidence-Based Hypertrophy') ||
                   pageContent1.includes('evidence') ||
                   pageContent1.includes('hypertrophy');
    console.log('Has EBH program on page:', hasEBH);

    // Try to find and click the program card
    const ebhLocators = [
      page.locator('text=Evidence-Based Hypertrophy'),
      page.locator('text=evidence-based hypertrophy'),
      page.locator('[href*="evidence"]'),
      page.locator('[href*="hypertrophy"]'),
      page.locator('.cursor-pointer').filter({ hasText: /evidence|hypertrophy/i })
    ];

    let clicked = false;
    for (const locator of ebhLocators) {
      if (await locator.first().isVisible().catch(() => false)) {
        await locator.first().click();
        clicked = true;
        console.log('✓ Clicked EBH program');
        await page.waitForTimeout(2000);
        break;
      }
    }

    if (!clicked) {
      console.log('⚠ Could not find EBH program card, trying direct navigation...');
      await page.goto(`${BASE_URL}/#/program-detail/prog_evidence_hypertrophy`);
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '1b-program-detail.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 1b-program-detail.png');

    // Check for readable names vs raw IDs
    const detailContent = await page.content();
    const hasReadableNames = detailContent.includes('EBH: Upper') ||
                            detailContent.includes('EBH:') ||
                            detailContent.includes('Horizontal') ||
                            detailContent.includes('Vertical');
    const hasRawIds = detailContent.includes('ebh_upper_a') ||
                     detailContent.includes('ebh_lower_a') ||
                     detailContent.includes('template_');

    console.log('TEST 1 Results:');
    console.log('  ✓ Has readable template names:', hasReadableNames);
    console.log('  ✓ Has raw template IDs:', hasRawIds);
    console.log('  ✓ PASS:', hasReadableNames && !hasRawIds ? 'YES' : 'NO');

    // Try to go to enrollment page
    const enrollButton = page.locator('button:has-text("Start"), button:has-text("Evidence")').first();
    if (await enrollButton.isVisible().catch(() => false)) {
      await enrollButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '1c-enrollment-page.png'),
        fullPage: true
      });
      console.log('✓ Screenshot: 1c-enrollment-page.png');

      const enrollContent = await page.content();
      const hasMissingWarning = enrollContent.includes('Missing Templates') ||
                               enrollContent.includes('missing templates');
      console.log('  ✓ Has "Missing Templates" warning:', hasMissingWarning);
      console.log('  ✓ PASS (no warning):', !hasMissingWarning ? 'YES' : 'NO');
    }

    // ============================================
    // TEST 2: Units Setting (kg vs lbs)
    // ============================================
    console.log('\n=== TEST 2: Units Setting (kg vs lbs) ===');

    await page.goto(`${BASE_URL}/#/profile`);
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '2a-profile-page.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 2a-profile-page.png');

    const profileContent = await page.content();
    console.log('Profile page has "Units":', profileContent.includes('Units') || profileContent.includes('unit'));
    console.log('Profile page has "KG":', profileContent.includes('KG') || profileContent.includes('kg'));

    // Try to select KG
    const kgSelectors = [
      page.locator('button:has-text("KG")'),
      page.locator('text=KG').locator('..').locator('button'),
      page.locator('select option[value="kg"]'),
      page.locator('[value="kg"]')
    ];

    for (const selector of kgSelectors) {
      if (await selector.first().isVisible().catch(() => false)) {
        await selector.first().click();
        await page.waitForTimeout(1000);
        console.log('✓ Selected KG');
        break;
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '2b-profile-kg-selected.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 2b-profile-kg-selected.png');

    // Navigate to workout logger
    await page.goto(`${BASE_URL}/#/lift`);
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '2c-lift-page.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 2c-lift-page.png');

    // Try Quick Start
    const quickStartButton = page.locator('button:has-text("Quick Start"), button:has-text("Start Workout")').first();
    if (await quickStartButton.isVisible().catch(() => false)) {
      await quickStartButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '2d-workout-logger.png'),
        fullPage: true
      });
      console.log('✓ Screenshot: 2d-workout-logger.png');

      const workoutContent = await page.content();
      const hasKG = workoutContent.includes('>KG<') ||
                   workoutContent.includes('KG</th>') ||
                   (workoutContent.includes('KG') && workoutContent.includes('</th>'));
      const hasLBS = workoutContent.includes('>LBS<') ||
                    workoutContent.includes('LBS</th>') ||
                    (workoutContent.includes('LBS') && workoutContent.includes('</th>'));

      console.log('TEST 2 Results:');
      console.log('  ✓ Workout logger has KG header:', hasKG);
      console.log('  ✓ Workout logger has LBS header:', hasLBS);
      console.log('  ✓ PASS:', hasKG && !hasLBS ? 'YES' : 'NO');
    }

    // ============================================
    // TEST 3: EBH Program Play Button
    // ============================================
    console.log('\n=== TEST 3: EBH Program Play Button ===');

    await page.goto(`${BASE_URL}/#/program-enroll/prog_evidence_hypertrophy`);
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '3a-ebh-enrollment.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 3a-ebh-enrollment.png');

    // Check acknowledgment checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.check();
      await page.waitForTimeout(500);
      console.log('✓ Checked acknowledgment');
    }

    // Click Start button
    const startButton = page.locator('button:has-text("Start")').first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(3000);

      console.log('After enrollment, URL:', page.url());

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '3b-dashboard-after-enrollment.png'),
        fullPage: true
      });
      console.log('✓ Screenshot: 3b-dashboard-after-enrollment.png');

      // Look for the active program card
      const dashboardContent = await page.content();
      const hasActiveProgram = dashboardContent.includes('Evidence-Based Hypertrophy');
      const hasStartButton = dashboardContent.includes('Start Week') ||
                           dashboardContent.includes('Continue') ||
                           dashboardContent.includes('Start Day');
      console.log('Dashboard has active program:', hasActiveProgram);
      console.log('Dashboard has start/continue button:', hasStartButton);

      // Try to start the workout from dashboard
      const workoutStartButton = page.locator('button:has-text("Start"), button[class*="play"]').first();
      if (await workoutStartButton.isVisible().catch(() => false)) {
        await workoutStartButton.click();
        await page.waitForTimeout(3000);

        console.log('After clicking start, URL:', page.url());

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '3c-workout-from-program.png'),
          fullPage: true
        });
        console.log('✓ Screenshot: 3c-workout-from-program.png');

        const workoutContent = await page.content();
        const hasExercises = workoutContent.includes('Bench Press') ||
                           workoutContent.includes('Barbell Row') ||
                           workoutContent.includes('Squat') ||
                           workoutContent.includes('exercise');
        const hasKGHeader = workoutContent.includes('>KG<') || workoutContent.includes('KG</th>');

        console.log('TEST 3 Results:');
        console.log('  ✓ Workout loaded from program:', hasExercises);
        console.log('  ✓ Shows KG units:', hasKGHeader);
        console.log('  ✓ PASS:', hasExercises && hasKGHeader ? 'YES' : 'NO');
      }
    }

    // ============================================
    // TEST 4: Console Errors
    // ============================================
    console.log('\n=== TEST 4: Console Errors ===');

    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Navigate through app one more time
    await page.goto(`${BASE_URL}/#/programs`);
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '4-final-state.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 4-final-state.png');

    console.log('TEST 4 Results:');
    console.log('  ✓ Console errors found:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log('    -', err));
    }
    console.log('  ✓ PASS:', consoleErrors.length === 0 ? 'YES' : 'NO');

    console.log('\n=== Manual Test Complete ===');
  });
});
