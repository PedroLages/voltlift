/**
 * Progressive Overload Service - Offline-First AI Coach
 *
 * Research-backed heuristics for intelligent weight/rep progression.
 * Based on competitive analysis of Fitbod, Alpha Progression, Dr. Muscle.
 *
 * Key Principles:
 * - 100% offline, formula-based (no ML required)
 * - Sleep is primary recovery indicator (7-11% strength impact)
 * - RPE-based progression (experience-dependent accuracy)
 * - Volume tracking per muscle group (MEV/MAV/MRV framework)
 * - Conservative defaults to prevent injury
 * - Phase 2: Personalized learning from user behavior
 */

import { SetLog, ExerciseLog, DailyLog, WorkoutSession, MuscleGroup, SuggestionFeedback } from '../types';
import { EXERCISE_LIBRARY } from '../constants';

export type Confidence = 'high' | 'medium' | 'low';

export interface ProgressiveSuggestion {
  weight: number;
  reps: [number, number]; // Target range (e.g., [6, 8])
  reasoning: string;
  confidence: Confidence;
  recoveryScore: number; // 0-10 scale
  shouldDeload?: boolean;

  // NEW: Explainability fields (Phase 1 AI Improvements)
  estimated1RM?: number;
  currentIntensity?: number; // % of 1RM
  progressionRate?: number; // % increase
  mathExplanation?: string; // "75% of 120kg 1RM = 90kg"
}

/**
 * Estimate 1RM using validated formulas
 *
 * Based on research:
 * - Brzycki: Most accurate for 1-5 reps (more conservative)
 * - Epley: Accurate for 2-10 reps (more aggressive)
 *
 * Research sources:
 * - Brzycki formula has lowest error for low reps (<5)
 * - Epley and Brzycki converge at 10 reps
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;

  // Brzycki formula (most accurate for <5 reps)
  // Formula: weight * (36 / (37 - reps))
  if (reps <= 5) {
    return Math.round(weight * (36 / (37 - reps)));
  }

  // Epley formula (accurate for 2-10 reps)
  // Formula: weight * (1 + reps/30)
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Phase 2 AI: Adjust suggestion bias based on user acceptance patterns
 *
 * Analyzes recent suggestions for an exercise to learn user preferences.
 * If user consistently lifts heavier than suggested, increase bias.
 * If user consistently lifts lighter, decrease bias.
 *
 * @param exerciseId - The exercise to analyze
 * @param suggestionHistory - Recent suggestion feedback
 * @returns Bias multiplier (1.0 = neutral, >1.0 = user lifts heavier, <1.0 = lighter)
 */
export function adjustSuggestionBias(
  exerciseId: string,
  suggestionHistory: SuggestionFeedback[] | undefined
): number {
  if (!suggestionHistory || suggestionHistory.length === 0) {
    return 1.0; // Neutral bias - no data yet
  }

  // Filter to this exercise only, get last 10 suggestions
  const exerciseFeedback = suggestionHistory
    .filter(f => f.exerciseId === exerciseId)
    .slice(-10);

  if (exerciseFeedback.length < 3) {
    return 1.0; // Need at least 3 data points
  }

  // Calculate average weight deviation
  let totalDeviation = 0;
  let validCount = 0;

  exerciseFeedback.forEach(feedback => {
    if (feedback.suggestedWeight > 0) {
      const deviation = (feedback.actualWeight - feedback.suggestedWeight) / feedback.suggestedWeight;
      totalDeviation += deviation;
      validCount++;
    }
  });

  if (validCount === 0) return 1.0;

  const avgDeviation = totalDeviation / validCount;

  // Convert deviation to bias multiplier
  // If user lifts 10% heavier on average, bias = 1.1
  // If user lifts 5% lighter on average, bias = 0.95
  // Cap at ±15% to prevent extreme adjustments
  const bias = 1.0 + Math.max(-0.15, Math.min(0.15, avgDeviation));

  return Math.round(bias * 100) / 100; // Round to 2 decimals
}

/**
 * Phase 2 AI: Get progression rate based on training age
 *
 * Adjusts progression rates based on user experience level:
 * - Beginner: Faster progression (5-7.5%) - linear gains phase
 * - Intermediate: Moderate progression (2.5-4%) - standard periodization
 * - Advanced: Slower progression (1.25-2.5%) - precise increments
 *
 * Also factors in recent success rate to auto-regulate.
 *
 * @param experienceLevel - User's training age
 * @param suggestionHistory - Recent suggestion feedback for success rate
 * @returns Base progression rate as decimal (0.025 = 2.5%)
 */
export function getProgressionRate(
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced',
  suggestionHistory: SuggestionFeedback[] | undefined
): number {
  // Base rates by experience level (research-backed)
  const baseRates = {
    'Beginner': 0.05,      // 5% - beginners can progress faster
    'Intermediate': 0.025, // 2.5% - standard linear progression
    'Advanced': 0.0125     // 1.25% - slower, more precise
  };

  let baseRate = baseRates[experienceLevel];

  // Auto-regulate based on recent success
  if (suggestionHistory && suggestionHistory.length >= 5) {
    const recent = suggestionHistory.slice(-5);
    const successRate = recent.filter(f => f.accepted).length / recent.length;

    // If user is successfully accepting most suggestions (>80%), can be more aggressive
    if (successRate >= 0.8) {
      baseRate *= 1.2; // Increase by 20%
    }
    // If user is rejecting most suggestions (<40%), be more conservative
    else if (successRate < 0.4) {
      baseRate *= 0.8; // Decrease by 20%
    }
  }

  return baseRate;
}

/**
 * Calculate recovery score based on biomarkers
 * Primary factor: Sleep (validated by research to impact strength 7-11%)
 * Secondary: Subjective fatigue, days since last workout
 */
export function calculateRecoveryScore(
  dailyLog: DailyLog | undefined,
  daysSinceLastWorkout: number
): number {
  let score = 7; // Neutral baseline

  // Factor 1: Sleep Quality (Most Important - Research-Backed)
  if (dailyLog?.sleepHours) {
    if (dailyLog.sleepHours >= 8) score += 2; // Well rested
    else if (dailyLog.sleepHours >= 7) score += 1; // Adequate
    else if (dailyLog.sleepHours >= 6) score -= 1; // Sub-optimal
    else score -= 3; // Sleep deprived (7-11% strength reduction)
  }

  // Factor 2: Subjective Stress/Fatigue
  if (dailyLog?.stressLevel) {
    if (dailyLog.stressLevel >= 8) score -= 2; // High stress
    else if (dailyLog.stressLevel >= 6) score -= 1; // Moderate stress
  }

  // Factor 3: Recovery Time (Muscle protein synthesis peaks 24-48h)
  if (daysSinceLastWorkout >= 3) score += 1; // Extra recovery
  else if (daysSinceLastWorkout === 1) score -= 1; // Minimal recovery

  // Clamp between 0-10
  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate progressive overload suggestion for next set
 *
 * Heuristics based on:
 * - Fitbod: 27% faster gains with AI suggestions
 * - Alpha Progression: RPE-based periodization
 * - Dr. Mike Israetel: Volume landmarks (MEV/MAV/MRV)
 * - Phase 2: Personalized learning from user behavior
 */
export function getSuggestion(
  exerciseId: string,
  lastWorkout: ExerciseLog | undefined,
  dailyLog: DailyLog | undefined,
  history: WorkoutSession[],
  currentSessionStart: number,
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate',
  suggestionHistory?: SuggestionFeedback[]
): ProgressiveSuggestion {
  const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);

  // Find days since last workout of this exercise
  const lastSession = history
    .filter(h => h.status === 'completed')
    .find(h => h.logs.some(l => l.exerciseId === exerciseId));

  const daysSinceLastWorkout = lastSession
    ? Math.floor((currentSessionStart - lastSession.startTime) / (1000 * 60 * 60 * 24))
    : 7; // Default to well-rested if no history

  const recoveryScore = calculateRecoveryScore(dailyLog, daysSinceLastWorkout);

  // No previous workout data → Conservative starting point
  if (!lastWorkout || lastWorkout.sets.length === 0) {
    // ALWAYS start conservative for new exercises, regardless of difficulty
    // Users should learn form first, then add weight
    let startingWeight = 20; // Default: Empty bar or light dumbbells

    if (exercise?.difficulty === 'Beginner') {
      startingWeight = 20; // Empty bar (20kg/45lbs)
    } else if (exercise?.difficulty === 'Intermediate') {
      startingWeight = 30; // Bar + small plates
    } else {
      startingWeight = 40; // Still conservative for advanced movements
    }

    return {
      weight: startingWeight,
      reps: [8, 12],
      reasoning: `First time logging this exercise. Start light (${startingWeight}kg) to master form before adding weight.`,
      confidence: 'low',
      recoveryScore
    };
  }

  const completedSets = lastWorkout.sets.filter(s => s.completed && s.type !== 'W');

  if (completedSets.length === 0) {
    return {
      weight: 0,
      reps: [8, 12],
      reasoning: 'No completed sets found in previous workout.',
      confidence: 'low',
      recoveryScore
    };
  }

  // Use the heaviest completed set as baseline
  const topSet = completedSets.reduce((max, set) =>
    set.weight > max.weight ? set : max, completedSets[0]
  );

  const { weight, reps, rpe } = topSet;

  // Calculate estimated 1RM and current intensity
  const estimated1RM = estimate1RM(weight, reps);
  const currentIntensity = Math.round((weight / estimated1RM) * 100);

  // Phase 2: Personalized learning
  const userBias = adjustSuggestionBias(exerciseId, suggestionHistory);
  const baseProgressionRate = getProgressionRate(experienceLevel, suggestionHistory);

  // HEURISTIC 1: Under-Recovered → Deload or Maintain
  if (recoveryScore < 5) {
    const deloadWeight = Math.round(weight * 0.85);
    return {
      weight: deloadWeight,
      reps: [6, 8],
      reasoning: `Low recovery score (${recoveryScore}/10). ${
        dailyLog?.sleepHours && dailyLog.sleepHours < 6
          ? `Only ${dailyLog.sleepHours}hrs sleep - reduce volume.`
          : 'High fatigue detected - active recovery session.'
      }`,
      confidence: 'high',
      recoveryScore,
      shouldDeload: true,
      estimated1RM,
      currentIntensity: Math.round((deloadWeight / estimated1RM) * 100),
      progressionRate: -15,
      mathExplanation: `Last: ${weight}kg × ${reps} reps (est. 1RM: ${estimated1RM}kg). Deload to ${deloadWeight}kg (${Math.round((deloadWeight / estimated1RM) * 100)}% intensity) for recovery.`
    };
  }

  // HEURISTIC 2: Intensity-Based Progression (Research-Backed Thresholds)
  // Start with personalized base rate, then adjust for intensity
  let progressionRate = baseProgressionRate;
  let targetReps = [reps, reps + 1];

  // Low intensity (<70%) + room to push → Use base rate or increase if conservative
  if (currentIntensity < 70 && rpe && rpe < 7 && recoveryScore >= 7) {
    // If base rate is already aggressive (beginner), keep it; otherwise increase
    progressionRate = Math.max(baseProgressionRate, 0.05);
    targetReps = [reps - 2, reps]; // Slightly lower reps at higher weight
  }
  // Moderate intensity (70-85%) → Use personalized base rate
  else if (currentIntensity >= 70 && currentIntensity < 85) {
    progressionRate = baseProgressionRate;
    targetReps = [reps, reps + 1];
  }
  // High intensity (≥85%) → More conservative
  else if (currentIntensity >= 85) {
    // Cap at 1.25% for safety near max
    progressionRate = Math.min(baseProgressionRate, 0.0125);
    targetReps = [reps - 1, reps]; // Lower reps to maintain technique
  }

  // RPE override: If RPE very high (≥9.5), maintain weight
  if (rpe && rpe >= 9.5) {
    return {
      weight: weight,
      reps: [reps, reps],
      reasoning: `RPE ${rpe}/10 is very high. Maintain weight to prevent overtraining.`,
      confidence: 'medium',
      recoveryScore,
      estimated1RM,
      currentIntensity,
      progressionRate: 0,
      mathExplanation: `Current: ${weight}kg at ${currentIntensity}% intensity (${estimated1RM}kg 1RM). RPE too high for progression.`
    };
  }

  // Apply progression with intensity-based logic + user bias
  if (rpe && rpe < 7 && recoveryScore >= 7) {
    // User left reps in the tank + well recovered → PUSH
    const baseWeight = Math.round(weight * (1 + progressionRate));
    const newWeight = Math.round(baseWeight * userBias);
    return {
      weight: newWeight,
      reps: targetReps,
      reasoning: `RPE ${rpe}/10 + excellent recovery (${recoveryScore}/10) at ${currentIntensity}% intensity = ready to push! +${(progressionRate * 100).toFixed(1)}% weight${userBias !== 1.0 ? ` (personalized ${userBias > 1.0 ? '+' : ''}${((userBias - 1) * 100).toFixed(0)}%)` : ''}.`,
      confidence: 'high',
      recoveryScore,
      estimated1RM,
      currentIntensity: Math.round((newWeight / estimated1RM) * 100),
      progressionRate: progressionRate * 100,
      mathExplanation: `Last: ${weight}kg × ${reps} reps (${currentIntensity}% of ${estimated1RM}kg 1RM). Next: ${newWeight}kg = ${Math.round((newWeight / estimated1RM) * 100)}% intensity${userBias !== 1.0 ? ` (adjusted for your preference: ${userBias}x)` : ''}.`
    };
  }

  if (rpe && rpe >= 8 && rpe <= 9 && recoveryScore >= 7) {
    // Perfect intensity + good recovery → Small progression
    const baseWeight = Math.round(weight * (1 + progressionRate));
    const newWeight = Math.round(baseWeight * userBias);
    return {
      weight: newWeight,
      reps: targetReps,
      reasoning: `RPE ${rpe}/10 (optimal) at ${currentIntensity}% intensity. +${(progressionRate * 100).toFixed(1)}% progression to maintain stimulus${userBias !== 1.0 ? ` (personalized)` : ''}.`,
      confidence: 'high',
      recoveryScore,
      estimated1RM,
      currentIntensity: Math.round((newWeight / estimated1RM) * 100),
      progressionRate: progressionRate * 100,
      mathExplanation: `Last: ${weight}kg × ${reps} reps (${currentIntensity}% of ${estimated1RM}kg 1RM). Next: ${newWeight}kg = ${Math.round((newWeight / estimated1RM) * 100)}% intensity${userBias !== 1.0 ? ` (learned from your behavior)` : ''}.`
    };
  }

  // HEURISTIC 3: Rep-Based Progression (When RPE not tracked)
  // Use personalized progression rates even without RPE
  if (!rpe) {
    if (reps >= 12 && recoveryScore >= 6) {
      // High reps achieved → Increase weight, lower reps
      // Use personalized rate or cap at 5% if at high intensity
      let repProgRate = currentIntensity >= 85 ? Math.min(baseProgressionRate, 0.025) : Math.max(baseProgressionRate, 0.05);
      const baseWeight = Math.round(weight * (1 + repProgRate));
      const newWeight = Math.round(baseWeight * userBias);
      return {
        weight: newWeight,
        reps: [6, 10],
        reasoning: `Completed ${reps} reps last time at ${currentIntensity}% intensity. Increase weight to build strength${userBias !== 1.0 ? ` (personalized)` : ''}.`,
        confidence: 'medium',
        recoveryScore,
        estimated1RM,
        currentIntensity: Math.round((newWeight / estimated1RM) * 100),
        progressionRate: repProgRate * 100,
        mathExplanation: `Last: ${weight}kg × ${reps} reps (${currentIntensity}% of ${estimated1RM}kg 1RM). Next: ${newWeight}kg for strength focus${userBias !== 1.0 ? ` (${userBias}x bias)` : ''}.`
      };
    }

    if (reps >= 8 && reps <= 11 && recoveryScore >= 6) {
      // In hypertrophy range → Use personalized progression
      const baseWeight = Math.round(weight * (1 + progressionRate));
      const newWeight = Math.round(baseWeight * userBias);
      return {
        weight: newWeight,
        reps: [reps, reps + 1],
        reasoning: `Good rep range (${reps}) at ${currentIntensity}% intensity. +${(progressionRate * 100).toFixed(1)}% for progressive overload${userBias !== 1.0 ? ` (personalized)` : ''}.`,
        confidence: 'medium',
        recoveryScore,
        estimated1RM,
        currentIntensity: Math.round((newWeight / estimated1RM) * 100),
        progressionRate: progressionRate * 100,
        mathExplanation: `Last: ${weight}kg × ${reps} reps (${currentIntensity}% of ${estimated1RM}kg 1RM). Next: ${newWeight}kg = ${Math.round((newWeight / estimated1RM) * 100)}% intensity${userBias !== 1.0 ? ` (learned bias: ${userBias}x)` : ''}.`
      };
    }

    if (reps < 6) {
      // Low reps → Either strength training or failed set
      return {
        weight: weight,
        reps: [6, 8],
        reasoning: `Only ${reps} reps last time at ${currentIntensity}% intensity. Maintain weight and aim for more reps.`,
        confidence: 'low',
        recoveryScore,
        estimated1RM,
        currentIntensity,
        progressionRate: 0,
        mathExplanation: `Current: ${weight}kg at ${currentIntensity}% intensity (${estimated1RM}kg 1RM). Focus on rep volume before adding weight.`
      };
    }
  }

  // HEURISTIC 4: Default Conservative Progression with Personalization
  const baseWeight = Math.round(weight * (1 + progressionRate));
  const defaultNewWeight = Math.round(baseWeight * userBias);
  return {
    weight: defaultNewWeight,
    reps: [reps, reps + 1] as [number, number],
    reasoning: `Moderate recovery (${recoveryScore}/10) at ${currentIntensity}% intensity. Conservative progression +${(progressionRate * 100).toFixed(1)}%${userBias !== 1.0 ? ` (personalized for you)` : ''}.`,
    confidence: 'medium',
    recoveryScore,
    estimated1RM,
    currentIntensity: Math.round((defaultNewWeight / estimated1RM) * 100),
    progressionRate: progressionRate * 100,
    mathExplanation: `Last: ${weight}kg × ${reps} reps (${currentIntensity}% of ${estimated1RM}kg 1RM). Next: ${defaultNewWeight}kg = ${Math.round((defaultNewWeight / estimated1RM) * 100)}% intensity${userBias !== 1.0 ? ` (adjusted ${userBias}x based on your history)` : ''}.`
  };
}

/**
 * Calculate weekly volume per muscle group
 * Used for MRV (Maximum Recoverable Volume) warnings
 *
 * Research: Dr. Mike Israetel recommends 10-20 sets/muscle/week for hypertrophy
 * MRV typically 20-25 sets/week depending on training age
 */
export function calculateWeeklyVolume(
  history: WorkoutSession[],
  muscleGroup: MuscleGroup,
  weeksBack: number = 1
): number {
  const cutoffDate = Date.now() - (weeksBack * 7 * 24 * 60 * 60 * 1000);

  const recentSessions = history.filter(
    h => h.status === 'completed' && h.startTime >= cutoffDate
  );

  let totalSets = 0;

  recentSessions.forEach(session => {
    session.logs.forEach(log => {
      const exercise = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
      if (!exercise) return;

      const completedSets = log.sets.filter(s => s.completed && s.type !== 'W');

      // Primary muscle group
      if (exercise.muscleGroup === muscleGroup) {
        totalSets += completedSets.length;
      }

      // Secondary muscles (count as 0.5 sets)
      if (exercise.secondaryMuscles?.includes(muscleGroup)) {
        totalSets += completedSets.length * 0.5;
      }
    });
  });

  return totalSets;
}

/**
 * Check if user is approaching MRV (Maximum Recoverable Volume)
 * Returns warning if weekly volume exceeds safe thresholds
 */
export function checkVolumeWarning(
  history: WorkoutSession[],
  muscleGroup: MuscleGroup
): { warning: boolean; message: string; sets: number } {
  const weeklySets = calculateWeeklyVolume(history, muscleGroup);

  const MRV_THRESHOLD = 22; // Conservative upper limit
  const MAV_THRESHOLD = 18; // Optimal range upper bound

  if (weeklySets >= MRV_THRESHOLD) {
    return {
      warning: true,
      message: `⚠️ ${muscleGroup} volume very high (${Math.round(weeklySets)} sets/week). Consider deload next week.`,
      sets: weeklySets
    };
  }

  if (weeklySets >= MAV_THRESHOLD) {
    return {
      warning: true,
      message: `⚡ ${muscleGroup} at maximum effective volume (${Math.round(weeklySets)} sets/week). Don't add more this week.`,
      sets: weeklySets
    };
  }

  return {
    warning: false,
    message: `✅ ${muscleGroup} volume healthy (${Math.round(weeklySets)} sets/week).`,
    sets: weeklySets
  };
}

/**
 * Detect if user needs a deload week
 * Based on accumulated fatigue indicators
 */
export function shouldDeloadWeek(
  history: WorkoutSession[],
  dailyLogs: Record<string, DailyLog>
): { shouldDeload: boolean; reasoning: string } {
  const recentWorkouts = history
    .filter(h => h.status === 'completed')
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, 6); // Last 6 workouts

  if (recentWorkouts.length < 4) {
    return { shouldDeload: false, reasoning: 'Insufficient training history.' };
  }

  // Factor 1: Average RPE trend (if tracked)
  let totalRPE = 0;
  let rpeCount = 0;

  recentWorkouts.forEach(session => {
    session.logs.forEach(log => {
      log.sets.forEach(set => {
        if (set.rpe && set.completed) {
          totalRPE += set.rpe;
          rpeCount++;
        }
      });
    });
  });

  const avgRPE = rpeCount > 0 ? totalRPE / rpeCount : 0;

  if (avgRPE >= 9) {
    return {
      shouldDeload: true,
      reasoning: `Average RPE very high (${avgRPE.toFixed(1)}/10) over last ${recentWorkouts.length} workouts. CNS fatigue likely.`
    };
  }

  // Factor 2: Sleep debt accumulation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  });

  const sleepData = last7Days
    .map(date => dailyLogs[date]?.sleepHours)
    .filter(hours => hours !== undefined) as number[];

  if (sleepData.length >= 4) {
    const avgSleep = sleepData.reduce((sum, h) => sum + h, 0) / sleepData.length;
    if (avgSleep < 6.5) {
      return {
        shouldDeload: true,
        reasoning: `Sleep debt accumulated (avg ${avgSleep.toFixed(1)}hrs/night). Deload to prevent overtraining.`
      };
    }
  }

  // Factor 3: Plateau detection (no PRs in 3+ weeks)
  // TODO: Implement once PR detection is integrated

  return { shouldDeload: false, reasoning: 'Recovery metrics look healthy.' };
}
