# Fatigue Prediction Implementation Guide for VoltLift

**Quick Start:** This guide provides copy-paste code for implementing ML-based fatigue prediction in VoltLift, starting with simple heuristics and scaling to deep learning.

**Prerequisites:** Read [`fatigue-prediction-research.md`](./fatigue-prediction-research.md) for research background and algorithm justifications.

---

## Phase 1: Simple Heuristics (MVP - Ship in Week 1-2)

### 1.1 Add Recovery Fields to DailyLog

**File:** `/types.ts`

```typescript
export interface DailyLog {
    date: string; // YYYY-MM-DD
    sleepHours?: number;
    proteinGrams?: number;
    waterLitres?: number;
    stressLevel?: number;  // 1-10 scale
    bodyweight?: number;
    measurements?: BodyMeasurements;
    progressPhoto?: string;

    // NEW: Subjective wellness for fatigue prediction
    muscleSoreness?: number;      // 1-10 scale (1 = none, 10 = extreme)
    perceivedRecovery?: number;   // 1-10 scale (1 = exhausted, 10 = fully recovered)
    perceivedEnergy?: number;     // 1-10 scale (1 = drained, 10 = energized)
}
```

### 1.2 Create Fatigue Prediction Service

**File:** `/services/fatiguePredictor.ts`

```typescript
import type { WorkoutSession, DailyLog, UserSettings } from '../types';

export interface RecoveryScore {
  score: number;                    // 0-100 (100 = fully recovered)
  level: 'Low' | 'Medium' | 'High'; // User-friendly label
  confidence: 'low' | 'medium' | 'high';
  advice: string;
  factors: {
    acwr: number;
    acwrStatus: 'optimal' | 'high_risk' | 'detraining';
    rpeTrend: 'increasing' | 'stable' | 'decreasing';
    sleepQuality: 'poor' | 'fair' | 'good';
    daysSinceRest: number;
    muscleSoreness: 'low' | 'moderate' | 'high' | 'unknown';
  };
  recommendations: string[];
}

export class FatiguePredictorMVP {
  /**
   * Calculate total volume for a workout
   */
  private calculateVolume(workout: WorkoutSession): number {
    let totalVolume = 0;

    for (const log of workout.logs) {
      for (const set of log.sets) {
        if (set.completed) {
          totalVolume += set.reps * set.weight;
        }
      }
    }

    return totalVolume;
  }

  /**
   * Calculate Acute:Chronic Workload Ratio (ACWR)
   * Acute = 7-day rolling average
   * Chronic = 28-day rolling average
   */
  private calculateACWR(workouts: WorkoutSession[]): number {
    if (workouts.length < 7) {
      return 1.0; // Neutral ACWR if insufficient data
    }

    // Get last 7 days
    const last7Days = workouts.slice(-7);
    const acuteVolume = last7Days.reduce((sum, w) => sum + this.calculateVolume(w), 0);
    const acuteAvg = acuteVolume / 7;

    // Get last 28 days
    const last28Days = workouts.slice(-28);
    const chronicVolume = last28Days.reduce((sum, w) => sum + this.calculateVolume(w), 0);
    const chronicAvg = chronicVolume / 28;

    // Avoid division by zero
    if (chronicAvg === 0) return 1.0;

    return acuteAvg / chronicAvg;
  }

  /**
   * Calculate average RPE for a workout
   */
  private calculateAvgRPE(workout: WorkoutSession): number | null {
    const rpeValues: number[] = [];

    for (const log of workout.logs) {
      for (const set of log.sets) {
        if (set.rpe !== undefined && set.completed) {
          rpeValues.push(set.rpe);
        }
      }
    }

    if (rpeValues.length === 0) return null;
    return rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
  }

  /**
   * Determine RPE trend over last 7 workouts
   */
  private calculateRPETrend(workouts: WorkoutSession[]): 'increasing' | 'stable' | 'decreasing' {
    if (workouts.length < 3) return 'stable';

    const last7 = workouts.slice(-7);
    const rpeValues = last7
      .map(w => this.calculateAvgRPE(w))
      .filter(rpe => rpe !== null) as number[];

    if (rpeValues.length < 3) return 'stable';

    // Simple linear regression slope
    const n = rpeValues.length;
    const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
    const sumY = rpeValues.reduce((sum, rpe) => sum + rpe, 0);
    const sumXY = rpeValues.reduce((sum, rpe, i) => sum + i * rpe, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Threshold for "increasing" or "decreasing"
    if (slope > 0.15) return 'increasing';
    if (slope < -0.15) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate days since last workout
   */
  private getDaysSinceLastWorkout(workouts: WorkoutSession[]): number {
    if (workouts.length === 0) return 999;

    const lastWorkout = workouts[workouts.length - 1];
    const now = Date.now();
    const daysSince = (now - lastWorkout.startTime) / (1000 * 60 * 60 * 24);

    return Math.floor(daysSince);
  }

  /**
   * Main prediction function
   */
  public predict(
    workouts: WorkoutSession[],
    dailyLogs: DailyLog[],
    userSettings: UserSettings
  ): RecoveryScore {
    // Insufficient data fallback
    if (workouts.length < 4) {
      return {
        score: 70,
        level: 'Medium',
        confidence: 'low',
        advice: 'Complete 4+ workouts to get personalized recovery predictions.',
        factors: {
          acwr: 1.0,
          acwrStatus: 'optimal',
          rpeTrend: 'stable',
          sleepQuality: 'fair',
          daysSinceRest: 0,
          muscleSoreness: 'unknown'
        },
        recommendations: [
          'Track your workouts consistently for better insights',
          'Log RPE (Rate of Perceived Exertion) after each set',
          'Record daily sleep hours and stress levels'
        ]
      };
    }

    // Calculate factors
    const acwr = this.calculateACWR(workouts);
    const rpeTrend = this.calculateRPETrend(workouts);
    const daysSinceRest = this.getDaysSinceLastWorkout(workouts);

    // Sleep quality (from last night)
    const lastNightSleep = dailyLogs.length > 0 ? dailyLogs[dailyLogs.length - 1].sleepHours : undefined;
    const sleepQuality: 'poor' | 'fair' | 'good' =
      lastNightSleep === undefined ? 'fair' :
      lastNightSleep >= 7 ? 'good' :
      lastNightSleep >= 6 ? 'fair' : 'poor';

    // Muscle soreness
    const soreness = dailyLogs.length > 0 ? dailyLogs[dailyLogs.length - 1].muscleSoreness : undefined;
    const muscleSoreness: 'low' | 'moderate' | 'high' | 'unknown' =
      soreness === undefined ? 'unknown' :
      soreness <= 3 ? 'low' :
      soreness <= 6 ? 'moderate' : 'high';

    // ACWR status
    const acwrStatus: 'optimal' | 'high_risk' | 'detraining' =
      acwr > 1.5 ? 'high_risk' :
      acwr < 0.8 ? 'detraining' : 'optimal';

    // Calculate base recovery score (0-100)
    let score = 70; // Start at neutral

    // Adjust for ACWR
    if (acwr > 1.5) {
      score -= 25; // High overtraining risk
    } else if (acwr > 1.3) {
      score -= 15; // Moderate risk
    } else if (acwr < 0.8) {
      score += 15; // Well recovered, possible detraining
    } else {
      score += 10; // Optimal zone
    }

    // Adjust for RPE trend
    if (rpeTrend === 'increasing') {
      score -= 15; // Getting harder = fatigue accumulating
    } else if (rpeTrend === 'decreasing') {
      score += 10; // Getting easier = adapting well
    }

    // Adjust for sleep
    if (sleepQuality === 'good') {
      score += 10;
    } else if (sleepQuality === 'poor') {
      score -= 15;
    }

    // Adjust for muscle soreness
    if (muscleSoreness === 'high') {
      score -= 10;
    } else if (muscleSoreness === 'low') {
      score += 5;
    }

    // Adjust for rest days
    if (daysSinceRest >= 5) {
      score -= 10; // No rest in 5+ days = fatigue
    } else if (daysSinceRest >= 2) {
      score += 5; // Good recovery window
    }

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine level
    const level: 'Low' | 'Medium' | 'High' =
      score >= 70 ? 'High' :
      score >= 50 ? 'Medium' : 'Low';

    // Determine confidence
    const hasRPE = workouts.slice(-7).some(w =>
      w.logs.some(l => l.sets.some(s => s.rpe !== undefined))
    );
    const hasSleep = dailyLogs.length > 0 && lastNightSleep !== undefined;
    const hasSoreness = soreness !== undefined;

    const dataCompleteness = [hasRPE, hasSleep, hasSoreness].filter(Boolean).length;
    const confidence: 'low' | 'medium' | 'high' =
      workouts.length >= 28 && dataCompleteness >= 2 ? 'high' :
      workouts.length >= 12 && dataCompleteness >= 1 ? 'medium' : 'low';

    // Generate advice
    const advice = this.generateAdvice(level, acwrStatus, rpeTrend, sleepQuality);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      level,
      acwrStatus,
      rpeTrend,
      sleepQuality,
      muscleSoreness,
      daysSinceRest
    );

    return {
      score,
      level,
      confidence,
      advice,
      factors: {
        acwr,
        acwrStatus,
        rpeTrend,
        sleepQuality,
        daysSinceRest,
        muscleSoreness
      },
      recommendations
    };
  }

  /**
   * Generate primary advice message
   */
  private generateAdvice(
    level: 'Low' | 'Medium' | 'High',
    acwrStatus: 'optimal' | 'high_risk' | 'detraining',
    rpeTrend: 'increasing' | 'stable' | 'decreasing',
    sleepQuality: 'poor' | 'fair' | 'good'
  ): string {
    if (level === 'Low') {
      if (acwrStatus === 'high_risk') {
        return 'High overtraining risk. Consider a rest day or deload week.';
      }
      if (sleepQuality === 'poor') {
        return 'Low recovery detected. Poor sleep is impacting recovery. Prioritize rest.';
      }
      return 'Low recovery. Your body needs more rest before intense training.';
    }

    if (level === 'Medium') {
      if (rpeTrend === 'increasing') {
        return 'Moderate recovery. Workouts feeling harder lately. Consider lowering intensity today.';
      }
      return 'Moderate recovery. Good day for maintenance training or skill work.';
    }

    // High recovery
    if (acwrStatus === 'detraining') {
      return 'Fully recovered but low recent training load. Good time to increase volume or intensity.';
    }
    return 'Excellent recovery. Ready for high-intensity or high-volume training.';
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    level: 'Low' | 'Medium' | 'High',
    acwrStatus: 'optimal' | 'high_risk' | 'detraining',
    rpeTrend: 'increasing' | 'stable' | 'decreasing',
    sleepQuality: 'poor' | 'fair' | 'good',
    muscleSoreness: 'low' | 'moderate' | 'high' | 'unknown',
    daysSinceRest: number
  ): string[] {
    const recommendations: string[] = [];

    // ACWR-based recommendations
    if (acwrStatus === 'high_risk') {
      recommendations.push('Reduce training volume by 20-30% this week');
      recommendations.push('Consider a deload week (50-60% normal volume)');
    } else if (acwrStatus === 'detraining') {
      recommendations.push('Gradually increase training volume by 5-10% per week');
    }

    // RPE trend recommendations
    if (rpeTrend === 'increasing') {
      recommendations.push('RPE trending up - fatigue accumulating. Lower intensity or volume.');
    }

    // Sleep recommendations
    if (sleepQuality === 'poor') {
      recommendations.push('Prioritize 7-9 hours of sleep tonight');
      recommendations.push('Avoid high-intensity training until sleep improves');
    }

    // Soreness recommendations
    if (muscleSoreness === 'high') {
      recommendations.push('High muscle soreness - focus on active recovery (walking, stretching)');
      recommendations.push('Consider light cardio or mobility work instead of heavy lifting');
    }

    // Rest day recommendations
    if (daysSinceRest >= 5) {
      recommendations.push('No rest day in 5+ days - schedule a full rest day this week');
    }

    // Recovery strategies (general)
    if (level === 'Low') {
      recommendations.push('Increase protein intake (1.6-2.2g per kg bodyweight)');
      recommendations.push('Stay hydrated (3-4 liters water daily)');
    }

    // If no specific recommendations, provide general advice
    if (recommendations.length === 0) {
      recommendations.push('Maintain current training intensity and volume');
      recommendations.push('Continue tracking RPE and sleep for better insights');
    }

    return recommendations;
  }
}

// Export singleton instance
export const fatiguePredictorMVP = new FatiguePredictorMVP();
```

### 1.3 Add to Zustand Store

**File:** `/store/useStore.ts`

```typescript
import { fatiguePredictorMVP, type RecoveryScore } from '../services/fatiguePredictor';

interface StoreState {
  // ... existing state ...

  // NEW: Recovery prediction
  currentRecoveryScore: RecoveryScore | null;
  updateRecoveryScore: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ... existing state ...

      currentRecoveryScore: null,

      updateRecoveryScore: () => {
        const state = get();
        const completedWorkouts = state.workouts.filter(w => w.status === 'completed');
        const dailyLogs = state.dailyLogs || [];
        const userSettings = state.settings;

        const recoveryScore = fatiguePredictorMVP.predict(
          completedWorkouts,
          dailyLogs,
          userSettings
        );

        set({ currentRecoveryScore: recoveryScore });
      }
    }),
    {
      name: 'voltlift-storage'
    }
  )
);
```

### 1.4 Create Recovery Score Card Component

**File:** `/components/RecoveryScoreCard.tsx`

```typescript
import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const RecoveryScoreCard: React.FC = () => {
  const { currentRecoveryScore, updateRecoveryScore } = useStore();

  useEffect(() => {
    // Update recovery score when component mounts
    updateRecoveryScore();
  }, []);

  if (!currentRecoveryScore) {
    return (
      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
        <p className="text-sm text-zinc-400">Loading recovery data...</p>
      </div>
    );
  }

  const { score, level, confidence, advice, factors, recommendations } = currentRecoveryScore;

  // Color based on level
  const levelColor =
    level === 'High' ? 'text-primary' :
    level === 'Medium' ? 'text-yellow-500' : 'text-red-500';

  const levelBg =
    level === 'High' ? 'bg-primary/10' :
    level === 'Medium' ? 'bg-yellow-500/10' : 'bg-red-500/10';

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Recovery Score</h3>
        <span className="text-xs text-zinc-500 uppercase">
          Confidence: {confidence}
        </span>
      </div>

      {/* Score Circle */}
      <div className="flex items-center gap-6 mb-6">
        <div className={`relative w-24 h-24 rounded-full ${levelBg} flex items-center justify-center`}>
          <span className={`text-3xl font-black ${levelColor}`}>{score}</span>
        </div>

        <div className="flex-1">
          <p className={`text-xl font-bold ${levelColor} mb-1`}>{level} Recovery</p>
          <p className="text-sm text-zinc-400">{advice}</p>
        </div>
      </div>

      {/* Factors */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-800 rounded p-3">
          <p className="text-xs text-zinc-500 mb-1">Training Load</p>
          <p className="text-sm font-bold text-white">
            ACWR: {factors.acwr.toFixed(2)}
          </p>
          <p className={`text-xs ${
            factors.acwrStatus === 'optimal' ? 'text-green-500' :
            factors.acwrStatus === 'high_risk' ? 'text-red-500' : 'text-yellow-500'
          }`}>
            {factors.acwrStatus === 'optimal' ? 'Optimal' :
             factors.acwrStatus === 'high_risk' ? 'High Risk' : 'Detraining'}
          </p>
        </div>

        <div className="bg-zinc-800 rounded p-3">
          <p className="text-xs text-zinc-500 mb-1">RPE Trend</p>
          <p className="text-sm font-bold text-white capitalize">{factors.rpeTrend}</p>
          <p className={`text-xs ${
            factors.rpeTrend === 'decreasing' ? 'text-green-500' :
            factors.rpeTrend === 'increasing' ? 'text-red-500' : 'text-zinc-400'
          }`}>
            {factors.rpeTrend === 'decreasing' ? 'Adapting well' :
             factors.rpeTrend === 'increasing' ? 'Fatigue building' : 'Stable'}
          </p>
        </div>

        <div className="bg-zinc-800 rounded p-3">
          <p className="text-xs text-zinc-500 mb-1">Sleep Quality</p>
          <p className="text-sm font-bold text-white capitalize">{factors.sleepQuality}</p>
        </div>

        <div className="bg-zinc-800 rounded p-3">
          <p className="text-xs text-zinc-500 mb-1">Rest Days</p>
          <p className="text-sm font-bold text-white">{factors.daysSinceRest} days ago</p>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="border-t border-zinc-800 pt-4">
          <h4 className="text-sm font-bold text-white mb-2">Recommendations</h4>
          <ul className="space-y-2">
            {recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary text-xs mt-0.5">▸</span>
                <span className="text-xs text-zinc-400">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

### 1.5 Add Daily Wellness Check-In

**File:** `/components/DailyWellnessCheckIn.tsx`

```typescript
import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const DailyWellnessCheckIn: React.FC = () => {
  const { addDailyLog, updateRecoveryScore } = useStore();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const [sleepHours, setSleepHours] = useState<number>(7);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [muscleSoreness, setMuscleSoreness] = useState<number>(5);
  const [perceivedRecovery, setPerceivedRecovery] = useState<number>(7);

  const handleSubmit = () => {
    addDailyLog({
      date: today,
      sleepHours,
      stressLevel,
      muscleSoreness,
      perceivedRecovery
    });

    // Update recovery score with new data
    updateRecoveryScore();
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <h3 className="text-lg font-bold text-white mb-4">Daily Check-In</h3>

      <div className="space-y-4">
        {/* Sleep Hours */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Sleep Hours: {sleepHours}h
          </label>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Stress Level */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Stress Level: {stressLevel}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={stressLevel}
            onChange={(e) => setStressLevel(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-zinc-600 mt-1">
            <span>Relaxed</span>
            <span>Overwhelmed</span>
          </div>
        </div>

        {/* Muscle Soreness */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Muscle Soreness: {muscleSoreness}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={muscleSoreness}
            onChange={(e) => setMuscleSoreness(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-zinc-600 mt-1">
            <span>None</span>
            <span>Extreme</span>
          </div>
        </div>

        {/* Perceived Recovery */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Perceived Recovery: {perceivedRecovery}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={perceivedRecovery}
            onChange={(e) => setPerceivedRecovery(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-zinc-600 mt-1">
            <span>Exhausted</span>
            <span>Fully Recovered</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Save Check-In
        </button>
      </div>
    </div>
  );
};
```

### 1.6 Add to Dashboard

**File:** `/pages/Dashboard.tsx`

```typescript
import { RecoveryScoreCard } from '../components/RecoveryScoreCard';
import { DailyWellnessCheckIn } from '../components/DailyWellnessCheckIn';

export const Dashboard: React.FC = () => {
  // ... existing dashboard code ...

  return (
    <div className="space-y-6">
      {/* Existing dashboard widgets */}

      {/* NEW: Recovery Score Card */}
      <RecoveryScoreCard />

      {/* NEW: Daily Check-In (show if not completed today) */}
      <DailyWellnessCheckIn />

      {/* ... rest of dashboard ... */}
    </div>
  );
};
```

---

## Phase 2: LASSO Regression (Months 2-3)

**Prerequisites:**
- 100+ users with 4+ weeks of data
- Python backend (Flask/FastAPI)
- Database for training data

### 2.1 Python Backend Setup

**File:** `/backend/requirements.txt`

```
flask==3.0.0
flask-cors==4.0.0
numpy==1.26.2
scikit-learn==1.3.2
pandas==2.1.3
joblib==1.3.2
```

**File:** `/backend/app.py`

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.linear_model import LassoCV
import joblib
import os

app = Flask(__name__)
CORS(app)

# Global model (trained on all users)
GLOBAL_MODEL = None
FEATURE_NAMES = [
    'recovery_score_lag_1',
    'recovery_score_lag_2',
    'muscle_soreness',
    'stress_level',
    'sleep_hours',
    'volume_7day_avg',
    'volume_28day_avg',
    'acwr',
    'rpe_avg_last_session',
    'days_since_rest',
    'sessions_per_week'
]

def load_model():
    global GLOBAL_MODEL
    if os.path.exists('models/global_lasso_model.pkl'):
        GLOBAL_MODEL = joblib.load('models/global_lasso_model.pkl')
        print('Loaded pre-trained global model')
    else:
        print('No pre-trained model found. Will train on first request.')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    user_features = data.get('features')

    if GLOBAL_MODEL is None:
        return jsonify({
            'error': 'Model not trained yet. Need 100+ users with 4+ weeks data.'
        }), 400

    # Prepare feature vector
    X = np.array([user_features.get(f, 0) for f in FEATURE_NAMES]).reshape(1, -1)

    # Predict
    prediction = GLOBAL_MODEL.predict(X)[0]
    recovery_score = np.clip(prediction, 0, 100)

    # Feature importance (which factors matter most)
    feature_importance = dict(zip(
        FEATURE_NAMES,
        abs(GLOBAL_MODEL.coef_)
    ))
    top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:3]

    return jsonify({
        'recovery_score': float(recovery_score),
        'model_type': 'lasso_group',
        'confidence': 0.75,  # Based on R² = 0.31-0.35 from research
        'top_features': [{'name': f, 'importance': float(imp)} for f, imp in top_features]
    })

@app.route('/train', methods=['POST'])
def train():
    """
    Train global LASSO model on all user data
    Expected input:
    {
        "training_data": [
            {"user_id": "123", "date": "2024-01-01", "features": {...}, "recovery_score": 75},
            ...
        ]
    }
    """
    global GLOBAL_MODEL
    data = request.json
    training_data = data.get('training_data', [])

    if len(training_data) < 100:
        return jsonify({'error': 'Need at least 100 samples to train'}), 400

    # Prepare training data
    X = []
    y = []

    for sample in training_data:
        features = sample['features']
        X.append([features.get(f, 0) for f in FEATURE_NAMES])
        y.append(sample['recovery_score'])

    X = np.array(X)
    y = np.array(y)

    # Train LASSO with cross-validation
    model = LassoCV(cv=5, alphas=np.logspace(-4, 1, 100))
    model.fit(X, y)

    # Save model
    os.makedirs('models', exist_ok=True)
    joblib.save(model, 'models/global_lasso_model.pkl')
    GLOBAL_MODEL = model

    # Calculate R²
    r2 = model.score(X, y)

    return jsonify({
        'status': 'success',
        'samples_trained': len(training_data),
        'r2_score': float(r2),
        'best_alpha': float(model.alpha_),
        'non_zero_features': int(np.sum(model.coef_ != 0))
    })

if __name__ == '__main__':
    load_model()
    app.run(debug=True, port=5000)
```

### 2.2 Frontend API Integration

**File:** `/services/recoveryAPI.ts`

```typescript
const API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000';

export interface LASSOPrediction {
  recovery_score: number;
  model_type: 'lasso_group' | 'lasso_individual';
  confidence: number;
  top_features: Array<{ name: string; importance: number }>;
}

export async function predictRecoveryLASSO(features: Record<string, number>): Promise<LASSOPrediction> {
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features })
  });

  if (!response.ok) {
    throw new Error('LASSO prediction failed');
  }

  return response.json();
}
```

---

## Phase 3: Personalized LASSO (Months 6-12)

**File:** `/backend/personalized_models.py`

```python
from sklearn.linear_model import LassoCV
import numpy as np
import joblib

class PersonalizedRecoveryPredictor:
    def __init__(self):
        self.global_model = None
        self.individual_models = {}  # user_id -> model

    def get_top_features_for_user(self, user_data, feature_names):
        """Find which features matter most for this user"""
        X = np.array([d['features'] for d in user_data])
        y = np.array([d['recovery_score'] for d in user_data])

        # Train full model
        full_model = LassoCV(cv=3, alphas=np.logspace(-4, 1, 50))
        full_model.fit(X, y)

        # Get top 5 features
        importance = abs(full_model.coef_)
        top_5_indices = np.argsort(importance)[-5:]

        return [feature_names[i] for i in top_5_indices]

    def train_individual_model(self, user_id, user_data, feature_names):
        """Train personalized model for specific user"""
        if len(user_data) < 42:  # Need 6+ weeks
            return None

        top_features = self.get_top_features_for_user(user_data, feature_names)

        # Train with only top features
        X = np.array([[d['features'][f] for f in top_features] for d in user_data])
        y = np.array([d['recovery_score'] for d in user_data])

        model = LassoCV(cv=3, alphas=np.logspace(-4, 1, 50))
        model.fit(X, y)

        self.individual_models[user_id] = {
            'model': model,
            'features': top_features,
            'trained_samples': len(user_data),
            'r2_score': model.score(X, y)
        }

        return self.individual_models[user_id]

    def predict(self, user_id, features):
        """Predict recovery using individual or global model"""
        if user_id in self.individual_models:
            model_data = self.individual_models[user_id]
            if model_data['trained_samples'] >= 42:
                # Use individual model
                X = np.array([[features[f] for f in model_data['features']]])
                prediction = model_data['model'].predict(X)[0]
                confidence = 0.85  # Higher for personalized
                return {
                    'recovery_score': float(np.clip(prediction, 0, 100)),
                    'model_type': 'lasso_individual',
                    'confidence': confidence,
                    'top_features': model_data['features'],
                    'r2_score': model_data['r2_score']
                }

        # Fall back to global model
        if self.global_model is None:
            raise ValueError('Global model not trained')

        X = np.array([[features[f] for f in self.global_model['features']]])
        prediction = self.global_model['model'].predict(X)[0]

        return {
            'recovery_score': float(np.clip(prediction, 0, 100)),
            'model_type': 'lasso_group',
            'confidence': 0.65
        }
```

---

## Testing & Validation

### Unit Tests

**File:** `/tests/fatiguePredictorMVP.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { FatiguePredictorMVP } from '../services/fatiguePredictor';
import type { WorkoutSession, DailyLog, UserSettings } from '../types';

describe('FatiguePredictorMVP', () => {
  const predictor = new FatiguePredictorMVP();

  it('should return low confidence with <4 workouts', () => {
    const workouts: WorkoutSession[] = [];
    const dailyLogs: DailyLog[] = [];
    const settings = {} as UserSettings;

    const result = predictor.predict(workouts, dailyLogs, settings);

    expect(result.confidence).toBe('low');
    expect(result.score).toBe(70);
  });

  it('should detect high overtraining risk (ACWR > 1.5)', () => {
    // Create mock workouts with high acute load
    const workouts = createMockWorkouts({
      last7DaysVolume: 30000,
      last28DaysVolume: 40000
    });

    const result = predictor.predict(workouts, [], {} as UserSettings);

    expect(result.factors.acwrStatus).toBe('high_risk');
    expect(result.level).toBe('Low');
  });

  it('should detect detraining (ACWR < 0.8)', () => {
    const workouts = createMockWorkouts({
      last7DaysVolume: 5000,
      last28DaysVolume: 40000
    });

    const result = predictor.predict(workouts, [], {} as UserSettings);

    expect(result.factors.acwrStatus).toBe('detraining');
  });

  it('should adjust score for poor sleep', () => {
    const workouts = createMockWorkouts({ balanced: true });
    const dailyLogsGoodSleep: DailyLog[] = [{ date: '2024-01-01', sleepHours: 8 }];
    const dailyLogsPoorSleep: DailyLog[] = [{ date: '2024-01-01', sleepHours: 5 }];

    const goodSleepScore = predictor.predict(workouts, dailyLogsGoodSleep, {} as UserSettings);
    const poorSleepScore = predictor.predict(workouts, dailyLogsPoorSleep, {} as UserSettings);

    expect(poorSleepScore.score).toBeLessThan(goodSleepScore.score);
  });
});

function createMockWorkouts(config: {
  last7DaysVolume?: number;
  last28DaysVolume?: number;
  balanced?: boolean;
}): WorkoutSession[] {
  // Helper to generate mock workout data
  // Implementation details...
  return [];
}
```

---

## Next Steps

1. **Implement Phase 1 (This Sprint)**
   - Add recovery fields to `DailyLog` type
   - Create `fatiguePredictor.ts` service
   - Build `RecoveryScoreCard` component
   - Add daily wellness check-in
   - Test with real user data

2. **Collect Data (Weeks 2-8)**
   - Launch Phase 1 to users
   - Track completion rates for daily check-ins
   - Monitor ACWR distributions
   - Collect user feedback on accuracy

3. **Prepare Phase 2 Backend (Month 2)**
   - Set up Python Flask API
   - Implement LASSO training pipeline
   - Wait for 100+ users with 4+ weeks data

4. **Launch Phase 2 (Month 3)**
   - Train global LASSO model
   - A/B test LASSO vs heuristics
   - Measure accuracy improvement

5. **Iterate to Phase 3+ (Months 6-12)**
   - Personalized models for established users
   - LSTM for premium tier
   - Wearable integration (HRV via HealthKit/Google Fit)

---

**Questions? Next Actions?**

- Should I create the UI components next?
- Want me to set up the Python backend boilerplate?
- Need help with testing strategy or A/B test design?
