/**
 * Fallback Handlers
 *
 * Graceful degradation when LLM is unavailable:
 * - Template-based responses
 * - Rule-based tips
 * - Cached content
 * - Local heuristics
 */

import {
  ProgressiveOverloadResponse,
  FormGuideResponse,
  WorkoutSummaryResponse,
  CoachingResponse,
  AIContext,
} from './types';
import { ProgressiveSuggestion } from '../progressiveOverload';
import { Exercise, MuscleGroup } from '../../types';
import { EXERCISE_LIBRARY } from '../../constants';

// =============================================================================
// Progressive Overload Fallbacks
// =============================================================================

/**
 * Generate progressive overload tip from local suggestion
 */
export function getProgressiveOverloadFallback(
  suggestion: ProgressiveSuggestion,
  exerciseName: string,
  units: 'kg' | 'lbs'
): ProgressiveOverloadResponse {
  // Build tip from local heuristics
  let tip = '';

  if (suggestion.shouldDeload) {
    tip = `Recovery focus: Use ${suggestion.weight}${units} for ${suggestion.reps[0]}-${suggestion.reps[1]} reps.`;
  } else if (suggestion.progressionRate && suggestion.progressionRate > 0) {
    tip = `Progress to ${suggestion.weight}${units} for ${suggestion.reps[0]}-${suggestion.reps[1]} reps (+${suggestion.progressionRate.toFixed(1)}%).`;
  } else {
    tip = `Maintain ${suggestion.weight}${units} x ${suggestion.reps[0]}-${suggestion.reps[1]} reps. Focus on form.`;
  }

  return {
    tip,
    suggestedWeight: suggestion.weight,
    suggestedReps: suggestion.reps,
    reasoning: suggestion.reasoning,
    confidence: suggestion.confidence,
  };
}

// Rule-based tips by scenario
const PROGRESSIVE_OVERLOAD_RULES = {
  lowRPE: [
    'You left reps in the tank. Add 2.5-5{units} next set.',
    'Solid performance with energy to spare. Time to push harder.',
    'Easy work! Increase weight to stay in the growth zone.',
  ],
  highRPE: [
    'Great intensity. Maintain this weight next session.',
    'You pushed hard. Keep the weight and aim for same reps.',
    'Solid grind. Recovery is key before increasing.',
  ],
  lowRecovery: [
    'Fatigue detected. Reduce weight by 10-15% today.',
    'Recovery matters. Light day keeps progress long-term.',
    'Listen to your body. Deload and dominate next session.',
  ],
  plateau: [
    'Time for a variation. Try different grip or tempo.',
    'Plateau breaker: Drop sets or pause reps work well.',
    'Change the stimulus. New exercise variation recommended.',
  ],
  newExercise: [
    'Start light. Master form before adding weight.',
    'First time? Focus on 8-12 reps with perfect technique.',
    'Learn the movement. Weight comes after competence.',
  ],
};

/**
 * Get rule-based tip when no specific suggestion available
 */
export function getRuleBasedTip(params: {
  hasHistory: boolean;
  rpe?: number;
  recoveryScore: number;
  weeksOnExercise?: number;
  units: 'kg' | 'lbs';
}): string {
  const { hasHistory, rpe, recoveryScore, weeksOnExercise, units } = params;

  let category: keyof typeof PROGRESSIVE_OVERLOAD_RULES;

  if (!hasHistory) {
    category = 'newExercise';
  } else if (recoveryScore < 5) {
    category = 'lowRecovery';
  } else if (weeksOnExercise && weeksOnExercise > 8) {
    category = 'plateau';
  } else if (rpe && rpe < 7) {
    category = 'lowRPE';
  } else {
    category = 'highRPE';
  }

  const tips = PROGRESSIVE_OVERLOAD_RULES[category];
  const tip = tips[Math.floor(Math.random() * tips.length)];

  return tip.replace('{units}', units);
}

// =============================================================================
// Form Guide Fallbacks
// =============================================================================

/**
 * Generate form guide from exercise data
 */
export function getFormGuideFallback(exercise: Exercise): FormGuideResponse {
  return {
    summary: `${exercise.name} targets ${exercise.muscleGroup}${
      exercise.secondaryMuscles?.length
        ? ` with secondary engagement of ${exercise.secondaryMuscles.join(', ')}`
        : ''
    }. ${exercise.difficulty} difficulty using ${exercise.equipment}.`,
    keyPoints: exercise.formGuide || [
      'Maintain proper posture throughout',
      'Control the weight on both phases',
      'Breathe steadily - exhale on exertion',
    ],
    commonMistakes: exercise.commonMistakes || [
      'Using momentum instead of muscle control',
      'Incomplete range of motion',
      'Improper breathing pattern',
    ],
    personalizedTip: exercise.tips?.[0],
  };
}

// =============================================================================
// Workout Summary Fallbacks
// =============================================================================

/**
 * Generate workout summary from stats
 */
export function getWorkoutSummaryFallback(params: {
  workoutName: string;
  duration: number;
  exerciseCount: number;
  totalVolume: number;
  prsAchieved: string[];
  previousVolume?: number;
  units: 'kg' | 'lbs';
}): WorkoutSummaryResponse {
  const {
    workoutName,
    duration,
    exerciseCount,
    totalVolume,
    prsAchieved,
    previousVolume,
    units,
  } = params;

  const highlights: string[] = [
    `Completed ${exerciseCount} exercises in ${duration} minutes`,
    `Total volume: ${totalVolume.toLocaleString()}${units}`,
  ];

  if (prsAchieved.length > 0) {
    highlights.push(`Set ${prsAchieved.length} new PR(s)`);
  }

  if (previousVolume && totalVolume > previousVolume) {
    const increase = ((totalVolume - previousVolume) / previousVolume) * 100;
    highlights.push(`Volume up ${increase.toFixed(1)}% vs last week`);
  }

  // Generate focus for next session
  let nextFocus = 'Continue progressive overload on main lifts';
  if (duration < 30) {
    nextFocus = 'Consider adding volume - workout was short';
  } else if (duration > 90) {
    nextFocus = 'Efficiency focus - try supersets to reduce time';
  }

  return {
    summary: `Strong ${workoutName} session! You trained for ${duration} minutes and moved ${totalVolume.toLocaleString()}${units}.${
      prsAchieved.length > 0 ? ` Personal records on ${prsAchieved.join(', ')}!` : ''
    }`,
    highlights,
    prsAchieved: prsAchieved.length > 0 ? prsAchieved : ['Keep pushing - PRs are coming!'],
    areasToImprove: previousVolume && totalVolume < previousVolume
      ? ['Volume decreased - ensure progressive overload']
      : ['Great consistency - maintain this trajectory'],
    nextSessionFocus: nextFocus,
  };
}

// =============================================================================
// Motivation Fallbacks
// =============================================================================

const MOTIVATION_TEMPLATES = [
  'Your only limit is YOU. Crush it.',
  'Champions train. Everyone else makes excuses.',
  'One more rep. One step closer.',
  'The iron doesn\'t lie. Let\'s go.',
  'Pain is temporary. Gains are forever.',
  'Be stronger than your excuses.',
  'Today\'s workout = tomorrow\'s results.',
  'No shortcuts. Just hard work.',
  'Embrace the grind.',
  'Earn your rest.',
];

const STREAK_MOTIVATION = {
  short: [
    'Building momentum! Day {streak}.',
    'Keep the streak alive.',
    'Every day counts.',
  ],
  medium: [
    '{streak} days strong! Unstoppable.',
    'Consistency is your superpower.',
    'The habit is forming.',
  ],
  long: [
    '{streak} DAYS. You\'re a machine.',
    'Elite consistency. {streak} and counting.',
    'Iron discipline. {streak} days.',
  ],
};

/**
 * Get motivational quote fallback
 */
export function getMotivationFallback(
  streak?: number,
  goal?: string
): string {
  if (streak && streak > 0) {
    let category: keyof typeof STREAK_MOTIVATION;
    if (streak < 7) category = 'short';
    else if (streak < 30) category = 'medium';
    else category = 'long';

    const templates = STREAK_MOTIVATION[category];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace('{streak}', String(streak));
  }

  return MOTIVATION_TEMPLATES[Math.floor(Math.random() * MOTIVATION_TEMPLATES.length)];
}

// =============================================================================
// Coaching Response Fallbacks
// =============================================================================

/**
 * Generate coaching response from context
 */
export function getCoachingFallback(
  context: AIContext,
  query: string
): CoachingResponse {
  const { user, workout, history, biomarkers } = context;

  // Analyze query intent
  const queryLower = query.toLowerCase();
  let message = '';
  const suggestions: string[] = [];
  let warnings: string[] | undefined;

  // Recovery-related
  if (
    queryLower.includes('tired') ||
    queryLower.includes('fatigue') ||
    queryLower.includes('recovery')
  ) {
    if (biomarkers && biomarkers.recoveryScore < 5) {
      message = `Your recovery score is low (${biomarkers.recoveryScore}/10). Consider a lighter session today.`;
      suggestions.push('Reduce working sets by 30%');
      suggestions.push('Focus on technique over intensity');
      warnings = ['High fatigue detected - monitor for overtraining'];
    } else {
      message = 'Recovery looks adequate. You can train normally.';
      suggestions.push('Stay hydrated and maintain protein intake');
    }
  }

  // Volume-related
  else if (queryLower.includes('volume') || queryLower.includes('sets')) {
    const totalWorkouts = history.totalWorkouts;
    if (totalWorkouts < 10) {
      message = 'Focus on learning movements before adding volume.';
      suggestions.push('Start with 3-4 sets per exercise');
      suggestions.push('Prioritize form over volume');
    } else {
      message = 'Progressive volume increase is key for continued gains.';
      suggestions.push('Add 1-2 sets per muscle group weekly');
      suggestions.push('Monitor recovery between sessions');
    }
  }

  // Progress-related
  else if (
    queryLower.includes('progress') ||
    queryLower.includes('stronger') ||
    queryLower.includes('plateau')
  ) {
    message = 'Consistent progress requires patience and strategy.';
    suggestions.push('Track all workouts to identify trends');
    suggestions.push('Ensure caloric surplus for muscle gain');
    suggestions.push('Sleep 7-9 hours for optimal recovery');
    if (history.streakDays > 14) {
      suggestions.push('Consider a deload week');
    }
  }

  // Default response
  else {
    message = `Hey ${user.name}! Keep pushing toward your ${user.goal.type} goal.`;
    suggestions.push('Consistency beats intensity');
    suggestions.push('Focus on progressive overload');
    suggestions.push('Recovery is when gains happen');
  }

  return {
    message,
    suggestions,
    motivation: getMotivationFallback(history.streakDays, user.goal.type),
    warningsOrCautions: warnings,
  };
}

// =============================================================================
// Exercise Recommendation Fallbacks
// =============================================================================

/**
 * Get exercise recommendations based on muscle group and equipment
 */
export function getExerciseRecommendationFallback(params: {
  muscleGroup: MuscleGroup;
  equipment: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  excludeIds?: string[];
  limit?: number;
}): Exercise[] {
  const { muscleGroup, equipment, difficulty, excludeIds = [], limit = 3 } = params;

  return EXERCISE_LIBRARY
    .filter((e) => {
      // Match muscle group
      if (e.muscleGroup !== muscleGroup) return false;

      // Match equipment
      if (equipment.length > 0 && !equipment.includes(e.equipment)) return false;

      // Match difficulty
      if (difficulty === 'Beginner' && e.difficulty === 'Advanced') return false;

      // Exclude already used
      if (excludeIds.includes(e.id)) return false;

      return true;
    })
    .slice(0, limit);
}

// =============================================================================
// Error Message Fallbacks
// =============================================================================

export const ERROR_MESSAGES = {
  apiUnavailable: 'AI features temporarily unavailable. Using smart defaults.',
  rateLimited: 'Too many requests. Please try again in a moment.',
  timeout: 'Request took too long. Using cached response.',
  budgetExceeded: 'Daily AI limit reached. Using local recommendations.',
  offline: 'You\'re offline. All features work locally.',
  unknown: 'Something went wrong. Using backup recommendations.',
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: string): string {
  if (error.includes('API key')) return ERROR_MESSAGES.apiUnavailable;
  if (error.includes('rate') || error.includes('429')) return ERROR_MESSAGES.rateLimited;
  if (error.includes('timeout')) return ERROR_MESSAGES.timeout;
  if (error.includes('budget')) return ERROR_MESSAGES.budgetExceeded;
  if (error.includes('offline') || error.includes('network')) return ERROR_MESSAGES.offline;
  return ERROR_MESSAGES.unknown;
}
