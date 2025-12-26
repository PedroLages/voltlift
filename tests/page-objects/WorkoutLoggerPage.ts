/**
 * WorkoutLoggerPage - Page Object for Workout Logger
 *
 * Handles all workout-related interactions:
 * - Starting workouts (Quick Start, Template, Program)
 * - Adding/removing/swapping exercises
 * - Logging sets (weight, reps, RPE)
 * - Rest timer interactions
 * - Completing workouts
 * - Post-workout feedback
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface SetData {
  weight: number;
  reps: number;
  rpe?: number;
}

export class WorkoutLoggerPage extends BasePage {
  // Selectors
  private readonly selectors = {
    // Workout actions
    quickStartButton: 'button:has-text("Quick Start")',
    startFromTemplateButton: 'button:has-text("Start from Template")',
    addExerciseButton: 'button:has-text("Add Exercise")',
    completeWorkoutButton: 'button:has-text("Complete Workout")',
    saveDraftButton: 'button:has-text("Save Draft")',
    cancelWorkoutButton: 'button:has-text("Cancel Workout")',

    // Exercise modal
    exerciseModal: '[role="dialog"], .modal, [class*="Modal"]',
    exerciseCard: '[data-testid="exercise-card"]',
    modalCloseButton: 'button[aria-label*="close"], button:has-text("×")',

    // Exercise management
    exerciseLog: '[data-testid="exercise-log"]',
    removeExerciseButton: 'button[aria-label*="Remove"]',
    swapExerciseButton: 'button[aria-label*="Swap"]',
    addSetButton: 'button:has-text("Add Set"), button:has-text("+")',

    // Set inputs
    weightInput: 'input[type="number"]',
    repsInput: 'input[type="number"]',
    rpeSelect: 'select[name="rpe"]',
    setCompleteButton: 'button:has(svg)', // Check button with SVG icon

    // Rest timer
    restTimerOverlay: '[data-testid="rest-timer"], .rest-timer',
    restTimerCountdown: '[data-testid="rest-timer-countdown"]',
    restTimerSkip: 'button:has-text("Skip")',
    restTimerAdd30: 'button:has-text("+30")',
    restTimerSubtract15: 'button:has-text("-15")',
    restTimerMinimize: 'button:has-text("Minimize")',

    // Modals
    postWorkoutFeedbackModal: 'text=How was your workout?',
    wellnessCheckinModal: 'text=Daily Wellness',
    submitButton: 'button:has-text("Submit"), button:has-text("Save")',
    skipButton: 'button:has-text("Skip"), button:has-text("Later")',
  };

  constructor(page: Page, baseURL?: string) {
    super(page, baseURL);
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateToWorkout(): Promise<void> {
    await this.goto('/workout');
  }

  // ============================================
  // Start Workout
  // ============================================

  /**
   * Start a Quick Start workout
   */
  async startQuickWorkout(): Promise<void> {
    this.logStep(1, 'Starting Quick Start workout...');
    await this.click(this.selectors.quickStartButton);
    await this.wait(2000);
    this.logSuccess('Quick Start workout started');
  }

  /**
   * Start workout from a specific template
   */
  async startFromTemplate(templateName: string): Promise<void> {
    this.logStep(1, `Starting workout from template: ${templateName}...`);

    // Click "Start from Template" button
    await this.click(this.selectors.startFromTemplateButton);
    await this.wait(1000);

    // Find and click the template
    const templateButton = this.page.locator(`text=${templateName}`).first();
    const templateVisible = await templateButton.isVisible().catch(() => false);

    if (!templateVisible) {
      throw new Error(`Template "${templateName}" not found`);
    }

    await templateButton.click();
    await this.wait(2000);
    this.logSuccess(`Workout started from template: ${templateName}`);
  }

  /**
   * Start workout from active program
   * Note: Requires program to be activated first
   */
  async startFromProgram(): Promise<void> {
    this.logStep(1, 'Starting workout from active program...');

    // Navigate to dashboard
    await this.goto('/');
    await this.wait(2000);

    // Click play button in bottom nav
    const playButton = this.page.locator('button[aria-label*="Start"], button[aria-label*="Continue"]').first();
    const playButtonVisible = await playButton.isVisible().catch(() => false);

    if (!playButtonVisible) {
      throw new Error('Play button not found - is there an active program?');
    }

    await playButton.click();
    await this.waitForURL(/.*#\/workout.*/);
    await this.wait(2000);
    this.logSuccess('Workout started from program');
  }

  // ============================================
  // Exercise Management
  // ============================================

  /**
   * Add an exercise to the current workout
   */
  async addExercise(exerciseName: string): Promise<void> {
    this.log(`Adding exercise: ${exerciseName}`);

    // Click "Add Exercise" button
    const addButton = this.page.locator(this.selectors.addExerciseButton).first();
    await addButton.click();
    await this.wait(1000);

    // Verify modal opened
    const modalOpen = await this.isModalVisible();
    if (!modalOpen) {
      throw new Error('Exercise modal did not open');
    }

    // Find and click the exercise
    const exerciseCard = this.page.locator(`text=${exerciseName}`).first();
    const exerciseVisible = await exerciseCard.isVisible().catch(() => false);

    if (!exerciseVisible) {
      // Close modal and throw error
      await this.pressEscape();
      throw new Error(`Exercise "${exerciseName}" not found in library`);
    }

    await exerciseCard.click();
    this.logSuccess(`Clicked ${exerciseName}`);

    // CRITICAL: Wait for modal to close
    // This is where BUG-APP-001 occurs
    await this.wait(2000);

    // Verify modal closed
    const modalClosed = !(await this.isModalVisible());
    if (!modalClosed) {
      this.logWarning('Modal did not close automatically - BUG-APP-001 may be present');
      // Try to close manually
      await this.pressEscape();
      await this.wait(1000);
    }

    this.logSuccess(`Exercise "${exerciseName}" added successfully`);
  }

  /**
   * Remove an exercise by index
   */
  async removeExercise(index: number): Promise<void> {
    this.log(`Removing exercise at index ${index}...`);

    const removeButtons = this.page.locator(this.selectors.removeExerciseButton);
    const count = await removeButtons.count();

    if (index >= count) {
      throw new Error(`Cannot remove exercise ${index} - only ${count} exercises present`);
    }

    await removeButtons.nth(index).click();
    await this.wait(500);
    this.logSuccess(`Exercise ${index} removed`);
  }

  /**
   * Swap an exercise with a different one
   */
  async swapExercise(index: number, newExerciseName: string): Promise<void> {
    this.log(`Swapping exercise ${index} for ${newExerciseName}...`);

    // Click swap button
    const swapButtons = this.page.locator(this.selectors.swapExerciseButton);
    await swapButtons.nth(index).click();
    await this.wait(1000);

    // Select new exercise from modal
    const newExercise = this.page.locator(`text=${newExerciseName}`).first();
    await newExercise.click();
    await this.wait(2000);

    this.logSuccess(`Exercise swapped to ${newExerciseName}`);
  }

  // ============================================
  // Set Logging
  // ============================================

  /**
   * Log a single set for a specific exercise
   */
  async logSet(exerciseIndex: number, setIndex: number, data: SetData): Promise<void> {
    this.log(`Logging set ${setIndex + 1} for exercise ${exerciseIndex + 1}: ${data.weight}kg × ${data.reps} reps`);

    // Calculate input field indices
    // Each set has 2 inputs (weight, reps), so multiply by 2
    const setsPerExercise = 5; // Default number of sets shown
    const baseIndex = exerciseIndex * setsPerExercise * 2;
    const weightIndex = baseIndex + (setIndex * 2);
    const repsIndex = weightIndex + 1;

    // Fill weight
    const weightInput = this.page.locator(this.selectors.weightInput).nth(weightIndex);
    const weightVisible = await weightInput.isVisible().catch(() => false);

    if (!weightVisible) {
      throw new Error(`Weight input not found for exercise ${exerciseIndex}, set ${setIndex}`);
    }

    await weightInput.fill(String(data.weight));
    await this.wait(300);

    // Fill reps
    const repsInput = this.page.locator(this.selectors.repsInput).nth(repsIndex);
    await repsInput.fill(String(data.reps));
    await this.wait(300);

    // Fill RPE if provided
    if (data.rpe !== undefined) {
      const rpeSelect = this.page.locator(this.selectors.rpeSelect).nth(setIndex);
      const rpeVisible = await rpeSelect.isVisible().catch(() => false);

      if (rpeVisible) {
        await rpeSelect.selectOption(String(data.rpe));
        await this.wait(300);
      }
    }

    // Wait for state to update
    await this.wait(500);

    // Press Enter on the reps input to auto-complete the set
    // According to WorkoutLogger line 1310, pressing Enter triggers handleSetComplete
    this.log('Pressing Enter to complete set...');
    await repsInput.press('Enter');
    await this.wait(1000); // Wait for rest timer and any modals
    this.logSuccess('Set marked as complete via Enter key');

    // Check if a form guide/video modal appeared and close it
    const videoCloseButton = this.page.locator('button[aria-label="Close video"]');
    const videoModalVisible = await videoCloseButton.isVisible().catch(() => false);
    if (videoModalVisible) {
      this.log('Form guide/video modal appeared, closing it...');
      await videoCloseButton.click();
      await this.wait(1000);
    }

    this.logSuccess(`Set logged: ${data.weight}kg × ${data.reps} reps${data.rpe ? ` @ RPE ${data.rpe}` : ''}`);
  }

  /**
   * Log multiple sets for an exercise
   */
  async logMultipleSets(exerciseIndex: number, sets: SetData[]): Promise<void> {
    this.log(`Logging ${sets.length} sets for exercise ${exerciseIndex + 1}...`);

    for (let i = 0; i < sets.length; i++) {
      await this.logSet(exerciseIndex, i, sets[i]);
    }

    this.logSuccess(`All ${sets.length} sets logged`);
  }

  /**
   * Quick log standard sets (same weight/reps for all sets)
   */
  async logStandardSets(exerciseIndex: number, weight: number, reps: number, numSets: number = 3): Promise<void> {
    const sets: SetData[] = Array(numSets).fill({ weight, reps });
    await this.logMultipleSets(exerciseIndex, sets);
  }

  /**
   * Add a new set to an exercise
   */
  async addSet(exerciseIndex: number): Promise<void> {
    const addSetButtons = this.page.locator(this.selectors.addSetButton);
    await addSetButtons.nth(exerciseIndex).click();
    await this.wait(500);
    this.logSuccess('Set added');
  }

  // ============================================
  // Rest Timer
  // ============================================

  /**
   * Wait for rest timer to appear
   */
  async waitForRestTimer(): Promise<void> {
    await this.waitForSelector(this.selectors.restTimerOverlay, 10000);
    this.logSuccess('Rest timer appeared');
  }

  /**
   * Check if rest timer is active
   */
  async isRestTimerActive(): Promise<boolean> {
    return await this.isVisible(this.selectors.restTimerOverlay);
  }

  /**
   * Get remaining rest time in seconds
   */
  async getRestTimeRemaining(): Promise<number> {
    const countdown = await this.getText(this.selectors.restTimerCountdown);
    // Parse format like "2:30" to seconds
    const [mins, secs] = countdown.split(':').map(Number);
    return (mins * 60) + secs;
  }

  /**
   * Skip the rest timer
   */
  async skipRestTimer(): Promise<void> {
    this.log('Skipping rest timer...');
    await this.click(this.selectors.restTimerSkip);
    await this.wait(500);
    this.logSuccess('Rest timer skipped');
  }

  /**
   * Add 30 seconds to rest timer
   */
  async addRestTime(seconds: number = 30): Promise<void> {
    this.log(`Adding ${seconds} seconds to rest timer...`);
    await this.click(this.selectors.restTimerAdd30);
    await this.wait(500);
    this.logSuccess(`Added ${seconds}s to rest timer`);
  }

  /**
   * Subtract 15 seconds from rest timer
   */
  async subtractRestTime(seconds: number = 15): Promise<void> {
    this.log(`Subtracting ${seconds} seconds from rest timer...`);
    await this.click(this.selectors.restTimerSubtract15);
    await this.wait(500);
    this.logSuccess(`Subtracted ${seconds}s from rest timer`);
  }

  /**
   * Minimize rest timer overlay
   */
  async minimizeRestTimer(): Promise<void> {
    this.log('Minimizing rest timer...');
    await this.click(this.selectors.restTimerMinimize);
    await this.wait(500);
    this.logSuccess('Rest timer minimized');
  }

  // ============================================
  // Workout Completion
  // ============================================

  /**
   * Complete the current workout
   */
  async completeWorkout(): Promise<void> {
    this.logStep(1, 'Completing workout...');
    await this.click(this.selectors.completeWorkoutButton);
    await this.wait(2000);
    this.logSuccess('Workout completed');
  }

  /**
   * Submit post-workout feedback
   */
  async submitPostWorkoutFeedback(energy?: number): Promise<void> {
    const feedbackVisible = await this.isVisible(this.selectors.postWorkoutFeedbackModal);

    if (!feedbackVisible) {
      this.log('No post-workout feedback modal - skipping');
      return;
    }

    this.log('Submitting post-workout feedback...');

    // Select energy level if provided
    if (energy !== undefined) {
      const energyButton = this.page.locator(`button:has-text("${energy}")`).first();
      await energyButton.click();
      await this.wait(500);
    }

    // Submit
    await this.click(this.selectors.submitButton);
    await this.wait(1000);
    this.logSuccess('Post-workout feedback submitted');
  }

  /**
   * Skip post-workout modals (feedback, wellness check)
   */
  async skipPostWorkoutModals(): Promise<void> {
    this.log('Skipping post-workout modals...');

    // Try to skip post-workout feedback
    const feedbackVisible = await this.isVisible(this.selectors.postWorkoutFeedbackModal);
    if (feedbackVisible) {
      await this.click(this.selectors.skipButton);
      await this.wait(1000);
    }

    // Try to skip wellness checkin
    const wellnessVisible = await this.isVisible(this.selectors.wellnessCheckinModal);
    if (wellnessVisible) {
      await this.click(this.selectors.skipButton);
      await this.wait(1000);
    }

    this.logSuccess('Post-workout modals skipped');
  }

  /**
   * Save workout as draft
   */
  async saveDraft(): Promise<void> {
    this.log('Saving workout as draft...');
    await this.click(this.selectors.saveDraftButton);
    await this.wait(1000);
    this.logSuccess('Workout saved as draft');
  }

  /**
   * Cancel the current workout
   */
  async cancelWorkout(): Promise<void> {
    this.log('Canceling workout...');
    await this.click(this.selectors.cancelWorkoutButton);
    await this.wait(1000);
    this.logSuccess('Workout canceled');
  }

  // ============================================
  // Assertions
  // ============================================

  /**
   * Assert that an exercise was added to the workout
   */
  async assertExerciseAdded(exerciseName: string): Promise<void> {
    // Exercise names use their original case in the DOM (uppercase is via CSS text-transform)
    // Look for the exercise within the workout logs, not in the hidden modal
    const exerciseHeader = this.page.locator('h3.volt-header').filter({ hasText: exerciseName });
    await exerciseHeader.waitFor({ state: 'visible', timeout: 5000 });
    const exerciseVisible = await exerciseHeader.isVisible();
    expect(exerciseVisible, `Exercise "${exerciseName}" should be in workout`).toBe(true);
    this.logSuccess(`Verified: ${exerciseName} is in workout`);
  }

  /**
   * Assert that a set was logged correctly
   */
  async assertSetLogged(exerciseIndex: number, setIndex: number, expectedWeight: number, expectedReps: number): Promise<void> {
    const setsPerExercise = 5;
    const baseIndex = exerciseIndex * setsPerExercise * 2;
    const weightIndex = baseIndex + (setIndex * 2);
    const repsIndex = weightIndex + 1;

    const actualWeight = await this.getValue(this.selectors.weightInput + `:nth(${weightIndex})`);
    const actualReps = await this.getValue(this.selectors.repsInput + `:nth(${repsIndex})`);

    expect(Number(actualWeight), `Weight should be ${expectedWeight}kg`).toBe(expectedWeight);
    expect(Number(actualReps), `Reps should be ${expectedReps}`).toBe(expectedReps);
    this.logSuccess(`Verified: Set ${setIndex + 1} logged correctly (${expectedWeight}kg × ${expectedReps})`);
  }

  /**
   * Assert that rest timer is active
   */
  async assertRestTimerActive(): Promise<void> {
    const timerActive = await this.isRestTimerActive();
    expect(timerActive, 'Rest timer should be active').toBe(true);
    this.logSuccess('Verified: Rest timer is active');
  }

  /**
   * Assert that rest timer is not active
   */
  async assertRestTimerInactive(): Promise<void> {
    const timerActive = await this.isRestTimerActive();
    expect(timerActive, 'Rest timer should not be active').toBe(false);
    this.logSuccess('Verified: Rest timer is inactive');
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Check if exercise modal is visible
   */
  private async isModalVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.exerciseModal);
  }

  /**
   * Get number of exercises in current workout
   */
  async getExerciseCount(): Promise<number> {
    return await this.count(this.selectors.exerciseLog);
  }

  /**
   * Get total number of sets across all exercises
   */
  async getTotalSetCount(): Promise<number> {
    const inputCount = await this.count(this.selectors.weightInput);
    return Math.floor(inputCount / 2); // Divide by 2 because each set has weight + reps inputs
  }
}
