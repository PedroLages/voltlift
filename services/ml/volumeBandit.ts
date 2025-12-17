/**
 * Thompson Sampling Contextual Bandit for Volume Optimization
 *
 * Uses Thompson Sampling with Beta distributions to learn optimal
 * volume adjustments (decrease/maintain/increase) based on user context.
 *
 * Key Concepts:
 * - Each action has a Beta(alpha, beta) distribution representing our belief
 * - Higher alpha = more successes observed, higher beta = more failures
 * - We sample from each distribution and pick the highest sample
 * - Context modifies the base distributions (fatigue → prefer decrease, etc.)
 *
 * This is a pure TypeScript implementation - no TensorFlow required.
 */

import { VolumeAction, BanditContext, BanditState, MuscleGroup } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface BanditRecommendation {
  action: VolumeAction;
  confidence: number; // 0-1, how confident we are in this recommendation
  reasoning: string;
  sampledValues: Record<VolumeAction, number>; // For debugging/visualization
  contextualAdjustments: string[]; // What factors influenced the decision
}

export interface BanditUpdate {
  action: VolumeAction;
  context: BanditContext;
  reward: number; // 0-1, based on performance outcome
  muscleGroup: MuscleGroup;
  timestamp: number;
}

interface ActionPrior {
  alpha: number; // Successes + 1
  beta: number;  // Failures + 1
}

// =============================================================================
// Constants
// =============================================================================

// Initial prior: slightly optimistic (60% success rate assumed)
const DEFAULT_PRIOR: ActionPrior = { alpha: 3, beta: 2 };

// Context weight multipliers
const CONTEXT_WEIGHTS = {
  fatigue: {
    high: { decrease: 1.5, maintain: 1.2, increase: 0.5 },
    moderate: { decrease: 1.0, maintain: 1.3, increase: 0.8 },
    low: { decrease: 0.7, maintain: 1.0, increase: 1.4 }
  },
  recovery: {
    poor: { decrease: 1.6, maintain: 1.0, increase: 0.4 },
    moderate: { decrease: 1.0, maintain: 1.2, increase: 0.9 },
    good: { decrease: 0.6, maintain: 1.0, increase: 1.5 }
  },
  recentPerformance: {
    declining: { decrease: 0.8, maintain: 1.4, increase: 0.6 },
    stable: { decrease: 0.9, maintain: 1.3, increase: 1.0 },
    improving: { decrease: 0.5, maintain: 1.0, increase: 1.5 }
  }
};

// Learning rate for updates (how much new data affects priors)
const LEARNING_RATE = 0.5;

// Minimum samples before we trust the bandit over heuristics
const MIN_SAMPLES_FOR_CONFIDENCE = 10;

// =============================================================================
// Beta Distribution Sampling
// =============================================================================

/**
 * Sample from Beta(alpha, beta) distribution using the Inverse CDF method
 * Approximation using gamma functions for efficiency
 */
function sampleBeta(alpha: number, beta: number): number {
  // Use the gamma distribution relationship: Beta(a,b) = Gamma(a) / (Gamma(a) + Gamma(b))
  const x = sampleGamma(alpha);
  const y = sampleGamma(beta);
  return x / (x + y);
}

/**
 * Sample from Gamma(shape, 1) using Marsaglia and Tsang's method
 */
function sampleGamma(shape: number): number {
  if (shape < 1) {
    // For shape < 1, use: Gamma(shape) = Gamma(shape + 1) * U^(1/shape)
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number;
    let v: number;

    do {
      x = randn();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * (x * x) * (x * x)) {
      return d * v;
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

/**
 * Standard normal random using Box-Muller transform
 */
function randn(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// =============================================================================
// Main Bandit Functions
// =============================================================================

/**
 * Get a volume recommendation using Thompson Sampling
 */
export function getVolumeRecommendation(
  context: BanditContext,
  state: BanditState,
  muscleGroup: MuscleGroup
): BanditRecommendation {
  const actions: VolumeAction[] = ['decrease', 'maintain', 'increase'];
  const contextualAdjustments: string[] = [];

  // Get priors for this muscle group
  const muscleState = state.muscleGroupStates[muscleGroup] || {
    decrease: { ...DEFAULT_PRIOR },
    maintain: { ...DEFAULT_PRIOR },
    increase: { ...DEFAULT_PRIOR }
  };

  // Calculate contextual weights
  const fatigueLevel = context.fatigueLevel > 0.7 ? 'high' : context.fatigueLevel > 0.4 ? 'moderate' : 'low';
  const recoveryLevel = context.recoveryScore < 0.4 ? 'poor' : context.recoveryScore < 0.7 ? 'moderate' : 'good';
  const performanceLevel = context.recentPerformanceTrend < -0.1 ? 'declining'
    : context.recentPerformanceTrend > 0.1 ? 'improving' : 'stable';

  contextualAdjustments.push(`Fatigue: ${fatigueLevel} (${(context.fatigueLevel * 100).toFixed(0)}%)`);
  contextualAdjustments.push(`Recovery: ${recoveryLevel} (${(context.recoveryScore * 100).toFixed(0)}%)`);
  contextualAdjustments.push(`Performance: ${performanceLevel} (${(context.recentPerformanceTrend * 100).toFixed(1)}%)`);

  // Sample from each action's posterior with contextual adjustments
  const sampledValues: Record<VolumeAction, number> = {
    decrease: 0,
    maintain: 0,
    increase: 0
  };

  for (const action of actions) {
    const prior = muscleState[action] || { ...DEFAULT_PRIOR };

    // Apply contextual weights to the prior
    const fatigueWeight = CONTEXT_WEIGHTS.fatigue[fatigueLevel][action];
    const recoveryWeight = CONTEXT_WEIGHTS.recovery[recoveryLevel][action];
    const performanceWeight = CONTEXT_WEIGHTS.recentPerformance[performanceLevel][action];

    // Combined weight (geometric mean for stability)
    const combinedWeight = Math.pow(fatigueWeight * recoveryWeight * performanceWeight, 1/3);

    // Adjust alpha proportionally to weight
    const adjustedAlpha = prior.alpha * combinedWeight;
    const adjustedBeta = prior.beta / combinedWeight;

    // Sample from adjusted posterior
    sampledValues[action] = sampleBeta(
      Math.max(1, adjustedAlpha),
      Math.max(1, adjustedBeta)
    );
  }

  // Select action with highest sampled value
  let bestAction: VolumeAction = 'maintain';
  let bestValue = -Infinity;

  for (const action of actions) {
    if (sampledValues[action] > bestValue) {
      bestValue = sampledValues[action];
      bestAction = action;
    }
  }

  // Calculate confidence based on:
  // 1. Total samples collected
  // 2. Difference between best and second-best
  // 3. How aligned the recommendation is with context heuristics
  const totalSamples = state.totalUpdates || 0;
  const sampleConfidence = Math.min(1, totalSamples / MIN_SAMPLES_FOR_CONFIDENCE);

  const sortedValues = Object.values(sampledValues).sort((a, b) => b - a);
  const marginConfidence = sortedValues[0] - sortedValues[1]; // 0 to ~0.5

  // Check if recommendation aligns with obvious heuristics
  const heuristicAlignment = getHeuristicAlignment(bestAction, context);

  const confidence = (sampleConfidence * 0.4 + marginConfidence * 0.3 + heuristicAlignment * 0.3);

  // Generate reasoning
  const reasoning = generateReasoning(bestAction, context, sampledValues, totalSamples);

  return {
    action: bestAction,
    confidence: Math.min(0.95, Math.max(0.1, confidence)),
    reasoning,
    sampledValues,
    contextualAdjustments
  };
}

/**
 * Update the bandit with observed reward
 */
export function updateBandit(
  state: BanditState,
  update: BanditUpdate
): BanditState {
  const { action, muscleGroup, reward } = update;

  // Initialize muscle group state if needed
  const muscleState = state.muscleGroupStates[muscleGroup] || {
    decrease: { ...DEFAULT_PRIOR },
    maintain: { ...DEFAULT_PRIOR },
    increase: { ...DEFAULT_PRIOR }
  };

  // Get current prior for this action
  const prior = muscleState[action] || { ...DEFAULT_PRIOR };

  // Update using weighted running average (allows for non-stationarity)
  // reward is 0-1, we treat > 0.5 as success, < 0.5 as failure
  const isSuccess = reward > 0.5;
  const magnitude = Math.abs(reward - 0.5) * 2; // How strong the signal is (0-1)

  const newPrior = {
    alpha: prior.alpha + (isSuccess ? LEARNING_RATE * (1 + magnitude) : 0),
    beta: prior.beta + (!isSuccess ? LEARNING_RATE * (1 + magnitude) : 0)
  };

  // Decay old observations slightly (non-stationary environment)
  const decayRate = 0.99;
  newPrior.alpha = Math.max(1, newPrior.alpha * decayRate);
  newPrior.beta = Math.max(1, newPrior.beta * decayRate);

  // Update state
  const newMuscleState = {
    ...muscleState,
    [action]: newPrior
  };

  // Add to history
  const historyEntry = {
    timestamp: update.timestamp,
    muscleGroup,
    action,
    reward,
    context: update.context
  };

  return {
    ...state,
    muscleGroupStates: {
      ...state.muscleGroupStates,
      [muscleGroup]: newMuscleState
    },
    totalUpdates: (state.totalUpdates || 0) + 1,
    lastUpdate: update.timestamp,
    history: [...(state.history || []).slice(-100), historyEntry] // Keep last 100
  };
}

/**
 * Calculate reward from workout feedback
 */
export function calculateReward(
  performanceChange: number, // -1 to 1 (negative = declined, positive = improved)
  perceivedDifficulty: number, // 1-5 (from post-workout feedback)
  soreness24h?: number, // 1-5 (from next day check-in)
  satisfaction?: number // 1-5 (from post-workout feedback)
): number {
  let reward = 0.5; // Start neutral

  // Performance is the primary signal (weight: 40%)
  reward += performanceChange * 0.2; // +/- 0.2

  // Perceived difficulty should be moderate (4 is ideal) (weight: 20%)
  const difficultyScore = perceivedDifficulty === 4 ? 0.1
    : perceivedDifficulty === 3 || perceivedDifficulty === 5 ? 0.05
    : perceivedDifficulty === 2 ? 0
    : -0.05; // 1 (too easy) is worst
  reward += difficultyScore;

  // Low soreness is good (weight: 20%)
  if (soreness24h !== undefined) {
    const sorenessScore = soreness24h <= 2 ? 0.1
      : soreness24h === 3 ? 0.05
      : soreness24h === 4 ? -0.05
      : -0.1; // 5 is too sore
    reward += sorenessScore;
  }

  // Satisfaction is subjective validation (weight: 20%)
  if (satisfaction !== undefined) {
    const satisfactionScore = (satisfaction - 3) * 0.05; // -0.1 to +0.1
    reward += satisfactionScore;
  }

  return Math.max(0, Math.min(1, reward));
}

/**
 * Initialize a new bandit state
 */
export function initializeBanditState(): BanditState {
  return {
    muscleGroupStates: {},
    totalUpdates: 0,
    lastUpdate: Date.now(),
    history: []
  };
}

/**
 * Get the current success rate estimate for an action
 */
export function getActionSuccessRate(
  state: BanditState,
  muscleGroup: MuscleGroup,
  action: VolumeAction
): number {
  const muscleState = state.muscleGroupStates[muscleGroup];
  if (!muscleState) return 0.5; // No data, assume 50%

  const prior = muscleState[action] || DEFAULT_PRIOR;
  return prior.alpha / (prior.alpha + prior.beta);
}

/**
 * Get exploration bonus for an under-explored action
 * Higher bonus = more uncertainty = should explore more
 */
export function getExplorationBonus(
  state: BanditState,
  muscleGroup: MuscleGroup,
  action: VolumeAction
): number {
  const muscleState = state.muscleGroupStates[muscleGroup];
  if (!muscleState) return 1.0; // High bonus for unexplored

  const prior = muscleState[action] || DEFAULT_PRIOR;
  const totalObs = prior.alpha + prior.beta - 2; // Subtract initial prior

  // UCB-style bonus: decreases with more observations
  return 1 / Math.sqrt(1 + totalObs);
}

// =============================================================================
// Helper Functions
// =============================================================================

function getHeuristicAlignment(action: VolumeAction, context: BanditContext): number {
  // Check if the action aligns with obvious heuristics
  let alignment = 0.5; // Neutral

  // High fatigue + decrease = aligned
  if (context.fatigueLevel > 0.7 && action === 'decrease') alignment += 0.3;
  if (context.fatigueLevel > 0.7 && action === 'increase') alignment -= 0.3;

  // Good recovery + increase = aligned
  if (context.recoveryScore > 0.7 && action === 'increase') alignment += 0.2;
  if (context.recoveryScore < 0.3 && action === 'increase') alignment -= 0.3;

  // Declining performance + decrease = aligned
  if (context.recentPerformanceTrend < -0.1 && action === 'decrease') alignment += 0.2;
  if (context.recentPerformanceTrend < -0.1 && action === 'increase') alignment -= 0.2;

  return Math.max(0, Math.min(1, alignment));
}

function generateReasoning(
  action: VolumeAction,
  context: BanditContext,
  sampledValues: Record<VolumeAction, number>,
  totalSamples: number
): string {
  const actionLabels = {
    decrease: 'Reduce volume',
    maintain: 'Maintain current volume',
    increase: 'Increase volume'
  };

  let reasoning = `${actionLabels[action]}. `;

  // Add context-based reasoning
  if (context.fatigueLevel > 0.7) {
    reasoning += 'Fatigue levels are high. ';
  } else if (context.fatigueLevel < 0.3) {
    reasoning += 'Well-rested state. ';
  }

  if (context.recoveryScore < 0.4) {
    reasoning += 'Recovery appears incomplete. ';
  } else if (context.recoveryScore > 0.7) {
    reasoning += 'Excellent recovery observed. ';
  }

  if (context.recentPerformanceTrend < -0.1) {
    reasoning += 'Recent performance declining. ';
  } else if (context.recentPerformanceTrend > 0.1) {
    reasoning += 'Performance trending upward. ';
  }

  // Add data confidence note
  if (totalSamples < MIN_SAMPLES_FOR_CONFIDENCE) {
    reasoning += `(Based on ${totalSamples} observations - still learning your patterns.)`;
  } else {
    reasoning += `(Based on ${totalSamples} observations of your training response.)`;
  }

  return reasoning;
}

// =============================================================================
// Volume Change Calculation
// =============================================================================

/**
 * Convert bandit action to actual set count change
 */
export function actionToVolumeChange(
  action: VolumeAction,
  currentSets: number,
  context: BanditContext
): { newSets: number; change: number; description: string } {
  const baseChange = {
    decrease: -2,
    maintain: 0,
    increase: 2
  }[action];

  // Modulate change based on confidence and context
  let adjustedChange = baseChange;

  // More aggressive changes when fatigue is extreme
  if (action === 'decrease' && context.fatigueLevel > 0.8) {
    adjustedChange = -3; // Extra reduction for high fatigue
  }

  // More conservative increases when recovery is questionable
  if (action === 'increase' && context.recoveryScore < 0.5) {
    adjustedChange = 1; // Smaller increase
  }

  // Ensure we don't go below minimum or above maximum
  const minSets = 6; // MEV floor
  const maxSets = 30; // MRV ceiling

  const newSets = Math.max(minSets, Math.min(maxSets, currentSets + adjustedChange));
  const actualChange = newSets - currentSets;

  const description = actualChange === 0
    ? 'Keep current volume'
    : actualChange > 0
      ? `Add ${actualChange} sets`
      : `Remove ${Math.abs(actualChange)} sets`;

  return { newSets, change: actualChange, description };
}

// =============================================================================
// Persistence Helpers
// =============================================================================

/**
 * Serialize bandit state for storage
 */
export function serializeBanditState(state: BanditState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize bandit state from storage
 */
export function deserializeBanditState(json: string): BanditState {
  try {
    const parsed = JSON.parse(json);
    return {
      muscleGroupStates: parsed.muscleGroupStates || {},
      totalUpdates: parsed.totalUpdates || 0,
      lastUpdate: parsed.lastUpdate || Date.now(),
      history: parsed.history || []
    };
  } catch {
    return initializeBanditState();
  }
}
