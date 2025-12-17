/**
 * ML Services Index
 *
 * Exports all machine learning services for IronPath:
 * - Feature Extraction: Converts raw workout data to ML features
 * - Volume Bandit: Thompson Sampling for personalized volume optimization
 * - Fatigue Predictor: GRU neural network for fatigue forecasting
 * - Lazy Loader: Dynamic imports for code splitting (RECOMMENDED)
 *
 * PERFORMANCE NOTE:
 * For optimal bundle size, prefer using the lazy loader functions:
 *   import { getFatiguePrediction, getVolumeRecommendation } from './ml';
 *
 * Direct imports load TensorFlow.js (~1.5MB) into the main bundle.
 */

// =============================================================================
// LAZY LOADER (RECOMMENDED)
// Use these for automatic code splitting and lazy loading of TensorFlow.js
// =============================================================================
export {
  // High-level APIs (lazy load ML automatically)
  getFatiguePrediction,
  getVolumeRecommendationAsync,
  updateVolumeBandit,
  extractDailyFeaturesAsync,

  // Utility functions
  isMLSupported,
  hasTrainedModel,
  preloadMLModules,
  clearModelCache,

  // Advanced: Manual module loading
  loadFatiguePredictor,
  loadVolumeBandit,
  loadFeatureExtraction,
  initializeModel,
  getModel
} from './lazyLoader';

// =============================================================================
// DIRECT EXPORTS (lightweight modules - OK to import directly)
// These DO NOT load TensorFlow.js
// =============================================================================

// Feature Extraction (lightweight)
export {
  extractDailyFeatures,
  extractFeatureSequence,
  extractBanditContext,
  featuresToTensor
} from './featureExtraction';

// Thompson Sampling Bandit (lightweight)
export {
  getVolumeRecommendation, // Sync version - original API
  updateBandit,
  calculateReward,
  initializeBanditState,
  getActionSuccessRate,
  getExplorationBonus,
  actionToVolumeChange,
  serializeBanditState,
  deserializeBanditState,
  type BanditRecommendation,
  type BanditUpdate
} from './volumeBandit';

// GRU Fatigue Predictor types only (actual functions via lazy loader)
export type {
  PredictorConfig,
  TrainingData,
  PredictionResult
} from './fatiguePredictor';
