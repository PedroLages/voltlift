
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings, WorkoutSession, ExerciseLog, SetLog, Goal, Program, DailyLog, BiometricPoint } from '../types';
import { MOCK_HISTORY, INITIAL_TEMPLATES, EXERCISE_LIBRARY, INITIAL_PROGRAMS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { saveImageToDB, getAllImagesFromDB } from '../utils/db';

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
  
  // Global Rest Timer State
  restTimerStart: number | null;
  restDuration: number;
  
  // Actions
  startWorkout: (templateId?: string) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  addExerciseToActive: (exerciseId: string) => void;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<SetLog>) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  completeOnboarding: (name: string, goal: Goal, experience: 'Beginner' | 'Intermediate' | 'Advanced') => void;
  saveExerciseVisual: (exerciseId: string, url: string) => void;
  loadVisuals: () => Promise<void>;
  swapExercise: (logId: string, newExerciseId: string) => void;
  saveTemplate: (name: string, exerciseIds: string[]) => void;
  deleteTemplate: (id: string) => void;
  suggestNextSet: (exerciseIndex: number, setIndex: number) => void; 
  updateExerciseLog: (logId: string, updates: Partial<ExerciseLog>) => void;
  removeExerciseLog: (logId: string) => void;
  toggleSuperset: (logId: string) => void;
  activateProgram: (programId: string) => void;
  
  // Phase 4 Actions
  logDailyBio: (date: string, data: Partial<DailyLog>) => void;
  syncData: () => Promise<void>;
  addBiometricPoint: (point: BiometricPoint) => void;
  
  // Timer Actions
  startRestTimer: (duration?: number) => void;
  stopRestTimer: () => void;
  
  // Selectors/Helpers
  getExerciseHistory: (exerciseId: string) => ExerciseLog | undefined;
  getFatigueStatus: () => { status: 'Fresh' | 'Optimal' | 'High Fatigue', color: string, recommendation: string };
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
      
      restTimerStart: null,
      restDuration: 90,

      startWorkout: (templateId) => {
        let newWorkout: WorkoutSession;

        if (templateId) {
          const template = get().templates.find(t => t.id === templateId);
          if (template) {
            newWorkout = {
              ...template,
              id: uuidv4(),
              startTime: Date.now(),
              status: 'active',
              sourceTemplateId: templateId, // Track source
              logs: template.logs.map(log => ({
                ...log,
                id: uuidv4(),
                sets: log.sets.map(s => ({ ...s, id: uuidv4(), completed: false, type: 'N' }))
              }))
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

        // Calculate New Personal Records
        const newPRs = { ...settings.personalRecords };
        let prUpdated = false;

        completedWorkout.logs.forEach(log => {
          const validSets = log.sets.filter(s => s.completed && s.type !== 'W');
          const maxWeightInSession = Math.max(...validSets.map(s => s.weight), 0);
          
          if (maxWeightInSession > 0) {
            const currentPR = newPRs[log.exerciseId]?.weight || 0;
            if (maxWeightInSession > currentPR) {
              newPRs[log.exerciseId] = {
                weight: maxWeightInSession,
                date: Date.now()
              };
              prUpdated = true;
            }
          }
        });
        
        let newSettings = { ...settings };

        if (prUpdated) {
          newSettings.personalRecords = newPRs;
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
         newLogs[exerciseIndex].sets.splice(setIndex, 1);
         set({ activeWorkout: { ...activeWorkout, logs: newLogs } });
      },

      updateSettings: (newSettings) => {
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
        // Trigger sync
        if (newSettings.ironCloud) {
            get().syncData();
        }
      },

      completeOnboarding: (name, goal, experience) => {
        set((state) => ({
          settings: {
            ...state.settings,
            name,
            goal,
            experienceLevel: experience,
            onboardingCompleted: true
          }
        }));
      },

      saveExerciseVisual: async (exerciseId, url) => {
        try {
            await saveImageToDB(exerciseId, url);
        } catch (e) {
            console.error("Failed to save visual to DB:", e);
        }

        set((state) => ({
          customExerciseVisuals: {
            ...state.customExerciseVisuals,
            [exerciseId]: url
          }
        }));
      },

      loadVisuals: async () => {
        try {
            const visuals = await getAllImagesFromDB();
            if (Object.keys(visuals).length > 0) {
                set({ customExerciseVisuals: visuals });
            }
        } catch (e) {
            console.error("Failed to load visuals from DB:", e);
        }
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
      
      suggestNextSet: () => {}, 

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
          const newLogs = activeWorkout.logs.filter(log => log.id !== logId);
          set({ activeWorkout: { ...activeWorkout, logs: newLogs } });
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

      activateProgram: (programId) => {
          set(state => ({
              settings: {
                  ...state.settings,
                  activeProgram: {
                      programId,
                      currentSessionIndex: 0,
                      startDate: Date.now()
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
      }
    }),
    {
      name: 'ironpath-storage',
      partialize: (state) => {
          const { customExerciseVisuals, restTimerStart, activeBiometrics, ...rest } = state;
          return rest;
      }
    }
  )
);
