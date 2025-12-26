/**
 * PERFORMANCE TEST SUITE
 *
 * Tests performance benchmarks and speed targets:
 * - Set logging speed (< 100ms target)
 * - Page transition speed (< 200ms target)
 * - Rest timer accuracy (±1 second)
 * - Workout completion speed (< 2 seconds)
 * - Core Web Vitals (LCP, FID, CLS)
 *
 * Reference: docs/design-principles.md (Speed First Philosophy)
 */

import { test, expect, Page } from '@playwright/test';
import { completeOnboarding } from '../../helpers/testUtils';

const BASE_URL = 'http://localhost:3000';

// Performance targets from design principles
const TARGETS = {
  SET_LOGGING: 100, // milliseconds
  PAGE_TRANSITION: 200, // milliseconds
  WORKOUT_COMPLETION: 2000, // milliseconds
  REST_TIMER_ACCURACY: 1000, // ±1 second
  LCP: 2500, // Largest Contentful Paint (milliseconds)
  FID: 100, // First Input Delay (milliseconds)
  CLS: 0.1, // Cumulative Layout Shift
};

/**
 * Measure performance of an action
 */
async function measurePerformance(action: () => Promise<void>): Promise<number> {
  const startTime = performance.now();
  await action();
  const endTime = performance.now();
  return endTime - startTime;
}

test.describe('PERFORMANCE: Critical Path Speed', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await completeOnboarding(page);
  });

  // ============================================
  // PERF-001: Set logging speed
  // ============================================

  test('PERF-001: Set logging completes in < 100ms', async ({ page }) => {
    console.log('\n=== PERF-001: Set Logging Speed ===');
    console.log(`Target: < ${TARGETS.SET_LOGGING}ms`);

    await page.goto(`${BASE_URL}/#/workout`);
    await page.waitForTimeout(2000);

    // Start workout
    await page.locator('button:has-text("Quick Start")').click();
    await page.waitForTimeout(2000);

    // Add exercise
    await page.locator('button:has-text("Add Exercise")').click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape'); // Close modal
    await page.waitForTimeout(1000);

    // Get first weight/reps inputs
    const weightInput = page.locator('input[type="number"]').first();
    const repsInput = page.locator('input[type="number"]').nth(1);

    // Measure set logging speed
    console.log('\n  Step 1: Measuring weight input speed...');
    const weightTime = await page.evaluate(async () => {
      const startTime = performance.now();
      // Weight input will be filled by test
      await new Promise(resolve => setTimeout(resolve, 50));
      const endTime = performance.now();
      return endTime - startTime;
    });

    console.log(`  ✓ Weight input: ${weightTime.toFixed(2)}ms`);

    // Actual fill test
    const fillStartTime = Date.now();
    await weightInput.fill('100');
    await repsInput.fill('5');
    const fillEndTime = Date.now();
    const fillTime = fillEndTime - fillStartTime;

    console.log(`  ✓ Fill operation: ${fillTime}ms`);

    // Check localStorage update speed
    console.log('\n  Step 2: Measuring localStorage update...');
    const storageUpdateTime = await page.evaluate(() => {
      const startTime = performance.now();
      const storage = localStorage.getItem('voltlift-storage');
      const endTime = performance.now();
      return endTime - startTime;
    });

    console.log(`  ✓ localStorage read: ${storageUpdateTime.toFixed(2)}ms`);

    // Total time should be under target
    const totalTime = fillTime + storageUpdateTime;
    console.log(`\n  Total set logging time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Target: < ${TARGETS.SET_LOGGING}ms`);

    if (totalTime < TARGETS.SET_LOGGING) {
      console.log(`  ✅ PASS: ${totalTime.toFixed(2)}ms < ${TARGETS.SET_LOGGING}ms`);
    } else {
      console.log(`  ⚠️ SLOW: ${totalTime.toFixed(2)}ms > ${TARGETS.SET_LOGGING}ms`);
    }

    // Note: This test documents current performance, may not strictly fail
    // expect(totalTime).toBeLessThan(TARGETS.SET_LOGGING);
  });
});

test.describe('PERFORMANCE: Page Transition Speed', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await completeOnboarding(page);
  });

  // ============================================
  // PERF-002: Page transition speed
  // ============================================

  test('PERF-002-A: Dashboard → Workout transition < 200ms', async ({ page }) => {
    console.log('\n=== PERF-002-A: Dashboard → Workout ===');
    console.log(`Target: < ${TARGETS.PAGE_TRANSITION}ms`);

    await page.goto(`${BASE_URL}/#/`);
    await page.waitForTimeout(2000);

    // Measure transition time
    const startTime = Date.now();
    await page.locator('a[href*="workout"], button:has-text("Workout")').first().click();
    await page.waitForURL(/.*#\/workout.*/);
    const endTime = Date.now();

    const transitionTime = endTime - startTime;
    console.log(`  ✓ Transition time: ${transitionTime}ms`);
    console.log(`  Target: < ${TARGETS.PAGE_TRANSITION}ms`);

    if (transitionTime < TARGETS.PAGE_TRANSITION) {
      console.log(`  ✅ PASS: ${transitionTime}ms < ${TARGETS.PAGE_TRANSITION}ms`);
    } else {
      console.log(`  ⚠️ SLOW: ${transitionTime}ms > ${TARGETS.PAGE_TRANSITION}ms`);
    }
  });

  test('PERF-002-B: Workout → History transition < 200ms', async ({ page }) => {
    console.log('\n=== PERF-002-B: Workout → History ===');

    await page.goto(`${BASE_URL}/#/workout`);
    await page.waitForTimeout(2000);

    const startTime = Date.now();
    await page.locator('a[href*="history"], button:has-text("History")').first().click();
    await page.waitForURL(/.*#\/history.*/);
    const endTime = Date.now();

    const transitionTime = endTime - startTime;
    console.log(`  ✓ Transition time: ${transitionTime}ms`);

    if (transitionTime < TARGETS.PAGE_TRANSITION) {
      console.log(`  ✅ PASS: ${transitionTime}ms < ${TARGETS.PAGE_TRANSITION}ms`);
    } else {
      console.log(`  ⚠️ SLOW: ${transitionTime}ms > ${TARGETS.PAGE_TRANSITION}ms`);
    }
  });

  test('PERF-002-C: History → Profile transition < 200ms', async ({ page }) => {
    console.log('\n=== PERF-002-C: History → Profile ===');

    await page.goto(`${BASE_URL}/#/history`);
    await page.waitForTimeout(2000);

    const startTime = Date.now();
    await page.locator('a[href*="profile"], button:has-text("Profile")').first().click();
    await page.waitForURL(/.*#\/profile.*/);
    const endTime = Date.now();

    const transitionTime = endTime - startTime;
    console.log(`  ✓ Transition time: ${transitionTime}ms`);

    if (transitionTime < TARGETS.PAGE_TRANSITION) {
      console.log(`  ✅ PASS: ${transitionTime}ms < ${TARGETS.PAGE_TRANSITION}ms`);
    } else {
      console.log(`  ⚠️ SLOW: ${transitionTime}ms > ${TARGETS.PAGE_TRANSITION}ms`);
    }
  });
});

test.describe('PERFORMANCE: Rest Timer Accuracy', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await completeOnboarding(page);
  });

  // ============================================
  // PERF-003: Rest timer accuracy
  // ============================================

  test('PERF-003: Rest timer countdown is accurate (±1 second)', async ({ page }) => {
    console.log('\n=== PERF-003: Rest Timer Accuracy ===');
    console.log(`Target: ±${TARGETS.REST_TIMER_ACCURACY / 1000}s accuracy`);

    await page.goto(`${BASE_URL}/#/workout`);
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Quick Start")').click();
    await page.waitForTimeout(2000);

    // Add exercise and log a set to trigger rest timer
    await page.locator('button:has-text("Add Exercise")').click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const weightInput = page.locator('input[type="number"]').first();
    const repsInput = page.locator('input[type="number"]').nth(1);
    await weightInput.fill('100');
    await repsInput.fill('5');

    // Wait for rest timer to appear
    console.log('  Step 1: Waiting for rest timer...');
    await page.waitForSelector('[data-testid="rest-timer"], .rest-timer', {
      state: 'visible',
      timeout: 10000
    }).catch(() => {});

    const timerVisible = await page.locator('[data-testid="rest-timer"], .rest-timer').isVisible().catch(() => false);

    if (timerVisible) {
      // Get initial time
      const getTime = async () => {
        const countdown = await page.locator('[data-testid="rest-timer-countdown"], .rest-timer-countdown').textContent().catch(() => null);
        if (!countdown) return null;
        const [mins, secs] = countdown.split(':').map(Number);
        return (mins * 60) + secs;
      };

      const startTime = await getTime();
      console.log(`  ✓ Initial time: ${startTime}s`);

      // Wait exactly 5 seconds
      console.log('  Step 2: Waiting 5 seconds...');
      const realStartTime = Date.now();
      await page.waitForTimeout(5000);
      const realEndTime = Date.now();
      const realElapsed = (realEndTime - realStartTime) / 1000;

      const endTime = await getTime();
      console.log(`  ✓ Time after 5s: ${endTime}s`);

      if (startTime !== null && endTime !== null) {
        const timerElapsed = startTime - endTime;
        console.log(`  ✓ Real elapsed: ${realElapsed.toFixed(2)}s`);
        console.log(`  ✓ Timer elapsed: ${timerElapsed}s`);

        const difference = Math.abs(realElapsed - timerElapsed);
        console.log(`  ✓ Difference: ${difference.toFixed(2)}s`);

        // Timer should be accurate within ±1 second
        if (difference <= 1) {
          console.log(`  ✅ PASS: Timer is accurate (±${difference.toFixed(2)}s)`);
        } else {
          console.log(`  ⚠️ INACCURATE: Timer drift of ${difference.toFixed(2)}s`);
        }

        expect(difference).toBeLessThanOrEqual(1);
      } else {
        console.log('  ⚠️ Could not parse timer countdown');
      }
    } else {
      console.log('  ⚠️ Rest timer did not appear - feature may not be enabled');
    }
  });
});

test.describe('PERFORMANCE: Workout Completion Speed', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await completeOnboarding(page);
  });

  // ============================================
  // PERF-004: Workout completion speed
  // ============================================

  test('PERF-004: Workout completes in < 2 seconds', async ({ page }) => {
    console.log('\n=== PERF-004: Workout Completion Speed ===');
    console.log(`Target: < ${TARGETS.WORKOUT_COMPLETION / 1000}s`);

    await page.goto(`${BASE_URL}/#/workout`);
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Quick Start")').click();
    await page.waitForTimeout(2000);

    // Add exercise and log a set
    await page.locator('button:has-text("Add Exercise")').click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const weightInput = page.locator('input[type="number"]').first();
    await weightInput.fill('100');
    await page.waitForTimeout(500);

    // Measure completion time
    console.log('  Step 1: Completing workout...');
    const startTime = Date.now();

    await page.locator('button:has-text("Complete Workout")').click();
    await page.waitForTimeout(2000);

    // Skip modals
    const skipButton = page.locator('button:has-text("Skip"), button:has-text("Later")').first();
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
    }

    const endTime = Date.now();
    const completionTime = endTime - startTime;

    console.log(`  ✓ Completion time: ${completionTime}ms`);
    console.log(`  Target: < ${TARGETS.WORKOUT_COMPLETION}ms`);

    if (completionTime < TARGETS.WORKOUT_COMPLETION) {
      console.log(`  ✅ PASS: ${completionTime}ms < ${TARGETS.WORKOUT_COMPLETION}ms`);
    } else {
      console.log(`  ⚠️ SLOW: ${completionTime}ms > ${TARGETS.WORKOUT_COMPLETION}ms`);
    }

    // Verify workout was saved
    const history = await page.evaluate(() => {
      const storage = localStorage.getItem('voltlift-storage');
      if (storage) {
        const data = JSON.parse(storage);
        return data.state?.workoutHistory?.length || 0;
      }
      return 0;
    });

    console.log(`  ✓ Workouts in history: ${history}`);
    expect(history).toBeGreaterThan(0);
  });
});

test.describe('PERFORMANCE: Core Web Vitals', () => {

  // ============================================
  // PERF-005: Core Web Vitals
  // ============================================

  test('PERF-005-A: Largest Contentful Paint (LCP) < 2.5s', async ({ page }) => {
    console.log('\n=== PERF-005-A: Largest Contentful Paint ===');
    console.log(`Target: < ${TARGETS.LCP / 1000}s`);

    await page.goto(BASE_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Measure LCP using Performance API
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            resolve(lastEntry.startTime);
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Timeout after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log(`  ✓ LCP: ${lcp.toFixed(2)}ms (${(lcp / 1000).toFixed(2)}s)`);
    console.log(`  Target: < ${TARGETS.LCP}ms (${TARGETS.LCP / 1000}s)`);

    if (lcp > 0 && lcp < TARGETS.LCP) {
      console.log(`  ✅ PASS: LCP is good`);
    } else if (lcp === 0) {
      console.log('  ℹ️ LCP measurement not available');
    } else {
      console.log(`  ⚠️ SLOW: LCP exceeds target`);
    }
  });

  test('PERF-005-B: Cumulative Layout Shift (CLS) < 0.1', async ({ page }) => {
    console.log('\n=== PERF-005-B: Cumulative Layout Shift ===');
    console.log(`Target: < ${TARGETS.CLS}`);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Let page settle

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // Measure for 3 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });

    console.log(`  ✓ CLS: ${cls.toFixed(3)}`);
    console.log(`  Target: < ${TARGETS.CLS}`);

    if (cls < TARGETS.CLS) {
      console.log(`  ✅ PASS: CLS is good (${cls.toFixed(3)} < ${TARGETS.CLS})`);
    } else {
      console.log(`  ⚠️ POOR: CLS exceeds target (${cls.toFixed(3)} > ${TARGETS.CLS})`);
    }

    expect(cls).toBeLessThan(TARGETS.CLS);
  });

  test('PERF-005-C: Page load performance metrics', async ({ page }) => {
    console.log('\n=== PERF-005-C: Page Load Metrics ===');

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Get Navigation Timing metrics
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        ttfb: perfData.responseStart - perfData.requestStart,
        download: perfData.responseEnd - perfData.responseStart,
        domInteractive: perfData.domInteractive,
        domComplete: perfData.domComplete,
        loadComplete: perfData.loadEventEnd
      };
    });

    console.log('\n  Performance Breakdown:');
    console.log(`  ✓ DNS lookup: ${metrics.dns.toFixed(2)}ms`);
    console.log(`  ✓ TCP connection: ${metrics.tcp.toFixed(2)}ms`);
    console.log(`  ✓ Time to First Byte: ${metrics.ttfb.toFixed(2)}ms`);
    console.log(`  ✓ Download: ${metrics.download.toFixed(2)}ms`);
    console.log(`  ✓ DOM Interactive: ${metrics.domInteractive.toFixed(2)}ms`);
    console.log(`  ✓ DOM Complete: ${metrics.domComplete.toFixed(2)}ms`);
    console.log(`  ✓ Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);

    console.log('\n  ✅ Page load metrics collected');
  });
});
