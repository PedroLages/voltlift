/**
 * Haptic Feedback Service
 * Provides tactile feedback for user interactions using the Vibration API
 */

export type HapticPattern =
  | 'light'      // Quick tap - button press, toggle
  | 'medium'     // Confirmation - set complete, save
  | 'heavy'      // Emphasis - PR, important action
  | 'success'    // Celebration - workout complete, goal achieved
  | 'warning'    // Alert - streak at risk, form warning
  | 'error'      // Error - failed action, validation error
  | 'selection'  // Selection change - picker, dropdown
  | 'impact';    // Physical impact - weight change, rest timer end

// Vibration patterns in milliseconds
const PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10, 50, 30],
  warning: [50, 30, 50],
  error: [100, 50, 100],
  selection: [5],
  impact: [15, 10, 15],
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticsSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with a predefined pattern
 */
export function haptic(pattern: HapticPattern = 'light'): void {
  if (!isHapticsSupported()) return;

  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch (e) {
    // Silently fail - haptics are non-critical
  }
}

/**
 * Trigger custom haptic pattern
 */
export function customHaptic(pattern: number[]): void {
  if (!isHapticsSupported()) return;

  try {
    navigator.vibrate(pattern);
  } catch (e) {
    // Silently fail
  }
}

/**
 * Stop any ongoing vibration
 */
export function stopHaptic(): void {
  if (!isHapticsSupported()) return;

  try {
    navigator.vibrate(0);
  } catch (e) {
    // Silently fail
  }
}

// ============================================================================
// Convenience functions for common interactions
// ============================================================================

/** Button press feedback */
export const hapticTap = () => haptic('light');

/** Toggle switch feedback */
export const hapticToggle = () => haptic('selection');

/** Set completed feedback */
export const hapticSetComplete = () => haptic('medium');

/** PR achieved feedback */
export const hapticPR = () => haptic('success');

/** Workout completed feedback */
export const hapticWorkoutComplete = () => haptic('success');

/** Rest timer ended feedback */
export const hapticRestComplete = () => haptic('impact');

/** Weight changed feedback */
export const hapticWeightChange = () => haptic('selection');

/** Warning feedback */
export const hapticWarning = () => haptic('warning');

/** Error feedback */
export const hapticError = () => haptic('error');

/** Delete action feedback */
export const hapticDelete = () => haptic('heavy');
