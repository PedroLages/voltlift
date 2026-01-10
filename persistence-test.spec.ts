import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test('Workout Persistence Test', async ({ page }) => {
  console.log('\n=== WORKOUT PERSISTENCE TEST ===\n');

  // Enable testing mode and complete onboarding
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.setItem('TESTING_MODE', 'true');
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

  // Start a workout
  console.log('1. Starting workout...');
  await page.goto(`${BASE_URL}/#/workout`);
  await page.waitForTimeout(2000);

  // Check if activeWorkout exists in localStorage
  const beforeReload = await page.evaluate(() => {
    const storage = localStorage.getItem('voltlift-storage');
    if (storage) {
      const data = JSON.parse(storage);
      return {
        hasActiveWorkout: !!data.state.activeWorkout,
        activeWorkoutId: data.state.activeWorkout?.id || null,
        activeWorkoutName: data.state.activeWorkout?.name || null,
        startTime: data.state.activeWorkout?.startTime || null
      };
    }
    return { hasActiveWorkout: false };
  });

  console.log('Before reload:', beforeReload);

  // Reload the page
  console.log('\n2. Reloading page...');
  await page.reload();
  await page.waitForTimeout(3000);

  // Check if activeWorkout still exists after reload
  const afterReload = await page.evaluate(() => {
    const storage = localStorage.getItem('voltlift-storage');
    if (storage) {
      const data = JSON.parse(storage);
      return {
        hasActiveWorkout: !!data.state.activeWorkout,
        activeWorkoutId: data.state.activeWorkout?.id || null,
        activeWorkoutName: data.state.activeWorkout?.name || null,
        startTime: data.state.activeWorkout?.startTime || null
      };
    }
    return { hasActiveWorkout: false };
  });

  console.log('After reload:', afterReload);

  // Verify persistence
  console.log('\n3. Verification:');
  console.log('  Before Reload - Has Active Workout:', beforeReload.hasActiveWorkout);
  console.log('  After Reload  - Has Active Workout:', afterReload.hasActiveWorkout);
  console.log('  Workout Persisted:', beforeReload.hasActiveWorkout && afterReload.hasActiveWorkout);

  if (beforeReload.hasActiveWorkout && afterReload.hasActiveWorkout) {
    console.log('  ✅ Active workout persisted correctly!');
    console.log('  Workout ID:', afterReload.activeWorkoutId);
    console.log('  Workout Name:', afterReload.activeWorkoutName);
  } else if (!beforeReload.hasActiveWorkout) {
    console.log('  ⚠️  No workout was started (might be an empty workout page)');
  } else {
    console.log('  ❌ Active workout was LOST on reload');
  }

  // Check current URL
  const currentUrl = page.url();
  console.log('\n4. Current URL:', currentUrl);
  console.log('  On workout page:', currentUrl.includes('/workout'));

  console.log('\n=== END PERSISTENCE TEST ===\n');

  // Assertions
  if (beforeReload.hasActiveWorkout) {
    expect(afterReload.hasActiveWorkout).toBe(true);
    expect(afterReload.activeWorkoutId).toBe(beforeReload.activeWorkoutId);
  }
});
