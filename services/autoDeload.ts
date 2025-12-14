/**
 * Auto-Deload Detection Service
 * 
 * Analyzes workout data to detect:
 * - Performance plateaus/stalls
 * - Accumulated fatigue indicators
 * - Overreaching symptoms
 * - Optimal deload timing
 * 
 * Based on research-backed periodization principles:
 * - Deload every 4-6 weeks for intermediates
 * - Deload every 3-4 weeks for advanced lifters
 * - RPE creep indicates fatigue accumulation
 * - Weight/rep stalls indicate need for strategic rest
 */

import { WorkoutSession, ExerciseLog, SetLog } from '../types';
import { EXERCISE_LIBRARY } from '../constants';

export type DeloadUrgency = 'none' | 'soon' | 'recommended' | 'critical';

export interface ExerciseStall {
  exerciseId: string;
  exerciseName: string;
  stallDuration: number; // weeks
  currentWeight: number;
  stalledAt: number;
  previousPeak: number;
  percentageFromPeak: number;
}

export interface FatigueIndicator {
  type: 'rpe_creep' | 'volume_drop' | 'missed_reps' | 'session_frequency_drop' | 'workout_duration_increase';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  value: number;
  baseline: number;
}

export interface DeloadRecommendation {
  urgency: DeloadUrgency;
  score: number; // 0-100
  daysSinceLastDeload: number;
  weeksSinceLastDeload: number;
  stalledExercises: ExerciseStall[];
  fatigueIndicators: FatigueIndicator[];
  recommendations: string[];
  suggestedDeloadType: 'volume' | 'intensity' | 'full' | 'active_recovery';
  deloadProtocol: DeloadProtocol;
}

export interface DeloadProtocol {
  durationDays: number;
  volumeReduction: number; // percentage
  intensityReduction: number; // percentage
  focusAreas: string[];
  activities: string[];
}

interface ExercisePerformanceData {
  exerciseId: string;
  name: string;
  sessions: {
    date: number;
    maxWeight: number;
    totalVolume: number;
    avgRPE: number;
    completedSets: number;
    missedReps: number;
  }[];
}

// Constants for detection thresholds
const STALL_THRESHOLD_WEEKS = 3;
const RPE_CREEP_THRESHOLD = 0.5; // Average RPE increase indicating fatigue
const VOLUME_DROP_THRESHOLD = 0.15; // 15% drop in volume
const MISSED_REPS_THRESHOLD = 0.1; // 10% of total reps missed
const DELOAD_INTERVAL_INTERMEDIATE = 35; // days
const DELOAD_INTERVAL_ADVANCED = 28; // days
const DELOAD_INTERVAL_BEGINNER = 56; // days

/**
 * Main function to analyze deload necessity
 */
export function analyzeDeloadNeed(
  history: WorkoutSession[],
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
  lastDeloadDate?: number
): DeloadRecommendation {
  const now = Date.now();
  const fourWeeksAgo = now - 28 * 24 * 60 * 60 * 1000;
  const eightWeeksAgo = now - 56 * 24 * 60 * 60 * 1000;
  
  // Get recent completed workouts
  const recentWorkouts = history
    .filter(w => w.status === 'completed' && w.endTime && w.endTime >= eightWeeksAgo)
    .sort((a, b) => (a.endTime || 0) - (b.endTime || 0));

  if (recentWorkouts.length < 4) {
    return createEmptyRecommendation();
  }

  // Calculate exercise-specific performance data
  const exerciseData = analyzeExercisePerformance(recentWorkouts);
  
  // Detect stalled exercises
  const stalledExercises = detectStalledExercises(exerciseData);
  
  // Detect fatigue indicators
  const fatigueIndicators = detectFatigueIndicators(recentWorkouts, exerciseData);
  
  // Calculate days since last deload
  const daysSinceLastDeload = lastDeloadDate 
    ? Math.floor((now - lastDeloadDate) / (24 * 60 * 60 * 1000))
    : calculateDaysSinceImpliedDeload(history);
  
  const weeksSinceLastDeload = Math.floor(daysSinceLastDeload / 7);
  
  // Calculate deload score
  const score = calculateDeloadScore(
    stalledExercises,
    fatigueIndicators,
    daysSinceLastDeload,
    experienceLevel
  );
  
  // Determine urgency
  const urgency = determineUrgency(score, daysSinceLastDeload, experienceLevel);
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    stalledExercises,
    fatigueIndicators,
    urgency,
    experienceLevel
  );
  
  // Determine deload type
  const suggestedDeloadType = determinDeloadType(fatigueIndicators, stalledExercises);
  
  // Generate deload protocol
  const deloadProtocol = generateDeloadProtocol(
    suggestedDeloadType,
    experienceLevel,
    stalledExercises
  );

  return {
    urgency,
    score,
    daysSinceLastDeload,
    weeksSinceLastDeload,
    stalledExercises,
    fatigueIndicators,
    recommendations,
    suggestedDeloadType,
    deloadProtocol
  };
}

function analyzeExercisePerformance(workouts: WorkoutSession[]): ExercisePerformanceData[] {
  const exerciseMap: Record<string, ExercisePerformanceData['sessions']> = {};

  workouts.forEach(workout => {
    const date = workout.endTime || workout.startTime;
    
    workout.logs.forEach(log => {
      if (!exerciseMap[log.exerciseId]) {
        exerciseMap[log.exerciseId] = [];
      }

      let maxWeight = 0;
      let totalVolume = 0;
      let totalRPE = 0;
      let rpeCount = 0;
      let completedSets = 0;
      let missedReps = 0;

      log.sets.forEach(set => {
        if (set.completed) {
          maxWeight = Math.max(maxWeight, set.weight);
          totalVolume += set.weight * set.reps;
          completedSets++;
          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }
        } else {
          missedReps += set.reps; // Count planned reps as missed
        }
      });

      if (completedSets > 0) {
        exerciseMap[log.exerciseId].push({
          date,
          maxWeight,
          totalVolume,
          avgRPE: rpeCount > 0 ? totalRPE / rpeCount : 0,
          completedSets,
          missedReps
        });
      }
    });
  });

  return Object.entries(exerciseMap).map(([exerciseId, sessions]) => ({
    exerciseId,
    name: EXERCISE_LIBRARY.find(e => e.id === exerciseId)?.name || 'Unknown',
    sessions: sessions.sort((a, b) => a.date - b.date)
  }));
}

function detectStalledExercises(exerciseData: ExercisePerformanceData[]): ExerciseStall[] {
  const stalls: ExerciseStall[] = [];
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  exerciseData.forEach(exercise => {
    if (exercise.sessions.length < 4) return;

    // Find peak weight
    const peakWeight = Math.max(...exercise.sessions.map(s => s.maxWeight));
    
    // Get recent sessions (last 3 weeks)
    const threeWeeksAgo = now - 3 * oneWeek;
    const recentSessions = exercise.sessions.filter(s => s.date >= threeWeeksAgo);
    
    if (recentSessions.length < 2) return;

    // Check if recent max is below peak
    const recentMax = Math.max(...recentSessions.map(s => s.maxWeight));
    const percentageFromPeak = ((peakWeight - recentMax) / peakWeight) * 100;

    // Calculate stall duration
    const peakDate = exercise.sessions.find(s => s.maxWeight === peakWeight)?.date || now;
    const stallDuration = Math.floor((now - peakDate) / oneWeek);

    if (stallDuration >= STALL_THRESHOLD_WEEKS && percentageFromPeak >= 0) {
      stalls.push({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        stallDuration,
        currentWeight: recentMax,
        stalledAt: peakDate,
        previousPeak: peakWeight,
        percentageFromPeak: Math.round(percentageFromPeak * 10) / 10
      });
    }
  });

  return stalls.sort((a, b) => b.stallDuration - a.stallDuration);
}

function detectFatigueIndicators(
  workouts: WorkoutSession[],
  exerciseData: ExercisePerformanceData[]
): FatigueIndicator[] {
  const indicators: FatigueIndicator[] = [];
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  const fourWeeksAgo = now - 28 * 24 * 60 * 60 * 1000;

  // Split into baseline and recent periods
  const recentWorkouts = workouts.filter(w => (w.endTime || w.startTime) >= twoWeeksAgo);
  const baselineWorkouts = workouts.filter(w => {
    const time = w.endTime || w.startTime;
    return time >= fourWeeksAgo && time < twoWeeksAgo;
  });

  if (recentWorkouts.length < 2 || baselineWorkouts.length < 2) {
    return indicators;
  }

  // 1. RPE Creep Detection
  const recentRPE = calculateAverageRPE(recentWorkouts);
  const baselineRPE = calculateAverageRPE(baselineWorkouts);
  
  if (recentRPE > 0 && baselineRPE > 0) {
    const rpeIncrease = recentRPE - baselineRPE;
    if (rpeIncrease >= RPE_CREEP_THRESHOLD) {
      indicators.push({
        type: 'rpe_creep',
        severity: rpeIncrease >= 1 ? 'severe' : rpeIncrease >= 0.7 ? 'moderate' : 'mild',
        description: `Average RPE increased from ${baselineRPE.toFixed(1)} to ${recentRPE.toFixed(1)}`,
        value: recentRPE,
        baseline: baselineRPE
      });
    }
  }

  // 2. Volume Drop Detection
  const recentVolume = calculateAverageVolume(recentWorkouts);
  const baselineVolume = calculateAverageVolume(baselineWorkouts);
  
  if (baselineVolume > 0) {
    const volumeDrop = (baselineVolume - recentVolume) / baselineVolume;
    if (volumeDrop >= VOLUME_DROP_THRESHOLD) {
      indicators.push({
        type: 'volume_drop',
        severity: volumeDrop >= 0.25 ? 'severe' : volumeDrop >= 0.2 ? 'moderate' : 'mild',
        description: `Training volume dropped by ${Math.round(volumeDrop * 100)}%`,
        value: recentVolume,
        baseline: baselineVolume
      });
    }
  }

  // 3. Missed Reps Detection
  const recentMissedRatio = calculateMissedRepsRatio(recentWorkouts);
  const baselineMissedRatio = calculateMissedRepsRatio(baselineWorkouts);
  
  if (recentMissedRatio > MISSED_REPS_THRESHOLD && recentMissedRatio > baselineMissedRatio) {
    indicators.push({
      type: 'missed_reps',
      severity: recentMissedRatio >= 0.2 ? 'severe' : recentMissedRatio >= 0.15 ? 'moderate' : 'mild',
      description: `${Math.round(recentMissedRatio * 100)}% of planned reps missed`,
      value: recentMissedRatio,
      baseline: baselineMissedRatio
    });
  }

  // 4. Session Frequency Drop
  const recentFrequency = recentWorkouts.length / 2; // per week
  const baselineFrequency = baselineWorkouts.length / 2; // per week
  
  if (baselineFrequency > 0 && (baselineFrequency - recentFrequency) / baselineFrequency >= 0.25) {
    indicators.push({
      type: 'session_frequency_drop',
      severity: recentFrequency <= baselineFrequency * 0.5 ? 'severe' : 'moderate',
      description: `Workout frequency dropped from ${baselineFrequency.toFixed(1)} to ${recentFrequency.toFixed(1)} per week`,
      value: recentFrequency,
      baseline: baselineFrequency
    });
  }

  // 5. Workout Duration Increase (could indicate fatigue/struggling)
  const recentDuration = calculateAverageDuration(recentWorkouts);
  const baselineDuration = calculateAverageDuration(baselineWorkouts);
  
  if (baselineDuration > 0) {
    const durationIncrease = (recentDuration - baselineDuration) / baselineDuration;
    if (durationIncrease >= 0.2) { // 20% longer workouts
      indicators.push({
        type: 'workout_duration_increase',
        severity: durationIncrease >= 0.35 ? 'severe' : durationIncrease >= 0.25 ? 'moderate' : 'mild',
        description: `Average workout duration increased by ${Math.round(durationIncrease * 100)}%`,
        value: recentDuration,
        baseline: baselineDuration
      });
    }
  }

  return indicators;
}

function calculateAverageRPE(workouts: WorkoutSession[]): number {
  let totalRPE = 0;
  let count = 0;

  workouts.forEach(workout => {
    workout.logs.forEach(log => {
      log.sets.forEach(set => {
        if (set.completed && set.rpe) {
          totalRPE += set.rpe;
          count++;
        }
      });
    });
  });

  return count > 0 ? totalRPE / count : 0;
}

function calculateAverageVolume(workouts: WorkoutSession[]): number {
  if (workouts.length === 0) return 0;

  const totalVolume = workouts.reduce((acc, workout) => {
    let volume = 0;
    workout.logs.forEach(log => {
      log.sets.forEach(set => {
        if (set.completed) {
          volume += set.weight * set.reps;
        }
      });
    });
    return acc + volume;
  }, 0);

  return totalVolume / workouts.length;
}

function calculateMissedRepsRatio(workouts: WorkoutSession[]): number {
  let totalPlanned = 0;
  let totalMissed = 0;

  workouts.forEach(workout => {
    workout.logs.forEach(log => {
      log.sets.forEach(set => {
        totalPlanned += set.reps;
        if (!set.completed) {
          totalMissed += set.reps;
        }
      });
    });
  });

  return totalPlanned > 0 ? totalMissed / totalPlanned : 0;
}

function calculateAverageDuration(workouts: WorkoutSession[]): number {
  if (workouts.length === 0) return 0;

  const totalDuration = workouts.reduce((acc, workout) => {
    if (workout.endTime) {
      return acc + (workout.endTime - workout.startTime) / 60000; // minutes
    }
    return acc;
  }, 0);

  return totalDuration / workouts.length;
}

function calculateDaysSinceImpliedDeload(history: WorkoutSession[]): number {
  // If no explicit deload date, estimate based on workout gaps
  const completedWorkouts = history
    .filter(w => w.status === 'completed' && w.endTime)
    .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

  if (completedWorkouts.length === 0) return 0;

  // Look for any gap > 7 days which might indicate a deload or break
  for (let i = 0; i < completedWorkouts.length - 1; i++) {
    const gap = (completedWorkouts[i].endTime || 0) - (completedWorkouts[i + 1].endTime || 0);
    if (gap > 7 * 24 * 60 * 60 * 1000) {
      // Found a break, calculate days since that break ended
      return Math.floor((Date.now() - (completedWorkouts[i].endTime || 0)) / (24 * 60 * 60 * 1000));
    }
  }

  // No break found, return days since first workout
  const firstWorkout = completedWorkouts[completedWorkouts.length - 1];
  return Math.floor((Date.now() - (firstWorkout.endTime || firstWorkout.startTime)) / (24 * 60 * 60 * 1000));
}

function calculateDeloadScore(
  stalls: ExerciseStall[],
  fatigue: FatigueIndicator[],
  daysSinceDeload: number,
  level: 'beginner' | 'intermediate' | 'advanced'
): number {
  let score = 0;

  // Time-based score (max 30 points)
  const deloadInterval = level === 'beginner' ? DELOAD_INTERVAL_BEGINNER 
    : level === 'advanced' ? DELOAD_INTERVAL_ADVANCED 
    : DELOAD_INTERVAL_INTERMEDIATE;
  
  const timeScore = Math.min(30, (daysSinceDeload / deloadInterval) * 30);
  score += timeScore;

  // Stall score (max 30 points)
  const stallScore = Math.min(30, stalls.length * 10 + stalls.reduce((acc, s) => acc + s.stallDuration * 2, 0));
  score += stallScore;

  // Fatigue indicator score (max 40 points)
  const severityPoints = { mild: 5, moderate: 10, severe: 15 };
  const fatigueScore = Math.min(40, fatigue.reduce((acc, f) => acc + severityPoints[f.severity], 0));
  score += fatigueScore;

  return Math.round(Math.min(100, score));
}

function determineUrgency(
  score: number,
  daysSinceDeload: number,
  level: 'beginner' | 'intermediate' | 'advanced'
): DeloadUrgency {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'recommended';
  if (score >= 40) return 'soon';
  return 'none';
}

function generateRecommendations(
  stalls: ExerciseStall[],
  fatigue: FatigueIndicator[],
  urgency: DeloadUrgency,
  level: 'beginner' | 'intermediate' | 'advanced'
): string[] {
  const recs: string[] = [];

  if (urgency === 'critical') {
    recs.push('Take a full deload week immediately - your body needs recovery');
    recs.push('Reduce training volume by 50-60% for the next 5-7 days');
  } else if (urgency === 'recommended') {
    recs.push('Plan a deload within the next week');
    recs.push('Consider reducing volume by 40% or taking extra rest days');
  }

  // Stall-specific recommendations
  if (stalls.length > 0) {
    const mainStall = stalls[0];
    recs.push(`${mainStall.exerciseName} has stalled for ${mainStall.stallDuration} weeks - consider exercise variation after deload`);
    
    if (stalls.length > 2) {
      recs.push('Multiple lifts stalling suggests systemic fatigue - prioritize recovery');
    }
  }

  // Fatigue-specific recommendations
  fatigue.forEach(f => {
    switch (f.type) {
      case 'rpe_creep':
        recs.push('Rising RPE at same weights indicates accumulated fatigue - deload to reset');
        break;
      case 'volume_drop':
        recs.push('Declining volume suggests you\'re fighting fatigue - a strategic rest will help');
        break;
      case 'missed_reps':
        recs.push('Missing planned reps is a clear sign of overreaching');
        break;
      case 'session_frequency_drop':
        recs.push('Reduced training frequency may indicate your body is asking for rest');
        break;
    }
  });

  // General recommendations
  if (urgency !== 'none') {
    recs.push('Prioritize sleep (7-9 hours) and nutrition during deload');
    recs.push('Light cardio and mobility work can aid recovery');
  }

  return recs.slice(0, 6); // Limit to 6 recommendations
}

function determinDeloadType(
  fatigue: FatigueIndicator[],
  stalls: ExerciseStall[]
): 'volume' | 'intensity' | 'full' | 'active_recovery' {
  const hasRPECreep = fatigue.some(f => f.type === 'rpe_creep' && f.severity !== 'mild');
  const hasVolumeDrop = fatigue.some(f => f.type === 'volume_drop');
  const severeFatigue = fatigue.filter(f => f.severity === 'severe').length >= 2;
  const manyStalls = stalls.length >= 3;

  if (severeFatigue || manyStalls) {
    return 'full';
  }
  
  if (hasRPECreep && !hasVolumeDrop) {
    return 'volume'; // Keep intensity, drop volume
  }
  
  if (hasVolumeDrop) {
    return 'intensity'; // Keep volume, drop intensity
  }

  return 'active_recovery';
}

function generateDeloadProtocol(
  type: 'volume' | 'intensity' | 'full' | 'active_recovery',
  level: 'beginner' | 'intermediate' | 'advanced',
  stalls: ExerciseStall[]
): DeloadProtocol {
  const protocols: Record<string, DeloadProtocol> = {
    volume: {
      durationDays: 5,
      volumeReduction: 50,
      intensityReduction: 0,
      focusAreas: ['Maintain intensity at top sets', 'Cut assistance work in half', 'Prioritize compound movements'],
      activities: ['Normal warm-ups', 'Singles/doubles at 85-90%', 'Skip accessory exercises', 'Focus on technique']
    },
    intensity: {
      durationDays: 5,
      volumeReduction: 20,
      intensityReduction: 30,
      focusAreas: ['Keep rep ranges the same', 'Use lighter loads', 'Focus on mind-muscle connection'],
      activities: ['Moderate tempo work', 'Pause reps', 'Technique drills', 'Light conditioning']
    },
    full: {
      durationDays: 7,
      volumeReduction: 60,
      intensityReduction: 40,
      focusAreas: ['Complete neural recovery', 'Address mobility limitations', 'Mental reset'],
      activities: ['Light movement only', 'Stretching and mobility', 'Walking/light cardio', 'No heavy lifting']
    },
    active_recovery: {
      durationDays: 4,
      volumeReduction: 40,
      intensityReduction: 20,
      focusAreas: ['Maintain movement patterns', 'Light pump work', 'Address weak points'],
      activities: ['Light full-body sessions', 'Mobility work', 'Technique practice', 'Conditioning']
    }
  };

  return protocols[type];
}

function createEmptyRecommendation(): DeloadRecommendation {
  return {
    urgency: 'none',
    score: 0,
    daysSinceLastDeload: 0,
    weeksSinceLastDeload: 0,
    stalledExercises: [],
    fatigueIndicators: [],
    recommendations: ['Continue training as normal', 'Track RPE to monitor fatigue'],
    suggestedDeloadType: 'active_recovery',
    deloadProtocol: {
      durationDays: 0,
      volumeReduction: 0,
      intensityReduction: 0,
      focusAreas: [],
      activities: []
    }
  };
}

export default analyzeDeloadNeed;
