/**
 * Suggestion Service - Clean API for AI-Powered Workout Suggestions
 *
 * Wraps the existing progressiveOverload.ts service with a component-friendly API.
 * This service provides:
 * - Simple function calls for getting exercise suggestions
 * - Batch operations for entire workouts
 * - Suggestion acceptance tracking
 */

import {
  getSuggestion as getProgressiveSuggestion,
  ProgressiveSuggestion,
  Confidence,
} from './progressiveOverload';
import {
  ExerciseLog,
  DailyLog,
  WorkoutSession,
  SuggestionFeedback,
  ExperienceLevel,
} from '../types';

// Re-export types for convenience
export type { ProgressiveSuggestion, Confidence };

export interface SuggestionContext {
  exerciseId: string;
  lastWorkout?: ExerciseLog;
  dailyLog?: DailyLog;
  history: WorkoutSession[];
  currentSessionStart: number;
  experienceLevel?: ExperienceLevel;
  suggestionHistory?: SuggestionFeedback[];
}

/**
 * Get AI suggestion for a single exercise
 *
 * @param context - All data needed to generate suggestion
 * @returns ProgressiveSuggestion or null if insufficient data
 *
 * @example
 * ```tsx
 * const suggestion = getExerciseSuggestion({
 *   exerciseId: 'barbell-squat',
 *   lastWorkout: previousSquatLog,
 *   dailyLog: todaysBiometrics,
 *   history: completedWorkouts,
 *   currentSessionStart: Date.now(),
 *   experienceLevel: 'Intermediate'
 * });
 *
 * if (suggestion) {
 *   console.log(`Suggested: ${suggestion.weight}kg × ${suggestion.reps[0]}-${suggestion.reps[1]} reps`);
 * }
 * ```
 */
export function getExerciseSuggestion(
  context: SuggestionContext
): ProgressiveSuggestion | null {
  return getProgressiveSuggestion(
    context.exerciseId,
    context.lastWorkout,
    context.dailyLog,
    context.history,
    context.currentSessionStart,
    context.experienceLevel || 'Intermediate',
    context.suggestionHistory
  );
}

/**
 * Get suggestions for all exercises in a workout session
 *
 * @param exerciseIds - Array of exercise IDs to get suggestions for
 * @param context - Shared context (history, daily log, etc.)
 * @returns Map of exerciseId -> suggestion (null if no suggestion available)
 *
 * @example
 * ```tsx
 * const suggestions = getBatchSuggestions(
 *   ['barbell-squat', 'bench-press', 'deadlift'],
 *   {
 *     dailyLog: todaysBiometrics,
 *     history: completedWorkouts,
 *     currentSessionStart: Date.now(),
 *     experienceLevel: 'Intermediate'
 *   }
 * );
 *
 * suggestions.forEach((suggestion, exerciseId) => {
 *   if (suggestion) {
 *     console.log(`${exerciseId}: ${suggestion.weight}kg`);
 *   }
 * });
 * ```
 */
export function getBatchSuggestions(
  exerciseIds: string[],
  context: Omit<SuggestionContext, 'exerciseId' | 'lastWorkout'>
): Map<string, ProgressiveSuggestion | null> {
  const suggestions = new Map<string, ProgressiveSuggestion | null>();

  exerciseIds.forEach(exerciseId => {
    // Find last workout for this exercise from history
    const lastSession = context.history
      .filter(h => h.status === 'completed')
      .find(h => h.logs.some(l => l.exerciseId === exerciseId));

    const lastWorkout = lastSession?.logs.find(l => l.exerciseId === exerciseId);

    const suggestion = getExerciseSuggestion({
      exerciseId,
      lastWorkout,
      ...context,
    });

    suggestions.set(exerciseId, suggestion);
  });

  return suggestions;
}

/**
 * Create suggestion feedback entry for tracking acceptance
 *
 * Helper function to create properly formatted feedback when user accepts/overrides suggestion.
 *
 * @param exerciseId - Exercise ID
 * @param suggestion - The AI suggestion that was shown
 * @param actualWeight - Weight user actually used
 * @param actualReps - Reps user actually performed
 * @returns SuggestionFeedback object ready to store
 *
 * @example
 * ```tsx
 * const feedback = createSuggestionFeedback(
 *   'barbell-squat',
 *   suggestion,
 *   185, // user lifted 185kg
 *   8    // user did 8 reps
 * );
 *
 * // Store feedback in Zustand
 * addSuggestionFeedback(feedback);
 * ```
 */
export function createSuggestionFeedback(
  exerciseId: string,
  suggestion: ProgressiveSuggestion,
  actualWeight: number,
  actualReps: number
): SuggestionFeedback {
  return {
    exerciseId,
    suggestedWeight: suggestion.weight,
    actualWeight,
    suggestedReps: suggestion.reps,
    actualReps,
    accepted: Math.abs(actualWeight - suggestion.weight) < 1, // Within 1kg/lb tolerance
    timestamp: Date.now(),
    confidence: suggestion.confidence,
  };
}

/**
 * Format suggestion for display in UI
 *
 * Helper to create human-readable suggestion text
 *
 * @param suggestion - The suggestion to format
 * @param units - 'kg' or 'lbs'
 * @returns Formatted string like "185 lbs × 8-10 reps"
 */
export function formatSuggestion(
  suggestion: ProgressiveSuggestion,
  units: 'kg' | 'lbs'
): string {
  const [minReps, maxReps] = suggestion.reps;
  const repsText = minReps === maxReps ? `${minReps} reps` : `${minReps}-${maxReps} reps`;
  return `${suggestion.weight} ${units} × ${repsText}`;
}

/**
 * Get confidence color for UI styling
 *
 * @param confidence - Confidence level
 * @returns Hex color code
 */
export function getConfidenceColor(confidence: Confidence): string {
  switch (confidence) {
    case 'high':
      return '#22c55e'; // green-500
    case 'medium':
      return '#eab308'; // yellow-500
    case 'low':
      return '#ef4444'; // red-500
  }
}

/**
 * Check if suggestion should trigger a warning
 *
 * @param suggestion - The suggestion to check
 * @returns True if user should be warned (deload recommended, low confidence, etc.)
 */
export function shouldWarnUser(suggestion: ProgressiveSuggestion): boolean {
  return (
    suggestion.shouldDeload === true ||
    suggestion.confidence === 'low' ||
    suggestion.recoveryScore < 5
  );
}
