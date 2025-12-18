# AI Coach Research Synthesis: What Actually Works

> Comprehensive analysis of successful apps, scientific research, and user behavior to determine VoltLift's optimal AI coaching strategy

**Research Completed:** December 2024
**Last Updated:** December 2025
**Implementation Status:** ✅ COMPLETE - All phases implemented

---

## Executive Summary

**Key Finding:** AI coaching is a proven differentiator, but the most successful apps use **hybrid approaches** combining formula-based heuristics (fast, offline, private) with optional ML-powered insights (deep, personalized, online).

**Recommended Strategy:** Start with offline-first progressive overload heuristics, layer in ML-based weekly analysis, avoid over-engineering.

**Current Status (December 2025):** VoltLift has successfully implemented ALL recommended features and exceeded the original roadmap with additional ML capabilities including fatigue prediction neural networks and Thompson Sampling bandit optimization.

---

## Implementation Status Overview

| Feature | Status | File(s) |
|---------|--------|---------|
| Progressive Overload Engine | ✅ Complete | `services/progressiveOverload.ts` |
| 1RM Estimation (Brzycki/Epley) | ✅ Complete | `services/progressiveOverload.ts:47-59` |
| Recovery Score Calculation | ✅ Complete | `services/progressiveOverload.ts:164-190` |
| Volume Landmarks (MEV/MAV/MRV) | ✅ Complete | `services/volumeOptimization.ts` |
| Weekly Volume Tracking | ✅ Complete | `services/analytics.ts:121-184` |
| PR Detection & Celebration | ✅ Complete | `store/useStore.ts`, `pages/Analytics.tsx` |
| Injury Risk Detection | ✅ Complete | `services/injuryRisk.ts` |
| Periodization Engine | ✅ Complete | `services/periodization.ts` |
| Workout Intelligence | ✅ Complete | `services/workoutIntelligence.ts` |
| Weak Point Analysis | ✅ Complete | `services/workoutIntelligence.ts:186-331` |
| Exercise Substitutions | ✅ Complete | `services/workoutIntelligence.ts:96-177` |
| AI Coaching (Gemini) | ✅ Complete | `services/gnCoachingService.ts` |
| Thompson Sampling Bandit | ✅ Complete | `services/ml/volumeBandit.ts` |
| GRU Fatigue Predictor | ✅ Complete | `services/ml/fatiguePredictor.ts` |
| Feature Extraction ML | ✅ Complete | `services/ml/featureExtraction.ts` |
| PR Forecasting | ✅ Complete | `services/prForecasting.ts` |
| Analytics Dashboard | ✅ Complete | `pages/Analytics.tsx` |

---

## Part 1: Industry Standards vs VoltLift Implementation

### Feature Comparison Matrix

| Industry Standard | Fitbod | Alpha Progression | VoltLift |
|-------------------|--------|-------------------|----------|
| Equipment-based workout building | ✅ | ✅ | ✅ |
| Muscle readiness tracking | ✅ | ❌ | ✅ |
| Workout history analysis | ✅ | ✅ | ✅ |
| Progressive overload logic | ✅ | ✅ | ✅ |
| 1RM estimation (Brzycki) | ✅ | ✅ | ✅ |
| Session-to-session adaptation | ✅ | ✅ | ✅ |
| RIR/RPE tracking | ✅ | ✅ | ✅ |
| Auto deload scheduling | ✅ | ✅ | ✅ |
| Auto-generated training plans | ✅ | ❌ | ✅ |
| Performance charts | ✅ | ✅ | ✅ |
| Volume landmarks (MEV/MAV/MRV) | ✅ | ❌ | ✅ |
| Injury risk detection | ❌ | ❌ | ✅ |
| ML-based volume optimization | ❌ | ❌ | ✅ |
| GRU fatigue prediction | ❌ | ❌ | ✅ |
| Thompson Sampling bandit | ❌ | ❌ | ✅ |
| PR forecasting | ❌ | ❌ | ✅ |
| Offline-first architecture | ❌ | ✅ | ✅ |
| Privacy-first (local storage) | ❌ | ❌ | ✅ |

**VoltLift exceeds industry standards** with proprietary ML features not found in competitors.

---

## Part 2: Current Implementation Details

### 1. Workout Engine (Equipment, Muscle Readiness, History)

**Industry Standard:** Builds personalized sessions based on available equipment, muscle recovery, and workout history.

**VoltLift Implementation:** ✅ COMPLETE

**Key Files:**
- [workoutIntelligence.ts](../services/workoutIntelligence.ts)
- [injuryRisk.ts](../services/injuryRisk.ts)
- [analytics.ts](../services/analytics.ts)

**Features:**
```typescript
// Equipment-based substitutions
findExerciseSubstitutions(
  exerciseId: string,
  availableEquipment: string[],
  avoidMuscleGroups: MuscleGroup[],
  preferredDifficulty?: 'beginner' | 'intermediate' | 'advanced'
): ExerciseSubstitution[]

// Movement pattern matching (squat, hinge, push_horizontal, etc.)
inferMovementPattern(exercise: Exercise): MovementPattern

// Balanced exercise selection for programs
selectBalancedExercises(
  targetMuscleGroups: MuscleGroup[],
  sessionCount: number,
  experienceLevel: ExperienceLevel,
  availableEquipment: string[]
): Exercise[][]
```

---

### 2. Progressive Overload Logic

**Industry Standard:** RPE-based progression with experience-level adjustments and 1RM estimation.

**VoltLift Implementation:** ✅ COMPLETE

**Key File:** [progressiveOverload.ts](../services/progressiveOverload.ts)

**1RM Estimation:**
```typescript
// Brzycki formula (most accurate for <5 reps)
if (reps <= 5) {
  return Math.round(weight * (36 / (37 - reps)));
}

// Epley formula (accurate for 2-10 reps)
return Math.round(weight * (1 + reps / 30));
```

**Experience-Based Progression Rates:**
- **Beginner:** 5% per progression (linear gains phase)
- **Intermediate:** 2.5% per progression (standard periodization)
- **Advanced:** 1.25% per progression (precise increments)

**Phase 2 Personalization:**
- `adjustSuggestionBias()`: Learns user preferences from acceptance patterns
- `getProgressionRate()`: Auto-regulates based on success rate

---

### 3. Session-to-Session Adaptation

**Industry Standard:** Uses Brzycki 1RM estimation to adapt weights between sessions.

**VoltLift Implementation:** ✅ COMPLETE

**Key Logic:**
```typescript
// Calculate estimated 1RM and current intensity
const estimated1RM = estimate1RM(weight, reps);
const currentIntensity = Math.round((weight / estimated1RM) * 100);

// Intensity-based progression
if (currentIntensity < 70 && rpe < 7 && recoveryScore >= 7) {
  progressionRate = Math.max(baseProgressionRate, 0.05); // Push harder
} else if (currentIntensity >= 85) {
  progressionRate = Math.min(baseProgressionRate, 0.0125); // Conservative
}
```

**Math Explanations (Explainability):**
```typescript
mathExplanation: `Last: ${weight}kg × ${reps} reps (${currentIntensity}% of ${estimated1RM}kg 1RM).
Next: ${newWeight}kg = ${Math.round((newWeight / estimated1RM) * 100)}% intensity`
```

---

### 4. Smart Set Recommendations (RIR, Deload Weeks)

**Industry Standard:** Suggests sets/reps based on RIR tracking, auto-schedules deloads.

**VoltLift Implementation:** ✅ COMPLETE

**Key Files:**
- [progressiveOverload.ts](../services/progressiveOverload.ts) - RPE/RIR handling
- [periodization.ts](../services/periodization.ts) - Deload scheduling

**RPE-Based Logic:**
```typescript
// RPE override: If RPE very high (≥9.5), maintain weight
if (rpe >= 9.5) {
  return {
    weight: weight,
    reasoning: `RPE ${rpe}/10 is very high. Maintain weight to prevent overtraining.`
  };
}

// RPE < 7 + good recovery = PUSH
if (rpe < 7 && recoveryScore >= 7) {
  newWeight = Math.round(weight * (1 + progressionRate));
}
```

**Automatic Deload Detection:**
```typescript
function shouldDeloadWeek(history, dailyLogs): { shouldDeload: boolean; reasoning: string } {
  // Factor 1: Average RPE trend
  if (avgRPE >= 9) return { shouldDeload: true, reasoning: 'CNS fatigue likely' };

  // Factor 2: Sleep debt accumulation
  if (avgSleep < 6.5) return { shouldDeload: true, reasoning: 'Sleep debt accumulated' };
}
```

**Deload Frequency by Experience:**
- **Beginner:** Every 8 weeks
- **Intermediate:** Every 5 weeks
- **Advanced:** Every 4 weeks

---

### 5. Auto-Generated Training Plans

**Industry Standard:** Generate personalized training blocks (mesocycles).

**VoltLift Implementation:** ✅ COMPLETE

**Key File:** [periodization.ts](../services/periodization.ts)

**Training Phases:**
```typescript
type TrainingPhase = 'accumulation' | 'intensification' | 'deload' | 'peaking';

interface MesocyclePlan {
  phase: TrainingPhase;
  durationWeeks: number;
  volumeProgression: 'increase' | 'maintain' | 'decrease';
  intensityProgression: 'increase' | 'maintain' | 'decrease';
  volumeMultiplier: number;  // 1.0 baseline, 0.5 deload
  intensityMultiplier: number; // 1.0 baseline, 0.7 deload
}
```

**Phase Configurations:**
| Phase | Volume | Intensity | Focus |
|-------|--------|-----------|-------|
| Accumulation | ↑ Increase | → Maintain | Build work capacity |
| Intensification | ↓ Decrease | ↑ Increase | Push PRs |
| Deload | ↓↓ 50% | ↓ 70% | Active recovery |
| Peaking | ↓↓ Minimal | ↑↑ Max | Competition prep |

---

### 6. Performance Tracking with Charts

**Industry Standard:** Visualize progression over time with multiple chart types.

**VoltLift Implementation:** ✅ COMPLETE

**Key File:** [Analytics.tsx](../pages/Analytics.tsx)

**Available Visualizations:**
- `ProgressionChart` - 1RM progression over time
- `VolumeChart` - Total volume trends
- `MuscleGroupVolumeChart` - Volume distribution per muscle
- `BodyHeatmap` - Visual muscle recovery status
- `PRHistoryTimeline` - PR history chronologically
- `RPETrendsChart` - RPE tracking over time
- `VolumeBreakdownTable` - Weekly volume breakdown

**PR Forecasting (Beyond Industry Standard):**
```typescript
interface PRForecast {
  currentPR: number;
  predictedPR: number;
  weeksToTarget: number;
  confidence: number;
  isAchievable: boolean;
  projectionCurve: { week: number; weight: number }[];
}
```

---

## Part 3: Advanced ML Features (Beyond Industry Standards)

### 1. Volume Landmarks System

**File:** [volumeOptimization.ts](../services/volumeOptimization.ts)

**Implementation:**
```typescript
interface VolumeLandmarks {
  mv: number;   // Maintenance Volume (sets/week)
  mev: number;  // Minimum Effective Volume
  mav: number;  // Maximum Adaptive Volume
  mrv: number;  // Maximum Recoverable Volume
  current: number;
  status: 'undertrained' | 'optimal' | 'approaching_mrv' | 'overtrained';
  confidence: number; // Based on data quality
}
```

**Personalized Calibration:**
- Uses correlation analysis between volume and performance
- 8+ weeks of data enables personalized landmarks
- Fallback to research-based defaults (Dr. Mike Israetel)

---

### 2. Thompson Sampling Contextual Bandit

**File:** [services/ml/volumeBandit.ts](../services/ml/volumeBandit.ts)

**Purpose:** Learn optimal volume adjustments per muscle group using reinforcement learning.

**Key Concepts:**
```typescript
// Each action has a Beta(alpha, beta) distribution
type VolumeAction = 'decrease' | 'maintain' | 'increase';

// Context modifies base distributions
const CONTEXT_WEIGHTS = {
  fatigue: { high: { decrease: 1.5, maintain: 1.2, increase: 0.5 }, ... },
  recovery: { poor: { decrease: 1.6, maintain: 1.0, increase: 0.4 }, ... },
  recentPerformance: { declining: { decrease: 0.8, maintain: 1.4, increase: 0.6 }, ... }
};
```

**Beta Distribution Sampling:**
- Samples from each action's posterior
- Selects action with highest sampled value
- Updates priors based on reward signals

---

### 3. GRU Neural Network Fatigue Predictor

**File:** [services/ml/fatiguePredictor.ts](../services/ml/fatiguePredictor.ts)

**Architecture:**
- GRU (Gated Recurrent Unit) for temporal sequences
- Predicts fatigue levels from training + recovery data
- Pure TensorFlow.js implementation (runs offline)

---

### 4. Injury Risk Detection

**File:** [services/injuryRisk.ts](../services/injuryRisk.ts)

**Risk Factors Analyzed:**
1. **RPE Trend Analysis** - Rising RPE indicates fatigue
2. **Volume Spike Detection** - >20% week-over-week increase
3. **Sleep Debt Analysis** - Chronic sleep deprivation
4. **Rapid Progression Detection** - >10 lbs/week on compounds
5. **Insufficient Recovery Time** - <1 day average between workouts

**Risk Score Calculation:**
```typescript
interface InjuryRiskAssessment {
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  needsDeload: boolean;
  daysUntilRecommendedDeload: number;
}
```

---

### 5. Weak Point Analysis

**File:** [services/workoutIntelligence.ts](../services/workoutIntelligence.ts)

**Detects:**
1. **Undertrained muscle groups** - Below MEV
2. **Strength imbalances** - Push/pull ratio
3. **Stagnant exercises** - No progress in 8+ weeks

**Output:**
```typescript
interface WeakPointAnalysis {
  weakPoints: WeakPoint[];
  overallBalance: number; // 0-100
  priorityAreas: MuscleGroup[];
  recommendations: string[];
}
```

---

## Part 4: Competitive Analysis (Updated December 2025)

### Apps With AI Features

#### Fitbod (Market Leader)
- ML trained on 400M+ data points
- Recovery-based programming
- **Weakness:** Requires online connection, not privacy-first

#### Alpha Progression (Progressive Overload Specialist)
- RIR-based periodization
- Multiple PR types recognition
- **Weakness:** No ML-based volume optimization, no injury detection

#### Tonal (Hardware + AI)
- Strength Score (0-1000)
- Real-time coaching from cables + camera
- **Weakness:** Requires $4,000 hardware

### VoltLift's Competitive Advantages

| Advantage | vs Fitbod | vs Alpha | vs Tonal |
|-----------|-----------|----------|----------|
| Offline-first | ✅ | = | ✅ |
| Privacy-first | ✅ | ✅ | ✅ |
| Free AI features | ✅ | = | ✅ |
| Volume landmarks | = | ✅ | ✅ |
| Injury risk detection | ✅ | ✅ | ✅ |
| Thompson Sampling ML | ✅ | ✅ | ✅ |
| GRU fatigue prediction | ✅ | ✅ | ✅ |
| No hardware required | = | = | ✅ |

---

## Part 5: Research Foundation

### Scientific Principles Applied

#### RPE & RIR (Rate of Perceived Exertion / Reps in Reserve)
- **Implementation:** Optional RPE tracking, AI infers intensity from performance
- **Source:** [MASS Research Review](https://massresearchreview.com/2023/05/22/rpe-and-rir-the-complete-guide/)

#### Volume Landmarks (Dr. Mike Israetel)
- **Implementation:** `volumeOptimization.ts` with personalized calibration
- **Source:** [Dr. Mike Israetel MV, MEV, MAV, MRV Explained](https://drmikeisraetel.com/dr-mike-israetel-mv-mev-mav-mrv-explained/)

#### Sleep & Recovery Impact
- **Research:** Sleep deprivation reduces squat 1RM by 11.1%
- **Implementation:** Recovery score heavily weights sleep hours
- **Source:** [Sleep and Athletic Performance](https://pmc.ncbi.nlm.nih.gov/articles/PMC9960533/)

#### 1RM Estimation Formulas
- **Brzycki:** Most accurate for 1-5 reps
- **Epley:** Accurate for 2-10 reps
- **Implementation:** Uses both based on rep range

---

## Part 6: Success Metrics

### Original Targets vs Achieved

| Metric | Target | Status |
|--------|--------|--------|
| Users enable AI suggestions | 60%+ | ✅ Implemented |
| Users accept AI recommendations | 40%+ | ✅ Tracking enabled |
| Faster 1RM gains vs manual | 15%+ | ✅ Infrastructure ready |
| AI user retention boost | 20%+ | ✅ Tracking enabled |

### Implementation Completeness

| Phase | Planned | Implemented |
|-------|---------|-------------|
| Phase 1: Progressive Overload | Weeks 1-2 | ✅ Complete |
| Phase 2: PR Detection + Volume | Week 3 | ✅ Complete |
| Phase 3: Strength Score + 1RM | Weeks 4-5 | ✅ Complete |
| Phase 4: AI Summaries (Gemini) | Week 6+ | ✅ Complete |
| **Bonus:** Thompson Sampling | Not planned | ✅ Implemented |
| **Bonus:** GRU Fatigue | Not planned | ✅ Implemented |
| **Bonus:** Injury Risk | Not planned | ✅ Implemented |

---

## Conclusion

### What Was Built (December 2024 → December 2025)

VoltLift has successfully implemented the complete AI coaching roadmap plus additional ML features that exceed industry standards:

1. **Core Progressive Overload** - Research-backed heuristics working offline
2. **PR Detection & Celebration** - Multiple PR types with celebration UX
3. **Volume Landmarks System** - Personalized MEV/MAV/MRV calibration
4. **Periodization Engine** - Auto-generated mesocycles with phase recommendations
5. **Injury Risk Detection** - Multi-factor risk scoring with recommendations
6. **AI Coaching (Gemini)** - TM adjustments, deload recommendations, exercise substitutions
7. **Thompson Sampling Bandit** - ML-based volume optimization
8. **GRU Fatigue Predictor** - Neural network for fatigue forecasting

### Architecture Achievements

- ✅ **Offline-first** - All core features work without internet
- ✅ **Privacy-first** - Data stays on device by default
- ✅ **3-tier system** - Offline heuristics → ML features → Optional Gemini AI
- ✅ **Explainability** - Math explanations for all suggestions

### Next Steps (Future Roadmap)

1. **HealthKit/Health Connect Integration** - HRV data for recovery accuracy
2. **Apple Watch Live Activities** - Real-time workout tracking
3. **Social Features** - Share PRs, compare with friends
4. **Coach Marketplace** - Custom programs from certified coaches

---

## Appendix: File Structure

```
services/
├── progressiveOverload.ts    # Core progressive overload heuristics
├── analytics.ts              # Time series data extraction
├── volumeOptimization.ts     # Volume landmarks (MEV/MAV/MRV)
├── periodization.ts          # Mesocycle planning & deload scheduling
├── workoutIntelligence.ts    # Exercise substitution & weak point analysis
├── injuryRisk.ts             # Injury risk detection system
├── gnCoachingService.ts      # Gemini AI coaching integration
├── prForecasting.ts          # PR prediction algorithms
├── progressionData.ts        # Data extraction for charts
└── ml/
    ├── featureExtraction.ts  # ML feature engineering
    ├── volumeBandit.ts       # Thompson Sampling bandit
    └── fatiguePredictor.ts   # GRU neural network

pages/
├── Analytics.tsx             # Full analytics dashboard
└── Dashboard.tsx             # Main dashboard with AI insights

components/
├── ProgressionChart.tsx      # 1RM/Volume charts
├── MuscleGroupVolumeChart.tsx # Volume distribution
├── BodyHeatmap.tsx           # Muscle recovery visualization
├── PRHistoryTimeline.tsx     # PR history component
├── RPETrendsChart.tsx        # RPE tracking
├── VolumeBreakdownTable.tsx  # Weekly volume breakdown
└── DetailedInsights.tsx      # AI-generated insights
```

---

**Document Version:** 2.0
**Last Updated:** December 2025
**Status:** Implementation complete, monitoring metrics
