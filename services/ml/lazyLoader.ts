/**
 * Lazy Loader for ML Services
 *
 * This module provides lazy loading for TensorFlow.js and ML services
 * to reduce initial bundle size. TensorFlow.js (~1.5MB) is only loaded
 * when ML features are actually needed.
 *
 * Usage:
 *   const { predictFatigue, model } = await loadFatiguePredictor();
 *   const result = await predictFatigue(model, history, dailyLogs);
 */

import type { WorkoutSession, DailyLog, MuscleGroup } from '../../types';
import type { PredictionResult, PredictorConfig } from './fatiguePredictor';
import type { BanditRecommendation, BanditUpdate } from './volumeBandit';
import type { BanditState, DailyMLFeatures } from '../../types';
import { EXERCISE_LIBRARY } from '../../constants';

// Track loading state to prevent multiple loads
let fatigueModulePromise: Promise<typeof import('./fatiguePredictor')> | null = null;
let banditModulePromise: Promise<typeof import('./volumeBandit')> | null = null;
let featureModulePromise: Promise<typeof import('./featureExtraction')> | null = null;

// Cache the loaded TensorFlow model
let cachedModel: import('@tensorflow/tfjs').LayersModel | null = null;

/**
 * Check if ML features are available (browser supports required APIs)
 */
export function isMLSupported(): boolean {
  return typeof window !== 'undefined' &&
         typeof indexedDB !== 'undefined' &&
         typeof WebAssembly !== 'undefined';
}

/**
 * Lazy load the fatigue predictor module
 * TensorFlow.js is loaded as part of this import
 */
export async function loadFatiguePredictor() {
  if (!fatigueModulePromise) {
    fatigueModulePromise = import('./fatiguePredictor');
  }
  return fatigueModulePromise;
}

/**
 * Lazy load the volume bandit module
 */
export async function loadVolumeBandit() {
  if (!banditModulePromise) {
    banditModulePromise = import('./volumeBandit');
  }
  return banditModulePromise;
}

/**
 * Lazy load the feature extraction module
 */
export async function loadFeatureExtraction() {
  if (!featureModulePromise) {
    featureModulePromise = import('./featureExtraction');
  }
  return featureModulePromise;
}

/**
 * Initialize and cache the fatigue prediction model
 * Call this early in the app lifecycle to pre-warm the model
 */
export async function initializeModel(config?: PredictorConfig): Promise<void> {
  if (cachedModel) return;

  const predictor = await loadFatiguePredictor();
  cachedModel = await predictor.initializeFatiguePredictor(config);
}

/**
 * Get cached model or initialize if needed
 */
export async function getModel(config?: PredictorConfig) {
  if (!cachedModel) {
    await initializeModel(config);
  }
  return cachedModel!;
}

/**
 * High-level API: Predict fatigue with lazy loading
 * This is the recommended way to get fatigue predictions
 */
export async function getFatiguePrediction(
  history: WorkoutSession[],
  dailyLogs: Record<string, DailyLog>,
  config?: PredictorConfig
): Promise<PredictionResult | null> {
  if (!isMLSupported()) {
    console.warn('ML features not supported in this environment');
    return null;
  }

  try {
    const predictor = await loadFatiguePredictor();
    const model = await getModel(config);

    // Convert dailyLogs object to array for the predictor
    const dailyLogsArray = Object.values(dailyLogs);

    return await predictor.predictFatigue(model, history, dailyLogsArray, config);
  } catch (error) {
    console.error('Failed to get fatigue prediction:', error);
    return null;
  }
}

/**
 * High-level API: Get volume recommendation with lazy loading
 * Use this for async contexts where you want automatic context extraction
 */
export async function getVolumeRecommendationAsync(
  exerciseId: string,
  banditState: BanditState,
  history: WorkoutSession[],
  dailyLogs: Record<string, DailyLog>
): Promise<BanditRecommendation | null> {
  if (!isMLSupported()) {
    return null;
  }

  try {
    const [bandit, features] = await Promise.all([
      loadVolumeBandit(),
      loadFeatureExtraction()
    ]);

    // Get muscle group from exercise library
    const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
    const muscleGroup: MuscleGroup = exercise?.muscleGroup || 'Chest';

    const context = features.extractBanditContext(
      history,
      Object.values(dailyLogs)
    );

    return bandit.getVolumeRecommendation(context, banditState, muscleGroup);
  } catch (error) {
    console.error('Failed to get volume recommendation:', error);
    return null;
  }
}

/**
 * High-level API: Update bandit with workout result
 */
export async function updateVolumeBandit(
  banditState: BanditState,
  update: BanditUpdate
): Promise<BanditState | null> {
  try {
    const bandit = await loadVolumeBandit();
    return bandit.updateBandit(banditState, update);
  } catch (error) {
    console.error('Failed to update bandit:', error);
    return null;
  }
}

/**
 * High-level API: Extract daily features with lazy loading
 * Accepts Record<string, DailyLog> for convenience (converts to array internally)
 */
export async function extractDailyFeaturesAsync(
  history: WorkoutSession[],
  dailyLogs: Record<string, DailyLog>,
  date: number
): Promise<DailyMLFeatures | null> {
  try {
    const features = await loadFeatureExtraction();
    return features.extractDailyFeatures(date, history, Object.values(dailyLogs));
  } catch (error) {
    console.error('Failed to extract features:', error);
    return null;
  }
}

/**
 * Check if the fatigue model has been trained
 */
export async function hasTrainedModel(): Promise<boolean> {
  try {
    const predictor = await loadFatiguePredictor();
    return await predictor.modelExists();
  } catch {
    return false;
  }
}

/**
 * Clear cached model (useful for memory management)
 */
export function clearModelCache(): void {
  if (cachedModel) {
    // Dispose TensorFlow model to free GPU memory
    cachedModel.dispose();
    cachedModel = null;
  }
}

/**
 * Preload ML modules in the background
 * Call this on app initialization to warm up the cache
 */
export function preloadMLModules(): void {
  // Start loading modules in the background without blocking
  // These will be cached for when they're actually needed
  if (isMLSupported()) {
    setTimeout(() => {
      loadFeatureExtraction().catch(() => {});
      loadVolumeBandit().catch(() => {});
      // Note: We don't preload fatiguePredictor as it loads TensorFlow.js
      // which is large. Only load it when actually needed.
    }, 5000); // Delay 5s after app load
  }
}
