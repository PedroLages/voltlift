/**
 * useSuggestions Hook
 *
 * React hook for fetching AI suggestions for workout exercises
 * Integrates with Zustand store for workout history and user settings
 */

import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getBatchSuggestions, ProgressiveSuggestion } from '../services/suggestionService';

/**
 * Get AI suggestions for all exercises in the current workout
 *
 * @returns Map of exerciseId -> suggestion (null if no suggestion available)
 *
 * @example
 * ```tsx
 * function WorkoutLogger() {
 *   const suggestions = useSuggestions();
 *   const suggestion = suggestions.get('barbell-squat');
 *
 *   if (suggestion) {
 *     return <ProgressionSuggestionBadge suggestion={suggestion} />;
 *   }
 * }
 * ```
 */
export function useSuggestions(): Map<string, ProgressiveSuggestion | null> {
  const activeWorkout = useStore(state => state.activeWorkout);
  const history = useStore(state => state.history);
  const settings = useStore(state => state.settings);

  // Get today's daily log (biometric data for recovery calculation)
  const todayDate = new Date().toISOString().split('T')[0];
  const dailyLog = useStore(state =>
    state.dailyLogs.find(log => log.date === todayDate)
  );

  const suggestions = useMemo(() => {
    // No active workout -> no suggestions
    if (!activeWorkout) {
      return new Map<string, ProgressiveSuggestion | null>();
    }

    // Get all unique exercise IDs from current workout
    const exerciseIds = activeWorkout.logs.map(log => log.exerciseId);

    // Generate batch suggestions
    return getBatchSuggestions(exerciseIds, {
      dailyLog,
      history,
      currentSessionStart: activeWorkout.startTime,
      experienceLevel: settings.experienceLevel || 'Intermediate',
      suggestionHistory: settings.suggestionHistory,
    });
  }, [
    activeWorkout,
    dailyLog,
    history,
    settings.experienceLevel,
    settings.suggestionHistory,
  ]);

  return suggestions;
}

/**
 * Get suggestion for a specific exercise
 *
 * Convenience hook when you only need one suggestion
 *
 * @param exerciseId - The exercise to get suggestion for
 * @returns Suggestion or null
 *
 * @example
 * ```tsx
 * function ExerciseCard({ exerciseId }) {
 *   const suggestion = useExerciseSuggestion(exerciseId);
 *   // ...
 * }
 * ```
 */
export function useExerciseSuggestion(exerciseId: string): ProgressiveSuggestion | null {
  const suggestions = useSuggestions();
  return suggestions.get(exerciseId) ?? null;
}
