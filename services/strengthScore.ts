/**
 * Strength Score & 1RM Calculation Service
 *
 * Research-backed formulas for tracking strength progression.
 *
 * Key Features:
 * - 1RM estimation (Epley formula - most accurate for 1-10 rep range)
 * - Strength standards (Beginner/Intermediate/Advanced classification)
 * - Normalized strength score for cross-exercise comparison
 * - Percentages for programming (e.g., "work at 80% of 1RM")
 */

import { SetLog, ExercisePRHistory, PersonalRecord } from '../types';
import { EXERCISE_LIBRARY } from '../constants';

export type StrengthLevel = 'Untrained' | 'Novice' | 'Intermediate' | 'Advanced' | 'Elite';

export interface OneRepMax {
  estimated1RM: number;
  fromWeight: number;
  fromReps: number;
  formula: 'epley' | 'brzycki' | 'actual';
}

export interface StrengthStandard {
  exerciseId: string;
  exerciseName: string;
  current1RM: number;
  level: StrengthLevel;
  nextLevelTarget: number;
  percentToNextLevel: number;
}

/**
 * Calculate estimated 1RM using Epley formula
 * Most accurate for 1-10 rep range
 *
 * Formula: 1RM = Weight × (1 + Reps / 30)
 *
 * Alternative formulas (for reference):
 * - Brzycki: 1RM = Weight × (36 / (37 - Reps))
 * - Lander: 1RM = (100 × Weight) / (101.3 - 2.67123 × Reps)
 */
export function calculate1RM(weight: number, reps: number): OneRepMax {
  if (reps === 1) {
    return {
      estimated1RM: weight,
      fromWeight: weight,
      fromReps: 1,
      formula: 'actual'
    };
  }

  if (reps > 12) {
    // Epley becomes less accurate above 12 reps
    // Use Brzycki formula instead
    const brzycki1RM = weight * (36 / (37 - reps));
    return {
      estimated1RM: Math.round(brzycki1RM),
      fromWeight: weight,
      fromReps: reps,
      formula: 'brzycki'
    };
  }

  // Epley formula (gold standard for 1-10 reps)
  const epley1RM = weight * (1 + reps / 30);

  return {
    estimated1RM: Math.round(epley1RM),
    fromWeight: weight,
    fromReps: reps,
    formula: 'epley'
  };
}

/**
 * Get best estimated 1RM from a set of completed sets
 * Uses the heaviest working set (excluding warmups)
 */
export function getBest1RM(sets: SetLog[]): OneRepMax | null {
  const workingSets = sets.filter(s => s.completed && s.type !== 'W' && s.weight > 0);

  if (workingSets.length === 0) return null;

  // Find the set with highest estimated 1RM
  const estimates = workingSets.map(set => calculate1RM(set.weight, set.reps));

  return estimates.reduce((best, current) =>
    current.estimated1RM > best.estimated1RM ? current : best
  );
}

/**
 * Calculate percentage of 1RM for programming
 * Example: "Work at 80% of your 1RM" = calculate1RMPercentage(oneRepMax, 0.80)
 */
export function calculate1RMPercentage(oneRM: number, percentage: number): number {
  return Math.round(oneRM * percentage);
}

/**
 * Suggest reps for given percentage of 1RM
 * Based on Prilepin's Table (strength training research)
 *
 * Rep ranges by intensity:
 * - 55-65%: 3-6 reps (volume work)
 * - 70-80%: 3-6 reps (hypertrophy)
 * - 80-90%: 2-4 reps (strength)
 * - 90-100%: 1-2 reps (max strength/peaking)
 */
export function suggestRepsForPercentage(percentage: number): [number, number] {
  if (percentage >= 0.90) return [1, 2]; // Max strength
  if (percentage >= 0.80) return [2, 4]; // Strength
  if (percentage >= 0.70) return [4, 6]; // Hypertrophy
  if (percentage >= 0.55) return [6, 10]; // Volume
  return [8, 12]; // Light/technique work
}

/**
 * Strength standards for major compound lifts
 * Based on bodyweight ratios (Strengthlevel.com data)
 *
 * Standards are per bodyweight multipliers
 * Example: 200lb male, Intermediate bench = 1.3x = 260lbs
 */
const STRENGTH_STANDARDS: Record<
  string,
  {
    male: { untrained: number; novice: number; intermediate: number; advanced: number; elite: number };
    female: { untrained: number; novice: number; intermediate: number; advanced: number; elite: number };
  }
> = {
  // Bench Press (barbell)
  'bench-press': {
    male: { untrained: 0.5, novice: 0.75, intermediate: 1.25, advanced: 1.75, elite: 2.25 },
    female: { untrained: 0.3, novice: 0.5, intermediate: 0.75, advanced: 1.25, elite: 1.5 }
  },
  // Squat (barbell back)
  'barbell-squat': {
    male: { untrained: 0.75, novice: 1.25, intermediate: 1.75, advanced: 2.5, elite: 3.25 },
    female: { untrained: 0.5, novice: 0.75, intermediate: 1.25, advanced: 1.75, elite: 2.25 }
  },
  // Deadlift
  'deadlift': {
    male: { untrained: 1.0, novice: 1.5, intermediate: 2.0, advanced: 2.75, elite: 3.5 },
    female: { untrained: 0.5, novice: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.75 }
  },
  // Overhead Press
  'overhead-press': {
    male: { untrained: 0.4, novice: 0.6, intermediate: 0.9, advanced: 1.25, elite: 1.6 },
    female: { untrained: 0.25, novice: 0.4, intermediate: 0.6, advanced: 0.9, elite: 1.2 }
  }
};

/**
 * Classify strength level based on 1RM and bodyweight
 * Returns strength level and progress to next level
 */
export function classifyStrengthLevel(
  exerciseId: string,
  oneRM: number,
  bodyweight: number,
  gender: 'male' | 'female' = 'male'
): StrengthStandard | null {
  const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
  if (!exercise) return null;

  const standards = STRENGTH_STANDARDS[exerciseId];
  if (!standards) {
    // Exercise not in standards database
    return null;
  }

  const ratio = oneRM / bodyweight;
  const levels = standards[gender];

  let level: StrengthLevel = 'Untrained';
  let nextLevelTarget = levels.novice * bodyweight;

  if (ratio >= levels.elite) {
    level = 'Elite';
    nextLevelTarget = oneRM; // Already at top
  } else if (ratio >= levels.advanced) {
    level = 'Advanced';
    nextLevelTarget = levels.elite * bodyweight;
  } else if (ratio >= levels.intermediate) {
    level = 'Intermediate';
    nextLevelTarget = levels.advanced * bodyweight;
  } else if (ratio >= levels.novice) {
    level = 'Novice';
    nextLevelTarget = levels.intermediate * bodyweight;
  } else {
    level = 'Untrained';
    nextLevelTarget = levels.novice * bodyweight;
  }

  const percentToNextLevel = level === 'Elite'
    ? 100
    : Math.round((oneRM / nextLevelTarget) * 100);

  return {
    exerciseId,
    exerciseName: exercise.name,
    current1RM: oneRM,
    level,
    nextLevelTarget: Math.round(nextLevelTarget),
    percentToNextLevel
  };
}

/**
 * Calculate overall strength score (normalized across exercises)
 * Higher score = stronger relative to bodyweight across all lifts
 *
 * Useful for:
 * - Tracking overall progress over time
 * - Comparing strength across different exercises
 * - Identifying weak points (e.g., "Your squat is Elite but bench is Novice")
 */
export function calculateOverallStrengthScore(
  personalRecords: Record<string, ExercisePRHistory>,
  bodyweight: number,
  gender: 'male' | 'female' = 'male'
): number {
  const majorLifts = ['bench-press', 'barbell-squat', 'deadlift', 'overhead-press'];

  let totalScore = 0;
  let liftsTracked = 0;

  majorLifts.forEach(exerciseId => {
    const prHistory = personalRecords[exerciseId];
    if (!prHistory?.bestWeight) return;

    const oneRM = calculate1RM(prHistory.bestWeight.value, prHistory.bestWeight.reps || 1);
    const classification = classifyStrengthLevel(exerciseId, oneRM.estimated1RM, bodyweight, gender);

    if (classification) {
      const levelScores: Record<StrengthLevel, number> = {
        Untrained: 1,
        Novice: 2,
        Intermediate: 3,
        Advanced: 4,
        Elite: 5
      };

      totalScore += levelScores[classification.level];
      liftsTracked++;
    }
  });

  if (liftsTracked === 0) return 0;

  // Normalize to 0-100 scale
  // Max possible = 5 points × 4 lifts = 20
  return Math.round((totalScore / (liftsTracked * 5)) * 100);
}

/**
 * Get recommended training percentages for a mesocycle
 * Based on DUP (Daily Undulating Periodization) principles
 *
 * Returns recommended intensities for:
 * - Volume day (hypertrophy focus)
 * - Strength day (strength focus)
 * - Power day (explosive focus)
 */
export function getTrainingPercentages(oneRM: number): {
  volumeDay: { weight: number; reps: [number, number] };
  strengthDay: { weight: number; reps: [number, number] };
  powerDay: { weight: number; reps: [number, number] };
} {
  return {
    volumeDay: {
      weight: calculate1RMPercentage(oneRM, 0.70), // 70% 1RM
      reps: [8, 12]
    },
    strengthDay: {
      weight: calculate1RMPercentage(oneRM, 0.85), // 85% 1RM
      reps: [3, 5]
    },
    powerDay: {
      weight: calculate1RMPercentage(oneRM, 0.60), // 60% 1RM (speed work)
      reps: [3, 5]
    }
  };
}

/**
 * Check if a new set is a PR (Personal Record)
 * Returns PR type if detected: 'weight' | 'volume' | 'reps'
 */
export function checkIfPR(
  set: SetLog,
  prHistory: ExercisePRHistory | undefined
): { isPR: boolean; type?: 'weight' | 'volume' | 'reps'; previousBest?: number } {
  if (!prHistory) {
    return { isPR: true, type: 'weight' }; // First ever set = PR
  }

  // Check Weight PR
  const currentWeight = set.weight;
  const bestWeight = prHistory.bestWeight?.value || 0;

  if (currentWeight > bestWeight) {
    return { isPR: true, type: 'weight', previousBest: bestWeight };
  }

  // Check Volume PR (weight × reps for single set)
  const currentVolume = set.weight * set.reps;
  const bestVolume = prHistory.bestVolume?.value || 0;

  if (currentVolume > bestVolume) {
    return { isPR: true, type: 'volume', previousBest: bestVolume };
  }

  // Check Rep PR
  const currentReps = set.reps;
  const bestReps = prHistory.bestReps?.value || 0;

  if (currentReps > bestReps && set.weight > 0) {
    return { isPR: true, type: 'reps', previousBest: bestReps };
  }

  return { isPR: false };
}

/**
 * Enhanced multi-PR detection (Alpha Progression "Mini PR" strategy)
 * Detects ALL PR types simultaneously to maximize motivation
 *
 * Returns array of all PRs achieved in this set:
 * - Weight PR: Heaviest weight lifted for this exercise
 * - Rep PR: Most reps performed at any weight
 * - Volume PR: Highest single-set volume (weight × reps)
 * - 1RM PR: Estimated 1RM using Epley/Brzycki formulas
 */
export interface PRDetection {
  type: 'weight' | 'reps' | 'volume' | '1rm';
  value: number;
  previousBest: number;
  improvement: number; // Absolute improvement
  improvementPercent: number; // Percentage improvement
  message: string; // Celebration message
}

export function checkAllPRs(
  set: SetLog,
  prHistory: ExercisePRHistory | undefined
): PRDetection[] {
  const prs: PRDetection[] = [];

  // First ever set = celebrate all metrics as PRs
  if (!prHistory) {
    const volume = set.weight * set.reps;
    const oneRM = calculate1RM(set.weight, set.reps);

    return [
      {
        type: 'weight',
        value: set.weight,
        previousBest: 0,
        improvement: set.weight,
        improvementPercent: 100,
        message: `First ${set.weight} LBS logged! 💪`
      },
      {
        type: 'volume',
        value: volume,
        previousBest: 0,
        improvement: volume,
        improvementPercent: 100,
        message: `${volume} total volume - strong start!`
      }
    ];
  }

  // 1. Weight PR
  const currentWeight = set.weight;
  const bestWeight = prHistory.bestWeight?.value || 0;
  if (currentWeight > bestWeight && currentWeight > 0) {
    const improvement = currentWeight - bestWeight;
    const improvementPercent = bestWeight > 0 ? ((improvement / bestWeight) * 100) : 100;
    prs.push({
      type: 'weight',
      value: currentWeight,
      previousBest: bestWeight,
      improvement,
      improvementPercent,
      message: bestWeight > 0
        ? `+${improvement} LBS weight PR! 🏆`
        : `${currentWeight} LBS - new weight PR!`
    });
  }

  // 2. Rep PR
  const currentReps = set.reps;
  const bestReps = prHistory.bestReps?.value || 0;
  if (currentReps > bestReps && set.weight > 0) {
    const improvement = currentReps - bestReps;
    const improvementPercent = bestReps > 0 ? ((improvement / bestReps) * 100) : 100;
    prs.push({
      type: 'reps',
      value: currentReps,
      previousBest: bestReps,
      improvement,
      improvementPercent,
      message: bestReps > 0
        ? `+${improvement} reps! Endurance gains 🔥`
        : `${currentReps} reps - new rep PR!`
    });
  }

  // 3. Volume PR (single-set)
  const currentVolume = set.weight * set.reps;
  const bestVolume = prHistory.bestVolume?.value || 0;
  if (currentVolume > bestVolume && currentVolume > 0) {
    const improvement = currentVolume - bestVolume;
    const improvementPercent = bestVolume > 0 ? ((improvement / bestVolume) * 100) : 100;
    prs.push({
      type: 'volume',
      value: currentVolume,
      previousBest: bestVolume,
      improvement,
      improvementPercent,
      message: `${currentVolume} total volume - crushing it! 💥`
    });
  }

  // 4. Estimated 1RM PR
  const current1RM = calculate1RM(set.weight, set.reps);
  const best1RM = prHistory.bestWeight
    ? calculate1RM(prHistory.bestWeight.value, prHistory.bestWeight.reps || 1).estimated1RM
    : 0;

  if (current1RM.estimated1RM > best1RM && set.reps > 1) {
    const improvement = current1RM.estimated1RM - best1RM;
    const improvementPercent = best1RM > 0 ? ((improvement / best1RM) * 100) : 100;
    prs.push({
      type: '1rm',
      value: current1RM.estimated1RM,
      previousBest: best1RM,
      improvement,
      improvementPercent,
      message: `Estimated 1RM: ${current1RM.estimated1RM} LBS! 🚀`
    });
  }

  return prs;
}

/**
 * Generate AI-style personalized PR celebration message
 * Uses templates for offline-first, with optional Gemini enhancement
 */
export function generatePRMessage(prs: PRDetection[], exerciseName: string): string {
  if (prs.length === 0) return '';

  // Multiple PRs = Extra celebration
  if (prs.length > 1) {
    const types = prs.map(pr => pr.type.toUpperCase()).join(' + ');
    return `🔥 MULTI-PR ALERT! ${types} on ${exerciseName}! You're on fire!`;
  }

  // Single PR
  const pr = prs[0];
  const templates = {
    weight: [
      `New weight PR on ${exerciseName}! ${pr.value} LBS conquered! 💪`,
      `Beast mode activated! ${pr.value} LBS is your new max! 🏆`,
      `Gravity = defeated! ${pr.value} LBS weight PR! 🚀`
    ],
    reps: [
      `Endurance gains unlocked! ${pr.value} reps on ${exerciseName}! 🔥`,
      `Rep PR! ${pr.value} reps - your muscle endurance is skyrocketing! 💥`,
      `${pr.value} reps on ${exerciseName}! Your stamina is next-level! ⚡`
    ],
    volume: [
      `Volume PR! Total work output increased on ${exerciseName}! 📈`,
      `Maximum effort! ${pr.value} total volume - crushing progressive overload! 💪`,
      `Volume gains! ${exerciseName} is responding to your hard work! 🎯`
    ],
    '1rm': [
      `Estimated 1RM reached ${pr.value} LBS! Strength is peaking! 🚀`,
      `${pr.value} LBS estimated max! You're getting stronger every session! 💯`,
      `Theoretical max: ${pr.value} LBS! Elite strength incoming! ⭐`
    ]
  };

  const messages = templates[pr.type];
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}
