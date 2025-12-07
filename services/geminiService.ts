/**
 * Gemini Service - Legacy Compatibility Layer
 *
 * This file maintains backward compatibility with existing code.
 * New code should use the AI service directly: import { ... } from './ai'
 *
 * Migration path:
 * - getProgressiveOverloadTip -> getProgressiveOverloadSuggestion
 * - getWorkoutMotivation -> getMotivation
 * - generateExerciseVisual -> generateExerciseVisual (from ai service)
 */

import { ExerciseLog, UserSettings, WorkoutSession, DailyLog } from '../types';
import {
  initializeAI,
  getProgressiveOverloadSuggestion,
  getMotivation,
  generateExerciseVisual as aiGenerateExerciseVisual,
  getAIStatus,
} from './ai';

// Initialize AI services on module load
initializeAI().catch(console.error);

/**
 * @deprecated Use getProgressiveOverloadSuggestion from './ai' instead
 */
export const getProgressiveOverloadTip = async (
  exerciseId: string,
  history: ExerciseLog[],
  userSettings: UserSettings
): Promise<string | null> => {
  // Convert legacy parameters to new format
  // Note: This is a simplified conversion - full history should be passed for best results
  const mockHistory: WorkoutSession[] = [{
    id: 'legacy-session',
    name: 'Previous Workout',
    startTime: Date.now() - 86400000,
    endTime: Date.now() - 86400000 + 3600000,
    status: 'completed',
    logs: history.map((log, i) => ({
      ...log,
      id: log.id || `legacy-log-${i}`,
    })),
  }];

  const result = await getProgressiveOverloadSuggestion({
    exerciseId,
    history: mockHistory,
    settings: userSettings,
    dailyLogs: {},
    enhanceWithLLM: true,
  });

  if (result.success && result.data) {
    return result.data.tip;
  }

  // Fallback
  return `Increase weight by 2.5${userSettings.units} if you hit all reps last time.`;
};

/**
 * @deprecated Use getMotivation from './ai' instead
 */
export const getWorkoutMotivation = async (name: string): Promise<string> => {
  const result = await getMotivation({
    settings: {
      name,
      units: 'lbs',
      goal: { type: 'Build Muscle', targetPerWeek: 4 },
      experienceLevel: 'Intermediate',
      availableEquipment: [],
      onboardingCompleted: true,
      personalRecords: {},
      defaultRestTimer: 90,
      barWeight: 45,
    },
    context: 'Starting workout',
  });

  return result.data || "Let's crush this workout!";
};

/**
 * @deprecated Use generateExerciseVisual from './ai' instead
 */
export const generateExerciseVisual = async (
  exerciseName: string,
  size: '1K' | '2K' | '4K' = '1K'
): Promise<string | null> => {
  // Find exercise ID from name
  const { EXERCISE_LIBRARY } = await import('../constants');
  const exercise = EXERCISE_LIBRARY.find(
    (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
  );

  if (!exercise) {
    console.warn(`Exercise not found: ${exerciseName}`);
    return null;
  }

  const result = await aiGenerateExerciseVisual({
    exerciseId: exercise.id,
    size,
  });

  return result.success ? result.data || null : null;
};

/**
 * Check if AI services are available
 */
export const isAIAvailable = (): boolean => {
  const status = getAIStatus();
  return status.llmAvailable;
};

/**
 * Get AI usage statistics
 */
export const getAIUsageStats = () => {
  const status = getAIStatus();
  return status.usageStats;
};
