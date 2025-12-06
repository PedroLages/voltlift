/**
 * Percentage-Based Programming Calculator Utilities
 *
 * Handles Training Max calculations, 1RM estimation, percentage-based weight calculations,
 * AMAP progression logic, and plate math for Greg Nuckols programs.
 */

import { AMAPProgressionTable } from '../types';

// ============================================
// 1RM Estimation Formulas
// ============================================

/**
 * Estimate 1 Rep Max using various formulas
 * @param weight Weight lifted
 * @param reps Reps performed
 * @param formula Formula to use
 * @returns Estimated 1RM
 */
export function estimate1RM(
  weight: number,
  reps: number,
  formula: 'Epley' | 'Brzycki' | 'Wendler' = 'Epley'
): number {
  if (reps === 1) return weight;
  if (reps < 1 || reps > 12) {
    console.warn('1RM estimation is most accurate for 1-12 reps');
  }

  switch (formula) {
    case 'Epley':
      // Epley: 1RM = weight × (1 + reps/30)
      return weight * (1 + reps / 30);

    case 'Brzycki':
      // Brzycki: 1RM = weight × (36 / (37 - reps))
      return weight * (36 / (37 - reps));

    case 'Wendler':
      // Wendler (simplified): 1RM = weight × reps × 0.0333 + weight
      return weight * reps * 0.0333 + weight;

    default:
      return estimate1RM(weight, reps, 'Epley');
  }
}

// ============================================
// Training Max Calculations
// ============================================

/**
 * Calculate Training Max from 1RM
 * @param oneRM Estimated or tested 1RM
 * @param multiplier TM multiplier (default 0.90 = 90% of 1RM)
 * @returns Training Max
 */
export function calculateTrainingMax(oneRM: number, multiplier: number = 0.90): number {
  return Math.round(oneRM * multiplier);
}

/**
 * Calculate working weight from Training Max and percentage
 * @param trainingMax Training Max value
 * @param percentage Percentage of TM (70, 75, 80, etc.)
 * @param roundTo Round to nearest value (default 2.5 lbs)
 * @returns Calculated working weight
 */
export function calculateWorkingWeight(
  trainingMax: number,
  percentage: number,
  roundTo: number = 2.5
): number {
  const raw = trainingMax * (percentage / 100);
  return Math.round(raw / roundTo) * roundTo;
}

// ============================================
// Plate Math
// ============================================

/**
 * Round weight to achievable value based on available plates
 * @param weight Target weight
 * @param barWeight Weight of the bar
 * @param availablePlates Available plate denominations (sorted descending)
 * @returns Rounded weight achievable with available plates
 */
export function roundToPlates(
  weight: number,
  barWeight: number,
  availablePlates: number[]
): number {
  // Weight to load on ONE SIDE of the bar
  const perSide = (weight - barWeight) / 2;

  if (perSide <= 0) return barWeight;

  // Greedy algorithm: use largest plates first
  const sorted = [...availablePlates].sort((a, b) => b - a);
  let loaded = 0;
  const plates: number[] = [];

  for (const plate of sorted) {
    while (loaded + plate <= perSide) {
      loaded += plate;
      plates.push(plate);
    }
  }

  // Total = bar + 2 × (loaded per side)
  return barWeight + loaded * 2;
}

/**
 * Get plate configuration for a target weight
 * @param weight Target weight
 * @param barWeight Weight of the bar
 * @param availablePlates Available plate denominations
 * @returns Array of plates to load PER SIDE
 */
export function getPlateConfiguration(
  weight: number,
  barWeight: number,
  availablePlates: number[]
): number[] {
  const perSide = (weight - barWeight) / 2;

  if (perSide <= 0) return [];

  const sorted = [...availablePlates].sort((a, b) => b - a);
  let loaded = 0;
  const plates: number[] = [];

  for (const plate of sorted) {
    while (loaded + plate <= perSide) {
      loaded += plate;
      plates.push(plate);
    }
  }

  return plates;
}

// ============================================
// AMAP Progression Tables
// ============================================

/**
 * Greg Nuckols AMAP Progression Tables
 * Based on performance in AMAP (As Many As Possible) sets at 85% of Training Max
 */

export const GN_AMAP_SQUAT_PROGRESSION: AMAPProgressionTable = [
  { minReps: 10, weightIncrease: 10, description: 'Excellent - Add 10lbs' },
  { minReps: 7, maxReps: 9, weightIncrease: 5, description: 'Great - Add 5lbs' },
  { minReps: 5, maxReps: 6, weightIncrease: 0, description: 'Good - Maintain TM' },
  { minReps: 0, maxReps: 4, weightIncrease: -5, description: 'Reduce TM by 5lbs' },
];

export const GN_AMAP_BENCH_PROGRESSION: AMAPProgressionTable = [
  { minReps: 10, weightIncrease: 10, description: 'Excellent - Add 10lbs' },
  { minReps: 7, maxReps: 9, weightIncrease: 5, description: 'Great - Add 5lbs' },
  { minReps: 5, maxReps: 6, weightIncrease: 0, description: 'Good - Maintain TM' },
  { minReps: 0, maxReps: 4, weightIncrease: -5, description: 'Reduce TM by 5lbs' },
];

export const GN_AMAP_DEADLIFT_PROGRESSION: AMAPProgressionTable = [
  { minReps: 10, weightIncrease: 15, description: 'Excellent - Add 15lbs' },
  { minReps: 7, maxReps: 9, weightIncrease: 10, description: 'Great - Add 10lbs' },
  { minReps: 5, maxReps: 6, weightIncrease: 5, description: 'Good - Add 5lbs' },
  { minReps: 0, maxReps: 4, weightIncrease: 0, description: 'Maintain TM' },
];

/**
 * Get AMAP progression based on reps achieved
 * @param table AMAP progression table
 * @param repsAchieved Number of reps achieved in AMAP set
 * @returns Weight increase recommendation
 */
export function getAMAPProgression(
  table: AMAPProgressionTable,
  repsAchieved: number
): number {
  for (const rule of table) {
    const meetsMin = repsAchieved >= rule.minReps;
    const meetsMax = rule.maxReps === undefined || repsAchieved <= rule.maxReps;

    if (meetsMin && meetsMax) {
      return rule.weightIncrease;
    }
  }

  // Fallback: maintain
  return 0;
}

/**
 * Get AMAP progression description
 * @param table AMAP progression table
 * @param repsAchieved Number of reps achieved in AMAP set
 * @returns Performance description
 */
export function getAMAPDescription(
  table: AMAPProgressionTable,
  repsAchieved: number
): string {
  for (const rule of table) {
    const meetsMin = repsAchieved >= rule.minReps;
    const meetsMax = rule.maxReps === undefined || repsAchieved <= rule.maxReps;

    if (meetsMin && meetsMax) {
      return rule.description || 'Maintain TM';
    }
  }

  return 'Maintain TM';
}

// ============================================
// Advanced TM Adjustment (AI-Enhanced)
// ============================================

export interface PerformanceData {
  amapReps?: number;
  completedAllSets: boolean;
  missedSets?: number;
  averageRPE?: number;
  recentSleep?: number; // hours per night
  recentStress?: number; // 1-10 scale
}

/**
 * Calculate new Training Max based on performance data
 * Falls back to standard AMAP progression if AI not available
 * @param currentTM Current Training Max
 * @param exerciseId Exercise ID (for AMAP table lookup)
 * @param data Performance data
 * @returns Recommended new Training Max
 */
export function calculateNewTrainingMax(
  currentTM: number,
  exerciseId: string,
  data: PerformanceData
): number {
  // Determine AMAP table based on exercise
  let amapTable: AMAPProgressionTable;

  if (exerciseId === 'e4') { // Squat
    amapTable = GN_AMAP_SQUAT_PROGRESSION;
  } else if (exerciseId === 'e1') { // Bench
    amapTable = GN_AMAP_BENCH_PROGRESSION;
  } else if (exerciseId === 'e5') { // Deadlift
    amapTable = GN_AMAP_DEADLIFT_PROGRESSION;
  } else {
    amapTable = GN_AMAP_SQUAT_PROGRESSION; // Default
  }

  // Standard AMAP progression
  const amapReps = data.amapReps || 0;
  const baseIncrease = getAMAPProgression(amapTable, amapReps);

  // Apply recovery modifiers (if data available)
  let modifier = 1.0;

  // Poor sleep → reduce increase
  if (data.recentSleep && data.recentSleep < 6) {
    modifier *= 0.75;
  }

  // High stress → reduce increase
  if (data.recentStress && data.recentStress > 7) {
    modifier *= 0.8;
  }

  // Missed sets → reduce increase
  if (data.missedSets && data.missedSets > 0) {
    modifier *= 0.5;
  }

  // High RPE (>8.5 average) → reduce increase
  if (data.averageRPE && data.averageRPE > 8.5) {
    modifier *= 0.7;
  }

  const adjustedIncrease = Math.round(baseIncrease * modifier);
  return currentTM + adjustedIncrease;
}

// ============================================
// Percentage Scheme Helpers
// ============================================

/**
 * Get percentage scheme for a given week
 * @param week Week number (1-4)
 * @param program Program type
 * @returns Array of percentages for that week
 */
export function getWeekPercentages(
  week: number,
  program: 'beginner' | 'intermediate' = 'beginner'
): number[] {
  if (program === 'beginner') {
    switch (week) {
      case 1: return [70, 75, 80]; // Build week
      case 2: return [75, 80, 85]; // Peak week
      case 3: return [70, 75, 80, 85]; // AMAP week (last set is AMAP)
      case 4: return [60, 60]; // Deload week
      default: return [70, 75, 80];
    }
  }

  // Intermediate has more volume
  switch (week) {
    case 1: return [70, 75, 80, 80];
    case 2: return [75, 80, 85, 85];
    case 3: return [70, 75, 80, 80, 85]; // Last set AMAP
    case 4: return [60, 65];
    default: return [70, 75, 80, 80];
  }
}
