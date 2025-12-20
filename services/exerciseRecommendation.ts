/**
 * Exercise Recommendation Service
 *
 * Centralized logic for finding exercise substitutes/alternatives.
 * Used by Smart Swap, Add Exercise suggestions, and AI recommendations.
 */

import { Exercise, WorkoutSession, UserSettings } from '../types';
import { EXERCISE_LIBRARY } from '../constants';

export interface SubstituteOptions {
  /** The exercise ID being replaced */
  exerciseId: string;
  /** Current workout to exclude exercises from */
  currentWorkout?: WorkoutSession | null;
  /** User settings for equipment filtering */
  settings: UserSettings;
  /** All available exercises (library + custom) */
  allExercises: Exercise[];
  /** Whether to allow secondary muscle group matches */
  allowSecondaryMuscle?: boolean;
  /** Maximum number of results to return */
  limit?: number;
}

export interface SubstituteResult {
  exercises: Exercise[];
  /** Why these exercises were selected */
  matchType: 'exact' | 'secondary' | 'equipment_relaxed' | 'none';
  /** Debug info for troubleshooting */
  debug?: {
    totalExercises: number;
    afterMuscleFilter: number;
    afterExcludeFilter: number;
    afterEquipmentFilter: number;
    currentExercise?: Exercise;
    exercisesInWorkout: string[];
    availableEquipment: string[];
  };
}

/**
 * Find substitute exercises for a given exercise
 *
 * Priority:
 * 1. Same muscle group + same equipment type
 * 2. Same muscle group + different equipment (from user's available)
 * 3. Secondary muscle group match (if allowSecondaryMuscle)
 */
export function findSubstitutes(options: SubstituteOptions): SubstituteResult {
  const {
    exerciseId,
    currentWorkout,
    settings,
    allExercises,
    allowSecondaryMuscle = false,
    limit = 10,
  } = options;

  // Find current exercise in ALL exercises (library + custom)
  const currentEx = allExercises.find(e => e.id === exerciseId);

  if (!currentEx) {
    console.warn(`[ExerciseRecommendation] Exercise not found: ${exerciseId}`);
    return {
      exercises: [],
      matchType: 'none',
      debug: {
        totalExercises: allExercises.length,
        afterMuscleFilter: 0,
        afterExcludeFilter: 0,
        afterEquipmentFilter: 0,
        exercisesInWorkout: [],
        availableEquipment: settings.availableEquipment || [],
      }
    };
  }

  // Get exercise IDs already in the workout
  const exercisesInWorkout = currentWorkout?.logs.map(log => log.exerciseId) || [];

  // Ensure available equipment is an array
  const availableEquipment = settings.availableEquipment || [];

  // Step 1: Filter by PRIMARY muscle group
  let candidates = allExercises.filter(e =>
    e.muscleGroup.toLowerCase() === currentEx.muscleGroup.toLowerCase()
  );
  const afterMuscleFilter = candidates.length;

  // Step 2: Exclude current exercise and exercises already in workout
  candidates = candidates.filter(e =>
    e.id !== exerciseId &&
    !exercisesInWorkout.includes(e.id)
  );
  const afterExcludeFilter = candidates.length;

  // Step 3: Filter by available equipment
  let exactMatches = candidates.filter(e =>
    availableEquipment.some(eq =>
      eq.toLowerCase() === e.equipment.toLowerCase()
    )
  );
  const afterEquipmentFilter = exactMatches.length;

  // Build debug info
  const debug = {
    totalExercises: allExercises.length,
    afterMuscleFilter,
    afterExcludeFilter,
    afterEquipmentFilter,
    currentExercise: currentEx,
    exercisesInWorkout,
    availableEquipment,
  };

  // If we have exact matches, return them sorted by equipment similarity
  if (exactMatches.length > 0) {
    // Prioritize same equipment type first
    const sorted = exactMatches.sort((a, b) => {
      // Same equipment as current exercise gets priority
      const aEquipMatch = a.equipment.toLowerCase() === currentEx.equipment.toLowerCase() ? 0 : 1;
      const bEquipMatch = b.equipment.toLowerCase() === currentEx.equipment.toLowerCase() ? 0 : 1;
      if (aEquipMatch !== bEquipMatch) return aEquipMatch - bEquipMatch;

      // Then sort by category (Compound before Isolation)
      const categoryOrder = { Compound: 0, Isolation: 1, Cardio: 2, Machine: 1, Bodyweight: 1, Plyometric: 2 };
      const aOrder = categoryOrder[a.category as keyof typeof categoryOrder] ?? 2;
      const bOrder = categoryOrder[b.category as keyof typeof categoryOrder] ?? 2;
      return aOrder - bOrder;
    });

    return {
      exercises: sorted.slice(0, limit),
      matchType: 'exact',
      debug,
    };
  }

  // If no equipment matches, try relaxing equipment filter
  if (candidates.length > 0) {
    console.log(`[ExerciseRecommendation] No equipment matches, relaxing filter. Available equipment: ${availableEquipment.join(', ')}`);
    return {
      exercises: candidates.slice(0, limit),
      matchType: 'equipment_relaxed',
      debug,
    };
  }

  // If allowSecondaryMuscle, try matching on secondary muscles
  if (allowSecondaryMuscle && currentEx.secondaryMuscles?.length) {
    const secondaryMatches = allExercises.filter(e => {
      // Check if any of the current exercise's secondary muscles match
      const primaryMatch = currentEx.secondaryMuscles?.some(
        muscle => muscle.toLowerCase() === e.muscleGroup.toLowerCase()
      );
      const notInWorkout = e.id !== exerciseId && !exercisesInWorkout.includes(e.id);
      const hasEquipment = availableEquipment.some(eq =>
        eq.toLowerCase() === e.equipment.toLowerCase()
      );
      return primaryMatch && notInWorkout && hasEquipment;
    });

    if (secondaryMatches.length > 0) {
      return {
        exercises: secondaryMatches.slice(0, limit),
        matchType: 'secondary',
        debug,
      };
    }
  }

  // No matches found
  return {
    exercises: [],
    matchType: 'none',
    debug,
  };
}

/**
 * Get exercise recommendations for adding to a workout
 * Suggests exercises based on muscle groups not yet trained
 */
export function suggestExercisesForWorkout(options: {
  currentWorkout: WorkoutSession;
  settings: UserSettings;
  allExercises: Exercise[];
  targetMuscleGroup?: string;
  limit?: number;
}): Exercise[] {
  const { currentWorkout, settings, allExercises, targetMuscleGroup, limit = 5 } = options;

  const exercisesInWorkout = currentWorkout.logs.map(log => log.exerciseId);
  const musclesTrainedSet = new Set<string>();

  // Find what muscle groups are already in the workout
  currentWorkout.logs.forEach(log => {
    const exercise = allExercises.find(e => e.id === log.exerciseId);
    if (exercise) {
      musclesTrainedSet.add(exercise.muscleGroup.toLowerCase());
    }
  });

  // If target muscle group specified, filter to that
  let candidates = allExercises.filter(e => {
    const notInWorkout = !exercisesInWorkout.includes(e.id);
    const hasEquipment = settings.availableEquipment?.some(
      eq => eq.toLowerCase() === e.equipment.toLowerCase()
    ) ?? true;
    const matchesMuscle = targetMuscleGroup
      ? e.muscleGroup.toLowerCase() === targetMuscleGroup.toLowerCase()
      : true;
    return notInWorkout && hasEquipment && matchesMuscle;
  });

  // Prioritize exercises for untrained muscle groups
  if (!targetMuscleGroup) {
    candidates = candidates.sort((a, b) => {
      const aTrained = musclesTrainedSet.has(a.muscleGroup.toLowerCase()) ? 1 : 0;
      const bTrained = musclesTrainedSet.has(b.muscleGroup.toLowerCase()) ? 1 : 0;
      return aTrained - bTrained;
    });
  }

  return candidates.slice(0, limit);
}

/**
 * Check if two exercises are compatible for supersets
 */
export function areExercisesCompatibleForSuperset(
  exercise1Id: string,
  exercise2Id: string,
  allExercises: Exercise[]
): { compatible: boolean; reason?: string } {
  const ex1 = allExercises.find(e => e.id === exercise1Id);
  const ex2 = allExercises.find(e => e.id === exercise2Id);

  if (!ex1 || !ex2) {
    return { compatible: false, reason: 'Exercise not found' };
  }

  // Same muscle group = not ideal for superset (antagonist pairs are better)
  if (ex1.muscleGroup === ex2.muscleGroup) {
    return { compatible: true, reason: 'Same muscle group (compound set)' };
  }

  // Antagonist pairs are great for supersets
  const antagonistPairs: Record<string, string[]> = {
    'Chest': ['Back'],
    'Back': ['Chest'],
    'Shoulders': ['Back'],
    'Arms': ['Arms'], // Biceps/Triceps
    'Legs': ['Legs'], // Quads/Hamstrings
    'Core': ['Back'],
  };

  if (antagonistPairs[ex1.muscleGroup]?.includes(ex2.muscleGroup)) {
    return { compatible: true, reason: 'Antagonist superset (optimal)' };
  }

  return { compatible: true, reason: 'Different muscle groups' };
}
