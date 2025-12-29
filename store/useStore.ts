
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings, WorkoutSession, ExerciseLog, SetLog, SetType, Goal, Program, DailyLog, BiometricPoint, PRType, PersonalRecord, Exercise, GamificationState, Achievement } from '../types';
import { MOCK_HISTORY, INITIAL_TEMPLATES, EXERCISE_LIBRARY, INITIAL_PROGRAMS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { backend } from '../services/backend';
import { getSuggestion, checkVolumeWarning, shouldDeloadWeek, ProgressiveSuggestion } from '../services/progressiveOverload';
import { calculate1RM, getBest1RM, classifyStrengthLevel, calculateOverallStrengthScore, OneRepMax } from '../services/strengthScore';
import { detectDefaultUnits, getDefaultBarWeight } from '../utils/geolocation';
import {
  createInitialGamificationState,
  processWorkoutCompletion,
  getRankForXP,
  getLevelProgress,
  IRON_RANKS,
  ACHIEVEMENTS,
  WorkoutXPResult,
} from '../services/gamification';

/**
 * Represents an undoable action (set or exercise deletion)
 * Used by the undo stack to restore deleted items during active workouts
 */
interface UndoableAction {
  type: 'set' | 'exercise';
  data: any;
  exerciseIndex?: number;
  setIndex?: number;
  logId?: string;
  timestamp: number;
}

/**
 * VoltLift Global Application State
 *
 * Manages all app state via Zustand with localStorage persistence.
 * State is automatically synced to cloud via backend abstraction layer.
 *
 * @see types.ts for complete type definitions
 * @see services/backend/ for cloud sync implementation
 */
interface AppState {
  /**
   * User settings and preferences
   * Includes name, units, goals, experience level, equipment, personal records, and active program
   * @see UserSettings type definition
   */
  settings: UserSettings;

  /**
   * Workout history (completed sessions only)
   *
   * IMPORTANT: Property was renamed from `workoutHistory` to `history` in v7 migration
   * @see Migration v7 (line 1715) for rename details
   * @see WorkoutSession type with status: 'completed'
   * @example
   * history.filter(w => w.status === 'completed')
   */
  history: WorkoutSession[];

  /**
   * Workout templates for quick start
   *
   * Templates are WorkoutSession objects with status: 'template'
   * Starting a workout from a template creates a copy with sourceTemplateId tracking
   * @see WorkoutSession type with status: 'template'
   * @see startWorkout() action for template usage
   */
  templates: WorkoutSession[];

  /**
   * Multi-week workout programs
   *
   * Programs contain sequences of sessions (templateIds) with progression logic
   * Active program state tracked in settings.activeProgram
   * @see Program type definition
   * @see activateProgram() action
   */
  programs: Program[];

  /**
   * Currently active workout session (null when not training)
   *
   * Set to null when workout is finished, saved as draft, or cancelled
   * @see startWorkout(), finishWorkout(), saveDraft(), cancelWorkout() actions
   */
  activeWorkout: WorkoutSession | null;

  /**
   * User-created custom exercises
   * Combined with EXERCISE_LIBRARY via getAllExercises() helper
   * @see getAllExercises() for merged library
   */
  customExercises: Exercise[];

  /**
   * AI-generated exercise form diagrams
   * Maps exerciseId → base64 image URL
   * Stored in IndexedDB (VoltLiftAssets.visuals)
   * @see saveExerciseVisual(), loadVisuals() actions
   */
  customExerciseVisuals: Record<string, string>;

  /**
   * Daily wellness and biometric logs
   *
   * Keyed by ISO date string (YYYY-MM-DD format)
   * Used for smart defaults and progressive overload suggestions
   * @example
   * dailyLogs['2025-12-26'] = { sleepHours: 7, muscleSoreness: 3, ... }
   * @see DailyLog type definition
   * @see logDailyBio(), addDailyLog(), updateDailyLog() actions
   */
  dailyLogs: Record<string, DailyLog>;

  /**
   * Cloud sync status indicator
   * - 'synced': All data synced to cloud
   * - 'syncing': Sync in progress
   * - 'offline': No internet connection
   * - 'error': Sync failed
   * - 'partial': Some items failed to sync
   */
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error' | 'partial';

  /**
   * Heart rate data points collected during active workout
   * Saved to completed workout on finishWorkout()
   * @see BiometricPoint type definition
   * @see addBiometricPoint() action
   */
  activeBiometrics: BiometricPoint[];

  /**
   * Dirty tracking for incremental cloud sync
   *
   * Tracks which items need to be synced to backend
   * Sets are cleared after successful sync
   * @see syncData() action for sync implementation
   */
  pendingSyncWorkouts: Set<string>;
  pendingSyncTemplates: Set<string>;
  pendingSyncPrograms: Set<string>;
  pendingSyncDailyLogs: Set<string>;
  settingsNeedsSync: boolean;

  /**
   * Sync lock to prevent concurrent sync operations
   * Set to true during syncData() execution
   */
  isSyncing: boolean;

  /**
   * Undo stack for restoring deleted sets/exercises during active workout
   * Limited to single most recent deletion
   * @see restoreLastDeleted(), clearUndoStack() actions
   */
  undoStack: UndoableAction | null;

  /**
   * Rest timer state
   * restTimerStart: Timestamp when timer started (null if not active)
   * restDuration: Target rest duration in seconds
   * @see startRestTimer(), stopRestTimer() actions
   */
  restTimerStart: number | null;
  restDuration: number;

  /**
   * Gamification system state
   *
   * Tracks XP, level, streaks, and unlocked achievements
   * Updated automatically on workout completion
   * @see GamificationState type definition
   * @see services/gamification.ts for XP calculation
   */
  gamification: GamificationState;

  /**
   * Last workout rewards (cleared after modals are shown)
   * Used to display XP gains and level ups after workout completion
   * @see clearLastWorkoutRewards() action
   */
  lastWorkoutXP: WorkoutXPResult | null;
  lastAchievements: Achievement[];
  lastLevelUp: boolean;
  
  // Actions
  startWorkout: (templateId?: string) => void;
  finishWorkout: () => WorkoutSession | null;
  saveDraft: () => void;
  resumeWorkout: (draftId: string) => void;
  cancelWorkout: () => void;
  addExerciseToActive: (exerciseId: string) => void;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<SetLog>) => void;
  addSet: (exerciseIndex: number) => void;
  duplicateSet: (exerciseIndex: number, setIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  restoreLastDeleted: () => void;
  clearUndoStack: () => void;
  toggleFavoriteExercise: (exerciseId: string) => void;
  createCustomExercise: (exercise: Omit<Exercise, 'id'>) => string;
  deleteCustomExercise: (exerciseId: string) => void;
  getAllExercises: () => Exercise[];
  getRestTimerForExercise: (exerciseId: string) => number;
  updateSettings: (settings: Partial<UserSettings>) => void;
  completeOnboarding: (name: string, goal: Goal, experience: 'Beginner' | 'Intermediate' | 'Advanced', equipment: string[]) => void;
  saveExerciseVisual: (exerciseId: string, url: string) => void;
  loadVisuals: () => Promise<void>;
  swapExercise: (logId: string, newExerciseId: string, persistent?: boolean) => void;
  saveTemplate: (name: string, exerciseIds: string[]) => void;
  updateTemplate: (id: string, name: string, exerciseIds: string[]) => void;
  duplicateTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  saveWorkoutAsTemplate: (workoutId: string, templateName?: string) => string | null;
  suggestNextSet: (exerciseIndex: number, setIndex: number) => void; 
  updateExerciseLog: (logId: string, updates: Partial<ExerciseLog>) => void;
  removeExerciseLog: (logId: string) => void;
  toggleSuperset: (logId: string) => void;
  updateActiveWorkout: (updates: Partial<WorkoutSession>) => void;
  activateProgram: (programId: string, selectedFrequency?: number) => void;
  saveProgram: (program: Omit<Program, 'id'>) => string;
  deleteProgram: (programId: string) => void;

  // Phase 4 Actions
  logDailyBio: (date: string, data: Partial<DailyLog>) => void;
  addDailyLog: (data: Partial<DailyLog> & { date: string }) => void;
  updateDailyLog: (date: string, data: Partial<DailyLog>) => void;
  updateBodyweight: (date: string, weight: number) => void;
  updateMeasurements: (date: string, measurements: Partial<any>) => void;
  getBodyweightTrend: (days?: number) => { date: string; weight: number }[];
  getLatestMeasurements: () => any | null;
  syncData: () => Promise<void>;
  addBiometricPoint: (point: BiometricPoint) => void;
  setBodyMetricsGoal: (goal: Partial<import('../types').BodyMetricsGoals>) => void;
  getWeightGoalProgress: () => { progress: number; current: number; target: number; remaining: number; onTrack: boolean; predictedDate: Date | null } | null;
  
  // Timer Actions
  startRestTimer: (duration?: number) => void;
  stopRestTimer: () => void;
  
  // Selectors/Helpers
  getExerciseHistory: (exerciseId: string) => ExerciseLog | undefined;
  getFatigueStatus: () => { status: 'Fresh' | 'Optimal' | 'High Fatigue', color: string, recommendation: string };

  // AI Coach Helpers
  getProgressiveSuggestion: (exerciseId: string) => ProgressiveSuggestion | null;
  getEstimated1RM: (exerciseId: string) => OneRepMax | null;
  getOverallStrengthScore: () => number;
  getVolumeWarning: (exerciseId: string) => { warning: boolean; message: string; sets: number } | null;
  checkDeloadNeeded: () => { shouldDeload: boolean; reasoning: string };

  // Data Management
  ensureInitialization: () => void; // Ensures templates/programs exist after migration
  resetAllData: () => void;

  // Gamification Actions
  getGamificationState: () => GamificationState;
  getRankInfo: () => { rank: typeof IRON_RANKS[number]; progress: number; xpToNext: number };
  clearLastWorkoutRewards: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      // Detect default units based on user's location (browser language)
      const defaultUnits = detectDefaultUnits();

      return {
        settings: {
          name: 'Athlete',
          units: defaultUnits,
          goal: { type: 'Build Muscle', targetPerWeek: 4 },
          experienceLevel: 'Beginner',
          availableEquipment: ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cable'],
          onboardingCompleted: false,
          personalRecords: {},
          defaultRestTimer: 90,
          barWeight: getDefaultBarWeight(defaultUnits),
        },
      history: MOCK_HISTORY,
      templates: INITIAL_TEMPLATES,
      programs: INITIAL_PROGRAMS,
      activeWorkout: null,
      customExercises: [],
      customExerciseVisuals: {},
      
      dailyLogs: {},
      syncStatus: 'synced',
      activeBiometrics: [],

      // Initialize dirty tracking
      pendingSyncWorkouts: new Set<string>(),
      pendingSyncTemplates: new Set<string>(),
      pendingSyncPrograms: new Set<string>(),
      pendingSyncDailyLogs: new Set<string>(),
      settingsNeedsSync: false,
      isSyncing: false,

      undoStack: null,

      restTimerStart: null,
      restDuration: 90,

      // Gamification
      gamification: createInitialGamificationState(),
      lastWorkoutXP: null,
      lastAchievements: [],
      lastLevelUp: false,

      startWorkout: (templateId) => {
        let newWorkout: WorkoutSession;

        if (templateId) {
          const template = get().templates.find(t => t.id === templateId);
          if (template) {
            // Find the most recent completed workout from this template
            const previousWorkout = get().history
              .filter(w => w.sourceTemplateId === templateId && w.status === 'completed')
              .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];

            newWorkout = {
              ...template,
              id: uuidv4(),
              startTime: Date.now(),
              status: 'active',
              sourceTemplateId: templateId, // Track source
              logs: template.logs.map(log => {
                // Try to find matching exercise from previous workout
                const previousLog = previousWorkout?.logs.find(l => l.exerciseId === log.exerciseId);

                if (previousLog && previousLog.sets.length > 0) {
                  // Pre-fill with previous workout data
                  return {
                    ...log,
                    id: uuidv4(),
                    sets: previousLog.sets.map(prevSet => ({
                      id: uuidv4(),
                      reps: prevSet.reps,
                      weight: prevSet.weight,
                      rpe: prevSet.rpe,
                      type: 'N' as SetType,
                      completed: false
                    }))
                  };
                } else {
                  // No previous data, use template defaults
                  return {
                    ...log,
                    id: uuidv4(),
                    sets: log.sets.map(s => ({ ...s, id: uuidv4(), completed: false, type: 'N' }))
                  };
                }
              })
            };
          } else {
             newWorkout = {
              id: uuidv4(),
              name: 'Custom Workout',
              startTime: Date.now(),
              status: 'active',
              logs: []
            };
          }
        } else {
          newWorkout = {
            id: uuidv4(),
            name: 'Quick Start Workout',
            startTime: Date.now(),
            status: 'active',
            logs: []
          };
        }

        set({ activeWorkout: newWorkout, restTimerStart: null, activeBiometrics: [] });
      },

      finishWorkout: () => {
        const { activeWorkout, history, settings, programs, activeBiometrics } = get();
        if (!activeWorkout) return null;

        const completedWorkout: WorkoutSession = {
          ...activeWorkout,
          endTime: Date.now(),
          status: 'completed',
          biometrics: activeBiometrics // Save heart rate data
        };

        // Calculate New Personal Records (Weight, Volume, Reps)
        const newPRs = { ...settings.personalRecords };
        let prUpdated = false;
        const newPRsDetected: { exerciseId: string; type: PRType; value: number }[] = [];

        completedWorkout.logs.forEach(log => {
          const validSets = log.sets.filter(s => s.completed && s.type !== 'W');
          if (validSets.length === 0) return;

          // Get or initialize exercise PR history
          const exercisePRs = newPRs[log.exerciseId] || {
            exerciseId: log.exerciseId,
            records: [],
            bestWeight: undefined,
            bestVolume: undefined,
            bestReps: undefined
          };

          const now = Date.now();

          // 1. WEIGHT PR: Max single set weight
          const maxWeightSet = validSets.reduce((max, set) =>
            set.weight > max.weight ? set : max, validSets[0]
          );
          const maxWeight = maxWeightSet.weight;
          const currentBestWeight = exercisePRs.bestWeight?.value || 0;

          if (maxWeight > currentBestWeight && maxWeight > 0) {
            const weightPR: PersonalRecord = {
              value: maxWeight,
              date: now,
              type: 'weight',
              reps: maxWeightSet.reps
            };
            exercisePRs.bestWeight = weightPR;
            exercisePRs.records.unshift(weightPR);
            prUpdated = true;
            newPRsDetected.push({ exerciseId: log.exerciseId, type: 'weight', value: maxWeight });
          }

          // 2. VOLUME PR: Total weight × reps across all sets
          const totalVolume = validSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
          const currentBestVolume = exercisePRs.bestVolume?.value || 0;

          if (totalVolume > currentBestVolume && totalVolume > 0) {
            const volumePR: PersonalRecord = {
              value: totalVolume,
              date: now,
              type: 'volume',
              setDetails: validSets.map(s => ({ weight: s.weight, reps: s.reps }))
            };
            exercisePRs.bestVolume = volumePR;
            exercisePRs.records.unshift(volumePR);
            prUpdated = true;
            newPRsDetected.push({ exerciseId: log.exerciseId, type: 'volume', value: totalVolume });
          }

          // 3. REP PR: Most reps at any weight
          const maxRepsSet = validSets.reduce((max, set) =>
            set.reps > max.reps ? set : max, validSets[0]
          );
          const maxReps = maxRepsSet.reps;
          const currentBestReps = exercisePRs.bestReps?.value || 0;

          if (maxReps > currentBestReps && maxReps > 0) {
            const repPR: PersonalRecord = {
              value: maxReps,
              date: now,
              type: 'reps',
              weight: maxRepsSet.weight
            };
            exercisePRs.bestReps = repPR;
            exercisePRs.records.unshift(repPR);
            prUpdated = true;
            newPRsDetected.push({ exerciseId: log.exerciseId, type: 'reps', value: maxReps });
          }

          // Update the exercise PRs in the main record
          if (prUpdated) {
            newPRs[log.exerciseId] = exercisePRs;
          }
        });

        let newSettings = { ...settings };

        if (prUpdated) {
          newSettings.personalRecords = newPRs;
          // PRs detected and updated in personal records
        }

        // Program Progression Logic
        if (settings.activeProgram) {
            const prog = programs.find(p => p.id === settings.activeProgram?.programId);
            if (prog) {
                const currentSession = prog.sessions[settings.activeProgram.currentSessionIndex];
                // If the completed workout matches the current program step
                if (currentSession && activeWorkout.sourceTemplateId === currentSession.templateId) {
                    const nextIndex = settings.activeProgram.currentSessionIndex + 1;
                    if (nextIndex < prog.sessions.length) {
                         newSettings.activeProgram = {
                             ...settings.activeProgram,
                             currentSessionIndex: nextIndex
                         };
                    } else {
                        // Program Finished - could handle this more gracefully (e.g., set status to completed)
                        // For now, just remove it or keep at last index
                         newSettings.activeProgram = undefined; 
                    }
                }
            }
        }

        // Mark workout as dirty for sync
        const newPendingWorkouts = new Set(get().pendingSyncWorkouts);
        newPendingWorkouts.add(completedWorkout.id);

        // =========== GAMIFICATION PROCESSING ===========
        // Calculate total workout volume for gamification
        const workoutVolume = completedWorkout.logs.reduce((total, log) => {
          return total + log.sets
            .filter(s => s.completed && s.type !== 'W')
            .reduce((sum, set) => sum + (set.weight * set.reps), 0);
        }, 0);

        // Count PRs hit (only weight PRs count as "true" PRs for gamification)
        const prsHit = newPRsDetected.filter(pr => pr.type === 'weight').length;

        // Process workout through gamification system with error handling
        let gamificationResult;
        try {
          gamificationResult = processWorkoutCompletion(
            get().gamification,
            completedWorkout,
            prsHit,
            workoutVolume
          );
        } catch (error) {
          console.error('Gamification calculation failed:', error);
          // Fallback: Create minimal XP result to prevent black screen
          const fallbackXP: WorkoutXPResult = {
            baseXP: 50,
            bonuses: [],
            totalXP: 50,
            breakdown: 'Error calculating XP - using fallback value'
          };
          gamificationResult = {
            newState: get().gamification,
            xpEarned: fallbackXP,
            newAchievements: [],
            leveledUp: false
          };
        }
        // =========== END GAMIFICATION ===========

        set({
          settings: newSettings,
          history: [completedWorkout, ...history],
          activeWorkout: null,
          restTimerStart: null,
          activeBiometrics: [],
          pendingSyncWorkouts: newPendingWorkouts,
          settingsNeedsSync: prUpdated || settings.activeProgram !== newSettings.activeProgram,
          // Gamification updates
          gamification: gamificationResult.newState,
          lastWorkoutXP: gamificationResult.xpEarned,
          lastAchievements: gamificationResult.newAchievements,
          lastLevelUp: gamificationResult.leveledUp,
        });

        // Auto Sync on finish
        get().syncData();

        // Return the completed workout for immediate use
        return completedWorkout;
      },

      saveDraft: () => {
        const { activeWorkout, history, activeBiometrics } = get();
        if (!activeWorkout) return;

        const draftWorkout: WorkoutSession = {
          ...activeWorkout,
          endTime: Date.now(),
          status: 'draft',
          biometrics: activeBiometrics
        };

        set({
          history: [draftWorkout, ...history],
          activeWorkout: null,
          restTimerStart: null,
          activeBiometrics: []
        });
      },

      resumeWorkout: (draftId) => {
        const { history } = get();
        const draft = history.find(h => h.id === draftId && h.status === 'draft');

        if (!draft) return;

        // Remove draft from history and set as active
        const newHistory = history.filter(h => h.id !== draftId);

        set({
          activeWorkout: {
            ...draft,
            status: 'active',
            endTime: undefined
          },
          history: newHistory,
          activeBiometrics: draft.biometrics || []
        });
      },

      cancelWorkout: () => {
        set({ activeWorkout: null, restTimerStart: null, activeBiometrics: [] });
      },

      addExerciseToActive: (exerciseId) => {
        const { activeWorkout } = get();

        if (!activeWorkout) {
          return;
        }

        const newLog: ExerciseLog = {
          id: uuidv4(),
          exerciseId,
          sets: [
            { id: uuidv4(), reps: 0, weight: 0, completed: false, type: 'N' }
          ]
        };

        set({
          activeWorkout: {
            ...activeWorkout,
            logs: [...activeWorkout.logs, newLog]
          }
        });
      },

      updateSet: (exerciseIndex, setIndex, updates) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const newLogs = [...activeWorkout.logs];
        const currentExercise = newLogs[exerciseIndex];
        const newSets = [...currentExercise.sets];
        newSets[setIndex] = { ...newSets[setIndex], ...updates };
        
        // Auto-fill next set with SAME weight (straight sets pattern)
        // Progressive overload applies between workouts, not within the same workout
        if (updates.completed === true && setIndex < newSets.length - 1) {
            const currentSet = newSets[setIndex];
            const nextSet = newSets[setIndex + 1];

            // Only auto-fill if next set is empty (weight = 0)
            if (!nextSet.completed && nextSet.weight === 0) {
                // Use SAME weight and reps for all working sets (straight sets)
                newSets[setIndex + 1] = {
                    ...nextSet,
                    weight: currentSet.weight,  // Same weight for straight sets
                    reps: currentSet.reps       // Same rep target
                };
            }
        }

        newLogs[exerciseIndex] = { ...currentExercise, sets: newSets };
        set({ activeWorkout: { ...activeWorkout, logs: newLogs } });
      },

      addSet: (exerciseIndex) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const newLogs = [...activeWorkout.logs];
        const previousSet = newLogs[exerciseIndex].sets[newLogs[exerciseIndex].sets.length - 1];
        
        newLogs[exerciseIndex].sets.push({
          id: uuidv4(),
          reps: previousSet ? previousSet.reps : 0,
          weight: previousSet ? previousSet.weight : 0,
          completed: false,
          type: 'N'
        });

        set({ activeWorkout: { ...activeWorkout, logs: newLogs } });
      },

      removeSet: (exerciseIndex, setIndex) => {
         const { activeWorkout } = get();
         if (!activeWorkout) return;

         const newLogs = [...activeWorkout.logs];
         const deletedSet = newLogs[exerciseIndex].sets[setIndex];

         // Save to undo stack before removing
         set({
           undoStack: {
             type: 'set',
             data: deletedSet,
             exerciseIndex,
             setIndex,
             timestamp: Date.now(),
           },
         });

         newLogs[exerciseIndex].sets.splice(setIndex, 1);
         set({ activeWorkout: { ...activeWorkout, logs: newLogs } });
      },

      duplicateSet: (exerciseIndex, setIndex) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const newLogs = [...activeWorkout.logs];
        const setToDuplicate = newLogs[exerciseIndex].sets[setIndex];

        // Create a duplicate set with a new ID
        const duplicatedSet: SetLog = {
          id: uuidv4(),
          reps: setToDuplicate.reps,
          weight: setToDuplicate.weight,
          rpe: setToDuplicate.rpe,
          type: setToDuplicate.type,
          completed: false, // New duplicate set starts uncompleted
        };

        // Insert the duplicate right after the original
        newLogs[exerciseIndex].sets.splice(setIndex + 1, 0, duplicatedSet);
        set({ activeWorkout: { ...activeWorkout, logs: newLogs } });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
          settingsNeedsSync: true
        }));
        // Trigger sync if authenticated
        get().syncData();
      },

      toggleFavoriteExercise: (exerciseId) => {
        set((state) => {
          const currentFavorites = state.settings.favoriteExercises || [];
          const isFavorite = currentFavorites.includes(exerciseId);

          const newFavorites = isFavorite
            ? currentFavorites.filter(id => id !== exerciseId)
            : [...currentFavorites, exerciseId];

          return {
            settings: {
              ...state.settings,
              favoriteExercises: newFavorites,
            },
          };
        });
      },

      createCustomExercise: (exercise) => {
        const id = `custom-${uuidv4()}`;
        const newExercise: Exercise = {
          ...exercise,
          id,
        };

        set((state) => ({
          customExercises: [...state.customExercises, newExercise],
        }));

        return id;
      },

      deleteCustomExercise: (exerciseId) => {
        set((state) => ({
          customExercises: state.customExercises.filter(ex => ex.id !== exerciseId),
        }));
      },

      getAllExercises: () => {
        const state = get();
        return [...EXERCISE_LIBRARY, ...state.customExercises];
      },

      getRestTimerForExercise: (exerciseId: string): number => {
        const { settings } = get();
        const exercise = get().getAllExercises().find(e => e.id === exerciseId);

        if (!exercise) return settings.defaultRestTimer || 90;

        // 1. Check per-exercise custom rest time (Phase 2 - not yet implemented)
        // if (exercise.customRestTime) {
        //   return exercise.customRestTime;
        // }

        // 2. Check category-specific defaults
        const categoryDefaults = settings.restTimerOptions?.customRestTimes;
        if (categoryDefaults) {
          switch (exercise.category) {
            case 'Compound':
              return categoryDefaults.compound || settings.defaultRestTimer || 90;
            case 'Isolation':
              return categoryDefaults.isolation || settings.defaultRestTimer || 90;
            case 'Cardio':
              return categoryDefaults.cardio || settings.defaultRestTimer || 90;
            default:
              break;
          }
        }

        // 3. Fall back to global default
        return settings.defaultRestTimer || 90;
      },

      completeOnboarding: (name, goal, experience, equipment) => {
        set((state) => ({
          settings: {
            ...state.settings,
            name,
            goal,
            experienceLevel: experience,
            availableEquipment: equipment,
            onboardingCompleted: true
          },
          // CRITICAL FIX: Explicitly set templates and programs to trigger Zustand persist
          // Zustand persist only writes to localStorage on set() calls, not initial state
          // Without this, users would have 0 templates and 0 programs after onboarding
          templates: state.templates.length > 0 ? state.templates : INITIAL_TEMPLATES,
          programs: state.programs.length > 0 ? state.programs : INITIAL_PROGRAMS,
          settingsNeedsSync: true
        }));
        // Sync to cloud so settings persist across devices
        get().syncData();
      },

      saveExerciseVisual: async (exerciseId, url) => {
        // Save to local state immediately
        set((state) => ({
          customExerciseVisuals: {
            ...state.customExerciseVisuals,
            [exerciseId]: url
          }
        }));

        // Upload to cloud if authenticated
        if (backend.auth.isLoggedIn) {
          try {
            await backend.storage.uploadImage(exerciseId, url);
          } catch (e) {
            console.error("Failed to save visual to cloud:", e);
          }
        }
      },

      loadVisuals: async () => {
        // If authenticated, load from cloud
        if (backend.auth.isLoggedIn) {
          try {
            const visuals = await backend.storage.getAllImages();
            if (Object.keys(visuals).length > 0) {
              set({ customExerciseVisuals: visuals });
            }
          } catch (e) {
            console.error("Failed to load visuals from cloud:", e);
          }
        }
        // Otherwise, visuals will be loaded from localStorage via persist middleware
      },

      swapExercise: (logId, newExerciseId, persistent = false) => {
        const { activeWorkout, templates } = get();
        if (!activeWorkout) return;

        // Find the old exercise ID before swapping
        const oldLog = activeWorkout.logs.find(log => log.id === logId);
        const oldExerciseId = oldLog?.exerciseId;

        const newLogs = activeWorkout.logs.map(log => {
            if (log.id === logId) {
                return {
                  ...log,
                  exerciseId: newExerciseId,
                  sets: [{ id: uuidv4(), reps: 0, weight: 0, completed: false, type: 'N' }],
                  notes: ''
                };
            }
            return log;
        });

        set({ activeWorkout: { ...activeWorkout, logs: newLogs }});

        // If persistent swap is requested and we have a source template, update the template too
        if (persistent && activeWorkout.sourceTemplateId && oldExerciseId) {
          const template = templates.find(t => t.id === activeWorkout.sourceTemplateId);
          if (template) {
            // Update the template by replacing the old exercise with the new one
            const newTemplateExerciseIds = template.logs.map(log =>
              log.exerciseId === oldExerciseId ? newExerciseId : log.exerciseId
            );

            // Mark template as pending sync
            const newPendingTemplates = new Set(get().pendingSyncTemplates);
            newPendingTemplates.add(template.id);

            set(state => ({
              templates: state.templates.map(t =>
                t.id === activeWorkout.sourceTemplateId
                  ? {
                      ...t,
                      logs: t.logs.map(log =>
                        log.exerciseId === oldExerciseId
                          ? { ...log, exerciseId: newExerciseId }
                          : log
                      )
                    }
                  : t
              ),
              pendingSyncTemplates: newPendingTemplates
            }));

            get().syncData();
          }
        }
      },
      
      suggestNextSet: (exerciseIndex, setIndex) => {
        const { activeWorkout, history, dailyLogs } = get();
        if (!activeWorkout) return;

        const exerciseLog = activeWorkout.logs[exerciseIndex];
        if (!exerciseLog) return;

        // Get previous workout data for this exercise
        const previousLog = get().getExerciseHistory(exerciseLog.exerciseId);

        // Get today's biomarkers
        const today = new Date().toISOString().split('T')[0];
        const todayLog = dailyLogs[today];

        // Get AI suggestion using offline heuristics
        const suggestion = getSuggestion(
          exerciseLog.exerciseId,
          previousLog,
          todayLog,
          history,
          activeWorkout.startTime
        );

        // Pre-fill the next set with suggested values
        const newLogs = [...activeWorkout.logs];
        const newSets = [...newLogs[exerciseIndex].sets];

        if (setIndex < newSets.length) {
          newSets[setIndex] = {
            ...newSets[setIndex],
            weight: suggestion.weight,
            reps: suggestion.reps[1], // Use upper bound of range
          };

          newLogs[exerciseIndex] = { ...newLogs[exerciseIndex], sets: newSets };
          set({ activeWorkout: { ...activeWorkout, logs: newLogs } });
        }
      }, 

      saveTemplate: (name, exerciseIds) => {
        const newTemplate: WorkoutSession = {
            id: uuidv4(),
            name,
            startTime: 0,
            status: 'template',
            logs: exerciseIds.map(exId => ({
                id: uuidv4(),
                exerciseId: exId,
                sets: [{ id: uuidv4(), reps: 10, weight: 0, completed: false, type: 'N' }]
            }))
        };

        const newPendingTemplates = new Set(get().pendingSyncTemplates);
        newPendingTemplates.add(newTemplate.id);

        set(state => ({
          templates: [...state.templates, newTemplate],
          pendingSyncTemplates: newPendingTemplates
        }));

        get().syncData();
      },

      updateTemplate: (id, name, exerciseIds) => {
        const newPendingTemplates = new Set(get().pendingSyncTemplates);
        newPendingTemplates.add(id);

        set(state => ({
          templates: state.templates.map(t =>
            t.id === id
              ? {
                  ...t,
                  name,
                  logs: exerciseIds.map((exId, idx) => {
                    // Try to preserve existing log if same exercise
                    const existingLog = t.logs.find(l => l.exerciseId === exId);
                    return existingLog || {
                      id: uuidv4(),
                      exerciseId: exId,
                      sets: [{ id: uuidv4(), reps: 10, weight: 0, completed: false, type: 'N' }]
                    };
                  })
                }
              : t
          ),
          pendingSyncTemplates: newPendingTemplates
        }));

        get().syncData();
      },

      duplicateTemplate: (id) => {
        const template = get().templates.find(t => t.id === id);
        if (!template) return;

        const newTemplate: WorkoutSession = {
          ...template,
          id: uuidv4(),
          name: `${template.name} (Copy)`,
          logs: template.logs.map(log => ({
            ...log,
            id: uuidv4(),
            sets: log.sets.map(set => ({ ...set, id: uuidv4(), completed: false }))
          }))
        };

        const newPendingTemplates = new Set(get().pendingSyncTemplates);
        newPendingTemplates.add(newTemplate.id);

        set(state => ({
          templates: [...state.templates, newTemplate],
          pendingSyncTemplates: newPendingTemplates
        }));

        get().syncData();
      },

      deleteTemplate: (id) => {
        set(state => ({ templates: state.templates.filter(t => t.id !== id) }));
      },

      saveWorkoutAsTemplate: (workoutId, templateName) => {
        const workout = get().history.find(w => w.id === workoutId);
        if (!workout) return null;

        const newTemplateId = uuidv4();
        const newTemplate: WorkoutSession = {
          id: newTemplateId,
          name: templateName || `${workout.name} (Saved)`,
          startTime: 0,
          status: 'template',
          logs: workout.logs.map(log => ({
            ...log,
            id: uuidv4(),
            // Preserve supersetId for circuit/superset groupings
            supersetId: log.supersetId,
            sets: log.sets.map(set => ({
              ...set,
              id: uuidv4(),
              completed: false,
              // Preserve weights and reps from the workout
            }))
          }))
        };

        const newPendingTemplates = new Set(get().pendingSyncTemplates);
        newPendingTemplates.add(newTemplateId);

        set(state => ({
          templates: [...state.templates, newTemplate],
          pendingSyncTemplates: newPendingTemplates
        }));

        get().syncData();
        return newTemplateId;
      },

      updateExerciseLog: (logId, updates) => {
          const { activeWorkout } = get();
          if (!activeWorkout) return;
          const newLogs = activeWorkout.logs.map(log => 
              log.id === logId ? { ...log, ...updates } : log
          );
          set({ activeWorkout: { ...activeWorkout, logs: newLogs } });
      },

      removeExerciseLog: (logId) => {
          const { activeWorkout } = get();
          if (!activeWorkout) return;

          const deletedLog = activeWorkout.logs.find(log => log.id === logId);
          if (deletedLog) {
            // Save to undo stack before removing
            set({
              undoStack: {
                type: 'exercise',
                data: deletedLog,
                logId,
                timestamp: Date.now(),
              },
            });
          }

          const newLogs = activeWorkout.logs.filter(log => log.id !== logId);
          set({ activeWorkout: { ...activeWorkout, logs: newLogs } });
      },

      restoreLastDeleted: () => {
        const { activeWorkout, undoStack } = get();
        if (!activeWorkout || !undoStack) return;

        if (undoStack.type === 'set' && undoStack.exerciseIndex !== undefined && undoStack.setIndex !== undefined) {
          // Restore deleted set
          const newLogs = [...activeWorkout.logs];
          newLogs[undoStack.exerciseIndex].sets.splice(undoStack.setIndex, 0, undoStack.data);
          set({ activeWorkout: { ...activeWorkout, logs: newLogs }, undoStack: null });
        } else if (undoStack.type === 'exercise') {
          // Restore deleted exercise
          const newLogs = [...activeWorkout.logs, undoStack.data];
          set({ activeWorkout: { ...activeWorkout, logs: newLogs }, undoStack: null });
        }
      },

      clearUndoStack: () => {
        set({ undoStack: null });
      },

      toggleSuperset: (logId) => {
          const { activeWorkout } = get();
          if (!activeWorkout) return;

          const logs = [...activeWorkout.logs];
          const index = logs.findIndex(l => l.id === logId);
          if (index === -1 || index === logs.length - 1) return;

          const current = logs[index];
          const next = logs[index + 1];

          if (current.supersetId && current.supersetId === next.supersetId) {
              const prev = index > 0 ? logs[index - 1] : null;
              if (!prev || prev.supersetId !== current.supersetId) {
                  current.supersetId = undefined;
              }
              next.supersetId = undefined;
          } else {
              const newId = current.supersetId || uuidv4();
              current.supersetId = newId;
              next.supersetId = newId;
          }

          set({ activeWorkout: { ...activeWorkout, logs } });
      },

      updateActiveWorkout: (updates) => {
          const { activeWorkout } = get();
          if (!activeWorkout) return;
          set({ activeWorkout: { ...activeWorkout, ...updates } });
      },

      activateProgram: (programId, selectedFrequency) => {
          set(state => ({
              settings: {
                  ...state.settings,
                  activeProgram: {
                      programId,
                      currentSessionIndex: 0,
                      startDate: Date.now(),
                      selectedFrequency
                  }
              }
          }));
      },

      saveProgram: (program) => {
          const newId = uuidv4();
          const newProgram: Program = {
              ...program,
              id: newId
          };

          const newPendingPrograms = new Set(get().pendingSyncPrograms);
          newPendingPrograms.add(newId);

          set(state => ({
              programs: [...state.programs, newProgram],
              pendingSyncPrograms: newPendingPrograms
          }));

          get().syncData();
          return newId;
      },

      deleteProgram: (programId) => {
          set(state => ({
              programs: state.programs.filter(p => p.id !== programId),
              // Also clear activeProgram if deleting the active one
              settings: state.settings.activeProgram?.programId === programId
                  ? { ...state.settings, activeProgram: undefined }
                  : state.settings
          }));
      },

      getExerciseHistory: (exerciseId) => {
          const { history } = get();
          const sortedHistory = [...history].sort((a, b) => b.startTime - a.startTime);
          
          for (const session of sortedHistory) {
              if (session.status !== 'completed') continue;
              const log = session.logs.find(l => l.exerciseId === exerciseId);
              if (log) return log;
          }
          return undefined;
      },
      
      startRestTimer: (duration) => {
          const defaultDuration = get().settings.defaultRestTimer || 90;
          set((state) => ({ 
              restTimerStart: Date.now(),
              restDuration: duration || defaultDuration
          }));
      },
      
      stopRestTimer: () => {
          set({ restTimerStart: null });
      },

      logDailyBio: (date, data) => {
          const newPendingDailyLogs = new Set(get().pendingSyncDailyLogs);
          newPendingDailyLogs.add(date);

          set(state => ({
              dailyLogs: {
                  ...state.dailyLogs,
                  [date]: { ...(state.dailyLogs[date] || { date }), ...data }
              },
              pendingSyncDailyLogs: newPendingDailyLogs
          }));
          get().syncData();
      },

      // Aliases for wellness check-in compatibility
      addDailyLog: (data) => {
          const { date, ...rest } = data;
          get().logDailyBio(date, rest);
      },

      updateDailyLog: (date, data) => {
          get().logDailyBio(date, data);
      },

      updateBodyweight: (date, weight) => {
          const newPendingDailyLogs = new Set(get().pendingSyncDailyLogs);
          newPendingDailyLogs.add(date);

          set(state => ({
              dailyLogs: {
                  ...state.dailyLogs,
                  [date]: { ...(state.dailyLogs[date] || { date }), bodyweight: weight }
              },
              settings: {
                  ...state.settings,
                  bodyweight: weight
              },
              pendingSyncDailyLogs: newPendingDailyLogs,
              settingsNeedsSync: true
          }));
          get().syncData();
      },

      updateMeasurements: (date, measurements) => {
          const newPendingDailyLogs = new Set(get().pendingSyncDailyLogs);
          newPendingDailyLogs.add(date);

          set(state => ({
              dailyLogs: {
                  ...state.dailyLogs,
                  [date]: {
                      ...(state.dailyLogs[date] || { date }),
                      measurements: {
                          ...(state.dailyLogs[date]?.measurements || {}),
                          ...measurements
                      }
                  }
              },
              pendingSyncDailyLogs: newPendingDailyLogs
          }));
          get().syncData();
      },

      getBodyweightTrend: (days = 30) => {
          const { dailyLogs } = get();
          const entries = Object.values(dailyLogs)
              .filter(log => log.bodyweight !== undefined)
              .map(log => ({ date: log.date, weight: log.bodyweight! }))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, days)
              .reverse();
          return entries;
      },

      getLatestMeasurements: () => {
          const { dailyLogs } = get();
          const logsWithMeasurements = Object.values(dailyLogs)
              .filter(log => log.measurements && Object.keys(log.measurements).length > 0)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return logsWithMeasurements.length > 0 ? logsWithMeasurements[0].measurements! : null;
      },

      setBodyMetricsGoal: (goal) => {
          set(state => ({
              settings: {
                  ...state.settings,
                  bodyMetricsGoals: {
                      ...state.settings.bodyMetricsGoals,
                      ...goal
                  }
              },
              settingsNeedsSync: true
          }));
          get().syncData();
      },

      getWeightGoalProgress: () => {
          const { settings, dailyLogs } = get();
          const goal = settings.bodyMetricsGoals?.targetWeight;
          if (!goal) return null;

          // Get current weight (most recent entry)
          const trend = get().getBodyweightTrend(90);
          if (trend.length === 0) return null;

          const current = trend[trend.length - 1].weight;
          const target = goal.value;
          const startWeight = goal.startWeight;

          // Calculate progress
          const totalChange = Math.abs(target - startWeight);
          const actualChange = Math.abs(current - startWeight);
          const progress = totalChange > 0 ? Math.min(100, (actualChange / totalChange) * 100) : 0;

          // Check if moving in right direction
          const movingRight = goal.direction === 'lose'
              ? current < startWeight
              : goal.direction === 'gain'
                  ? current > startWeight
                  : Math.abs(current - startWeight) < 2;

          const remaining = goal.direction === 'lose'
              ? current - target
              : target - current;

          // Predict completion date based on recent trend
          let predictedDate: Date | null = null;
          if (trend.length >= 7 && remaining > 0) {
              const weekAgo = trend[Math.max(0, trend.length - 7)].weight;
              const weeklyChange = current - weekAgo;
              if ((goal.direction === 'lose' && weeklyChange < 0) ||
                  (goal.direction === 'gain' && weeklyChange > 0)) {
                  const weeksNeeded = Math.abs(remaining / weeklyChange);
                  predictedDate = new Date(Date.now() + weeksNeeded * 7 * 24 * 60 * 60 * 1000);
              }
          }

          return {
              progress: Math.round(progress),
              current,
              target,
              remaining: Math.abs(remaining),
              onTrack: movingRight && progress > 0,
              predictedDate
          };
      },

      addBiometricPoint: (point) => {
          const { activeWorkout } = get();
          if (!activeWorkout) return;
          set(state => ({
              activeBiometrics: [...state.activeBiometrics, point]
          }));
      },

      syncData: async (retryCount = 0) => {
          // Prevent concurrent syncs
          if (get().isSyncing) {
              console.log('Sync already in progress, skipping...');
              return;
          }

          // Always show syncing status for user feedback (before auth check)
          set({ isSyncing: true, syncStatus: 'syncing' });

          // Check if user is authenticated (check both backend and auth store)
          // Import auth store to check its state
          const { useAuthStore } = await import('./useAuthStore');
          const authStoreState = useAuthStore.getState();
          let isAuthenticated = backend.auth.isLoggedIn;

          console.log('🔐 Auth check:', {
              backendLoggedIn: isAuthenticated,
              authStoreAuthenticated: authStoreState.isAuthenticated,
              authStoreLoading: authStoreState.isAuthLoading,
              user: authStoreState.user?.email || 'none',
          });

          // If backend doesn't think we're logged in, wait for auth to initialize
          // This handles the race condition where Firebase auth is still initializing
          if (!isAuthenticated && authStoreState.isAuthLoading) {
              console.log('⏳ Waiting for auth to initialize (500ms)...');
              await new Promise(resolve => setTimeout(resolve, 500));
              isAuthenticated = backend.auth.isLoggedIn;
              console.log('🔐 Auth re-check after wait:', { backendLoggedIn: isAuthenticated });
          } else if (!isAuthenticated) {
              // Short wait even if not loading, in case of race condition
              await new Promise(resolve => setTimeout(resolve, 300));
              isAuthenticated = backend.auth.isLoggedIn;
          }

          // Also check auth store as a fallback
          if (!isAuthenticated) {
              const refreshedAuthStore = useAuthStore.getState();
              isAuthenticated = refreshedAuthStore.isAuthenticated && !refreshedAuthStore.isAuthLoading;
              if (isAuthenticated) {
                  console.log('✅ Auth confirmed via auth store (fallback)');
              }
          }

          if (!isAuthenticated) {
              // User not logged in - provide feedback and exit
              await new Promise(resolve => setTimeout(resolve, 200)); // Brief delay for visual feedback
              set({
                  isSyncing: false,
                  syncStatus: 'error'
              });
              console.log('❌ Sync failed: User not authenticated');
              console.log('💡 Tip: If you just logged in, try Force Sync in Profile settings');
              return;
          }

          console.log('✅ User authenticated, proceeding with sync...');

          const {
              settings,
              history,
              templates,
              dailyLogs,
              programs,
              pendingSyncWorkouts,
              pendingSyncTemplates,
              pendingSyncPrograms,
              pendingSyncDailyLogs,
              settingsNeedsSync
          } = get();

          try {
              // Check if nothing to sync
              const nothingToSync = !settingsNeedsSync &&
                  pendingSyncWorkouts.size === 0 &&
                  pendingSyncTemplates.size === 0 &&
                  pendingSyncPrograms.size === 0 &&
                  pendingSyncDailyLogs.size === 0;

              if (nothingToSync) {
                  // Everything already synced - update lastSync and show success
                  await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for visual feedback
                  set(state => ({
                      settings: {
                          ...state.settings,
                          ironCloud: {
                              ...state.settings.ironCloud,
                              enabled: state.settings.ironCloud?.enabled || false,
                              lastSync: new Date().toISOString()
                          }
                      },
                      isSyncing: false,
                      syncStatus: 'synced'
                  }));
                  return;
              }
              const errors: string[] = [];

              // Track successfully synced items
              const syncedWorkouts = new Set<string>();
              const syncedTemplates = new Set<string>();
              const syncedPrograms = new Set<string>();
              const syncedDailyLogs = new Set<string>();
              let settingsSynced = false;

              // Sync settings if needed
              if (settingsNeedsSync) {
                  try {
                      await backend.settings.save(settings);
                      settingsSynced = true;
                  } catch (err) {
                      console.error('Settings sync failed:', err);
                      errors.push(`Settings: ${err instanceof Error ? err.message : 'Unknown error'}`);
                  }
              }

              // Sync dirty workouts (completed only)
              if (pendingSyncWorkouts.size > 0) {
                  const workoutsToSync = history.filter(w =>
                      pendingSyncWorkouts.has(w.id) && w.status === 'completed'
                  );

                  for (const workout of workoutsToSync) {
                      try {
                          await backend.workouts.create(workout);
                          syncedWorkouts.add(workout.id);
                      } catch (err) {
                          console.error(`Workout ${workout.id} sync failed:`, err);
                          errors.push(`Workout "${workout.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
                      }
                  }
              }

              // Sync dirty templates
              if (pendingSyncTemplates.size > 0) {
                  const templatesToSync = templates.filter(t => pendingSyncTemplates.has(t.id));

                  for (const template of templatesToSync) {
                      try {
                          await backend.workouts.create(template);
                          syncedTemplates.add(template.id);
                      } catch (err) {
                          console.error(`Template ${template.id} sync failed:`, err);
                          errors.push(`Template "${template.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
                      }
                  }
              }

              // Sync dirty programs
              if (pendingSyncPrograms.size > 0) {
                  const programsToSync = programs.filter(p => pendingSyncPrograms.has(p.id));

                  for (const program of programsToSync) {
                      try {
                          await backend.programs.create(program);
                          syncedPrograms.add(program.id);
                      } catch (err) {
                          console.error(`Program ${program.id} sync failed:`, err);
                          errors.push(`Program "${program.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
                      }
                  }
              }

              // Sync dirty daily logs
              if (pendingSyncDailyLogs.size > 0) {
                  const datesToSync = Array.from(pendingSyncDailyLogs);

                  for (const date of datesToSync) {
                      const log = dailyLogs[date];
                      if (log) {
                          try {
                              await backend.dailyLogs.save(date, log);
                              syncedDailyLogs.add(date);
                          } catch (err) {
                              console.error(`Daily log ${date} sync failed:`, err);
                              errors.push(`Daily log ${date}: ${err instanceof Error ? err.message : 'Unknown error'}`);
                          }
                      }
                  }
              }

              // Only clear successfully synced items from dirty tracking
              const newPendingWorkouts = new Set(pendingSyncWorkouts);
              syncedWorkouts.forEach(id => newPendingWorkouts.delete(id));

              const newPendingTemplates = new Set(pendingSyncTemplates);
              syncedTemplates.forEach(id => newPendingTemplates.delete(id));

              const newPendingPrograms = new Set(pendingSyncPrograms);
              syncedPrograms.forEach(id => newPendingPrograms.delete(id));

              const newPendingDailyLogs = new Set(pendingSyncDailyLogs);
              syncedDailyLogs.forEach(date => newPendingDailyLogs.delete(date));

              set(state => ({
                  pendingSyncWorkouts: newPendingWorkouts,
                  pendingSyncTemplates: newPendingTemplates,
                  pendingSyncPrograms: newPendingPrograms,
                  pendingSyncDailyLogs: newPendingDailyLogs,
                  settingsNeedsSync: settingsNeedsSync && !settingsSynced,
                  syncStatus: errors.length > 0 ? 'partial' : 'synced',
                  isSyncing: false,
                  settings: {
                      ...state.settings,
                      ironCloud: {
                          ...state.settings.ironCloud,
                          enabled: state.settings.ironCloud?.enabled || false,
                          lastSync: new Date().toISOString()
                      }
                  }
              }));

              // Log errors if any occurred
              if (errors.length > 0) {
                  console.warn(`Sync completed with ${errors.length} error(s):`, errors);
                  console.log(`Retrying failed items on next sync. Pending: ${newPendingWorkouts.size} workouts, ${newPendingTemplates.size} templates, ${newPendingPrograms.size} programs, ${newPendingDailyLogs.size} daily logs`);
              }
          } catch (err) {
              console.error('Sync failed:', err);
              set({ isSyncing: false });

              // Retry with exponential backoff (max 3 attempts)
              if (retryCount < 3) {
                  const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                  console.log(`Retrying sync in ${delay}ms (attempt ${retryCount + 1}/3)...`);

                  await new Promise(resolve => setTimeout(resolve, delay));
                  return get().syncData(retryCount + 1);
              } else {
                  // Max retries reached, set error status
                  console.error('Sync failed after 3 retries');
                  set({ syncStatus: 'error' });
              }
          }
      },

      getFatigueStatus: () => {
          const { history, dailyLogs } = get();
          const today = new Date().toISOString().split('T')[0];
          const yesterLog = dailyLogs[today]; // Simplified, could check yesterday too

          // Factor 1: Sleep (Immediate Impact)
          if (yesterLog && yesterLog.sleepHours && yesterLog.sleepHours < 6) {
              return { status: 'High Fatigue', color: '#ef4444', recommendation: 'Sleep deprivation detected. Reduce volume by 30%.' };
          }

          // Factor 2: RPE (Accumulated Fatigue)
          const recent = [...history]
            .filter(h => h.status === 'completed')
            .sort((a,b) => b.startTime - a.startTime)
            .slice(0, 3);

          if (recent.length === 0) return { status: 'Fresh', color: '#ccff00', recommendation: 'Ready to train.' };

          let totalRPE = 0;
          let setCheckCount = 0;

          recent.forEach(sess => {
              sess.logs.forEach(log => {
                  log.sets.forEach(set => {
                      if (set.rpe) {
                          totalRPE += set.rpe;
                          setCheckCount++;
                      }
                  });
              });
          });

          const avgRPE = setCheckCount > 0 ? totalRPE / setCheckCount : 0;

          if (avgRPE > 8.5) return { status: 'High Fatigue', color: '#ef4444', recommendation: 'Central Nervous System stress high. Deload advised.' };
          if (avgRPE < 6) return { status: 'Fresh', color: '#ccff00', recommendation: 'Push intensity. You are detrained.' };
          return { status: 'Optimal', color: '#3b82f6', recommendation: 'Maintain current volume progression.' };
      },

      // AI Coach Helpers Implementation
      getProgressiveSuggestion: (exerciseId) => {
          const { history, dailyLogs, activeWorkout, settings } = get();

          // Get previous workout for this exercise
          const previousLog = get().getExerciseHistory(exerciseId);

          // Get today's biomarkers
          const today = new Date().toISOString().split('T')[0];
          const todayLog = dailyLogs[today];

          const currentTime = activeWorkout?.startTime || Date.now();

          return getSuggestion(exerciseId, previousLog, todayLog, history, currentTime, settings.experienceLevel);
      },

      getEstimated1RM: (exerciseId) => {
          const { settings } = get();
          const prHistory = settings.personalRecords[exerciseId];

          if (!prHistory?.bestWeight) return null;

          return calculate1RM(
              prHistory.bestWeight.value,
              prHistory.bestWeight.reps || 1
          );
      },

      getOverallStrengthScore: () => {
          const { settings } = get();
          // Default bodyweight to 200lbs if not tracked yet
          // TODO: Add bodyweight tracking to UserSettings
          const bodyweight = 200;

          return calculateOverallStrengthScore(
              settings.personalRecords,
              bodyweight,
              'male' // TODO: Add gender to UserSettings
          );
      },

      getVolumeWarning: (exerciseId) => {
          const { history } = get();
          const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);

          if (!exercise) return null;

          return checkVolumeWarning(history, exercise.muscleGroup);
      },

      checkDeloadNeeded: () => {
          const { history, dailyLogs } = get();
          return shouldDeloadWeek(history, dailyLogs);
      },

      // Gamification Actions
      getGamificationState: () => {
          return get().gamification;
      },

      getRankInfo: () => {
          const { gamification } = get();
          const rank = getRankForXP(gamification.totalXP);
          const progress = getLevelProgress(gamification.totalXP);
          const xpToNext = gamification.xpToNextLevel;
          return { rank, progress, xpToNext };
      },

      clearLastWorkoutRewards: () => {
          set({
              lastWorkoutXP: null,
              lastAchievements: [],
              lastLevelUp: false,
          });
      },

      // Data Management
      ensureInitialization: () => {
          const state = get();

          // CRITICAL FIX: Always call set() to force persist after migration
          // Zustand persist migrations update in-memory state but don't write to localStorage
          // This ensures migrated state is persisted even if templates/programs already exist in memory
          const templates = (!state.templates || state.templates.length === 0) ? INITIAL_TEMPLATES : state.templates;
          const programs = (!state.programs || state.programs.length === 0) ? INITIAL_PROGRAMS : state.programs;

          console.log(`[Store Init] Ensuring persist: ${templates.length} templates, ${programs.length} programs`);

          // Always call set() to trigger persist (even if templates/programs exist in memory)
          set({
              templates,
              programs,
          });
      },

      resetAllData: () => {
          const { settings } = get();
          set({
              // Reset all data
              history: [],
              activeWorkout: null,
              dailyLogs: {},
              customExerciseVisuals: {},
              activeBiometrics: [],
              restTimerStart: null,
              restDuration: 90,
              // Reset templates and programs to defaults
              templates: INITIAL_TEMPLATES,
              programs: INITIAL_PROGRAMS,
              // Reset gamification
              gamification: createInitialGamificationState(),
              lastWorkoutXP: null,
              lastAchievements: [],
              lastLevelUp: false,
              // Keep basic user settings but reset records and programs
              settings: {
                  ...settings,
                  personalRecords: {},
                  activeProgram: undefined,
              }
          });
        }
      };
    },
    {
      name: 'voltlift-storage',
      version: 7, // Increment when schema changes
      partialize: (state) => {
          const {
              customExerciseVisuals,
              restTimerStart,
              activeBiometrics,
              // Exclude Sets from persistence (they don't serialize to JSON)
              pendingSyncWorkouts,
              pendingSyncTemplates,
              pendingSyncPrograms,
              pendingSyncDailyLogs,
              // Exclude transient gamification state (only persist core gamification)
              lastWorkoutXP,
              lastAchievements,
              lastLevelUp,
              ...rest
          } = state;

          return rest;
      },
      migrate: (persistedState: any, version: number) => {
        // Version 2: Programs now include filter metadata (goal, difficulty, splitType, frequency)
        if (version < 2) {
          // Check if programs are missing filter metadata
          const needsMigration = persistedState.programs?.some((p: any) =>
            !p.goal || !p.difficulty || !p.splitType || p.frequency === undefined
          );

          if (needsMigration) {
            console.log('[Migration v2] Updating programs with filter metadata');
            return {
              ...persistedState,
              programs: INITIAL_PROGRAMS, // Reset to current program definitions
            };
          }
        }

        // Version 3: Programs now support frequency variants (supportedFrequencies, frequencyVariants)
        if (version < 3) {
          console.log('[Migration v3] Updating programs with frequency variant support');
          return {
            ...persistedState,
            programs: INITIAL_PROGRAMS, // Reset to get new program structure with frequency variants
          };
        }

        // Version 4: Update program names (e.g., "Periodization Protocol" → "Dual-Phase Domination")
        if (version < 4) {
          console.log('[Migration v4] Updating program names to latest definitions');
          return {
            ...persistedState,
            programs: INITIAL_PROGRAMS, // Refresh programs to pick up updated names
          };
        }

        // Version 5: Add gamification state (XP, streaks, achievements)
        if (version < 5) {
          console.log('[Migration v5] Adding gamification state');
          // Merge with existing partial state if present (handles interrupted migrations)
          const initialState = createInitialGamificationState();
          return {
            ...persistedState,
            gamification: persistedState.gamification
              ? { ...initialState, ...persistedState.gamification }
              : initialState,
          };
        }

        // Version 6: Update templates to include PRD (Periodization) program templates
        if (version < 6) {
          console.log('[Migration v6] Updating templates with PRD program workouts');
          return {
            ...persistedState,
            templates: INITIAL_TEMPLATES, // Refresh templates to pick up PRD Phase 1 & 2 templates
          };
        }

        // Version 7: CRITICAL FIX - Ensure templates and programs exist for all users
        // Before this fix, Zustand persist didn't write templates/programs on initial load
        // This left users with 0 templates and 0 programs, breaking program functionality
        if (version < 7) {
          console.log('[Migration v7] Ensuring templates and programs exist');
          return {
            ...persistedState,
            templates: persistedState.templates?.length > 0 ? persistedState.templates : INITIAL_TEMPLATES,
            programs: persistedState.programs?.length > 0 ? persistedState.programs : INITIAL_PROGRAMS,
          };
        }

        return persistedState;
      }
    }
  )
);

// Expose store to window for testing
if (typeof window !== 'undefined' && localStorage.getItem('TESTING_MODE') === 'true') {
  (window as any).useStore = useStore;
}
