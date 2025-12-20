/**
 * Progressive Overload Edge Cases Tests
 *
 * Tests critical edge cases:
 * - Deload scenarios (low recovery, overtraining)
 * - Plateau scenarios (no progress, stuck at same weight)
 * - Beginner scenarios (minimal history, first workout)
 */

import { describe, it, expect } from 'vitest';
import { getSuggestion } from '../progressiveOverload';
import { ExerciseLog, SetLog, WorkoutSession, DailyLog, SuggestionFeedback } from '../../types';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockSetLog(
  weight: number,
  reps: number,
  rpe?: number,
  completed: boolean = true
): SetLog {
  return {
    id: `set-${Date.now()}-${Math.random()}`,
    weight,
    reps,
    rpe,
    type: 'normal',
    completed,
  };
}

function createMockExerciseLog(
  exerciseId: string,
  sets: SetLog[],
  timestamp: number = Date.now()
): ExerciseLog {
  return {
    id: `log-${timestamp}`,
    exerciseId,
    sets,
    notes: '',
  };
}

function createMockDailyLog(sleepHours: number, date?: string): DailyLog {
  return {
    id: `daily-${Date.now()}`,
    date: date || new Date().toISOString().split('T')[0],
    sleepHours,
    stressLevel: 5,
    sorenessLevel: 5,
    perceivedRecovery: 5,
  };
}

function createMockWorkoutSession(
  logs: ExerciseLog[],
  daysAgo: number = 0
): WorkoutSession {
  const timestamp = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
  return {
    id: `workout-${timestamp}`,
    name: 'Test Workout',
    startTime: timestamp,
    endTime: timestamp + 3600000,
    status: 'completed',
    logs,
  };
}

// =============================================================================
// EDGE CASE 1: Deload Scenarios
// =============================================================================

describe('Progressive Overload - Deload Edge Cases', () => {
  it('should recommend deload when recovery score is critically low (< 4)', () => {
    const lastWorkout = createMockExerciseLog('barbell-squat', [
      createMockSetLog(100, 8, 8), // High RPE
      createMockSetLog(100, 7, 9), // Very high RPE
      createMockSetLog(100, 6, 9), // Struggling
    ]);

    const history = [
      createMockWorkoutSession([lastWorkout], 2),
    ];

    const dailyLog = createMockDailyLog(4); // Poor sleep

    const suggestion = getSuggestion(
      'barbell-squat',
      lastWorkout,
      dailyLog,
      history,
      Date.now(),
      'Intermediate'
    );

    expect(suggestion).not.toBeNull();
    expect(suggestion?.shouldDeload).toBe(true);
    expect(suggestion?.weight).toBeLessThan(100); // Should reduce weight
    expect(suggestion?.confidence).toBe('medium'); // Lower confidence due to low recovery
  });

  it('should recommend deload after multiple high-RPE sessions', () => {
    const session1 = createMockExerciseLog('barbell-squat', [
      createMockSetLog(100, 5, 9.5),
      createMockSetLog(100, 4, 10),
    ]);

    const session2 = createMockExerciseLog('barbell-squat', [
      createMockSetLog(100, 5, 9),
      createMockSetLog(100, 4, 9.5),
    ]);

    const session3 = createMockExerciseLog('barbell-squat', [
      createMockSetLog(100, 4, 10),
      createMockSetLog(95, 5, 9.5), // Already deloading
    ]);

    const history = [
      createMockWorkoutSession([session3], 2),
      createMockWorkoutSession([session2], 5),
      createMockWorkoutSession([session1], 8),
    ];

    const dailyLog = createMockDailyLog(6);

    const suggestion = getSuggestion(
      'barbell-squat',
      session3,
      dailyLog,
      history,
      Date.now(),
      'Intermediate'
    );

    expect(suggestion).not.toBeNull();
    expect(suggestion?.shouldDeload).toBe(true);
    expect(suggestion?.reasoning).toContain('recovery');
  });

  it('should not deload if recovery is good despite high RPE', () => {
    const lastWorkout = createMockExerciseLog('barbell-squat', [
      createMockSetLog(100, 8, 8), // High but manageable RPE
    ]);

    const history = [
      createMockWorkoutSession([lastWorkout], 7), // Full week of rest
    ];

    const dailyLog = createMockDailyLog(9); // Excellent sleep

    const suggestion = getSuggestion(
      'barbell-squat',
      lastWorkout,
      dailyLog,
      history,
      Date.now(),
      'Intermediate'
    );

    expect(suggestion).not.toBeNull();
    expect(suggestion?.shouldDeload).toBe(false);
    expect(suggestion?.weight).toBeGreaterThanOrEqual(100); // Should maintain or increase
  });
});

// =============================================================================
// EDGE CASE 2: Plateau Scenarios
// =============================================================================

describe('Progressive Overload - Plateau Edge Cases', () => {
  it('should detect plateau when stuck at same weight for 4+ weeks', () => {
    const sessions = Array.from({ length: 8 }, (_, i) =>
      createMockWorkoutSession([
        createMockExerciseLog('bench-press', [
          createMockSetLog(80, 8, 7),
          createMockSetLog(80, 8, 7.5),
          createMockSetLog(80, 7, 8),
        ]),
      ], i * 3)
    );

    const lastWorkout = sessions[0].logs[0];
    const dailyLog = createMockDailyLog(7);

    const suggestion = getSuggestion(
      'bench-press',
      lastWorkout,
      dailyLog,
      sessions,
      Date.now(),
      'Intermediate'
    );

    expect(suggestion).not.toBeNull();
    // Should suggest alternative progression (reps or different approach)
    expect(suggestion?.reasoning).toContain('plateau');
  });

  it('should suggest rep progression when weight plateau detected', () => {
    // User stuck at 100kg but can do more reps
    const lastWorkout = createMockExerciseLog('deadlift', [
      createMockSetLog(100, 10, 7), // Can do more reps
      createMockSetLog(100, 10, 7.5),
      createMockSetLog(100, 9, 8),
    ]);

    const history = [
      createMockWorkoutSession([lastWorkout], 3),
      createMockWorkoutSession([
        createMockExerciseLog('deadlift', [
          createMockSetLog(100, 8, 7),
          createMockSetLog(100, 8, 7),
        ]),
      ], 7),
    ];

    const dailyLog = createMockDailyLog(7);

    const suggestion = getSuggestion(
      'deadlift',
      lastWorkout,
      dailyLog,
      history,
      Date.now(),
      'Intermediate'
    );

    expect(suggestion).not.toBeNull();
    // Should either increase weight slightly or push reps higher
    const [minReps, maxReps] = suggestion!.reps;
    expect(maxReps).toBeGreaterThanOrEqual(10); // Push reps if weight stuck
  });

  it('should maintain confidence despite plateau if form is solid', () => {
    const lastWorkout = createMockExerciseLog('barbell-squat', [
      createMockSetLog(120, 5, 7), // Low RPE = good form
      createMockSetLog(120, 5, 7),
      createMockSetLog(120, 5, 7.5),
    ]);

    const history = Array.from({ length: 4 }, (_, i) =>
      createMockWorkoutSession([
        createMockExerciseLog('barbell-squat', [
          createMockSetLog(120, 5, 7),
        ]),
      ], i * 7)
    );

    const dailyLog = createMockDailyLog(8);

    const suggestion = getSuggestion(
      'barbell-squat',
      lastWorkout,
      dailyLog,
      history,
      Date.now(),
      'Advanced'
    );

    expect(suggestion).not.toBeNull();
    // High confidence despite plateau (form is good, recovery is good)
    expect(suggestion?.confidence).toBe('high');
  });
});

// =============================================================================
// EDGE CASE 3: Beginner Scenarios
// =============================================================================

describe('Progressive Overload - Beginner Edge Cases', () => {
  it('should provide conservative suggestion for absolute beginner (first workout)', () => {
    // No previous workout data at all
    const dailyLog = createMockDailyLog(7);

    const suggestion = getSuggestion(
      'barbell-squat',
      undefined, // No previous workout
      dailyLog,
      [], // No history
      Date.now(),
      'Beginner'
    );

    // Should return null or very conservative suggestion
    if (suggestion !== null) {
      expect(suggestion.confidence).toBe('low');
      expect(suggestion.weight).toBeLessThanOrEqual(60); // Very light starting weight
    }
  });

  it('should be aggressive with progression for beginners with good form', () => {
    const lastWorkout = createMockExerciseLog('barbell-squat', [
      createMockSetLog(40, 10, 5), // Very low RPE = room to grow
      createMockSetLog(40, 10, 5),
      createMockSetLog(40, 10, 5),
    ]);

    const history = [
      createMockWorkoutSession([lastWorkout], 2),
    ];

    const dailyLog = createMockDailyLog(8);

    const suggestion = getSuggestion(
      'barbell-squat',
      lastWorkout,
      dailyLog,
      history,
      Date.now(),
      'Beginner'
    );

    expect(suggestion).not.toBeNull();
    expect(suggestion?.weight).toBeGreaterThan(40); // Should jump up significantly
    expect(suggestion?.weight).toBeLessThanOrEqual(50); // But not too much (safety)
    expect(suggestion?.confidence).toBe('medium'); // Medium confidence for beginners
  });

  it('should handle beginner with inconsistent training history', () => {
    // Beginner who trains sporadically (large gaps)
    const session1 = createMockExerciseLog('bench-press', [
      createMockSetLog(40, 8),
    ]);

    const session2 = createMockExerciseLog('bench-press', [
      createMockSetLog(45, 7),
    ]);

    const history = [
      createMockWorkoutSession([session2], 21), // 3 weeks ago
      createMockWorkoutSession([session1], 35), // 5 weeks ago
    ];

    const dailyLog = createMockDailyLog(7);

    const suggestion = getSuggestion(
      'bench-press',
      session2,
      dailyLog,
      history,
      Date.now(),
      'Beginner'
    );

    expect(suggestion).not.toBeNull();
    // Should be conservative due to inconsistency
    expect(suggestion?.weight).toBeLessThanOrEqual(50);
    expect(suggestion?.confidence).toBe('low'); // Low confidence due to gaps
  });

  it('should cap progression rate for beginners to prevent injury', () => {
    const lastWorkout = createMockExerciseLog('deadlift', [
      createMockSetLog(60, 8, 6), // Moderate RPE
    ]);

    const history = [
      createMockWorkoutSession([lastWorkout], 3),
    ];

    const dailyLog = createMockDailyLog(8);

    const suggestion = getSuggestion(
      'deadlift',
      lastWorkout,
      dailyLog,
      history,
      Date.now(),
      'Beginner'
    );

    expect(suggestion).not.toBeNull();
    // Should not increase more than 10% for safety
    const progressionRate = (suggestion!.weight - 60) / 60;
    expect(progressionRate).toBeLessThanOrEqual(0.1); // Max 10% increase
  });
});

// =============================================================================
// EDGE CASE 4: Recovery Edge Cases
// =============================================================================

describe('Progressive Overload - Recovery Edge Cases', () => {
  it('should handle extreme sleep deprivation (< 4 hours)', () => {
    const lastWorkout = createMockExerciseLog('barbell-squat', [
      createMockSetLog(100, 8, 7),
    ]);

    const history = [
      createMockWorkoutSession([lastWorkout], 2),
    ];

    const dailyLog = createMockDailyLog(3); // Severe sleep deprivation

    const suggestion = getSuggestion(
      'barbell-squat',
      lastWorkout,
      dailyLog,
      history,
      Date.now(),
      'Intermediate'
    );

    expect(suggestion).not.toBeNull();
    expect(suggestion?.shouldDeload).toBe(true);
    expect(suggestion?.recoveryScore).toBeLessThan(5);
    expect(suggestion?.reasoning).toContain('recovery');
  });

  it('should reward excellent recovery with aggressive progression', () => {
    const lastWorkout = createMockExerciseLog('bench-press', [
      createMockSetLog(80, 8, 7),
    ]);

    const history = [
      createMockWorkoutSession([lastWorkout], 7), // Full week rest
    ];

    const dailyLog = createMockDailyLog(9); // Excellent sleep

    const suggestion = getSuggestion(
      'bench-press',
      lastWorkout,
      dailyLog,
      history,
      Date.now(),
      'Intermediate'
    );

    expect(suggestion).not.toBeNull();
    expect(suggestion?.recoveryScore).toBeGreaterThanOrEqual(8);
    expect(suggestion?.weight).toBeGreaterThan(80); // Should progress
    expect(suggestion?.confidence).toBe('high');
  });
});

// =============================================================================
// EDGE CASE 5: Feedback Learning Edge Cases
// =============================================================================

describe('Progressive Overload - User Feedback Edge Cases', () => {
  it('should adjust suggestions based on consistent user overrides', () => {
    const lastWorkout = createMockExerciseLog('barbell-squat', [
      createMockSetLog(100, 8),
    ]);

    const history = [
      createMockWorkoutSession([lastWorkout], 3),
    ];

    const dailyLog = createMockDailyLog(7);

    // User consistently lifts heavier than suggested
    const suggestionHistory: SuggestionFeedback[] = [
      {
        exerciseId: 'barbell-squat',
        suggestedWeight: 90,
        actualWeight: 100,
        suggestedReps: [8, 10],
        actualReps: 8,
        accepted: false,
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
        confidence: 'medium',
      },
      {
        exerciseId: 'barbell-squat',
        suggestedWeight: 95,
        actualWeight: 105,
        suggestedReps: [8, 10],
        actualReps: 8,
        accepted: false,
        timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
        confidence: 'medium',
      },
    ];

    const suggestion = getSuggestion(
      'barbell-squat',
      lastWorkout,
      dailyLog,
      history,
      Date.now(),
      'Intermediate',
      suggestionHistory
    );

    expect(suggestion).not.toBeNull();
    // Should learn to suggest heavier weights
    expect(suggestion?.weight).toBeGreaterThan(100);
  });

  it('should become more conservative if user consistently fails suggestions', () => {
    const lastWorkout = createMockExerciseLog('bench-press', [
      createMockSetLog(80, 6, 9), // Struggled
    ]);

    const history = [
      createMockWorkoutSession([lastWorkout], 3),
    ];

    const dailyLog = createMockDailyLog(7);

    // User consistently lifts lighter than suggested
    const suggestionHistory: SuggestionFeedback[] = [
      {
        exerciseId: 'bench-press',
        suggestedWeight: 85,
        actualWeight: 80,
        suggestedReps: [8, 10],
        actualReps: 6,
        accepted: false,
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
        confidence: 'high',
      },
    ];

    const suggestion = getSuggestion(
      'bench-press',
      lastWorkout,
      dailyLog,
      history,
      Date.now(),
      'Intermediate',
      suggestionHistory
    );

    expect(suggestion).not.toBeNull();
    // Should be more conservative
    expect(suggestion?.weight).toBeLessThanOrEqual(82);
    expect(suggestion?.confidence).toBe('medium'); // Lower confidence
  });
});
