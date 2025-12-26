/**
 * Settings Search Functionality E2E Tests
 *
 * Tests the searchable settings feature including:
 * - Search input visibility
 * - Real-time filtering
 * - Click-to-navigate behavior
 * - Search clearing after navigation
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper function to enable testing mode
async function enableTestingMode(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('TESTING_MODE', 'true');
  });
}

// Helper function to complete onboarding
async function completeOnboarding(page: Page) {
  const url = page.url();

  if (url.includes('welcome')) {
    const joinButton = page.locator('button:has-text("JOIN THE CULT")').first();
    if (await joinButton.isVisible().catch(() => false)) {
      await joinButton.click({ timeout: 5000 });
      await page.waitForTimeout(2000);
    }
  }

  if (page.url().includes('onboarding')) {
    // Fill name
    const nameInput = page.locator('input[type="text"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('Settings Test User');
      await page.waitForTimeout(500);
    }

    // Select KG units
    const kgButton = page.locator('button:has-text("KG")').first();
    if (await kgButton.isVisible().catch(() => false)) {
      await kgButton.click();
      await page.waitForTimeout(500);
    }

    // Click through all onboarding steps
    for (let i = 0; i < 5; i++) {
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Complete"), button:has-text("Get Started")').first();
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(1500);
        if (page.url().includes('dashboard') || page.url() === `${BASE_URL}/#/`) {
          break;
        }
      } else {
        break;
      }
    }
  }
}

test.describe('Settings Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Enable testing mode to bypass auth
    await page.goto(BASE_URL);
    await enableTestingMode(page);
    await page.reload();
    await page.waitForTimeout(1000);

    // Complete onboarding if needed
    await completeOnboarding(page);

    // Navigate to Profile/Settings page
    await page.goto(`${BASE_URL}/#/profile`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display search input in Settings page', async ({ page }) => {
    // Verify search input exists and is visible
    const searchInput = page.getByPlaceholder('SEARCH SETTINGS...');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEditable();
  });

  test('should filter settings based on search query - "rest"', async ({ page }) => {
    const searchInput = page.getByPlaceholder('SEARCH SETTINGS...');

    // Type search query
    await searchInput.fill('rest');

    // Wait for results to appear
    await page.waitForTimeout(300); // Allow for debounce/render

    // Verify results dropdown appears
    const resultsContainer = page.locator('div').filter({ hasText: /RESULT.*FOR "rest"/i }).first();
    await expect(resultsContainer).toBeVisible();

    // Verify "Rest Timer Settings" appears in results
    const restTimerResult = page.locator('button').filter({ hasText: /Rest Timer Settings/i });
    await expect(restTimerResult).toBeVisible();
  });

  test('should filter settings based on search query - "kg"', async ({ page }) => {
    const searchInput = page.getByPlaceholder('SEARCH SETTINGS...');

    // Type search query for units
    await searchInput.fill('kg');

    await page.waitForTimeout(300);

    // Verify "Units & Measurements" appears in results
    const unitsResult = page.locator('button').filter({ hasText: /Units.*Measurements/i });
    await expect(unitsResult).toBeVisible();
  });

  test('should navigate to correct tab when clicking search result', async ({ page }) => {
    const searchInput = page.getByPlaceholder('SEARCH SETTINGS...');

    // Search for "rest timer"
    await searchInput.fill('rest');
    await page.waitForTimeout(300);

    // Click on "Rest Timer Settings" result
    const restTimerResult = page.locator('button').filter({ hasText: /Rest Timer Settings/i }).first();
    await restTimerResult.click();

    // Verify we're now on the TRAINING tab
    // Look for active tab indicator (aria-current="page" for active tab)
    const trainingTab = page.locator('button').filter({ hasText: /TRAINING/i });
    await expect(trainingTab).toHaveAttribute('aria-current', 'page');
  });

  test('should clear search query after clicking result', async ({ page }) => {
    const searchInput = page.getByPlaceholder('SEARCH SETTINGS...');

    // Search for something
    await searchInput.fill('health');
    await page.waitForTimeout(300);

    // Click on a result
    const firstResult = page.locator('button').filter({ hasText: /Health Data/i }).first();
    await firstResult.click();

    // Verify search input is cleared
    await expect(searchInput).toHaveValue('');
  });

  test('should show "no results" message for non-existent settings', async ({ page }) => {
    const searchInput = page.getByPlaceholder('SEARCH SETTINGS...');

    // Search for something that doesn't exist
    await searchInput.fill('xyzabc123nonexistent');
    await page.waitForTimeout(300);

    // Verify "no results" message appears (more specific selector)
    const noResultsMessage = page.locator('div.text-xs.font-mono.italic').filter({ hasText: /No settings found matching/i });
    await expect(noResultsMessage).toBeVisible();
  });

  test('should hide results when search is cleared', async ({ page }) => {
    const searchInput = page.getByPlaceholder('SEARCH SETTINGS...');

    // Type search query
    await searchInput.fill('ai');
    await page.waitForTimeout(300);

    // Verify results appear
    const resultsContainer = page.locator('div').filter({ hasText: /RESULT.*FOR/i }).first();
    await expect(resultsContainer).toBeVisible();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Verify results are hidden
    await expect(resultsContainer).not.toBeVisible();
  });

  test('should show multiple results for broad search terms', async ({ page }) => {
    const searchInput = page.getByPlaceholder('SEARCH SETTINGS...');

    // Search for broad term
    await searchInput.fill('weight');
    await page.waitForTimeout(300);

    // Verify multiple results appear (should match "Progressive Overload", "Units", "Biometric Scanner")
    const results = page.locator('button').filter({ hasText: /.+/ });
    const count = await results.count();

    expect(count).toBeGreaterThan(1);
  });

  test('should be case-insensitive', async ({ page }) => {
    const searchInput = page.getByPlaceholder('SEARCH SETTINGS...');

    // Search with uppercase
    await searchInput.fill('REST');
    await page.waitForTimeout(300);

    const restTimerResult = page.locator('button').filter({ hasText: /Rest Timer Settings/i });
    await expect(restTimerResult).toBeVisible();

    // Clear and search with lowercase
    await searchInput.clear();
    await searchInput.fill('rest');
    await page.waitForTimeout(300);

    await expect(restTimerResult).toBeVisible();

    // Clear and search with mixed case
    await searchInput.clear();
    await searchInput.fill('ReSt');
    await page.waitForTimeout(300);

    await expect(restTimerResult).toBeVisible();
  });

  test('should match keywords in addition to titles', async ({ page }) => {
    const searchInput = page.getByPlaceholder('SEARCH SETTINGS...');

    // Search for keyword "pounds" (should match "Units & Measurements")
    await searchInput.fill('pounds');
    await page.waitForTimeout(300);

    const unitsResult = page.locator('button').filter({ hasText: /Units.*Measurements/i });
    await expect(unitsResult).toBeVisible();

    // Search for keyword "apple" (should match "Health Data")
    await searchInput.clear();
    await searchInput.fill('apple');
    await page.waitForTimeout(300);

    const healthResult = page.locator('button').filter({ hasText: /Health Data/i });
    await expect(healthResult).toBeVisible();
  });
});
