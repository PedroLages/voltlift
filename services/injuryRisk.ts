/**
 * Injury Risk Detection Service
 *
 * Phase 3 Feature: Detect injury risk patterns and provide early warnings.
 * Uses analytics time series data to identify fatigue accumulation, volume spikes,
 * and other risk factors that may lead to injury.
 */

import { WorkoutSession, DailyLog, MuscleGroup } from '../types';
import { extractExerciseTimeSeries, extractVolumeTimeSeries, calculateTrend } from './analytics';

/**
 * Risk level categories
 */
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

/**
 * Individual risk factor detected
 */
export interface RiskFactor {
  type: 'rpe_trend' | 'volume_spike' | 'sleep_debt' | 'rapid_progression' | 'insufficient_recovery';
  severity: RiskLevel;
  description: string;
  recommendation: string;
  metric?: number; // Optional numeric value for the risk
}

/**
 * Overall injury risk assessment
 */
export interface InjuryRiskAssessment {
  overallRisk: RiskLevel;
  riskScore: number; // 0-100 (0 = no risk, 100 = critical risk)
  riskFactors: RiskFactor[];
  recommendations: string[];
  needsDeload: boolean;
  daysUntilRecommendedDeload: number;
}

/**
 * Assess overall injury risk based on recent training patterns
 *
 * @param history - All completed workouts
 * @param dailyLogs - Daily logs with sleep and mood data
 * @param weeksToAnalyze - Number of recent weeks to analyze (default 4)
 * @returns Injury risk assessment with recommendations
 */
export function assessInjuryRisk(
  history: WorkoutSession[],
  dailyLogs: DailyLog[],
  weeksToAnalyze: number = 4
): InjuryRiskAssessment {
  const riskFactors: RiskFactor[] = [];
  let totalRiskScore = 0;

  // Factor 1: RPE Trend Analysis (fatigue accumulation)
  const rpeTrend = analyzeRPETrend(history, weeksToAnalyze);
  if (rpeTrend) {
    riskFactors.push(rpeTrend);
    totalRiskScore += rpeTrend.metric || 0;
  }

  // Factor 2: Volume Spike Detection
  const volumeSpikes = detectVolumeSpikes(history, weeksToAnalyze);
  riskFactors.push(...volumeSpikes);
  totalRiskScore += volumeSpikes.reduce((sum, f) => sum + (f.metric || 0), 0);

  // Factor 3: Sleep Debt Analysis
  const sleepDebt = analyzeSleepDebt(dailyLogs, weeksToAnalyze);
  if (sleepDebt) {
    riskFactors.push(sleepDebt);
    totalRiskScore += sleepDebt.metric || 0;
  }

  // Factor 4: Rapid Progression Detection
  const rapidProgression = detectRapidProgression(history, weeksToAnalyze);
  riskFactors.push(...rapidProgression);
  totalRiskScore += rapidProgression.reduce((sum, f) => sum + (f.metric || 0), 0);

  // Factor 5: Insufficient Recovery Time
  const recoveryIssues = analyzeRecoveryTime(history, weeksToAnalyze);
  if (recoveryIssues) {
    riskFactors.push(recoveryIssues);
    totalRiskScore += recoveryIssues.metric || 0;
  }

  // Calculate overall risk level
  const riskScore = Math.min(100, totalRiskScore);
  const overallRisk: RiskLevel =
    riskScore >= 75 ? 'critical' :
    riskScore >= 50 ? 'high' :
    riskScore >= 25 ? 'moderate' : 'low';

  // Determine if deload is needed
  const needsDeload = riskScore >= 60 || riskFactors.some(f => f.severity === 'critical');
  const daysUntilRecommendedDeload = needsDeload ? 0 : Math.max(0, 21 - Math.floor(riskScore / 3));

  // Generate recommendations
  const recommendations = generateRecommendations(riskFactors, riskScore);

  return {
    overallRisk,
    riskScore,
    riskFactors,
    recommendations,
    needsDeload,
    daysUntilRecommendedDeload
  };
}

/**
 * Analyze RPE trends to detect fatigue accumulation
 * Rising RPE without corresponding strength gains indicates fatigue
 */
function analyzeRPETrend(
  history: WorkoutSession[],
  weeksToAnalyze: number
): RiskFactor | null {
  const cutoffDate = Date.now() - (weeksToAnalyze * 7 * 24 * 60 * 60 * 1000);

  const recentWorkouts = history
    .filter(w => w.status === 'completed' && w.startTime >= cutoffDate)
    .sort((a, b) => a.startTime - b.startTime);

  if (recentWorkouts.length < 3) return null;

  // Calculate average RPE for each workout
  const rpeData: { date: number; avgRPE: number }[] = [];

  recentWorkouts.forEach(workout => {
    const rpeSets = workout.logs
      .flatMap(log => log.sets)
      .filter(set => set.completed && set.rpe !== undefined);

    if (rpeSets.length > 0) {
      const avgRPE = rpeSets.reduce((sum, set) => sum + (set.rpe || 0), 0) / rpeSets.length;
      rpeData.push({ date: workout.startTime, avgRPE });
    }
  });

  if (rpeData.length < 3) return null;

  // Calculate trend (slope) in RPE over time
  const n = rpeData.length;
  const firstDate = rpeData[0].date;
  const x = rpeData.map(d => (d.date - firstDate) / (1000 * 60 * 60 * 24)); // days
  const y = rpeData.map(d => d.avgRPE);

  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (y[i] - yMean);
    denominator += (x[i] - xMean) * (x[i] - xMean);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const slopePerWeek = slope * 7;

  // Rising RPE (>0.3 points/week) is a warning sign
  if (slopePerWeek > 0.3) {
    const riskMetric = Math.min(30, slopePerWeek * 20);
    const severity: RiskLevel = slopePerWeek > 0.8 ? 'high' : slopePerWeek > 0.5 ? 'moderate' : 'low';

    return {
      type: 'rpe_trend',
      severity,
      description: `RPE increasing ${slopePerWeek.toFixed(1)} points/week - fatigue accumulating`,
      recommendation: 'Consider deload week or reduce training volume by 30-40%',
      metric: riskMetric
    };
  }

  return null;
}

/**
 * Detect sudden volume spikes (>20% increase week-over-week)
 */
function detectVolumeSpikes(
  history: WorkoutSession[],
  weeksToAnalyze: number
): RiskFactor[] {
  const muscleGroups: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
  const riskFactors: RiskFactor[] = [];

  muscleGroups.forEach(muscleGroup => {
    const volumeData = extractVolumeTimeSeries(muscleGroup, history, weeksToAnalyze);

    if (volumeData.length < 2) return;

    // Check for volume spikes (>20% increase)
    for (let i = 1; i < volumeData.length; i++) {
      const prevWeek = volumeData[i - 1];
      const currentWeek = volumeData[i];

      if (prevWeek.sets === 0) continue;

      const percentIncrease = ((currentWeek.sets - prevWeek.sets) / prevWeek.sets) * 100;

      if (percentIncrease > 20) {
        const isRecent = i === volumeData.length - 1;
        const riskMetric = isRecent ? Math.min(25, percentIncrease - 20) : Math.min(15, percentIncrease - 20);
        const severity: RiskLevel = percentIncrease > 50 ? 'high' : percentIncrease > 35 ? 'moderate' : 'low';

        riskFactors.push({
          type: 'volume_spike',
          severity: isRecent ? severity : (severity === 'high' ? 'moderate' : 'low'),
          description: `${muscleGroup} volume spiked ${percentIncrease.toFixed(0)}% in recent week`,
          recommendation: `Reduce ${muscleGroup} volume back to ${prevWeek.sets} sets/week`,
          metric: riskMetric
        });
      }
    }
  });

  return riskFactors;
}

/**
 * Analyze sleep debt from daily logs
 * Chronic sleep deprivation increases injury risk
 */
function analyzeSleepDebt(
  dailyLogs: DailyLog[],
  weeksToAnalyze: number
): RiskFactor | null {
  const cutoffDate = Date.now() - (weeksToAnalyze * 7 * 24 * 60 * 60 * 1000);

  const recentLogs = dailyLogs
    .filter(log => log.date >= cutoffDate && log.sleepHours !== undefined)
    .sort((a, b) => a.date - b.date);

  if (recentLogs.length < 7) return null;

  // Calculate average sleep
  const avgSleep = recentLogs.reduce((sum, log) => sum + (log.sleepHours || 0), 0) / recentLogs.length;

  // Calculate sleep debt (assuming 7.5 hours is optimal)
  const optimalSleep = 7.5;
  const sleepDebt = optimalSleep - avgSleep;

  if (sleepDebt > 1) {
    const riskMetric = Math.min(25, sleepDebt * 10);
    const severity: RiskLevel = sleepDebt > 2 ? 'high' : sleepDebt > 1.5 ? 'moderate' : 'low';

    return {
      type: 'sleep_debt',
      severity,
      description: `Average sleep ${avgSleep.toFixed(1)}h/night - ${sleepDebt.toFixed(1)}h below optimal`,
      recommendation: 'Prioritize 7.5+ hours sleep. Consider extra rest day this week.',
      metric: riskMetric
    };
  }

  return null;
}

/**
 * Detect rapid weight progression that may lead to form breakdown
 */
function detectRapidProgression(
  history: WorkoutSession[],
  weeksToAnalyze: number
): RiskFactor[] {
  const riskFactors: RiskFactor[] = [];

  // Check major compound lifts
  const compoundLifts = [
    'barbell-squat',
    'barbell-bench-press',
    'barbell-deadlift',
    'barbell-row'
  ];

  compoundLifts.forEach(exerciseId => {
    const timeSeries = extractExerciseTimeSeries(exerciseId, history, weeksToAnalyze);

    if (timeSeries.dataPoints.length < 3) return;

    // Calculate weekly weight progression rate
    const { slopePerWeek } = calculateTrend(timeSeries.dataPoints);

    // Rapid progression thresholds (lbs/week):
    // Novice can handle more, but >10lbs/week on compounds is risky
    if (slopePerWeek > 10) {
      const riskMetric = Math.min(20, (slopePerWeek - 10) * 2);
      const severity: RiskLevel = slopePerWeek > 15 ? 'high' : 'moderate';

      riskFactors.push({
        type: 'rapid_progression',
        severity,
        description: `${timeSeries.exerciseName} progressing ${slopePerWeek.toFixed(1)}lbs/week - may compromise form`,
        recommendation: 'Slow progression to 5-10lbs/week. Focus on perfect form.',
        metric: riskMetric
      });
    }
  });

  return riskFactors;
}

/**
 * Analyze recovery time between muscle group training sessions
 */
function analyzeRecoveryTime(
  history: WorkoutSession[],
  weeksToAnalyze: number
): RiskFactor | null {
  const cutoffDate = Date.now() - (weeksToAnalyze * 7 * 24 * 60 * 60 * 1000);

  const recentWorkouts = history
    .filter(w => w.status === 'completed' && w.startTime >= cutoffDate)
    .sort((a, b) => a.startTime - b.startTime);

  if (recentWorkouts.length < 4) return null;

  // Calculate average days between workouts
  const workoutDates = recentWorkouts.map(w => w.startTime);
  const intervals: number[] = [];

  for (let i = 1; i < workoutDates.length; i++) {
    const daysBetween = (workoutDates[i] - workoutDates[i - 1]) / (24 * 60 * 60 * 1000);
    intervals.push(daysBetween);
  }

  const avgDaysBetween = intervals.reduce((sum, days) => sum + days, 0) / intervals.length;

  // Training too frequently (avg < 1 day between workouts) is risky
  if (avgDaysBetween < 1) {
    const riskMetric = Math.min(20, (1 - avgDaysBetween) * 30);

    return {
      type: 'insufficient_recovery',
      severity: 'moderate',
      description: `Only ${avgDaysBetween.toFixed(1)} days average between workouts - insufficient recovery`,
      recommendation: 'Add at least 1 full rest day per week. Consider 3-4 day split.',
      metric: riskMetric
    };
  }

  return null;
}

/**
 * Generate actionable recommendations based on risk factors
 */
function generateRecommendations(
  riskFactors: RiskFactor[],
  riskScore: number
): string[] {
  const recommendations: string[] = [];

  if (riskScore >= 75) {
    recommendations.push('🚨 CRITICAL: Take immediate deload week (50% volume, same exercises)');
  } else if (riskScore >= 60) {
    recommendations.push('⚠️ HIGH RISK: Schedule deload week within next 3 days');
  } else if (riskScore >= 40) {
    recommendations.push('⚡ Moderate risk detected. Consider reducing volume by 20% this week.');
  }

  // Add specific recommendations from risk factors
  const criticalFactors = riskFactors.filter(f => f.severity === 'critical' || f.severity === 'high');
  criticalFactors.forEach(factor => {
    if (!recommendations.includes(factor.recommendation)) {
      recommendations.push(factor.recommendation);
    }
  });

  // General recovery recommendations
  if (riskFactors.some(f => f.type === 'sleep_debt')) {
    recommendations.push('Focus on sleep quality: 7.5-9 hours per night');
  }

  if (riskFactors.some(f => f.type === 'rpe_trend')) {
    recommendations.push('Include more rest-pause sets and reduce working sets by 1-2 per exercise');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Recovery looks good! Continue current training approach.');
  }

  return recommendations;
}

/**
 * Get simple injury risk status for quick checks
 */
export function getQuickRiskCheck(
  history: WorkoutSession[],
  dailyLogs: DailyLog[]
): { riskLevel: RiskLevel; message: string } {
  const assessment = assessInjuryRisk(history, dailyLogs, 2); // Check last 2 weeks only

  const messages = {
    critical: '🚨 Critical injury risk detected - deload recommended',
    high: '⚠️ High injury risk - reduce volume soon',
    moderate: '⚡ Moderate risk - monitor fatigue closely',
    low: '✅ Low risk - keep training hard'
  };

  return {
    riskLevel: assessment.overallRisk,
    message: messages[assessment.overallRisk]
  };
}
