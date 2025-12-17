# VoltLift ML Architecture: LSTM Fatigue Prediction + RL Volume Optimization

**Date**: December 17, 2025
**Status**: Architecture Design Phase
**Target**: Production-ready ML system

---

## Executive Summary

This document outlines the complete architecture for two advanced ML features:

1. **LSTM Fatigue Prediction**: Predict deload need 1-2 weeks in advance using deep learning
2. **RL Volume Optimization**: Personalize training volume using Thompson Sampling contextual bandits

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Fatigue Model** | GRU (not LSTM) | 40% fewer parameters, faster on mobile, comparable accuracy |
| **RL Algorithm** | Thompson Sampling Bandit | 3-5x faster cold start than DQN/PPO |
| **Inference Location** | Client-side (TensorFlow.js) | Offline-first, <100ms latency |
| **Training Location** | Server-side (Python) | GPU acceleration, batch processing |
| **Model Updates** | Weekly batch retrain | Balance freshness vs compute cost |

---

## Part 1: LSTM/GRU Fatigue Prediction System

### 1.1 Problem Definition

**Goal**: Predict fatigue level and deload need 7-14 days in advance

**Input**: Time-series of workout and wellness data
**Output**:
- `fatigueScore`: 0-100 (continuous)
- `deloadProbability`: 0-1 (probability needing deload in next 7 days)
- `daysUntilDeload`: 1-14 (regression)
- `confidence`: 0-1

### 1.2 Model Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GRU FATIGUE PREDICTOR                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input Layer (28 days × 12 features = 336 inputs)              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Per-Day Features:                                        │   │
│  │ • volume_total (sets)                                    │   │
│  │ • volume_per_muscle[6] (chest, back, legs, etc.)        │   │
│  │ • avg_rpe                                                │   │
│  │ • max_rpe                                                │   │
│  │ • sleep_hours                                            │   │
│  │ • stress_level (1-5)                                     │   │
│  │ • soreness_level (1-5)                                   │   │
│  │ • acwr (acute:chronic ratio)                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Embedding Layer (optional, for categorical features)     │   │
│  │ experience_level → 8-dim embedding                       │   │
│  │ training_phase → 4-dim embedding                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ GRU Layer 1: 64 units, return_sequences=True            │   │
│  │ Dropout: 0.2                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ GRU Layer 2: 32 units, return_sequences=False           │   │
│  │ Dropout: 0.2                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Dense Layer: 16 units, ReLU activation                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Output Heads (Multi-task):                               │   │
│  │ • fatigue_score: Dense(1), sigmoid × 100                │   │
│  │ • deload_probability: Dense(1), sigmoid                  │   │
│  │ • days_until_deload: Dense(1), ReLU                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Total Parameters: ~15,000 (mobile-friendly)                   │
│  Inference Time: <50ms on mobile                               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Feature Engineering

```typescript
interface DailyFeatures {
  // Training Load Features
  volume_total: number;           // Total sets performed
  volume_chest: number;           // Sets for chest
  volume_back: number;            // Sets for back
  volume_legs: number;            // Sets for legs
  volume_shoulders: number;       // Sets for shoulders
  volume_arms: number;            // Sets for arms
  volume_core: number;            // Sets for core

  // Intensity Features
  avg_rpe: number;                // Average RPE (0-10)
  max_rpe: number;                // Max RPE in session
  avg_intensity: number;          // Avg % of 1RM

  // Recovery Features
  sleep_hours: number;            // Hours slept (0-12)
  sleep_quality: number;          // Subjective 1-5
  stress_level: number;           // Life stress 1-5
  soreness_level: number;         // Muscle soreness 1-5
  perceived_recovery: number;     // How recovered 1-5

  // Derived Features
  acwr: number;                   // Acute:Chronic Workload Ratio
  days_since_rest: number;        // Days since complete rest
  days_since_deload: number;      // Days since last deload week
  weekly_volume_change: number;   // % change from previous week
  rpe_trend: number;              // 7-day RPE slope

  // Context Features
  day_of_week: number;            // 0-6
  is_rest_day: boolean;           // No workout
  training_phase: 'accumulation' | 'intensification' | 'deload';
}

// Sequence: 28 days of DailyFeatures
type InputSequence = DailyFeatures[];
```

### 1.4 Training Data Pipeline

```typescript
interface TrainingDataset {
  // Input: 28-day sequences
  X: number[][][];  // [n_samples, 28, n_features]

  // Labels (what happened 7 days later)
  y_fatigue: number[];      // Fatigue score 0-100
  y_deload: number[];       // Did user deload? 0/1
  y_days_to_deload: number[]; // Days until they deloaded
}

// Label Generation Strategy:
// 1. Look at what happened AFTER the 28-day window
// 2. If user deloaded within 7 days → y_deload = 1
// 3. y_fatigue = average RPE × soreness × (1 - recovery)
// 4. y_days_to_deload = days until deload started
```

### 1.5 Model Training (Python Backend)

```python
import tensorflow as tf
from tensorflow.keras import layers, Model

def build_fatigue_model(sequence_length=28, n_features=20):
    """
    GRU-based fatigue prediction model.
    Optimized for mobile deployment via TensorFlow.js.
    """
    # Input
    inputs = layers.Input(shape=(sequence_length, n_features))

    # GRU layers
    x = layers.GRU(64, return_sequences=True, dropout=0.2)(inputs)
    x = layers.GRU(32, return_sequences=False, dropout=0.2)(x)

    # Shared dense layer
    x = layers.Dense(16, activation='relu')(x)

    # Multi-task output heads
    fatigue_score = layers.Dense(1, activation='sigmoid', name='fatigue')(x)
    deload_prob = layers.Dense(1, activation='sigmoid', name='deload_prob')(x)
    days_to_deload = layers.Dense(1, activation='relu', name='days_to_deload')(x)

    model = Model(
        inputs=inputs,
        outputs=[fatigue_score, deload_prob, days_to_deload]
    )

    model.compile(
        optimizer='adam',
        loss={
            'fatigue': 'mse',
            'deload_prob': 'binary_crossentropy',
            'days_to_deload': 'mse'
        },
        loss_weights={
            'fatigue': 1.0,
            'deload_prob': 2.0,  # Prioritize deload prediction
            'days_to_deload': 0.5
        },
        metrics={
            'fatigue': 'mae',
            'deload_prob': 'accuracy',
            'days_to_deload': 'mae'
        }
    )

    return model

# Training Configuration
BATCH_SIZE = 32
EPOCHS = 100
EARLY_STOPPING_PATIENCE = 10
VALIDATION_SPLIT = 0.2
```

### 1.6 Client-Side Inference (TypeScript)

```typescript
// services/ml/fatiguePrediction.ts

import * as tf from '@tensorflow/tfjs';

export interface FatiguePrediction {
  fatigueScore: number;        // 0-100
  deloadProbability: number;   // 0-1
  daysUntilDeload: number;     // 1-14
  confidence: number;          // 0-1 (based on data quality)
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendation: string;
}

export class FatiguePredictor {
  private model: tf.LayersModel | null = null;
  private isLoaded = false;

  async loadModel(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load from IndexedDB (cached) or fetch from CDN
      this.model = await tf.loadLayersModel('indexeddb://fatigue-model');
    } catch {
      // Fetch from server and cache
      this.model = await tf.loadLayersModel('/models/fatigue/model.json');
      await this.model.save('indexeddb://fatigue-model');
    }

    this.isLoaded = true;
  }

  async predict(features: DailyFeatures[]): Promise<FatiguePrediction> {
    if (!this.model) {
      await this.loadModel();
    }

    // Ensure we have 28 days of data
    const paddedFeatures = this.padSequence(features, 28);

    // Normalize features
    const normalized = this.normalizeFeatures(paddedFeatures);

    // Create tensor
    const inputTensor = tf.tensor3d([normalized]);

    // Run inference
    const [fatigue, deloadProb, daysToDeload] = this.model!.predict(inputTensor) as tf.Tensor[];

    // Extract values
    const fatigueScore = (await fatigue.data())[0] * 100;
    const deloadProbability = (await deloadProb.data())[0];
    const daysUntilDeload = Math.max(1, Math.round((await daysToDeload.data())[0]));

    // Cleanup
    inputTensor.dispose();
    fatigue.dispose();
    deloadProb.dispose();
    daysToDeload.dispose();

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(features);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(fatigueScore, deloadProbability);

    // Generate recommendation
    const recommendation = this.generateRecommendation(riskLevel, daysUntilDeload);

    return {
      fatigueScore: Math.round(fatigueScore),
      deloadProbability,
      daysUntilDeload,
      confidence,
      riskLevel,
      recommendation
    };
  }

  private determineRiskLevel(fatigue: number, deloadProb: number): FatiguePrediction['riskLevel'] {
    if (fatigue >= 80 || deloadProb >= 0.8) return 'critical';
    if (fatigue >= 60 || deloadProb >= 0.6) return 'high';
    if (fatigue >= 40 || deloadProb >= 0.4) return 'moderate';
    return 'low';
  }

  private generateRecommendation(risk: string, daysToDeload: number): string {
    switch (risk) {
      case 'critical':
        return `Deload recommended NOW. Your body shows signs of overreaching.`;
      case 'high':
        return `Consider deloading within ${daysToDeload} days to prevent overtraining.`;
      case 'moderate':
        return `Monitor fatigue closely. Deload may be needed in ~${daysToDeload} days.`;
      default:
        return `Recovery looks good. Continue current training.`;
    }
  }

  // ... padding, normalization, confidence calculation methods
}
```

---

## Part 2: RL Volume Optimization System

### 2.1 Problem Definition

**Goal**: Learn optimal training volume for each user to maximize strength gains while minimizing injury/overtraining risk

**Approach**: Thompson Sampling Contextual Bandit
- **Context**: User state (fatigue, soreness, recent volume, etc.)
- **Actions**: Volume adjustment recommendations
- **Reward**: Performance improvement + adherence - fatigue penalty

### 2.2 State Space (Context Features)

```typescript
interface BanditContext {
  // Volume State (per muscle group, 6 values)
  current_volume: number[];       // Sets/week for each muscle
  volume_vs_mav: number[];        // Current / MAV ratio
  weeks_at_current_volume: number;

  // Recovery State
  avg_soreness_7d: number;        // 1-5 scale
  avg_fatigue_7d: number;         // 1-5 scale
  sleep_quality_7d: number;       // 1-5 scale

  // Performance State
  recent_pr_count: number;        // PRs in last 2 weeks
  stalled_exercises: number;      // Exercises with no progress (4+ weeks)
  avg_rpe_trend: number;          // Rising/falling RPE

  // Training Context
  weeks_since_deload: number;
  experience_level: number;       // 0=beginner, 1=intermediate, 2=advanced
  training_frequency: number;     // Sessions per week

  // Historical Response
  response_to_volume_increase: number;  // Learned: did they respond well?
  response_to_volume_decrease: number;
}
```

### 2.3 Action Space

```typescript
enum VolumeAction {
  INCREASE_AGGRESSIVE = 0,  // +20% volume
  INCREASE_MODERATE = 1,    // +10% volume
  MAINTAIN = 2,             // No change
  DECREASE_MODERATE = 3,    // -10% volume
  DELOAD = 4                // -40% volume (full deload)
}

// Action multipliers
const ACTION_MULTIPLIERS = {
  [VolumeAction.INCREASE_AGGRESSIVE]: 1.20,
  [VolumeAction.INCREASE_MODERATE]: 1.10,
  [VolumeAction.MAINTAIN]: 1.00,
  [VolumeAction.DECREASE_MODERATE]: 0.90,
  [VolumeAction.DELOAD]: 0.60
};
```

### 2.4 Reward Function

```typescript
function calculateReward(
  performanceBefore: PerformanceMetrics,
  performanceAfter: PerformanceMetrics,
  adherence: number,        // Did they complete workouts as prescribed?
  soreness: number,         // Post-period soreness (1-5)
  fatigue: number,          // Post-period fatigue (1-5)
  injury: boolean           // Did they get injured?
): number {

  // Performance gain (40% weight)
  // Compare estimated 1RM across key lifts
  const performanceGain = (performanceAfter.avg1RM - performanceBefore.avg1RM)
                          / performanceBefore.avg1RM;
  const performanceReward = Math.tanh(performanceGain * 10) * 0.4;  // Clip to [-0.4, 0.4]

  // Adherence bonus (30% weight)
  // Did they complete the recommended workouts?
  const adherenceReward = adherence * 0.3;  // 0-0.3

  // Recovery penalty (20% weight)
  // High soreness/fatigue = negative reward
  const recoveryScore = (10 - soreness - fatigue) / 10;  // 0-1, higher is better
  const recoveryReward = (recoveryScore - 0.5) * 0.2;    // -0.1 to +0.1

  // Injury penalty (10% weight, but catastrophic if injury)
  const injuryPenalty = injury ? -1.0 : 0;

  // Total reward
  return performanceReward + adherenceReward + recoveryReward + injuryPenalty;
}
```

### 2.5 Thompson Sampling Algorithm

```typescript
// services/ml/volumeBandit.ts

export class ThompsonSamplingBandit {
  // Beta distribution parameters for each (context_cluster, action) pair
  private alpha: Map<string, number[]>;  // Successes
  private beta: Map<string, number[]>;   // Failures

  private contextClusters = 8;  // Number of context clusters
  private numActions = 5;       // Number of volume actions

  constructor() {
    // Initialize with optimistic priors
    this.alpha = new Map();
    this.beta = new Map();

    for (let c = 0; c < this.contextClusters; c++) {
      // Prior: Alpha=2, Beta=2 (uniform-ish, slightly optimistic)
      this.alpha.set(`cluster_${c}`, Array(this.numActions).fill(2));
      this.beta.set(`cluster_${c}`, Array(this.numActions).fill(2));
    }
  }

  /**
   * Select action using Thompson Sampling
   */
  selectAction(context: BanditContext): {
    action: VolumeAction;
    confidence: number;
    reasoning: string;
  } {
    // Map context to cluster
    const cluster = this.getContextCluster(context);
    const clusterKey = `cluster_${cluster}`;

    // Sample from Beta distributions for each action
    const samples: number[] = [];
    const alphas = this.alpha.get(clusterKey)!;
    const betas = this.beta.get(clusterKey)!;

    for (let a = 0; a < this.numActions; a++) {
      // Sample from Beta(alpha, beta)
      samples.push(this.sampleBeta(alphas[a], betas[a]));
    }

    // Apply safety constraints
    const safeSamples = this.applySafetyConstraints(samples, context);

    // Select action with highest sample
    const action = safeSamples.indexOf(Math.max(...safeSamples));

    // Calculate confidence (based on total observations)
    const totalObs = alphas[action] + betas[action];
    const confidence = Math.min(1, totalObs / 50);  // Max confidence at 50 observations

    // Generate reasoning
    const reasoning = this.generateReasoning(action, context, confidence);

    return { action, confidence, reasoning };
  }

  /**
   * Update beliefs based on observed reward
   */
  updateBeliefs(
    context: BanditContext,
    action: VolumeAction,
    reward: number
  ): void {
    const cluster = this.getContextCluster(context);
    const clusterKey = `cluster_${cluster}`;

    const alphas = this.alpha.get(clusterKey)!;
    const betas = this.beta.get(clusterKey)!;

    // Convert reward to success/failure
    // Reward > 0 = success, <= 0 = failure
    if (reward > 0) {
      alphas[action] += reward;  // Proportional update
    } else {
      betas[action] += Math.abs(reward);
    }

    // Decay old observations (forgetting factor for non-stationarity)
    const DECAY = 0.99;
    for (let a = 0; a < this.numActions; a++) {
      alphas[a] = 1 + (alphas[a] - 1) * DECAY;
      betas[a] = 1 + (betas[a] - 1) * DECAY;
    }

    this.alpha.set(clusterKey, alphas);
    this.beta.set(clusterKey, betas);
  }

  /**
   * Map context to cluster using simple rules
   * (Could be replaced with k-means or neural network)
   */
  private getContextCluster(context: BanditContext): number {
    // Cluster based on fatigue × experience
    const fatigueLevel = context.avg_fatigue_7d > 3 ? 'high' : 'low';
    const expLevel = context.experience_level;
    const recentProgress = context.recent_pr_count > 0 ? 'progressing' : 'stalled';

    // 2 × 3 × 2 = 12 possible clusters, map to 8
    const clusterMap: Record<string, number> = {
      'low_0_progressing': 0,  // Beginner, fresh, progressing
      'low_0_stalled': 1,      // Beginner, fresh, stalled
      'low_1_progressing': 2,  // Intermediate, fresh, progressing
      'low_1_stalled': 3,      // Intermediate, fresh, stalled
      'low_2_progressing': 4,  // Advanced, fresh, progressing
      'low_2_stalled': 5,      // Advanced, fresh, stalled
      'high_any_any': 6,       // Any experience, fatigued
      'deload_needed': 7       // Any, needs deload
    };

    if (context.weeks_since_deload > 6 || context.avg_soreness_7d > 4) {
      return 7;  // Deload cluster
    }

    if (fatigueLevel === 'high') {
      return 6;  // Fatigued cluster
    }

    const key = `${fatigueLevel}_${expLevel}_${recentProgress}`;
    return clusterMap[key] ?? 0;
  }

  /**
   * Apply safety constraints to prevent dangerous recommendations
   */
  private applySafetyConstraints(
    samples: number[],
    context: BanditContext
  ): number[] {
    const safe = [...samples];

    // Constraint 1: No aggressive increase if fatigued
    if (context.avg_fatigue_7d > 3.5 || context.avg_soreness_7d > 3.5) {
      safe[VolumeAction.INCREASE_AGGRESSIVE] = -Infinity;
      safe[VolumeAction.INCREASE_MODERATE] *= 0.5;
    }

    // Constraint 2: Force deload if overdue
    if (context.weeks_since_deload > 6) {
      safe[VolumeAction.DELOAD] += 0.5;  // Boost deload probability
    }

    // Constraint 3: No decrease for beginners unless fatigued
    if (context.experience_level === 0 && context.avg_fatigue_7d < 3) {
      safe[VolumeAction.DECREASE_MODERATE] *= 0.5;
      safe[VolumeAction.DELOAD] *= 0.3;
    }

    // Constraint 4: Cap volume at MRV
    const avgVolumeRatio = context.volume_vs_mav.reduce((a, b) => a + b, 0) / 6;
    if (avgVolumeRatio > 1.1) {
      safe[VolumeAction.INCREASE_AGGRESSIVE] = -Infinity;
      safe[VolumeAction.INCREASE_MODERATE] = -Infinity;
    }

    return safe;
  }

  /**
   * Sample from Beta distribution using inverse CDF method
   */
  private sampleBeta(alpha: number, beta: number): number {
    // Use gamma distribution sampling for Beta
    const gamma1 = this.sampleGamma(alpha);
    const gamma2 = this.sampleGamma(beta);
    return gamma1 / (gamma1 + gamma2);
  }

  private sampleGamma(shape: number): number {
    // Marsaglia and Tsang's method
    if (shape < 1) {
      return this.sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number, v: number;
      do {
        x = this.normalRandom();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  private normalRandom(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private generateReasoning(
    action: VolumeAction,
    context: BanditContext,
    confidence: number
  ): string {
    const actionNames = {
      [VolumeAction.INCREASE_AGGRESSIVE]: 'significant volume increase (+20%)',
      [VolumeAction.INCREASE_MODERATE]: 'moderate volume increase (+10%)',
      [VolumeAction.MAINTAIN]: 'maintaining current volume',
      [VolumeAction.DECREASE_MODERATE]: 'slight volume reduction (-10%)',
      [VolumeAction.DELOAD]: 'deload week (-40%)'
    };

    let reasoning = `Recommending ${actionNames[action]}. `;

    if (confidence < 0.3) {
      reasoning += `Still learning your response patterns (${Math.round(confidence * 100)}% confidence). `;
    }

    if (context.avg_fatigue_7d > 3.5) {
      reasoning += `Elevated fatigue detected. `;
    }

    if (context.recent_pr_count > 0) {
      reasoning += `Recent PRs show good progress. `;
    }

    if (context.stalled_exercises > 2) {
      reasoning += `Multiple exercises stalled - volume change may help. `;
    }

    return reasoning;
  }

  // Serialization for persistence
  toJSON(): string {
    return JSON.stringify({
      alpha: Object.fromEntries(this.alpha),
      beta: Object.fromEntries(this.beta)
    });
  }

  fromJSON(json: string): void {
    const data = JSON.parse(json);
    this.alpha = new Map(Object.entries(data.alpha));
    this.beta = new Map(Object.entries(data.beta));
  }
}
```

---

## Part 3: System Integration

### 3.1 Data Collection Requirements

```typescript
// New fields needed in existing types

// Add to DailyLog
interface DailyLog {
  // ... existing fields

  // New wellness fields for ML
  muscleSoreness: number;      // 1-5 scale
  perceivedRecovery: number;   // 1-5 scale
  perceivedEnergy: number;     // 1-5 scale

  // Post-workout feedback (for bandit)
  workoutDifficulty?: number;  // 1-5, how hard was today's workout?
  workoutSatisfaction?: number; // 1-5, did you perform well?
}

// Add to WorkoutSession
interface WorkoutSession {
  // ... existing fields

  // Bandit feedback
  volumeAction?: VolumeAction;     // What action led to this workout
  feedbackCollected?: boolean;     // Has user provided feedback?
}

// New collection: ML Training Data
interface MLTrainingRecord {
  userId: string;
  timestamp: number;

  // Context at time of recommendation
  context: BanditContext;

  // Action taken
  action: VolumeAction;

  // Outcome (collected 1-2 weeks later)
  reward: number;
  performanceChange: number;
  adherence: number;
  avgSoreness: number;
  avgFatigue: number;
}
```

### 3.2 Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    APP INTEGRATION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Daily Check-in (Morning)                                   │
│     ┌───────────────────────────────────────────────────┐      │
│     │ • Sleep hours                                      │      │
│     │ • Sleep quality (1-5)                              │      │
│     │ • Muscle soreness (1-5)                            │      │
│     │ • Perceived recovery (1-5)                         │      │
│     │ • Stress level (1-5)                               │      │
│     └───────────────────────────────────────────────────┘      │
│                           ↓                                     │
│  2. Fatigue Prediction                                          │
│     ┌───────────────────────────────────────────────────┐      │
│     │ GRU Model → Fatigue Score + Deload Probability    │      │
│     │ Display: "Recovery Score" card on Dashboard       │      │
│     └───────────────────────────────────────────────────┘      │
│                           ↓                                     │
│  3. Volume Recommendation (if starting workout)                 │
│     ┌───────────────────────────────────────────────────┐      │
│     │ Thompson Sampling → Volume adjustment suggestion  │      │
│     │ Display: "AI Volume Coach" modal before workout   │      │
│     └───────────────────────────────────────────────────┘      │
│                           ↓                                     │
│  4. Post-Workout Feedback (after finishing)                     │
│     ┌───────────────────────────────────────────────────┐      │
│     │ • Workout difficulty (1-5)                         │      │
│     │ • Performance satisfaction (1-5)                   │      │
│     │ • Any pain/discomfort? (y/n)                       │      │
│     └───────────────────────────────────────────────────┘      │
│                           ↓                                     │
│  5. Weekly Review (Sunday)                                      │
│     ┌───────────────────────────────────────────────────┐      │
│     │ • Calculate reward for past week                   │      │
│     │ • Update bandit beliefs                            │      │
│     │ • Generate next week's volume plan                 │      │
│     └───────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Cold Start Strategy

```typescript
// Population priors based on research

const POPULATION_PRIORS: Record<ExperienceLevel, BetaParams[]> = {
  beginner: [
    { alpha: 4, beta: 2 },  // INCREASE_AGGRESSIVE: Usually good
    { alpha: 5, beta: 2 },  // INCREASE_MODERATE: Very good
    { alpha: 3, beta: 3 },  // MAINTAIN: Neutral
    { alpha: 2, beta: 4 },  // DECREASE: Usually bad
    { alpha: 2, beta: 4 },  // DELOAD: Usually not needed
  ],
  intermediate: [
    { alpha: 3, beta: 3 },  // INCREASE_AGGRESSIVE: Depends
    { alpha: 4, beta: 3 },  // INCREASE_MODERATE: Usually good
    { alpha: 3, beta: 3 },  // MAINTAIN: Neutral
    { alpha: 3, beta: 3 },  // DECREASE: Depends
    { alpha: 3, beta: 3 },  // DELOAD: Sometimes needed
  ],
  advanced: [
    { alpha: 2, beta: 4 },  // INCREASE_AGGRESSIVE: Risky
    { alpha: 3, beta: 3 },  // INCREASE_MODERATE: Careful
    { alpha: 4, beta: 3 },  // MAINTAIN: Often best
    { alpha: 3, beta: 3 },  // DECREASE: Sometimes needed
    { alpha: 4, beta: 3 },  // DELOAD: Frequently needed
  ]
};
```

---

## Part 4: Implementation Timeline

### Week 1-2: Foundation
- [ ] Add wellness fields to DailyLog type
- [ ] Create daily check-in UI component
- [ ] Build feature extraction pipeline
- [ ] Implement basic GRU model in Python
- [ ] Set up TensorFlow.js inference

### Week 3-4: Fatigue Prediction
- [ ] Train initial model on synthetic/public data
- [ ] Deploy model to app (IndexedDB caching)
- [ ] Build Recovery Score UI card
- [ ] A/B test vs existing heuristic fatigue analysis

### Week 5-6: Volume Bandit
- [ ] Implement Thompson Sampling bandit
- [ ] Add post-workout feedback UI
- [ ] Build "AI Volume Coach" modal
- [ ] Cold start with population priors
- [ ] Weekly review & belief update

### Week 7-8: Polish & Iterate
- [ ] Collect user feedback data
- [ ] Retrain models with real data
- [ ] Performance optimization
- [ ] Safety monitoring & alerts
- [ ] Documentation & monitoring dashboard

---

## Part 5: Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Fatigue Prediction Accuracy** | >80% F1 for deload prediction | Confusion matrix vs actual deloads |
| **Volume Bandit Regret** | <20% regret vs oracle | Cumulative reward analysis |
| **User Engagement** | >60% daily check-in rate | Analytics |
| **Deload Adherence** | >70% follow recommendations | Tracked vs actual |
| **Injury Rate** | <baseline | Self-reported injuries |
| **Performance Gains** | >5% improvement vs control | A/B test on strength progression |

---

## Files to Create

1. `services/ml/fatiguePrediction.ts` - GRU inference
2. `services/ml/volumeBandit.ts` - Thompson Sampling
3. `services/ml/featureExtraction.ts` - Feature engineering
4. `services/ml/modelManager.ts` - Model loading & caching
5. `components/DailyWellnessCheckIn.tsx` - Morning check-in UI
6. `components/RecoveryScoreCard.tsx` - Dashboard widget
7. `components/AIVolumeCoach.tsx` - Pre-workout recommendation
8. `components/PostWorkoutFeedback.tsx` - Feedback collection
9. `backend/ml/train_fatigue_model.py` - Training script
10. `backend/ml/export_tfjs.py` - TensorFlow.js export
