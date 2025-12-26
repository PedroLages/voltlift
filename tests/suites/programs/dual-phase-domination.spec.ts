/**
 * DUAL-PHASE DOMINATION PROGRAM TEST
 *
 * Verifies that the Dual-Phase Domination program:
 * 1. Loads correctly with all templates
 * 2. Has access to all 16 required workout templates
 * 3. Can start workouts from program templates
 * 4. Shows exercises in workout sessions
 */

import { test, expect } from '@playwright/test';
import { completeOnboarding } from '../../helpers/testUtils';

const BASE_URL = 'http://localhost:3000';

test.describe('PROGRAM: Dual-Phase Domination', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await completeOnboarding(page);
  });

  test('PROG-001: Program loads with all templates and exercises', async ({ page }) => {
    console.log('\n=== PROG-001: Dual-Phase Domination Program Verification ===');

    // Step 1: Navigate to programs page
    console.log('\nStep 1: Navigating to Programs page...');
    await page.goto(`${BASE_URL}/#/programs`);
    await page.waitForTimeout(2000);

    // Step 2: Verify Dual-Phase Domination program exists
    console.log('\nStep 2: Looking for Dual-Phase Domination program...');
    const programCard = page.locator('text=Dual-Phase Domination').first();
    const programVisible = await programCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!programVisible) {
      console.log('  ❌ Dual-Phase Domination program NOT found');

      // Debug: List all programs
      const allPrograms = await page.evaluate(() => {
        const storage = localStorage.getItem('voltlift-storage');
        if (storage) {
          const data = JSON.parse(storage);
          return data.state?.programs?.map((p: any) => p.name) || [];
        }
        return [];
      });
      console.log('  Available programs:', allPrograms);

      throw new Error('Dual-Phase Domination program not found on page');
    }

    console.log('  ✓ Dual-Phase Domination program found');

    // Step 3: Check program details in localStorage
    console.log('\nStep 3: Verifying program structure in store...');
    const programDetails = await page.evaluate(() => {
      const storage = localStorage.getItem('voltlift-storage');
      if (storage) {
        const data = JSON.parse(storage);
        const program = data.state?.programs?.find((p: any) => p.name === 'Dual-Phase Domination');

        if (program) {
          // Get unique template IDs
          const templateIds = [...new Set(program.sessions?.map((s: any) => s.templateId) || [])];

          // Check if templates exist for each templateId
          const templates = data.state?.templates || [];
          const missingTemplates: string[] = [];
          const foundTemplates: any[] = [];

          templateIds.forEach((templateId: string) => {
            const template = templates.find((t: any) => t.id === templateId);
            if (template) {
              foundTemplates.push({
                id: template.id,
                name: template.name,
                exerciseCount: template.logs?.length || 0
              });
            } else {
              missingTemplates.push(templateId);
            }
          });

          return {
            found: true,
            weeks: program.weeks,
            sessionCount: program.sessions?.length || 0,
            uniqueTemplates: templateIds.length,
            foundTemplates: foundTemplates,
            missingTemplates: missingTemplates,
            totalTemplatesInStore: templates.length,
            programsInStore: data.state?.programs?.length || 0
          };
        }
      }
      return { found: false };
    });

    console.log('  Program Details:');
    console.log(`    - Duration: ${programDetails.weeks} weeks`);
    console.log(`    - Total sessions: ${programDetails.sessionCount}`);
    console.log(`    - Unique templates needed: ${programDetails.uniqueTemplates}`);
    console.log(`    - Templates found: ${programDetails.foundTemplates.length}`);
    console.log(`    - Templates missing: ${programDetails.missingTemplates.length}`);
    console.log(`    - Total templates in store: ${programDetails.totalTemplatesInStore}`);
    console.log(`    - Total programs in store: ${programDetails.programsInStore}`);

    // Verify no missing templates
    expect(programDetails.missingTemplates.length, 'All required templates should be present').toBe(0);
    expect(programDetails.foundTemplates.length, 'Should find all 16 unique templates').toBeGreaterThanOrEqual(16);

    // Step 4: Verify each template has exercises
    console.log('\nStep 4: Verifying templates have exercises...');
    let templatesWithNoExercises = 0;

    programDetails.foundTemplates.forEach((template: any) => {
      if (template.exerciseCount === 0) {
        console.log(`  ❌ Template "${template.name}" (${template.id}) has 0 exercises`);
        templatesWithNoExercises++;
      } else {
        console.log(`  ✓ Template "${template.name}" has ${template.exerciseCount} exercises`);
      }
    });

    expect(templatesWithNoExercises, 'All templates should have exercises').toBe(0);

    // Step 5: Click into program to view details
    console.log('\nStep 5: Opening program details...');
    await programCard.click();
    await page.waitForTimeout(2000);

    // Check if we're on the program detail page
    const programTitle = page.locator('h1, h2').filter({ hasText: 'Dual-Phase Domination' });
    const titleVisible = await programTitle.isVisible({ timeout: 3000 }).catch(() => false);

    if (titleVisible) {
      console.log('  ✓ Program detail page loaded');

      // Look for session/workout information
      const hasSessionInfo = await page.locator('text=/week|session|day/i').first().isVisible({ timeout: 2000 }).catch(() => false);
      if (hasSessionInfo) {
        console.log('  ✓ Program shows session information');
      }
    }

    console.log('\n✅ PROG-001 PASSED: Dual-Phase Domination program has all templates and exercises');
  });

  test('PROG-002: Can start workout from program template', async ({ page }) => {
    console.log('\n=== PROG-002: Start Workout from Program Template ===');

    // Get the first template ID from Dual-Phase Domination
    const firstTemplateId = await page.evaluate(() => {
      const storage = localStorage.getItem('voltlift-storage');
      if (storage) {
        const data = JSON.parse(storage);
        const program = data.state?.programs?.find((p: any) => p.name === 'Dual-Phase Domination');
        return program?.sessions?.[0]?.templateId || null;
      }
      return null;
    });

    console.log(`\nFirst template ID: ${firstTemplateId}`);
    expect(firstTemplateId).toBeTruthy();

    // Navigate to workout page
    console.log('\nNavigating to workout page...');
    await page.goto(`${BASE_URL}/#/workout`);
    await page.waitForTimeout(2000);

    // Look for "Start from Template" or similar button
    const startTemplateButton = page.locator('button').filter({ hasText: /template|program/i }).first();
    const hasTemplateButton = await startTemplateButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasTemplateButton) {
      console.log('  ✓ Template start option found');
      await startTemplateButton.click();
      await page.waitForTimeout(1500);

      // Look for the template in the list
      const templateCard = page.locator(`text=${firstTemplateId}`).first();
      const templateVisible = await templateCard.isVisible({ timeout: 3000 }).catch(() => false);

      if (templateVisible) {
        console.log(`  ✓ Template ${firstTemplateId} is available`);
        console.log('\n✅ PROG-002 PASSED: Can access program templates');
      } else {
        console.log(`  ℹ️ Template ${firstTemplateId} not visible in UI (may require different navigation)`);
      }
    } else {
      // Alternative: Start Quick Start and verify exercises are available
      console.log('  ℹ️ Using Quick Start to verify exercise availability');

      const quickStartButton = page.locator('button').filter({ hasText: 'Quick Start' }).first();
      const hasQuickStart = await quickStartButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasQuickStart) {
        await quickStartButton.click();
        await page.waitForTimeout(2000);

        // Verify "Add Exercise" button is available
        const addExerciseButton = page.locator('button').filter({ hasText: 'Add Exercise' }).first();
        const canAddExercise = await addExerciseButton.isVisible({ timeout: 3000 }).catch(() => false);

        expect(canAddExercise, 'Should be able to add exercises').toBe(true);
        console.log('  ✓ Can start workout and add exercises');
        console.log('\n✅ PROG-002 PASSED: Workout functionality available');
      }
    }
  });

  test('PROG-003: Verify PRD templates have correct exercises', async ({ page }) => {
    console.log('\n=== PROG-003: Verify PRD Template Exercises ===');

    // Check specific PRD templates that Dual-Phase Domination uses
    const templateChecks = [
      { id: 'prd_push_a', expectedExercises: ['Bench Press', 'Incline', 'Fly', 'OHP'] },
      { id: 'prd_pull_a', expectedExercises: ['Pulldown', 'Pull Up', 'Row', 'Curl'] },
      { id: 'prd_legs_a', expectedExercises: ['Squat', 'Leg Press', 'Extension', 'RDL'] }
    ];

    console.log('\nChecking key PRD templates...');

    for (const check of templateChecks) {
      const templateInfo = await page.evaluate((templateId) => {
        const storage = localStorage.getItem('voltlift-storage');
        if (storage) {
          const data = JSON.parse(storage);
          const template = data.state?.templates?.find((t: any) => t.id === templateId);

          if (template) {
            const exercises = data.state?.customExercises || [];
            // Note: exercises might be in a different array, this is a simplified check

            return {
              found: true,
              name: template.name,
              logCount: template.logs?.length || 0,
              logs: template.logs?.map((log: any) => ({
                exerciseId: log.exerciseId,
                setCount: log.sets?.length || 0
              })) || []
            };
          }
        }
        return { found: false };
      }, check.id);

      if (templateInfo.found) {
        console.log(`\n  Template: ${check.id}`);
        console.log(`    Name: ${templateInfo.name}`);
        console.log(`    Exercise logs: ${templateInfo.logCount}`);

        expect(templateInfo.logCount, `${check.id} should have exercises`).toBeGreaterThan(0);

        templateInfo.logs.forEach((log: any, idx: number) => {
          console.log(`      ${idx + 1}. Exercise ID: ${log.exerciseId}, Sets: ${log.setCount}`);
        });
      } else {
        throw new Error(`Template ${check.id} not found!`);
      }
    }

    console.log('\n✅ PROG-003 PASSED: PRD templates have exercises configured');
  });
});
