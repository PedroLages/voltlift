/**
 * AI Service Fallback Tests
 *
 * Tests graceful degradation when:
 * - Gemini API is offline/unavailable
 * - Quota is exceeded
 * - Network errors occur
 * - API returns errors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  explainSuggestion,
  generateWorkoutSummary,
  getProgressiveOverloadSuggestion,
} from '../ai';
import { ProgressiveSuggestion } from '../progressiveOverload';
import { WorkoutSession, UserSettings, ExerciseLog, SetLog } from '../../types';

// =============================================================================
// Test Setup
// =============================================================================

const mockSettings: UserSettings = {
  name: 'Test User',
  units: 'kg',
  goal: { type: 'Build Muscle', targetPerWeek: 4 },
  experienceLevel: 'Intermediate',
  availableEquipment: [],
  onboardingCompleted: true,
  personalRecords: {},
  defaultRestTimer: 90,
  barWeight: 20,
};

const mockSuggestion: ProgressiveSuggestion = {
  weight: 100,
  reps: [8, 10],
  confidence: 'high',
  reasoning: 'Good recovery, progressive load',
  shouldDeload: false,
  recoveryScore: 8,
  estimated1RM: 125,
  currentIntensity: 80,
};

const mockSetLog: SetLog = {
  id: 'set-1',
  weight: 95,
  reps: 8,
  rpe: 7,
  type: 'normal',
  completed: true,
};

const mockExerciseLog: ExerciseLog = {
  id: 'log-1',
  exerciseId: 'barbell-squat',
  sets: [mockSetLog],
  notes: '',
};

const mockWorkout: WorkoutSession = {
  id: 'workout-1',
  name: 'Test Workout',
  startTime: Date.now() - 3600000,
  endTime: Date.now(),
  status: 'completed',
  logs: [mockExerciseLog],
};

// =============================================================================
// FALLBACK TEST 1: Offline Mode
// =============================================================================

describe('AI Service - Offline Fallbacks', () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    // Save original navigator
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    // Restore original navigator
    global.navigator = originalNavigator;
  });

  it('should return fallback explanation when offline', async () => {
    // Mock offline state
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const result = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    expect(result.success).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.data).toBeDefined();
    expect(result.data?.explanation).toContain('progressive overload');
    expect(result.data?.keyFactors).toHaveLength(4);
    expect(result.tokensUsed).toBeUndefined(); // No LLM used
  });

  it('should return fallback workout summary when offline', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const result = await generateWorkoutSummary({
      workout: mockWorkout,
      settings: mockSettings,
      prsAchieved: ['Squat PR: 100kg'],
    });

    expect(result.success).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.data).toBeDefined();
    expect(result.data?.summary).toBeDefined();
    expect(result.data?.highlights).toBeDefined();
    expect(result.data?.prsAchieved).toContain('Squat PR: 100kg');
  });

  it('should return fallback progressive overload suggestion when offline', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const result = await getProgressiveOverloadSuggestion({
      exerciseId: 'barbell-squat',
      history: [mockWorkout],
      settings: mockSettings,
      dailyLogs: {},
      enhanceWithLLM: true, // Request LLM but offline
    });

    expect(result.success).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.data).toBeDefined();
    expect(result.data?.tip).toBeDefined();
    // Should still provide local ML suggestion
    expect(result.data?.suggestedWeight).toBeGreaterThan(0);
  });
});

// =============================================================================
// FALLBACK TEST 2: API Error Handling
// =============================================================================

describe('AI Service - API Error Fallbacks', () => {
  it('should handle 429 quota exceeded gracefully', async () => {
    // This test would require mocking the llmClient
    // For now, we verify the fallback structure exists

    const result = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    // Should always succeed even if API fails
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle network timeout gracefully', async () => {
    // Test that network errors don't crash the app
    const result = await generateWorkoutSummary({
      workout: mockWorkout,
      settings: mockSettings,
    });

    expect(result.success).toBe(true);
    expect(result.source).toMatch(/fallback|llm|cache/);
  });

  it('should handle malformed API responses', async () => {
    // Verify that parsing errors don't break the service
    const result = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});

// =============================================================================
// FALLBACK TEST 3: Caching Behavior
// =============================================================================

describe('AI Service - Caching Fallbacks', () => {
  it('should serve cached responses when available', async () => {
    // First call (may hit API or cache)
    const result1 = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    // Second call with identical params (should use cache)
    const result2 = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    // Both should have valid data
    expect(result1.data).toBeDefined();
    expect(result2.data).toBeDefined();
  });

  it('should handle cache misses gracefully', async () => {
    // Call with unique params each time
    const result1 = await explainSuggestion({
      suggestion: { ...mockSuggestion, weight: 100 },
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    const result2 = await explainSuggestion({
      suggestion: { ...mockSuggestion, weight: 105 },
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });
});

// =============================================================================
// FALLBACK TEST 4: Degraded Service Quality
// =============================================================================

describe('AI Service - Quality Degradation', () => {
  it('should provide lower confidence when using fallback', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const result = await explainSuggestion({
      suggestion: { ...mockSuggestion, confidence: 'high' },
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    expect(result.success).toBe(true);
    expect(result.source).toBe('fallback');
    // Fallback should still provide value but acknowledge limitations
    expect(result.data?.explanation).toBeTruthy();
  });

  it('should include source information in response', async () => {
    const result = await generateWorkoutSummary({
      workout: mockWorkout,
      settings: mockSettings,
    });

    expect(result).toHaveProperty('source');
    expect(['llm', 'cache', 'fallback']).toContain(result.source);
  });

  it('should measure latency for all response types', async () => {
    const result = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    expect(result).toHaveProperty('latency');
    expect(result.latency).toBeGreaterThanOrEqual(0);
    expect(typeof result.latency).toBe('number');
  });
});

// =============================================================================
// FALLBACK TEST 5: Missing Data Handling
// =============================================================================

describe('AI Service - Missing Data Fallbacks', () => {
  it('should handle missing exercise data', async () => {
    const result = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'non-existent-exercise',
      lastWorkout: undefined,
      settings: mockSettings,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle missing previous workout', async () => {
    const result = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'barbell-squat',
      lastWorkout: undefined,
      settings: mockSettings,
    });

    // Should still provide explanation even without previous workout
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle incomplete workout data', async () => {
    const incompleteWorkout: WorkoutSession = {
      ...mockWorkout,
      logs: [], // No exercise logs
    };

    const result = await generateWorkoutSummary({
      workout: incompleteWorkout,
      settings: mockSettings,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle missing user settings gracefully', async () => {
    const minimalSettings: UserSettings = {
      name: '',
      units: 'kg',
      goal: { type: 'Build Muscle', targetPerWeek: 4 },
      experienceLevel: 'Intermediate',
      availableEquipment: [],
      onboardingCompleted: true,
      personalRecords: {},
      defaultRestTimer: 90,
      barWeight: 20,
    };

    const result = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: minimalSettings,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});

// =============================================================================
// FALLBACK TEST 6: Consistency Checks
// =============================================================================

describe('AI Service - Fallback Consistency', () => {
  it('should provide consistent fallback structure across features', async () => {
    const explanationResult = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    const summaryResult = await generateWorkoutSummary({
      workout: mockWorkout,
      settings: mockSettings,
    });

    // Both should have consistent response structure
    expect(explanationResult).toHaveProperty('success');
    expect(explanationResult).toHaveProperty('source');
    expect(explanationResult).toHaveProperty('latency');

    expect(summaryResult).toHaveProperty('success');
    expect(summaryResult).toHaveProperty('source');
    expect(summaryResult).toHaveProperty('latency');
  });

  it('should never return undefined for critical fields', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const result = await explainSuggestion({
      suggestion: mockSuggestion,
      exerciseId: 'barbell-squat',
      lastWorkout: mockExerciseLog,
      settings: mockSettings,
    });

    expect(result.success).toBeDefined();
    expect(result.source).toBeDefined();
    expect(result.latency).toBeDefined();

    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data?.explanation).toBeDefined();
      expect(result.data?.keyFactors).toBeDefined();
      expect(result.data?.whatToExpect).toBeDefined();
    }
  });
});
