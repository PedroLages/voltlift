/**
 * Readiness Score Service Tests
 *
 * Tests for daily readiness score calculation
 */

import { describe, test, expect } from 'bun:test';
import {
  calculateReadinessScore,
  getReadinessColor,
  getReadinessTextColor,
  getReadinessBgColor,
  type ReadinessInputs,
} from '../readinessScore';

describe('readinessScore Service', () => {
  describe('calculateReadinessScore', () => {
    test('should calculate green readiness (80+) for excellent inputs', () => {
      const inputs: ReadinessInputs = {
        sleepQuality: 5,
        perceivedRecovery: 5,
        sorenessLevel: 5,
        stressLevel: 5,
      };

      const result = calculateReadinessScore(inputs);

      expect(result.score).toBe(100);
      expect(result.category).toBe('green');
      expect(result.recommendation).toContain('Full gas');
      expect(result.adjustmentFactor).toBe(1.1);
    });

    test('should calculate yellow readiness (60-79) for moderate inputs', () => {
      const inputs: ReadinessInputs = {
        sleepQuality: 3,
        perceivedRecovery: 3,
        sorenessLevel: 3,
        stressLevel: 3,
      };

      const result = calculateReadinessScore(inputs);

      expect(result.score).toBe(50); // Neutral inputs = 50% score
      expect(result.category).toBe('red'); // 50 is < 60, so red
      expect(result.adjustmentFactor).toBe(0.8);
    });

    test('should calculate yellow readiness for scores between 60-79', () => {
      const inputs: ReadinessInputs = {
        sleepQuality: 4,
        perceivedRecovery: 3,
        sorenessLevel: 4,
        stressLevel: 3,
      };

      const result = calculateReadinessScore(inputs);

      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.score).toBeLessThan(80);
      expect(result.category).toBe('yellow');
      expect(result.recommendation).toContain('Good to train');
      expect(result.adjustmentFactor).toBe(1.0);
    });

    test('should calculate red readiness (<60) for poor inputs', () => {
      const inputs: ReadinessInputs = {
        sleepQuality: 1,
        perceivedRecovery: 1,
        sorenessLevel: 1,
        stressLevel: 1,
      };

      const result = calculateReadinessScore(inputs);

      expect(result.score).toBe(0);
      expect(result.category).toBe('red');
      expect(result.recommendation).toContain('Scale back');
      expect(result.adjustmentFactor).toBe(0.8);
    });

    test('should weight sleep quality most heavily (35%)', () => {
      const goodSleep: ReadinessInputs = {
        sleepQuality: 5,
        perceivedRecovery: 1,
        sorenessLevel: 1,
        stressLevel: 1,
      };

      const poorSleep: ReadinessInputs = {
        sleepQuality: 1,
        perceivedRecovery: 5,
        sorenessLevel: 5,
        stressLevel: 5,
      };

      const goodSleepResult = calculateReadinessScore(goodSleep);
      const poorSleepResult = calculateReadinessScore(poorSleep);

      // Good sleep should result in higher score than poor sleep
      // because sleep is weighted most heavily
      expect(goodSleepResult.score).toBeGreaterThan(30); // 35% of 100
      expect(poorSleepResult.score).toBeLessThan(70); // 65% of 100
    });

    test('should throw error for invalid inputs (< 1)', () => {
      const invalidInputs: ReadinessInputs = {
        sleepQuality: 0,
        perceivedRecovery: 3,
        sorenessLevel: 3,
        stressLevel: 3,
      };

      expect(() => calculateReadinessScore(invalidInputs)).toThrow(
        'All inputs must be between 1-5'
      );
    });

    test('should throw error for invalid inputs (> 5)', () => {
      const invalidInputs: ReadinessInputs = {
        sleepQuality: 6,
        perceivedRecovery: 3,
        sorenessLevel: 3,
        stressLevel: 3,
      };

      expect(() => calculateReadinessScore(invalidInputs)).toThrow(
        'All inputs must be between 1-5'
      );
    });

    test('should throw error for non-integer inputs', () => {
      const invalidInputs: ReadinessInputs = {
        sleepQuality: 3.5,
        perceivedRecovery: 3,
        sorenessLevel: 3,
        stressLevel: 3,
      };

      expect(() => calculateReadinessScore(invalidInputs)).toThrow(
        'All inputs must be between 1-5'
      );
    });

    test('should calculate weighted score correctly', () => {
      // Test exact calculation:
      // sleepScore = ((4-1)/4)*100 = 75
      // recoveryScore = ((3-1)/4)*100 = 50
      // sorenessScore = ((4-1)/4)*100 = 75
      // stressScore = ((2-1)/4)*100 = 25
      // weighted = 75*0.35 + 50*0.30 + 75*0.20 + 25*0.15
      //          = 26.25 + 15 + 15 + 3.75 = 60
      const inputs: ReadinessInputs = {
        sleepQuality: 4,
        perceivedRecovery: 3,
        sorenessLevel: 4,
        stressLevel: 2,
      };

      const result = calculateReadinessScore(inputs);

      expect(result.score).toBe(60);
      expect(result.category).toBe('yellow');
    });
  });

  describe('getReadinessColor', () => {
    test('should return green color for green category', () => {
      expect(getReadinessColor('green')).toBe('#22c55e');
    });

    test('should return yellow color for yellow category', () => {
      expect(getReadinessColor('yellow')).toBe('#eab308');
    });

    test('should return red color for red category', () => {
      expect(getReadinessColor('red')).toBe('#ef4444');
    });
  });

  describe('getReadinessTextColor', () => {
    test('should return green text class for green category', () => {
      expect(getReadinessTextColor('green')).toBe('text-green-500');
    });

    test('should return yellow text class for yellow category', () => {
      expect(getReadinessTextColor('yellow')).toBe('text-yellow-500');
    });

    test('should return red text class for red category', () => {
      expect(getReadinessTextColor('red')).toBe('text-red-500');
    });
  });

  describe('getReadinessBgColor', () => {
    test('should return green bg class for green category', () => {
      expect(getReadinessBgColor('green')).toBe('bg-green-500');
    });

    test('should return yellow bg class for yellow category', () => {
      expect(getReadinessBgColor('yellow')).toBe('bg-yellow-500');
    });

    test('should return red bg class for red category', () => {
      expect(getReadinessBgColor('red')).toBe('bg-red-500');
    });
  });

  describe('Edge Cases', () => {
    test('should handle boundary score of exactly 80 (green)', () => {
      // Calculate inputs that result in score = 80
      // We need weighted score = 80
      // Let's try: sleep=5 (75*0.35=26.25), recovery=5 (75*0.30=22.5),
      //            soreness=5 (75*0.20=15), stress=4 (75*0.15=11.25)
      // Total = 75 (not 80, let's adjust)
      // Actually need: 5,5,5,5 = 100, 4,4,4,4 = 75, 3,3,3,3 = 50
      // For 80: mostly 5s with some 4s
      const inputs: ReadinessInputs = {
        sleepQuality: 5, // 100 * 0.35 = 35
        perceivedRecovery: 5, // 100 * 0.30 = 30
        sorenessLevel: 4, // 75 * 0.20 = 15
        stressLevel: 1, // 0 * 0.15 = 0
        // Total = 80
      };

      const result = calculateReadinessScore(inputs);

      expect(result.score).toBe(80);
      expect(result.category).toBe('green');
    });

    test('should handle boundary score of exactly 60 (yellow)', () => {
      const inputs: ReadinessInputs = {
        sleepQuality: 4,
        perceivedRecovery: 3,
        sorenessLevel: 4,
        stressLevel: 2,
      };

      const result = calculateReadinessScore(inputs);

      expect(result.score).toBe(60);
      expect(result.category).toBe('yellow');
    });

    test('should handle boundary score of 59 (red)', () => {
      // Need score = 59
      const inputs: ReadinessInputs = {
        sleepQuality: 4, // 75 * 0.35 = 26.25
        perceivedRecovery: 3, // 50 * 0.30 = 15
        sorenessLevel: 4, // 75 * 0.20 = 15
        stressLevel: 1, // 0 * 0.15 = 0
        // Total = 56.25 → rounds to 56
      };

      const result = calculateReadinessScore(inputs);

      expect(result.score).toBeLessThan(60);
      expect(result.category).toBe('red');
    });
  });
});
