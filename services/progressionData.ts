import { WorkoutSession, ExerciseLog } from '../types';
import { calculate1RM } from './strengthScore';

export interface ProgressionDataPoint {
  date: string; // YYYY-MM-DD
  timestamp: number;
  value: number; // 1RM estimate
  weight: number; // Actual weight lifted
  reps: number; // Reps performed
  volume: number; // weight * reps
}

export interface ExerciseProgression {
  exerciseId: string;
  exerciseName: string;
  dataPoints: ProgressionDataPoint[];
  best1RM: number;
  totalWorkouts: number;
  avgImprovement: number; // % improvement over time period
}

/**
 * Extract 1RM progression data for a specific exercise from workout history
 */
export function getExerciseProgression(
  exerciseId: string,
  exerciseName: string,
  history: WorkoutSession[],
  daysBack: number = 90
): ExerciseProgression {
  const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

  // Find all completed workouts with this exercise
  const relevantWorkouts = history.filter(
    session => session.status === 'completed' &&
               session.endTime &&
               session.startTime > cutoffDate
  );

  // Extract all sets for this exercise with dates
  const dataPoints: ProgressionDataPoint[] = [];

  relevantWorkouts.forEach(session => {
    const exerciseLog = session.logs.find(log => log.exerciseId === exerciseId);

    if (exerciseLog) {
      // Find best set of the workout (highest 1RM)
      let bestSet: { weight: number; reps: number; estimated1RM: number } | null = null;

      exerciseLog.sets.forEach(set => {
        if (set.completed && set.weight > 0 && set.reps > 0) {
          const { estimated1RM } = calculate1RM(set.weight, set.reps);

          if (!bestSet || estimated1RM > bestSet.estimated1RM) {
            bestSet = {
              weight: set.weight,
              reps: set.reps,
              estimated1RM
            };
          }
        }
      });

      if (bestSet) {
        const date = new Date(session.startTime);
        dataPoints.push({
          date: date.toISOString().split('T')[0],
          timestamp: session.startTime,
          value: Math.round(bestSet.estimated1RM),
          weight: bestSet.weight,
          reps: bestSet.reps,
          volume: bestSet.weight * bestSet.reps
        });
      }
    }
  });

  // Sort by timestamp
  dataPoints.sort((a, b) => a.timestamp - b.timestamp);

  // Calculate metrics
  const best1RM = dataPoints.length > 0
    ? Math.max(...dataPoints.map(d => d.value))
    : 0;

  // Calculate average improvement (first vs last)
  let avgImprovement = 0;
  if (dataPoints.length >= 2) {
    const first = dataPoints[0].value;
    const last = dataPoints[dataPoints.length - 1].value;
    avgImprovement = ((last - first) / first) * 100;
  }

  return {
    exerciseId,
    exerciseName,
    dataPoints,
    best1RM,
    totalWorkouts: dataPoints.length,
    avgImprovement
  };
}

/**
 * Get progression data for multiple exercises
 */
export function getMultipleExerciseProgressions(
  exercises: { id: string; name: string }[],
  history: WorkoutSession[],
  daysBack: number = 90
): ExerciseProgression[] {
  return exercises
    .map(ex => getExerciseProgression(ex.id, ex.name, history, daysBack))
    .filter(prog => prog.dataPoints.length > 0); // Only return exercises with data
}

/**
 * Get volume progression over time (total weight lifted per workout)
 */
export function getVolumeProgression(
  history: WorkoutSession[],
  daysBack: number = 90
): ProgressionDataPoint[] {
  const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

  const volumeData: ProgressionDataPoint[] = history
    .filter(session =>
      session.status === 'completed' &&
      session.endTime &&
      session.startTime > cutoffDate
    )
    .map(session => {
      // Calculate total volume for this workout
      let totalVolume = 0;
      session.logs.forEach(log => {
        log.sets.forEach(set => {
          if (set.completed) {
            totalVolume += set.weight * set.reps;
          }
        });
      });

      const date = new Date(session.startTime);
      return {
        date: date.toISOString().split('T')[0],
        timestamp: session.startTime,
        value: totalVolume,
        weight: totalVolume,
        reps: 0,
        volume: totalVolume
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  return volumeData;
}

/**
 * Get muscle group volume distribution over time
 */
export function getMuscleGroupVolumeProgression(
  muscleGroup: string,
  history: WorkoutSession[],
  exerciseLibrary: { id: string; muscleGroup: string }[],
  daysBack: number = 90
): ProgressionDataPoint[] {
  const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

  // Get exercise IDs for this muscle group
  const muscleGroupExerciseIds = new Set(
    exerciseLibrary
      .filter(ex => ex.muscleGroup === muscleGroup)
      .map(ex => ex.id)
  );

  const volumeData: ProgressionDataPoint[] = history
    .filter(session =>
      session.status === 'completed' &&
      session.endTime &&
      session.startTime > cutoffDate
    )
    .map(session => {
      // Calculate muscle group volume for this workout
      let muscleVolume = 0;
      session.logs.forEach(log => {
        if (muscleGroupExerciseIds.has(log.exerciseId)) {
          log.sets.forEach(set => {
            if (set.completed) {
              muscleVolume += set.weight * set.reps;
            }
          });
        }
      });

      const date = new Date(session.startTime);
      return {
        date: date.toISOString().split('T')[0],
        timestamp: session.startTime,
        value: muscleVolume,
        weight: muscleVolume,
        reps: 0,
        volume: muscleVolume
      };
    })
    .filter(d => d.value > 0) // Only include workouts where this muscle was trained
    .sort((a, b) => a.timestamp - b.timestamp);

  return volumeData;
}

// New interfaces for muscle group analytics
export interface MuscleGroupVolume {
  muscleGroup: string;
  totalVolume: number;
  percentage: number;
  workoutCount: number;
}

export interface VolumeBalanceScore {
  score: number; // 0-100, higher = more balanced
  distribution: MuscleGroupVolume[];
  mostTrained: string;
  leastTrained: string;
  recommendation: string;
}

export interface WeeklyVolumeData {
  weekStart: string; // ISO date of week start
  weekEnd: string;
  totalVolume: number;
  muscleBreakdown: Record<string, number>; // muscle group -> volume
  workoutCount: number;
}

/**
 * Get total volume distribution across muscle groups for a time period
 */
export function getMuscleGroupVolumeDistribution(
  history: WorkoutSession[],
  exerciseLibrary: { id: string; muscleGroup: string }[],
  daysBack: number = 90
): MuscleGroupVolume[] {
  const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

  const muscleVolumeMap = new Map<string, { volume: number; workouts: Set<string> }>();

  // Calculate volume per muscle group
  history
    .filter(session =>
      session.status === 'completed' &&
      session.endTime &&
      session.startTime > cutoffDate
    )
    .forEach(session => {
      session.logs.forEach(log => {
        const exercise = exerciseLibrary.find(ex => ex.id === log.exerciseId);
        if (!exercise) return;

        const muscle = exercise.muscleGroup;
        if (!muscleVolumeMap.has(muscle)) {
          muscleVolumeMap.set(muscle, { volume: 0, workouts: new Set() });
        }

        const muscleData = muscleVolumeMap.get(muscle)!;

        log.sets.forEach(set => {
          if (set.completed) {
            muscleData.volume += set.weight * set.reps;
          }
        });

        muscleData.workouts.add(session.id);
      });
    });

  // Calculate total volume for percentage calculation
  const totalVolume = Array.from(muscleVolumeMap.values())
    .reduce((sum, data) => sum + data.volume, 0);

  // Convert to array with percentages
  const distribution: MuscleGroupVolume[] = Array.from(muscleVolumeMap.entries())
    .map(([muscleGroup, data]) => ({
      muscleGroup,
      totalVolume: data.volume,
      percentage: totalVolume > 0 ? (data.volume / totalVolume) * 100 : 0,
      workoutCount: data.workouts.size
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume);

  return distribution;
}

/**
 * Calculate volume balance score (how evenly distributed is training?)
 */
export function calculateVolumeBalanceScore(
  history: WorkoutSession[],
  exerciseLibrary: { id: string; muscleGroup: string }[],
  daysBack: number = 90
): VolumeBalanceScore {
  const distribution = getMuscleGroupVolumeDistribution(history, exerciseLibrary, daysBack);

  if (distribution.length === 0) {
    return {
      score: 0,
      distribution: [],
      mostTrained: 'None',
      leastTrained: 'None',
      recommendation: 'Start tracking workouts to see balance metrics'
    };
  }

  // Calculate balance score using coefficient of variation
  // Lower CV = more balanced distribution = higher score
  const volumes = distribution.map(d => d.totalVolume);
  const mean = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const variance = volumes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / volumes.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;

  // Convert CV to 0-100 score (inverse relationship)
  // CV of 0 = perfect balance = 100
  // CV of 1+ = poor balance = 0
  const score = Math.max(0, Math.min(100, 100 * (1 - cv)));

  const mostTrained = distribution[0]?.muscleGroup || 'None';
  const leastTrained = distribution[distribution.length - 1]?.muscleGroup || 'None';

  // Generate recommendation
  let recommendation = '';
  if (score >= 80) {
    recommendation = 'Excellent balance! Your training is well-distributed across muscle groups.';
  } else if (score >= 60) {
    recommendation = `Good balance. Consider adding more ${leastTrained} work to improve distribution.`;
  } else if (score >= 40) {
    recommendation = `Moderate imbalance. ${mostTrained} is over-emphasized. Add ${leastTrained} exercises.`;
  } else {
    recommendation = `Significant imbalance detected. ${mostTrained} dominates your training. Prioritize ${leastTrained}.`;
  }

  return {
    score: Math.round(score),
    distribution,
    mostTrained,
    leastTrained,
    recommendation
  };
}

/**
 * Get weekly volume aggregates with muscle group breakdown
 */
export function getWeeklyVolumeBreakdown(
  history: WorkoutSession[],
  exerciseLibrary: { id: string; muscleGroup: string }[],
  weeksBack: number = 12
): WeeklyVolumeData[] {
  const cutoffDate = Date.now() - (weeksBack * 7 * 24 * 60 * 60 * 1000);

  // Group workouts by week
  const weeklyData = new Map<string, {
    weekStart: Date;
    weekEnd: Date;
    totalVolume: number;
    muscleBreakdown: Map<string, number>;
    workoutIds: Set<string>;
  }>();

  history
    .filter(session =>
      session.status === 'completed' &&
      session.endTime &&
      session.startTime > cutoffDate
    )
    .forEach(session => {
      const date = new Date(session.startTime);

      // Get Monday of the week
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const weekKey = monday.toISOString().split('T')[0];

      if (!weeklyData.has(weekKey)) {
        const weekEnd = new Date(monday);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weeklyData.set(weekKey, {
          weekStart: monday,
          weekEnd,
          totalVolume: 0,
          muscleBreakdown: new Map(),
          workoutIds: new Set()
        });
      }

      const weekData = weeklyData.get(weekKey)!;
      weekData.workoutIds.add(session.id);

      session.logs.forEach(log => {
        const exercise = exerciseLibrary.find(ex => ex.id === log.exerciseId);
        if (!exercise) return;

        const muscle = exercise.muscleGroup;

        log.sets.forEach(set => {
          if (set.completed) {
            const volume = set.weight * set.reps;
            weekData.totalVolume += volume;
            weekData.muscleBreakdown.set(
              muscle,
              (weekData.muscleBreakdown.get(muscle) || 0) + volume
            );
          }
        });
      });
    });

  // Convert to array and sort by date
  const weeklyArray: WeeklyVolumeData[] = Array.from(weeklyData.entries())
    .map(([weekKey, data]) => ({
      weekStart: data.weekStart.toISOString().split('T')[0],
      weekEnd: data.weekEnd.toISOString().split('T')[0],
      totalVolume: data.totalVolume,
      muscleBreakdown: Object.fromEntries(data.muscleBreakdown),
      workoutCount: data.workoutIds.size
    }))
    .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

  return weeklyArray;
}
