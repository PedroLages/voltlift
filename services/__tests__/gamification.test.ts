/**
 * Gamification Service Test Suite
 *
 * Comprehensive tests for XP calculations, streak management,
 * achievement unlocks, and rank progression.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  calculateWorkoutXP,
  updateStreak,
  getRankForXP,
  getXPToNextLevel,
  checkAchievements,
  processWorkoutCompletion,
  createInitialGamificationState,
  IRON_RANKS,
} from '../gamification';
import type { GamificationState } from '../../types';
import type { WorkoutSession, ExerciseLog } from '../../types';

// Helper to get relative dates (future-proof test dates)
function getRelativeDate(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

function getRelativeDateISO(daysOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

// Helper to create a mock workout
function createMockWorkout(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 'test-workout-1',
    name: 'Test Workout',
    startTime: Date.now(),
    endTime: Date.now() + 3600000,
    status: 'completed',
    logs: [],
    ...overrides,
  };
}

// Helper to create mock exercise logs
function createMockExerciseLogs(count: number): ExerciseLog[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `log-${i}`,
    exerciseId: `ex-${i}`,
    sets: [
      { id: `set-${i}-1`, reps: 10, weight: 100, completed: true, type: 'N' },
      { id: `set-${i}-2`, reps: 10, weight: 100, completed: true, type: 'N' },
      { id: `set-${i}-3`, reps: 10, weight: 100, completed: true, type: 'N' },
    ],
    notes: '',
  }));
}

describe('calculateWorkoutXP', () => {
  test('should award base 100 XP for workout with 3 exercises', () => {
    const workout = createMockWorkout({
      logs: createMockExerciseLogs(3),
    });

    const result = calculateWorkoutXP(workout, {
      hitPRs: 0,
      currentStreak: 0,
      volumeTotal: 3000,
    });

    expect(result.baseXP).toBe(100);
    expect(result.totalXP).toBe(100); // No bonuses
    expect(result.bonuses).toHaveLength(0);
  });

  test('should award 50 XP per personal record', () => {
    const workout = createMockWorkout({
      logs: createMockExerciseLogs(3),
    });

    const result = calculateWorkoutXP(workout, {
      hitPRs: 2,
      currentStreak: 0,
      volumeTotal: 3000,
    });

    const prBonus = result.bonuses.find(b => b.reason === 'Personal Records');
    expect(prBonus).toBeDefined();
    expect(prBonus?.amount).toBe(100); // 2 PRs × 50 XP each
    expect(result.totalXP).toBe(result.baseXP + 100);
  });

  test('should cap exercise variety bonus at 8 exercises (40 XP max)', () => {
    const workout = createMockWorkout({
      logs: createMockExerciseLogs(12), // More than 8
    });

    const result = calculateWorkoutXP(workout, {
      hitPRs: 0,
      currentStreak: 0,
      volumeTotal: 12000,
    });

    const varietyBonus = result.bonuses.find(b => b.reason === 'Exercise Variety');
    expect(varietyBonus).toBeDefined();
    expect(varietyBonus?.amount).toBe(40); // (8 - 3) × 10 XP = 40 XP max
  });

  test('should award streak bonus for 3+ consecutive days', () => {
    const workout = createMockWorkout({
      logs: createMockExerciseLogs(3),
    });

    const result = calculateWorkoutXP(workout, {
      hitPRs: 0,
      currentStreak: 5,
      volumeTotal: 3000,
    });

    const streakBonus = result.bonuses.find(b => b.reason === 'Streak Bonus');
    expect(streakBonus).toBeDefined();
    expect(streakBonus?.amount).toBeGreaterThan(0);
  });

  test('should award 25 XP weekend warrior bonus on Saturday/Sunday', () => {
    // Find next Saturday from today
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
    const saturday = getRelativeDateISO(daysUntilSaturday);

    const workout = createMockWorkout({
      startTime: saturday.getTime(),
      logs: createMockExerciseLogs(3),
    });

    const result = calculateWorkoutXP(workout, {
      hitPRs: 0,
      currentStreak: 0,
      volumeTotal: 3000,
    });

    const weekendBonus = result.bonuses.find(b => b.reason === 'Weekend Warrior');
    expect(weekendBonus).toBeDefined();
    expect(weekendBonus?.amount).toBe(25);
  });

  test('should award volume bonus for high-volume workouts (10k+ lbs)', () => {
    const workout = createMockWorkout({
      logs: createMockExerciseLogs(3),
    });

    const result = calculateWorkoutXP(workout, {
      hitPRs: 0,
      currentStreak: 0,
      volumeTotal: 15000, // High volume
    });

    const volumeBonus = result.bonuses.find(b => b.reason === 'High Volume');
    expect(volumeBonus).toBeDefined();
    expect(volumeBonus?.amount).toBeGreaterThan(0);
  });
});

describe('updateStreak', () => {
  const today = getRelativeDate(0);
  const yesterday = getRelativeDate(-1);
  const twoDaysAgo = getRelativeDate(-2);
  const threeDaysAgo = getRelativeDate(-3);
  const oldWeekStart = getRelativeDate(-11); // Week start from 11 days ago

  test('should increment streak for consecutive day workouts', () => {
    const currentStreak = {
      current: 5,
      best: 10,
      lastWorkoutDate: yesterday,
      freezesUsed: 0,
      freezeWeekStart: getRelativeDate(-4),
    };

    const result = updateStreak(currentStreak);

    expect(result.current).toBe(6); // Incremented
    expect(result.lastWorkoutDate).toBe(today);
    expect(result.best).toBe(10); // Unchanged
  });

  test('should use freeze for single day gap when freezes available', () => {
    const currentStreak = {
      current: 5,
      best: 10,
      lastWorkoutDate: twoDaysAgo,
      freezesUsed: 0,
      freezeWeekStart: getRelativeDate(-4),
    };

    const result = updateStreak(currentStreak);

    expect(result.current).toBe(6); // Maintained with freeze
    expect(result.freezesUsed).toBe(1); // Used one freeze
    expect(result.lastWorkoutDate).toBe(today);
  });

  test('should reset streak to 1 after 2+ day gap', () => {
    const currentStreak = {
      current: 5,
      best: 10,
      lastWorkoutDate: threeDaysAgo,
      freezesUsed: 0,
      freezeWeekStart: getRelativeDate(-4),
    };

    const result = updateStreak(currentStreak);

    expect(result.current).toBe(1); // Reset to 1
    expect(result.freezesUsed).toBe(0); // Reset freeze counter
    expect(result.lastWorkoutDate).toBe(today);
  });

  test('should reset freeze counter at start of new week', () => {
    const currentStreak = {
      current: 5,
      best: 10,
      lastWorkoutDate: yesterday,
      freezesUsed: 2,
      freezeWeekStart: oldWeekStart, // Old week
    };

    const result = updateStreak(currentStreak);

    expect(result.freezesUsed).toBe(0); // Reset
    expect(result.freezeWeekStart).not.toBe(oldWeekStart); // Updated
  });

  test('should update best streak when current streak exceeds it', () => {
    const currentStreak = {
      current: 10,
      best: 10,
      lastWorkoutDate: yesterday,
      freezesUsed: 0,
      freezeWeekStart: getRelativeDate(-4),
    };

    const result = updateStreak(currentStreak);

    expect(result.current).toBe(11);
    expect(result.best).toBe(11); // Updated
  });

  test('should reset streak when 2 freezes already used this week', () => {
    const currentStreak = {
      current: 5,
      best: 10,
      lastWorkoutDate: twoDaysAgo,
      freezesUsed: 2, // Already at limit
      freezeWeekStart: getRelativeDate(-4),
    };

    const result = updateStreak(currentStreak);

    expect(result.current).toBe(1); // Reset instead of using freeze
    expect(result.freezesUsed).toBe(0); // Reset
  });
});

describe('getRankForXP', () => {
  test('should return first rank for 0 XP', () => {
    const rank = getRankForXP(0);
    expect(rank.level).toBe(1);
    expect(rank.name).toBe('ROOKIE');
  });

  test('should return correct rank for each tier', () => {
    expect(getRankForXP(0).name).toBe('ROOKIE');
    expect(getRankForXP(500).name).toBe('REGULAR');
    expect(getRankForXP(1500).name).toBe('WARRIOR');
    expect(getRankForXP(4000).name).toBe('CHAMPION');
    expect(getRankForXP(10000).name).toBe('LEGEND');
    expect(getRankForXP(25000).name).toBe('IRON MASTER');
  });

  test('should return highest rank for extreme XP', () => {
    const rank = getRankForXP(1000000);
    expect(rank.level).toBe(6);
    expect(rank.name).toBe('IRON MASTER');
  });

  test('should handle boundary values correctly', () => {
    expect(getRankForXP(499).name).toBe('ROOKIE'); // Just before threshold
    expect(getRankForXP(500).name).toBe('REGULAR'); // At threshold
    expect(getRankForXP(501).name).toBe('REGULAR'); // Just after
  });
});

describe('getXPToNextLevel', () => {
  test('should calculate XP needed correctly', () => {
    const xpNeeded = getXPToNextLevel(100);
    expect(xpNeeded).toBe(400); // 500 - 100
  });

  test('should return 0 for max level', () => {
    const xpNeeded = getXPToNextLevel(30000);
    expect(xpNeeded).toBe(0);
  });

  test('should handle rank boundaries', () => {
    const xpNeeded = getXPToNextLevel(500); // At APPRENTICE threshold
    expect(xpNeeded).toBe(1000); // Next level is WARRIOR at 1500
  });
});

describe('checkAchievementProgress', () => {
  test('should unlock first workout achievement', () => {
    const state = createInitialGamificationState();
    state.totalWorkouts = 1;

    const result = checkAchievementProgress(state);

    const firstWorkout = result.find(a => a.id === 'first_workout');
    expect(firstWorkout).toBeDefined();
    expect(firstWorkout?.progress).toBe(1);
    expect(firstWorkout?.unlocked).toBe(true);
  });

  test('should track PR achievements correctly', () => {
    const state = createInitialGamificationState();
    state.totalPRs = 5;

    const result = checkAchievementProgress(state);

    const prAchievement = result.find(a => a.id === 'pr_hunter');
    expect(prAchievement).toBeDefined();
    expect(prAchievement?.progress).toBe(0.5); // 5 out of 10
  });

  test('should unlock streak achievements', () => {
    const state = createInitialGamificationState();
    state.streak.current = 7;

    const result = checkAchievementProgress(state);

    const streakAchievement = result.find(a => a.id === 'week_warrior');
    expect(streakAchievement).toBeDefined();
    expect(streakAchievement?.unlocked).toBe(true);
  });

  test('should track volume achievements', () => {
    const state = createInitialGamificationState();
    state.totalVolume = 50000; // 50k out of 100k

    const result = checkAchievementProgress(state);

    const volumeAchievement = result.find(a => a.id === 'volume_beast');
    expect(volumeAchievement).toBeDefined();
    expect(volumeAchievement?.progress).toBe(0.5);
  });
});

describe('processWorkoutCompletion', () => {
  test('should throw error for invalid state', () => {
    expect(() => {
      processWorkoutCompletion(
        null as any,
        createMockWorkout(),
        0,
        3000
      );
    }).toThrow('Invalid gamification state');
  });

  test('should throw error for negative PRs', () => {
    const state = createInitialGamificationState();
    expect(() => {
      processWorkoutCompletion(
        state,
        createMockWorkout(),
        -1, // Invalid
        3000
      );
    }).toThrow('Invalid PRs hit count');
  });

  test('should throw error for negative volume', () => {
    const state = createInitialGamificationState();
    expect(() => {
      processWorkoutCompletion(
        state,
        createMockWorkout(),
        0,
        -1000 // Invalid
      );
    }).toThrow('Invalid workout volume');
  });

  test('should update all state correctly', () => {
    const state = createInitialGamificationState();
    const workout = createMockWorkout({
      logs: createMockExerciseLogs(5),
    });

    const result = processWorkoutCompletion(state, workout, 2, 5000);

    expect(result.newState.totalWorkouts).toBe(1);
    expect(result.newState.totalPRs).toBe(2);
    expect(result.newState.totalVolume).toBe(5000);
    expect(result.newState.totalXP).toBeGreaterThan(0);
    expect(result.xpEarned.totalXP).toBeGreaterThan(0);
  });

  test('should detect level up correctly', () => {
    const state = createInitialGamificationState();
    state.totalXP = 480; // Close to level 2 (500 XP)

    const workout = createMockWorkout({
      logs: createMockExerciseLogs(5),
    });

    const result = processWorkoutCompletion(state, workout, 0, 5000);

    expect(result.leveledUp).toBe(true);
    expect(result.newState.currentLevel).toBeGreaterThan(state.currentLevel);
  });

  test('should unlock new achievements', () => {
    const state = createInitialGamificationState();
    const workout = createMockWorkout({
      logs: createMockExerciseLogs(3),
    });

    const result = processWorkoutCompletion(state, workout, 0, 3000);

    expect(result.newAchievements.length).toBeGreaterThan(0);
    const firstWorkout = result.newAchievements.find(a => a.id === 'first_workout');
    expect(firstWorkout).toBeDefined();
  });

  test('should update XP transaction history', () => {
    const state = createInitialGamificationState();
    const workout = createMockWorkout({
      logs: createMockExerciseLogs(3),
    });

    const result = processWorkoutCompletion(state, workout, 1, 3000);

    expect(result.newState.xpHistory).toHaveLength(1);
    expect(result.newState.xpHistory[0].amount).toBe(result.xpEarned.totalXP);
    expect(result.newState.xpHistory[0].reason).toBe('Workout Completed');
  });

  test('should maintain streak correctly', () => {
    const state = createInitialGamificationState();
    state.streak.current = 3;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    state.streak.lastWorkoutDate = yesterday.toISOString().split('T')[0];

    const workout = createMockWorkout({
      logs: createMockExerciseLogs(3),
    });

    const result = processWorkoutCompletion(state, workout, 0, 3000);

    expect(result.newState.streak.current).toBe(4);
  });
});
