
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings, WorkoutSession, ExerciseLog, SetLog, Goal, Program, DailyLog, BiometricPoint, PRType, PersonalRecord } from '../types';
import { MOCK_HISTORY, INITIAL_TEMPLATES, EXERCISE_LIBRARY, INITIAL_PROGRAMS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { backend } from '../services/backend';
import { getSuggestion, checkVolumeWarning, shouldDeloadWeek, ProgressiveSuggestion } from '../services/progressiveOverload';
import { calculate1RM, getBest1RM, classifyStrengthLevel, calculateOverallStrengthScore, OneRepMax } from '../services/strengthScore';

interface UndoableAction {
  type: 'set' | 'exercise';
  data: any;
  exerciseIndex?: number;
  setIndex?: number;
  logId?: string;
  timestamp: number;
}

interface AppState {
  settings: UserSettings;
  history: WorkoutSession[];
  templates: WorkoutSession[];
  programs: Program[];
  activeWorkout: WorkoutSession | null;
  customExerciseVisuals: Record<string, string>;

  // Phase 4: Bio-Feedback & Cloud
  dailyLogs: Record<string, DailyLog>;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  activeBiometrics: BiometricPoint[];

  // Undo Stack for deletions
  undoStack: UndoableAction | null;

  // Global Rest Timer State
  restTimerStart: number | null;
  restDuration: number;
  
  // Actions
  startWorkout: (templateId?: string) => void;
  finishWorkout: () => void;
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
  updateSettings: (settings: Partial<UserSettings>) => void;
  completeOnboarding: (name: string, goal: Goal, experience: 'Beginner' | 'Intermediate' | 'Advanced', equipment: string[]) => void;
  saveExerciseVisual: (exerciseId: string, url: string) => void;
  loadVisuals: () => Promise<void>;
  swapExercise: (logId: string, newExerciseId: string) => void;
  saveTemplate: (name: string, exerciseIds: string[]) => void;
  updateTemplate: (id: string, name: string, exerciseIds: string[]) => void;
  duplicateTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  suggestNextSet: (exerciseIndex: number, setIndex: number) => void; 
  updateExerciseLog: (logId: string, updates: Partial<ExerciseLog>) => void;
  removeExerciseLog: (logId: string) => void;
  toggleSuperset: (logId: string) => void;
  updateActiveWorkout: (updates: Partial<WorkoutSession>) => void;
  activateProgram: (programId: string, selectedFrequency?: number) => void;
  
  // Phase 4 Actions
  logDailyBio: (date: string, data: Partial<DailyLog>) => void;
  updateBodyweight: (date: string, weight: number) => void;
  updateMeasurements: (date: string, measurements: Partial<any>) => void;
  getBodyweightTrend: (days?: number) => { date: string; weight: number }[];
  getLatestMeasurements: () => any | null;
  syncData: () => Promise<void>;
  addBiometricPoint: (point: BiometricPoint) => void;
  
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
  resetAllData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: {
        name: 'Athlete',
        units: 'lbs',
        goal: { type: 'Build Muscle', targetPerWeek: 4 },
        experienceLevel: 'Beginner',
        availableEquipment: ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cable'],
        onboardingCompleted: false,
        personalRecords: {},
        defaultRestTimer: 90,
        barWeight: 45,
        ironCloud: { enabled: false }
      },
      history: MOCK_HISTORY,
      templates: INITIAL_TEMPLATES,
      programs: INITIAL_PROGRAMS,
      activeWorkout: null,
      customExerciseVisuals: {},
      
      dailyLogs: {},
      syncStatus: 'synced',
      activeBiometrics: [],

      undoStack: null,

      restTimerStart: null,
      restDuration: 90,

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
        if (!activeWorkout) return;

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

        set({
          settings: newSettings,
          history: [completedWorkout, ...history],
          activeWorkout: null,
          restTimerStart: null,
          activeBiometrics: []
        });
        
        // Auto Sync on finish
        get().syncData();
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
        if (!activeWorkout) return;

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
        
        if (updates.completed === true && setIndex < newSets.length - 1) {
            const currentSet = newSets[setIndex];
            const nextSet = newSets[setIndex + 1];

            if (!nextSet.completed && nextSet.weight === 0) {
                let nextWeight = currentSet.weight;
                let nextReps = currentSet.reps;

                if (currentSet.reps >= 10) {
                   nextWeight += 5; 
                }
                
                newSets[setIndex + 1] = {
                    ...nextSet,
                    weight: nextWeight,
                    reps: nextReps 
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
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
        // Trigger sync
        if (newSettings.ironCloud) {
            get().syncData();
        }
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

      completeOnboarding: (name, goal, experience, equipment) => {
        set((state) => ({
          settings: {
            ...state.settings,
            name,
            goal,
            experienceLevel: experience,
            availableEquipment: equipment,
            onboardingCompleted: true
          }
        }));
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

      swapExercise: (logId, newExerciseId) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

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
        set(state => ({ templates: [...state.templates, newTemplate] }));
      },

      updateTemplate: (id, name, exerciseIds) => {
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
          )
        }));
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
        set(state => ({ templates: [...state.templates, newTemplate] }));
      },

      deleteTemplate: (id) => {
        set(state => ({ templates: state.templates.filter(t => t.id !== id) }));
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
          set(state => ({
              dailyLogs: {
                  ...state.dailyLogs,
                  [date]: { ...(state.dailyLogs[date] || { date }), ...data }
              }
          }));
          get().syncData();
      },

      updateBodyweight: (date, weight) => {
          set(state => ({
              dailyLogs: {
                  ...state.dailyLogs,
                  [date]: { ...(state.dailyLogs[date] || { date }), bodyweight: weight }
              },
              settings: {
                  ...state.settings,
                  bodyweight: weight
              }
          }));
          get().syncData();
      },

      updateMeasurements: (date, measurements) => {
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
              }
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

      addBiometricPoint: (point) => {
          const { activeWorkout } = get();
          if (!activeWorkout) return;
          set(state => ({
              activeBiometrics: [...state.activeBiometrics, point]
          }));
      },

      syncData: async () => {
          const { settings } = get();
          if (!settings.ironCloud?.enabled) return;

          set({ syncStatus: 'syncing' });
          
          // Simulated Network Delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          set(state => ({
              syncStatus: 'synced',
              settings: {
                  ...state.settings,
                  ironCloud: {
                      ...state.settings.ironCloud!,
                      lastSync: Date.now()
                  }
              }
          }));
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
          const { history, dailyLogs, activeWorkout } = get();

          // Get previous workout for this exercise
          const previousLog = get().getExerciseHistory(exerciseId);

          // Get today's biomarkers
          const today = new Date().toISOString().split('T')[0];
          const todayLog = dailyLogs[today];

          const currentTime = activeWorkout?.startTime || Date.now();

          return getSuggestion(exerciseId, previousLog, todayLog, history, currentTime);
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

      // Data Management
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
              // Keep basic user settings but reset records and programs
              settings: {
                  ...settings,
                  personalRecords: {},
                  activeProgram: undefined,
              }
          });
      }
    }),
    {
      name: 'voltlift-storage',
      version: 3, // Increment when schema changes
      partialize: (state) => {
          const { customExerciseVisuals, restTimerStart, activeBiometrics, ...rest } = state;
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

        return persistedState;
      }
    }
  )
);
