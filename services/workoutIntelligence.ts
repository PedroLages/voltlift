/**
 * Advanced Workout Intelligence Service
 *
 * Phase 3 Feature: AI-powered workout planning assistance including:
 * - Exercise substitution based on equipment/injuries
 * - Weak point analysis from performance data
 * - Exercise variation recommendations
 * - Intelligent exercise selection for balanced programs
 */

import { WorkoutSession, Exercise, MuscleGroup, ExperienceLevel } from '../types';
import { EXERCISE_LIBRARY } from '../constants';
import { extractExerciseTimeSeries, extractVolumeTimeSeries, calculateTrend } from './analytics';
import { calculateVolumeLandmarks } from './volumeOptimization';

/**
 * Equipment categories for substitution matching
 */
export type EquipmentCategory =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'band';

/**
 * Movement pattern categories
 */
export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'push_horizontal'
  | 'push_vertical'
  | 'pull_horizontal'
  | 'pull_vertical'
  | 'carry'
  | 'isolation';

/**
 * Exercise substitution suggestion
 */
export interface ExerciseSubstitution {
  exercise: Exercise;
  similarity: number; // 0-1 (1 = perfect match)
  reason: string;
  equipmentMatch: boolean;
  muscleGroupMatch: boolean;
  difficultyMatch: boolean;
}

/**
 * Weak point detected from performance analysis
 */
export interface WeakPoint {
  type: 'muscle_group' | 'exercise' | 'strength_imbalance';
  muscleGroup?: MuscleGroup;
  exerciseId?: string;
  exerciseName?: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  recommendations: string[];
  metric?: number; // Quantitative measure of the weakness
}

/**
 * Analysis of user's weak points
 */
export interface WeakPointAnalysis {
  weakPoints: WeakPoint[];
  overallBalance: number; // 0-100 (100 = perfectly balanced)
  priorityAreas: MuscleGroup[];
  recommendations: string[];
}

/**
 * Exercise variation suggestion
 */
export interface VariationRecommendation {
  currentExercise: Exercise;
  suggestedVariation: Exercise;
  reason: string;
  weeksSinceVariation: number;
  isPlateaued: boolean;
}

/**
 * Find exercise substitutions based on criteria
 *
 * @param exerciseId - Exercise to substitute
 * @param availableEquipment - Equipment available to user
 * @param avoidMuscleGroups - Muscle groups to avoid (e.g., injured)
 * @param preferredDifficulty - Preferred difficulty level
 * @returns Ranked list of substitution options
 */
export function findExerciseSubstitutions(
  exerciseId: string,
  availableEquipment: string[] = [],
  avoidMuscleGroups: MuscleGroup[] = [],
  preferredDifficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
): ExerciseSubstitution[] {
  const originalExercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
  if (!originalExercise) return [];

  const substitutions: ExerciseSubstitution[] = [];

  // Get movement pattern of original exercise
  const originalPattern = inferMovementPattern(originalExercise);

  EXERCISE_LIBRARY.forEach(exercise => {
    // Don't suggest the same exercise
    if (exercise.id === exerciseId) return;

    // Skip exercises targeting avoided muscle groups
    if (avoidMuscleGroups.includes(exercise.muscleGroup)) return;
    if (exercise.secondaryMuscles?.some(m => avoidMuscleGroups.includes(m))) return;

    // Calculate similarity score
    let similarity = 0;
    let equipmentMatch = false;
    let muscleGroupMatch = false;
    let difficultyMatch = false;

    // Factor 1: Primary muscle group match (40 points)
    if (exercise.muscleGroup === originalExercise.muscleGroup) {
      similarity += 0.4;
      muscleGroupMatch = true;
    }

    // Factor 2: Movement pattern match (30 points)
    const exercisePattern = inferMovementPattern(exercise);
    if (exercisePattern === originalPattern) {
      similarity += 0.3;
    }

    // Factor 3: Equipment availability (20 points)
    const exerciseEquipment = inferEquipmentCategory(exercise);
    if (availableEquipment.length === 0 || availableEquipment.includes(exerciseEquipment)) {
      similarity += 0.2;
      equipmentMatch = true;
    }

    // Factor 4: Difficulty match (10 points)
    if (!preferredDifficulty || exercise.difficulty === preferredDifficulty) {
      similarity += 0.1;
      difficultyMatch = true;
    }

    // Only include substitutions with >30% similarity
    if (similarity >= 0.3) {
      let reason = '';
      if (muscleGroupMatch && exercisePattern === originalPattern) {
        reason = `Same muscle group (${exercise.muscleGroup}) and movement pattern`;
      } else if (muscleGroupMatch) {
        reason = `Targets ${exercise.muscleGroup}`;
      } else {
        reason = `Similar movement pattern (${exercisePattern})`;
      }

      if (equipmentMatch && availableEquipment.length > 0) {
        reason += ` | Uses available ${exerciseEquipment} equipment`;
      }

      substitutions.push({
        exercise,
        similarity,
        reason,
        equipmentMatch,
        muscleGroupMatch,
        difficultyMatch
      });
    }
  });

  // Sort by similarity score (highest first)
  return substitutions.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Analyze workout history to detect weak points
 *
 * @param history - All completed workouts
 * @param experienceLevel - User's training experience
 * @returns Weak point analysis with recommendations
 */
export function analyzeWeakPoints(
  history: WorkoutSession[],
  experienceLevel: ExperienceLevel = 'Intermediate'
): WeakPointAnalysis {
  const weakPoints: WeakPoint[] = [];
  const muscleGroups: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  // Factor 1: Detect undertrained muscle groups
  const volumeAnalysis = new Map<MuscleGroup, { sets: number; volume: number }>();

  muscleGroups.forEach(muscleGroup => {
    const volumeData = extractVolumeTimeSeries(muscleGroup, history, 4);
    if (volumeData.length === 0) {
      volumeAnalysis.set(muscleGroup, { sets: 0, volume: 0 });
      return;
    }

    // Average weekly sets over last 4 weeks
    const avgSets = volumeData.reduce((sum, week) => sum + week.sets, 0) / volumeData.length;
    const avgVolume = volumeData.reduce((sum, week) => sum + week.volume, 0) / volumeData.length;

    volumeAnalysis.set(muscleGroup, { sets: avgSets, volume: avgVolume });

    // Check if undertrained
    const landmarks = calculateVolumeLandmarks(muscleGroup, history, experienceLevel);

    if (avgSets < landmarks.mev * 0.8) {
      const severity: 'minor' | 'moderate' | 'severe' =
        avgSets < landmarks.mev * 0.5 ? 'severe' :
        avgSets < landmarks.mev * 0.7 ? 'moderate' : 'minor';

      weakPoints.push({
        type: 'muscle_group',
        muscleGroup,
        severity,
        description: `${muscleGroup} undertrained - ${avgSets.toFixed(0)} sets/week vs MEV of ${landmarks.mev}`,
        recommendations: [
          `Increase ${muscleGroup} volume to ${landmarks.mev}-${landmarks.mav} sets/week`,
          `Add 1-2 more ${muscleGroup} exercises`,
          `Focus on compound movements for ${muscleGroup}`
        ],
        metric: avgSets
      });
    }
  });

  // Factor 2: Detect strength imbalances (push vs pull)
  const chestData = volumeAnalysis.get('Chest');
  const backData = volumeAnalysis.get('Back');

  if (chestData && backData && chestData.sets > 0 && backData.sets > 0) {
    const pushPullRatio = chestData.sets / backData.sets;

    // Healthy ratio is 0.8-1.2 (pull should be slightly higher)
    if (pushPullRatio > 1.3) {
      weakPoints.push({
        type: 'strength_imbalance',
        severity: pushPullRatio > 1.5 ? 'moderate' : 'minor',
        description: `Push/pull imbalance - ${pushPullRatio.toFixed(1)}:1 ratio (chest:back)`,
        recommendations: [
          'Increase back training volume',
          'Add more horizontal pulls (rows)',
          'Reduce chest volume or increase back to balance'
        ],
        metric: pushPullRatio
      });
    } else if (pushPullRatio < 0.6) {
      weakPoints.push({
        type: 'strength_imbalance',
        severity: pushPullRatio < 0.5 ? 'moderate' : 'minor',
        description: `Push/pull imbalance - ${pushPullRatio.toFixed(1)}:1 ratio (chest:back)`,
        recommendations: [
          'Increase chest training volume',
          'Add more horizontal presses',
          'Balance push and pull exercises'
        ],
        metric: pushPullRatio
      });
    }
  }

  // Factor 3: Detect stagnant exercises (no progress in 8+ weeks)
  const stagnantExercises = findStagnantExercises(history, 8);

  stagnantExercises.forEach(({ exerciseId, exerciseName, weeksSincePR }) => {
    weakPoints.push({
      type: 'exercise',
      exerciseId,
      exerciseName,
      severity: weeksSincePR >= 12 ? 'moderate' : 'minor',
      description: `${exerciseName} - no progress in ${weeksSincePR} weeks`,
      recommendations: [
        `Try a variation of ${exerciseName}`,
        'Increase volume or change rep range',
        'Check form - video yourself',
        'Consider a deload week'
      ],
      metric: weeksSincePR
    });
  });

  // Calculate overall balance score
  const overallBalance = calculateBalanceScore(volumeAnalysis, muscleGroups);

  // Determine priority areas (most undertrained)
  const priorityAreas = muscleGroups
    .filter(mg => {
      const data = volumeAnalysis.get(mg);
      const landmarks = calculateVolumeLandmarks(mg, history, experienceLevel);
      return data && data.sets < landmarks.mev;
    })
    .sort((a, b) => {
      const aData = volumeAnalysis.get(a)!;
      const bData = volumeAnalysis.get(b)!;
      return aData.sets - bData.sets; // Lowest volume first
    })
    .slice(0, 3); // Top 3 priorities

  // Generate overall recommendations
  const recommendations: string[] = [];

  if (weakPoints.length === 0) {
    recommendations.push('✅ Training is well-balanced! Keep up the great work.');
  } else {
    const criticalWeakPoints = weakPoints.filter(wp => wp.severity === 'moderate' || wp.severity === 'severe');
    if (criticalWeakPoints.length > 0) {
      recommendations.push(`🎯 Focus on ${criticalWeakPoints.length} critical weak point(s) first`);
    }

    if (priorityAreas.length > 0) {
      recommendations.push(`📈 Priority muscle groups: ${priorityAreas.join(', ')}`);
    }

    const hasImbalance = weakPoints.some(wp => wp.type === 'strength_imbalance');
    if (hasImbalance) {
      recommendations.push('⚖️ Address push/pull imbalance to prevent injury');
    }
  }

  return {
    weakPoints,
    overallBalance,
    priorityAreas,
    recommendations
  };
}

/**
 * Suggest exercise variations to prevent plateaus
 *
 * @param history - All completed workouts
 * @param weeksThreshold - Weeks before suggesting variation (default 8)
 * @returns Array of variation recommendations
 */
export function suggestExerciseVariations(
  history: WorkoutSession[],
  weeksThreshold: number = 8
): VariationRecommendation[] {
  const recommendations: VariationRecommendation[] = [];

  // Get all exercises performed in last 12 weeks
  const recentExercises = getRecentExercises(history, 12);

  recentExercises.forEach(({ exerciseId, exerciseName, firstPerformed, lastPerformed, totalSessions }) => {
    const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
    if (!exercise) return;

    const weeksSinceFirst = Math.floor((Date.now() - firstPerformed) / (7 * 24 * 60 * 60 * 1000));
    const weeksSinceLast = Math.floor((Date.now() - lastPerformed) / (7 * 24 * 60 * 60 * 1000));

    // Only recommend variations for exercises performed consistently
    if (totalSessions < 3 || weeksSinceLast > 4) return;

    // Check if exercise is plateaued
    const timeSeries = extractExerciseTimeSeries(exerciseId, history, 12);
    const { slopePerWeek } = calculateTrend(timeSeries.dataPoints);
    const isPlateaued = slopePerWeek < 0.5;

    // Suggest variation if:
    // 1. Exercise has been done for 8+ weeks, OR
    // 2. Exercise is plateaued after 4+ weeks
    const shouldVary = weeksSinceFirst >= weeksThreshold || (isPlateaued && weeksSinceFirst >= 4);

    if (shouldVary) {
      // Find similar exercises as variations
      const variations = findExerciseSubstitutions(exerciseId, [], [], exercise.difficulty);

      if (variations.length > 0) {
        const bestVariation = variations[0].exercise;

        let reason = '';
        if (isPlateaued) {
          reason = `Progress stalled (${slopePerWeek.toFixed(1)}lbs/week). Try this variation to break through.`;
        } else {
          reason = `Been doing this ${weeksSinceFirst} weeks. Variation prevents overuse and renews progress.`;
        }

        recommendations.push({
          currentExercise: exercise,
          suggestedVariation: bestVariation,
          reason,
          weeksSinceVariation: weeksSinceFirst,
          isPlateaued
        });
      }
    }
  });

  // Sort: plateaued exercises first, then by weeks since variation
  return recommendations.sort((a, b) => {
    if (a.isPlateaued && !b.isPlateaued) return -1;
    if (!a.isPlateaued && b.isPlateaued) return 1;
    return b.weeksSinceVariation - a.weeksSinceVariation;
  });
}

/**
 * Select exercises intelligently for a balanced program
 *
 * @param targetMuscleGroups - Muscle groups to cover
 * @param sessionCount - Number of sessions per week
 * @param experienceLevel - User's training level
 * @param availableEquipment - Equipment available
 * @returns Array of recommended exercises per session
 */
export function selectBalancedExercises(
  targetMuscleGroups: MuscleGroup[],
  sessionCount: number,
  experienceLevel: ExperienceLevel = 'Intermediate',
  availableEquipment: string[] = []
): Exercise[][] {
  const sessions: Exercise[][] = [];

  // Strategy: Full-body or upper/lower split based on session count
  if (sessionCount <= 3) {
    // Full-body approach (all muscle groups each session)
    for (let i = 0; i < sessionCount; i++) {
      const sessionExercises: Exercise[] = [];

      targetMuscleGroups.forEach(muscleGroup => {
        // Pick 1-2 exercises per muscle group per session
        const exercisesForMuscle = EXERCISE_LIBRARY.filter(e => {
          const equipmentMatch = availableEquipment.length === 0 ||
            availableEquipment.includes(inferEquipmentCategory(e));
          const difficultyMatch = e.difficulty === experienceLevel ||
            (experienceLevel === 'Intermediate' && e.difficulty === 'Beginner');
          return e.muscleGroup === muscleGroup && equipmentMatch && difficultyMatch;
        });

        // Prioritize compound movements
        exercisesForMuscle.sort((a, b) => {
          const aCompound = isCompoundMovement(a);
          const bCompound = isCompoundMovement(b);
          if (aCompound && !bCompound) return -1;
          if (!aCompound && bCompound) return 1;
          return 0;
        });

        // Take top 1-2 exercises
        const exerciseCount = ['Legs', 'Back'].includes(muscleGroup) ? 2 : 1;
        sessionExercises.push(...exercisesForMuscle.slice(0, exerciseCount));
      });

      sessions.push(sessionExercises);
    }
  } else {
    // Upper/lower or push/pull/legs split
    const splitType = sessionCount >= 5 ? 'ppl' : 'ul';

    if (splitType === 'ul') {
      // Upper/Lower split (4 sessions)
      const upperMuscles = targetMuscleGroups.filter(mg => ['Chest', 'Back', 'Shoulders', 'Arms'].includes(mg));
      const lowerMuscles = targetMuscleGroups.filter(mg => ['Legs', 'Core'].includes(mg));

      // 2 upper days
      for (let i = 0; i < 2; i++) {
        const upperExercises: Exercise[] = [];
        upperMuscles.forEach(mg => {
          const exercises = EXERCISE_LIBRARY.filter(e => e.muscleGroup === mg);
          upperExercises.push(...exercises.slice(0, 2));
        });
        sessions.push(upperExercises);
      }

      // 2 lower days
      for (let i = 0; i < 2; i++) {
        const lowerExercises: Exercise[] = [];
        lowerMuscles.forEach(mg => {
          const exercises = EXERCISE_LIBRARY.filter(e => e.muscleGroup === mg);
          lowerExercises.push(...exercises.slice(0, mg === 'Legs' ? 3 : 2));
        });
        sessions.push(lowerExercises);
      }
    } else {
      // Push/Pull/Legs (6 sessions)
      // Push day
      sessions.push(EXERCISE_LIBRARY.filter(e => ['Chest', 'Shoulders'].includes(e.muscleGroup)).slice(0, 6));
      // Pull day
      sessions.push(EXERCISE_LIBRARY.filter(e => e.muscleGroup === 'Back').slice(0, 6));
      // Legs day
      sessions.push(EXERCISE_LIBRARY.filter(e => ['Legs', 'Core'].includes(e.muscleGroup)).slice(0, 6));

      // Repeat the split for additional sessions
      while (sessions.length < sessionCount) {
        sessions.push(...sessions.slice(0, Math.min(3, sessionCount - sessions.length)));
      }
    }
  }

  return sessions.slice(0, sessionCount);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Infer movement pattern from exercise name and muscle group
 */
function inferMovementPattern(exercise: Exercise): MovementPattern {
  const name = exercise.name.toLowerCase();
  const id = exercise.id.toLowerCase();

  // Squat pattern
  if (name.includes('squat') || id.includes('squat')) return 'squat';

  // Hinge pattern (deadlifts, RDLs)
  if (name.includes('deadlift') || name.includes('rdl') || id.includes('deadlift')) return 'hinge';

  // Push horizontal (bench, pushups)
  if ((name.includes('bench') || name.includes('press') || name.includes('pushup') || name.includes('push-up')) &&
      (exercise.muscleGroup === 'Chest' || name.includes('chest'))) {
    return 'push_horizontal';
  }

  // Push vertical (overhead press)
  if ((name.includes('press') || name.includes('raise')) && exercise.muscleGroup === 'Shoulders') {
    return 'push_vertical';
  }

  // Pull horizontal (rows)
  if (name.includes('row') || id.includes('row')) return 'pull_horizontal';

  // Pull vertical (pullups, lat pulldowns)
  if (name.includes('pull') || name.includes('pulldown') || name.includes('chin')) return 'pull_vertical';

  // Isolation (curls, extensions, flies)
  if (name.includes('curl') || name.includes('extension') || name.includes('fly') ||
      name.includes('raise') || name.includes('flye')) {
    return 'isolation';
  }

  // Default to isolation
  return 'isolation';
}

/**
 * Infer equipment category from exercise name
 */
function inferEquipmentCategory(exercise: Exercise): EquipmentCategory {
  const name = exercise.name.toLowerCase();
  const id = exercise.id.toLowerCase();

  if (name.includes('barbell') || id.includes('barbell')) return 'barbell';
  if (name.includes('dumbbell') || id.includes('dumbbell')) return 'dumbbell';
  if (name.includes('cable') || id.includes('cable')) return 'cable';
  if (name.includes('machine') || id.includes('machine')) return 'machine';
  if (name.includes('bodyweight') || name.includes('push-up') || name.includes('pull-up') ||
      name.includes('dip') || id.includes('bodyweight')) return 'bodyweight';
  if (name.includes('band') || id.includes('band')) return 'band';

  // Default based on muscle group patterns
  if (exercise.muscleGroup === 'Legs' && name.includes('squat')) return 'barbell';
  return 'dumbbell'; // Default fallback
}

/**
 * Check if exercise is a compound movement
 */
function isCompoundMovement(exercise: Exercise): boolean {
  const compoundPatterns = ['squat', 'deadlift', 'bench', 'press', 'row', 'pull', 'dip', 'lunge'];
  const name = exercise.name.toLowerCase();
  return compoundPatterns.some(pattern => name.includes(pattern)) ||
         (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0);
}

/**
 * Find exercises with no progress in recent weeks
 */
function findStagnantExercises(
  history: WorkoutSession[],
  weeksThreshold: number
): { exerciseId: string; exerciseName: string; weeksSincePR: number }[] {
  const stagnant: { exerciseId: string; exerciseName: string; weeksSincePR: number }[] = [];
  const recentExercises = getRecentExercises(history, weeksThreshold + 4);

  recentExercises.forEach(({ exerciseId, exerciseName, totalSessions }) => {
    // Only check exercises performed consistently (3+ times)
    if (totalSessions < 3) return;

    const timeSeries = extractExerciseTimeSeries(exerciseId, history, weeksThreshold + 4);
    if (timeSeries.dataPoints.length < 3) return;

    // Find current PR
    const currentPR = Math.max(...timeSeries.dataPoints.map(p => p.estimated1RM));

    // Find when user last hit a PR (within 5lbs)
    let weeksSincePR = 0;
    for (let i = timeSeries.dataPoints.length - 1; i >= 0; i--) {
      const point = timeSeries.dataPoints[i];
      if (point.estimated1RM >= currentPR - 5) {
        weeksSincePR = Math.floor((Date.now() - point.date) / (7 * 24 * 60 * 60 * 1000));
        break;
      }
    }

    if (weeksSincePR >= weeksThreshold) {
      stagnant.push({ exerciseId, exerciseName, weeksSincePR });
    }
  });

  return stagnant.sort((a, b) => b.weeksSincePR - a.weeksSincePR);
}

/**
 * Get list of recently performed exercises
 */
function getRecentExercises(
  history: WorkoutSession[],
  weeksBack: number
): { exerciseId: string; exerciseName: string; firstPerformed: number; lastPerformed: number; totalSessions: number }[] {
  const cutoffDate = Date.now() - (weeksBack * 7 * 24 * 60 * 60 * 1000);
  const exerciseMap = new Map<string, { first: number; last: number; count: number; name: string }>();

  history
    .filter(w => w.status === 'completed' && w.startTime >= cutoffDate)
    .forEach(workout => {
      workout.logs.forEach(log => {
        const existing = exerciseMap.get(log.exerciseId);
        const exercise = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);

        if (existing) {
          existing.first = Math.min(existing.first, workout.startTime);
          existing.last = Math.max(existing.last, workout.startTime);
          existing.count++;
        } else {
          exerciseMap.set(log.exerciseId, {
            first: workout.startTime,
            last: workout.startTime,
            count: 1,
            name: exercise?.name || log.exerciseId
          });
        }
      });
    });

  return Array.from(exerciseMap.entries()).map(([exerciseId, data]) => ({
    exerciseId,
    exerciseName: data.name,
    firstPerformed: data.first,
    lastPerformed: data.last,
    totalSessions: data.count
  }));
}

/**
 * Calculate overall training balance score
 */
function calculateBalanceScore(
  volumeAnalysis: Map<MuscleGroup, { sets: number; volume: number }>,
  muscleGroups: MuscleGroup[]
): number {
  if (muscleGroups.length === 0) return 100;

  const volumes = muscleGroups.map(mg => volumeAnalysis.get(mg)?.sets || 0);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

  if (avgVolume === 0) return 0;

  // Calculate coefficient of variation (std dev / mean)
  const variance = volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avgVolume;

  // Lower CV = better balance
  // CV < 0.3 = excellent (score 90-100)
  // CV 0.3-0.5 = good (score 70-90)
  // CV 0.5-0.8 = fair (score 50-70)
  // CV > 0.8 = poor (score 0-50)
  let score = 0;
  if (cv < 0.3) {
    score = 100 - (cv / 0.3) * 10;
  } else if (cv < 0.5) {
    score = 90 - ((cv - 0.3) / 0.2) * 20;
  } else if (cv < 0.8) {
    score = 70 - ((cv - 0.5) / 0.3) * 20;
  } else {
    score = Math.max(0, 50 - ((cv - 0.8) / 0.5) * 50);
  }

  return Math.round(score);
}

/**
 * Get quick exercise substitution for injured muscle
 */
export function getQuickSubstitution(
  exerciseId: string,
  injuredMuscle: MuscleGroup
): Exercise | null {
  const substitutions = findExerciseSubstitutions(exerciseId, [], [injuredMuscle]);
  return substitutions.length > 0 ? substitutions[0].exercise : null;
}

/**
 * Get top weak point to focus on
 */
export function getTopWeakPoint(
  history: WorkoutSession[],
  experienceLevel: ExperienceLevel = 'Intermediate'
): string {
  const analysis = analyzeWeakPoints(history, experienceLevel);
  if (analysis.weakPoints.length === 0) {
    return 'No weak points detected - training is balanced!';
  }

  const topWeakPoint = analysis.weakPoints[0];
  return topWeakPoint.description;
}
