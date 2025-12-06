/**
 * Personalized Periodization Service
 *
 * Phase 3 Feature: Auto-generate training blocks (mesocycles) and schedule deloads
 * based on user's training history, injury risk, and progress rate.
 *
 * Key Concepts:
 * - Mesocycle: 4-6 week training block with specific focus
 * - Microcycle: Weekly training structure
 * - Deload: Planned recovery week (50-60% volume)
 * - Phases: Accumulation (volume) → Intensification (intensity) → Deload
 */

import { WorkoutSession, DailyLog, ExperienceLevel, MuscleGroup } from '../types';
import { assessInjuryRisk } from './injuryRisk';
import { extractVolumeTimeSeries } from './analytics';

/**
 * Training phase types
 */
export type TrainingPhase = 'accumulation' | 'intensification' | 'deload' | 'peaking';

/**
 * Current periodization status
 */
export interface PeriodizationStatus {
  currentPhase: TrainingPhase;
  weeksIntoPhase: number;
  weeksRemainingInPhase: number;
  nextPhase: TrainingPhase;
  nextDeloadDate: number; // timestamp
  daysUntilDeload: number;
  phaseRecommendation: string;
  shouldTransitionPhase: boolean;
  transitionReasoning?: string;
}

/**
 * Mesocycle plan (4-6 week training block)
 */
export interface MesocyclePlan {
  startDate: number;
  endDate: number;
  phase: TrainingPhase;
  durationWeeks: number;
  volumeProgression: 'increase' | 'maintain' | 'decrease';
  intensityProgression: 'increase' | 'maintain' | 'decrease';
  focus: string; // "Build work capacity", "Push strength PRs", etc.
  volumeMultiplier: number; // 1.0 = baseline, 1.2 = +20% volume, 0.6 = deload
  intensityMultiplier: number; // 1.0 = baseline, 1.1 = +10% intensity
  deloadScheduled: boolean;
}

/**
 * Get current periodization status
 *
 * Analyzes training history to determine current phase and recommend transitions.
 *
 * @param history - All completed workouts
 * @param dailyLogs - Daily logs for recovery tracking
 * @param experienceLevel - User's training experience
 * @param lastDeloadDate - Timestamp of last planned deload (optional)
 * @returns Current periodization status with recommendations
 */
export function getPeriodizationStatus(
  history: WorkoutSession[],
  dailyLogs: DailyLog[],
  experienceLevel: ExperienceLevel = 'intermediate',
  lastDeloadDate?: number
): PeriodizationStatus {
  const now = Date.now();

  // Calculate weeks since last deload
  const weeksSinceDeload = lastDeloadDate
    ? Math.floor((now - lastDeloadDate) / (7 * 24 * 60 * 60 * 1000))
    : 12; // Assume 12 weeks if never deloaded

  // Get injury risk assessment
  const injuryRisk = history.length >= 3 ? assessInjuryRisk(history, dailyLogs, 4) : null;

  // Determine deload frequency based on experience
  const deloadFrequency = getDeloadFrequency(experienceLevel);
  const daysUntilDeload = Math.max(0, (deloadFrequency - weeksSinceDeload) * 7);

  // Check if immediate deload needed
  const needsImmediateDeload = injuryRisk?.needsDeload || weeksSinceDeload >= deloadFrequency;

  // Determine current phase based on training patterns
  let currentPhase: TrainingPhase;
  let weeksIntoPhase: number;
  let nextPhase: TrainingPhase;

  if (needsImmediateDeload) {
    currentPhase = 'deload';
    weeksIntoPhase = 0;
    nextPhase = 'accumulation';
  } else {
    // Analyze recent volume trends to infer phase
    const phaseAnalysis = inferCurrentPhase(history, weeksSinceDeload);
    currentPhase = phaseAnalysis.phase;
    weeksIntoPhase = phaseAnalysis.weeksInPhase;
    nextPhase = getNextPhase(currentPhase);
  }

  // Calculate weeks remaining in phase
  const phaseDuration = getPhaseDuration(currentPhase, experienceLevel);
  const weeksRemainingInPhase = Math.max(0, phaseDuration - weeksIntoPhase);

  // Check if should transition to next phase
  const shouldTransitionPhase = weeksIntoPhase >= phaseDuration || needsImmediateDeload;
  let transitionReasoning: string | undefined;

  if (needsImmediateDeload) {
    transitionReasoning = injuryRisk?.needsDeload
      ? 'High injury risk detected - immediate deload recommended'
      : `${weeksSinceDeload} weeks since last deload - recovery week needed`;
  } else if (shouldTransitionPhase) {
    transitionReasoning = `Completed ${weeksIntoPhase} weeks of ${currentPhase} phase - time to transition to ${nextPhase}`;
  }

  // Generate phase recommendation
  const phaseRecommendation = generatePhaseRecommendation(
    currentPhase,
    weeksIntoPhase,
    injuryRisk?.riskScore || 0,
    experienceLevel
  );

  return {
    currentPhase,
    weeksIntoPhase,
    weeksRemainingInPhase,
    nextPhase,
    nextDeloadDate: now + (daysUntilDeload * 24 * 60 * 60 * 1000),
    daysUntilDeload,
    phaseRecommendation,
    shouldTransitionPhase,
    transitionReasoning
  };
}

/**
 * Generate mesocycle plan based on current status
 *
 * Creates a structured 4-6 week training block with specific goals.
 *
 * @param currentStatus - Current periodization status
 * @param experienceLevel - User's training experience
 * @returns Mesocycle plan with volume/intensity targets
 */
export function generateMesocyclePlan(
  currentStatus: PeriodizationStatus,
  experienceLevel: ExperienceLevel = 'intermediate'
): MesocyclePlan {
  const now = Date.now();
  const phase = currentStatus.shouldTransitionPhase ? currentStatus.nextPhase : currentStatus.currentPhase;
  const durationWeeks = getPhaseDuration(phase, experienceLevel);
  const endDate = now + (durationWeeks * 7 * 24 * 60 * 60 * 1000);

  let volumeProgression: 'increase' | 'maintain' | 'decrease';
  let intensityProgression: 'increase' | 'maintain' | 'decrease';
  let focus: string;
  let volumeMultiplier: number;
  let intensityMultiplier: number;
  let deloadScheduled: boolean;

  switch (phase) {
    case 'accumulation':
      volumeProgression = 'increase';
      intensityProgression = 'maintain';
      focus = 'Build work capacity and hypertrophy through progressive volume increases';
      volumeMultiplier = 1.0; // Start at baseline, increase weekly
      intensityMultiplier = 0.75; // Moderate intensity (70-80% 1RM)
      deloadScheduled = false;
      break;

    case 'intensification':
      volumeProgression = 'decrease';
      intensityProgression = 'increase';
      focus = 'Push strength PRs with heavy weights and reduced volume';
      volumeMultiplier = 0.7; // Reduce volume to allow intensity push
      intensityMultiplier = 1.0; // High intensity (85-95% 1RM)
      deloadScheduled = false;
      break;

    case 'deload':
      volumeProgression = 'decrease';
      intensityProgression = 'decrease';
      focus = 'Active recovery - maintain technique while reducing fatigue';
      volumeMultiplier = 0.5; // 50% volume reduction
      intensityMultiplier = 0.7; // 70% intensity
      deloadScheduled = true;
      break;

    case 'peaking':
      volumeProgression = 'decrease';
      intensityProgression = 'increase';
      focus = 'Competition prep - maximize strength expression';
      volumeMultiplier = 0.5; // Minimal volume
      intensityMultiplier = 1.1; // Peak intensity (90-100% 1RM)
      deloadScheduled = false;
      break;
  }

  return {
    startDate: now,
    endDate,
    phase,
    durationWeeks,
    volumeProgression,
    intensityProgression,
    focus,
    volumeMultiplier,
    intensityMultiplier,
    deloadScheduled
  };
}

/**
 * Get recommended deload frequency based on experience level
 *
 * Research: Beginners can train longer without deloads, advanced lifters need more frequent recovery
 */
function getDeloadFrequency(experienceLevel: ExperienceLevel): number {
  switch (experienceLevel) {
    case 'beginner':
      return 8; // Every 8 weeks
    case 'intermediate':
      return 5; // Every 5 weeks
    case 'advanced':
      return 4; // Every 4 weeks
    default:
      return 5;
  }
}

/**
 * Infer current training phase from workout history
 */
function inferCurrentPhase(
  history: WorkoutSession[],
  weeksSinceDeload: number
): { phase: TrainingPhase; weeksInPhase: number } {
  if (history.length < 4) {
    return { phase: 'accumulation', weeksInPhase: 1 };
  }

  // Get volume trend over last 4 weeks
  const fourWeeksAgo = Date.now() - (4 * 7 * 24 * 60 * 60 * 1000);
  const recentWorkouts = history.filter(w => w.status === 'completed' && w.startTime >= fourWeeksAgo);

  if (recentWorkouts.length === 0) {
    return { phase: 'accumulation', weeksInPhase: 1 };
  }

  // Calculate average volume per week
  const weeklyVolumes: number[] = [];
  for (let week = 0; week < 4; week++) {
    const weekStart = Date.now() - ((4 - week) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
    const weekWorkouts = recentWorkouts.filter(w => w.startTime >= weekStart && w.startTime < weekEnd);
    const weekVolume = weekWorkouts.reduce((sum, w) =>
      sum + w.logs.reduce((logSum, log) =>
        logSum + log.sets.filter(s => s.completed).reduce((setSum, set) =>
          setSum + (set.reps * set.weight), 0
        ), 0
      ), 0
    );
    weeklyVolumes.push(weekVolume);
  }

  // Analyze trend
  const avgVolume = weeklyVolumes.reduce((sum, v) => sum + v, 0) / weeklyVolumes.length;
  const lastWeekVolume = weeklyVolumes[weeklyVolumes.length - 1];
  const firstWeekVolume = weeklyVolumes[0];

  // Volume increasing = accumulation phase
  if (lastWeekVolume > avgVolume * 1.1 && lastWeekVolume > firstWeekVolume) {
    return { phase: 'accumulation', weeksInPhase: Math.min(weeksSinceDeload, 4) };
  }

  // Volume decreasing significantly = likely in intensification or deload
  if (lastWeekVolume < avgVolume * 0.8) {
    // Very low volume = deload
    if (lastWeekVolume < avgVolume * 0.6) {
      return { phase: 'deload', weeksInPhase: 1 };
    }
    // Moderate volume reduction = intensification
    return { phase: 'intensification', weeksInPhase: Math.min(weeksSinceDeload, 3) };
  }

  // Default to accumulation
  return { phase: 'accumulation', weeksInPhase: Math.min(weeksSinceDeload, 3) };
}

/**
 * Get next phase in periodization cycle
 */
function getNextPhase(currentPhase: TrainingPhase): TrainingPhase {
  switch (currentPhase) {
    case 'accumulation':
      return 'intensification';
    case 'intensification':
      return 'deload';
    case 'deload':
      return 'accumulation';
    case 'peaking':
      return 'deload';
  }
}

/**
 * Get recommended phase duration based on experience
 */
function getPhaseDuration(phase: TrainingPhase, experienceLevel: ExperienceLevel): number {
  if (phase === 'deload') {
    return 1; // Always 1 week
  }

  if (phase === 'peaking') {
    return 2; // Short peaking phase
  }

  // Accumulation and intensification phases
  switch (experienceLevel) {
    case 'beginner':
      return 6; // Longer phases for beginners
    case 'intermediate':
      return 4; // Standard 4-week blocks
    case 'advanced':
      return 3; // Shorter, more frequent phase changes
    default:
      return 4;
  }
}

/**
 * Generate phase-specific recommendation
 */
function generatePhaseRecommendation(
  phase: TrainingPhase,
  weeksIntoPhase: number,
  injuryRiskScore: number,
  experienceLevel: ExperienceLevel
): string {
  const phaseDuration = getPhaseDuration(phase, experienceLevel);
  const weeksRemaining = phaseDuration - weeksIntoPhase;

  switch (phase) {
    case 'accumulation':
      if (weeksIntoPhase <= 1) {
        return `Starting accumulation phase - focus on progressive volume increases. Add 1-2 sets per week to major lifts.`;
      } else if (weeksRemaining <= 1) {
        return `Final week of accumulation - maintain current volume. Next: intensification phase with heavy weights.`;
      } else {
        return `Accumulation phase - continue building volume. ${weeksRemaining} weeks until intensification phase.`;
      }

    case 'intensification':
      if (weeksIntoPhase <= 1) {
        return `Starting intensification - reduce volume 20-30%, increase weight to 85-90% 1RM. Focus on PRs.`;
      } else if (injuryRiskScore >= 60) {
        return `High fatigue detected - consider moving to deload early to prevent injury.`;
      } else if (weeksRemaining <= 1) {
        return `Final week of intensification - push for PRs this week, then deload for recovery.`;
      } else {
        return `Intensification phase - heavy weights, low volume. ${weeksRemaining} weeks until deload.`;
      }

    case 'deload':
      return `Deload week - reduce volume by 50% and intensity to 70%. Focus on technique and recovery. Return to accumulation next week.`;

    case 'peaking':
      if (weeksIntoPhase <= 1) {
        return `Peaking phase - minimal volume, max intensity. Test 1RMs or compete this week.`;
      } else {
        return `Final peaking week - attempt PRs and showcase strength. Deload next week.`;
      }
  }
}

/**
 * Get volume targets for current phase
 *
 * Returns recommended sets per muscle group per week based on phase.
 *
 * @param phase - Current training phase
 * @param experienceLevel - User's experience level
 * @param muscleGroup - Target muscle group
 * @returns { min: number, max: number } set range
 */
export function getVolumeTargets(
  phase: TrainingPhase,
  experienceLevel: ExperienceLevel,
  muscleGroup: MuscleGroup
): { min: number; max: number } {
  // Base volume landmarks (Dr. Mike Israetel's research)
  // MEV (Minimum Effective Volume), MAV (Maximum Adaptive Volume)
  const volumeLandmarks = {
    beginner: { mev: 8, mav: 16 },
    intermediate: { mev: 10, mav: 20 },
    advanced: { mev: 12, mav: 24 }
  };

  const { mev, mav } = volumeLandmarks[experienceLevel];

  switch (phase) {
    case 'accumulation':
      // Build up from MEV toward MAV
      return { min: mev, max: Math.round(mav * 0.9) };

    case 'intensification':
      // Reduce to MEV range for recovery while pushing intensity
      return { min: Math.round(mev * 0.8), max: Math.round(mev * 1.2) };

    case 'deload':
      // Half of MEV
      return { min: Math.round(mev * 0.4), max: Math.round(mev * 0.6) };

    case 'peaking':
      // Minimal volume
      return { min: Math.round(mev * 0.3), max: Math.round(mev * 0.5) };
  }
}

/**
 * Check if user should enter deload based on multiple factors
 */
export function shouldEnterDeload(
  history: WorkoutSession[],
  dailyLogs: DailyLog[],
  experienceLevel: ExperienceLevel,
  lastDeloadDate?: number
): { shouldDeload: boolean; reasoning: string; urgency: 'low' | 'medium' | 'high' | 'critical' } {
  const now = Date.now();

  // Factor 1: Injury risk
  const injuryRisk = history.length >= 3 ? assessInjuryRisk(history, dailyLogs, 4) : null;

  if (injuryRisk?.needsDeload) {
    return {
      shouldDeload: true,
      reasoning: `Critical injury risk detected (${injuryRisk.riskScore}/100). Immediate deload required.`,
      urgency: 'critical'
    };
  }

  // Factor 2: Time since last deload
  const weeksSinceDeload = lastDeloadDate
    ? Math.floor((now - lastDeloadDate) / (7 * 24 * 60 * 60 * 1000))
    : 12;

  const deloadFrequency = getDeloadFrequency(experienceLevel);

  if (weeksSinceDeload >= deloadFrequency + 1) {
    return {
      shouldDeload: true,
      reasoning: `${weeksSinceDeload} weeks since last deload (recommended: ${deloadFrequency} weeks). Deload needed for recovery.`,
      urgency: 'high'
    };
  }

  // Factor 3: Moderate risk warning
  if (injuryRisk && injuryRisk.riskScore >= 50) {
    return {
      shouldDeload: true,
      reasoning: `Elevated injury risk (${injuryRisk.riskScore}/100). Preventive deload recommended.`,
      urgency: 'medium'
    };
  }

  // Factor 4: Upcoming deload (within 1 week)
  if (weeksSinceDeload >= deloadFrequency - 1) {
    return {
      shouldDeload: false,
      reasoning: `Deload recommended in ${(deloadFrequency - weeksSinceDeload) * 7} days. Monitor fatigue closely.`,
      urgency: 'low'
    };
  }

  return {
    shouldDeload: false,
    reasoning: `No deload needed. ${deloadFrequency - weeksSinceDeload} weeks until next scheduled deload.`,
    urgency: 'low'
  };
}
