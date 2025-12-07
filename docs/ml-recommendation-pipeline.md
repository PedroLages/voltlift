# VoltLift ML Recommendation Pipeline - Production Design

## Executive Summary

This document outlines a production-ready machine learning recommendation system for VoltLift that provides:
1. **Exercise Recommendations** - Based on workout history, muscle balance, equipment, and recovery
2. **Program Recommendations** - Based on goals, experience level, and training frequency
3. **Progressive Overload Suggestions** - When to increase weight/reps based on performance trends

**Key Design Principles:**
- **Offline-first**: Works without internet (models run in browser)
- **Progressive enhancement**: Start with rule-based, enhance with ML over time
- **Lightweight**: <5MB total model size, <100ms inference time
- **Privacy-first**: All data stays on device initially, optional cloud training
- **Incremental learning**: Models improve with user feedback

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VoltLift Frontend                        │
│  (React 19 + TypeScript + Zustand + localStorage)              │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │                                    │
    ┌────────▼─────────┐                 ┌───────▼────────────┐
    │  Feature Store   │                 │  Model Registry    │
    │  (IndexedDB)     │                 │  (IndexedDB)       │
    │                  │                 │                    │
    │ • User features  │                 │ • ONNX models      │
    │ • Exercise stats │                 │ • TF.js models     │
    │ • Session data   │                 │ • Rule configs     │
    └────────┬─────────┘                 └───────┬────────────┘
             │                                    │
             └────────────┬───────────────────────┘
                          │
                  ┌───────▼────────────┐
                  │ Recommendation     │
                  │ Service (Client)   │
                  │                    │
                  │ • Exercise Rec     │
                  │ • Program Rec      │
                  │ • Progressive Load │
                  └───────┬────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
    │ Rule-Based │ │ Hybrid ML  │ │ Neural Net │
    │ (Phase 1)  │ │ (Phase 2)  │ │ (Phase 3)  │
    └────────────┘ └────────────┘ └────────────┘

              ┌─────────────────────┐
              │ Optional Cloud Sync │
              │ (Firebase/Backend)  │
              │                     │
              │ • Aggregate stats   │
              │ • Model training    │
              │ • A/B testing       │
              └─────────────────────┘
```

---

## 1. Exercise Recommendation System

### 1.1 Feature Engineering

**User Features (stored in Zustand + persisted):**
```typescript
interface UserFeatures {
  // Demographics
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  goal: ProgramGoal;
  availableEquipment: string[];
  bodyweight?: number;
  gender?: 'male' | 'female';

  // Training History (computed from WorkoutSession[])
  totalWorkouts: number;
  workoutsLast7Days: number;
  workoutsLast30Days: number;

  // Muscle Group Balance (last 30 days)
  muscleGroupVolume: Record<MuscleGroup, number>; // total weight × reps
  muscleGroupSessions: Record<MuscleGroup, number>; // sessions trained

  // Recovery Indicators
  lastWorkoutDate: number;
  daysSinceLastWorkout: number;
  avgRestDaysBetweenSessions: number;

  // Fatigue Signals (from DailyLog)
  recentSleepAvg: number;
  recentRPEAvg: number;

  // Preferences (learned)
  favoriteExercises: string[];
  exerciseFrequency: Record<string, number>; // how often user does each
  exercisePerformance: Record<string, number>; // avg RPE, completion rate
}
```

**Exercise Features (from Exercise Library):**
```typescript
interface ExerciseFeatures {
  id: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  category: ExerciseCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';

  // Computed Stats (across all users if cloud, or just user locally)
  popularityScore: number; // 0-1, how often it appears in workouts
  successRate: number; // 0-1, completion rate
  avgSetsPerSession: number;
  avgRepsPerSet: number;

  // User-specific (from personal history)
  userCompletionRate: number;
  userAvgRPE: number;
  daysSinceLastPerformed: number;
  personalBest1RM?: number;
}
```

**Context Features (session-specific):**
```typescript
interface SessionContext {
  currentWorkoutDuration: number; // minutes
  exercisesAlreadyInSession: string[];
  muscleGroupsAlreadyTrained: MuscleGroup[];
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: number;
  isFollowingProgram: boolean;
}
```

### 1.2 Feature Extraction Pipeline

```typescript
// /services/ml/featureExtractor.ts

export class FeatureExtractor {
  private store: AppState;

  constructor(store: AppState) {
    this.store = store;
  }

  /**
   * Extract user features from Zustand store
   */
  extractUserFeatures(): UserFeatures {
    const { settings, history, dailyLogs } = this.store;

    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentHistory = history.filter(
      h => h.status === 'completed' && h.startTime > last30Days
    );

    // Muscle group volume calculation
    const muscleGroupVolume: Record<MuscleGroup, number> = {} as any;
    const muscleGroupSessions: Record<MuscleGroup, number> = {} as any;

    recentHistory.forEach(session => {
      session.logs.forEach(log => {
        const exercise = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
        if (!exercise) return;

        const volume = log.sets
          .filter(s => s.completed && s.type !== 'W')
          .reduce((sum, s) => sum + s.weight * s.reps, 0);

        muscleGroupVolume[exercise.muscleGroup] =
          (muscleGroupVolume[exercise.muscleGroup] || 0) + volume;

        muscleGroupSessions[exercise.muscleGroup] =
          (muscleGroupSessions[exercise.muscleGroup] || 0) + 1;

        // Add secondary muscles (weighted 0.5x)
        exercise.secondaryMuscles?.forEach(sm => {
          muscleGroupVolume[sm] =
            (muscleGroupVolume[sm] || 0) + volume * 0.5;
        });
      });
    });

    // Sleep and RPE averages
    const last7Days = Object.values(dailyLogs)
      .filter(log => new Date(log.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentSleepAvg = last7Days.reduce((sum, log) =>
      sum + (log.sleepHours || 7), 0) / Math.max(last7Days.length, 1);

    // Calculate average RPE from recent sessions
    let totalRPE = 0, rpeCount = 0;
    recentHistory.slice(0, 5).forEach(session => {
      session.logs.forEach(log => {
        log.sets.forEach(set => {
          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }
        });
      });
    });
    const recentRPEAvg = rpeCount > 0 ? totalRPE / rpeCount : 7;

    // Exercise frequency and performance
    const exerciseFrequency: Record<string, number> = {};
    const exercisePerformance: Record<string, number> = {};

    recentHistory.forEach(session => {
      session.logs.forEach(log => {
        exerciseFrequency[log.exerciseId] =
          (exerciseFrequency[log.exerciseId] || 0) + 1;

        const completedSets = log.sets.filter(s => s.completed).length;
        const totalSets = log.sets.length;
        const completionRate = totalSets > 0 ? completedSets / totalSets : 0;

        exercisePerformance[log.exerciseId] = completionRate;
      });
    });

    return {
      experienceLevel: settings.experienceLevel,
      goal: settings.goal.type as ProgramGoal,
      availableEquipment: settings.availableEquipment,
      bodyweight: settings.bodyweight,
      gender: settings.gender,
      totalWorkouts: history.filter(h => h.status === 'completed').length,
      workoutsLast7Days: history.filter(h =>
        h.status === 'completed' &&
        h.startTime > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length,
      workoutsLast30Days: recentHistory.length,
      muscleGroupVolume,
      muscleGroupSessions,
      lastWorkoutDate: history[0]?.startTime || 0,
      daysSinceLastWorkout: history[0]
        ? Math.floor((Date.now() - history[0].startTime) / (24 * 60 * 60 * 1000))
        : 999,
      avgRestDaysBetweenSessions: this.calculateAvgRestDays(history),
      recentSleepAvg,
      recentRPEAvg,
      favoriteExercises: settings.favoriteExercises || [],
      exerciseFrequency,
      exercisePerformance,
    };
  }

  /**
   * Extract exercise features
   */
  extractExerciseFeatures(exerciseId: string): ExerciseFeatures {
    const { history, settings } = this.store;
    const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);

    if (!exercise) {
      throw new Error(`Exercise ${exerciseId} not found`);
    }

    const userLogs = history
      .filter(h => h.status === 'completed')
      .flatMap(h => h.logs)
      .filter(log => log.exerciseId === exerciseId);

    const userCompletionRate = userLogs.length > 0
      ? userLogs.reduce((sum, log) => {
          const completed = log.sets.filter(s => s.completed).length;
          return sum + completed / log.sets.length;
        }, 0) / userLogs.length
      : 0;

    const userRPEs = userLogs.flatMap(log =>
      log.sets.filter(s => s.rpe).map(s => s.rpe!)
    );
    const userAvgRPE = userRPEs.length > 0
      ? userRPEs.reduce((a, b) => a + b, 0) / userRPEs.length
      : 0;

    const lastPerformed = history
      .filter(h => h.status === 'completed')
      .find(h => h.logs.some(log => log.exerciseId === exerciseId));

    const daysSinceLastPerformed = lastPerformed
      ? Math.floor((Date.now() - lastPerformed.startTime) / (24 * 60 * 60 * 1000))
      : 999;

    const pr = settings.personalRecords[exerciseId];
    const personalBest1RM = pr?.bestWeight
      ? this.estimate1RM(pr.bestWeight.value, pr.bestWeight.reps || 1)
      : undefined;

    return {
      id: exercise.id,
      muscleGroup: exercise.muscleGroup,
      secondaryMuscles: exercise.secondaryMuscles || [],
      equipment: exercise.equipment,
      category: exercise.category,
      difficulty: exercise.difficulty,
      // Global stats (would come from cloud aggregation)
      popularityScore: this.getExercisePopularity(exerciseId),
      successRate: 0.85, // Placeholder - would be computed from cloud data
      avgSetsPerSession: 3,
      avgRepsPerSet: 10,
      // User-specific
      userCompletionRate,
      userAvgRPE,
      daysSinceLastPerformed,
      personalBest1RM,
    };
  }

  private calculateAvgRestDays(history: WorkoutSession[]): number {
    const completed = history
      .filter(h => h.status === 'completed')
      .sort((a, b) => b.startTime - a.startTime);

    if (completed.length < 2) return 1;

    const intervals = [];
    for (let i = 0; i < completed.length - 1; i++) {
      const days = (completed[i].startTime - completed[i + 1].startTime)
        / (24 * 60 * 60 * 1000);
      intervals.push(days);
    }

    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  private estimate1RM(weight: number, reps: number): number {
    // Epley formula
    return weight * (1 + reps / 30);
  }

  private getExercisePopularity(exerciseId: string): number {
    // In production, this would come from cloud aggregated data
    // For now, use a simple heuristic based on exercise category
    const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
    if (!exercise) return 0.5;

    const categoryScores: Record<ExerciseCategory, number> = {
      'Compound': 0.9,
      'Isolation': 0.6,
      'Cardio': 0.4,
      'Machine': 0.7,
      'Bodyweight': 0.8,
      'Plyometric': 0.5,
    };

    return categoryScores[exercise.category] || 0.5;
  }
}
```

### 1.3 Phase 1: Rule-Based Exercise Recommender

**Start simple with a hybrid scoring system that balances:**
1. Muscle group balance (prioritize undertrained muscles)
2. Recovery time (avoid recently trained exercises)
3. Equipment availability
4. User preferences (favorites, past performance)
5. Workout context (don't repeat muscle groups in same session)

```typescript
// /services/ml/exerciseRecommender.ts

interface ExerciseScore {
  exerciseId: string;
  score: number;
  reasons: string[];
}

export class ExerciseRecommender {
  private featureExtractor: FeatureExtractor;

  constructor(store: AppState) {
    this.featureExtractor = new FeatureExtractor(store);
  }

  /**
   * Recommend exercises for current workout session
   * Returns top N exercises sorted by relevance score
   */
  recommendExercises(
    context: SessionContext,
    count: number = 5
  ): ExerciseScore[] {
    const userFeatures = this.featureExtractor.extractUserFeatures();

    // Filter exercises by equipment availability
    const availableExercises = EXERCISE_LIBRARY.filter(ex =>
      userFeatures.availableEquipment.includes(ex.equipment)
    );

    const scores: ExerciseScore[] = availableExercises.map(exercise => {
      const features = this.featureExtractor.extractExerciseFeatures(exercise.id);
      const reasons: string[] = [];
      let score = 0;

      // 1. Muscle Balance Score (0-30 points)
      const muscleBalanceScore = this.calculateMuscleBalanceScore(
        exercise,
        userFeatures,
        context,
        reasons
      );
      score += muscleBalanceScore;

      // 2. Recovery Score (0-20 points)
      const recoveryScore = this.calculateRecoveryScore(
        features,
        reasons
      );
      score += recoveryScore;

      // 3. User Preference Score (0-20 points)
      const preferenceScore = this.calculatePreferenceScore(
        exercise,
        userFeatures,
        reasons
      );
      score += preferenceScore;

      // 4. Goal Alignment Score (0-15 points)
      const goalScore = this.calculateGoalAlignmentScore(
        exercise,
        userFeatures.goal,
        reasons
      );
      score += goalScore;

      // 5. Experience Level Fit (0-10 points)
      const experienceScore = this.calculateExperienceScore(
        exercise,
        userFeatures.experienceLevel,
        reasons
      );
      score += experienceScore;

      // 6. Variety/Novelty Score (0-5 points)
      const noveltyScore = this.calculateNoveltyScore(
        features,
        reasons
      );
      score += noveltyScore;

      return {
        exerciseId: exercise.id,
        score,
        reasons,
      };
    });

    // Sort by score descending and return top N
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  private calculateMuscleBalanceScore(
    exercise: Exercise,
    userFeatures: UserFeatures,
    context: SessionContext,
    reasons: string[]
  ): number {
    let score = 0;

    // Check if muscle group is undertrained
    const avgVolume = Object.values(userFeatures.muscleGroupVolume)
      .reduce((a, b) => a + b, 0) / 7; // average across muscle groups

    const muscleVolume = userFeatures.muscleGroupVolume[exercise.muscleGroup] || 0;

    if (muscleVolume < avgVolume * 0.7) {
      score += 15;
      reasons.push(`${exercise.muscleGroup} is undertrained (${Math.round(muscleVolume)} vs ${Math.round(avgVolume)} avg volume)`);
    } else if (muscleVolume < avgVolume) {
      score += 10;
    } else if (muscleVolume > avgVolume * 1.5) {
      score -= 10;
      reasons.push(`${exercise.muscleGroup} has high recent volume`);
    }

    // Penalize if muscle group already trained in this session
    if (context.muscleGroupsAlreadyTrained.includes(exercise.muscleGroup)) {
      score -= 15;
      reasons.push('Already trained this muscle group today');
    }

    // Bonus for secondary muscle engagement
    if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
      score += 5;
      reasons.push('Engages multiple muscle groups');
    }

    return Math.max(0, Math.min(30, score));
  }

  private calculateRecoveryScore(
    features: ExerciseFeatures,
    reasons: string[]
  ): number {
    let score = 0;
    const days = features.daysSinceLastPerformed;

    // Optimal recovery window depends on muscle group and intensity
    const optimalRecovery = this.getOptimalRecoveryDays(features.muscleGroup);

    if (days < optimalRecovery * 0.5) {
      // Too soon
      score = 0;
      reasons.push(`Insufficient recovery (${days} days, need ${optimalRecovery})`);
    } else if (days >= optimalRecovery && days <= optimalRecovery * 2) {
      // Perfect timing
      score = 20;
      reasons.push(`Optimal recovery window (${days} days)`);
    } else if (days > optimalRecovery * 2) {
      // Been a while, good to re-introduce
      score = 15;
      reasons.push(`Ready for re-introduction (${days} days since last)`);
    } else {
      // Slightly early but acceptable
      score = 10;
    }

    return score;
  }

  private calculatePreferenceScore(
    exercise: Exercise,
    userFeatures: UserFeatures,
    reasons: string[]
  ): number {
    let score = 0;

    // Check if it's a favorite
    if (userFeatures.favoriteExercises.includes(exercise.id)) {
      score += 10;
      reasons.push('Favorite exercise');
    }

    // Check historical performance
    const performance = userFeatures.exercisePerformance[exercise.id];
    if (performance !== undefined) {
      if (performance > 0.9) {
        score += 10;
        reasons.push('High completion rate');
      } else if (performance < 0.5) {
        score -= 5;
        reasons.push('Low historical completion rate');
      }
    }

    return Math.max(0, Math.min(20, score));
  }

  private calculateGoalAlignmentScore(
    exercise: Exercise,
    goal: ProgramGoal,
    reasons: string[]
  ): number {
    // Align exercise category with user goal
    const goalCategoryScores: Record<ProgramGoal, Record<ExerciseCategory, number>> = {
      'Strength': {
        'Compound': 15,
        'Isolation': 5,
        'Cardio': 0,
        'Machine': 5,
        'Bodyweight': 8,
        'Plyometric': 3,
      },
      'Hypertrophy': {
        'Compound': 12,
        'Isolation': 15,
        'Cardio': 2,
        'Machine': 12,
        'Bodyweight': 8,
        'Plyometric': 5,
      },
      'Powerlifting': {
        'Compound': 15,
        'Isolation': 5,
        'Cardio': 0,
        'Machine': 3,
        'Bodyweight': 5,
        'Plyometric': 2,
      },
      'Power-Building': {
        'Compound': 15,
        'Isolation': 10,
        'Cardio': 3,
        'Machine': 8,
        'Bodyweight': 8,
        'Plyometric': 10,
      },
      'General Fitness': {
        'Compound': 10,
        'Isolation': 8,
        'Cardio': 12,
        'Machine': 8,
        'Bodyweight': 12,
        'Plyometric': 8,
      },
    };

    const score = goalCategoryScores[goal][exercise.category];

    if (score >= 12) {
      reasons.push(`Excellent for ${goal} goals`);
    }

    return score;
  }

  private calculateExperienceScore(
    exercise: Exercise,
    experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced',
    reasons: string[]
  ): number {
    const levelMap = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
    const exerciseLevel = levelMap[exercise.difficulty];
    const userLevel = levelMap[experienceLevel];

    if (exerciseLevel === userLevel) {
      reasons.push('Perfect difficulty match');
      return 10;
    } else if (exerciseLevel === userLevel - 1) {
      // Slightly easier is OK
      return 8;
    } else if (exerciseLevel === userLevel + 1) {
      // Slightly harder is OK (progressive)
      reasons.push('Challenging but achievable');
      return 6;
    } else {
      // Too easy or too hard
      return 2;
    }
  }

  private calculateNoveltyScore(
    features: ExerciseFeatures,
    reasons: string[]
  ): number {
    // Introduce some variety
    const days = features.daysSinceLastPerformed;

    if (days > 60) {
      reasons.push('New/forgotten exercise - good for variety');
      return 5;
    } else if (days > 30) {
      return 3;
    }

    return 0;
  }

  private getOptimalRecoveryDays(muscleGroup: MuscleGroup): number {
    // Research-based recovery times
    const recoveryDays: Record<MuscleGroup, number> = {
      'Legs': 3,     // Larger muscles need more recovery
      'Back': 2,
      'Chest': 2,
      'Shoulders': 2,
      'Arms': 1.5,
      'Core': 1,
      'Cardio': 1,
    };

    return recoveryDays[muscleGroup] || 2;
  }
}
```

### 1.4 Phase 2: Hybrid ML Exercise Recommender

**Use lightweight collaborative filtering + learned user preferences**

```typescript
// /services/ml/collaborativeFilter.ts

/**
 * Lightweight collaborative filtering using matrix factorization
 * Learns user preferences from workout patterns
 * Model size: ~500KB, Inference: <50ms
 */
export class CollaborativeExerciseFilter {
  private userEmbeddings: Map<string, Float32Array>; // userId -> vector
  private exerciseEmbeddings: Map<string, Float32Array>; // exerciseId -> vector
  private embeddingDim = 32; // Small embedding size for speed

  constructor() {
    this.userEmbeddings = new Map();
    this.exerciseEmbeddings = new Map();
  }

  /**
   * Train embeddings from workout history
   * Uses Alternating Least Squares (ALS) - can run in browser
   */
  async train(interactions: UserExerciseInteraction[]) {
    // Interactions: { userId, exerciseId, rating, timestamp }
    // Rating = completion_rate * (1 + rpe_adjustment)

    // Initialize random embeddings
    const userIds = [...new Set(interactions.map(i => i.userId))];
    const exerciseIds = [...new Set(interactions.map(i => i.exerciseId))];

    userIds.forEach(id => {
      this.userEmbeddings.set(id, this.randomEmbedding());
    });

    exerciseIds.forEach(id => {
      this.exerciseEmbeddings.set(id, this.randomEmbedding());
    });

    // Run ALS iterations (simplified)
    const iterations = 10;
    for (let iter = 0; iter < iterations; iter++) {
      // Update user embeddings
      for (const userId of userIds) {
        this.updateUserEmbedding(userId, interactions);
      }

      // Update exercise embeddings
      for (const exerciseId of exerciseIds) {
        this.updateExerciseEmbedding(exerciseId, interactions);
      }
    }
  }

  /**
   * Predict user-exercise affinity score
   */
  predict(userId: string, exerciseId: string): number {
    const userEmb = this.userEmbeddings.get(userId);
    const exerciseEmb = this.exerciseEmbeddings.get(exerciseId);

    if (!userEmb || !exerciseEmb) return 0.5; // Default

    // Dot product
    let score = 0;
    for (let i = 0; i < this.embeddingDim; i++) {
      score += userEmb[i] * exerciseEmb[i];
    }

    // Sigmoid to [0, 1]
    return 1 / (1 + Math.exp(-score));
  }

  /**
   * Export model to IndexedDB for offline use
   */
  async save() {
    const model = {
      userEmbeddings: Array.from(this.userEmbeddings.entries()),
      exerciseEmbeddings: Array.from(this.exerciseEmbeddings.entries()),
      embeddingDim: this.embeddingDim,
    };

    // Save to IndexedDB
    const db = await this.openDB();
    const tx = db.transaction('models', 'readwrite');
    await tx.objectStore('models').put(model, 'collaborative-filter');
  }

  private randomEmbedding(): Float32Array {
    const arr = new Float32Array(this.embeddingDim);
    for (let i = 0; i < this.embeddingDim; i++) {
      arr[i] = (Math.random() - 0.5) * 0.1;
    }
    return arr;
  }

  private updateUserEmbedding(userId: string, interactions: UserExerciseInteraction[]) {
    // Simplified ALS update
    // In production, use proper least squares solver
    const userInteractions = interactions.filter(i => i.userId === userId);
    // ... (simplified for brevity)
  }

  private updateExerciseEmbedding(exerciseId: string, interactions: UserExerciseInteraction[]) {
    // ... (simplified for brevity)
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('voltlift-ml', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models');
        }
      };
    });
  }
}
```

---

## 2. Program Recommendation System

### 2.1 Feature Engineering

```typescript
interface ProgramFeatures {
  id: string;
  goal: ProgramGoal;
  splitType: ProgramSplitType;
  difficulty: ProgramDifficulty;
  frequency: number;
  weeks: number;

  // Computed features
  avgSessionDuration: number; // estimated minutes
  totalVolumeLandmarks: number; // total sets across program
  compoundExerciseRatio: number; // % of compound exercises

  // User compatibility score (computed)
  equipmentMatch: number; // % of exercises user has equipment for
  goalAlignment: number; // 0-1 score
  experienceMatch: number; // 0-1 score
}

interface ProgramRecommendationContext {
  availableDaysPerWeek: number;
  maxSessionDuration: number; // minutes
  hasCompletedPrograms: string[]; // program IDs
  currentStrengthLevel: number; // 0-100 overall score
}
```

### 2.2 Phase 1: Rule-Based Program Recommender

```typescript
// /services/ml/programRecommender.ts

export class ProgramRecommender {
  private featureExtractor: FeatureExtractor;

  constructor(store: AppState) {
    this.featureExtractor = new FeatureExtractor(store);
  }

  /**
   * Recommend programs based on user profile
   */
  recommendPrograms(
    context: ProgramRecommendationContext,
    count: number = 3
  ): Array<{ program: Program; score: number; reasons: string[] }> {
    const userFeatures = this.featureExtractor.extractUserFeatures();

    const scores = INITIAL_PROGRAMS.map(program => {
      const reasons: string[] = [];
      let score = 0;

      // 1. Goal Alignment (0-30 points)
      if (program.goal === userFeatures.goal) {
        score += 30;
        reasons.push(`Perfect match for ${userFeatures.goal} goal`);
      } else if (this.areGoalsCompatible(program.goal, userFeatures.goal)) {
        score += 20;
        reasons.push(`Compatible with ${userFeatures.goal} goal`);
      }

      // 2. Experience Level Match (0-25 points)
      if (program.difficulty === userFeatures.experienceLevel) {
        score += 25;
        reasons.push('Perfect difficulty match');
      } else if (this.isExperienceLevelSuitable(program.difficulty, userFeatures.experienceLevel)) {
        score += 15;
        reasons.push('Suitable difficulty');
      } else {
        score += 5;
        reasons.push('Difficulty mismatch - consider alternatives');
      }

      // 3. Frequency Match (0-20 points)
      const supportedFreqs = program.supportedFrequencies || [program.frequency];
      if (supportedFreqs.includes(context.availableDaysPerWeek)) {
        score += 20;
        reasons.push(`Perfect for ${context.availableDaysPerWeek} days/week`);
      } else {
        const closestFreq = this.findClosestFrequency(supportedFreqs, context.availableDaysPerWeek);
        const diff = Math.abs(closestFreq - context.availableDaysPerWeek);
        score += Math.max(0, 20 - diff * 5);
        reasons.push(`Best fit: ${closestFreq} days/week (you have ${context.availableDaysPerWeek})`);
      }

      // 4. Equipment Availability (0-15 points)
      const equipmentScore = this.calculateEquipmentMatch(program, userFeatures);
      score += equipmentScore;
      if (equipmentScore >= 13) {
        reasons.push('All exercises available with your equipment');
      } else if (equipmentScore < 8) {
        reasons.push('Limited equipment match - some substitutions needed');
      }

      // 5. Novelty/Progression (0-10 points)
      if (context.hasCompletedPrograms.includes(program.id)) {
        score += 2;
        reasons.push('Previously completed - good for repeat cycles');
      } else {
        score += 10;
        reasons.push('New program - fresh stimulus');
      }

      return {
        program,
        score,
        reasons,
      };
    });

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  private areGoalsCompatible(programGoal: ProgramGoal, userGoal: ProgramGoal): boolean {
    const compatibilityMap: Record<ProgramGoal, ProgramGoal[]> = {
      'Strength': ['Powerlifting', 'Power-Building'],
      'Hypertrophy': ['Power-Building', 'General Fitness'],
      'Powerlifting': ['Strength'],
      'Power-Building': ['Strength', 'Hypertrophy'],
      'General Fitness': ['Hypertrophy'],
    };

    return compatibilityMap[userGoal]?.includes(programGoal) || false;
  }

  private isExperienceLevelSuitable(
    programDifficulty: ProgramDifficulty,
    userLevel: 'Beginner' | 'Intermediate' | 'Advanced'
  ): boolean {
    const levelMap = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
    const diff = Math.abs(levelMap[programDifficulty] - levelMap[userLevel]);
    return diff <= 1; // Allow 1 level difference
  }

  private findClosestFrequency(frequencies: number[], target: number): number {
    return frequencies.reduce((closest, freq) =>
      Math.abs(freq - target) < Math.abs(closest - target) ? freq : closest
    );
  }

  private calculateEquipmentMatch(program: Program, userFeatures: UserFeatures): number {
    // Get all exercises in program
    const templateIds = [...new Set(program.sessions.map(s => s.templateId))];
    const templates = INITIAL_TEMPLATES.filter(t => templateIds.includes(t.id));

    const allExerciseIds = templates.flatMap(t => t.logs.map(l => l.exerciseId));
    const uniqueExercises = [...new Set(allExerciseIds)];

    let matchCount = 0;
    uniqueExercises.forEach(exId => {
      const exercise = EXERCISE_LIBRARY.find(e => e.id === exId);
      if (exercise && userFeatures.availableEquipment.includes(exercise.equipment)) {
        matchCount++;
      }
    });

    const matchRatio = matchCount / uniqueExercises.length;
    return Math.round(matchRatio * 15);
  }
}
```

---

## 3. Progressive Overload Suggestion System

**This is the most critical for user retention - must be accurate and adaptive**

### 3.1 Feature Engineering

```typescript
interface ProgressionFeatures {
  exerciseId: string;

  // Historical Performance (last 4-6 sessions for this exercise)
  recentWeights: number[];
  recentReps: number[][];
  recentRPEs: number[][];
  recentVolume: number[]; // weight × total reps per session

  // Trend Analysis
  weightTrend: 'increasing' | 'stable' | 'decreasing';
  volumeTrend: 'increasing' | 'stable' | 'decreasing';
  rpeTrend: 'increasing' | 'stable' | 'decreasing';

  // Recovery Indicators
  daysSinceLastSession: number;
  avgRPELastSession: number;
  sleepQuality: number; // from DailyLog

  // User State
  fatigueLevel: 'Fresh' | 'Optimal' | 'High Fatigue';
  totalWeeklyVolume: number;
  consecutiveWorkoutDays: number;

  // Exercise Characteristics
  exerciseCategory: ExerciseCategory;
  muscleGroup: MuscleGroup;
  userExperienceWithExercise: 'novice' | 'intermediate' | 'advanced';
}

interface ProgressionSuggestion {
  weight: number;
  reps: [number, number]; // range, e.g., [8, 10]
  sets: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  alternativeStrategies?: {
    deload?: { weight: number; reps: number; reason: string };
    maintain?: { weight: number; reps: number; reason: string };
    push?: { weight: number; reps: number; reason: string };
  };
}
```

### 3.2 Phase 1: Heuristic-Based Progressive Overload

**Already partially implemented in `/services/progressiveOverload.ts` - enhance with ML**

Current approach uses:
- Last session data
- Sleep/recovery signals
- RPE trends
- Volume landmarks

**Improvements:**

```typescript
// /services/ml/progressiveOverloadML.ts

export class ProgressiveOverloadML {
  private featureExtractor: FeatureExtractor;
  private regressionModel: LightGBM | null = null; // Lightweight gradient boosting

  constructor(store: AppState) {
    this.featureExtractor = new FeatureExtractor(store);
  }

  /**
   * Generate progression suggestion using ML + heuristics
   */
  suggestProgression(
    exerciseId: string,
    currentSetIndex: number
  ): ProgressionSuggestion {
    const features = this.extractProgressionFeatures(exerciseId);

    // Phase 1: Use heuristics if ML model not trained yet
    if (!this.regressionModel || features.recentWeights.length < 3) {
      return this.heuristicProgression(features, currentSetIndex);
    }

    // Phase 2: Hybrid approach - ML prediction + heuristic constraints
    const mlPrediction = this.mlProgression(features, currentSetIndex);
    const heuristicBounds = this.heuristicProgression(features, currentSetIndex);

    // Blend predictions (weighted by confidence)
    return this.blendSuggestions(mlPrediction, heuristicBounds, features);
  }

  private extractProgressionFeatures(exerciseId: string): ProgressionFeatures {
    const store = this.featureExtractor['store'];
    const { history, dailyLogs } = store;

    // Get last 6 sessions with this exercise
    const recentSessions = history
      .filter(h => h.status === 'completed')
      .filter(h => h.logs.some(log => log.exerciseId === exerciseId))
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 6);

    const recentWeights: number[] = [];
    const recentReps: number[][] = [];
    const recentRPEs: number[][] = [];
    const recentVolume: number[] = [];

    recentSessions.forEach(session => {
      const log = session.logs.find(l => l.exerciseId === exerciseId);
      if (!log) return;

      const validSets = log.sets.filter(s => s.completed && s.type !== 'W');
      if (validSets.length === 0) return;

      const maxWeight = Math.max(...validSets.map(s => s.weight));
      recentWeights.push(maxWeight);

      recentReps.push(validSets.map(s => s.reps));
      recentRPEs.push(validSets.map(s => s.rpe || 7));

      const volume = validSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      recentVolume.push(volume);
    });

    // Trend analysis
    const weightTrend = this.analyzeTrend(recentWeights);
    const volumeTrend = this.analyzeTrend(recentVolume);
    const avgRPEs = recentRPEs.map(session =>
      session.reduce((a, b) => a + b, 0) / session.length
    );
    const rpeTrend = this.analyzeTrend(avgRPEs);

    // Recovery indicators
    const lastSession = recentSessions[0];
    const daysSinceLastSession = lastSession
      ? Math.floor((Date.now() - lastSession.startTime) / (24 * 60 * 60 * 1000))
      : 7;

    const lastLog = lastSession?.logs.find(l => l.exerciseId === exerciseId);
    const avgRPELastSession = lastLog
      ? lastLog.sets.reduce((sum, s) => sum + (s.rpe || 7), 0) / lastLog.sets.length
      : 7;

    const today = new Date().toISOString().split('T')[0];
    const todayLog = dailyLogs[today];
    const sleepQuality = todayLog?.sleepHours || 7;

    // User state
    const fatigueStatus = store.getFatigueStatus();

    const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);

    // Determine user experience with this exercise
    let userExperienceWithExercise: 'novice' | 'intermediate' | 'advanced' = 'novice';
    if (recentSessions.length >= 10) {
      userExperienceWithExercise = 'advanced';
    } else if (recentSessions.length >= 4) {
      userExperienceWithExercise = 'intermediate';
    }

    return {
      exerciseId,
      recentWeights,
      recentReps,
      recentRPEs,
      recentVolume,
      weightTrend,
      volumeTrend,
      rpeTrend,
      daysSinceLastSession,
      avgRPELastSession,
      sleepQuality,
      fatigueLevel: fatigueStatus.status,
      totalWeeklyVolume: this.calculateWeeklyVolume(history),
      consecutiveWorkoutDays: this.calculateConsecutiveWorkoutDays(history),
      exerciseCategory: exercise?.category || 'Compound',
      muscleGroup: exercise?.muscleGroup || 'Chest',
      userExperienceWithExercise,
    };
  }

  private heuristicProgression(
    features: ProgressionFeatures,
    setIndex: number
  ): ProgressionSuggestion {
    const lastWeight = features.recentWeights[0] || 0;
    const lastReps = features.recentReps[0] || [];
    const avgLastReps = lastReps.length > 0
      ? lastReps.reduce((a, b) => a + b, 0) / lastReps.length
      : 10;

    let weight = lastWeight;
    let reps: [number, number] = [8, 10];
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let reasoning = '';

    // Rule 1: If RPE was low (< 7) and all sets hit target reps, increase weight
    if (features.avgRPELastSession < 7 && avgLastReps >= 10) {
      weight = lastWeight + this.getWeightIncrement(features.exerciseCategory);
      reps = [8, 10];
      confidence = 'high';
      reasoning = 'Last session was easy (RPE < 7). Progressive overload: +weight, maintain reps.';
    }
    // Rule 2: If RPE was high (> 8.5), reduce weight or maintain
    else if (features.avgRPELastSession > 8.5 || features.fatigueLevel === 'High Fatigue') {
      weight = lastWeight * 0.9; // 10% deload
      reps = [8, 10];
      confidence = 'high';
      reasoning = 'High fatigue or RPE. Deload to recover.';
    }
    // Rule 3: If progressing well, small increment
    else if (features.weightTrend === 'increasing' && features.rpeTrend !== 'increasing') {
      weight = lastWeight + this.getWeightIncrement(features.exerciseCategory) * 0.5;
      reps = [8, 10];
      confidence = 'medium';
      reasoning = 'Steady progress. Small weight increase.';
    }
    // Rule 4: If stalled, try volume progression (more reps)
    else if (features.weightTrend === 'stable') {
      weight = lastWeight;
      reps = [10, 12];
      confidence = 'medium';
      reasoning = 'Weight plateau. Increase volume (more reps) before adding weight.';
    }
    // Default: maintain
    else {
      weight = lastWeight;
      reps = [8, 10];
      confidence = 'low';
      reasoning = 'Maintain current weight and reps.';
    }

    return {
      weight: Math.round(weight / 2.5) * 2.5, // Round to nearest 2.5
      reps,
      sets: 3,
      confidence,
      reasoning,
    };
  }

  private mlProgression(
    features: ProgressionFeatures,
    setIndex: number
  ): ProgressionSuggestion {
    // TODO: Implement ML model prediction
    // For now, return heuristic
    return this.heuristicProgression(features, setIndex);
  }

  private blendSuggestions(
    ml: ProgressionSuggestion,
    heuristic: ProgressionSuggestion,
    features: ProgressionFeatures
  ): ProgressionSuggestion {
    // Weighted blend based on data availability and confidence
    const mlWeight = features.recentWeights.length >= 6 ? 0.7 : 0.3;
    const heuristicWeight = 1 - mlWeight;

    const blendedWeight = ml.weight * mlWeight + heuristic.weight * heuristicWeight;

    return {
      weight: Math.round(blendedWeight / 2.5) * 2.5,
      reps: ml.reps, // Use ML rep range
      sets: 3,
      confidence: ml.confidence,
      reasoning: `ML (${Math.round(mlWeight * 100)}%): ${ml.reasoning}. Heuristic: ${heuristic.reasoning}`,
    };
  }

  private analyzeTrend(values: number[]): 'increasing' | 'stable' | 'decreasing' {
    if (values.length < 2) return 'stable';

    // Simple linear regression slope
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += (i - xMean) ** 2;
    }

    const slope = numerator / denominator;

    // Threshold for "stable" depends on magnitude
    const threshold = yMean * 0.05; // 5% change

    if (slope > threshold) return 'increasing';
    if (slope < -threshold) return 'decreasing';
    return 'stable';
  }

  private getWeightIncrement(category: ExerciseCategory): number {
    // Progressive overload increments vary by exercise type
    const increments: Record<ExerciseCategory, number> = {
      'Compound': 5, // 5 lbs for squats, bench, etc.
      'Isolation': 2.5, // 2.5 lbs for curls, etc.
      'Cardio': 0,
      'Machine': 5,
      'Bodyweight': 0, // Add reps instead
      'Plyometric': 0,
    };

    return increments[category] || 5;
  }

  private calculateWeeklyVolume(history: WorkoutSession[]): number {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = history.filter(
      h => h.status === 'completed' && h.startTime > oneWeekAgo
    );

    let totalVolume = 0;
    recentSessions.forEach(session => {
      session.logs.forEach(log => {
        log.sets.forEach(set => {
          if (set.completed && set.type !== 'W') {
            totalVolume += set.weight * set.reps;
          }
        });
      });
    });

    return totalVolume;
  }

  private calculateConsecutiveWorkoutDays(history: WorkoutSession[]): number {
    const completed = history
      .filter(h => h.status === 'completed')
      .sort((a, b) => b.startTime - a.startTime);

    if (completed.length === 0) return 0;

    let consecutive = 1;
    for (let i = 0; i < completed.length - 1; i++) {
      const daysDiff = (completed[i].startTime - completed[i + 1].startTime)
        / (24 * 60 * 60 * 1000);

      if (daysDiff <= 1.5) { // Within ~1 day
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }

  /**
   * Train ML model from user feedback
   * Collect data: { features, suggestedWeight, actualWeight, accepted }
   */
  async trainFromFeedback(feedbackData: SuggestionFeedback[]) {
    // TODO: Implement online learning
    // Use lightweight gradient boosting (LightGBM WASM or custom impl)
    // Target: predict optimal weight/reps for next session
    // Features: all ProgressionFeatures
    // Label: actualWeight that user successfully completed with RPE 7-8
  }
}
```

### 3.3 Phase 2: Reinforcement Learning for Adaptive Progression

**Goal: Learn user-specific progression patterns**

```typescript
// /services/ml/adaptiveProgressionRL.ts

/**
 * Use contextual bandits (simpler than full RL)
 * Each "arm" is a progression strategy:
 * - Increase weight 5lbs, maintain reps
 * - Increase weight 2.5lbs, maintain reps
 * - Maintain weight, increase reps
 * - Deload 10%
 * - Maintain
 *
 * Reward: +1 if user completes all sets with RPE 7-8
 *         +0.5 if completes with RPE < 7 or > 8
 *         -1 if fails sets or user manually changes
 */

interface ProgressionArm {
  id: string;
  strategy: (current: { weight: number; reps: number }) => { weight: number; reps: number };
  description: string;
}

export class AdaptiveProgressionBandit {
  private arms: ProgressionArm[] = [
    {
      id: 'increase_5lb',
      strategy: (curr) => ({ weight: curr.weight + 5, reps: curr.reps }),
      description: '+5 lbs',
    },
    {
      id: 'increase_2.5lb',
      strategy: (curr) => ({ weight: curr.weight + 2.5, reps: curr.reps }),
      description: '+2.5 lbs',
    },
    {
      id: 'volume_up',
      strategy: (curr) => ({ weight: curr.weight, reps: curr.reps + 2 }),
      description: '+2 reps',
    },
    {
      id: 'maintain',
      strategy: (curr) => ({ weight: curr.weight, reps: curr.reps }),
      description: 'Maintain',
    },
    {
      id: 'deload',
      strategy: (curr) => ({ weight: curr.weight * 0.9, reps: curr.reps }),
      description: '-10% deload',
    },
  ];

  private armRewards: Map<string, { total: number; count: number }> = new Map();
  private epsilon = 0.1; // Exploration rate

  /**
   * Select best progression strategy using epsilon-greedy
   */
  selectStrategy(
    exerciseId: string,
    current: { weight: number; reps: number },
    features: ProgressionFeatures
  ): { weight: number; reps: number; strategyId: string } {
    // Context-aware arm selection
    const contextKey = this.getContextKey(exerciseId, features);

    // Epsilon-greedy: explore vs exploit
    const explore = Math.random() < this.epsilon;

    let selectedArm: ProgressionArm;

    if (explore) {
      // Random exploration
      selectedArm = this.arms[Math.floor(Math.random() * this.arms.length)];
    } else {
      // Exploit best arm
      selectedArm = this.getBestArm(contextKey);
    }

    const result = selectedArm.strategy(current);

    return {
      ...result,
      strategyId: selectedArm.id,
    };
  }

  /**
   * Update arm rewards based on user outcome
   */
  updateReward(
    strategyId: string,
    exerciseId: string,
    features: ProgressionFeatures,
    reward: number
  ) {
    const contextKey = `${this.getContextKey(exerciseId, features)}_${strategyId}`;

    const current = this.armRewards.get(contextKey) || { total: 0, count: 0 };

    this.armRewards.set(contextKey, {
      total: current.total + reward,
      count: current.count + 1,
    });

    // Persist to IndexedDB
    this.saveModel();
  }

  private getContextKey(exerciseId: string, features: ProgressionFeatures): string {
    // Discretize features into context buckets
    const fatigueKey = features.fatigueLevel;
    const trendKey = features.weightTrend;
    const experienceKey = features.userExperienceWithExercise;

    return `${exerciseId}_${fatigueKey}_${trendKey}_${experienceKey}`;
  }

  private getBestArm(contextKey: string): ProgressionArm {
    let bestArm = this.arms[0];
    let bestScore = -Infinity;

    this.arms.forEach(arm => {
      const key = `${contextKey}_${arm.id}`;
      const reward = this.armRewards.get(key);

      if (reward && reward.count > 0) {
        const avgReward = reward.total / reward.count;
        if (avgReward > bestScore) {
          bestScore = avgReward;
          bestArm = arm;
        }
      }
    });

    return bestArm;
  }

  private async saveModel() {
    // Save to IndexedDB for persistence
    const db = await this.openDB();
    const tx = db.transaction('models', 'readwrite');
    await tx.objectStore('models').put(
      Array.from(this.armRewards.entries()),
      'progression-bandit'
    );
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('voltlift-ml', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models');
        }
      };
    });
  }
}
```

---

## 4. Model Serving Strategy

### 4.1 Client-Side Inference (Offline-First)

**Tech Stack:**
- **TensorFlow.js** - For neural networks (if needed in Phase 3)
- **ONNX Runtime Web** - For lightweight models trained server-side
- **Custom JS/TS** - For rule-based and simple ML (Phase 1-2)

**Model Storage:**
- **IndexedDB** - Store model weights, embeddings, config
- **localStorage** - Store feature cache (last computed features)

**Performance Targets:**
- Model load time: < 500ms on first load, < 50ms from cache
- Inference time: < 100ms for recommendations
- Total model size: < 5MB for all models combined

### 4.2 Model Registry

```typescript
// /services/ml/modelRegistry.ts

export interface ModelMetadata {
  id: string;
  version: string;
  type: 'rule-based' | 'collaborative-filter' | 'gradient-boosting' | 'neural-net';
  modelPath?: string; // IndexedDB key or URL
  size: number; // bytes
  createdAt: number;
  accuracy?: number; // validation metric
  isActive: boolean;
}

export class ModelRegistry {
  private db: IDBDatabase | null = null;
  private activeModels: Map<string, any> = new Map();

  async init() {
    this.db = await this.openDB();
    await this.loadActiveModels();
  }

  /**
   * Register a new model version
   */
  async registerModel(metadata: ModelMetadata, modelData: any) {
    if (!this.db) await this.init();

    const tx = this.db!.transaction(['models', 'metadata'], 'readwrite');

    // Store model data
    await tx.objectStore('models').put(modelData, metadata.id);

    // Store metadata
    await tx.objectStore('metadata').put(metadata, metadata.id);

    await tx.done;
  }

  /**
   * Load model for inference
   */
  async loadModel(modelId: string): Promise<any> {
    if (this.activeModels.has(modelId)) {
      return this.activeModels.get(modelId);
    }

    if (!this.db) await this.init();

    const tx = this.db!.transaction('models', 'readonly');
    const modelData = await tx.objectStore('models').get(modelId);

    if (modelData) {
      this.activeModels.set(modelId, modelData);
      return modelData;
    }

    return null;
  }

  /**
   * Get all model metadata for UI display
   */
  async listModels(): Promise<ModelMetadata[]> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async loadActiveModels() {
    const models = await this.listModels();
    const active = models.filter(m => m.isActive);

    for (const model of active) {
      await this.loadModel(model.id);
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('voltlift-ml', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models');
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      };
    });
  }
}
```

### 4.3 Recommendation Service API

**Single unified API for all recommendations:**

```typescript
// /services/ml/recommendationService.ts

export class RecommendationService {
  private exerciseRecommender: ExerciseRecommender;
  private programRecommender: ProgramRecommender;
  private progressionML: ProgressiveOverloadML;
  private modelRegistry: ModelRegistry;

  constructor(store: AppState) {
    this.exerciseRecommender = new ExerciseRecommender(store);
    this.programRecommender = new ProgramRecommender(store);
    this.progressionML = new ProgressiveOverloadML(store);
    this.modelRegistry = new ModelRegistry();
  }

  async init() {
    await this.modelRegistry.init();
  }

  /**
   * Get exercise recommendations for current workout
   */
  async getExerciseRecommendations(
    context: SessionContext,
    count: number = 5
  ): Promise<ExerciseScore[]> {
    const start = performance.now();

    const recommendations = this.exerciseRecommender.recommendExercises(context, count);

    const latency = performance.now() - start;
    console.log(`Exercise recommendations: ${latency.toFixed(2)}ms`);

    return recommendations;
  }

  /**
   * Get program recommendations
   */
  async getProgramRecommendations(
    context: ProgramRecommendationContext,
    count: number = 3
  ): Promise<Array<{ program: Program; score: number; reasons: string[] }>> {
    const start = performance.now();

    const recommendations = this.programRecommender.recommendPrograms(context, count);

    const latency = performance.now() - start;
    console.log(`Program recommendations: ${latency.toFixed(2)}ms`);

    return recommendations;
  }

  /**
   * Get progressive overload suggestion
   */
  async getProgressionSuggestion(
    exerciseId: string,
    setIndex: number
  ): Promise<ProgressionSuggestion> {
    const start = performance.now();

    const suggestion = this.progressionML.suggestProgression(exerciseId, setIndex);

    const latency = performance.now() - start;
    console.log(`Progression suggestion: ${latency.toFixed(2)}ms`);

    return suggestion;
  }

  /**
   * Record user feedback for model improvement
   */
  async recordFeedback(feedback: SuggestionFeedback) {
    // Store in Zustand (already in UserSettings.suggestionHistory)
    // Periodically batch and train models
    await this.progressionML.trainFromFeedback([feedback]);
  }
}
```

---

## 5. Cold Start Handling

**Problem: New users have no history, so ML models can't make personalized recommendations**

### 5.1 Strategies

**1. Content-Based Filtering (no history needed):**
```typescript
// Use exercise metadata + user onboarding data
// Recommend based on:
// - User goal (Strength → Compound exercises)
// - Experience level (Beginner → easier exercises)
// - Equipment availability

// Example:
const coldStartRecommendations = EXERCISE_LIBRARY
  .filter(ex =>
    settings.availableEquipment.includes(ex.equipment) &&
    ex.difficulty === settings.experienceLevel
  )
  .sort((a, b) => {
    // Prioritize compounds for strength goals
    if (settings.goal.type === 'Strength') {
      return (b.category === 'Compound' ? 1 : 0) - (a.category === 'Compound' ? 1 : 0);
    }
    return 0;
  });
```

**2. Popular Baseline:**
```typescript
// Show most popular exercises globally (from cloud aggregated data)
// or from curated "starter" templates

const starterTemplates = [
  {
    name: 'Full Body Beginner',
    exercises: ['Barbell Squat', 'Bench Press', 'Deadlift', 'Pull Up', 'Shoulder Press'],
  },
  {
    name: 'Upper/Lower Split',
    exercises: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Pull Ups'],
  },
];
```

**3. Guided Onboarding:**
```typescript
// During onboarding, ask user to complete a "baseline workout"
// Record performance (weight, reps, RPE) for 5-10 key exercises
// Use this to seed initial recommendations

interface BaselineAssessment {
  exerciseId: string;
  maxWeight: number;
  reps: number;
  rpe: number;
}

// This gives us enough data to make reasonable first suggestions
```

**4. Transfer Learning from Similar Users:**
```typescript
// If cloud sync is enabled, use collaborative filtering
// Find similar users based on:
// - Same goal
// - Same experience level
// - Same equipment
// Use their workout patterns as initial seed
```

### 5.2 Implementation

```typescript
// /services/ml/coldStartHandler.ts

export class ColdStartHandler {
  /**
   * Detect if user is in cold start state
   */
  isColdStart(store: AppState): boolean {
    const { history, settings } = store;
    const completedWorkouts = history.filter(h => h.status === 'completed').length;

    // Cold start if < 3 completed workouts
    return completedWorkouts < 3;
  }

  /**
   * Get cold start recommendations
   */
  getColdStartExercises(
    settings: UserSettings,
    count: number = 10
  ): Exercise[] {
    // Filter by equipment
    let candidates = EXERCISE_LIBRARY.filter(ex =>
      settings.availableEquipment.includes(ex.equipment)
    );

    // Filter by difficulty
    candidates = candidates.filter(ex => {
      if (settings.experienceLevel === 'Beginner') {
        return ex.difficulty === 'Beginner' || ex.difficulty === 'Intermediate';
      } else if (settings.experienceLevel === 'Intermediate') {
        return ex.difficulty !== 'Beginner'; // Exclude too-easy
      } else {
        return true; // Advanced can do anything
      }
    });

    // Score by goal alignment
    const scored = candidates.map(ex => {
      let score = 0;

      // Goal-based scoring
      if (settings.goal.type === 'Strength' || settings.goal.type === 'Powerlifting') {
        if (ex.category === 'Compound') score += 20;
      } else if (settings.goal.type === 'Hypertrophy') {
        if (ex.category === 'Isolation') score += 15;
        if (ex.category === 'Compound') score += 10;
      }

      // Muscle group diversity
      // (In real implementation, would balance across muscle groups)

      return { exercise: ex, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.exercise);
  }

  /**
   * Suggest starter programs for new users
   */
  getColdStartPrograms(settings: UserSettings): Program[] {
    return INITIAL_PROGRAMS.filter(program => {
      // Match goal
      const goalMatch = program.goal === settings.goal.type;

      // Match experience
      const experienceMatch = program.difficulty === settings.experienceLevel;

      return goalMatch && experienceMatch;
    });
  }
}
```

---

## 6. Evaluation Metrics

### 6.1 Exercise Recommendation Metrics

**Offline Metrics (computed from historical data):**
- **Precision@K**: Of top K recommended exercises, how many did user actually perform?
- **Recall@K**: Of exercises user performed, how many were in top K recommendations?
- **NDCG@K**: Normalized Discounted Cumulative Gain (accounts for ranking)

**Online Metrics (A/B testing):**
- **Click-Through Rate (CTR)**: % of recommended exercises that user added to workout
- **Completion Rate**: % of recommended exercises that user completed all sets
- **Average RPE**: Lower RPE on recommended exercises = better personalization
- **User Retention**: Users who follow recommendations stay longer

**Implementation:**
```typescript
// /services/ml/metrics.ts

export class RecommendationMetrics {
  /**
   * Calculate precision@k for exercise recommendations
   */
  calculatePrecisionAtK(
    recommendations: string[],
    actualExercises: string[],
    k: number
  ): number {
    const topK = recommendations.slice(0, k);
    const relevant = topK.filter(recId => actualExercises.includes(recId));
    return relevant.length / k;
  }

  /**
   * Calculate recall@k
   */
  calculateRecallAtK(
    recommendations: string[],
    actualExercises: string[],
    k: number
  ): number {
    const topK = recommendations.slice(0, k);
    const relevant = topK.filter(recId => actualExercises.includes(recId));
    return relevant.length / actualExercises.length;
  }

  /**
   * Calculate NDCG@k
   */
  calculateNDCG(
    recommendations: string[],
    actualExercises: string[],
    k: number
  ): number {
    // Ideal ranking: all actual exercises at top
    const dcg = recommendations.slice(0, k).reduce((sum, recId, idx) => {
      const relevance = actualExercises.includes(recId) ? 1 : 0;
      return sum + relevance / Math.log2(idx + 2);
    }, 0);

    const idealDCG = actualExercises.slice(0, k).reduce((sum, _, idx) => {
      return sum + 1 / Math.log2(idx + 2);
    }, 0);

    return idealDCG > 0 ? dcg / idealDCG : 0;
  }
}
```

### 6.2 Progressive Overload Metrics

**Success Criteria:**
- **Accuracy**: Does suggestion match what user would successfully complete at RPE 7-8?
- **Acceptance Rate**: % of suggestions user accepts without modification
- **Performance**: Did user hit all sets with suggested weight/reps?
- **Safety**: Avoid injuries (detect when suggestions are too aggressive)

**Key Metrics:**
```typescript
interface ProgressionMetrics {
  // Accuracy
  weightAccuracy: number; // % within 5 lbs of ideal
  repsAccuracy: number; // % within 1 rep of ideal

  // User Behavior
  acceptanceRate: number; // % of suggestions accepted
  modificationRate: number; // % of suggestions user tweaked

  // Safety
  failureRate: number; // % of sets failed (weight too high)
  overreachRate: number; // % of sessions with avg RPE > 9

  // Long-term Success
  progressionRate: number; // Average weight increase per month
  retentionRate: number; // % of users still using app after 3 months
}
```

### 6.3 A/B Testing Framework

**Test progressive overload algorithms:**

```typescript
// /services/ml/abTesting.ts

export class ABTestingService {
  private userId: string;
  private variantAssignments: Map<string, string> = new Map();

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Assign user to A/B test variant
   */
  assignVariant(experimentId: string, variants: string[]): string {
    // Deterministic assignment based on userId hash
    const hash = this.hashUserId(this.userId, experimentId);
    const variantIndex = hash % variants.length;
    const variant = variants[variantIndex];

    this.variantAssignments.set(experimentId, variant);
    return variant;
  }

  /**
   * Get variant for experiment
   */
  getVariant(experimentId: string): string | undefined {
    return this.variantAssignments.get(experimentId);
  }

  /**
   * Log experiment event
   */
  logEvent(experimentId: string, eventName: string, metadata?: any) {
    const variant = this.getVariant(experimentId);

    const event = {
      userId: this.userId,
      experimentId,
      variant,
      eventName,
      metadata,
      timestamp: Date.now(),
    };

    // Send to analytics (Firebase Analytics, Mixpanel, etc.)
    this.sendToAnalytics(event);
  }

  private hashUserId(userId: string, experimentId: string): number {
    // Simple hash function
    const str = `${userId}_${experimentId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private sendToAnalytics(event: any) {
    // Send to Firebase Analytics or other service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.eventName, {
        experiment_id: event.experimentId,
        variant: event.variant,
        ...event.metadata,
      });
    }
  }
}

// Example usage:
const abTest = new ABTestingService(userId);

// Experiment: Progressive Overload Algorithm
const variant = abTest.assignVariant('progression_algo_v1', [
  'heuristic_only',
  'ml_hybrid',
  'reinforcement_learning',
]);

if (variant === 'ml_hybrid') {
  // Use ML model
  const suggestion = progressionML.suggestProgression(exerciseId, setIndex);
} else if (variant === 'reinforcement_learning') {
  // Use RL bandit
  const suggestion = adaptiveBandit.selectStrategy(exerciseId, current, features);
} else {
  // Use baseline heuristics
  const suggestion = getSuggestion(exerciseId, previousLog, todayLog, history, startTime);
}

// Log outcome
abTest.logEvent('progression_algo_v1', 'suggestion_shown', {
  exerciseId,
  suggestedWeight: suggestion.weight,
});

// After user completes set
abTest.logEvent('progression_algo_v1', 'set_completed', {
  exerciseId,
  actualWeight: actualSet.weight,
  actualReps: actualSet.reps,
  actualRPE: actualSet.rpe,
  accepted: actualSet.weight === suggestion.weight,
});
```

---

## 7. Deployment & Rollout Plan

### Phase 1: Rule-Based Foundation (Months 1-2)
**Goal: Ship working recommendations without ML complexity**

- [ ] Implement `FeatureExtractor` class
- [ ] Implement `ExerciseRecommender` (rule-based)
- [ ] Implement `ProgramRecommender` (rule-based)
- [ ] Enhance existing `progressiveOverload.ts` with better heuristics
- [ ] Add `RecommendationService` API
- [ ] Add cold start handling
- [ ] Implement basic metrics tracking
- [ ] UI: Show exercise recommendations in "Add Exercise" modal
- [ ] UI: Show program recommendations on Programs page
- [ ] UI: Show progression suggestions with "Use Suggestion" button

**Success Metrics:**
- Exercise recommendation CTR > 30%
- Progressive overload acceptance rate > 50%
- User retention (D7) > 40%

### Phase 2: Lightweight ML (Months 3-4)
**Goal: Improve personalization with simple ML models**

- [ ] Collect user interaction data (clicks, completions, feedback)
- [ ] Build training data pipeline
- [ ] Train collaborative filtering model (user-exercise embeddings)
- [ ] Implement `CollaborativeExerciseFilter`
- [ ] Train lightweight gradient boosting model for progression (LightGBM or XGBoost)
- [ ] Implement model versioning and A/B testing
- [ ] Deploy models to IndexedDB
- [ ] Implement online learning for progression model

**Success Metrics:**
- Exercise recommendation CTR > 40% (vs 30% baseline)
- Progressive overload accuracy > 70%
- Model inference time < 100ms

### Phase 3: Advanced ML (Months 5-6)
**Goal: State-of-the-art personalization**

- [ ] Implement reinforcement learning bandit for progression
- [ ] Train neural network for exercise recommendations (TensorFlow.js)
- [ ] Implement contextual embeddings (time of day, fatigue state, etc.)
- [ ] Add multi-arm bandit for program recommendations
- [ ] Implement federated learning (aggregate models across users privately)
- [ ] Advanced A/B testing with multi-variate experiments

**Success Metrics:**
- Exercise recommendation CTR > 50%
- Progressive overload acceptance rate > 80%
- User retention (D30) > 60%

---

## 8. Privacy & Security

### 8.1 Data Privacy

**Principles:**
1. **Local-first**: All data stays on device by default
2. **Opt-in cloud sync**: Users must explicitly enable IronCloud
3. **Anonymization**: If sending data to cloud for training, anonymize userId
4. **Transparency**: Show users what data is used for recommendations

**Implementation:**
```typescript
// Only sync if user opts in
if (settings.ironCloud?.enabled) {
  await backend.syncData();
  await backend.uploadTrainingData({
    userId: anonymizeUserId(userId), // One-way hash
    workoutHistory: sanitizeData(history),
  });
}
```

### 8.2 Model Security

**Prevent model tampering:**
- Sign model files with checksum
- Validate model integrity before loading
- Use HTTPS for model downloads

```typescript
async function loadSecureModel(modelUrl: string, expectedChecksum: string) {
  const response = await fetch(modelUrl);
  const modelData = await response.arrayBuffer();

  const checksum = await crypto.subtle.digest('SHA-256', modelData);
  const checksumHex = Array.from(new Uint8Array(checksum))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (checksumHex !== expectedChecksum) {
    throw new Error('Model checksum mismatch - potential tampering');
  }

  return modelData;
}
```

---

## 9. Implementation Checklist

### Backend/Data Infrastructure
- [ ] Create `services/ml/` directory
- [ ] Implement `FeatureExtractor` class
- [ ] Implement `ModelRegistry` for IndexedDB storage
- [ ] Set up training data collection pipeline
- [ ] Create cloud function for model training (Firebase Functions or similar)

### Exercise Recommendations
- [ ] Implement rule-based `ExerciseRecommender`
- [ ] Add collaborative filtering model (Phase 2)
- [ ] Add neural network model (Phase 3)
- [ ] Implement cold start handler
- [ ] Add metrics tracking

### Program Recommendations
- [ ] Implement rule-based `ProgramRecommender`
- [ ] Add content-based filtering enhancements
- [ ] Add user similarity matching (Phase 2)

### Progressive Overload
- [ ] Enhance existing `progressiveOverload.ts` with ML
- [ ] Implement `ProgressiveOverloadML` class
- [ ] Add reinforcement learning bandit (Phase 2)
- [ ] Implement online learning from feedback
- [ ] Add safety checks (prevent injury)

### API & Integration
- [ ] Create unified `RecommendationService`
- [ ] Integrate with Zustand store
- [ ] Add recommendation caching layer
- [ ] Implement A/B testing framework

### UI Components
- [ ] Exercise recommendation chips in "Add Exercise" modal
- [ ] Program recommendation cards on Programs page
- [ ] Progressive overload suggestion modal
- [ ] Feedback UI ("Was this helpful?")
- [ ] Analytics dashboard for recommendations

### Testing & Evaluation
- [ ] Unit tests for feature extraction
- [ ] Integration tests for recommendation service
- [ ] Offline metrics calculation
- [ ] A/B testing setup
- [ ] Performance benchmarks (< 100ms inference)

### Deployment
- [ ] Set up IndexedDB for model storage
- [ ] Implement model versioning
- [ ] Add rollback mechanism for bad models
- [ ] Monitor recommendation quality in production
- [ ] Set up alerts for model failures

---

## 10. Future Enhancements

### Advanced Features
- **Exercise Sequencing**: Recommend optimal exercise order (compounds first, etc.)
- **Supersetting Recommendations**: Suggest complementary exercises for supersets
- **Deload Week Prediction**: Automatically suggest deload weeks based on fatigue
- **Injury Prevention**: Detect overtraining patterns, suggest mobility work
- **Nutrition Integration**: Factor in calorie/protein intake for recommendations
- **Social Recommendations**: "Users like you also do..." (collaborative filtering)

### Advanced ML Techniques
- **Graph Neural Networks**: Model exercise relationships (e.g., bench press → incline press)
- **Sequence Models (LSTM/Transformer)**: Model workout progression over time
- **Multi-Task Learning**: Jointly optimize for multiple goals (strength, hypertrophy, retention)
- **Federated Learning**: Train models across users without sharing raw data
- **Causal Inference**: Understand causal impact of recommendations on outcomes

---

## Summary

This recommendation pipeline balances **production readiness** with **ML sophistication**:

1. **Start simple** (Phase 1): Rule-based recommendations work well with proper feature engineering
2. **Enhance gradually** (Phase 2): Add lightweight ML (collaborative filtering, gradient boosting)
3. **Optimize long-term** (Phase 3): Advanced ML (neural nets, RL) for peak performance

**Key Design Decisions:**
- ✅ **Offline-first**: Works without internet, models run in browser
- ✅ **Lightweight**: < 5MB total, < 100ms inference
- ✅ **Privacy-first**: Data stays on device unless user opts in
- ✅ **Incremental learning**: Models improve with user feedback
- ✅ **Cold start handling**: Works for new users with no history
- ✅ **Evaluation-driven**: Track metrics, A/B test everything

**Estimated Timeline:**
- Phase 1 (Rule-Based): 2 months
- Phase 2 (Lightweight ML): 2 months
- Phase 3 (Advanced ML): 2 months
- **Total: 6 months** to production-grade ML recommendation system

This approach is **realistic for a small team** and delivers value incrementally rather than waiting months for a "perfect" ML solution.
