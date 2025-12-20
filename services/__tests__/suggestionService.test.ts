/**
 * Suggestion Service Unit Tests
 *
 * Tests for the AI suggestion API wrapper
 */

import { describe, it, expect } from 'vitest';
import {
  getExerciseSuggestion,
  getBatchSuggestions,
  createSuggestionFeedback,
  formatSuggestion,
  getConfidenceColor,
  shouldWarnUser,
  ProgressiveSuggestion,
} from '../suggestionService';
import {
  ExerciseLog,
  DailyLog,
  WorkoutSession,
  SetLog,
} from '../../types';

// Mock data helpers
const createMockSetLog = (weight: number, reps: number, rpe?: number): SetLog => ({
  id: `set-${Math.random()}`,
  weight,
  reps,
  rpe,
  type: 'N',
  completed: true,
});

const createMockExerciseLog = (exerciseId: string, sets: SetLog[]): ExerciseLog => ({
  id: `log-${Math.random()}`,
  exerciseId,
  sets,
});

const createMockWorkoutSession = (
  logs: ExerciseLog[],
  startTime: number
): WorkoutSession => ({
  id: `workout-${Math.random()}`,
  name: 'Test Workout',
  startTime,
  endTime: startTime + 3600000, // 1 hour later
  logs,
  status: 'completed',
});

const createMockDailyLog = (sleepHours: number): DailyLog => ({
  date: new Date().toISOString().split('T')[0],
  sleepHours,
  waterGlasses: 8,
  sleepQuality: 3,
  perceivedRecovery: 3,
  sorenessLevel: 3,
  stressLevel: 3,
});

describe('suggestionService', () => {
  describe('getExerciseSuggestion', () => {
    it('should return null when no previous workout data exists', () => {
      const suggestion = getExerciseSuggestion({
        exerciseId: 'barbell-squat',
        lastWorkout: undefined,
        dailyLog: createMockDailyLog(7),
        history: [],
        currentSessionStart: Date.now(),
        experienceLevel: 'Intermediate',
      });

      expect(suggestion).toBeNull();
    });

    it('should return suggestion when valid previous workout exists', () => {
      const lastWorkout = createMockExerciseLog('barbell-squat', [
        createMockSetLog(100, 8, 7),
        createMockSetLog(100, 8, 7),
        createMockSetLog(100, 7, 8),
      ]);

      const suggestion = getExerciseSuggestion({
        exerciseId: 'barbell-squat',
        lastWorkout,
        dailyLog: createMockDailyLog(7),
        history: [],
        currentSessionStart: Date.now(),
        experienceLevel: 'Intermediate',
      });

      expect(suggestion).not.toBeNull();
      expect(suggestion?.weight).toBeGreaterThan(0);
      expect(suggestion?.reps).toHaveLength(2);
      expect(suggestion?.confidence).toMatch(/high|medium|low/);
    });

    it('should suggest deload when recovery score is low', () => {
      const lastWorkout = createMockExerciseLog('barbell-squat', [
        createMockSetLog(100, 8, 7),
      ]);

      const suggestion = getExerciseSuggestion({
        exerciseId: 'barbell-squat',
        lastWorkout,
        dailyLog: createMockDailyLog(4), // Very low sleep
        history: [],
        currentSessionStart: Date.now(),
        experienceLevel: 'Intermediate',
      });

      expect(suggestion).not.toBeNull();
      expect(suggestion?.shouldDeload).toBe(true);
      expect(suggestion?.weight).toBeLessThan(100); // Should be less than previous
      expect(suggestion?.reasoning).toContain('recovery');
    });

    it('should increase weight when RPE is low and recovery is good', () => {
      const lastWorkout = createMockExerciseLog('barbell-squat', [
        createMockSetLog(100, 8, 6), // Low RPE - user has more in tank
      ]);

      const suggestion = getExerciseSuggestion({
        exerciseId: 'barbell-squat',
        lastWorkout,
        dailyLog: createMockDailyLog(8), // Good sleep
        history: [],
        currentSessionStart: Date.now(),
        experienceLevel: 'Intermediate',
      });

      expect(suggestion).not.toBeNull();
      expect(suggestion?.weight).toBeGreaterThan(100);
      expect(suggestion?.confidence).toBe('high');
    });

    it('should maintain weight when RPE is very high', () => {
      const lastWorkout = createMockExerciseLog('barbell-squat', [
        createMockSetLog(100, 8, 9.5), // Very high RPE
      ]);

      const suggestion = getExerciseSuggestion({
        exerciseId: 'barbell-squat',
        lastWorkout,
        dailyLog: createMockDailyLog(7),
        history: [],
        currentSessionStart: Date.now(),
        experienceLevel: 'Intermediate',
      });

      expect(suggestion).not.toBeNull();
      expect(suggestion?.weight).toBe(100); // Should maintain
      expect(suggestion?.reasoning).toContain('RPE');
    });
  });

  describe('getBatchSuggestions', () => {
    it('should return suggestions for multiple exercises', () => {
      const workout = createMockWorkoutSession(
        [
          createMockExerciseLog('barbell-squat', [createMockSetLog(100, 8, 7)]),
          createMockExerciseLog('bench-press', [createMockSetLog(80, 10, 7)]),
          createMockExerciseLog('deadlift', [createMockSetLog(120, 5, 8)]),
        ],
        Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
      );

      const suggestions = getBatchSuggestions(
        ['barbell-squat', 'bench-press', 'deadlift'],
        {
          dailyLog: createMockDailyLog(7),
          history: [workout],
          currentSessionStart: Date.now(),
          experienceLevel: 'Intermediate',
        }
      );

      expect(suggestions.size).toBe(3);
      expect(suggestions.get('barbell-squat')).not.toBeNull();
      expect(suggestions.get('bench-press')).not.toBeNull();
      expect(suggestions.get('deadlift')).not.toBeNull();
    });

    it('should return null for exercises with no history', () => {
      const suggestions = getBatchSuggestions(
        ['barbell-squat', 'bench-press'],
        {
          dailyLog: createMockDailyLog(7),
          history: [],
          currentSessionStart: Date.now(),
          experienceLevel: 'Intermediate',
        }
      );

      expect(suggestions.size).toBe(2);
      expect(suggestions.get('barbell-squat')).toBeNull();
      expect(suggestions.get('bench-press')).toBeNull();
    });
  });

  describe('createSuggestionFeedback', () => {
    it('should mark as accepted when actual weight matches suggestion', () => {
      const suggestion: ProgressiveSuggestion = {
        weight: 100,
        reps: [8, 10],
        reasoning: 'Test',
        confidence: 'high',
        recoveryScore: 8,
      };

      const feedback = createSuggestionFeedback('barbell-squat', suggestion, 100, 8);

      expect(feedback.accepted).toBe(true);
      expect(feedback.exerciseId).toBe('barbell-squat');
      expect(feedback.suggestedWeight).toBe(100);
      expect(feedback.actualWeight).toBe(100);
      expect(feedback.actualReps).toBe(8);
    });

    it('should mark as not accepted when actual weight differs from suggestion', () => {
      const suggestion: ProgressiveSuggestion = {
        weight: 100,
        reps: [8, 10],
        reasoning: 'Test',
        confidence: 'high',
        recoveryScore: 8,
      };

      const feedback = createSuggestionFeedback('barbell-squat', suggestion, 105, 8);

      expect(feedback.accepted).toBe(false);
      expect(feedback.actualWeight).toBe(105);
    });

    it('should include timestamp and confidence', () => {
      const suggestion: ProgressiveSuggestion = {
        weight: 100,
        reps: [8, 10],
        reasoning: 'Test',
        confidence: 'medium',
        recoveryScore: 8,
      };

      const before = Date.now();
      const feedback = createSuggestionFeedback('barbell-squat', suggestion, 100, 8);
      const after = Date.now();

      expect(feedback.timestamp).toBeGreaterThanOrEqual(before);
      expect(feedback.timestamp).toBeLessThanOrEqual(after);
      expect(feedback.confidence).toBe('medium');
    });
  });

  describe('formatSuggestion', () => {
    it('should format suggestion with range', () => {
      const suggestion: ProgressiveSuggestion = {
        weight: 185,
        reps: [8, 10],
        reasoning: 'Test',
        confidence: 'high',
        recoveryScore: 8,
      };

      expect(formatSuggestion(suggestion, 'lbs')).toBe('185 lbs × 8-10 reps');
      expect(formatSuggestion(suggestion, 'kg')).toBe('185 kg × 8-10 reps');
    });

    it('should format suggestion with single rep count', () => {
      const suggestion: ProgressiveSuggestion = {
        weight: 100,
        reps: [5, 5],
        reasoning: 'Test',
        confidence: 'high',
        recoveryScore: 8,
      };

      expect(formatSuggestion(suggestion, 'kg')).toBe('100 kg × 5 reps');
    });
  });

  describe('getConfidenceColor', () => {
    it('should return correct colors for confidence levels', () => {
      expect(getConfidenceColor('high')).toBe('#22c55e'); // green
      expect(getConfidenceColor('medium')).toBe('#eab308'); // yellow
      expect(getConfidenceColor('low')).toBe('#ef4444'); // red
    });
  });

  describe('shouldWarnUser', () => {
    it('should warn when deload is recommended', () => {
      const suggestion: ProgressiveSuggestion = {
        weight: 85,
        reps: [6, 8],
        reasoning: 'Deload recommended',
        confidence: 'high',
        recoveryScore: 4,
        shouldDeload: true,
      };

      expect(shouldWarnUser(suggestion)).toBe(true);
    });

    it('should warn when confidence is low', () => {
      const suggestion: ProgressiveSuggestion = {
        weight: 100,
        reps: [8, 10],
        reasoning: 'Insufficient data',
        confidence: 'low',
        recoveryScore: 8,
      };

      expect(shouldWarnUser(suggestion)).toBe(true);
    });

    it('should warn when recovery score is very low', () => {
      const suggestion: ProgressiveSuggestion = {
        weight: 100,
        reps: [8, 10],
        reasoning: 'Low recovery',
        confidence: 'high',
        recoveryScore: 3,
      };

      expect(shouldWarnUser(suggestion)).toBe(true);
    });

    it('should not warn when all indicators are good', () => {
      const suggestion: ProgressiveSuggestion = {
        weight: 105,
        reps: [8, 10],
        reasoning: 'Good to go',
        confidence: 'high',
        recoveryScore: 8,
        shouldDeload: false,
      };

      expect(shouldWarnUser(suggestion)).toBe(false);
    });
  });
});
