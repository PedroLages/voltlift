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
 */

import { SetLog, ExerciseLog, DailyLog, WorkoutSession, MuscleGroup } from '../types';
import { EXERCISE_LIBRARY } from '../constants';

export type Confidence = 'high' | 'medium' | 'low';

export interface ProgressiveSuggestion {
  weight: number;
  reps: [number, number]; // Target range (e.g., [6, 8])
  reasoning: string;
  confidence: Confidence;
  recoveryScore: number; // 0-10 scale
  shouldDeload?: boolean;
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
 */
export function getSuggestion(
  exerciseId: string,
  lastWorkout: ExerciseLog | undefined,
  dailyLog: DailyLog | undefined,
  history: WorkoutSession[],
  currentSessionStart: number
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
    return {
      weight: exercise?.difficulty === 'Beginner' ? 45 : 95, // Bar weight or light starting
      reps: [8, 12],
      reasoning: 'First time logging this exercise. Start conservative to learn form.',
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

  // HEURISTIC 1: Under-Recovered → Deload or Maintain
  if (recoveryScore < 5) {
    return {
      weight: Math.round(weight * 0.85), // 15% deload
      reps: [6, 8],
      reasoning: `Low recovery score (${recoveryScore}/10). ${
        dailyLog?.sleepHours && dailyLog.sleepHours < 6
          ? `Only ${dailyLog.sleepHours}hrs sleep - reduce volume.`
          : 'High fatigue detected - active recovery session.'
      }`,
      confidence: 'high',
      recoveryScore,
      shouldDeload: true
    };
  }

  // HEURISTIC 2: RPE-Based Progression (Gold Standard for Auto-Regulation)
  // If RPE < 8 (RIR > 2) → Room to push harder
  if (rpe && rpe < 7 && recoveryScore >= 7) {
    // User left reps in the tank + well recovered → PUSH
    const newWeight = Math.round(weight * 1.05); // 5% increase
    return {
      weight: newWeight,
      reps: [reps - 2, reps], // Slightly lower reps at higher weight
      reasoning: `RPE ${rpe}/10 + excellent recovery (${recoveryScore}/10) = ready to push! +5% weight.`,
      confidence: 'high',
      recoveryScore
    };
  }

  if (rpe && rpe >= 8 && rpe <= 9 && recoveryScore >= 7) {
    // Perfect intensity + good recovery → Small progression
    const newWeight = Math.round(weight * 1.025); // 2.5% increase
    return {
      weight: newWeight,
      reps: [reps, reps + 1],
      reasoning: `RPE ${rpe}/10 (optimal intensity). Small progression +2.5% to maintain stimulus.`,
      confidence: 'high',
      recoveryScore
    };
  }

  if (rpe && rpe >= 9.5) {
    // Near-failure training → Fatigue accumulation risk
    return {
      weight: weight, // Maintain
      reps: [reps, reps],
      reasoning: `RPE ${rpe}/10 is very high. Maintain weight to prevent overtraining.`,
      confidence: 'medium',
      recoveryScore
    };
  }

  // HEURISTIC 3: Rep-Based Progression (When RPE not tracked)
  if (!rpe) {
    if (reps >= 12 && recoveryScore >= 6) {
      // High reps achieved → Increase weight, lower reps
      const newWeight = Math.round(weight * 1.05);
      return {
        weight: newWeight,
        reps: [6, 10],
        reasoning: `Completed ${reps} reps last time. Increase weight to build strength.`,
        confidence: 'medium',
        recoveryScore
      };
    }

    if (reps >= 8 && reps <= 11 && recoveryScore >= 6) {
      // In hypertrophy range → Small progression
      const newWeight = Math.round(weight * 1.025);
      return {
        weight: newWeight,
        reps: [reps, reps + 1],
        reasoning: `Good rep range (${reps}). Small weight increase for progressive overload.`,
        confidence: 'medium',
        recoveryScore
      };
    }

    if (reps < 6) {
      // Low reps → Either strength training or failed set
      return {
        weight: weight,
        reps: [6, 8],
        reasoning: `Only ${reps} reps last time. Maintain weight and aim for more reps.`,
        confidence: 'low',
        recoveryScore
      };
    }
  }

  // HEURISTIC 4: Default Conservative Progression
  return {
    weight: Math.round(weight * 1.025), // 2.5% increase
    reps: [reps, reps + 1],
    reasoning: `Moderate recovery (${recoveryScore}/10). Conservative progression +2.5%.`,
    confidence: 'medium',
    recoveryScore
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
