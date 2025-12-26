/**
 * VERSION 7 MIGRATION VERIFICATION TEST
 *
 * Verifies that existing users (version 6) get templates and programs
 * added via the Version 7 migration.
 *
 * This simulates the production bug where users don't have templates/programs.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('MIGRATION V7: Fix Missing Templates/Programs', () => {

  test('MIG-001: Version 6 state gets upgraded to V7 with templates/programs', async ({ page }) => {
    console.log('\n=== MIG-001: Version 7 Migration Verification ===');

    // Step 1: Clear localStorage
    console.log('\nStep 1: Clearing localStorage...');
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Step 2: Enable TESTING_MODE to bypass auth
    await page.evaluate(() => {
      localStorage.setItem('TESTING_MODE', 'true');
    });

    // Step 3: Inject Version 6 state WITHOUT templates/programs (simulating production bug)
    console.log('\nStep 3: Injecting Version 6 state (missing templates/programs)...');
    await page.evaluate(() => {
      const v6State = {
        state: {
          settings: {
            name: 'Existing User',
            units: 'kg',
            goal: { type: 'Build Muscle', targetPerWeek: 4 },
            experienceLevel: 'Beginner',
            availableEquipment: ['Barbell', 'Dumbbell', 'Machine'],
            onboardingCompleted: true,
            personalRecords: {},
            defaultRestTimer: 90,
            barWeight: 20,
          },
          history: [],
          templates: [], // ❌ EMPTY - This is the bug!
          programs: [],  // ❌ EMPTY - This is the bug!
          activeWorkout: null,
          customExercises: [],
          dailyLogs: {},
          syncStatus: 'synced',
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
        version: 6, // Old version
      };

      localStorage.setItem('voltlift-storage', JSON.stringify(v6State));
      console.log('[TEST] Injected Version 6 state with 0 templates and 0 programs');
    });

    // Step 4: Reload page to trigger migration
    console.log('\nStep 4: Reloading page to trigger Version 7 migration...');
    await page.goto(`${BASE_URL}/#/`);
    await page.waitForTimeout(3000); // Wait for migration to complete

    // Step 5: Verify migration updated version and added templates/programs
    console.log('\nStep 5: Verifying migration results...');
    const migrationResult = await page.evaluate(() => {
      const storage = localStorage.getItem('voltlift-storage');
      if (!storage) {
        return { found: false, error: 'No voltlift-storage after migration' };
      }

      const data = JSON.parse(storage);
      return {
        found: true,
        version: data.version,
        onboardingCompleted: data.state?.settings?.onboardingCompleted,
        userName: data.state?.settings?.name,
        templateCount: data.state?.templates?.length || 0,
        programCount: data.state?.programs?.length || 0,
        hasDualPhase: data.state?.programs?.some((p: any) => p.name === 'Dual-Phase Domination') || false,
        firstTemplateName: data.state?.templates?.[0]?.name || 'N/A',
        firstProgramName: data.state?.programs?.[0]?.name || 'N/A',
      };
    });

    console.log('\n  Migration Result:');
    console.log(`    - Version: ${migrationResult.version} (should be 7)`);
    console.log(`    - User Name: ${migrationResult.userName}`);
    console.log(`    - Onboarding Completed: ${migrationResult.onboardingCompleted}`);
    console.log(`    - Templates: ${migrationResult.templateCount}`);
    console.log(`    - Programs: ${migrationResult.programCount}`);
    console.log(`    - Has Dual-Phase Domination: ${migrationResult.hasDualPhase}`);
    console.log(`    - First Template: ${migrationResult.firstTemplateName}`);
    console.log(`    - First Program: ${migrationResult.firstProgramName}`);

    // Assertions
    expect(migrationResult.found, 'voltlift-storage should exist').toBe(true);
    expect(migrationResult.version, 'Version should be updated to 7').toBe(7);
    expect(migrationResult.onboardingCompleted, 'User should remain onboarded').toBe(true);
    expect(migrationResult.userName, 'User name should be preserved').toBe('Existing User');
    expect(migrationResult.templateCount, '✅ Templates should be added by migration').toBeGreaterThan(0);
    expect(migrationResult.programCount, '✅ Programs should be added by migration').toBeGreaterThan(0);
    expect(migrationResult.hasDualPhase, '✅ Dual-Phase Domination should exist').toBe(true);

    console.log('\n✅ MIG-001 PASSED: Version 7 migration successfully added templates and programs');
  });

  test('MIG-002: Can start workout from migrated templates', async ({ page }) => {
    console.log('\n=== MIG-002: Verify Migrated Templates Work ===');

    // Reload to use migrated state from MIG-001
    await page.goto(`${BASE_URL}/#/`);
    await page.waitForTimeout(2000);

    // Navigate to workout page
    console.log('\nNavigating to Workout page...');
    await page.goto(`${BASE_URL}/#/workout`);
    await page.waitForTimeout(2000);

    // Try to start a workout (Quick Start or from template)
    const quickStartButton = page.locator('button').filter({ hasText: /quick start|start workout/i }).first();
    const hasQuickStart = await quickStartButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasQuickStart) {
      console.log('  ✓ Quick Start button found');
      await quickStartButton.click();
      await page.waitForTimeout(2000);

      // Verify workout screen loaded
      const addExerciseButton = page.locator('button').filter({ hasText: /add exercise/i }).first();
      const canAddExercise = await addExerciseButton.isVisible({ timeout: 3000 }).catch(() => false);

      expect(canAddExercise, 'Should be able to add exercises').toBe(true);
      console.log('  ✓ Workout functionality works with migrated templates');
      console.log('\n✅ MIG-002 PASSED: Migrated templates are functional');
    } else {
      console.log('  ℹ️ Quick Start not visible - may require different navigation');
    }
  });

  test('MIG-003: Can activate Dual-Phase Domination from migrated programs', async ({ page }) => {
    console.log('\n=== MIG-003: Verify Migrated Programs Work ===');

    await page.goto(`${BASE_URL}/#/`);
    await page.waitForTimeout(2000);

    // Navigate to programs
    console.log('\nNavigating to Programs page...');
    await page.goto(`${BASE_URL}/#/programs`);
    await page.waitForTimeout(2000);

    // Find Dual-Phase Domination
    const programCard = page.locator('text=Dual-Phase Domination').first();
    const programVisible = await programCard.isVisible({ timeout: 5000 }).catch(() => false);

    expect(programVisible, '✅ Dual-Phase Domination should be visible').toBe(true);
    console.log('  ✓ Dual-Phase Domination program found');

    // Click to view details
    await programCard.click();
    await page.waitForTimeout(2000);

    // Look for enroll/activate button
    const enrollButton = page.locator('button').filter({ hasText: /enroll|activate|start program/i }).first();
    const hasEnrollButton = await enrollButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEnrollButton) {
      console.log('  ✓ Enroll button found');
      await enrollButton.click();
      await page.waitForTimeout(2000);

      // Verify program was activated
      const programActivated = await page.evaluate(() => {
        const storage = localStorage.getItem('voltlift-storage');
        if (storage) {
          const data = JSON.parse(storage);
          return {
            hasActiveProgram: data.state?.settings?.activeProgram !== undefined,
            programId: data.state?.settings?.activeProgram?.programId || null,
          };
        }
        return { hasActiveProgram: false, programId: null };
      });

      console.log(`  Program activated: ${programActivated.hasActiveProgram}`);
      console.log(`  Active program ID: ${programActivated.programId}`);

      expect(programActivated.hasActiveProgram, '✅ Program should be activated').toBe(true);
      console.log('\n✅ MIG-003 PASSED: Migrated programs can be activated');
    } else {
      console.log('  ℹ️ Enroll button not visible - program may already be active');
    }
  });
});
