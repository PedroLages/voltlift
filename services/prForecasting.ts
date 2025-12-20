/**
 * PR Forecasting Service
 *
 * Phase 3 Feature: Predict future personal records using exponential curve fitting.
 * Strength gains follow exponential decay (novice gains taper over time), not linear progression.
 */

import { WorkoutSession, ExperienceLevel } from '../types';
import { extractExerciseTimeSeries, calculateTrend, PerformancePoint } from './analytics';
import { EXERCISE_LIBRARY } from '../constants';

/**
 * PR forecast for a specific exercise
 */
export interface PRForecast {
  exerciseId: string;
  exerciseName: string;
  currentPR: number;
  predictedPR: number;
  predictedDate: number; // timestamp when predicted PR might be achieved
  weeksToTarget: number;
  confidence: number; // 0-1 (1 = very confident, 0 = unreliable)
  reasoning: string;
  projectionCurve: { date: number; weight: number }[]; // 8-week projection
  isAchievable: boolean; // Based on historical progress rate
}

/**
 * Exponential model parameters for strength progression
 */
interface ExponentialModel {
  a: number; // Asymptote (max potential)
  b: number; // Growth rate
  c: number; // Baseline
  r2Score: number; // Model fit quality
}

/**
 * Forecast PR using exponential curve fitting
 *
 * @param exerciseId - Exercise to forecast
 * @param exerciseName - Name of exercise
 * @param history - All completed workouts
 * @param experienceLevel - User experience (affects growth rate expectations)
 * @param weeksToProject - How many weeks to forecast (default 8)
 * @returns PR forecast with projection curve
 */
export function forecastPR(
  exerciseId: string,
  exerciseName: string,
  history: WorkoutSession[],
  experienceLevel: ExperienceLevel = 'Intermediate',
  weeksToProject: number = 8
): PRForecast | null {
  // Extract time series data (last 12 weeks)
  const timeSeries = extractExerciseTimeSeries(exerciseId, history, 12);

  if (timeSeries.dataPoints.length < 4) {
    return null; // Need at least 4 data points for reliable forecasting
  }

  // Get current PR
  const currentPR = Math.max(...timeSeries.dataPoints.map(p => p.estimated1RM));

  // Fit exponential model to historical data
  const model = fitExponentialModel(timeSeries.dataPoints, experienceLevel);

  if (model.r2Score < 0.3) {
    // Poor model fit - data too noisy for reliable forecasting
    return {
      exerciseId,
      exerciseName,
      currentPR,
      predictedPR: currentPR,
      predictedDate: Date.now() + (weeksToProject * 7 * 24 * 60 * 60 * 1000),
      weeksToTarget: weeksToProject,
      confidence: 0,
      reasoning: 'Insufficient consistent progress data for reliable forecast. Continue training and track progress.',
      projectionCurve: [],
      isAchievable: false
    };
  }

  // Generate 8-week projection curve
  const firstDate = timeSeries.dataPoints[0].date;
  const daysSinceStart = (Date.now() - firstDate) / (1000 * 60 * 60 * 24);
  const projectionCurve: { date: number; weight: number }[] = [];

  for (let week = 0; week <= weeksToProject; week++) {
    const daysInFuture = week * 7;
    const totalDays = daysSinceStart + daysInFuture;
    const projected1RM = predictValue(model, totalDays);
    const projectionDate = Date.now() + (daysInFuture * 24 * 60 * 60 * 1000);

    projectionCurve.push({
      date: projectionDate,
      weight: Math.round(projected1RM)
    });
  }

  // Predicted PR at end of projection period
  const predictedPR = projectionCurve[projectionCurve.length - 1].weight;

  // Calculate confidence based on model fit and recent progress
  const confidence = calculateConfidence(model, timeSeries.dataPoints, experienceLevel);

  // Determine if target is achievable
  const gainNeeded = predictedPR - currentPR;
  const { slopePerWeek } = calculateTrend(timeSeries.dataPoints);
  const expectedGain = slopePerWeek * weeksToProject;
  const isAchievable = gainNeeded > 0 && gainNeeded <= expectedGain * 1.5; // Within 150% of current rate

  // Calculate weeks to target (if gaining)
  let weeksToTarget = weeksToProject;
  if (gainNeeded > 0 && slopePerWeek > 0.1) {
    weeksToTarget = Math.min(weeksToProject, Math.ceil(gainNeeded / slopePerWeek));
  }

  // Generate reasoning
  const reasoning = generateForecastReasoning(
    gainNeeded,
    slopePerWeek,
    confidence,
    isAchievable,
    experienceLevel
  );

  return {
    exerciseId,
    exerciseName,
    currentPR,
    predictedPR,
    predictedDate: projectionCurve[weeksToTarget]?.date || projectionCurve[projectionCurve.length - 1].date,
    weeksToTarget,
    confidence,
    reasoning,
    projectionCurve,
    isAchievable
  };
}

/**
 * Fit exponential model to performance data
 * Model: y = a * (1 - e^(-bx)) + c
 * Where:
 * - a = asymptote (max potential above baseline)
 * - b = growth rate
 * - c = baseline (starting point)
 */
function fitExponentialModel(
  dataPoints: PerformancePoint[],
  experienceLevel: ExperienceLevel
): ExponentialModel {
  // Convert to days since first workout
  const firstDate = dataPoints[0].date;
  const x = dataPoints.map(p => (p.date - firstDate) / (1000 * 60 * 60 * 24)); // days
  const y = dataPoints.map(p => p.estimated1RM);

  const n = dataPoints.length;

  // Estimate initial parameters
  const yMin = Math.min(...y);
  const yMax = Math.max(...y);
  const yRange = yMax - yMin;

  // Initial guesses based on experience level
  const growthRates = {
    Beginner: 0.08,    // Fast gains
    Intermediate: 0.04, // Moderate gains
    Advanced: 0.02      // Slow, steady gains
  };

  let bestModel: ExponentialModel = {
    a: yRange * 2,
    b: growthRates[experienceLevel],
    c: yMin,
    r2Score: 0
  };

  // Simple optimization: try multiple parameter combinations
  const aValues = [yRange, yRange * 1.5, yRange * 2, yRange * 3];
  const bValues = [0.01, 0.02, 0.04, 0.06, 0.08, 0.1];

  let bestR2 = -Infinity;

  aValues.forEach(a => {
    bValues.forEach(b => {
      const c = yMin;

      // Calculate R² for this model
      const predictions = x.map(xi => a * (1 - Math.exp(-b * xi)) + c);
      const mean = y.reduce((sum, val) => sum + val, 0) / n;

      const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
      const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - mean, 2), 0);
      const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

      if (r2 > bestR2) {
        bestR2 = r2;
        bestModel = { a, b, c, r2Score: r2 };
      }
    });
  });

  // Ensure R² is valid
  bestModel.r2Score = Math.max(0, Math.min(1, bestR2));

  return bestModel;
}

/**
 * Predict value using exponential model
 */
function predictValue(model: ExponentialModel, days: number): number {
  return model.a * (1 - Math.exp(-model.b * days)) + model.c;
}

/**
 * Calculate forecast confidence score
 */
function calculateConfidence(
  model: ExponentialModel,
  dataPoints: PerformancePoint[],
  experienceLevel: ExperienceLevel
): number {
  let confidence = 0;

  // Factor 1: Model fit quality (0-40 points)
  confidence += model.r2Score * 40;

  // Factor 2: Data consistency (0-30 points)
  const dataConsistency = calculateDataConsistency(dataPoints);
  confidence += dataConsistency * 30;

  // Factor 3: Sample size (0-20 points)
  const sampleScore = Math.min(1, dataPoints.length / 12); // 12+ workouts = max score
  confidence += sampleScore * 20;

  // Factor 4: Experience level adjustment (0-10 points)
  const experienceScores = {
    Beginner: 10,      // More predictable linear gains
    Intermediate: 7,   // Moderate predictability
    Advanced: 4        // Harder to predict, slower gains
  };
  confidence += experienceScores[experienceLevel];

  return Math.min(100, Math.max(0, confidence)) / 100; // Normalize to 0-1
}

/**
 * Calculate data consistency (low variance = high consistency)
 */
function calculateDataConsistency(dataPoints: PerformancePoint[]): number {
  if (dataPoints.length < 3) return 0;

  // Calculate variance in week-to-week changes
  const changes: number[] = [];
  for (let i = 1; i < dataPoints.length; i++) {
    const change = dataPoints[i].estimated1RM - dataPoints[i - 1].estimated1RM;
    changes.push(change);
  }

  const mean = changes.reduce((sum, val) => sum + val, 0) / changes.length;
  const variance = changes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / changes.length;
  const stdDev = Math.sqrt(variance);

  // Low standard deviation = high consistency
  // Normalize: 0-5lbs stdDev = perfect, >20lbs = poor
  const consistency = Math.max(0, 1 - (stdDev / 20));

  return consistency;
}

/**
 * Generate human-readable forecast reasoning
 */
function generateForecastReasoning(
  gainNeeded: number,
  slopePerWeek: number,
  confidence: number,
  isAchievable: boolean,
  experienceLevel: ExperienceLevel
): string {
  if (gainNeeded <= 0) {
    return 'Maintain current training approach. Focus on consistency and progressive overload.';
  }

  if (confidence < 0.3) {
    return 'Progress data is inconsistent. Focus on regular training and tracking before forecasting.';
  }

  if (!isAchievable) {
    return `Target requires ${gainNeeded.toFixed(0)}lbs gain, but current rate is ${slopePerWeek.toFixed(1)}lbs/week. Adjust expectations or increase training volume.`;
  }

  const timeframe = Math.ceil(gainNeeded / Math.max(0.1, slopePerWeek));

  if (confidence >= 0.7) {
    return `Strong forecast: Current progress (${slopePerWeek.toFixed(1)}lbs/week) projects ${gainNeeded.toFixed(0)}lbs gain in ${timeframe} weeks with ${experienceLevel} programming.`;
  } else if (confidence >= 0.5) {
    return `Moderate confidence: Projected ${gainNeeded.toFixed(0)}lbs gain in ~${timeframe} weeks. Progress may vary based on recovery and consistency.`;
  } else {
    return `Low confidence: Estimated ${timeframe} weeks to target. Results depend heavily on training consistency and recovery quality.`;
  }
}

/**
 * Get multiple exercise forecasts for comparison
 */
export function forecastMultipleExercises(
  exerciseIds: string[],
  history: WorkoutSession[],
  experienceLevel: ExperienceLevel = 'Intermediate'
): PRForecast[] {
  const forecasts: PRForecast[] = [];

  exerciseIds.forEach(exerciseId => {
    // Find exercise name from library
    const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
    if (!exercise) return;

    const forecast = forecastPR(
      exerciseId,
      exercise.name,
      history,
      experienceLevel,
      8
    );

    if (forecast) {
      forecasts.push(forecast);
    }
  });

  return forecasts;
}

/**
 * Quick forecast check (for dashboard widgets)
 */
export function getQuickForecast(
  exerciseId: string,
  exerciseName: string,
  history: WorkoutSession[],
  experienceLevel: ExperienceLevel = 'Intermediate'
): { predicted: number; confidence: string; weeks: number } | null {
  const forecast = forecastPR(exerciseId, exerciseName, history, experienceLevel, 4);

  if (!forecast) return null;

  const confidenceLabel =
    forecast.confidence >= 0.7 ? 'High' :
    forecast.confidence >= 0.5 ? 'Medium' : 'Low';

  return {
    predicted: forecast.predictedPR,
    confidence: confidenceLabel,
    weeks: forecast.weeksToTarget
  };
}
