/**
 * Volume Optimization Service
 *
 * Phase 3 Feature: Personalized MEV/MAV/MRV calibration per muscle group.
 * Uses actual user response data to find optimal training volumes.
 *
 * Key Concepts (Dr. Mike Israetel's Volume Landmarks):
 * - MRV (Maximum Recoverable Volume): Upper limit before overtraining
 * - MAV (Maximum Adaptive Volume): Volume that produces best results
 * - MEV (Minimum Effective Volume): Threshold for muscle growth
 * - MV (Maintenance Volume): Volume to maintain current size/strength
 *
 * This service learns from user data to personalize these landmarks.
 */

import { WorkoutSession, MuscleGroup, ExperienceLevel } from '../types';
import { extractVolumeTimeSeries, correlateVolumeWithPerformance } from './analytics';
import { EXERCISE_LIBRARY } from '../constants';

/**
 * Volume landmarks for a muscle group
 */
export interface VolumeLandmarks {
  muscleGroup: MuscleGroup;
  mv: number;   // Maintenance Volume (sets/week)
  mev: number;  // Minimum Effective Volume (sets/week)
  mav: number;  // Maximum Adaptive Volume (sets/week)
  mrv: number;  // Maximum Recoverable Volume (sets/week)
  current: number; // Current volume (sets/week)
  status: 'undertrained' | 'optimal' | 'approaching_mrv' | 'overtrained';
  confidence: number; // 0-1, based on data quality
}

/**
 * Volume recommendation for a muscle group
 */
export interface VolumeRecommendation {
  muscleGroup: MuscleGroup;
  currentVolume: number;
  recommendedVolume: number;
  changeDirection: 'increase' | 'maintain' | 'decrease';
  changeMagnitude: number; // Sets to add/remove
  reasoning: string;
  landmarks: VolumeLandmarks;
}

/**
 * Calculate personalized volume landmarks for a muscle group
 *
 * Uses correlation analysis between volume and performance to find optimal ranges.
 *
 * @param muscleGroup - Muscle group to analyze
 * @param history - All completed workouts
 * @param experienceLevel - User's training experience
 * @returns Personalized volume landmarks
 */
export function calculateVolumeLandmarks(
  muscleGroup: MuscleGroup,
  history: WorkoutSession[],
  experienceLevel: ExperienceLevel = 'intermediate'
): VolumeLandmarks {
  // Get representative exercise for this muscle group
  const representativeExercise = getRepresentativeExercise(muscleGroup);

  if (!representativeExercise) {
    // Fallback to research-based defaults
    return getDefaultVolumeLandmarks(muscleGroup, experienceLevel);
  }

  // Analyze volume-performance correlation
  const correlation = correlateVolumeWithPerformance(
    muscleGroup,
    representativeExercise.id,
    history
  );

  // Get current weekly volume
  const volumeTimeSeries = extractVolumeTimeSeries(muscleGroup, history, 4);
  const currentVolume = volumeTimeSeries.length > 0
    ? volumeTimeSeries[volumeTimeSeries.length - 1].sets
    : 0;

  // Determine if we have enough data for personalized landmarks
  const hasEnoughData = correlation.volumeData.length >= 8; // At least 8 weeks of data

  if (!hasEnoughData) {
    // Not enough data - use research-based defaults with current volume
    const defaults = getDefaultVolumeLandmarks(muscleGroup, experienceLevel);
    return {
      ...defaults,
      current: currentVolume,
      status: getVolumeStatus(currentVolume, defaults),
      confidence: 0.3 // Low confidence without personalized data
    };
  }

  // Personalized landmarks based on user response
  const { optimalVolume, volumeData } = correlation;

  // Find MRV (highest volume user has recovered from)
  const maxRecoverableVolume = Math.max(...volumeData.map(v => v.sets));

  // MAV is the optimal volume found through correlation
  const mav = optimalVolume;

  // MEV is typically 50-60% of MAV
  const mev = Math.round(mav * 0.55);

  // MV (maintenance) is typically 1/3 of MEV
  const mv = Math.round(mev * 0.33);

  // MRV should be capped at 120% of MAV for safety
  const mrv = Math.min(maxRecoverableVolume, Math.round(mav * 1.2));

  const landmarks: VolumeLandmarks = {
    muscleGroup,
    mv,
    mev,
    mav,
    mrv,
    current: currentVolume,
    status: 'optimal',
    confidence: 0
  };

  // Determine current status
  landmarks.status = getVolumeStatus(currentVolume, landmarks);

  // Calculate confidence based on data quality
  landmarks.confidence = calculateLandmarkConfidence(correlation, volumeData.length);

  return landmarks;
}

/**
 * Get volume recommendation for a muscle group
 *
 * @param muscleGroup - Muscle group to optimize
 * @param history - All completed workouts
 * @param experienceLevel - User's training experience
 * @param trainingPhase - Current training phase (affects targets)
 * @returns Volume recommendation with reasoning
 */
export function getVolumeRecommendation(
  muscleGroup: MuscleGroup,
  history: WorkoutSession[],
  experienceLevel: ExperienceLevel = 'intermediate',
  trainingPhase: 'accumulation' | 'intensification' | 'deload' = 'accumulation'
): VolumeRecommendation {
  const landmarks = calculateVolumeLandmarks(muscleGroup, history, experienceLevel);
  const { current, mev, mav, mrv, status } = landmarks;

  let recommendedVolume = current;
  let changeDirection: 'increase' | 'maintain' | 'decrease' = 'maintain';
  let reasoning = '';

  // Adjust targets based on training phase
  const phaseMultiplier = {
    accumulation: 1.0,    // Target MAV
    intensification: 0.6, // Reduce to ~MEV
    deload: 0.5          // Half of MEV
  }[trainingPhase];

  const phaseTarget = Math.round(mav * phaseMultiplier);

  switch (status) {
    case 'undertrained':
      // Below MEV - need more volume
      if (trainingPhase === 'deload') {
        recommendedVolume = Math.round(mev * 0.5);
        reasoning = 'Deload week - maintain reduced volume even though below normal MEV.';
      } else {
        recommendedVolume = Math.min(mev, phaseTarget);
        changeDirection = 'increase';
        reasoning = `Currently below MEV (${current}/${mev} sets). Increase to ${recommendedVolume} sets for muscle growth stimulus.`;
      }
      break;

    case 'optimal':
      // Within optimal range (MEV to MAV)
      if (trainingPhase === 'accumulation' && current < mav * 0.9) {
        recommendedVolume = Math.min(current + 2, mav);
        changeDirection = 'increase';
        reasoning = `Accumulation phase - gradually increase toward MAV (${mav} sets). Currently at ${current} sets.`;
      } else if (trainingPhase === 'intensification') {
        recommendedVolume = Math.round(mev * 0.8);
        changeDirection = 'decrease';
        reasoning = `Intensification phase - reduce volume to ${recommendedVolume} sets to recover while pushing intensity.`;
      } else if (trainingPhase === 'deload') {
        recommendedVolume = Math.round(mev * 0.5);
        changeDirection = 'decrease';
        reasoning = `Deload week - reduce to ${recommendedVolume} sets for active recovery.`;
      } else {
        recommendedVolume = current;
        reasoning = `Volume optimal (${current} sets). Maintain current approach.`;
      }
      break;

    case 'approaching_mrv':
      // Close to MRV - reduce slightly
      recommendedVolume = Math.round(mav * 0.9);
      changeDirection = 'decrease';
      reasoning = `Approaching MRV (${current}/${mrv} sets). Reduce to ${recommendedVolume} sets to prevent overtraining.`;
      break;

    case 'overtrained':
      // Exceeded MRV - significant reduction needed
      if (trainingPhase === 'deload') {
        recommendedVolume = Math.round(mev * 0.5);
      } else {
        recommendedVolume = mav;
      }
      changeDirection = 'decrease';
      reasoning = `Volume exceeds MRV (${current}/${mrv} sets). Reduce to ${recommendedVolume} sets. Consider deload week.`;
      break;
  }

  const changeMagnitude = Math.abs(recommendedVolume - current);

  return {
    muscleGroup,
    currentVolume: current,
    recommendedVolume,
    changeDirection,
    changeMagnitude,
    reasoning,
    landmarks
  };
}

/**
 * Get volume recommendations for all muscle groups
 */
export function getAllVolumeRecommendations(
  history: WorkoutSession[],
  experienceLevel: ExperienceLevel = 'intermediate',
  trainingPhase: 'accumulation' | 'intensification' | 'deload' = 'accumulation'
): VolumeRecommendation[] {
  const muscleGroups: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

  return muscleGroups.map(muscleGroup =>
    getVolumeRecommendation(muscleGroup, history, experienceLevel, trainingPhase)
  );
}

/**
 * Get representative exercise for muscle group (for correlation analysis)
 */
function getRepresentativeExercise(muscleGroup: MuscleGroup) {
  // Find most common compound exercise for each muscle group
  const representatives = {
    chest: 'barbell-bench-press',
    back: 'barbell-row',
    legs: 'barbell-squat',
    shoulders: 'barbell-overhead-press',
    arms: 'barbell-curl',
    core: 'plank'
  };

  const exerciseId = representatives[muscleGroup];
  return EXERCISE_LIBRARY.find(e => e.id === exerciseId);
}

/**
 * Get default volume landmarks based on research
 *
 * Based on Dr. Mike Israetel's recommendations by experience level.
 */
function getDefaultVolumeLandmarks(
  muscleGroup: MuscleGroup,
  experienceLevel: ExperienceLevel
): Omit<VolumeLandmarks, 'current' | 'status' | 'confidence'> {
  // Research-based defaults (sets per week)
  const landmarksByExperience: Record<string, { mv: number; mev: number; mav: number; mrv: number }> = {
    Beginner: { mv: 4, mev: 8, mav: 16, mrv: 20 },
    Intermediate: { mv: 6, mev: 10, mav: 20, mrv: 25 },
    Advanced: { mv: 8, mev: 12, mav: 24, mrv: 30 }
  };

  // Adjust for muscle group (some muscles can handle more volume)
  const muscleMultipliers: Record<MuscleGroup, number> = {
    Chest: 1.0,
    Back: 1.1,   // Back can handle slightly more
    Legs: 1.0,
    Shoulders: 0.9, // Shoulders need less (smaller muscle, injury risk)
    Arms: 0.8,   // Arms need less direct work
    Core: 1.2,   // Core recovers quickly
    Cardio: 0.5  // Cardio doesn't use volume landmarks the same way
  };

  const baseLandmarks = landmarksByExperience[experienceLevel] || landmarksByExperience.Intermediate;
  const multiplier = muscleMultipliers[muscleGroup] ?? 1.0;

  return {
    muscleGroup,
    mv: Math.round(baseLandmarks.mv * multiplier),
    mev: Math.round(baseLandmarks.mev * multiplier),
    mav: Math.round(baseLandmarks.mav * multiplier),
    mrv: Math.round(baseLandmarks.mrv * multiplier)
  };
}

/**
 * Determine volume status based on landmarks
 */
function getVolumeStatus(
  currentVolume: number,
  landmarks: Pick<VolumeLandmarks, 'mev' | 'mav' | 'mrv'>
): 'undertrained' | 'optimal' | 'approaching_mrv' | 'overtrained' {
  const { mev, mav, mrv } = landmarks;

  if (currentVolume < mev) {
    return 'undertrained';
  } else if (currentVolume >= mrv) {
    return 'overtrained';
  } else if (currentVolume >= mrv * 0.9) {
    return 'approaching_mrv';
  } else {
    return 'optimal';
  }
}

/**
 * Calculate confidence in landmark calibration
 */
function calculateLandmarkConfidence(
  correlation: ReturnType<typeof correlateVolumeWithPerformance>,
  weeksOfData: number
): number {
  let confidence = 0;

  // Factor 1: Correlation strength (0-40 points)
  const absCorrelation = Math.abs(correlation.correlation);
  confidence += absCorrelation * 40;

  // Factor 2: Data quantity (0-30 points)
  const dataScore = Math.min(1, weeksOfData / 12); // 12+ weeks = max score
  confidence += dataScore * 30;

  // Factor 3: Performance data quality (0-30 points)
  const performanceDataPoints = correlation.performanceData.length;
  const performanceScore = Math.min(1, performanceDataPoints / 20);
  confidence += performanceScore * 30;

  return Math.min(100, Math.max(0, confidence)) / 100; // Normalize to 0-1
}

/**
 * Detect volume imbalances across muscle groups
 *
 * Identifies if user is overtraining some muscles while undertraining others.
 */
export function detectVolumeImbalances(
  history: WorkoutSession[],
  experienceLevel: ExperienceLevel = 'intermediate'
): {
  hasImbalance: boolean;
  imbalances: { muscleGroup: MuscleGroup; issue: string; severity: 'minor' | 'moderate' | 'severe' }[];
  recommendations: string[];
} {
  const recommendations: string[] = [];
  const imbalances: { muscleGroup: MuscleGroup; issue: string; severity: 'minor' | 'moderate' | 'severe' }[] = [];

  const allRecommendations = getAllVolumeRecommendations(history, experienceLevel, 'accumulation');

  // Check for overtrained muscles
  const overtrained = allRecommendations.filter(r => r.landmarks.status === 'overtrained');
  overtrained.forEach(r => {
    imbalances.push({
      muscleGroup: r.muscleGroup,
      issue: `Overtraining: ${r.currentVolume} sets (MRV: ${r.landmarks.mrv})`,
      severity: 'severe'
    });
  });

  // Check for undertrained muscles
  const undertrained = allRecommendations.filter(r => r.landmarks.status === 'undertrained');
  undertrained.forEach(r => {
    imbalances.push({
      muscleGroup: r.muscleGroup,
      issue: `Undertrained: ${r.currentVolume} sets (MEV: ${r.landmarks.mev})`,
      severity: 'moderate'
    });
  });

  // Check for push/pull imbalance
  const chestVolume = allRecommendations.find(r => r.muscleGroup === 'chest')?.currentVolume || 0;
  const backVolume = allRecommendations.find(r => r.muscleGroup === 'back')?.currentVolume || 0;

  if (chestVolume > backVolume * 1.3) {
    imbalances.push({
      muscleGroup: 'back',
      issue: `Push/pull imbalance: Chest ${chestVolume} sets vs Back ${backVolume} sets`,
      severity: 'moderate'
    });
    recommendations.push('Increase back volume to match chest work (1:1.2 ratio recommended)');
  }

  // Generate recommendations
  if (overtrained.length > 0) {
    recommendations.push(`Reduce volume for: ${overtrained.map(r => r.muscleGroup).join(', ')}`);
    recommendations.push('Consider immediate deload week to prevent injury');
  }

  if (undertrained.length > 0) {
    recommendations.push(`Increase volume for: ${undertrained.map(r => r.muscleGroup).join(', ')}`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Volume balance looks good across all muscle groups');
  }

  return {
    hasImbalance: imbalances.length > 0,
    imbalances,
    recommendations
  };
}
