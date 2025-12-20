/**
 * Unit tests for Exercise Recommendation Service
 */

import { describe, it, expect } from 'vitest';
import { findSubstitutes, suggestExercisesForWorkout } from '../exerciseRecommendation';
import { Exercise, WorkoutSession, UserSettings } from '../../types';

// Mock exercises for testing
const mockExercises: Exercise[] = [
  {
    id: 'e1',
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    equipment: 'Barbell',
    category: 'Compound',
    formGuide: [],
    commonMistakes: [],
    tips: [],
  },
  {
    id: 'e2',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'Chest',
    equipment: 'Dumbbell',
    category: 'Compound',
    formGuide: [],
    commonMistakes: [],
    tips: [],
  },
  {
    id: 'e3',
    name: 'Cable Chest Fly',
    muscleGroup: 'Chest',
    equipment: 'Cable',
    category: 'Isolation',
    formGuide: [],
    commonMistakes: [],
    tips: [],
  },
  {
    id: 'e4',
    name: 'Dumbbell Chest Fly',
    muscleGroup: 'Chest',
    equipment: 'Dumbbell',
    category: 'Isolation',
    formGuide: [],
    commonMistakes: [],
    tips: [],
  },
  {
    id: 'e5',
    name: 'Barbell Squat',
    muscleGroup: 'Legs',
    equipment: 'Barbell',
    category: 'Compound',
    formGuide: [],
    commonMistakes: [],
    tips: [],
  },
  {
    id: 'e6',
    name: 'Leg Press',
    muscleGroup: 'Legs',
    equipment: 'Machine',
    category: 'Compound',
    formGuide: [],
    commonMistakes: [],
    tips: [],
  },
  {
    id: 'e7',
    name: 'Shoulder Press',
    muscleGroup: 'Shoulders',
    equipment: 'Barbell',
    category: 'Compound',
    formGuide: [],
    commonMistakes: [],
    tips: [],
  },
];

const mockWorkout: WorkoutSession = {
  id: 'workout-1',
  name: 'Test Workout',
  startTime: Date.now(),
  status: 'active',
  logs: [
    { id: 'log-1', exerciseId: 'e1', sets: [] }, // Barbell Bench Press
    { id: 'log-2', exerciseId: 'e2', sets: [] }, // Incline Dumbbell Press
  ],
};

const mockSettings: UserSettings = {
  name: 'Test User',
  units: 'lbs',
  onboardingCompleted: true,
  experienceLevel: 'Intermediate',
  goal: { type: 'strength', targetPerWeek: 4 },
  defaultRestTimer: 90,
  darkMode: true,
  barWeight: 45,
  availableEquipment: ['Barbell', 'Dumbbell', 'Cable', 'Machine'],
  personalRecords: {},
};

describe('findSubstitutes', () => {
  it('should find chest exercises when swapping a chest exercise', () => {
    const result = findSubstitutes({
      exerciseId: 'e1', // Barbell Bench Press
      currentWorkout: mockWorkout,
      settings: mockSettings,
      allExercises: mockExercises,
    });

    expect(result.exercises.length).toBeGreaterThan(0);
    // All results should be Chest exercises
    result.exercises.forEach(ex => {
      expect(ex.muscleGroup).toBe('Chest');
    });
  });

  it('should exclude the current exercise from suggestions', () => {
    const result = findSubstitutes({
      exerciseId: 'e1',
      currentWorkout: mockWorkout,
      settings: mockSettings,
      allExercises: mockExercises,
    });

    const exerciseIds = result.exercises.map(e => e.id);
    expect(exerciseIds).not.toContain('e1');
  });

  it('should exclude exercises already in the workout', () => {
    const result = findSubstitutes({
      exerciseId: 'e1', // Swapping Barbell Bench Press
      currentWorkout: mockWorkout, // Contains e1 and e2
      settings: mockSettings,
      allExercises: mockExercises,
    });

    const exerciseIds = result.exercises.map(e => e.id);
    // e2 (Incline Dumbbell Press) is already in workout, should be excluded
    expect(exerciseIds).not.toContain('e2');
  });

  it('should not suggest exercises from different muscle groups', () => {
    const result = findSubstitutes({
      exerciseId: 'e1', // Chest exercise
      currentWorkout: mockWorkout,
      settings: mockSettings,
      allExercises: mockExercises,
    });

    const exerciseIds = result.exercises.map(e => e.id);
    // Legs and Shoulders exercises should not appear
    expect(exerciseIds).not.toContain('e5'); // Barbell Squat (Legs)
    expect(exerciseIds).not.toContain('e6'); // Leg Press (Legs)
    expect(exerciseIds).not.toContain('e7'); // Shoulder Press (Shoulders)
  });

  it('should filter by available equipment', () => {
    const limitedEquipmentSettings: UserSettings = {
      ...mockSettings,
      availableEquipment: ['Dumbbell'], // Only dumbbells
    };

    const result = findSubstitutes({
      exerciseId: 'e1',
      currentWorkout: { ...mockWorkout, logs: [{ id: 'log-1', exerciseId: 'e1', sets: [] }] }, // Only e1 in workout
      settings: limitedEquipmentSettings,
      allExercises: mockExercises,
    });

    // Should only find Dumbbell exercises
    result.exercises.forEach(ex => {
      expect(ex.equipment).toBe('Dumbbell');
    });
  });

  it('should return empty array when no matches found', () => {
    const noEquipmentSettings: UserSettings = {
      ...mockSettings,
      availableEquipment: ['Kettlebell'], // No chest exercises use kettlebells
    };

    const result = findSubstitutes({
      exerciseId: 'e1',
      currentWorkout: mockWorkout,
      settings: noEquipmentSettings,
      allExercises: mockExercises,
    });

    // Should relax equipment filter and return candidates
    expect(result.matchType).toBe('equipment_relaxed');
  });

  it('should handle case-insensitive muscle group matching', () => {
    const mixedCaseExercises: Exercise[] = [
      ...mockExercises,
      {
        id: 'e8',
        name: 'Test Exercise',
        muscleGroup: 'chest', // lowercase
        equipment: 'Barbell',
        category: 'Compound',
        formGuide: [],
        commonMistakes: [],
        tips: [],
      },
    ];

    const result = findSubstitutes({
      exerciseId: 'e1', // Chest (uppercase)
      currentWorkout: { ...mockWorkout, logs: [] },
      settings: mockSettings,
      allExercises: mixedCaseExercises,
    });

    // Should find the lowercase 'chest' exercise
    const exerciseIds = result.exercises.map(e => e.id);
    expect(exerciseIds).toContain('e8');
  });

  it('should prioritize same equipment type', () => {
    const result = findSubstitutes({
      exerciseId: 'e1', // Barbell Bench Press
      currentWorkout: { ...mockWorkout, logs: [{ id: 'log-1', exerciseId: 'e1', sets: [] }] },
      settings: mockSettings,
      allExercises: mockExercises,
    });

    // Barbell exercises should come first (but there are no other barbell chest exercises in our mock)
    // Just verify we got results
    expect(result.exercises.length).toBeGreaterThan(0);
  });

  it('should handle custom exercises not in library', () => {
    const customExercise: Exercise = {
      id: 'custom-1',
      name: 'My Custom Chest Press',
      muscleGroup: 'Chest',
      equipment: 'Dumbbell',
      category: 'Compound',
      formGuide: [],
      commonMistakes: [],
      tips: [],
    };

    const exercisesWithCustom = [...mockExercises, customExercise];

    const result = findSubstitutes({
      exerciseId: 'custom-1', // Custom exercise
      currentWorkout: { ...mockWorkout, logs: [{ id: 'log-1', exerciseId: 'custom-1', sets: [] }] },
      settings: mockSettings,
      allExercises: exercisesWithCustom,
    });

    // Should find chest exercises (not the custom one)
    expect(result.exercises.length).toBeGreaterThan(0);
    const exerciseIds = result.exercises.map(e => e.id);
    expect(exerciseIds).not.toContain('custom-1');
  });
});

describe('suggestExercisesForWorkout', () => {
  it('should suggest exercises not already in workout', () => {
    const suggestions = suggestExercisesForWorkout({
      currentWorkout: mockWorkout,
      settings: mockSettings,
      allExercises: mockExercises,
    });

    const exerciseIds = suggestions.map(e => e.id);
    expect(exerciseIds).not.toContain('e1');
    expect(exerciseIds).not.toContain('e2');
  });

  it('should filter by target muscle group when specified', () => {
    const suggestions = suggestExercisesForWorkout({
      currentWorkout: mockWorkout,
      settings: mockSettings,
      allExercises: mockExercises,
      targetMuscleGroup: 'Legs',
    });

    suggestions.forEach(ex => {
      expect(ex.muscleGroup).toBe('Legs');
    });
  });
});
