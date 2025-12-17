/**
 * ML Feature Extraction Service
 *
 * Extracts and engineers features from workout history and daily logs
 * for use by the fatigue prediction model and volume optimization bandit.
 */

import type {
  WorkoutSession,
  DailyLog,
  UserSettings,
  MuscleGroup,
  DailyMLFeatures,
  BanditContext
} from '../../types';
import { EXERCISE_LIBRARY } from '../../constants';

// =============================================================================
// Constants
// =============================================================================

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

// Default MAV (Maximum Adaptive Volume) by experience level (sets/week)
const DEFAULT_MAV: Record<string, Record<MuscleGroup, number>> = {
  Beginner: { chest: 12, back: 14, legs: 14, shoulders: 10, arms: 10, core: 12 },
  Intermediate: { chest: 16, back: 18, legs: 18, shoulders: 14, arms: 12, core: 14 },
  Advanced: { chest: 20, back: 22, legs: 22, shoulders: 16, arms: 14, core: 16 },
};

// =============================================================================
// Main Feature Extraction Functions
// =============================================================================

/**
 * Extract daily ML features for a specific date
 *
 * @param date - Date to extract features for (accepts string or number timestamp)
 * @param history - Workout history
 * @param dailyLogs - Daily wellness logs (accepts array or Record)
 * @param settings - Optional user settings (uses defaults if not provided)
 */
export function extractDailyFeatures(
  date: string | number,
  history: WorkoutSession[],
  dailyLogs: DailyLog[] | Record<string, DailyLog>,
  settings?: UserSettings
): DailyMLFeatures {
  // Convert dailyLogs array to Record if needed
  const logsRecord: Record<string, DailyLog> = Array.isArray(dailyLogs)
    ? dailyLogs.reduce((acc, log) => ({ ...acc, [log.date]: log }), {})
    : dailyLogs;

  // Convert date to string format
  const dateStr = typeof date === 'number'
    ? new Date(date).toISOString().split('T')[0]
    : date;

  // Use default settings if not provided
  const userSettings = settings || createDefaultSettings();

  const dayLog = logsRecord[dateStr];
  const dayWorkouts = getWorkoutsForDate(dateStr, history);

  // Calculate volume per muscle group for this day
  const volumePerMuscle = calculateDailyVolumePerMuscle(dayWorkouts);
  const volumeTotal = Object.values(volumePerMuscle).reduce((a, b) => a + b, 0);

  // Calculate RPE metrics
  const { avgRPE, maxRPE } = calculateRPEMetrics(dayWorkouts);

  // Calculate ACWR (Acute:Chronic Workload Ratio)
  const acwr = calculateACWR(dateStr, history);

  // Calculate days since rest/deload
  const daysSinceRest = calculateDaysSinceRest(dateStr, history);
  const daysSinceDeload = calculateDaysSinceDeload(dateStr, history, userSettings);

  // Calculate weekly volume change
  const weeklyVolumeChange = calculateWeeklyVolumeChange(dateStr, history);

  // Calculate RPE trend (7-day slope)
  const rpeTrend = calculateRPETrend(dateStr, history);

  // Determine training phase
  const trainingPhase = determineTrainingPhase(dateStr, history, userSettings);

  return {
    date: dateStr,

    // Training Load
    volumeTotal,
    volumePerMuscle,

    // Intensity
    avgRPE: avgRPE || 0,
    maxRPE: maxRPE || 0,
    avgIntensity: calculateAverageIntensity(dayWorkouts, userSettings),

    // Recovery (from daily log, with defaults)
    sleepHours: dayLog?.sleepHours ?? 7,
    sleepQuality: dayLog?.sleepQuality ?? 3,
    stressLevel: dayLog?.stressLevel ?? 3,
    sorenessLevel: dayLog?.muscleSoreness ?? 2,
    perceivedRecovery: dayLog?.perceivedRecovery ?? 3,
    perceivedEnergy: dayLog?.perceivedEnergy ?? 3,

    // Derived
    acwr,
    daysSinceRest,
    daysSinceDeload,
    weeklyVolumeChange,
    rpeTrend,

    // Context
    dayOfWeek: new Date(dateStr).getDay(),
    isRestDay: dayWorkouts.length === 0,
    trainingPhase,
  };
}

/**
 * Extract features for the last N days (for time-series input to GRU)
 *
 * @param history - Workout history
 * @param dailyLogs - Daily wellness logs (accepts array or Record)
 * @param endDate - End date (accepts number timestamp or string)
 * @param days - Number of days to extract
 * @param settings - User settings (optional, uses defaults if not provided)
 */
export function extractFeatureSequence(
  history: WorkoutSession[],
  dailyLogs: DailyLog[] | Record<string, DailyLog>,
  endDate: number | string,
  days: number,
  settings?: UserSettings
): DailyMLFeatures[] {
  const features: DailyMLFeatures[] = [];

  // Convert dailyLogs array to Record if needed
  const logsRecord: Record<string, DailyLog> = Array.isArray(dailyLogs)
    ? dailyLogs.reduce((acc, log) => ({ ...acc, [log.date]: log }), {})
    : dailyLogs;

  // Convert endDate to Date object
  const end = typeof endDate === 'number'
    ? new Date(endDate)
    : new Date(endDate);

  // Use default settings if not provided
  const userSettings = settings || createDefaultSettings();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(end);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    features.push(extractDailyFeatures(dateStr, history, logsRecord, userSettings));
  }

  return features;
}

/**
 * Extract context features for the volume bandit
 *
 * @param history - Workout history
 * @param dailyLogs - Daily wellness logs (accepts array or Record)
 * @param endDate - Optional end date (number timestamp or string, defaults to today)
 * @param settings - Optional user settings (uses defaults if not provided)
 */
export function extractBanditContext(
  history: WorkoutSession[],
  dailyLogs: DailyLog[] | Record<string, DailyLog>,
  endDate?: number | string,
  settings?: UserSettings
): BanditContext {
  // Convert dailyLogs array to Record if needed
  const logsRecord: Record<string, DailyLog> = Array.isArray(dailyLogs)
    ? dailyLogs.reduce((acc, log) => ({ ...acc, [log.date]: log }), {})
    : dailyLogs;

  // Calculate today based on endDate or current date
  const end = endDate
    ? (typeof endDate === 'number' ? new Date(endDate) : new Date(endDate))
    : new Date();
  const today = end.toISOString().split('T')[0];

  // Use default settings if not provided
  const userSettings = settings || createDefaultSettings();
  const last7Days = getLast7DaysLogs(today, logsRecord);
  const last14Days = getWorkoutsInRange(today, 14, history);
  const last28Days = getWorkoutsInRange(today, 28, history);

  // Calculate current weekly volume per muscle
  const currentVolume = calculateWeeklyVolumePerMuscle(last7Days.map(d =>
    getWorkoutsForDate(d.date, history)
  ).flat());

  // Calculate volume vs MAV ratio
  const mav = DEFAULT_MAV[userSettings.experienceLevel] || DEFAULT_MAV.Intermediate;
  const volumeVsMAV: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
  for (const muscle of MUSCLE_GROUPS) {
    volumeVsMAV[muscle] = mav[muscle] > 0 ? currentVolume[muscle] / mav[muscle] : 0;
  }

  // Calculate weeks at current volume (simplified)
  const weeksAtCurrentVolume = estimateWeeksAtCurrentVolume(history);

  // Recovery metrics (7-day averages)
  const avgSoreness7d = average(last7Days.map(d => d.muscleSoreness ?? 2));
  const avgFatigue7d = average(last7Days.map(d => 6 - (d.perceivedEnergy ?? 3))); // Invert energy to fatigue
  const sleepQuality7d = average(last7Days.map(d => d.sleepQuality ?? 3));

  // Performance metrics
  const recentPRCount = countRecentPRs(last14Days, userSettings);
  const stalledExercises = countStalledExercises(history, userSettings);
  const avgRPETrend = calculateRPETrend(today, history);

  // Training context
  const weeksSinceDeload = Math.floor(calculateDaysSinceDeload(today, history, userSettings) / 7);
  const experienceLevel = userSettings.experienceLevel === 'Beginner' ? 0 :
                          userSettings.experienceLevel === 'Intermediate' ? 1 : 2;
  const trainingFrequency = calculateTrainingFrequency(last28Days);

  // Historical response (placeholder - will be learned)
  const responseToVolumeIncrease = 0;
  const responseToVolumeDecrease = 0;

  return {
    currentVolume,
    volumeVsMAV,
    weeksAtCurrentVolume,
    avgSoreness7d,
    avgFatigue7d,
    sleepQuality7d,
    recentPRCount,
    stalledExercises,
    avgRPETrend,
    weeksSinceDeload,
    experienceLevel,
    trainingFrequency,
    responseToVolumeIncrease,
    responseToVolumeDecrease,
  };
}

/**
 * Convert DailyMLFeatures to normalized tensor input for GRU model
 */
export function featuresToTensor(features: DailyMLFeatures[]): number[][] {
  return features.map(f => [
    // Normalize all features to roughly 0-1 range
    f.volumeTotal / 50,                    // Assume max ~50 sets/day
    ...MUSCLE_GROUPS.map(m => (f.volumePerMuscle[m] || 0) / 20), // Max ~20 sets/muscle
    f.avgRPE / 10,                         // RPE is 0-10
    f.maxRPE / 10,
    f.avgIntensity / 100,                  // Intensity is 0-100%
    f.sleepHours / 10,                     // Max ~10 hours
    f.sleepQuality / 5,                    // 1-5 scale
    f.stressLevel / 5,
    f.sorenessLevel / 5,
    f.perceivedRecovery / 5,
    f.perceivedEnergy / 5,
    Math.min(f.acwr, 2) / 2,               // Cap ACWR at 2
    Math.min(f.daysSinceRest, 14) / 14,    // Cap at 14 days
    Math.min(f.daysSinceDeload, 56) / 56,  // Cap at 8 weeks
    (f.weeklyVolumeChange + 50) / 100,     // -50% to +50% → 0 to 1
    (f.rpeTrend + 1) / 2,                  // -1 to +1 → 0 to 1
    f.dayOfWeek / 6,                       // 0-6 → 0-1
    f.isRestDay ? 0 : 1,
  ]);
}

// =============================================================================
// Helper Functions
// =============================================================================

function getWorkoutsForDate(date: string, history: WorkoutSession[]): WorkoutSession[] {
  const dayStart = new Date(date).setHours(0, 0, 0, 0);
  const dayEnd = new Date(date).setHours(23, 59, 59, 999);

  return history.filter(w =>
    w.status === 'completed' &&
    w.endTime &&
    w.endTime >= dayStart &&
    w.endTime <= dayEnd
  );
}

function getWorkoutsInRange(endDate: string, days: number, history: WorkoutSession[]): WorkoutSession[] {
  const end = new Date(endDate).setHours(23, 59, 59, 999);
  const start = end - (days * 24 * 60 * 60 * 1000);

  return history.filter(w =>
    w.status === 'completed' &&
    w.endTime &&
    w.endTime >= start &&
    w.endTime <= end
  );
}

function calculateDailyVolumePerMuscle(workouts: WorkoutSession[]): Record<MuscleGroup, number> {
  const volume: Record<MuscleGroup, number> = {
    chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0
  };

  for (const workout of workouts) {
    for (const log of workout.logs) {
      const exercise = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
      if (!exercise) continue;

      const completedSets = log.sets.filter(s => s.completed).length;
      const primaryMuscle = exercise.muscleGroup.toLowerCase() as MuscleGroup;

      if (primaryMuscle in volume) {
        volume[primaryMuscle] += completedSets;
      }

      // Add half credit for secondary muscles
      if (exercise.secondaryMuscles) {
        for (const secondary of exercise.secondaryMuscles) {
          const secondaryLower = secondary.toLowerCase() as MuscleGroup;
          if (secondaryLower in volume) {
            volume[secondaryLower] += completedSets * 0.5;
          }
        }
      }
    }
  }

  return volume;
}

function calculateWeeklyVolumePerMuscle(workouts: WorkoutSession[]): Record<MuscleGroup, number> {
  return calculateDailyVolumePerMuscle(workouts);
}

function calculateRPEMetrics(workouts: WorkoutSession[]): { avgRPE: number; maxRPE: number } {
  const rpes: number[] = [];

  for (const workout of workouts) {
    for (const log of workout.logs) {
      for (const set of log.sets) {
        if (set.completed && set.rpe !== undefined && set.rpe > 0) {
          rpes.push(set.rpe);
        }
      }
    }
  }

  if (rpes.length === 0) {
    return { avgRPE: 0, maxRPE: 0 };
  }

  return {
    avgRPE: average(rpes),
    maxRPE: Math.max(...rpes),
  };
}

function calculateACWR(date: string, history: WorkoutSession[]): number {
  const acute = getWorkoutsInRange(date, 7, history);
  const chronic = getWorkoutsInRange(date, 28, history);

  const acuteLoad = calculateTotalVolume(acute);
  const chronicLoad = calculateTotalVolume(chronic) / 4; // Average weekly

  if (chronicLoad === 0) return 1;
  return acuteLoad / chronicLoad;
}

function calculateTotalVolume(workouts: WorkoutSession[]): number {
  let total = 0;
  for (const workout of workouts) {
    for (const log of workout.logs) {
      total += log.sets.filter(s => s.completed).length;
    }
  }
  return total;
}

function calculateDaysSinceRest(date: string, history: WorkoutSession[]): number {
  const targetDate = new Date(date);

  for (let i = 1; i <= 30; i++) {
    const checkDate = new Date(targetDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const workouts = getWorkoutsForDate(dateStr, history);
    if (workouts.length === 0) {
      return i - 1;
    }
  }

  return 30;
}

function calculateDaysSinceDeload(
  date: string,
  history: WorkoutSession[],
  settings: UserSettings
): number {
  // Look for weeks with significantly reduced volume
  const targetDate = new Date(date);

  for (let week = 1; week <= 12; week++) {
    const weekEnd = new Date(targetDate);
    weekEnd.setDate(weekEnd.getDate() - (week * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekWorkouts = history.filter(w =>
      w.status === 'completed' &&
      w.endTime &&
      w.endTime >= weekStart.getTime() &&
      w.endTime <= weekEnd.getTime()
    );

    const weekVolume = calculateTotalVolume(weekWorkouts);

    // If volume was less than 50% of typical, consider it a deload
    if (weekVolume < 15) { // Rough threshold
      return (week - 1) * 7;
    }
  }

  return 84; // 12 weeks max
}

function calculateWeeklyVolumeChange(date: string, history: WorkoutSession[]): number {
  const thisWeek = getWorkoutsInRange(date, 7, history);
  const lastWeekEnd = new Date(date);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
  const lastWeek = getWorkoutsInRange(lastWeekEnd.toISOString().split('T')[0], 7, history);

  const thisVolume = calculateTotalVolume(thisWeek);
  const lastVolume = calculateTotalVolume(lastWeek);

  if (lastVolume === 0) return 0;
  return ((thisVolume - lastVolume) / lastVolume) * 100;
}

function calculateRPETrend(date: string, history: WorkoutSession[]): number {
  // Calculate 7-day RPE trend using linear regression slope
  const days: { day: number; rpe: number }[] = [];

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(date);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const workouts = getWorkoutsForDate(dateStr, history);
    const { avgRPE } = calculateRPEMetrics(workouts);

    if (avgRPE > 0) {
      days.push({ day: 6 - i, rpe: avgRPE });
    }
  }

  if (days.length < 3) return 0;

  // Simple linear regression
  const n = days.length;
  const sumX = days.reduce((a, d) => a + d.day, 0);
  const sumY = days.reduce((a, d) => a + d.rpe, 0);
  const sumXY = days.reduce((a, d) => a + d.day * d.rpe, 0);
  const sumXX = days.reduce((a, d) => a + d.day * d.day, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Normalize to -1 to +1 range (±0.5 RPE per day is extreme)
  return Math.max(-1, Math.min(1, slope * 2));
}

function calculateAverageIntensity(workouts: WorkoutSession[], settings: UserSettings): number {
  // Calculate average % of 1RM across all sets
  const intensities: number[] = [];

  for (const workout of workouts) {
    for (const log of workout.logs) {
      const pr = settings.personalRecords[log.exerciseId];
      if (!pr?.best1RM) continue;

      for (const set of log.sets) {
        if (set.completed && set.weight) {
          const intensity = (set.weight / pr.best1RM) * 100;
          intensities.push(intensity);
        }
      }
    }
  }

  return intensities.length > 0 ? average(intensities) : 70; // Default 70%
}

function determineTrainingPhase(
  date: string,
  history: WorkoutSession[],
  settings: UserSettings
): DailyMLFeatures['trainingPhase'] {
  // Simple heuristic based on recent volume and intensity
  const recentWorkouts = getWorkoutsInRange(date, 7, history);
  const volume = calculateTotalVolume(recentWorkouts);
  const intensity = calculateAverageIntensity(recentWorkouts, settings);

  if (volume < 15) return 'deload';
  if (intensity > 85) return 'intensification';
  if (volume > 30) return 'accumulation';
  return 'unknown';
}

function getLast7DaysLogs(date: string, dailyLogs: Record<string, DailyLog>): DailyLog[] {
  const logs: DailyLog[] = [];
  const end = new Date(date);

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(end);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    logs.push(dailyLogs[dateStr] || { date: dateStr });
  }

  return logs;
}

function countRecentPRs(workouts: WorkoutSession[], settings: UserSettings): number {
  // Count exercises where recent best exceeds stored PR
  // This is simplified - would need more sophisticated tracking in production
  let prCount = 0;

  const exerciseBests: Record<string, number> = {};

  for (const workout of workouts) {
    for (const log of workout.logs) {
      for (const set of log.sets) {
        if (set.completed && set.weight && set.reps) {
          const estimated1RM = set.weight * (1 + set.reps / 30); // Epley formula simplified

          if (!exerciseBests[log.exerciseId] || estimated1RM > exerciseBests[log.exerciseId]) {
            exerciseBests[log.exerciseId] = estimated1RM;
          }
        }
      }
    }
  }

  for (const [exerciseId, best] of Object.entries(exerciseBests)) {
    const storedPR = settings.personalRecords[exerciseId]?.best1RM || 0;
    if (best > storedPR * 1.01) { // 1% improvement threshold
      prCount++;
    }
  }

  return prCount;
}

function countStalledExercises(history: WorkoutSession[], settings: UserSettings): number {
  // Count exercises with no PR in last 4 weeks
  const last4Weeks = getWorkoutsInRange(new Date().toISOString().split('T')[0], 28, history);
  const exercisesWorked = new Set<string>();

  for (const workout of last4Weeks) {
    for (const log of workout.logs) {
      exercisesWorked.add(log.exerciseId);
    }
  }

  // For now, just check if exercise has PR data but no recent improvement
  let stalledCount = 0;
  for (const exerciseId of exercisesWorked) {
    const pr = settings.personalRecords[exerciseId];
    if (pr && pr.history && pr.history.length > 0) {
      const lastPRDate = pr.history[pr.history.length - 1]?.date;
      const fourWeeksAgo = Date.now() - (28 * 24 * 60 * 60 * 1000);

      if (lastPRDate && lastPRDate < fourWeeksAgo) {
        stalledCount++;
      }
    }
  }

  return stalledCount;
}

function calculateTrainingFrequency(workouts: WorkoutSession[]): number {
  // Sessions per week over the last 4 weeks
  return workouts.length / 4;
}

function estimateWeeksAtCurrentVolume(history: WorkoutSession[]): number {
  // Simplified: check how many weeks volume has been stable (±20%)
  const today = new Date().toISOString().split('T')[0];
  const currentWeekVolume = calculateTotalVolume(getWorkoutsInRange(today, 7, history));

  for (let week = 1; week <= 8; week++) {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - (week * 7));
    const weekVolume = calculateTotalVolume(
      getWorkoutsInRange(weekEnd.toISOString().split('T')[0], 7, history)
    );

    const change = Math.abs(weekVolume - currentWeekVolume) / (currentWeekVolume || 1);
    if (change > 0.2) {
      return week;
    }
  }

  return 8;
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Create default UserSettings for when settings are not available
 * This allows feature extraction to work without full user context
 */
function createDefaultSettings(): UserSettings {
  return {
    onboardingCompleted: true,
    experienceLevel: 'Intermediate',
    personalRecords: {},
    preferredUnits: 'kg',
    restTimerEnabled: true,
    defaultRestTime: 90,
    soundEnabled: true,
    notificationsEnabled: false,
    theme: 'dark',
    activeProgram: null,
  };
}
