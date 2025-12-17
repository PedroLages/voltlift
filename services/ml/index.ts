/**
 * ML Services Index
 *
 * Exports all machine learning services for IronPath:
 * - Feature Extraction: Converts raw workout data to ML features
 * - Volume Bandit: Thompson Sampling for personalized volume optimization
 * - Fatigue Predictor: GRU neural network for fatigue forecasting
 */

// Feature Extraction
export {
  extractDailyFeatures,
  extractFeatureSequence,
  extractBanditContext,
  featuresToTensor
} from './featureExtraction';

// Thompson Sampling Bandit
export {
  getVolumeRecommendation,
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

// GRU Fatigue Predictor
export {
  createModel,
  predictFatigue,
  prepareTrainingData,
  trainModel,
  updateModelIncremental,
  saveModel,
  loadModel,
  modelExists,
  deleteModel,
  initializeFatiguePredictor,
  type PredictorConfig,
  type TrainingData,
  type PredictionResult
} from './fatiguePredictor';
