/**
 * Analytics & Time Series Service
 *
 * Phase 3 Foundation: Extract and analyze performance data over time.
 * Provides time series data for forecasting, plateau detection, and insights.
 * Also tracks AI suggestion acceptance rates for continuous improvement.
 */

import { WorkoutSession, ExerciseLog, DailyLog, MuscleGroup, SuggestionFeedback } from '../types';
import { EXERCISE_LIBRARY } from '../constants';
import { estimate1RM } from './progressiveOverload';

/**
 * Single data point in a performance time series
 */
export interface PerformancePoint {
  date: number; // timestamp
  weight: number;
  reps: number;
  volume: number; // sets × reps × weight
  estimated1RM: number;
  rpe?: number;
  sets: number;
}

/**
 * Time series data for a specific exercise
 */
export interface ExerciseTimeSeries {
  exerciseId: string;
  exerciseName: string;
  dataPoints: PerformancePoint[];
  firstWorkout: number; // timestamp
  lastWorkout: number; // timestamp
  totalWorkouts: number;
}

/**
 * Volume data point for muscle group tracking
 */
export interface VolumePoint {
  weekStart: number; // Monday timestamp
  sets: number;
  volume: number; // total tonnage (sets × reps × weight)
  exercises: string[]; // exercise IDs performed
}

/**
 * Extract time series performance data for a specific exercise
 *
 * @param exerciseId - Exercise to analyze
 * @param history - All completed workouts
 * @param weeksBack - How many weeks of history to include (0 = all time)
 * @returns Time series of performance data points
 */
export function extractExerciseTimeSeries(
  exerciseId: string,
  history: WorkoutSession[],
  weeksBack: number = 0
): ExerciseTimeSeries {
  const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
  const cutoffDate = weeksBack > 0
    ? Date.now() - (weeksBack * 7 * 24 * 60 * 60 * 1000)
    : 0;

  // Filter to completed workouts with this exercise
  const relevantWorkouts = history
    .filter(w => w.status === 'completed' && w.startTime >= cutoffDate)
    .filter(w => w.logs.some(log => log.exerciseId === exerciseId))
    .sort((a, b) => a.startTime - b.startTime);

  const dataPoints: PerformancePoint[] = [];

  relevantWorkouts.forEach(workout => {
    const exerciseLog = workout.logs.find(log => log.exerciseId === exerciseId);
    if (!exerciseLog) return;

    // Get the top set (heaviest weight) for this workout
    const completedSets = exerciseLog.sets.filter(s => s.completed && s.type !== 'W');
    if (completedSets.length === 0) return;

    const topSet = completedSets.reduce((max, set) =>
      set.weight > max.weight ? set : max,
      completedSets[0]
    );

    // Calculate volume for this exercise in this workout
    const totalVolume = completedSets.reduce((sum, set) =>
      sum + (set.reps * set.weight),
      0
    );

    dataPoints.push({
      date: workout.startTime,
      weight: topSet.weight,
      reps: topSet.reps,
      volume: totalVolume,
      estimated1RM: estimate1RM(topSet.weight, topSet.reps),
      rpe: topSet.rpe,
      sets: completedSets.length
    });
  });

  return {
    exerciseId,
    exerciseName: exercise?.name || exerciseId,
    dataPoints,
    firstWorkout: dataPoints.length > 0 ? dataPoints[0].date : 0,
    lastWorkout: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].date : 0,
    totalWorkouts: dataPoints.length
  };
}

/**
 * Extract weekly volume time series for a muscle group
 *
 * @param muscleGroup - Muscle group to analyze
 * @param history - All completed workouts
 * @param weeksBack - How many weeks to include (default 12)
 * @returns Weekly volume data points
 */
export function extractVolumeTimeSeries(
  muscleGroup: MuscleGroup,
  history: WorkoutSession[],
  weeksBack: number = 12
): VolumePoint[] {
  const cutoffDate = Date.now() - (weeksBack * 7 * 24 * 60 * 60 * 1000);

  // Get Monday of each week
  const weeks = new Map<number, VolumePoint>();

  const relevantWorkouts = history
    .filter(w => w.status === 'completed' && w.startTime >= cutoffDate)
    .sort((a, b) => a.startTime - b.startTime);

  relevantWorkouts.forEach(workout => {
    // Get Monday of this workout's week
    const workoutDate = new Date(workout.startTime);
    const dayOfWeek = workoutDate.getDay();
    const monday = new Date(workoutDate);
    monday.setDate(workoutDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.getTime();

    // Initialize week if needed
    if (!weeks.has(weekStart)) {
      weeks.set(weekStart, {
        weekStart,
        sets: 0,
        volume: 0,
        exercises: []
      });
    }

    const weekData = weeks.get(weekStart)!;

    // Sum up sets and volume for this muscle group
    workout.logs.forEach(log => {
      const exercise = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
      if (!exercise) return;

      const isPrimaryMuscle = exercise.muscleGroup === muscleGroup;
      const isSecondaryMuscle = exercise.secondaryMuscles?.includes(muscleGroup);

      if (isPrimaryMuscle || isSecondaryMuscle) {
        const completedSets = log.sets.filter(s => s.completed && s.type !== 'W');
        const setCount = isPrimaryMuscle ? completedSets.length : completedSets.length * 0.5;
        const volumeContribution = completedSets.reduce((sum, set) =>
          sum + (set.reps * set.weight * (isPrimaryMuscle ? 1 : 0.5)),
          0
        );

        weekData.sets += setCount;
        weekData.volume += volumeContribution;

        if (!weekData.exercises.includes(log.exerciseId)) {
          weekData.exercises.push(log.exerciseId);
        }
      }
    });
  });

  // Convert to array and sort by week
  return Array.from(weeks.values()).sort((a, b) => a.weekStart - b.weekStart);
}

/**
 * Calculate correlation between two time series
 * Pearson correlation coefficient
 *
 * @param series1 - First time series (e.g., volume)
 * @param series2 - Second time series (e.g., 1RM gains)
 * @returns Correlation coefficient (-1 to 1)
 */
export function calculateCorrelation(
  series1: number[],
  series2: number[]
): number {
  if (series1.length !== series2.length || series1.length < 2) {
    return 0;
  }

  const n = series1.length;
  const mean1 = series1.reduce((sum, val) => sum + val, 0) / n;
  const mean2 = series2.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = series1[i] - mean1;
    const diff2 = series2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(sumSq1 * sumSq2);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Correlate weekly volume with performance gains
 *
 * @param muscleGroup - Muscle group to analyze
 * @param exerciseId - Representative exercise for this muscle group
 * @param history - All completed workouts
 * @returns Correlation data and insights
 */
export function correlateVolumeWithPerformance(
  muscleGroup: MuscleGroup,
  exerciseId: string,
  history: WorkoutSession[]
): {
  correlation: number;
  optimalVolume: number; // sets/week with best performance
  volumeData: VolumePoint[];
  performanceData: PerformancePoint[];
} {
  // Get volume time series for muscle group
  const volumeData = extractVolumeTimeSeries(muscleGroup, history, 12);

  // Get performance time series for representative exercise
  const performanceTimeSeries = extractExerciseTimeSeries(exerciseId, history, 12);

  // Align data points by week
  const alignedVolume: number[] = [];
  const alignedPerformance: number[] = [];

  volumeData.forEach(volumePoint => {
    // Find performance data from this week
    const weekEnd = volumePoint.weekStart + (7 * 24 * 60 * 60 * 1000);
    const performanceInWeek = performanceTimeSeries.dataPoints.filter(
      p => p.date >= volumePoint.weekStart && p.date < weekEnd
    );

    if (performanceInWeek.length > 0) {
      // Use average 1RM for the week
      const avg1RM = performanceInWeek.reduce((sum, p) => sum + p.estimated1RM, 0) / performanceInWeek.length;
      alignedVolume.push(volumePoint.sets);
      alignedPerformance.push(avg1RM);
    }
  });

  const correlation = calculateCorrelation(alignedVolume, alignedPerformance);

  // Find optimal volume (volume with highest average 1RM)
  const volumeBuckets = new Map<number, number[]>(); // volume -> [1RMs]

  for (let i = 0; i < alignedVolume.length; i++) {
    const volumeBucket = Math.round(alignedVolume[i] / 2) * 2; // Round to nearest 2 sets
    if (!volumeBuckets.has(volumeBucket)) {
      volumeBuckets.set(volumeBucket, []);
    }
    volumeBuckets.get(volumeBucket)!.push(alignedPerformance[i]);
  }

  let optimalVolume = 15; // Default
  let maxAvg1RM = 0;

  volumeBuckets.forEach((oneRMs, volume) => {
    const avg = oneRMs.reduce((sum, val) => sum + val, 0) / oneRMs.length;
    if (avg > maxAvg1RM) {
      maxAvg1RM = avg;
      optimalVolume = volume;
    }
  });

  return {
    correlation,
    optimalVolume,
    volumeData,
    performanceData: performanceTimeSeries.dataPoints
  };
}

/**
 * Calculate rate of change (slope) for a time series
 * Uses linear regression
 *
 * @param dataPoints - Performance data points
 * @returns Slope (change per day) and R² score
 */
export function calculateTrend(
  dataPoints: PerformancePoint[]
): { slope: number; slopePerWeek: number; r2Score: number } {
  if (dataPoints.length < 2) {
    return { slope: 0, slopePerWeek: 0, r2Score: 0 };
  }

  const n = dataPoints.length;

  // Convert dates to days since first workout
  const firstDate = dataPoints[0].date;
  const x = dataPoints.map(p => (p.date - firstDate) / (1000 * 60 * 60 * 24)); // days
  const y = dataPoints.map(p => p.estimated1RM);

  // Linear regression: y = mx + b
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (y[i] - yMean);
    denominator += (x[i] - xMean) * (x[i] - xMean);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const slopePerWeek = slope * 7;

  // Calculate R² (coefficient of determination)
  const predictions = x.map(xi => slope * xi + (yMean - slope * xMean));
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r2Score = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

  return { slope, slopePerWeek, r2Score };
}

/**
 * Detect if user is plateauing (no progress in recent weeks)
 *
 * @param timeSeries - Exercise time series
 * @param weeksToCheck - Number of recent weeks to analyze (default 4)
 * @returns Plateau detection result
 */
export function detectPlateau(
  timeSeries: ExerciseTimeSeries,
  weeksToCheck: number = 4
): {
  isPlateaued: boolean;
  weeksSincePR: number;
  currentPR: number;
  reasoning: string;
} {
  if (timeSeries.dataPoints.length < 2) {
    return {
      isPlateaued: false,
      weeksSincePR: 0,
      currentPR: 0,
      reasoning: 'Insufficient data to detect plateau.'
    };
  }

  const cutoffDate = Date.now() - (weeksToCheck * 7 * 24 * 60 * 60 * 1000);
  const recentData = timeSeries.dataPoints.filter(p => p.date >= cutoffDate);

  if (recentData.length < 2) {
    return {
      isPlateaued: false,
      weeksSincePR: 0,
      currentPR: Math.max(...timeSeries.dataPoints.map(p => p.estimated1RM)),
      reasoning: 'Not enough recent data to detect plateau.'
    };
  }

  // Calculate trend in recent weeks
  const { slopePerWeek, r2Score } = calculateTrend(recentData);

  // Find current PR
  const currentPR = Math.max(...timeSeries.dataPoints.map(p => p.estimated1RM));

  // Find last time user hit a PR (within 5lbs)
  let weeksSincePR = 0;
  for (let i = timeSeries.dataPoints.length - 1; i >= 0; i--) {
    const point = timeSeries.dataPoints[i];
    if (point.estimated1RM >= currentPR - 5) {
      weeksSincePR = Math.floor((Date.now() - point.date) / (7 * 24 * 60 * 60 * 1000));
      break;
    }
  }

  // Plateau criteria:
  // 1. Slope near zero (< 0.5lbs/week gain)
  // 2. No PR in 4+ weeks
  // 3. Good data fit (R² > 0.3)
  const isPlateaued = slopePerWeek < 0.5 && weeksSincePR >= 4 && r2Score > 0.3;

  let reasoning = '';
  if (isPlateaued) {
    reasoning = `No PR in ${weeksSincePR} weeks. Progress rate ${slopePerWeek.toFixed(1)}lbs/week (expected >0.5). Consider deload or variation.`;
  } else if (slopePerWeek >= 0.5) {
    reasoning = `Progressing well at ${slopePerWeek.toFixed(1)}lbs/week. Keep current program.`;
  } else {
    reasoning = `Recent progress slow (${slopePerWeek.toFixed(1)}lbs/week) but need more data to confirm plateau.`;
  }

  return {
    isPlateaued,
    weeksSincePR,
    currentPR,
    reasoning
  };
}

// =============================================================================
// AI Suggestion Acceptance Tracking
// =============================================================================

/**
 * Suggestion acceptance statistics
 */
export interface SuggestionStats {
  totalSuggestions: number;
  acceptedCount: number;
  overriddenCount: number;
  acceptanceRate: number; // 0-100%
  byConfidence: {
    high: { total: number; accepted: number; rate: number };
    medium: { total: number; accepted: number; rate: number };
    low: { total: number; accepted: number; rate: number };
  };
  byExercise: Map<string, { total: number; accepted: number; rate: number }>;
  averageWeightDelta: number; // How much heavier/lighter users go vs suggestion
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * Calculate AI suggestion acceptance rate across all exercises
 *
 * @param suggestionHistory - All suggestion feedback events
 * @param weeksBack - How many weeks to analyze (0 = all time)
 * @returns Comprehensive suggestion statistics
 */
export function calculateSuggestionAcceptanceRate(
  suggestionHistory: SuggestionFeedback[],
  weeksBack: number = 0
): SuggestionStats {
  const cutoffDate = weeksBack > 0
    ? Date.now() - (weeksBack * 7 * 24 * 60 * 60 * 1000)
    : 0;

  const relevantFeedback = suggestionHistory.filter(f => f.timestamp >= cutoffDate);

  if (relevantFeedback.length === 0) {
    return {
      totalSuggestions: 0,
      acceptedCount: 0,
      overriddenCount: 0,
      acceptanceRate: 0,
      byConfidence: {
        high: { total: 0, accepted: 0, rate: 0 },
        medium: { total: 0, accepted: 0, rate: 0 },
        low: { total: 0, accepted: 0, rate: 0 },
      },
      byExercise: new Map(),
      averageWeightDelta: 0,
      trend: 'stable',
    };
  }

  const totalSuggestions = relevantFeedback.length;
  const acceptedCount = relevantFeedback.filter(f => f.accepted).length;
  const overriddenCount = totalSuggestions - acceptedCount;
  const acceptanceRate = (acceptedCount / totalSuggestions) * 100;

  // Calculate by confidence level
  const byConfidence = {
    high: { total: 0, accepted: 0, rate: 0 },
    medium: { total: 0, accepted: 0, rate: 0 },
    low: { total: 0, accepted: 0, rate: 0 },
  };

  relevantFeedback.forEach(f => {
    byConfidence[f.confidence].total++;
    if (f.accepted) {
      byConfidence[f.confidence].accepted++;
    }
  });

  // Calculate rates
  byConfidence.high.rate = byConfidence.high.total > 0
    ? (byConfidence.high.accepted / byConfidence.high.total) * 100
    : 0;
  byConfidence.medium.rate = byConfidence.medium.total > 0
    ? (byConfidence.medium.accepted / byConfidence.medium.total) * 100
    : 0;
  byConfidence.low.rate = byConfidence.low.total > 0
    ? (byConfidence.low.accepted / byConfidence.low.total) * 100
    : 0;

  // Calculate by exercise
  const byExercise = new Map<string, { total: number; accepted: number; rate: number }>();

  relevantFeedback.forEach(f => {
    if (!byExercise.has(f.exerciseId)) {
      byExercise.set(f.exerciseId, { total: 0, accepted: 0, rate: 0 });
    }
    const exerciseStats = byExercise.get(f.exerciseId)!;
    exerciseStats.total++;
    if (f.accepted) {
      exerciseStats.accepted++;
    }
  });

  // Calculate rates for each exercise
  byExercise.forEach((stats, exerciseId) => {
    stats.rate = (stats.accepted / stats.total) * 100;
  });

  // Calculate average weight delta (how much users deviate from suggestions)
  const weightDeltas = relevantFeedback.map(f => f.actualWeight - f.suggestedWeight);
  const averageWeightDelta = weightDeltas.reduce((sum, delta) => sum + delta, 0) / weightDeltas.length;

  // Calculate trend (compare last 4 weeks vs previous 4 weeks)
  const fourWeeksAgo = Date.now() - (4 * 7 * 24 * 60 * 60 * 1000);
  const eightWeeksAgo = Date.now() - (8 * 7 * 24 * 60 * 60 * 1000);

  const recentFeedback = relevantFeedback.filter(f => f.timestamp >= fourWeeksAgo);
  const previousFeedback = relevantFeedback.filter(f => f.timestamp >= eightWeeksAgo && f.timestamp < fourWeeksAgo);

  const recentRate = recentFeedback.length > 0
    ? (recentFeedback.filter(f => f.accepted).length / recentFeedback.length) * 100
    : 0;
  const previousRate = previousFeedback.length > 0
    ? (previousFeedback.filter(f => f.accepted).length / previousFeedback.length) * 100
    : 0;

  let trend: 'improving' | 'stable' | 'declining';
  if (recentRate > previousRate + 5) {
    trend = 'improving';
  } else if (recentRate < previousRate - 5) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  return {
    totalSuggestions,
    acceptedCount,
    overriddenCount,
    acceptanceRate,
    byConfidence,
    byExercise,
    averageWeightDelta,
    trend,
  };
}

/**
 * Get suggestion acceptance insights and recommendations
 *
 * @param suggestionHistory - All suggestion feedback events
 * @returns Actionable insights about suggestion quality
 */
export function getSuggestionInsights(
  suggestionHistory: SuggestionFeedback[]
): {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  strengths: string[];
  improvements: string[];
  recommendations: string[];
} {
  const stats = calculateSuggestionAcceptanceRate(suggestionHistory);

  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  // Determine overall quality
  let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (stats.acceptanceRate >= 80) {
    overallQuality = 'excellent';
    strengths.push(`High acceptance rate (${stats.acceptanceRate.toFixed(1)}%) - users trust AI suggestions`);
  } else if (stats.acceptanceRate >= 60) {
    overallQuality = 'good';
    strengths.push(`Good acceptance rate (${stats.acceptanceRate.toFixed(1)}%)`);
  } else if (stats.acceptanceRate >= 40) {
    overallQuality = 'fair';
    improvements.push(`Moderate acceptance rate (${stats.acceptanceRate.toFixed(1)}%) - room for improvement`);
  } else {
    overallQuality = 'poor';
    improvements.push(`Low acceptance rate (${stats.acceptanceRate.toFixed(1)}%) - suggestions need calibration`);
  }

  // Analyze confidence levels
  if (stats.byConfidence.high.rate >= 85) {
    strengths.push('High-confidence suggestions very accurate');
  }
  if (stats.byConfidence.low.rate < 40) {
    improvements.push('Low-confidence suggestions need improvement');
    recommendations.push('Consider being more conservative with low-confidence suggestions');
  }

  // Analyze weight delta
  if (Math.abs(stats.averageWeightDelta) < 2.5) {
    strengths.push('Weight suggestions are well-calibrated');
  } else if (stats.averageWeightDelta > 5) {
    improvements.push(`Suggestions tend to be too conservative (avg ${stats.averageWeightDelta.toFixed(1)}kg lighter than users lift)`);
    recommendations.push('Increase progression rate for high-recovery users');
  } else if (stats.averageWeightDelta < -5) {
    improvements.push(`Suggestions tend to be too aggressive (avg ${Math.abs(stats.averageWeightDelta).toFixed(1)}kg heavier than users lift)`);
    recommendations.push('Be more conservative with progression, especially for beginners');
  }

  // Analyze trend
  if (stats.trend === 'improving') {
    strengths.push('Acceptance rate improving over time - algorithm learning');
  } else if (stats.trend === 'declining') {
    improvements.push('Acceptance rate declining - may need algorithm adjustment');
    recommendations.push('Review recent algorithm changes or user feedback patterns');
  }

  // Exercise-specific analysis
  const exercisesWithLowAcceptance: string[] = [];
  stats.byExercise.forEach((exerciseStats, exerciseId) => {
    if (exerciseStats.total >= 5 && exerciseStats.rate < 50) {
      const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
      exercisesWithLowAcceptance.push(exercise?.name || exerciseId);
    }
  });

  if (exercisesWithLowAcceptance.length > 0) {
    improvements.push(`Low acceptance for: ${exercisesWithLowAcceptance.join(', ')}`);
    recommendations.push('Review progression formulas for these exercises');
  }

  return {
    overallQuality,
    strengths,
    improvements,
    recommendations,
  };
}
