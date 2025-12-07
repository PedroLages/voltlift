/**
 * Fatigue Analysis Service
 *
 * Analyzes RPE trends to detect:
 * - Accumulating fatigue across workouts
 * - Auto-deload recommendations
 * - Exercise-specific fatigue patterns
 * - Recovery needs
 */

import { WorkoutSession, ExerciseLog, SetLog } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface FatigueAnalysis {
  overallFatigueLevel: 'low' | 'moderate' | 'high' | 'critical';
  averageRPE: number;
  rpeProgression: number; // Trend: positive = increasing fatigue
  consecutiveHighRPESessions: number;
  deloadRecommendation: DeloadRecommendation | null;
  exerciseFatigue: ExerciseFatigueData[];
  weeklyTrend: WeeklyFatigueTrend[];
}

export interface DeloadRecommendation {
  urgency: 'suggested' | 'recommended' | 'urgent';
  reason: string;
  volumeReduction: number; // Percentage to reduce (e.g., 40 = reduce by 40%)
  intensityReduction: number; // Percentage to reduce RPE targets
  durationDays: number;
  strategies: string[];
}

export interface ExerciseFatigueData {
  exerciseId: string;
  exerciseName: string;
  averageRPE: number;
  rpeProgression: number; // Trend over sessions
  sessionsTracked: number;
  lastSessionRPE: number;
  fatigueStatus: 'fresh' | 'moderate' | 'fatigued' | 'overtrained';
  recommendation: string;
}

export interface WeeklyFatigueTrend {
  weekStart: string;
  averageRPE: number;
  totalSets: number;
  highRPESets: number; // Sets with RPE >= 9
}

export interface SetWithRPE extends SetLog {
  rpe: number;
}

// =============================================================================
// Main Analysis Functions
// =============================================================================

/**
 * Analyze overall fatigue from workout history
 */
export function analyzeFatigue(
  history: WorkoutSession[],
  lookbackDays: number = 28
): FatigueAnalysis {
  const cutoff = Date.now() - (lookbackDays * 24 * 60 * 60 * 1000);
  const recentWorkouts = history
    .filter(w => w.status === 'completed' && w.endTime && w.endTime >= cutoff)
    .sort((a, b) => (a.endTime || 0) - (b.endTime || 0));

  if (recentWorkouts.length === 0) {
    return getDefaultFatigueAnalysis();
  }

  // Calculate overall metrics
  const allSetsWithRPE = getAllSetsWithRPE(recentWorkouts);
  const averageRPE = calculateAverageRPE(allSetsWithRPE);
  const rpeProgression = calculateRPEProgression(recentWorkouts);
  const consecutiveHighRPE = countConsecutiveHighRPESessions(recentWorkouts);

  // Determine fatigue level
  const overallFatigueLevel = determineFatigueLevel(averageRPE, rpeProgression, consecutiveHighRPE);

  // Generate deload recommendation if needed
  const deloadRecommendation = generateDeloadRecommendation(
    overallFatigueLevel,
    averageRPE,
    consecutiveHighRPE,
    rpeProgression
  );

  // Analyze per-exercise fatigue
  const exerciseFatigue = analyzeExerciseFatigue(recentWorkouts);

  // Calculate weekly trends
  const weeklyTrend = calculateWeeklyTrends(recentWorkouts);

  return {
    overallFatigueLevel,
    averageRPE,
    rpeProgression,
    consecutiveHighRPESessions: consecutiveHighRPE,
    deloadRecommendation,
    exerciseFatigue,
    weeklyTrend,
  };
}

/**
 * Get fatigue status for a specific exercise
 */
export function getExerciseFatigueStatus(
  exerciseId: string,
  history: WorkoutSession[]
): ExerciseFatigueData | null {
  const analysis = analyzeFatigue(history);
  return analysis.exerciseFatigue.find(e => e.exerciseId === exerciseId) || null;
}

/**
 * Check if immediate deload is needed
 */
export function needsImmediateDeload(history: WorkoutSession[]): boolean {
  const analysis = analyzeFatigue(history, 14); // Look at last 2 weeks
  return analysis.deloadRecommendation?.urgency === 'urgent';
}

// =============================================================================
// Helper Functions
// =============================================================================

function getDefaultFatigueAnalysis(): FatigueAnalysis {
  return {
    overallFatigueLevel: 'low',
    averageRPE: 0,
    rpeProgression: 0,
    consecutiveHighRPESessions: 0,
    deloadRecommendation: null,
    exerciseFatigue: [],
    weeklyTrend: [],
  };
}

function getAllSetsWithRPE(workouts: WorkoutSession[]): SetWithRPE[] {
  const sets: SetWithRPE[] = [];

  for (const workout of workouts) {
    for (const log of workout.logs) {
      for (const set of log.sets) {
        if (set.completed && set.rpe !== undefined && set.rpe > 0) {
          sets.push(set as SetWithRPE);
        }
      }
    }
  }

  return sets;
}

function calculateAverageRPE(sets: SetWithRPE[]): number {
  if (sets.length === 0) return 0;
  const sum = sets.reduce((acc, set) => acc + set.rpe, 0);
  return Math.round((sum / sets.length) * 10) / 10;
}

function calculateRPEProgression(workouts: WorkoutSession[]): number {
  if (workouts.length < 3) return 0;

  // Split into first half and second half
  const midpoint = Math.floor(workouts.length / 2);
  const firstHalf = workouts.slice(0, midpoint);
  const secondHalf = workouts.slice(midpoint);

  const firstHalfRPE = calculateAverageRPE(getAllSetsWithRPE(firstHalf));
  const secondHalfRPE = calculateAverageRPE(getAllSetsWithRPE(secondHalf));

  if (firstHalfRPE === 0) return 0;

  // Return percentage change
  return Math.round(((secondHalfRPE - firstHalfRPE) / firstHalfRPE) * 100);
}

function countConsecutiveHighRPESessions(workouts: WorkoutSession[]): number {
  let count = 0;

  // Start from most recent and count backwards
  for (let i = workouts.length - 1; i >= 0; i--) {
    const workout = workouts[i];
    const sets = getAllSetsWithRPE([workout]);
    const avgRPE = calculateAverageRPE(sets);

    if (avgRPE >= 8.5) {
      count++;
    } else {
      break;
    }
  }

  return count;
}

function determineFatigueLevel(
  averageRPE: number,
  rpeProgression: number,
  consecutiveHighRPE: number
): FatigueAnalysis['overallFatigueLevel'] {
  // Critical: Very high RPE sustained over many sessions
  if (averageRPE >= 9 && consecutiveHighRPE >= 4) return 'critical';
  if (consecutiveHighRPE >= 6) return 'critical';

  // High: Elevated RPE or increasing trend
  if (averageRPE >= 8.5 && consecutiveHighRPE >= 2) return 'high';
  if (rpeProgression > 15 && averageRPE >= 8) return 'high';

  // Moderate: Somewhat elevated
  if (averageRPE >= 7.5) return 'moderate';
  if (consecutiveHighRPE >= 2) return 'moderate';

  return 'low';
}

function generateDeloadRecommendation(
  fatigueLevel: FatigueAnalysis['overallFatigueLevel'],
  averageRPE: number,
  consecutiveHighRPE: number,
  rpeProgression: number
): DeloadRecommendation | null {
  if (fatigueLevel === 'low') return null;

  const baseStrategies = [
    'Reduce working sets by keeping warm-up volume',
    'Focus on technique and mind-muscle connection',
    'Increase rest periods between sets',
    'Prioritize sleep (8+ hours)',
  ];

  if (fatigueLevel === 'critical') {
    return {
      urgency: 'urgent',
      reason: `Critical fatigue detected: ${consecutiveHighRPE} consecutive high-RPE sessions with ${averageRPE} average RPE. Your body needs recovery NOW.`,
      volumeReduction: 50,
      intensityReduction: 20,
      durationDays: 7,
      strategies: [
        'Take 1-2 complete rest days',
        ...baseStrategies,
        'Consider active recovery (walking, stretching)',
        'Evaluate sleep, nutrition, and stress levels',
      ],
    };
  }

  if (fatigueLevel === 'high') {
    return {
      urgency: 'recommended',
      reason: `High fatigue accumulation: RPE trending ${rpeProgression > 0 ? 'up' : 'high'} (${averageRPE} avg). Deload will prevent overtraining.`,
      volumeReduction: 40,
      intensityReduction: 15,
      durationDays: 5,
      strategies: baseStrategies,
    };
  }

  // Moderate
  return {
    urgency: 'suggested',
    reason: `Moderate fatigue detected: ${averageRPE} average RPE. Consider a lighter week to stay ahead of fatigue.`,
    volumeReduction: 30,
    intensityReduction: 10,
    durationDays: 3,
    strategies: baseStrategies.slice(0, 3),
  };
}

function analyzeExerciseFatigue(workouts: WorkoutSession[]): ExerciseFatigueData[] {
  const exerciseData: Map<string, { rpes: number[]; name: string }> = new Map();

  for (const workout of workouts) {
    for (const log of workout.logs) {
      const setsWithRPE = log.sets.filter(s => s.completed && s.rpe !== undefined && s.rpe > 0);
      if (setsWithRPE.length === 0) continue;

      const avgRPE = setsWithRPE.reduce((sum, s) => sum + (s.rpe || 0), 0) / setsWithRPE.length;

      if (!exerciseData.has(log.exerciseId)) {
        exerciseData.set(log.exerciseId, { rpes: [], name: log.exerciseId });
      }
      exerciseData.get(log.exerciseId)!.rpes.push(avgRPE);
    }
  }

  const results: ExerciseFatigueData[] = [];

  exerciseData.forEach((data, exerciseId) => {
    if (data.rpes.length < 2) return; // Need at least 2 sessions

    const avgRPE = data.rpes.reduce((a, b) => a + b, 0) / data.rpes.length;
    const lastRPE = data.rpes[data.rpes.length - 1];

    // Calculate progression (compare last half to first half)
    const mid = Math.floor(data.rpes.length / 2);
    const firstHalfAvg = data.rpes.slice(0, mid).reduce((a, b) => a + b, 0) / mid || 0;
    const secondHalfAvg = data.rpes.slice(mid).reduce((a, b) => a + b, 0) / (data.rpes.length - mid) || 0;
    const progression = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    // Determine fatigue status
    let fatigueStatus: ExerciseFatigueData['fatigueStatus'] = 'fresh';
    if (lastRPE >= 9.5 || (avgRPE >= 9 && progression > 10)) {
      fatigueStatus = 'overtrained';
    } else if (lastRPE >= 9 || avgRPE >= 8.5) {
      fatigueStatus = 'fatigued';
    } else if (avgRPE >= 7.5) {
      fatigueStatus = 'moderate';
    }

    // Generate recommendation
    let recommendation = 'Continue as planned.';
    if (fatigueStatus === 'overtrained') {
      recommendation = 'Consider swapping for a similar exercise or reducing volume by 30-40%.';
    } else if (fatigueStatus === 'fatigued') {
      recommendation = 'Reduce by 1-2 sets or lower intensity next session.';
    } else if (fatigueStatus === 'moderate' && progression > 15) {
      recommendation = 'Monitor closely - fatigue is building on this movement.';
    }

    results.push({
      exerciseId,
      exerciseName: data.name, // Would need exercise library lookup for proper name
      averageRPE: Math.round(avgRPE * 10) / 10,
      rpeProgression: Math.round(progression),
      sessionsTracked: data.rpes.length,
      lastSessionRPE: Math.round(lastRPE * 10) / 10,
      fatigueStatus,
      recommendation,
    });
  });

  // Sort by fatigue status (overtrained first)
  const statusOrder = { overtrained: 0, fatigued: 1, moderate: 2, fresh: 3 };
  return results.sort((a, b) => statusOrder[a.fatigueStatus] - statusOrder[b.fatigueStatus]);
}

function calculateWeeklyTrends(workouts: WorkoutSession[]): WeeklyFatigueTrend[] {
  const weekMap: Map<string, { rpes: number[]; highRPESets: number }> = new Map();

  for (const workout of workouts) {
    if (!workout.endTime) continue;

    const date = new Date(workout.endTime);
    // Get week start (Sunday)
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { rpes: [], highRPESets: 0 });
    }

    const weekData = weekMap.get(weekKey)!;

    for (const log of workout.logs) {
      for (const set of log.sets) {
        if (set.completed && set.rpe !== undefined && set.rpe > 0) {
          weekData.rpes.push(set.rpe);
          if (set.rpe >= 9) {
            weekData.highRPESets++;
          }
        }
      }
    }
  }

  const trends: WeeklyFatigueTrend[] = [];

  weekMap.forEach((data, weekStart) => {
    if (data.rpes.length === 0) return;

    trends.push({
      weekStart,
      averageRPE: Math.round((data.rpes.reduce((a, b) => a + b, 0) / data.rpes.length) * 10) / 10,
      totalSets: data.rpes.length,
      highRPESets: data.highRPESets,
    });
  });

  return trends.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

// =============================================================================
// UI Helper Functions
// =============================================================================

export function getFatigueLevelColor(level: FatigueAnalysis['overallFatigueLevel']): {
  bg: string;
  border: string;
  text: string;
} {
  switch (level) {
    case 'critical':
      return { bg: 'bg-red-900/30', border: 'border-red-500', text: 'text-red-500' };
    case 'high':
      return { bg: 'bg-orange-900/30', border: 'border-orange-500', text: 'text-orange-500' };
    case 'moderate':
      return { bg: 'bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-500' };
    default:
      return { bg: 'bg-green-900/30', border: 'border-green-500', text: 'text-green-500' };
  }
}

export function getExerciseFatigueColor(status: ExerciseFatigueData['fatigueStatus']): string {
  switch (status) {
    case 'overtrained': return 'text-red-500';
    case 'fatigued': return 'text-orange-500';
    case 'moderate': return 'text-yellow-500';
    default: return 'text-green-500';
  }
}
