/**
 * Context Builder
 *
 * Efficiently builds and compresses context for LLM prompts:
 * - Extracts relevant data from app state
 * - Compresses history to fit token budgets
 * - Prioritizes most relevant information
 */

import {
  AIContext,
  UserContext,
  WorkoutContext,
  HistoricalContext,
  BiomarkerContext,
  WorkoutSummary,
  PRSummary,
} from './types';
import {
  WorkoutSession,
  UserSettings,
  ExerciseLog,
  DailyLog,
  MuscleGroup,
  Exercise,
} from '../../types';
import { EXERCISE_LIBRARY } from '../../constants';

// =============================================================================
// User Context Builder
// =============================================================================

/**
 * Build user context from settings
 */
export function buildUserContext(settings: UserSettings): UserContext {
  return {
    name: settings.name,
    experienceLevel: settings.experienceLevel,
    goal: {
      type: settings.goal.type,
      targetPerWeek: settings.goal.targetPerWeek,
    },
    units: settings.units,
    bodyweight: settings.bodyweight,
    trainingAge: undefined, // Could calculate from history
  };
}

// =============================================================================
// Workout Context Builder
// =============================================================================

/**
 * Build current workout context
 */
export function buildWorkoutContext(
  activeWorkout: WorkoutSession | null,
  currentExerciseId?: string
): WorkoutContext | undefined {
  if (!activeWorkout) return undefined;

  const exercise = currentExerciseId
    ? EXERCISE_LIBRARY.find((e) => e.id === currentExerciseId)
    : undefined;

  // Calculate session metrics
  const duration = (Date.now() - activeWorkout.startTime) / 1000 / 60; // minutes
  let totalVolume = 0;
  let totalRPE = 0;
  let rpeCount = 0;
  const muscleGroups = new Set<MuscleGroup>();

  activeWorkout.logs.forEach((log) => {
    const logExercise = EXERCISE_LIBRARY.find((e) => e.id === log.exerciseId);
    if (logExercise) {
      muscleGroups.add(logExercise.muscleGroup as MuscleGroup);
    }

    log.sets.forEach((set) => {
      if (set.completed) {
        totalVolume += set.weight * set.reps;
        if (set.rpe) {
          totalRPE += set.rpe;
          rpeCount++;
        }
      }
    });
  });

  return {
    currentExercise: exercise,
    currentSessionDuration: Math.round(duration),
    exercisesCompleted: activeWorkout.logs.filter(
      (log) => log.sets.some((s) => s.completed)
    ).length,
    totalVolume,
    averageRPE: rpeCount > 0 ? totalRPE / rpeCount : undefined,
    muscleGroupsWorked: Array.from(muscleGroups),
  };
}

// =============================================================================
// Historical Context Builder
// =============================================================================

/**
 * Build historical context from workout history
 */
export function buildHistoricalContext(
  history: WorkoutSession[],
  settings: UserSettings,
  maxWorkouts: number = 5
): HistoricalContext {
  const completedWorkouts = history
    .filter((w) => w.status === 'completed')
    .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime));

  // Recent workouts summary
  const recentWorkouts: WorkoutSummary[] = completedWorkouts
    .slice(0, maxWorkouts)
    .map((workout) => summarizeWorkout(workout));

  // PR summaries
  const prSummaries: PRSummary[] = [];
  Object.entries(settings.personalRecords).forEach(([exerciseId, prHistory]) => {
    const exercise = EXERCISE_LIBRARY.find((e) => e.id === exerciseId);
    if (!exercise) return;

    if (prHistory.bestWeight) {
      prSummaries.push({
        exerciseName: exercise.name,
        prType: 'weight',
        value: prHistory.bestWeight.value,
        date: new Date(prHistory.bestWeight.date).toISOString().split('T')[0],
      });
    }
  });

  // Weekly volume by muscle group
  const weeklyVolume: Record<MuscleGroup, number> = {
    Chest: 0,
    Back: 0,
    Legs: 0,
    Shoulders: 0,
    Arms: 0,
    Core: 0,
    Cardio: 0,
  };

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  completedWorkouts
    .filter((w) => w.startTime >= oneWeekAgo)
    .forEach((workout) => {
      workout.logs.forEach((log) => {
        const exercise = EXERCISE_LIBRARY.find((e) => e.id === log.exerciseId);
        if (!exercise) return;

        const volume = log.sets
          .filter((s) => s.completed)
          .reduce((sum, s) => sum + s.weight * s.reps, 0);

        weeklyVolume[exercise.muscleGroup as MuscleGroup] += volume;
      });
    });

  // Calculate streak
  const streak = calculateStreak(completedWorkouts);

  return {
    recentWorkouts,
    personalRecords: prSummaries.slice(0, 10), // Limit PRs in context
    weeklyVolume,
    streakDays: streak,
    totalWorkouts: completedWorkouts.length,
  };
}

/**
 * Summarize a workout for context
 */
function summarizeWorkout(workout: WorkoutSession): WorkoutSummary {
  const duration = workout.endTime
    ? (workout.endTime - workout.startTime) / 1000 / 60
    : 0;

  const exercises = workout.logs.map((log) => {
    const exercise = EXERCISE_LIBRARY.find((e) => e.id === log.exerciseId);
    return exercise?.name || log.exerciseId;
  });

  let totalVolume = 0;
  let totalRPE = 0;
  let rpeCount = 0;

  workout.logs.forEach((log) => {
    log.sets.forEach((set) => {
      if (set.completed) {
        totalVolume += set.weight * set.reps;
        if (set.rpe) {
          totalRPE += set.rpe;
          rpeCount++;
        }
      }
    });
  });

  return {
    date: new Date(workout.startTime).toISOString().split('T')[0],
    duration: Math.round(duration),
    exercises,
    totalVolume,
    averageRPE: rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : undefined,
  };
}

/**
 * Calculate workout streak
 */
function calculateStreak(workouts: WorkoutSession[]): number {
  if (workouts.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique workout dates
  const workoutDates = new Set<string>();
  workouts.forEach((w) => {
    const date = new Date(w.startTime).toISOString().split('T')[0];
    workoutDates.add(date);
  });

  // Count consecutive days (allowing 1 rest day)
  let currentDate = new Date(today);
  let missedDays = 0;

  while (missedDays < 2) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (workoutDates.has(dateStr)) {
      streak++;
      missedDays = 0;
    } else {
      missedDays++;
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return Math.max(0, streak);
}

// =============================================================================
// Biomarker Context Builder
// =============================================================================

/**
 * Build biomarker context from daily logs
 */
export function buildBiomarkerContext(
  dailyLogs: Record<string, DailyLog>,
  history: WorkoutSession[]
): BiomarkerContext {
  const today = new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs[today];

  // Calculate recovery score (similar to progressiveOverload.ts)
  let recoveryScore = 7; // Baseline

  // Sleep impact
  if (todayLog?.sleepHours) {
    if (todayLog.sleepHours >= 8) recoveryScore += 2;
    else if (todayLog.sleepHours >= 7) recoveryScore += 1;
    else if (todayLog.sleepHours >= 6) recoveryScore -= 1;
    else recoveryScore -= 3;
  }

  // Stress impact
  if (todayLog?.stressLevel) {
    if (todayLog.stressLevel >= 8) recoveryScore -= 2;
    else if (todayLog.stressLevel >= 6) recoveryScore -= 1;
  }

  // Determine fatigue status
  let fatigueStatus: 'Fresh' | 'Optimal' | 'High Fatigue' = 'Optimal';
  if (recoveryScore >= 8) fatigueStatus = 'Fresh';
  else if (recoveryScore < 5) fatigueStatus = 'High Fatigue';

  return {
    sleepHours: todayLog?.sleepHours,
    stressLevel: todayLog?.stressLevel,
    recoveryScore: Math.max(0, Math.min(10, recoveryScore)),
    fatigueStatus,
  };
}

// =============================================================================
// Full Context Builder
// =============================================================================

/**
 * Build complete AI context
 */
export function buildFullContext(params: {
  settings: UserSettings;
  history: WorkoutSession[];
  dailyLogs: Record<string, DailyLog>;
  activeWorkout?: WorkoutSession | null;
  currentExerciseId?: string;
}): AIContext {
  const { settings, history, dailyLogs, activeWorkout, currentExerciseId } = params;

  return {
    user: buildUserContext(settings),
    workout: activeWorkout
      ? buildWorkoutContext(activeWorkout, currentExerciseId)
      : undefined,
    history: buildHistoricalContext(history, settings),
    biomarkers: buildBiomarkerContext(dailyLogs, history),
  };
}

// =============================================================================
// Context Compression
// =============================================================================

/**
 * Compress context to fit token budget
 */
export function compressContext(
  context: AIContext,
  maxTokens: number
): string {
  const parts: string[] = [];
  let tokenEstimate = 0;
  const tokensPerChar = 0.25;

  // Always include user basics
  const userBasics = `User: ${context.user.name} (${context.user.experienceLevel}, ${context.user.goal.type})`;
  parts.push(userBasics);
  tokenEstimate += userBasics.length * tokensPerChar;

  // Add biomarkers if available (high value, low tokens)
  if (context.biomarkers) {
    const bioStr = `Recovery: ${context.biomarkers.recoveryScore}/10 (${context.biomarkers.fatigueStatus})`;
    if (tokenEstimate + bioStr.length * tokensPerChar < maxTokens * 0.3) {
      parts.push(bioStr);
      tokenEstimate += bioStr.length * tokensPerChar;
    }
  }

  // Add current workout context if available
  if (context.workout) {
    const workoutStr = `Session: ${context.workout.exercisesCompleted} exercises, ${context.workout.totalVolume}${context.user.units} volume`;
    if (tokenEstimate + workoutStr.length * tokensPerChar < maxTokens * 0.5) {
      parts.push(workoutStr);
      tokenEstimate += workoutStr.length * tokensPerChar;
    }
  }

  // Add recent workouts (most recent first, until budget)
  if (context.history.recentWorkouts.length > 0) {
    const maxHistory = Math.floor((maxTokens - tokenEstimate) / 50); // ~50 tokens per workout
    const historyCount = Math.min(maxHistory, context.history.recentWorkouts.length, 3);

    if (historyCount > 0) {
      parts.push('Recent:');
      context.history.recentWorkouts.slice(0, historyCount).forEach((w) => {
        const wStr = `- ${w.date}: ${w.exercises.slice(0, 3).join(', ')} (${w.totalVolume}${context.user.units})`;
        parts.push(wStr);
        tokenEstimate += wStr.length * tokensPerChar;
      });
    }
  }

  return parts.join('\n');
}

// =============================================================================
// Exercise-Specific Context
// =============================================================================

/**
 * Build context specific to an exercise
 */
export function buildExerciseContext(
  exerciseId: string,
  history: WorkoutSession[],
  settings: UserSettings
): {
  exercise: Exercise | undefined;
  lastPerformance: { weight: number; reps: number; rpe?: number } | null;
  prWeight: number | null;
  sessionsLogged: number;
  averageVolume: number;
} {
  const exercise = EXERCISE_LIBRARY.find((e) => e.id === exerciseId);

  // Find all sessions with this exercise
  const sessionsWithExercise = history.filter(
    (w) => w.status === 'completed' && w.logs.some((l) => l.exerciseId === exerciseId)
  );

  // Get last performance
  let lastPerformance: { weight: number; reps: number; rpe?: number } | null = null;
  if (sessionsWithExercise.length > 0) {
    const lastSession = sessionsWithExercise.sort(
      (a, b) => b.startTime - a.startTime
    )[0];
    const lastLog = lastSession.logs.find((l) => l.exerciseId === exerciseId);
    const lastSet = lastLog?.sets.filter((s) => s.completed).pop();
    if (lastSet) {
      lastPerformance = {
        weight: lastSet.weight,
        reps: lastSet.reps,
        rpe: lastSet.rpe,
      };
    }
  }

  // Get PR
  const prHistory = settings.personalRecords[exerciseId];
  const prWeight = prHistory?.bestWeight?.value || null;

  // Calculate average volume
  const volumes = sessionsWithExercise.map((session) => {
    const log = session.logs.find((l) => l.exerciseId === exerciseId);
    return log?.sets
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + s.weight * s.reps, 0) || 0;
  });
  const averageVolume =
    volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;

  return {
    exercise,
    lastPerformance,
    prWeight,
    sessionsLogged: sessionsWithExercise.length,
    averageVolume,
  };
}
