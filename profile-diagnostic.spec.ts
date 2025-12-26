import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test('Profile Page Diagnostic', async ({ page }) => {
  // Capture console messages
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(text);
    }
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    console.log('\n!!! PAGE ERROR !!!');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    consoleErrors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
  });

  // Enable testing mode
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.setItem('TESTING_MODE', 'true');
    // Set onboarding complete
    const storage = localStorage.getItem('voltlift-storage');
    if (storage) {
      const data = JSON.parse(storage);
      data.state.settings = data.state.settings || {};
      data.state.settings.onboardingCompleted = true;
      data.state.settings.name = 'Test User';
      localStorage.setItem('voltlift-storage', JSON.stringify(data));
    }
  });

  await page.reload();
  await page.waitForTimeout(2000);

  // Navigate to profile
  await page.goto(`${BASE_URL}/#/profile`);
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'profile-diagnostic.png', fullPage: true });

  // Get full page content
  const content = await page.content();

  // Extract visible text
  const visibleText = await page.evaluate(() => {
    return document.body.innerText;
  });

  console.log('\n=== PROFILE PAGE DIAGNOSTIC ===\n');
  console.log('URL:', page.url());
  console.log('\n--- Visible Text (first 500 chars) ---');
  console.log(visibleText.substring(0, 500));
  console.log('\n--- Keywords Check ---');
  console.log('Contains "COMMAND DECK":', visibleText.includes('COMMAND DECK'));
  console.log('Contains "Profile":', visibleText.includes('Profile'));
  console.log('Contains "Settings":', visibleText.includes('Settings'));
  console.log('Contains "Personal":', visibleText.includes('Personal'));
  console.log('Contains "Operator":', visibleText.includes('Operator'));
  console.log('Contains "TROPHIES":', visibleText.includes('TROPHIES'));

  // Check for component presence
  const hasHeader = await page.locator('h1').count();
  const hasButtons = await page.locator('button').count();
  const hasSections = await page.locator('section').count();

  console.log('\n--- DOM Elements ---');
  console.log('H1 elements:', hasHeader);
  console.log('Buttons:', hasButtons);
  console.log('Sections:', hasSections);
  console.log('Page height:', await page.evaluate(() => document.body.scrollHeight));

  console.log('\n--- Console Messages (last 20) ---');
  consoleMessages.slice(-20).forEach(msg => console.log(msg));

  console.log('\n--- Console ERRORS ---');
  if (consoleErrors.length > 0) {
    console.log(`Found ${consoleErrors.length} errors:`);
    consoleErrors.forEach(err => console.log(`  ERROR: ${err}`));
  } else {
    console.log('No console errors');
  }

  console.log('\n=== END DIAGNOSTIC ===\n');
});
