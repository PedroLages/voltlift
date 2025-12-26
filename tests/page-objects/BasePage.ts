/**
 * BasePage - Base class for all Page Objects
 *
 * Provides common functionality used across all pages:
 * - Navigation helpers
 * - Testing mode enablement
 * - localStorage manipulation
 * - Screenshot utilities
 * - Wait helpers
 */

import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class BasePage {
  protected page: Page;
  protected baseURL: string;
  protected screenshotDir: string;

  constructor(page: Page, baseURL: string = 'http://localhost:3000') {
    this.page = page;
    this.baseURL = baseURL;
    this.screenshotDir = path.join(process.cwd(), 'test-screenshots');

    // Ensure screenshot directory exists
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  // ============================================
  // Navigation Methods
  // ============================================

  /**
   * Navigate to a specific path
   * @param path - Path to navigate to (e.g., '/workout', '/profile')
   */
  async goto(path: string): Promise<void> {
    const url = path.startsWith('http') ? path : `${this.baseURL}/#${path}`;
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to finish loading
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(500); // Small buffer for React rendering
  }

  /**
   * Reload the current page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  // ============================================
  // Testing Mode
  // ============================================

  /**
   * Enable testing mode to bypass authentication
   */
  async enableTestingMode(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.setItem('TESTING_MODE', 'true');
    });
  }

  /**
   * Disable testing mode
   */
  async disableTestingMode(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('TESTING_MODE');
    });
  }

  // ============================================
  // localStorage Helpers
  // ============================================

  /**
   * Get entire Zustand store from localStorage
   */
  async getStorage(): Promise<any> {
    return await this.page.evaluate(() => {
      const storage = localStorage.getItem('voltlift-storage');
      if (storage) {
        return JSON.parse(storage);
      }
      return null;
    });
  }

  /**
   * Set entire Zustand store in localStorage
   */
  async setStorage(data: any): Promise<void> {
    await this.page.evaluate((storageData) => {
      localStorage.setItem('voltlift-storage', JSON.stringify(storageData));
    }, data);
  }

  /**
   * Clear all localStorage data
   */
  async clearStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * Get specific key from localStorage
   */
  async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate((storageKey) => {
      return localStorage.getItem(storageKey);
    }, key);
  }

  /**
   * Set specific key in localStorage
   */
  async setLocalStorageItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ storageKey, storageValue }) => {
        localStorage.setItem(storageKey, storageValue);
      },
      { storageKey: key, storageValue: value }
    );
  }

  // ============================================
  // Store State Helpers
  // ============================================

  /**
   * Get active workout from store
   */
  async getActiveWorkout(): Promise<any> {
    const storage = await this.getStorage();
    return storage?.state?.activeWorkout || null;
  }

  /**
   * Get workout history from store
   */
  async getWorkoutHistory(): Promise<any[]> {
    const storage = await this.getStorage();
    return storage?.state?.workoutHistory || [];
  }

  /**
   * Get user settings from store
   */
  async getSettings(): Promise<any> {
    const storage = await this.getStorage();
    return storage?.state?.settings || {};
  }

  /**
   * Get active program from store
   */
  async getActiveProgram(): Promise<any> {
    const storage = await this.getStorage();
    return storage?.state?.settings?.activeProgram || null;
  }

  // ============================================
  // Wait Helpers
  // ============================================

  /**
   * Wait for an element to be visible
   */
  async waitForSelector(selector: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Wait for text to appear on the page
   */
  async waitForText(text: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForURL(pattern: string | RegExp, timeout: number = 5000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Wait for a specific amount of time
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  // ============================================
  // Screenshot Utilities
  // ============================================

  /**
   * Take a screenshot with automatic naming
   */
  async screenshot(name: string, fullPage: boolean = true): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage
    });

    console.log(`  📸 Screenshot: ${filename}`);
  }

  /**
   * Take a screenshot of a specific element
   */
  async screenshotElement(selector: string, name: string): Promise<void> {
    const element = this.page.locator(selector).first();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    await element.screenshot({
      path: filepath
    });

    console.log(`  📸 Screenshot (element): ${filename}`);
  }

  // ============================================
  // Visibility Helpers
  // ============================================

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible().catch(() => false);
  }

  /**
   * Check if element is enabled
   */
  async isEnabled(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isEnabled().catch(() => false);
  }

  /**
   * Check if element is checked (for checkboxes)
   */
  async isChecked(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isChecked().catch(() => false);
  }

  // ============================================
  // Click Helpers
  // ============================================

  /**
   * Click an element with automatic wait
   */
  async click(selector: string, timeout: number = 5000): Promise<void> {
    await this.waitForSelector(selector, timeout);
    await this.page.locator(selector).first().click();
  }

  /**
   * Click and wait for navigation
   */
  async clickAndNavigate(selector: string, expectedURL?: string | RegExp): Promise<void> {
    await this.click(selector);
    if (expectedURL) {
      await this.waitForURL(expectedURL);
    } else {
      await this.waitForPageLoad();
    }
  }

  // ============================================
  // Input Helpers
  // ============================================

  /**
   * Fill an input field
   */
  async fill(selector: string, value: string): Promise<void> {
    await this.waitForSelector(selector);
    await this.page.locator(selector).first().fill(value);
  }

  /**
   * Clear an input field
   */
  async clear(selector: string): Promise<void> {
    await this.waitForSelector(selector);
    await this.page.locator(selector).first().clear();
  }

  /**
   * Check a checkbox
   */
  async check(selector: string): Promise<void> {
    await this.waitForSelector(selector);
    await this.page.locator(selector).first().check();
  }

  /**
   * Uncheck a checkbox
   */
  async uncheck(selector: string): Promise<void> {
    await this.waitForSelector(selector);
    await this.page.locator(selector).first().uncheck();
  }

  // ============================================
  // Keyboard Helpers
  // ============================================

  /**
   * Press a key
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Press Escape key (common use case)
   */
  async pressEscape(): Promise<void> {
    await this.pressKey('Escape');
  }

  /**
   * Press Enter key (common use case)
   */
  async pressEnter(): Promise<void> {
    await this.pressKey('Enter');
  }

  // ============================================
  // Text Retrieval
  // ============================================

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string> {
    await this.waitForSelector(selector);
    return await this.page.locator(selector).first().textContent() || '';
  }

  /**
   * Get all text content on the page
   */
  async getPageText(): Promise<string> {
    return await this.page.textContent('body') || '';
  }

  /**
   * Get input value
   */
  async getValue(selector: string): Promise<string> {
    await this.waitForSelector(selector);
    return await this.page.locator(selector).first().inputValue();
  }

  // ============================================
  // Count Helpers
  // ============================================

  /**
   * Count matching elements
   */
  async count(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  // ============================================
  // Logging Helpers
  // ============================================

  /**
   * Log message with timestamp
   */
  log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Log step message
   */
  logStep(stepNumber: number, description: string): void {
    console.log(`\nStep ${stepNumber}: ${description}`);
  }

  /**
   * Log success message
   */
  logSuccess(message: string): void {
    console.log(`  ✓ ${message}`);
  }

  /**
   * Log warning message
   */
  logWarning(message: string): void {
    console.log(`  ⚠️ ${message}`);
  }

  /**
   * Log error message
   */
  logError(message: string): void {
    console.log(`  ❌ ${message}`);
  }

  // ============================================
  // Debug Helpers
  // ============================================

  /**
   * Print current URL
   */
  async logCurrentURL(): void {
    const url = this.page.url();
    this.logSuccess(`Current URL: ${url}`);
  }

  /**
   * Print entire store state
   */
  async logStoreState(): void {
    const storage = await this.getStorage();
    console.log('\n  📦 Store State:', JSON.stringify(storage, null, 2));
  }

  /**
   * Print specific store property
   */
  async logStoreProperty(property: string): void {
    const storage = await this.getStorage();
    const value = storage?.state?.[property];
    console.log(`\n  📦 ${property}:`, JSON.stringify(value, null, 2));
  }
}
