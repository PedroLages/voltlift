/**
 * GRU-based Fatigue Prediction Model
 *
 * Uses a Gated Recurrent Unit (GRU) neural network to predict fatigue
 * 7-14 days in advance based on training history patterns.
 *
 * Architecture:
 * - Input: 28-day sequence of daily features (12 features per day)
 * - GRU Layer 1: 64 units with dropout
 * - GRU Layer 2: 32 units
 * - Dense output: 14 values (fatigue prediction for next 14 days)
 *
 * This runs entirely in the browser using TensorFlow.js.
 */

import * as tf from '@tensorflow/tfjs';
import { FatiguePrediction, DailyMLFeatures, WorkoutSession, DailyLog } from '../../types';
import { extractFeatureSequence, featuresToTensor } from './featureExtraction';

// =============================================================================
// Types
// =============================================================================

export interface PredictorConfig {
  sequenceLength: number;      // Days of history to use (default: 28)
  predictionHorizon: number;   // Days to predict ahead (default: 14)
  gruUnits1: number;           // First GRU layer units (default: 64)
  gruUnits2: number;           // Second GRU layer units (default: 32)
  learningRate: number;        // Training learning rate (default: 0.001)
  batchSize: number;           // Training batch size (default: 16)
}

export interface TrainingData {
  sequences: number[][][];     // [samples, timesteps, features]
  labels: number[][];          // [samples, prediction_horizon]
}

export interface PredictionResult {
  predictions: FatiguePrediction[];
  confidence: number;
  modelVersion: string;
  generatedAt: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CONFIG: PredictorConfig = {
  sequenceLength: 28,
  predictionHorizon: 14,
  gruUnits1: 64,
  gruUnits2: 32,
  learningRate: 0.001,
  batchSize: 16
};

const FEATURE_COUNT = 12; // Number of features per day
const MIN_TRAINING_SAMPLES = 42; // Need at least 6 weeks of data
const MODEL_STORAGE_KEY = 'ironpath-fatigue-model';
const MODEL_VERSION = '1.0.0';

// Fatigue thresholds
const FATIGUE_THRESHOLDS = {
  low: 0.3,
  moderate: 0.5,
  high: 0.7,
  critical: 0.85
};

// =============================================================================
// Model Creation
// =============================================================================

/**
 * Create the GRU model architecture
 */
export function createModel(config: PredictorConfig = DEFAULT_CONFIG): tf.LayersModel {
  const model = tf.sequential();

  // Input shape: [sequenceLength, featureCount]
  // First GRU layer with return sequences for stacking
  model.add(tf.layers.gru({
    units: config.gruUnits1,
    inputShape: [config.sequenceLength, FEATURE_COUNT],
    returnSequences: true,
    dropout: 0.2,
    recurrentDropout: 0.2,
    kernelInitializer: 'glorotUniform',
    recurrentInitializer: 'orthogonal'
  }));

  // Batch normalization for training stability
  model.add(tf.layers.batchNormalization());

  // Second GRU layer
  model.add(tf.layers.gru({
    units: config.gruUnits2,
    returnSequences: false,
    dropout: 0.1
  }));

  // Dense hidden layer
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu'
  }));

  // Output layer: predict fatigue for each day in horizon
  model.add(tf.layers.dense({
    units: config.predictionHorizon,
    activation: 'sigmoid' // Fatigue is 0-1
  }));

  // Compile with MSE loss (regression task)
  model.compile({
    optimizer: tf.train.adam(config.learningRate),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });

  return model;
}

// =============================================================================
// Prediction Functions
// =============================================================================

/**
 * Predict fatigue for the next N days
 */
export async function predictFatigue(
  model: tf.LayersModel,
  history: WorkoutSession[],
  dailyLogs: DailyLog[],
  config: PredictorConfig = DEFAULT_CONFIG
): Promise<PredictionResult> {
  // Extract feature sequence for the last 28 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = today.getTime();

  const sequence = extractFeatureSequence(
    history,
    dailyLogs,
    endDate,
    config.sequenceLength
  );

  // Convert to tensor
  const inputArray = featuresToTensor(sequence);
  const inputTensor = tf.tensor2d(inputArray);

  // Reshape for batch: [1, sequenceLength, features]
  const batchedInput = inputTensor.expandDims(0);

  // Run prediction
  const prediction = model.predict(batchedInput) as tf.Tensor;
  const predictionData = await prediction.data();

  // Clean up tensors
  inputTensor.dispose();
  batchedInput.dispose();
  prediction.dispose();

  // Convert to FatiguePrediction objects
  const predictions: FatiguePrediction[] = [];

  for (let i = 0; i < config.predictionHorizon; i++) {
    const fatigueLevel = predictionData[i];
    const date = new Date(endDate + (i + 1) * 24 * 60 * 60 * 1000);

    predictions.push({
      date: date.toISOString().split('T')[0],
      predictedFatigueLevel: fatigueLevel,
      confidence: calculateDayConfidence(i, sequence.length),
      riskLevel: classifyRiskLevel(fatigueLevel),
      recommendation: generateRecommendation(fatigueLevel, i),
      contributingFactors: identifyContributingFactors(sequence, fatigueLevel)
    });
  }

  // Check if deload is predicted
  const deloadPrediction = predictDeloadNeed(predictions);

  return {
    predictions,
    confidence: calculateOverallConfidence(sequence.length, config.sequenceLength),
    modelVersion: MODEL_VERSION,
    generatedAt: Date.now(),
    ...deloadPrediction
  };
}

/**
 * Predict if user needs a deload based on fatigue trajectory
 */
function predictDeloadNeed(predictions: FatiguePrediction[]): {
  deloadRecommended: boolean;
  deloadUrgency?: 'suggested' | 'recommended' | 'urgent';
  deloadWindow?: { start: string; end: string };
} {
  // Find when fatigue exceeds high threshold
  const highFatigueDay = predictions.findIndex(p => p.predictedFatigueLevel !== undefined && p.predictedFatigueLevel > FATIGUE_THRESHOLDS.high);
  const criticalFatigueDay = predictions.findIndex(p => p.predictedFatigueLevel !== undefined && p.predictedFatigueLevel > FATIGUE_THRESHOLDS.critical);

  if (criticalFatigueDay !== -1 && criticalFatigueDay < 7) {
    // Critical fatigue predicted within a week
    return {
      deloadRecommended: true,
      deloadUrgency: 'urgent',
      deloadWindow: {
        start: predictions[Math.max(0, criticalFatigueDay - 3)].date || '',
        end: predictions[criticalFatigueDay].date || ''
      }
    };
  }

  if (highFatigueDay !== -1 && highFatigueDay < 10) {
    // High fatigue predicted within 10 days
    return {
      deloadRecommended: true,
      deloadUrgency: 'recommended',
      deloadWindow: {
        start: predictions[Math.max(0, highFatigueDay - 2)].date || '',
        end: predictions[Math.min(predictions.length - 1, highFatigueDay + 2)].date || ''
      }
    };
  }

  // Check for steadily increasing fatigue
  const firstWeekAvg = predictions.slice(0, 7).reduce((sum, p) => sum + (p.predictedFatigueLevel || 0), 0) / 7;
  const secondWeekAvg = predictions.slice(7).reduce((sum, p) => sum + (p.predictedFatigueLevel || 0), 0) / 7;

  if (secondWeekAvg > firstWeekAvg + 0.15 && secondWeekAvg > FATIGUE_THRESHOLDS.moderate) {
    return {
      deloadRecommended: true,
      deloadUrgency: 'suggested',
      deloadWindow: {
        start: predictions[7].date || '',
        end: predictions[13].date || ''
      }
    };
  }

  return { deloadRecommended: false };
}

// =============================================================================
// Training Functions
// =============================================================================

/**
 * Prepare training data from workout history
 */
export function prepareTrainingData(
  history: WorkoutSession[],
  dailyLogs: DailyLog[],
  config: PredictorConfig = DEFAULT_CONFIG
): TrainingData | null {
  // Guard against undefined/null history
  if (!history || !Array.isArray(history)) return null;

  const sequences: number[][][] = [];
  const labels: number[][] = [];

  // Sort history by date
  const sortedHistory = [...history]
    .filter(w => w.status === 'completed' && w.endTime)
    .sort((a, b) => (a.endTime || 0) - (b.endTime || 0));

  if (sortedHistory.length < MIN_TRAINING_SAMPLES) {
    return null; // Not enough data
  }

  // Find date range
  const firstDate = sortedHistory[0].endTime!;
  const lastDate = sortedHistory[sortedHistory.length - 1].endTime!;
  const totalDays = Math.floor((lastDate - firstDate) / (24 * 60 * 60 * 1000));

  if (totalDays < config.sequenceLength + config.predictionHorizon) {
    return null; // Not enough time span
  }

  // Generate training samples using sliding window
  const windowSize = config.sequenceLength + config.predictionHorizon;

  for (let startDay = 0; startDay <= totalDays - windowSize; startDay += 7) { // Step by week
    const windowStart = firstDate + startDay * 24 * 60 * 60 * 1000;
    const sequenceEnd = windowStart + config.sequenceLength * 24 * 60 * 60 * 1000;

    // Extract input sequence
    const sequence = extractFeatureSequence(
      history,
      dailyLogs,
      sequenceEnd,
      config.sequenceLength
    );

    if (sequence.length < config.sequenceLength * 0.8) {
      continue; // Skip if too much missing data
    }

    // Calculate actual fatigue labels for next 14 days
    const fatigueLabels = calculateActualFatigue(
      history,
      dailyLogs,
      sequenceEnd,
      config.predictionHorizon
    );

    if (fatigueLabels.length === config.predictionHorizon) {
      // Convert sequence to tensor-ready format
      const sequenceArray = sequence.map(featuresToArray);

      // Pad sequence if needed
      while (sequenceArray.length < config.sequenceLength) {
        sequenceArray.unshift(new Array(FEATURE_COUNT).fill(0));
      }

      sequences.push(sequenceArray);
      labels.push(fatigueLabels);
    }
  }

  if (sequences.length < 5) {
    return null; // Need at least 5 training samples
  }

  return { sequences, labels };
}

/**
 * Train the model on user's data
 */
export async function trainModel(
  model: tf.LayersModel,
  trainingData: TrainingData,
  config: PredictorConfig = DEFAULT_CONFIG,
  onProgress?: (epoch: number, logs: tf.Logs) => void
): Promise<tf.History> {
  const { sequences, labels } = trainingData;

  // Convert to tensors
  const xs = tf.tensor3d(sequences);
  const ys = tf.tensor2d(labels);

  // Train with early stopping
  const history = await model.fit(xs, ys, {
    epochs: 50,
    batchSize: config.batchSize,
    validationSplit: 0.2,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (onProgress && logs) {
          onProgress(epoch, logs);
        }
      },
      // Early stopping
      ...(tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: 5,
        restoreBestWeights: true
      }) as unknown as tf.CustomCallbackArgs)
    }
  });

  // Clean up
  xs.dispose();
  ys.dispose();

  return history;
}

/**
 * Incremental update with new workout data
 */
export async function updateModelIncremental(
  model: tf.LayersModel,
  newWorkout: WorkoutSession,
  recentHistory: WorkoutSession[],
  dailyLogs: DailyLog[],
  config: PredictorConfig = DEFAULT_CONFIG
): Promise<void> {
  // Only update if we have a complete sequence
  if (recentHistory.length < config.sequenceLength) {
    return;
  }

  // Extract single training sample
  const endDate = newWorkout.endTime || Date.now();
  const sequence = extractFeatureSequence(
    recentHistory,
    dailyLogs,
    endDate,
    config.sequenceLength
  );

  if (sequence.length < config.sequenceLength * 0.8) {
    return;
  }

  // We need to wait to get actual fatigue labels, so this is called
  // after we have feedback data (e.g., next day's wellness check)
  // For now, use estimated labels from RPE and performance

  const sequenceArray = sequence.map(featuresToArray);
  while (sequenceArray.length < config.sequenceLength) {
    sequenceArray.unshift(new Array(FEATURE_COUNT).fill(0));
  }

  // Use current workout's difficulty as initial label estimate
  // This gets refined as more feedback comes in
  const estimatedFatigue = estimateFatigueFromWorkout(newWorkout);
  const labels = new Array(config.predictionHorizon).fill(estimatedFatigue);

  // Single sample incremental update with low learning rate
  const xs = tf.tensor3d([sequenceArray]);
  const ys = tf.tensor2d([labels]);

  await model.fit(xs, ys, {
    epochs: 1,
    batchSize: 1,
    verbose: 0
  });

  xs.dispose();
  ys.dispose();
}

// =============================================================================
// Model Persistence
// =============================================================================

/**
 * Save model to IndexedDB
 */
export async function saveModel(model: tf.LayersModel): Promise<void> {
  await model.save(`indexeddb://${MODEL_STORAGE_KEY}`);
  console.log('💾 Fatigue prediction model saved');
}

/**
 * Load model from IndexedDB
 */
export async function loadModel(): Promise<tf.LayersModel | null> {
  try {
    const model = await tf.loadLayersModel(`indexeddb://${MODEL_STORAGE_KEY}`);
    console.log('📂 Fatigue prediction model loaded');
    return model;
  } catch (error) {
    console.log('No saved model found, will create new one');
    return null;
  }
}

/**
 * Check if model exists in storage
 */
export async function modelExists(): Promise<boolean> {
  try {
    const models = await tf.io.listModels();
    return `indexeddb://${MODEL_STORAGE_KEY}` in models;
  } catch {
    return false;
  }
}

/**
 * Delete saved model
 */
export async function deleteModel(): Promise<void> {
  try {
    await tf.io.removeModel(`indexeddb://${MODEL_STORAGE_KEY}`);
    console.log('🗑️ Fatigue prediction model deleted');
  } catch (error) {
    console.log('No model to delete');
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function classifyRiskLevel(fatigue: number): FatiguePrediction['riskLevel'] {
  if (fatigue >= FATIGUE_THRESHOLDS.critical) return 'critical';
  if (fatigue >= FATIGUE_THRESHOLDS.high) return 'high';
  if (fatigue >= FATIGUE_THRESHOLDS.moderate) return 'moderate';
  return 'low';
}

function generateRecommendation(fatigue: number, daysAhead: number): string {
  const dayLabel = daysAhead === 0 ? 'Tomorrow' : `In ${daysAhead + 1} days`;

  if (fatigue >= FATIGUE_THRESHOLDS.critical) {
    return `${dayLabel}: Critical fatigue predicted. Plan for complete rest or very light active recovery.`;
  }
  if (fatigue >= FATIGUE_THRESHOLDS.high) {
    return `${dayLabel}: High fatigue expected. Consider reducing volume by 30-40% or taking a rest day.`;
  }
  if (fatigue >= FATIGUE_THRESHOLDS.moderate) {
    return `${dayLabel}: Moderate fatigue expected. Normal training OK, but monitor recovery closely.`;
  }
  return `${dayLabel}: Low fatigue predicted. Good day for challenging workout if scheduled.`;
}

function identifyContributingFactors(
  sequence: DailyMLFeatures[],
  predictedFatigue: number
): string[] {
  const factors: string[] = [];

  if (sequence.length === 0) return factors;

  // Analyze recent data (last 7 days)
  const recentData = sequence.slice(-7);

  // Check volume trend
  const avgVolume = recentData.reduce((sum, d) => sum + d.volumeTotal, 0) / recentData.length;
  if (avgVolume > 20) {
    factors.push(`High recent volume (${avgVolume.toFixed(0)} sets/day avg)`);
  }

  // Check RPE trend
  const avgRPE = recentData.filter(d => d.avgRPE > 0).reduce((sum, d) => sum + d.avgRPE, 0) /
    recentData.filter(d => d.avgRPE > 0).length;
  if (avgRPE > 8.5) {
    factors.push(`High training intensity (RPE ${avgRPE.toFixed(1)} avg)`);
  }

  // Check ACWR
  const lastAcwr = sequence[sequence.length - 1]?.acwr || 1;
  if (lastAcwr > 1.5) {
    factors.push(`Rapid volume increase (ACWR: ${lastAcwr.toFixed(2)})`);
  } else if (lastAcwr < 0.8) {
    factors.push(`Volume drop may cause detraining (ACWR: ${lastAcwr.toFixed(2)})`);
  }

  // Check sleep (if available)
  const sleepData = recentData.filter(d => d.sleepHours > 0);
  if (sleepData.length > 0) {
    const avgSleep = sleepData.reduce((sum, d) => sum + d.sleepHours, 0) / sleepData.length;
    if (avgSleep < 7) {
      factors.push(`Insufficient sleep (${avgSleep.toFixed(1)}h avg)`);
    }
  }

  // Check consecutive training days
  const consecutiveDays = sequence.filter(d => !d.isRestDay).length;
  if (consecutiveDays > 5) {
    factors.push(`${consecutiveDays} training days in sequence`);
  }

  if (factors.length === 0 && predictedFatigue > FATIGUE_THRESHOLDS.moderate) {
    factors.push('Cumulative training stress building up');
  }

  return factors;
}

function calculateDayConfidence(daysAhead: number, dataPoints: number): number {
  // Confidence decreases with prediction distance and increases with data
  const distanceDecay = Math.exp(-daysAhead * 0.1); // Exponential decay
  const dataBoost = Math.min(1, dataPoints / 28); // More data = more confidence
  return Math.max(0.2, Math.min(0.95, distanceDecay * dataBoost * 0.9));
}

function calculateOverallConfidence(actualDays: number, requiredDays: number): number {
  return Math.min(0.9, actualDays / requiredDays);
}

function featuresToArray(features: DailyMLFeatures): number[] {
  return [
    features.volumeTotal / 50, // Normalize to ~0-1
    features.avgRPE / 10,
    features.maxRPE / 10,
    features.avgIntensity / 100,
    features.acwr / 2,
    features.daysSinceRest / 7,
    features.sleepHours / 10,
    features.sleepQuality / 5,
    features.stressLevel / 5,
    features.sorenessLevel / 5,
    features.perceivedRecovery / 5,
    features.isRestDay ? 0 : 1,
    features.dayOfWeek / 6
  ];
}

function calculateActualFatigue(
  history: WorkoutSession[],
  dailyLogs: DailyLog[],
  startDate: number,
  days: number
): number[] {
  // Guard against undefined/null history
  const safeHistory = history && Array.isArray(history) ? history : [];
  const fatigueValues: number[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate + (i + 1) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    // Check daily log for actual reported fatigue/recovery
    const dailyLog = dailyLogs[dateStr];

    if (dailyLog && dailyLog.perceivedRecovery !== undefined) {
      // Use inverse of perceived recovery (5 = low fatigue, 1 = high fatigue)
      fatigueValues.push((5 - dailyLog.perceivedRecovery) / 4);
    } else {
      // Estimate from workout RPE
      const dayWorkouts = safeHistory.filter(w => {
        if (!w.endTime) return false;
        const workoutDate = new Date(w.endTime).toISOString().split('T')[0];
        return workoutDate === dateStr;
      });

      if (dayWorkouts.length > 0) {
        // High RPE = high fatigue
        const avgRPE = dayWorkouts.flatMap(w =>
          w.logs.flatMap(l => l.sets.filter(s => s.rpe).map(s => s.rpe!))
        );
        if (avgRPE.length > 0) {
          const rpe = avgRPE.reduce((a, b) => a + b, 0) / avgRPE.length;
          fatigueValues.push((rpe - 5) / 5); // RPE 5 = 0 fatigue, RPE 10 = 1 fatigue
        } else {
          fatigueValues.push(0.4); // Default moderate
        }
      } else {
        fatigueValues.push(0.3); // Rest day = lower fatigue
      }
    }
  }

  return fatigueValues;
}

function estimateFatigueFromWorkout(workout: WorkoutSession): number {
  const sets = workout.logs.flatMap(l => l.sets);
  const rpeSets = sets.filter(s => s.rpe);

  if (rpeSets.length === 0) return 0.5;

  const avgRPE = rpeSets.reduce((sum, s) => sum + (s.rpe || 0), 0) / rpeSets.length;
  return Math.max(0, Math.min(1, (avgRPE - 5) / 5));
}

// =============================================================================
// Initialization Helper
// =============================================================================

/**
 * Initialize the fatigue predictor
 * Loads existing model or creates new one
 */
export async function initializeFatiguePredictor(
  config: PredictorConfig = DEFAULT_CONFIG
): Promise<tf.LayersModel> {
  // Try to load existing model
  const existingModel = await loadModel();

  if (existingModel) {
    return existingModel;
  }

  // Create new model
  console.log('🧠 Creating new fatigue prediction model...');
  const model = createModel(config);
  console.log('✅ Model created:', model.summary());

  return model;
}
