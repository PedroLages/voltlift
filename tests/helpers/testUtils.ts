/**
 * Test Utilities - Common test helper functions
 *
 * Reusable functions for:
 * - Onboarding workflows
 * - Workout creation
 * - Exercise management
 * - Data setup and teardown
 */

import { Page } from '@playwright/test';

// ============================================
// Onboarding Helpers
// ============================================

/**
 * Initialize test store by injecting complete state with templates and programs
 * Zustand persist only writes to localStorage on state changes, not initial mount
 * So we navigate to load the app, access exposed templates/programs, then persist manually
 */
export async function completeOnboarding(page: Page, name: string = 'Test User'): Promise<void> {
  // Navigate to app first
  await page.goto('http://localhost:3000/#/');
  await page.waitForTimeout(1000);

  // Set testing mode in the new page context
  await page.evaluate(() => {
    localStorage.setItem('TESTING_MODE', 'true');
  });

  // Reload so constants.ts can check TESTING_MODE and expose templates/programs
  await page.reload();
  await page.waitForTimeout(2500);

  // Wait for templates and programs to be exposed on window
  let attempts = 0;
  while (attempts < 20) {
    const hasTemplates = await page.evaluate(() => {
      return (window as any).__INITIAL_TEMPLATES__ !== undefined && (window as any).__INITIAL_PROGRAMS__ !== undefined;
    });

    if (hasTemplates) {
      console.log(`[TEST] Templates and programs exposed after ${attempts * 250}ms`);
      break;
    }

    await page.waitForTimeout(250);
    attempts++;
  }

  // Create complete persisted state using exposed templates and programs
  const storeInfo = await page.evaluate((userName) => {
    console.log('[TEST] Window keys:', Object.keys(window).filter(k => k.includes('INITIAL')));
    console.log('[TEST] TESTING_MODE:', localStorage.getItem('TESTING_MODE'));

    const templates = (window as any).__INITIAL_TEMPLATES__ || [];
    const programs = (window as any).__INITIAL_PROGRAMS__ || [];

    console.log(`[TEST] Found ${templates.length} templates and ${programs.length} programs on window`);

    // Create complete store structure
    const completeState = {
      state: {
        settings: {
          name: userName,
          units: 'kg',
          goal: { type: 'Build Muscle', targetPerWeek: 4 },
          experienceLevel: 'Beginner',
          availableEquipment: ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cable'],
          onboardingCompleted: true,
          personalRecords: {},
          defaultRestTimer: 90,
          barWeight: 20,
          incrementSettings: {
            upperBodyIncrement: 2.5,
            lowerBodyIncrement: 5,
          },
        },
        history: [],
        templates: templates,
        programs: programs,
        activeWorkout: null,
        customExercises: [],
        // Don't include customExerciseVisuals - excluded by partialize
        dailyLogs: {},
        syncStatus: 'synced',
        // Don't include Sets (pendingSyncWorkouts, etc.) - they're excluded by partialize
        // Don't include transient fields (restTimerStart, activeBiometrics, lastWorkoutXP, etc.)
        settingsNeedsSync: false,
        isSyncing: false,
        undoStack: null,
        restDuration: 90,
        gamification: {
          totalXP: 0,
          currentLevel: 1,
          xpToNextLevel: 500,
          xpHistory: [],
          streak: {
            current: 0,
            longest: 0,
            lastWorkoutDate: '',
            streakStartDate: '',
            freezesRemaining: 2,
            freezesUsedThisWeek: 0,
          },
          unlockedAchievements: [],
          totalWorkouts: 0,
          totalVolume: 0,
          totalPRs: 0,
        },
      },
      version: 6,
    };

    // Persist to localStorage
    localStorage.setItem('voltlift-storage', JSON.stringify(completeState));

    return {
      templateCount: templates.length,
      programCount: programs.length,
    };
  }, name);

  console.log(`[TEST] Onboarding completed - ${storeInfo.templateCount} templates, ${storeInfo.programCount} programs loaded`);

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[BROWSER ERROR]', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
    console.log('[PAGE ERROR STACK]', error.stack);
  });

  // Reload to pick up the persisted state
  await page.goto('http://localhost:3000/#/');
  await page.waitForTimeout(2000);

  // Verify the app loaded successfully
  const debugInfo = await page.evaluate(() => {
    const root = document.querySelector('#root');
    const storage = localStorage.getItem('voltlift-storage');
    let storageData = null;

    if (storage) {
      try {
        storageData = JSON.parse(storage);
      } catch (e) {
        return { error: 'Failed to parse localStorage', rootExists: root !== null };
      }
    }

    return {
      rootExists: root !== null,
      rootHasContent: root?.innerHTML.length > 0,
      storageExists: storage !== null,
      hasTemplates: storageData?.state?.templates?.length > 0,
      hasPrograms: storageData?.state?.programs?.length > 0,
      onboardingCompleted: storageData?.state?.settings?.onboardingCompleted,
    };
  });

  console.log('[TEST] App load debug:', JSON.stringify(debugInfo));

  if (!debugInfo.rootHasContent) {
    console.log('[TEST] WARNING: App did not load after reload - black screen detected');
  }
}

/**
 * Skip onboarding by directly setting localStorage
 */
export async function skipOnboarding(page: Page, name: string = 'Test User'): Promise<void> {
  await page.evaluate((userName) => {
    localStorage.setItem('TESTING_MODE', 'true');
    const storage = localStorage.getItem('voltlift-storage');
    if (storage) {
      const data = JSON.parse(storage);
      data.state.settings = data.state.settings || {};
      data.state.settings.onboardingCompleted = true;
      data.state.settings.name = userName;
      localStorage.setItem('voltlift-storage', JSON.stringify(data));
    }
  }, name);
}

// ============================================
// Workout Helpers
// ============================================

/**
 * Create a Quick Start workout with specified exercises
 */
export async function createQuickWorkout(page: Page, exerciseNames: string[]): Promise<void> {
  // Navigate to workout page
  await page.goto('http://localhost:3000/#/workout');
  await page.waitForTimeout(2000);

  // Start Quick Start
  const quickStartButton = page.locator('button:has-text("Quick Start")').first();
  if (await quickStartButton.isVisible().catch(() => false)) {
    await quickStartButton.click();
    await page.waitForTimeout(2000);
  }

  // Add all exercises
  for (const exerciseName of exerciseNames) {
    await addExerciseToWorkout(page, exerciseName);
  }
}

/**
 * Log standard sets for all exercises (3 sets each with same weight/reps)
 */
export async function logStandardSets(
  page: Page,
  exerciseCount: number,
  weight: number = 60,
  reps: number = 10
): Promise<void> {
  for (let exerciseIdx = 0; exerciseIdx < exerciseCount; exerciseIdx++) {
    for (let setIdx = 0; setIdx < 3; setIdx++) {
      const weightInput = page.locator('input[type="number"]').nth(exerciseIdx * 6 + setIdx * 2);
      const repsInput = page.locator('input[type="number"]').nth(exerciseIdx * 6 + setIdx * 2 + 1);

      if (await weightInput.isVisible().catch(() => false)) {
        await weightInput.fill(String(weight));
        await page.waitForTimeout(200);
      }

      if (await repsInput.isVisible().catch(() => false)) {
        await repsInput.fill(String(reps));
        await page.waitForTimeout(200);
      }
    }
  }
}

// ============================================
// Exercise Helpers
// ============================================

/**
 * Add an exercise to the current workout
 */
export async function addExerciseToWorkout(page: Page, exerciseName: string): Promise<void> {
  const addExerciseButton = page.locator('button:has-text("Add Exercise")').first();
  if (await addExerciseButton.isVisible().catch(() => false)) {
    await addExerciseButton.click();
    await page.waitForTimeout(1000);

    const exerciseCard = page.locator(`text=${exerciseName}`).first();
    if (await exerciseCard.isVisible().catch(() => false)) {
      await exerciseCard.click();
      await page.waitForTimeout(2000); // Wait for modal to close (BUG-APP-001 may cause this to fail)
    }
  }
}

/**
 * Close exercise modal manually (workaround for BUG-APP-001)
 */
export async function closeExerciseModal(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
}

// ============================================
// Storage Helpers
// ============================================

/**
 * Get active workout from localStorage
 */
export async function getActiveWorkout(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const storage = localStorage.getItem('voltlift-storage');
    if (storage) {
      const data = JSON.parse(storage);
      return data.state?.activeWorkout || null;
    }
    return null;
  });
}

/**
 * Get workout history from localStorage
 */
export async function getWorkoutHistory(page: Page): Promise<any[]> {
  return await page.evaluate(() => {
    const storage = localStorage.getItem('voltlift-storage');
    if (storage) {
      const data = JSON.parse(storage);
      return data.state?.workoutHistory || [];
    }
    return [];
  });
}

/**
 * Clear all localStorage data
 */
export async function clearAllData(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
  });
}

/**
 * Get rest timer settings
 */
export async function getRestTimerSettings(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const storage = localStorage.getItem('voltlift-storage');
    if (storage) {
      const data = JSON.parse(storage);
      return {
        defaultRestTimer: data.state?.settings?.defaultRestTimer || 90,
        restTimerOptions: data.state?.settings?.restTimerOptions || {},
      };
    }
    return null;
  });
}

/**
 * Set category-specific rest timer defaults
 * Waits for store to exist, then modifies rest timer settings
 */
export async function setRestTimerDefaults(
  page: Page,
  compound: number = 180,
  isolation: number = 90,
  cardio: number = 60
): Promise<void> {
  // Wait for store to be created (poll up to 10 seconds)
  let attempts = 0;
  console.log('[TEST] Waiting for voltlift-storage to be created...');
  while (attempts < 20) {
    const storageExists = await page.evaluate(() => {
      return localStorage.getItem('voltlift-storage') !== null;
    });

    if (storageExists) {
      console.log(`[TEST] Storage found after ${attempts * 500}ms`);
      break;
    }

    await page.waitForTimeout(500);
    attempts++;
  }

  if (attempts >= 20) {
    console.log('[TEST] WARNING: Gave up waiting for storage after 10 seconds');
  }

  // Modify the rest timer settings
  await page.evaluate(
    ({ compoundTime, isolationTime, cardioTime }) => {
      const storage = localStorage.getItem('voltlift-storage');

      if (!storage) {
        console.log('[TEST] ERROR: Storage still not found after waiting!');
        return;
      }

      console.log('[TEST] Storage found, modifying rest timer settings');
      const data = JSON.parse(storage);

      // Ensure nested structure exists
      data.state = data.state || {};
      data.state.settings = data.state.settings || {};

      // Preserve existing restTimerOptions, only update customRestTimes
      data.state.settings.restTimerOptions = data.state.settings.restTimerOptions || {};
      data.state.settings.restTimerOptions.sound = data.state.settings.restTimerOptions.sound ?? true;
      data.state.settings.restTimerOptions.vibration = data.state.settings.restTimerOptions.vibration ?? true;
      data.state.settings.restTimerOptions.autoStart = data.state.settings.restTimerOptions.autoStart ?? true;
      data.state.settings.restTimerOptions.customRestTimes = {
        compound: compoundTime,
        isolation: isolationTime,
        cardio: cardioTime,
      };

      localStorage.setItem('voltlift-storage', JSON.stringify(data));
      console.log('[TEST] Set rest timer defaults:', data.state.settings.restTimerOptions);

      // Verify it was saved
      const verification = localStorage.getItem('voltlift-storage');
      if (verification) {
        const verifyData = JSON.parse(verification);
        console.log('[TEST] Verified saved customRestTimes:', verifyData.state?.settings?.restTimerOptions?.customRestTimes);
      }
    },
    { compoundTime: compound, isolationTime: isolation, cardioTime: cardio }
  );
}

// ============================================
// Wait Helpers
// ============================================

/**
 * Wait for rest timer to appear
 */
export async function waitForRestTimer(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForSelector('[data-testid="rest-timer"], .rest-timer', {
    state: 'visible',
    timeout,
  }).catch(() => {});
}

/**
 * Wait for modal to appear
 */
export async function waitForModal(page: Page, modalTitle: string, timeout: number = 5000): Promise<void> {
  await page.waitForSelector(`text=${modalTitle}`, { timeout });
}

// ============================================
// Screenshot Helpers
// ============================================

/**
 * Take screenshot with annotation
 */
export async function screenshotWithAnnotation(
  page: Page,
  name: string,
  annotation: string
): Promise<void> {
  console.log(`\n  📸 ${annotation}`);
  await page.screenshot({
    path: `test-screenshots/${name}.png`,
    fullPage: true,
  });
}

// ============================================
// Verification Helpers
// ============================================

/**
 * Verify workout persisted to localStorage
 */
export async function verifyWorkoutPersisted(page: Page, workoutId: string): Promise<boolean> {
  const history = await getWorkoutHistory(page);
  return history.some((w: any) => w.id === workoutId);
}

/**
 * Verify exercise is in workout
 */
export async function verifyExerciseInWorkout(page: Page, exerciseName: string): Promise<boolean> {
  const activeWorkout = await getActiveWorkout(page);
  if (!activeWorkout || !activeWorkout.logs) {
    return false;
  }

  return activeWorkout.logs.some((log: any) => log.exercise?.name === exerciseName);
}

/**
 * Get exercise category from store
 */
export async function getExerciseCategory(page: Page, exerciseName: string): Promise<string | null> {
  return await page.evaluate((name) => {
    const storage = localStorage.getItem('voltlift-storage');
    if (storage) {
      const data = JSON.parse(storage);
      const allExercises = [
        ...(data.state?.exercises || []),
        ...(data.state?.customExercises || []),
      ];
      const exercise = allExercises.find((e: any) => e.name === name);
      return exercise?.category || null;
    }
    return null;
  }, exerciseName);
}
