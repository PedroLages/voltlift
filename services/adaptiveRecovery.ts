/**
 * Adaptive Recovery Recommendations Service
 *
 * Phase 3 Feature: Context-aware recovery recommendations based on injury risk,
 * training load, sleep quality, and periodization phase.
 *
 * Provides intelligent suggestions for:
 * - Rest day timing
 * - Active recovery activities
 * - Sleep optimization
 * - Nutrition timing
 * - Deload scheduling
 */

import { WorkoutSession, DailyLog, MuscleGroup, ExperienceLevel } from '../types';
import { assessInjuryRisk, InjuryRiskAssessment } from './injuryRisk';
import { getPeriodizationStatus } from './periodization';
import { extractVolumeTimeSeries } from './analytics';

/**
 * Recovery priority level
 */
export type RecoveryPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Recovery recommendation type
 */
export type RecoveryType =
  | 'rest_day'
  | 'active_recovery'
  | 'sleep_focus'
  | 'nutrition'
  | 'deload'
  | 'mobility';

/**
 * Individual recovery recommendation
 */
export interface RecoveryRecommendation {
  type: RecoveryType;
  priority: RecoveryPriority;
  title: string;
  description: string;
  actionItems: string[];
  daysUntilAction?: number; // Days until this should be done
  duration?: string; // How long to do this (e.g., "1 week", "2 days")
}

/**
 * Complete recovery assessment with recommendations
 */
export interface RecoveryAssessment {
  overallRecoveryScore: number; // 0-100 (100 = fully recovered)
  readyToTrain: boolean;
  recommendations: RecoveryRecommendation[];
  nextRestDay: number; // timestamp
  daysUntilRestDay: number;
  sleepDebt: number; // Hours of sleep debt
  trainingStress: number; // 0-100 cumulative fatigue score
}

/**
 * Get comprehensive recovery assessment
 *
 * @param history - All completed workouts
 * @param dailyLogs - Daily logs with sleep and mood
 * @param experienceLevel - User's training experience
 * @param lastRestDay - Timestamp of last complete rest day (optional)
 * @returns Recovery assessment with prioritized recommendations
 */
export function getRecoveryAssessment(
  history: WorkoutSession[],
  dailyLogs: DailyLog[],
  experienceLevel: ExperienceLevel = 'Intermediate',
  lastRestDay?: number
): RecoveryAssessment {
  const now = Date.now();
  const recommendations: RecoveryRecommendation[] = [];

  // Factor 1: Injury Risk Assessment
  const injuryRisk = history.length >= 3
    ? assessInjuryRisk(history, dailyLogs, 4)
    : null;

  // Factor 2: Sleep Quality
  const sleepAnalysis = analyzeSleepPatterns(dailyLogs, 7);

  // Factor 3: Training Load
  const trainingStress = calculateTrainingStress(history, dailyLogs, 7);

  // Factor 4: Periodization Status
  const periodization = getPeriodizationStatus(history, dailyLogs, experienceLevel);

  // Factor 5: Days since rest
  const daysSinceRest = lastRestDay
    ? Math.floor((now - lastRestDay) / (24 * 60 * 60 * 1000))
    : 7;

  // Calculate overall recovery score
  const overallRecoveryScore = calculateRecoveryScore(
    injuryRisk,
    sleepAnalysis,
    trainingStress,
    daysSinceRest
  );

  // Determine if ready to train
  const readyToTrain = overallRecoveryScore >= 60 &&
                       (!injuryRisk || injuryRisk.overallRisk !== 'critical');

  // Generate recommendations based on factors

  // 1. Critical injury risk = immediate rest/deload
  if (injuryRisk?.needsDeload) {
    recommendations.push({
      type: 'deload',
      priority: 'critical',
      title: 'Immediate Deload Required',
      description: `Critical injury risk detected (${injuryRisk.riskScore}/100). Take a full deload week to prevent injury.`,
      actionItems: [
        'Reduce volume by 50% for all exercises',
        'Lower intensity to 70% of normal weights',
        'Focus on perfect form and technique',
        'Add extra mobility and stretching work',
        'Get 8+ hours of sleep per night'
      ],
      duration: '1 week',
      daysUntilAction: 0
    });
  }

  // 2. High injury risk = extra rest day this week
  if (injuryRisk && injuryRisk.overallRisk === 'high' && !injuryRisk.needsDeload) {
    recommendations.push({
      type: 'rest_day',
      priority: 'high',
      title: 'Add Extra Rest Day This Week',
      description: `Elevated injury risk (${injuryRisk.riskScore}/100). Schedule an additional rest day within 2 days.`,
      actionItems: [
        'Take a complete rest day within next 48 hours',
        'Focus on sleep and nutrition',
        'Light walking or yoga only',
        'Monitor fatigue levels closely'
      ],
      daysUntilAction: 2
    });
  }

  // 3. Sleep debt = prioritize sleep
  if (sleepAnalysis.sleepDebt > 5) {
    recommendations.push({
      type: 'sleep_focus',
      priority: 'high',
      title: 'Critical Sleep Debt Detected',
      description: `You're ${sleepAnalysis.sleepDebt.toFixed(1)} hours behind on sleep this week. This impacts recovery by 7-11%.`,
      actionItems: [
        `Aim for ${Math.ceil(sleepAnalysis.optimalSleep + 1)} hours tonight to catch up`,
        'Go to bed 30-60 minutes earlier',
        'Limit caffeine after 2 PM',
        'Reduce screen time 1 hour before bed',
        'Keep bedroom cool (65-68°F)'
      ],
      duration: '3-5 days'
    });
  } else if (sleepAnalysis.sleepDebt > 2) {
    recommendations.push({
      type: 'sleep_focus',
      priority: 'medium',
      title: 'Moderate Sleep Debt',
      description: `${sleepAnalysis.sleepDebt.toFixed(1)} hours of sleep debt accumulated. Prioritize recovery tonight.`,
      actionItems: [
        `Target ${Math.ceil(sleepAnalysis.optimalSleep)} hours of sleep`,
        'Consider a 20-minute nap today',
        'Avoid late evening workouts'
      ],
      duration: '2-3 days'
    });
  }

  // 4. High training stress = active recovery day
  if (trainingStress > 75 && !injuryRisk?.needsDeload) {
    recommendations.push({
      type: 'active_recovery',
      priority: 'high',
      title: 'High Training Stress - Active Recovery Needed',
      description: `Training stress at ${trainingStress}/100. Schedule an active recovery session.`,
      actionItems: [
        '20-30 minute light cardio (walking, cycling)',
        'Full body mobility routine',
        'Foam rolling for tight areas',
        'Light stretching (10-15 minutes)',
        'Sauna or hot bath if available'
      ],
      daysUntilAction: 1,
      duration: '30-45 minutes'
    });
  }

  // 5. Approaching deload phase
  if (periodization.daysUntilDeload <= 7 && periodization.daysUntilDeload > 0) {
    recommendations.push({
      type: 'deload',
      priority: 'medium',
      title: 'Deload Week Approaching',
      description: `Scheduled deload in ${periodization.daysUntilDeload} days. Start preparing.`,
      actionItems: [
        'Finish any planned PRs this week',
        'Plan deload week workouts (50% volume)',
        'Stock up on recovery foods',
        'Schedule extra sleep during deload week'
      ],
      daysUntilAction: periodization.daysUntilDeload
    });
  }

  // 6. Poor sleep quality recently
  if (sleepAnalysis.avgQuality < 6) {
    recommendations.push({
      type: 'sleep_focus',
      priority: 'medium',
      title: 'Sleep Quality Needs Improvement',
      description: `Average sleep quality ${sleepAnalysis.avgQuality.toFixed(1)}/10 this week. Poor sleep hurts gains.`,
      actionItems: [
        'Review sleep hygiene checklist',
        'Ensure room is dark and cool',
        'Consider magnesium supplement before bed',
        'Limit alcohol consumption',
        'Try 10 minutes of meditation before sleep'
      ]
    });
  }

  // 7. Long time without rest (7+ days)
  if (daysSinceRest >= 7) {
    recommendations.push({
      type: 'rest_day',
      priority: daysSinceRest >= 10 ? 'high' : 'medium',
      title: `${daysSinceRest} Days Without Complete Rest`,
      description: 'Extended training without full rest increases injury risk and reduces performance.',
      actionItems: [
        'Take a complete rest day within 24 hours',
        'No training, only light movement',
        'Focus on nutrition and hydration',
        'Get extra sleep (8+ hours)'
      ],
      daysUntilAction: 0
    });
  }

  // 8. Nutrition timing for recovery
  if (trainingStress > 60 || injuryRisk?.riskScore! > 50) {
    recommendations.push({
      type: 'nutrition',
      priority: 'low',
      title: 'Optimize Nutrition for Recovery',
      description: 'High training stress requires optimal nutrition timing and quality.',
      actionItems: [
        'Consume 20-30g protein within 1 hour post-workout',
        'Aim for 1g protein per lb bodyweight daily',
        'Eat carbs around training (before/after)',
        'Stay hydrated (0.5-1oz water per lb bodyweight)',
        'Consider creatine (5g daily) for recovery'
      ]
    });
  }

  // 9. Mobility work if undertrained in flexibility
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'mobility',
      priority: 'low',
      title: 'Add Mobility Work',
      description: 'Recovery is good! Use this time to improve mobility and prevent future injuries.',
      actionItems: [
        '10 minutes daily mobility routine',
        'Focus on hip flexors and thoracic spine',
        'Add yoga or pilates once per week',
        'Foam roll after heavy sessions'
      ]
    });
  }

  // Sort recommendations by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Calculate next rest day
  const recommendedRestFrequency = getRestDayFrequency(experienceLevel, trainingStress);
  const daysUntilRestDay = Math.max(0, recommendedRestFrequency - daysSinceRest);
  const nextRestDay = now + (daysUntilRestDay * 24 * 60 * 60 * 1000);

  return {
    overallRecoveryScore,
    readyToTrain,
    recommendations,
    nextRestDay,
    daysUntilRestDay,
    sleepDebt: sleepAnalysis.sleepDebt,
    trainingStress
  };
}

/**
 * Analyze sleep patterns over recent days
 */
function analyzeSleepPatterns(
  dailyLogs: DailyLog[],
  daysToAnalyze: number = 7
): {
  avgSleep: number;
  sleepDebt: number;
  avgQuality: number;
  optimalSleep: number;
} {
  const cutoffDate = Date.now() - (daysToAnalyze * 24 * 60 * 60 * 1000);
  const recentLogs = dailyLogs
    .filter(log => new Date(log.date).getTime() >= cutoffDate && log.sleepHours !== undefined)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, daysToAnalyze);

  if (recentLogs.length === 0) {
    return { avgSleep: 7, sleepDebt: 0, avgQuality: 7, optimalSleep: 7.5 };
  }

  const avgSleep = recentLogs.reduce((sum, log) => sum + (log.sleepHours || 0), 0) / recentLogs.length;
  const optimalSleep = 7.5; // Research-based optimal
  const sleepDebt = (optimalSleep - avgSleep) * recentLogs.length;

  // Calculate average sleep quality if tracked
  const logsWithQuality = recentLogs.filter(log => log.mood !== undefined);
  const avgQuality = logsWithQuality.length > 0
    ? logsWithQuality.reduce((sum, log) => sum + (log.mood || 5), 0) / logsWithQuality.length
    : 7;

  return {
    avgSleep,
    sleepDebt: Math.max(0, sleepDebt),
    avgQuality,
    optimalSleep
  };
}

/**
 * Calculate cumulative training stress
 */
function calculateTrainingStress(
  history: WorkoutSession[],
  dailyLogs: DailyLog[],
  daysToAnalyze: number = 7
): number {
  const cutoffDate = Date.now() - (daysToAnalyze * 24 * 60 * 60 * 1000);

  const recentWorkouts = history.filter(
    w => w.status === 'completed' && w.startTime >= cutoffDate
  );

  if (recentWorkouts.length === 0) return 0;

  // Calculate total volume (sets × reps × weight)
  const totalVolume = recentWorkouts.reduce((sum, workout) => {
    const workoutVolume = workout.logs.reduce((logSum, log) => {
      const logVolume = log.sets
        .filter(s => s.completed && s.type !== 'W')
        .reduce((setSum, set) => setSum + (set.reps * set.weight), 0);
      return logSum + logVolume;
    }, 0);
    return sum + workoutVolume;
  }, 0);

  // Calculate average RPE if tracked
  const allSets = recentWorkouts.flatMap(w => w.logs.flatMap(l => l.sets.filter(s => s.completed && s.rpe)));
  const avgRPE = allSets.length > 0
    ? allSets.reduce((sum, set) => sum + (set.rpe || 7), 0) / allSets.length
    : 7;

  // Stress score combines volume, frequency, and intensity
  const frequencyScore = (recentWorkouts.length / daysToAnalyze) * 20; // 0-20 points
  const volumeScore = Math.min(40, totalVolume / 1000); // 0-40 points (cap at 40k lbs)
  const intensityScore = (avgRPE / 10) * 40; // 0-40 points

  const trainingStress = frequencyScore + volumeScore + intensityScore;

  return Math.min(100, Math.max(0, trainingStress));
}

/**
 * Calculate overall recovery score from multiple factors
 */
function calculateRecoveryScore(
  injuryRisk: InjuryRiskAssessment | null,
  sleepAnalysis: ReturnType<typeof analyzeSleepPatterns>,
  trainingStress: number,
  daysSinceRest: number
): number {
  let score = 100;

  // Factor 1: Injury risk (0-40 points deduction)
  if (injuryRisk) {
    score -= injuryRisk.riskScore * 0.4;
  }

  // Factor 2: Sleep debt (0-20 points deduction)
  const sleepDeduction = Math.min(20, sleepAnalysis.sleepDebt * 2);
  score -= sleepDeduction;

  // Factor 3: Training stress (0-30 points deduction)
  const stressDeduction = (trainingStress / 100) * 30;
  score -= stressDeduction;

  // Factor 4: Days without rest (0-10 points deduction)
  if (daysSinceRest >= 7) {
    const restDeduction = Math.min(10, (daysSinceRest - 6) * 2);
    score -= restDeduction;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get recommended rest day frequency based on factors
 */
function getRestDayFrequency(
  experienceLevel: ExperienceLevel,
  trainingStress: number
): number {
  // Base frequency by experience
  const baseFrequency = {
    Beginner: 2,     // Rest every 2 days
    Intermediate: 3, // Rest every 3 days
    Advanced: 4      // Rest every 4 days (or more)
  }[experienceLevel];

  // Adjust for high training stress
  if (trainingStress > 80) {
    return Math.max(1, baseFrequency - 1);
  }

  return baseFrequency;
}

/**
 * Get quick recovery status for dashboard widgets
 */
export function getQuickRecoveryStatus(
  history: WorkoutSession[],
  dailyLogs: DailyLog[],
  experienceLevel: ExperienceLevel = 'Intermediate'
): {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  topRecommendation: string;
} {
  const assessment = getRecoveryAssessment(history, dailyLogs, experienceLevel);

  const status =
    assessment.overallRecoveryScore >= 85 ? 'excellent' :
    assessment.overallRecoveryScore >= 70 ? 'good' :
    assessment.overallRecoveryScore >= 50 ? 'fair' : 'poor';

  const topRecommendation = assessment.recommendations[0]?.title || 'Keep up the good work!';

  return {
    score: assessment.overallRecoveryScore,
    status,
    topRecommendation
  };
}
