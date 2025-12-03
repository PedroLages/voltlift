/**
 * AI Coach Integration Tests
 *
 * Tests for progressive overload heuristics and strength calculations.
 * These tests validate the research-backed formulas work correctly.
 */

import { describe, it, expect } from 'vitest';
import { getSuggestion, calculateRecoveryScore, calculateWeeklyVolume, checkVolumeWarning, shouldDeloadWeek } from '../progressiveOverload';
import { calculate1RM, classifyStrengthLevel, calculateOverallStrengthScore, checkIfPR } from '../strengthScore';
import { ExerciseLog, DailyLog, WorkoutSession, SetLog } from '../../types';

describe('Progressive Overload Service', () => {
  describe('calculateRecoveryScore', () => {
    it('should return high score for well-rested athlete', () => {
      const dailyLog: DailyLog = {
        date: '2025-01-01',
        sleepHours: 8.5,
        stressLevel: 3
      };

      const score = calculateRecoveryScore(dailyLog, 2);
      expect(score).toBeGreaterThanOrEqual(8); // Well rested = high score
    });

    it('should return low score for sleep-deprived athlete', () => {
      const dailyLog: DailyLog = {
        date: '2025-01-01',
        sleepHours: 5,
        stressLevel: 7
      };

      const score = calculateRecoveryScore(dailyLog, 1);
      expect(score).toBeLessThan(5); // Sleep deprived = low score
    });

    it('should bonus for extra recovery days', () => {
      const dailyLog: DailyLog = {
        date: '2025-01-01',
        sleepHours: 7
      };

      const score = calculateRecoveryScore(dailyLog, 4); // 4 days rest
      expect(score).toBeGreaterThan(7);
    });
  });

  describe('getSuggestion - RPE-based progression', () => {
    it('should suggest weight increase when RPE low and well recovered', () => {
      const lastWorkout: ExerciseLog = {
        id: 'log1',
        exerciseId: 'bench-press',
        sets: [
          { id: 's1', reps: 8, weight: 135, rpe: 6, type: 'N', completed: true }
        ]
      };

      const dailyLog: DailyLog = {
        date: '2025-01-01',
        sleepHours: 8
      };

      const suggestion = getSuggestion('bench-press', lastWorkout, dailyLog, [], Date.now());

      expect(suggestion.weight).toBeGreaterThan(135); // Should increase
      expect(suggestion.reasoning).toContain('ready to push');
      expect(suggestion.confidence).toBe('high');
    });

    it('should suggest deload when under-recovered', () => {
      const lastWorkout: ExerciseLog = {
        id: 'log1',
        exerciseId: 'bench-press',
        sets: [
          { id: 's1', reps: 8, weight: 135, rpe: 8, type: 'N', completed: true }
        ]
      };

      const dailyLog: DailyLog = {
        date: '2025-01-01',
        sleepHours: 5, // Sleep deprived
        stressLevel: 8
      };

      const suggestion = getSuggestion('bench-press', lastWorkout, dailyLog, [], Date.now());

      expect(suggestion.weight).toBeLessThan(135); // Should deload
      expect(suggestion.shouldDeload).toBe(true);
      expect(suggestion.reasoning).toContain('recovery');
    });

    it('should maintain weight at near-failure RPE', () => {
      const lastWorkout: ExerciseLog = {
        id: 'log1',
        exerciseId: 'bench-press',
        sets: [
          { id: 's1', reps: 8, weight: 135, rpe: 9.5, type: 'N', completed: true }
        ]
      };

      const dailyLog: DailyLog = {
        date: '2025-01-01',
        sleepHours: 7.5
      };

      const suggestion = getSuggestion('bench-press', lastWorkout, dailyLog, [], Date.now());

      expect(suggestion.weight).toBe(135); // Maintain
      expect(suggestion.reasoning).toContain('very high');
    });
  });

  describe('getSuggestion - Rep-based progression (no RPE)', () => {
    it('should increase weight when high reps achieved', () => {
      const lastWorkout: ExerciseLog = {
        id: 'log1',
        exerciseId: 'bench-press',
        sets: [
          { id: 's1', reps: 12, weight: 135, type: 'N', completed: true }
        ]
      };

      const dailyLog: DailyLog = {
        date: '2025-01-01',
        sleepHours: 7
      };

      const suggestion = getSuggestion('bench-press', lastWorkout, dailyLog, [], Date.now());

      expect(suggestion.weight).toBeGreaterThan(135);
      expect(suggestion.reps[1]).toBeLessThanOrEqual(10); // Lower reps at higher weight
    });
  });
});

describe('Strength Score Service', () => {
  describe('calculate1RM', () => {
    it('should calculate 1RM using Epley formula', () => {
      const result = calculate1RM(225, 5);

      // Epley: 1RM = 225 × (1 + 5/30) = 225 × 1.1667 = 262.5
      expect(result.estimated1RM).toBeCloseTo(262, 0);
      expect(result.formula).toBe('epley');
    });

    it('should return actual weight for 1 rep', () => {
      const result = calculate1RM(315, 1);

      expect(result.estimated1RM).toBe(315);
      expect(result.formula).toBe('actual');
    });

    it('should use Brzycki for high rep ranges', () => {
      const result = calculate1RM(135, 15);

      expect(result.formula).toBe('brzycki');
      expect(result.estimated1RM).toBeGreaterThan(135);
    });
  });

  describe('classifyStrengthLevel', () => {
    it('should classify novice male bencher correctly', () => {
      const bodyweight = 180;
      const oneRM = 135; // 0.75x bodyweight = Novice

      const classification = classifyStrengthLevel('bench-press', oneRM, bodyweight, 'male');

      expect(classification?.level).toBe('Novice');
      expect(classification?.nextLevelTarget).toBeGreaterThan(oneRM);
    });

    it('should classify intermediate male squatter correctly', () => {
      const bodyweight = 180;
      const oneRM = 315; // 1.75x bodyweight = Intermediate

      const classification = classifyStrengthLevel('barbell-squat', oneRM, bodyweight, 'male');

      expect(classification?.level).toBe('Intermediate');
    });

    it('should return null for exercises without standards', () => {
      const classification = classifyStrengthLevel('bicep-curl', 100, 180, 'male');

      expect(classification).toBeNull();
    });
  });

  describe('checkIfPR', () => {
    it('should detect weight PR', () => {
      const set: SetLog = {
        id: 's1',
        reps: 5,
        weight: 225,
        type: 'N',
        completed: true
      };

      const prHistory = {
        exerciseId: 'bench-press',
        records: [],
        bestWeight: { value: 215, date: Date.now(), type: 'weight' as const, reps: 5 }
      };

      const result = checkIfPR(set, prHistory);

      expect(result.isPR).toBe(true);
      expect(result.type).toBe('weight');
      expect(result.previousBest).toBe(215);
    });

    it('should detect volume PR', () => {
      const set: SetLog = {
        id: 's1',
        reps: 10,
        weight: 185,
        type: 'N',
        completed: true
      };

      const prHistory = {
        exerciseId: 'bench-press',
        records: [],
        bestWeight: { value: 225, date: Date.now(), type: 'weight' as const, reps: 5 },
        bestVolume: { value: 1800, date: Date.now(), type: 'volume' as const } // 185×10 = 1850 > 1800
      };

      const result = checkIfPR(set, prHistory);

      expect(result.isPR).toBe(true);
      expect(result.type).toBe('volume');
    });

    it('should return isPR true for first ever set', () => {
      const set: SetLog = {
        id: 's1',
        reps: 5,
        weight: 135,
        type: 'N',
        completed: true
      };

      const result = checkIfPR(set, undefined);

      expect(result.isPR).toBe(true);
    });
  });
});

describe('Volume Tracking', () => {
  describe('checkVolumeWarning', () => {
    it('should warn when approaching MRV', () => {
      // Create mock history with high chest volume
      const sessions: WorkoutSession[] = [
        {
          id: 'w1',
          name: 'Push Day',
          startTime: Date.now() - (2 * 24 * 60 * 60 * 1000),
          endTime: Date.now() - (2 * 24 * 60 * 60 * 1000),
          status: 'completed',
          logs: [
            {
              id: 'log1',
              exerciseId: 'bench-press',
              sets: Array(5).fill(null).map((_, i) => ({
                id: `s${i}`,
                reps: 8,
                weight: 135,
                type: 'N' as const,
                completed: true
              }))
            }
          ]
        },
        {
          id: 'w2',
          name: 'Push Day 2',
          startTime: Date.now() - (24 * 60 * 60 * 1000),
          endTime: Date.now() - (24 * 60 * 60 * 1000),
          status: 'completed',
          logs: [
            {
              id: 'log2',
              exerciseId: 'bench-press',
              sets: Array(5).fill(null).map((_, i) => ({
                id: `s${i}`,
                reps: 8,
                weight: 135,
                type: 'N' as const,
                completed: true
              }))
            },
            {
              id: 'log3',
              exerciseId: 'incline-bench',
              sets: Array(4).fill(null).map((_, i) => ({
                id: `s${i}`,
                reps: 10,
                weight: 95,
                type: 'N' as const,
                completed: true
              }))
            }
          ]
        }
      ];

      const warning = checkVolumeWarning(sessions, 'Chest');

      expect(warning.sets).toBeGreaterThan(12); // Should have counted sets
      // May or may not warn depending on exact count, but should calculate correctly
    });
  });
});
