
import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense, flushSync } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { EXERCISE_LIBRARY } from '../constants';
import { Check, Plus, MoreHorizontal, Timer, Sparkles, X, AlertTriangle, RefreshCw, Trash2, StickyNote, Trophy, ArrowRight, Calculator, ChevronDown, ChevronUp, Link as LinkIcon, Unlink, Heart, Copy, Play, Search } from 'lucide-react';
import { getProgressiveOverloadTip } from '../services/geminiService';
import { sendRestTimerAlert, sendPRCelebration } from '../services/notificationService';
import { SetType } from '../types';
import { formatTime } from '../utils/formatters';
import { calculatePlateLoading, formatWeight } from '../utils/conversions';
import { AISuggestionBadge, VolumeWarningBadge, RecoveryScore } from '../components/AISuggestionBadge';
import { checkAllPRs, PRDetection } from '../services/strengthScore';
import { checkAchievements, awardXP } from '../services/gamification';
import { Achievement } from '../types';
import SwipeableRow from '../components/SwipeableRow';
import Toast from '../components/Toast';
import { AchievementToast } from '../components/AchievementToast';
import { Skeleton } from '../components/Skeleton';
import KeyboardToolbar from '../components/KeyboardToolbar';
import { InAppVideoPlayer } from '../components/InAppVideoPlayer';
import { SmartSwapModal } from '../components/SmartSwapModal';
import { findSubstitutes as findExerciseSubstitutes } from '../services/exerciseRecommendation';
import { WorkoutCompleteModal as XPCelebrationModal } from '../components/gamification';

// Lazy load heavy components
const PRCelebration = lazy(() => import('../components/PRCelebration'));
const SetTypeSelector = lazy(() => import('../components/SetTypeSelector'));
const WorkoutCompletionModal = lazy(() => import('../components/WorkoutCompletionModal'));
const AMAPCompletionModal = lazy(() => import('../components/AMAPCompletionModal'));
const CycleCompletionModal = lazy(() => import('../components/CycleCompletionModal'));
const PostWorkoutFeedback = lazy(() => import('../components/PostWorkoutFeedback'));
const AchievementCelebrationModal = lazy(() => import('../components/achievements/AchievementCelebrationModal'));

const WorkoutLogger = () => {
  const { activeWorkout, finishWorkout, saveDraft, cancelWorkout, updateSet, addSet, duplicateSet, removeSet, addExerciseToActive, settings, history, swapExercise, updateExerciseLog, removeExerciseLog, getExerciseHistory, restTimerStart, restDuration, startRestTimer, stopRestTimer, getRestTimerForExercise, toggleSuperset, updateActiveWorkout, addBiometricPoint, getProgressiveSuggestion, getVolumeWarning, undoStack, restoreLastDeleted, clearUndoStack, toggleFavoriteExercise, getAllExercises, createCustomExercise, customExercises, gamification, updateGamification } = useStore();
  const navigate = useNavigate();
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const modalClosingRef = useRef(false);

  // DEBUG: Log modal state changes
  useEffect(() => {
    console.log('[WorkoutLogger] showExerciseSelector changed to:', showExerciseSelector);
  }, [showExerciseSelector]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showExerciseSelector) {
        setShowExerciseSelector(false);
        setExerciseSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showExerciseSelector]);

  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [swapTargetLogId, setSwapTargetLogId] = useState<string | null>(null);
  const [pendingSwap, setPendingSwap] = useState<{ logId: string; exerciseId: string; exerciseName: string } | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showPostWorkoutFeedback, setShowPostWorkoutFeedback] = useState(false);
  const [completedWorkoutRef, setCompletedWorkoutRef] = useState<typeof activeWorkout>(null);

  // Phase 5: AMAP Modal State
  const [amapModalData, setAmapModalData] = useState<{
    exerciseId: string;
    exerciseName: string;
    currentTM: number;
    amapReps: number;
    setData: {
      completedSets: number;
      totalSets: number;
      averageRPE?: number;
      missedReps: number;
    };
  } | null>(null);

  // Phase 5: Cycle Completion Modal State
  const [cycleModalData, setCycleModalData] = useState<{
    programName: string;
    cyclesCompleted: number;
    tmUpdates?: Record<string, { old: number; new: number }>;
  } | null>(null);

  const [aiTip, setAiTip] = useState<{id: string, text: string} | null>(null);
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showNotesId, setShowNotesId] = useState<string | null>(null);

  // Set Context Menu State
  const [activeSetMenu, setActiveSetMenu] = useState<{ exerciseIndex: number; setIndex: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Plate Calculator State
  const [calculatorTarget, setCalculatorTarget] = useState<number | null>(null);

  // Timer Local State (synced with global)
  const [timeLeft, setTimeLeft] = useState(0);

  // PR Celebration State (Enhanced Multi-PR Detection)
  const [activePRs, setActivePRs] = useState<{ prs: PRDetection[]; exerciseName: string } | null>(null);

  // Achievement Celebration State
  const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);

  // Video Player State
  const [activeVideo, setActiveVideo] = useState<{ videoUrl: string; exerciseName: string } | null>(null);

  // Smart Swap Modal State
  const [smartSwapData, setSmartSwapData] = useState<{
    logId: string;
    currentExercise: typeof EXERCISE_LIBRARY[0];
    suggestions: typeof EXERCISE_LIBRARY;
  } | null>(null);

  // Track celebrated PRs in this workout session (to avoid duplicate celebrations)
  const [celebratedPRs, setCelebratedPRs] = useState<Set<string>>(new Set());

  // XP Celebration Modal State
  const [showXPCelebration, setShowXPCelebration] = useState(false);

  // Live Heart Rate Simulation State
  const [bpm, setBpm] = useState(70);

  // Track if notification was sent for current rest timer session
  const [notificationSent, setNotificationSent] = useState(false);

  // Timer Visibility Toggle State
  const [timerMinimized, setTimerMinimized] = useState(false);

  // Keyboard Toolbar State (iOS-style navigation)
  const [focusedInput, setFocusedInput] = useState<HTMLInputElement | null>(null);
  const focusedInputRef = useRef<HTMLInputElement | null>(null);
  const previousViewportHeight = useRef<number>(window.innerHeight);

  // Helper function to scroll input into view above keyboard
  const scrollInputIntoView = useCallback((input: HTMLInputElement) => {
    // Store reference for visualViewport resize handler
    focusedInputRef.current = input;

    // Use requestAnimationFrame for smoother timing
    requestAnimationFrame(() => {
      // Scroll using scrollIntoView with 'nearest' to avoid unnecessary jumps
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    });
  }, []);

  // visualViewport resize handler for iOS keyboard
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportResize = () => {
      const currentHeight = viewport.height;
      const heightDiff = previousViewportHeight.current - currentHeight;

      // Keyboard appeared (viewport shrunk significantly)
      const KEYBOARD_HEIGHT_THRESHOLD = 100; // Minimum height change to detect keyboard appearance
      if (heightDiff > KEYBOARD_HEIGHT_THRESHOLD && focusedInputRef.current) {
        // Delay slightly to let keyboard animation complete
        setTimeout(() => {
          if (focusedInputRef.current && document.activeElement === focusedInputRef.current) {
            const rect = focusedInputRef.current.getBoundingClientRect();
            const keyboardToolbarHeight = 56;
            const visibleBottom = viewport.height - keyboardToolbarHeight;

            // Only scroll if input is below visible area
            if (rect.bottom > visibleBottom) {
              focusedInputRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }
        }, 100);
      }

      previousViewportHeight.current = currentHeight;
    };

    viewport.addEventListener('resize', handleViewportResize);
    return () => {
      viewport.removeEventListener('resize', handleViewportResize);
      focusedInputRef.current = null; // Clear ref to prevent memory retention
    };
  }, []);

  // Audio Oscillator for Beep
  const playTimerSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio Playback Error", e);
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
      window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (restTimerStart) {
          // Reset notification flag when timer starts
          setNotificationSent(false);

          interval = setInterval(() => {
              const secondsGone = Math.floor((Date.now() - restTimerStart) / 1000);
              const remaining = restDuration - secondsGone;

              if (remaining <= 0) {
                  // Timer Finished
                  if (remaining === 0) {
                      playTimerSound();
                      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

                      // Send rest timer notification (only once per timer session)
                      if (!notificationSent && settings.notifications?.enabled && settings.notifications?.restTimerAlerts) {
                          sendRestTimerAlert();
                          setNotificationSent(true);
                      }
                  }
                  if (remaining < -2) { // Auto clear after 2 seconds over
                      stopRestTimer();
                  }
                  setTimeLeft(0);
              } else {
                  setTimeLeft(remaining);
              }
          }, 500);
      } else {
          setTimeLeft(0);
      }
      return () => clearInterval(interval);
  }, [restTimerStart, restDuration, stopRestTimer, notificationSent, settings.notifications]);

  // Heart Rate Simulation Logic
  useEffect(() => {
      if (!activeWorkout) return;

      const interval = setInterval(() => {
          setBpm(prev => {
              let target = 70; // Resting base
              if (restTimerStart) {
                  target = 110; // Recovering
              } else {
                  target = 150; // Lifting active
              }

              // Random fluctuation + drift towards target
              const noise = Math.random() * 4 - 2;
              const diff = target - prev;
              const drift = diff * 0.1;
              const newBpm = Math.round(prev + drift + noise);

              return newBpm;
          });
      }, 2000); // Update every 2s

      return () => clearInterval(interval);
  }, [activeWorkout, restTimerStart]);

  // Save biometric data separately to avoid state update during render
  useEffect(() => {
      if (!activeWorkout) return;
      addBiometricPoint({ timestamp: Date.now(), heartRate: bpm });
  }, [bpm, activeWorkout, addBiometricPoint]);

  const handleFinish = () => {
    setShowCompletionModal(true);
  };

  const handleCompleteWorkout = () => {
    // Call finishWorkout first - it sets endTime and adds to history
    // CRITICAL FIX: Use the return value instead of history[0]
    // finishWorkout() uses set() which batches state updates
    // so history[0] won't be updated immediately
    const completedWorkout = finishWorkout();
    setShowCompletionModal(false);

    // Store the completed workout reference for modals
    if (completedWorkout) {
      setCompletedWorkoutRef({ ...completedWorkout });
    }

    // Phase 5: Check if this was a Greg Nuckols program cycle completion
    // TODO: Add cycle tracking logic here

    // Show XP celebration modal first
    setShowXPCelebration(true);
  };

  const handleXPCelebrationClose = () => {
    setShowXPCelebration(false);
    // Then show post-workout feedback modal if we have a completed workout
    if (completedWorkoutRef) {
      setShowPostWorkoutFeedback(true);
    } else {
      // If no completed workout ref, navigate to history
      navigate('/history');
    }
  };

  const handleFeedbackComplete = () => {
    setShowPostWorkoutFeedback(false);
    setCompletedWorkoutRef(null);
    navigate('/history');
  };

  // Phase 5: AMAP Modal Handlers
  const handleAmapConfirm = (newTM: number) => {
    if (!amapModalData) return;

    // Update Training Max in settings
    useStore.getState().updateSettings({
      trainingMaxes: {
        ...settings.trainingMaxes,
        [amapModalData.exerciseId]: {
          exerciseId: amapModalData.exerciseId,
          value: newTM,
          lastUpdated: Date.now(),
          history: [
            ...(settings.trainingMaxes?.[amapModalData.exerciseId]?.history || []),
            {
              value: newTM,
              date: Date.now(),
              calculatedFrom: {
                type: 'AMAP',
                value: amapModalData.amapReps,
                reps: amapModalData.amapReps
              },
              reason: `AMAP Test: ${amapModalData.amapReps} reps`
            }
          ]
        }
      }
    });

    setAmapModalData(null);
  };

  // Phase 5: Cycle Completion Modal Handlers
  const handleStartNextCycle = (shouldDeload: boolean) => {
    // TODO: Implement cycle progression logic
    // For now, just close the modal
    setCycleModalData(null);
  };

  const handleSaveDraft = () => {
    saveDraft();
    setShowCompletionModal(false);
    navigate('/');
  };

  const handleDiscardWorkout = () => {
    if (confirm("Are you sure you want to discard this workout? All progress will be lost.")) {
      cancelWorkout();
      setShowCompletionModal(false);
      navigate('/lift');
    }
  };

  const handleSetComplete = (exerciseIndex: number, setIndex: number, completed: boolean, weight: number, reps: number, exerciseId: string) => {
      updateSet(exerciseIndex, setIndex, { completed });

      if (completed) {
          // Trigger Per-Exercise Rest Timer (uses category-specific defaults)
          const restTime = getRestTimerForExercise(exerciseId);
          startRestTimer(restTime);

          // Enhanced Multi-PR Detection (Alpha Progression strategy)
          const prHistory = settings.personalRecords[exerciseId];
          const currentSet = activeWorkout?.logs[exerciseIndex]?.sets[setIndex];

          if (currentSet && weight > 0 && reps > 0) {
              const detectedPRs = checkAllPRs(currentSet, prHistory);

              if (detectedPRs.length > 0) {
                  // Filter out PRs that have already been celebrated in this workout session
                  const newPRs = detectedPRs.filter(pr => {
                      const prKey = `${exerciseId}-${pr.type}-${pr.value}`;
                      return !celebratedPRs.has(prKey);
                  });

                  // Only show celebration if there are truly new PRs
                  if (newPRs.length > 0) {
                      const exerciseName = EXERCISE_LIBRARY.find(e => e.id === exerciseId)?.name || 'Exercise';
                      setActivePRs({ prs: newPRs, exerciseName });

                      // Mark these PRs as celebrated
                      const updatedCelebratedPRs = new Set(celebratedPRs);
                      newPRs.forEach(pr => {
                          const prKey = `${exerciseId}-${pr.type}-${pr.value}`;
                          updatedCelebratedPRs.add(prKey);
                      });
                      setCelebratedPRs(updatedCelebratedPRs);

                      // Send PR celebration notification
                      if (settings.notifications?.enabled && settings.notifications?.prCelebrations) {
                          // Send notification for the most significant PR
                          const primaryPR = newPRs[0];
                          const achievement = primaryPR.type === 'weight'
                              ? `${primaryPR.value}${settings.units} x ${reps}`
                              : primaryPR.type === 'reps'
                              ? `${reps} reps @ ${weight}${settings.units}`
                              : `${primaryPR.value}${settings.units} volume`;

                          sendPRCelebration(
                              newPRs.length > 1 ? `${newPRs.length} PRs` : primaryPR.type,
                              exerciseName,
                              achievement
                          );
                      }

                      // Check for newly unlocked achievements after PR
                      if (gamification) {
                          const newlyUnlocked = checkAchievements(gamification);
                          if (newlyUnlocked.length > 0) {
                              // Show first achievement celebration (will show more after closing)
                              const firstAchievement = newlyUnlocked[0];

                              // Update gamification state with unlocked achievements
                              let updatedGamification = { ...gamification };
                              for (const achievement of newlyUnlocked) {
                                  updatedGamification = awardXP(
                                      updatedGamification,
                                      achievement.xpReward,
                                      'achievement',
                                      `Unlocked: ${achievement.name}`
                                  );
                                  updatedGamification.unlockedAchievements = [
                                      ...updatedGamification.unlockedAchievements,
                                      {
                                          achievementId: achievement.id,
                                          unlockedAt: Date.now(),
                                          xpAwarded: achievement.xpReward,
                                      },
                                  ];
                              }
                              updateGamification(updatedGamification);

                              // Show toast notification immediately
                              setAchievementToast(firstAchievement);

                              // Show celebration modal for first achievement
                              setActiveAchievement(firstAchievement);
                          }
                      }
                  }
              }
          }
      } else {
          stopRestTimer();
      }
  };

  const handleSetTypeChange = (exerciseIndex: number, setIndex: number, newType: SetType) => {
      updateSet(exerciseIndex, setIndex, { type: newType });
  };

  const handleGetAiTip = async (exerciseId: string) => {
    setLoadingAi(exerciseId);
    const exerciseHistory = history.flatMap(s =>
      s.logs.filter(l => l.exerciseId === exerciseId)
    );
    const tip = await getProgressiveOverloadTip(exerciseId, exerciseHistory, settings);
    if (tip) {
      setAiTip({ id: exerciseId, text: tip });
    }
    setLoadingAi(null);
  };

  /**
   * Find substitute exercises using the centralized recommendation service.
   * This ensures consistent filtering across Smart Swap, Add Exercise, and AI suggestions.
   */
  const findSubstitutes = useCallback((exerciseId: string) => {
      const allExercises = getAllExercises();

      const result = findExerciseSubstitutes({
          exerciseId,
          currentWorkout: activeWorkout,
          settings,
          allExercises,
          allowSecondaryMuscle: false,
          limit: 10,
      });

      // Log debug info in development
      if (process.env.NODE_ENV === 'development' && result.debug) {
          console.log('[SmartSwap] Finding substitutes for:', exerciseId);
          console.log('[SmartSwap] Current exercise:', result.debug.currentExercise?.name);
          console.log('[SmartSwap] Exercises in workout:', result.debug.exercisesInWorkout);
          console.log('[SmartSwap] Available equipment:', result.debug.availableEquipment);
          console.log('[SmartSwap] After muscle filter:', result.debug.afterMuscleFilter);
          console.log('[SmartSwap] After exclude filter:', result.debug.afterExcludeFilter);
          console.log('[SmartSwap] After equipment filter:', result.debug.afterEquipmentFilter);
          console.log('[SmartSwap] Match type:', result.matchType);
          console.log('[SmartSwap] Results:', result.exercises.map(e => e.name));
      }

      return result.exercises;
  }, [activeWorkout, settings, getAllExercises]);

  const handleSwap = useCallback((logId: string, currentExerciseId: string) => {
      const subs = findSubstitutes(currentExerciseId);
      const currentEx = getAllExercises().find(e => e.id === currentExerciseId);

      if (subs.length > 0 && currentEx) {
          // Show custom Smart Swap modal instead of browser confirm
          setSmartSwapData({
              logId,
              currentExercise: currentEx,
              suggestions: subs,
          });
      } else {
          // No substitutes found - open exercise selector for manual selection
          console.log('[SmartSwap] No substitutes found, opening full exercise selector');
          setSwapTargetLogId(logId);
          setShowExerciseSelector(true);
      }
  }, [findSubstitutes, getAllExercises]);

  const handleSmartSwapConfirm = (exerciseId: string) => {
      if (smartSwapData) {
          swapExercise(smartSwapData.logId, exerciseId);
          setSmartSwapData(null);
      }
  };

  const handleSmartSwapViewAll = () => {
      if (smartSwapData) {
          // Close modal and open exercise selector for more options
          setSwapTargetLogId(smartSwapData.logId);
          setShowExerciseSelector(true);
          setSmartSwapData(null);
      }
  };

  const initiateManualSwap = (logId: string) => {
      setSwapTargetLogId(logId);
      setShowExerciseSelector(true);
      setActiveMenuId(null);
  };

  // Long-press handlers for set context menu
  const handleLongPressStart = (exerciseIndex: number, setIndex: number) => {
      longPressTimer.current = setTimeout(() => {
          setActiveSetMenu({ exerciseIndex, setIndex });
          if (navigator.vibrate) navigator.vibrate(50);
      }, 500); // 500ms long press
  };

  const handleLongPressEnd = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  // Plate Calc Logic using unit-aware conversion utility (Memoized)
  const getPlates = useCallback((target: number) => {
      const bar = settings.barWeight || (settings.units === 'kg' ? 20 : 45);
      const customPlates = settings.availablePlates?.[settings.units];
      return calculatePlateLoading(target, bar, settings.units, customPlates);
  }, [settings.barWeight, settings.units, settings.availablePlates]);

  // Rest Timer Progress Percentage (Memoized)
  const timerProgress = useMemo(() =>
    Math.min(100, Math.max(0, (timeLeft / restDuration) * 100)),
    [timeLeft, restDuration]
  );

  // Memoize volume warnings and suggestions per exercise (expensive calculations)
  const exerciseData = useMemo(() => {
    if (!activeWorkout) return {};

    const data: Record<string, {
      volumeWarning: ReturnType<typeof getVolumeWarning>;
      suggestion: ReturnType<typeof getProgressiveSuggestion>;
    }> = {};

    activeWorkout.logs.forEach(log => {
      data[log.exerciseId] = {
        volumeWarning: getVolumeWarning(log.exerciseId),
        suggestion: getProgressiveSuggestion(log.exerciseId)
      };
    });

    return data;
  }, [activeWorkout?.logs, getVolumeWarning, getProgressiveSuggestion]);

  // Parse RPE target from template notes (e.g., "RPE 7-8 |" returns 7 or 8)
  const parseRPETarget = useCallback((notes?: string): number | undefined => {
    if (!notes) return undefined;
    const match = notes.match(/RPE\s*(\d+)(?:\s*-\s*(\d+))?/i);
    if (match) {
      // Return the lower bound of the range (e.g., 7 from "RPE 7-8")
      return parseInt(match[1], 10);
    }
    return undefined;
  }, []);

  // Check if an exercise is bodyweight-based
  const isBodyweightExercise = useCallback((exerciseId: string): boolean => {
    const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
    return exercise?.equipment === 'Bodyweight';
  }, []);

  // Keyboard Toolbar Navigation Functions
  const getAllInputs = useCallback((): HTMLInputElement[] => {
    // Get all weight and reps inputs in order (excluding RPE selects)
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[type="number"]')
    ).filter(input => !input.disabled);
    return inputs;
  }, []);

  const handleKeyboardPrevious = useCallback(() => {
    const inputs = getAllInputs();
    if (!focusedInput) return;

    const currentIndex = inputs.indexOf(focusedInput);
    if (currentIndex > 0) {
      const previousInput = inputs[currentIndex - 1];
      previousInput.focus();
      setFocusedInput(previousInput);
    }
  }, [focusedInput, getAllInputs]);

  const handleKeyboardNext = useCallback(() => {
    const inputs = getAllInputs();
    if (!focusedInput) return;

    const currentIndex = inputs.indexOf(focusedInput);
    if (currentIndex < inputs.length - 1) {
      const nextInput = inputs[currentIndex + 1];
      nextInput.focus();
      setFocusedInput(nextInput);
    }
  }, [focusedInput, getAllInputs]);

  const handleKeyboardDone = useCallback(() => {
    if (focusedInput) {
      focusedInput.blur();
      setFocusedInput(null);
    }
  }, [focusedInput]);

  const checkHasPrevious = useCallback((): boolean => {
    const inputs = getAllInputs();
    if (!focusedInput) return false;
    const currentIndex = inputs.indexOf(focusedInput);
    return currentIndex > 0;
  }, [focusedInput, getAllInputs]);

  const checkHasNext = useCallback((): boolean => {
    const inputs = getAllInputs();
    if (!focusedInput) return false;
    const currentIndex = inputs.indexOf(focusedInput);
    return currentIndex < inputs.length - 1;
  }, [focusedInput, getAllInputs]);

  // Early return AFTER all hooks to avoid "rendered fewer hooks" error
  // BUT render celebration/feedback modals BEFORE the early return so they show after workout completion
  if (!activeWorkout) {
    return (
      <>
        {/* XP Celebration Modal - shown after workout completion */}
        <XPCelebrationModal
          isOpen={showXPCelebration}
          onClose={handleXPCelebrationClose}
          workout={completedWorkoutRef}
        />

        {/* Post-Workout Feedback Modal */}
        {showPostWorkoutFeedback && completedWorkoutRef && (
          <Suspense fallback={<div />}>
            <PostWorkoutFeedback
              workout={completedWorkoutRef}
              isOpen={showPostWorkoutFeedback}
              onClose={handleFeedbackComplete}
              onComplete={handleFeedbackComplete}
            />
          </Suspense>
        )}

        {/* Default "No Session" UI when no modals are active */}
        {!showXPCelebration && !showPostWorkoutFeedback && !completedWorkoutRef && (
          <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-background">
            <h2 className="volt-header text-3xl mb-4 text-white">NO SESSION ACTIVE</h2>
            <p className="text-[#666] mb-8 font-mono text-xs uppercase">Select a protocol to begin tracking.</p>
            <button onClick={() => {
                useStore.getState().startWorkout();
            }} className="bg-primary text-black px-8 py-4 font-black italic uppercase tracking-wider mb-4 w-full max-w-xs">
              Quick Start
            </button>
            <button onClick={() => navigate('/lift')} className="text-white underline text-xs uppercase tracking-widest">
              Go to Lift Hub
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="pb-8 bg-background min-h-screen" onClick={() => setActiveMenuId(null)}>
      {/* Enhanced PR Celebration (Multi-PR Detection + Confetti + Haptic) */}
      {activePRs && (
          <Suspense fallback={<div />}>
            <PRCelebration
                prs={activePRs.prs}
                exerciseName={activePRs.exerciseName}
                onClose={() => setActivePRs(null)}
                autoCloseDuration={5000}
            />
          </Suspense>
      )}

      {/* Achievement Celebration Modal */}
      {activeAchievement && (
          <Suspense fallback={<div />}>
            <AchievementCelebrationModal
                isOpen={true}
                onClose={() => setActiveAchievement(null)}
                achievement={activeAchievement}
            />
          </Suspense>
      )}

      {/* Achievement Toast Notification */}
      {achievementToast && (
          <AchievementToast
              achievement={achievementToast}
              onClose={() => setAchievementToast(null)}
              duration={4000}
          />
      )}

      {/* Plate Calculator Modal */}
      {calculatorTarget !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setCalculatorTarget(null)}>
              <div className="bg-[#111] border border-[#333] p-8 max-w-sm w-full mx-4 relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setCalculatorTarget(null)} className="absolute top-4 right-4 text-[#666] hover:text-white" aria-label="Close calculator"><X size={24} /></button>
                  <h3 className="volt-header text-2xl text-white mb-6">LOAD BAR</h3>

                  <div className="flex justify-between items-end border-b border-[#333] pb-4 mb-6">
                      <span className="text-[#888] font-mono text-sm uppercase">TARGET</span>
                      <span className="text-4xl font-black italic text-primary">{calculatorTarget} <span className="text-lg text-white">{(settings.units || 'lbs').toUpperCase()}</span></span>
                  </div>

                  <div className="flex justify-center items-center gap-2 mb-8 flex-wrap">
                      <div className="h-24 w-4 bg-[#444] rounded-sm"></div> {/* Bar End */}
                      {getPlates(calculatorTarget).map((p, i) => {
                          const height = p >= 45 ? 96 : p >= 25 ? 80 : p >= 10 ? 64 : 48;
                          return (
                              <div
                                  key={i}
                                  className="w-6 bg-[#222] border border-[#444] flex items-center justify-center text-[10px] font-bold text-white"
                                  style={{ height: `${height}px` }}
                              >
                                  <span className="-rotate-90">{p}</span>
                              </div>
                          );
                      })}
                      {getPlates(calculatorTarget).length === 0 && <span className="text-[#444] font-mono text-xs uppercase">BAR ONLY</span>}
                  </div>

                  <div className="text-center text-[#666] font-mono text-[10px] uppercase">
                      Based on {settings.barWeight}{(settings.units || 'lbs').toUpperCase()} Bar • Per Side Shown
                  </div>
              </div>
          </div>
      )}

      {/* Rest Timer Overlay */}
      {restTimerStart !== null && (
          <div
            data-testid="rest-timer"
            className={`fixed bottom-4 left-4 right-4 bg-[#0a0a0a] border ${timeLeft === 0 ? 'border-primary animate-pulse' : 'border-[#333]'} p-0 z-40 shadow-2xl overflow-hidden animate-slide-up rounded`}
          >
              {/* Progress Bar Background */}
              <div
                className="absolute top-0 left-0 bottom-0 bg-[#222] transition-all duration-500 ease-linear z-0"
                style={{ width: `${timerProgress}%` }}
              />

              {timerMinimized ? (
                  // Minimized View - Compact Bar
                  <button
                    onClick={() => setTimerMinimized(false)}
                    className="relative z-10 w-full p-2 flex items-center justify-between hover:bg-[#111] transition-colors"
                  >
                      <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${timeLeft === 0 ? 'bg-primary' : 'bg-[#ccff00] animate-pulse'}`}></div>
                          <span data-testid="rest-timer-countdown" className={`text-sm font-black italic font-mono ${timeLeft === 0 ? 'text-primary' : 'text-white'}`}>
                              {timeLeft === 0 ? "GO!" : formatTime(timeLeft)}
                          </span>
                      </div>
                      <ChevronUp size={16} className="text-[#666]" />
                  </button>
              ) : (
                  // Expanded View - Full Timer
                  <div className="relative z-10 p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${timeLeft === 0 ? 'bg-primary' : 'bg-[#ccff00] animate-pulse'}`}></div>
                          <div>
                              <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest block mb-0.5">Recovery Mode</span>
                              <span data-testid="rest-timer-countdown" className={`text-3xl font-black italic font-mono leading-none ${timeLeft === 0 ? 'text-primary' : 'text-white'}`}>
                                  {timeLeft === 0 ? "GO!" : formatTime(timeLeft)}
                              </span>
                          </div>
                      </div>

                      <div className="flex gap-2">
                           <button
                            onClick={() => setTimerMinimized(true)}
                            className="w-10 h-10 bg-black border border-[#333] text-[#666] hover:text-white hover:border-white flex items-center justify-center rounded transition-colors"
                            aria-label="Minimize timer"
                           >
                               <ChevronDown size={16} />
                           </button>
                           <button
                            onClick={() => {
                                startRestTimer(restDuration + 30);
                            }}
                            className="w-10 h-10 bg-black border border-[#333] text-white hover:text-primary hover:border-primary flex items-center justify-center rounded transition-colors"
                            aria-label="Add 30 seconds"
                           >
                               <span className="text-[10px] font-bold">+30</span>
                           </button>
                           <button
                            onClick={() => {
                                const newDuration = Math.max(15, restDuration - 15);
                                startRestTimer(newDuration);
                            }}
                            className="w-10 h-10 bg-black border border-[#333] text-white hover:text-primary hover:border-primary flex items-center justify-center rounded transition-colors"
                            aria-label="Subtract 15 seconds"
                           >
                               <span className="text-[10px] font-bold">-15</span>
                           </button>
                           <button
                            onClick={() => stopRestTimer()}
                            className="w-10 h-10 bg-black border border-[#333] text-[#666] hover:text-white hover:border-white flex items-center justify-center rounded transition-colors"
                            aria-label="Skip rest timer"
                           >
                               <ArrowRight size={16} />
                           </button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-black/95 border-b border-[#333] p-4 flex justify-between items-center safe-area-top" role="banner">
        <div className="flex items-center gap-4">
            {/* Live HR Monitor */}
            <div className="flex items-center gap-2 bg-[#111] px-2 py-1 rounded border border-[#222]" role="status" aria-live="polite" aria-label={`Heart rate: ${bpm} beats per minute`}>
                <Heart size={12} className="text-red-500 animate-pulse" fill="currentColor" aria-hidden="true" />
                <span className="text-xs font-mono font-bold text-white w-8 text-right">{bpm}</span>
            </div>
        </div>

        <div className="flex flex-col items-center">
          <h1 className="font-black italic uppercase text-lg tracking-tighter text-white">{activeWorkout.name}</h1>
          <span className="text-[10px] text-primary font-mono flex items-center gap-1" role="timer" aria-label={`Workout duration: ${Math.floor((Date.now() - activeWorkout.startTime) / 60000)} minutes`}>
            <Timer size={10} aria-hidden="true" /> {Math.floor((Date.now() - activeWorkout.startTime) / 60000)} MIN
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleFinish(); }}
          aria-label="Finish workout session"
          className="bg-primary text-black px-4 py-2 text-xs font-black uppercase italic tracking-wider hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
        >
          Finish
        </button>
      </div>

      {/* Workout Notes Section */}
      <div className="p-4 pb-0">
        <details className="bg-[#111] border border-[#222] rounded overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#888] hover:text-white transition-colors">
            <StickyNote size={14} />
            {activeWorkout.notes ? 'Edit Workout Notes' : 'Add Workout Notes'}
            {activeWorkout.notes && <span className="text-primary ml-auto">•</span>}
          </summary>
          <div className="px-4 pb-4">
            <textarea
              value={activeWorkout.notes || ''}
              onChange={(e) => updateActiveWorkout({ notes: e.target.value })}
              placeholder="Add general notes about this workout... Use #tags for organization (#injury, #form, #pr, etc.)"
              className="w-full bg-[#000] border border-[#333] p-3 text-xs text-[#aaa] font-mono outline-none focus:border-primary min-h-[80px] rounded"
            />
          </div>
        </details>
      </div>

      {/* Exercises List */}
      <div className="p-4 space-y-4">
        {activeWorkout.logs.map((log, exerciseIndex) => {
          const exerciseDef = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
          const hasEquipment = exerciseDef && settings.availableEquipment.includes(exerciseDef.equipment);
          const canSubstitute = exerciseDef && !hasEquipment;
          const showNotes = showNotesId === log.id || (log.notes && log.notes.length > 0);

          // Fetch previous session data for "Ghost Text"
          const previousLog = getExerciseHistory(log.exerciseId);
          const prevBestSet = previousLog ? [...previousLog.sets].sort((a,b) => b.weight - a.weight)[0] : null;

          // Superset Logic
          const isSupersetStart = log.supersetId && (exerciseIndex === 0 || activeWorkout.logs[exerciseIndex - 1].supersetId !== log.supersetId);
          const isSupersetEnd = log.supersetId && (exerciseIndex === activeWorkout.logs.length - 1 || activeWorkout.logs[exerciseIndex + 1].supersetId !== log.supersetId);
          const isSupersetMiddle = log.supersetId && !isSupersetStart && !isSupersetEnd;

          const isLinkedToNext = log.supersetId && activeWorkout.logs[exerciseIndex + 1]?.supersetId === log.supersetId;
          const isLinkedToPrev = log.supersetId && activeWorkout.logs[exerciseIndex - 1]?.supersetId === log.supersetId;

          // Circuit Notation Logic (A1, A2, B1, B2, etc.)
          let circuitLabel = '';
          if (log.supersetId) {
            // Find all unique superset IDs
            const uniqueSupersetIds = Array.from(new Set(activeWorkout.logs.filter(l => l.supersetId).map(l => l.supersetId)));
            const supersetGroupIndex = uniqueSupersetIds.indexOf(log.supersetId);
            const groupLetter = String.fromCharCode(65 + supersetGroupIndex); // A, B, C, etc.

            // Find position within this superset group
            const logsInGroup = activeWorkout.logs.filter(l => l.supersetId === log.supersetId);
            const positionInGroup = logsInGroup.findIndex(l => l.id === log.id) + 1;

            circuitLabel = `${groupLetter}${positionInGroup}`;
          }

          return (
            <div
                key={log.id}
                className={`bg-[#111] border-x border-[#222] relative group transition-all
                    ${isSupersetStart ? 'border-t border-[#222] rounded-t-xl mt-4' : ''}
                    ${isSupersetEnd ? 'border-b border-[#222] rounded-b-xl mb-4' : ''}
                    ${!log.supersetId ? 'border-y border-[#222] my-4' : ''}
                    ${isLinkedToPrev ? 'border-t-0 pt-0' : ''}
                    ${isLinkedToNext ? 'pb-2' : ''}
                `}
            >
              {/* Superset Connector */}
              {isLinkedToPrev && (
                  <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-6 h-6 bg-[#222] rounded-full flex items-center justify-center z-10 border border-[#333]">
                      <LinkIcon size={12} className="text-[#666]" />
                  </div>
              )}

              {/* Exercise Header */}
              <div className="p-4 flex justify-between items-start border-b border-[#222]">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {/* Circuit Notation Badge */}
                        {circuitLabel && (
                            <div className="flex items-center justify-center w-8 h-8 bg-primary text-black font-black text-sm border-2 border-primary/30 rounded-sm">
                                {circuitLabel}
                            </div>
                        )}
                        <h3 className="volt-header text-xl text-white">{exerciseDef?.name || 'Unknown Exercise'}</h3>
                        {/* Volume Warning Badge (Memoized) */}
                        {exerciseData[log.exerciseId]?.volumeWarning && (
                            <VolumeWarningBadge warning={exerciseData[log.exerciseId].volumeWarning} />
                        )}
                    </div>
                    {/* Form Video Button */}
                    {(exerciseDef?.customVideoUrl || exerciseDef?.videoUrl) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const videoUrl = exerciseDef.customVideoUrl || exerciseDef.videoUrl!;
                                setActiveVideo({ videoUrl, exerciseName: exerciseDef.name });
                            }}
                            className="inline-flex items-center gap-1 text-[10px] text-primary font-bold uppercase border border-primary/50 px-2 py-1 bg-primary/10 hover:bg-primary hover:text-black transition-colors mt-1"
                        >
                            <Play size={10} /> Watch Form Video
                        </button>
                    )}
                    {prevBestSet && (
                        <p className="text-[10px] text-[#666] font-mono mt-1 uppercase">
                            Prev Best: {prevBestSet.weight}lbs x {prevBestSet.reps}
                        </p>
                    )}
                    {!hasEquipment && (
                        <div className="flex items-center gap-2 mt-2">
                             <span className="text-red-500 text-[10px] font-bold uppercase flex items-center gap-1 border border-red-500/50 px-2 py-1 bg-red-500/10">
                                <AlertTriangle size={10} /> Equip Mismatch ({exerciseDef?.equipment})
                             </span>
                             {canSubstitute && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSwap(log.id, log.exerciseId); }}
                                    className="text-primary text-[10px] font-bold uppercase flex items-center gap-1 border border-primary/50 px-2 py-1 bg-primary/10 hover:bg-primary hover:text-black transition-colors"
                                >
                                    <RefreshCw size={10} /> Smart Swap
                                </button>
                             )}
                        </div>
                    )}
                </div>

                {/* Context Menu */}
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === log.id ? null : log.id); }}
                        className="text-[#444] hover:text-white p-2"
                        aria-label="Exercise options"
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {activeMenuId === log.id && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-[#222] border border-[#333] shadow-xl z-20 flex flex-col">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowNotesId(log.id); setActiveMenuId(null); }}
                                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#ccc] hover:bg-[#333] hover:text-white flex items-center gap-2"
                            >
                                <StickyNote size={14} /> {log.notes ? 'Edit Notes' : 'Add Note'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleSuperset(log.id); setActiveMenuId(null); }}
                                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#ccc] hover:bg-[#333] hover:text-white flex items-center gap-2"
                            >
                                {isLinkedToNext ? <Unlink size={14} /> : <LinkIcon size={14} />}
                                {isLinkedToNext ? 'Unlink from Next' : 'Link with Next (Superset)'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); initiateManualSwap(log.id); }}
                                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#ccc] hover:bg-[#333] hover:text-white flex items-center gap-2"
                            >
                                <RefreshCw size={14} /> Swap Movement
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeExerciseLog(log.id); setActiveMenuId(null); }}
                                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-[#1a0000] flex items-center gap-2 border-t border-[#333]"
                            >
                                <Trash2 size={14} /> Remove
                            </button>
                        </div>
                    )}
                </div>
              </div>

              {/* AI Progressive Overload Suggestion (Memoized) */}
              <div className="px-4 pt-3">
                 {exerciseData[log.exerciseId]?.suggestion && (() => {
                   const suggestion = exerciseData[log.exerciseId].suggestion;

                   const handleApplySuggestion = () => {
                     // Find first uncompleted set
                     const firstUncompletedIndex = log.sets.findIndex(s => !s.completed);
                     if (firstUncompletedIndex !== -1) {
                       updateSet(exerciseIndex, firstUncompletedIndex, {
                         weight: suggestion.weight,
                         reps: suggestion.reps[1] // Use upper bound of range
                       });
                     }
                   };

                   return (
                     <AISuggestionBadge
                       suggestion={suggestion}
                       onApply={handleApplySuggestion}
                       showApplyButton={log.sets.some(s => !s.completed)}
                       units={settings.units}
                     />
                   );
                 })()}
              </div>

              {/* AI Tip Section (Gemini API - Phase 4) */}
              <div className="px-4 pt-3">
                 {aiTip?.id === log.exerciseId ? (
                   <div className="text-xs text-[#ccff00] bg-[#ccff00]/5 p-3 border border-[#ccff00]/20 flex gap-2 font-mono">
                     <Sparkles size={14} className="shrink-0 mt-0.5" />
                     {aiTip.text}
                   </div>
                 ) : loadingAi === log.exerciseId ? (
                   <div className="text-xs text-primary bg-primary/5 p-3 border border-primary/20 flex gap-2 items-center font-mono">
                     <Sparkles size={14} className="shrink-0 animate-spin" />
                     <span className="animate-pulse">Analyzing workout data...</span>
                   </div>
                 ) : (
                   <button
                    onClick={(e) => { e.stopPropagation(); handleGetAiTip(log.exerciseId); }}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#666] flex items-center gap-1 hover:text-primary transition-colors"
                   >
                     <Sparkles size={10} />
                     GEMINI COACH (BETA)
                   </button>
                 )}
              </div>

              {/* Notes Field */}
              {showNotes && (
                  <div className="px-4 mt-3">
                      <textarea
                        value={log.notes || ''}
                        onChange={(e) => updateExerciseLog(log.id, { notes: e.target.value })}
                        placeholder="ADD NOTES..."
                        className="w-full bg-[#000] border border-[#333] p-3 text-xs text-[#aaa] font-mono outline-none focus:border-primary min-h-[60px]"
                      />
                  </div>
              )}

              {/* Sets Header */}
              <div className="grid grid-cols-12 gap-2 p-3 text-[10px] font-bold text-[#666] uppercase tracking-widest text-center mt-2">
                <div className="col-span-1">TAG</div>
                <div className="col-span-3">
                  {isBodyweightExercise(log.exerciseId) ? (
                    <span className="text-primary">+{(settings.units || 'lbs').toUpperCase()}</span>
                  ) : (
                    (settings.units || 'lbs').toUpperCase()
                  )}
                </div>
                <div className="col-span-3">REPS</div>
                <div className="col-span-2">
                  RPE
                  {parseRPETarget(activeWorkout.notes) && (
                    <span className="text-primary ml-0.5" title={`Target: RPE ${parseRPETarget(activeWorkout.notes)}`}>*</span>
                  )}
                </div>
                <div className="col-span-3">DONE</div>
              </div>

              {/* Sets */}
              <div className="space-y-2 pb-4 px-3">
                {log.sets.map((set, setIndex) => {
                  const previousSet = previousLog?.sets[setIndex];
                  const isBW = isBodyweightExercise(log.exerciseId);
                  const userBW = settings.bodyweight || 0;
                  // Get RPE target from workout notes (template notes)
                  const rpeTarget = parseRPETarget(activeWorkout.notes);

                  return (
                  <SwipeableRow
                    key={set.id}
                    onDelete={() => removeSet(exerciseIndex, setIndex)}
                    disabled={set.completed}
                  >
                  <div
                    className={`grid grid-cols-12 gap-2 items-start relative ${set.completed ? 'opacity-40 grayscale' : ''}`}
                  >
                    {/* Set Type Selector */}
                    <div className="col-span-1 flex justify-center pt-2">
                      <Suspense fallback={<Skeleton variant="circle" width={24} height={24} />}>
                        <SetTypeSelector
                          value={set.type}
                          onChange={(newType) => handleSetTypeChange(exerciseIndex, setIndex, newType)}
                          compact={true}
                          disabled={set.completed}
                        />
                      </Suspense>
                    </div>

                    {/* Weight Input */}
                    <div className="col-span-3 relative">
                      {isBW ? (
                        // Bodyweight exercise: weight field is for ADDITIONAL weight only (vest, belt, etc.)
                        // Like Hevy/Strong: "Weighted Bodyweight" type - user enters extra weight, not their bodyweight
                        <div className="relative">
                          <input
                            type="number"
                            value={set.weight || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value >= 0) {
                                updateSet(exerciseIndex, setIndex, { weight: value });
                              } else if (e.target.value === '') {
                                updateSet(exerciseIndex, setIndex, { weight: 0 });
                              }
                            }}
                            onFocus={(e) => {
                              // Track focused input for keyboard toolbar
                              setFocusedInput(e.currentTarget);
                              // Scroll input into view above keyboard
                              scrollInputIntoView(e.currentTarget);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const repsInput = e.currentTarget.parentElement?.parentElement?.nextElementSibling?.querySelector('input');
                                if (repsInput) {
                                  (repsInput as HTMLInputElement).focus();
                                  e.currentTarget.blur();
                                }
                              }
                            }}
                            placeholder="+0"
                            aria-label={`Added weight for set ${setIndex + 1} of ${exerciseDef?.name || 'exercise'} (bodyweight exercise - enter extra weight only)`}
                            inputMode="decimal"
                            enterKeyHint="next"
                            min="0"
                            step="0.25"
                            className="w-full bg-black border-b-2 border-primary/30 p-2 text-center text-lg font-bold text-white focus:border-primary outline-none placeholder-primary/50"
                            onClick={(e) => e.stopPropagation()}
                            disabled={set.completed}
                          />
                          <div className="text-[9px] text-primary/80 text-center mt-1 font-mono">
                            {set.weight > 0 ? `BW +${set.weight}` : 'BW only'}
                          </div>
                        </div>
                      ) : (
                        // Regular weighted exercise
                        <>
                          <input
                            type="number"
                            value={set.weight || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              // Prevent negative weights
                              if (!isNaN(value) && value >= 0) {
                                updateSet(exerciseIndex, setIndex, { weight: value });
                              } else if (e.target.value === '') {
                                updateSet(exerciseIndex, setIndex, { weight: 0 });
                              }
                            }}
                            onFocus={(e) => {
                              // Track focused input for keyboard toolbar
                              setFocusedInput(e.currentTarget);
                              // Scroll input into view above keyboard
                              scrollInputIntoView(e.currentTarget);
                            }}
                            onKeyDown={(e) => {
                              // Enter key: move to reps input and dismiss keyboard
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const repsInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                                if (repsInput) {
                                  (repsInput as HTMLInputElement).focus();
                                  // Blur current input to dismiss keyboard
                                  e.currentTarget.blur();
                                }
                              }
                            }}
                            placeholder={previousSet ? `${previousSet.weight}` : "0"}
                            aria-label={`Weight for set ${setIndex + 1} of ${exerciseDef?.name || 'exercise'}`}
                            inputMode="decimal"
                            enterKeyHint="next"
                            min="0"
                            step="0.25"
                            className="w-full bg-black border-b-2 border-[#333] p-2 text-center text-lg font-bold text-white focus:border-primary outline-none placeholder-[#333]"
                            onClick={(e) => e.stopPropagation()}
                            disabled={set.completed}
                          />
                          {/* Calculator Button */}
                          {set.weight > 0 && !set.completed && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setCalculatorTarget(set.weight); }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors bg-black/50 p-1 rounded"
                                aria-label="Open plate calculator"
                              >
                                  <Calculator size={16} />
                              </button>
                          )}

                          {previousSet && !set.weight && (
                              <div className="text-[9px] text-[#444] text-center mt-1 font-mono">{previousSet.weight}</div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Reps Input */}
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          // Prevent negative reps and enforce minimum of 1
                          if (!isNaN(value) && value >= 0) {
                            updateSet(exerciseIndex, setIndex, { reps: value });
                          } else if (e.target.value === '') {
                            updateSet(exerciseIndex, setIndex, { reps: 0 });
                          }
                        }}
                        onFocus={(e) => {
                          // Track focused input for keyboard toolbar
                          setFocusedInput(e.currentTarget);
                          // Scroll input into view above keyboard
                          scrollInputIntoView(e.currentTarget);
                        }}
                        onKeyDown={(e) => {
                          // Enter key: complete the set (if weight and reps are valid) and dismiss keyboard
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (set.weight > 0 && set.reps > 0 && !set.completed) {
                              handleSetComplete(exerciseIndex, setIndex, true, set.weight, set.reps, log.exerciseId);
                              // Blur input to dismiss keyboard after completing set
                              e.currentTarget.blur();
                            } else {
                              // If set can't be completed, still dismiss keyboard
                              e.currentTarget.blur();
                            }
                          }
                        }}
                        placeholder={previousSet ? `${previousSet.reps}` : "0"}
                        aria-label={`Repetitions for set ${setIndex + 1} of ${exerciseDef?.name || 'exercise'}`}
                        inputMode="numeric"
                        enterKeyHint="done"
                        min="1"
                        step="1"
                        className="w-full bg-black border-b-2 border-[#333] p-2 text-center text-lg font-bold text-white focus:border-primary outline-none placeholder-[#333]"
                        onClick={(e) => e.stopPropagation()}
                        disabled={set.completed}
                      />
                       {previousSet && !set.reps && (
                          <div className="text-[9px] text-[#444] text-center mt-1 font-mono">{previousSet.reps}</div>
                      )}
                    </div>

                    {/* RPE Input - Pre-populated with target from template notes */}
                    <div className="col-span-2">
                        <select
                             value={set.rpe || (rpeTarget && !set.completed ? rpeTarget : '')}
                             onChange={(e) => updateSet(exerciseIndex, setIndex, { rpe: parseInt(e.target.value) || undefined })}
                             aria-label={`Rate of perceived exertion for set ${setIndex + 1} of ${exerciseDef?.name || 'exercise'}${rpeTarget ? ` (target: ${rpeTarget})` : ''}`}
                             className={`w-full bg-black border-b-2 p-2 text-center text-lg font-bold focus:border-primary outline-none appearance-none ${
                               set.rpe ? 'border-[#333] text-white' : rpeTarget ? 'border-primary/30 text-primary/60' : 'border-[#333] text-[#888]'
                             }`}
                             onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">{rpeTarget ? `${rpeTarget}*` : '-'}</option>
                            {[...Array(10)].map((_, i) => (
                                <option key={i} value={10 - i}>{10 - i}</option>
                            ))}
                        </select>
                        {rpeTarget && !set.rpe && (
                            <div className="text-[8px] text-primary/60 text-center mt-0.5 font-mono">TARGET</div>
                        )}
                    </div>

                    {/* Completion Check / Duplicate Button */}
                    <div className="col-span-3 flex justify-center gap-1">
                       {!set.completed ? (
                         <button
                          onClick={(e) => {
                              e.stopPropagation();
                              handleSetComplete(exerciseIndex, setIndex, true, set.weight, set.reps, log.exerciseId);
                          }}
                          className="w-full h-10 flex items-center justify-center transition-all bg-[#222] text-[#444] hover:bg-[#333]"
                         >
                           <Check size={20} strokeWidth={3} />
                         </button>
                       ) : (
                         <button
                          onClick={(e) => {
                              e.stopPropagation();
                              handleSetComplete(exerciseIndex, setIndex, false, set.weight, set.reps, log.exerciseId);
                          }}
                          className="w-full h-10 flex items-center justify-center transition-all bg-primary text-black hover:bg-white"
                          aria-label="Mark as incomplete"
                         >
                           <Check size={16} strokeWidth={3} />
                         </button>
                       )}
                    </div>
                  </div>
                  </SwipeableRow>
                )})}

                {/* Actions Row */}
                <div className="flex justify-center pt-2">
                  <button onClick={(e) => { e.stopPropagation(); addSet(exerciseIndex); }} className="w-full py-2 bg-[#1a1a1a] text-[#666] text-xs font-bold uppercase tracking-widest hover:text-white hover:bg-[#222] transition-colors flex items-center justify-center gap-2">
                    <Plus size={12} /> Add Set
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Exercise Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();

            // Prevent reopening if modal was just closed
            if (modalClosingRef.current) {
              console.log('[ADD EXERCISE BUTTON] Blocked - modal recently closed');
              return;
            }

            console.log('[ADD EXERCISE BUTTON] Clicked - opening modal');
            setSwapTargetLogId(null);
            setShowExerciseSelector(true);
          }}
          className="w-full py-6 border border-[#333] bg-[#0a0a0a] text-[#666] font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-2"
        >
          <Plus size={24} />
          Add Exercise
        </button>
      </div>

      {/* Exercise Selector Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-selector-title"
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in backdrop-blur-sm"
        style={{
          display: showExerciseSelector ? 'flex' : 'none',
          pointerEvents: showExerciseSelector ? 'auto' : 'none',
          visibility: showExerciseSelector ? 'visible' : 'hidden',
          opacity: showExerciseSelector ? 1 : 0
        }}
      >
          <div className="bg-[#111] w-full h-full sm:max-w-md sm:h-[90vh] border-t border-[#333] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[#333] flex justify-between items-center">
              <h2 id="exercise-selector-title" className="volt-header text-xl text-white">
                  {swapTargetLogId ? 'SWAP MOVEMENT' : 'SELECT MOVEMENT'}
              </h2>
              <button
                onClick={() => {
                  setShowExerciseSelector(false);
                  setExerciseSearchQuery('');
                }}
                aria-label="Close exercise selector"
                className="text-white hover:text-primary transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-[#333]">
              <input
                type="text"
                placeholder="Search exercises..."
                value={exerciseSearchQuery}
                onChange={(e) => setExerciseSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-3 font-mono text-sm focus:border-primary focus:outline-none placeholder-[#666]"
                autoFocus
              />
              {exerciseSearchQuery && (
                <div className="text-[10px] text-[#666] mt-2 font-mono">
                  {getAllExercises().filter(ex =>
                    ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
                    ex.muscleGroup.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
                    ex.equipment.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
                  ).length} results
                </div>
              )}
            </div>

            {/* STICKY Create New Exercise Button - Always Visible */}
            <div className="p-3 border-b-2 border-primary/30 bg-[#0a0a0a]">
              <button
                onClick={() => setShowCreateExercise(true)}
                className="w-full py-3 bg-primary text-black font-black uppercase italic tracking-wider text-sm hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Create New Exercise
              </button>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-2">
              {(() => {
                const filteredExercises = getAllExercises()
                  .filter(ex => {
                    // Filter by search query
                    if (!exerciseSearchQuery) return true;
                    const query = exerciseSearchQuery.toLowerCase();
                    return (
                      ex.name.toLowerCase().includes(query) ||
                      ex.muscleGroup.toLowerCase().includes(query) ||
                      ex.equipment.toLowerCase().includes(query)
                    );
                  })
                  .sort((a, b) => {
                    const aFav = settings.favoriteExercises?.includes(a.id) ?? false;
                    const bFav = settings.favoriteExercises?.includes(b.id) ?? false;
                    if (aFav && !bFav) return -1;
                    if (!aFav && bFav) return 1;
                    return 0;
                  });

                // EMPTY STATE - No search results
                if (filteredExercises.length === 0 && exerciseSearchQuery) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <div className="mb-4 p-4 bg-[#1a1a1a] rounded-full border-2 border-[#333]">
                        <Search className="text-[#666]" size={32} />
                      </div>
                      <h3 className="text-lg font-black italic uppercase text-white mb-2">
                        No Results Found
                      </h3>
                      <p className="text-sm text-[#666] mb-6 max-w-xs">
                        Can't find "<span className="text-primary font-bold">{exerciseSearchQuery}</span>"? Create it as a custom exercise.
                      </p>
                      <button
                        onClick={() => setShowCreateExercise(true)}
                        className="px-6 py-3 bg-primary text-black font-black uppercase italic tracking-wider text-sm hover:bg-white transition-colors flex items-center gap-2"
                      >
                        <Plus size={18} />
                        Create "{exerciseSearchQuery.slice(0, 20)}{exerciseSearchQuery.length > 20 ? '...' : ''}"
                      </button>
                    </div>
                  );
                }

                return filteredExercises.map(ex => {
                  const isFavorite = settings.favoriteExercises?.includes(ex.id) ?? false;
                  return (
                    <div
                      key={ex.id}
                      className="flex items-center gap-2 border-b border-[#222] hover:bg-[#222] group"
                    >
                      {/* Star Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteExercise(ex.id);
                        }}
                        className="p-4 hover:bg-[#333] transition-colors"
                        aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
                      >
                        <Heart
                          size={18}
                          className={isFavorite ? 'text-primary fill-primary' : 'text-[#444] group-hover:text-[#666]'}
                        />
                      </button>

                      {/* Exercise Info */}
                      <button
                        onClick={() => {
                          // Match the exact pattern from Create Exercise handler (lines 1574-1583)
                          if (swapTargetLogId) {
                            // If workout came from a template, show options modal
                            if (activeWorkout?.sourceTemplateId) {
                              setPendingSwap({ logId: swapTargetLogId, exerciseId: ex.id, exerciseName: ex.name });
                            } else {
                              // No template, just swap for this session
                              swapExercise(swapTargetLogId, ex.id);
                            }
                            setSwapTargetLogId(null);
                          } else {
                            addExerciseToActive(ex.id);
                          }
                          setShowExerciseSelector(false);
                          setExerciseSearchQuery('');
                        }}
                        className="flex-1 text-left py-4 pr-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white uppercase italic group-hover:text-primary transition-colors">
                              {ex.name}
                            </h4>
                            {isFavorite && (
                              <span className="text-[9px] text-primary font-mono uppercase tracking-wider">
                                FAVORITE
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#666] font-mono">{ex.muscleGroup} // {ex.equipment}</span>
                        </div>
                        {swapTargetLogId ? (
                          <RefreshCw size={18} className="text-[#444] group-hover:text-primary" />
                        ) : (
                          <Plus size={18} className="text-[#444] group-hover:text-primary" />
                        )}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
      </div>

      {/* Create Exercise Modal */}
      {showCreateExercise && (
        <CreateExerciseModal
          onClose={() => setShowCreateExercise(false)}
          onCreate={(exercise) => {
            const newId = createCustomExercise(exercise);
            if (swapTargetLogId) {
              // If workout came from a template, show options modal
              if (activeWorkout?.sourceTemplateId) {
                setPendingSwap({ logId: swapTargetLogId, exerciseId: newId, exerciseName: exercise.name });
              } else {
                swapExercise(swapTargetLogId, newId);
              }
              setSwapTargetLogId(null);
            } else {
              addExerciseToActive(newId);
            }
            setShowCreateExercise(false);
            setShowExerciseSelector(false);
            setExerciseSearchQuery('');
          }}
          defaultName={exerciseSearchQuery}
        />
      )}

      {/* Workout Completion Modal */}
      {showCompletionModal && activeWorkout && (
        <Suspense fallback={<div />}>
          <WorkoutCompletionModal
            workout={activeWorkout}
            settings={settings}
            onFinish={handleCompleteWorkout}
            onSaveDraft={handleSaveDraft}
            onCancel={handleDiscardWorkout}
            onDismiss={() => setShowCompletionModal(false)}
          />
        </Suspense>
      )}

      {/* Phase 5: AMAP Completion Modal */}
      {amapModalData && (
        <Suspense fallback={<div />}>
          <AMAPCompletionModal
            isOpen={true}
            onClose={() => setAmapModalData(null)}
            onConfirm={handleAmapConfirm}
            exerciseId={amapModalData.exerciseId}
            exerciseName={amapModalData.exerciseName}
            currentTM={amapModalData.currentTM}
            amapReps={amapModalData.amapReps}
            setData={amapModalData.setData}
          />
        </Suspense>
      )}

      {/* Phase 5: Cycle Completion Modal */}
      {cycleModalData && (
        <Suspense fallback={<div />}>
          <CycleCompletionModal
            isOpen={true}
            onClose={() => setCycleModalData(null)}
            onStartNextCycle={handleStartNextCycle}
            cyclesCompleted={cycleModalData.cyclesCompleted}
            programName={cycleModalData.programName}
            recentSessions={history.slice(0, 12)}
            tmUpdates={cycleModalData.tmUpdates}
          />
        </Suspense>
      )}

      {/* Gamification: XP Celebration Modal */}
      <XPCelebrationModal
        isOpen={showXPCelebration}
        onClose={handleXPCelebrationClose}
        workout={completedWorkoutRef}
      />

      {/* ML: Post-Workout Feedback Modal */}
      {showPostWorkoutFeedback && completedWorkoutRef && (
        <Suspense fallback={<div />}>
          <PostWorkoutFeedback
            workout={completedWorkoutRef}
            isOpen={true}
            onClose={handleFeedbackComplete}
            onComplete={handleFeedbackComplete}
          />
        </Suspense>
      )}

      {/* Swap Options Modal - Session vs Persistent */}
      {pendingSwap && (
        <SwapOptionsModal
          exerciseName={pendingSwap.exerciseName}
          onSessionOnly={() => {
            swapExercise(pendingSwap.logId, pendingSwap.exerciseId, false);
            setPendingSwap(null);
          }}
          onPersistent={() => {
            swapExercise(pendingSwap.logId, pendingSwap.exerciseId, true);
            setPendingSwap(null);
          }}
          onCancel={() => setPendingSwap(null)}
        />
      )}

      {/* In-App Video Player Modal */}
      {activeVideo && (
        <InAppVideoPlayer
          videoUrl={activeVideo.videoUrl}
          exerciseName={activeVideo.exerciseName}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* Smart Swap Modal */}
      {smartSwapData && (
        <SmartSwapModal
          currentExercise={smartSwapData.currentExercise}
          suggestedExercise={smartSwapData.suggestions[0]}
          allSuggestions={smartSwapData.suggestions}
          onConfirm={handleSmartSwapConfirm}
          onCancel={() => setSmartSwapData(null)}
          onViewAll={handleSmartSwapViewAll}
        />
      )}

      {/* Undo Toast */}
      {undoStack && (
        <Toast
          message={undoStack.type === 'set' ? 'Set deleted' : 'Exercise removed'}
          action={{
            label: 'UNDO',
            onClick: restoreLastDeleted,
          }}
          onClose={clearUndoStack}
          type="warning"
          duration={5000}
        />
      )}

      {/* iOS-style Keyboard Toolbar */}
      <KeyboardToolbar
        currentInput={focusedInput}
        onPrevious={handleKeyboardPrevious}
        onNext={handleKeyboardNext}
        onDone={handleKeyboardDone}
        hasPrevious={checkHasPrevious()}
        hasNext={checkHasNext()}
      />
    </div>
  );
};

// Create Exercise Modal Component
interface CreateExerciseModalProps {
  onClose: () => void;
  onCreate: (exercise: Omit<import('../types').Exercise, 'id'>) => void;
  defaultName?: string;
}

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as const;
const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Band', 'Other'] as const;
const CATEGORIES = ['Compound', 'Isolation', 'Cardio', 'Machine', 'Bodyweight', 'Plyometric'] as const;
const CreateExerciseModal = ({ onClose, onCreate, defaultName = '' }: CreateExerciseModalProps) => {
  const [name, setName] = useState(defaultName);
  const [muscleGroup, setMuscleGroup] = useState<typeof MUSCLE_GROUPS[number]>('Chest');
  const [equipment, setEquipment] = useState<typeof EQUIPMENT_OPTIONS[number]>('Barbell');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Compound');
  const [customVideoUrl, setCustomVideoUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      muscleGroup: muscleGroup as import('../types').MuscleGroup,
      equipment,
      category,
      formGuide: [],
      commonMistakes: [],
      tips: [],
      customVideoUrl: customVideoUrl.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center animate-fade-in backdrop-blur-sm">
      <div className="bg-[#111] w-full max-w-md mx-4 border border-[#333] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-[#333] flex justify-between items-center sticky top-0 bg-[#111]">
          <h2 className="volt-header text-xl text-white">CREATE EXERCISE</h2>
          <button onClick={onClose} className="text-white hover:text-primary transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[10px] text-[#666] font-mono uppercase mb-2">
              Exercise Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bulgarian Split Squat"
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-3 font-mono text-sm focus:border-primary focus:outline-none placeholder-[#444]"
              autoFocus
              required
            />
          </div>

          {/* Muscle Group */}
          <div>
            <label className="block text-[10px] text-[#666] font-mono uppercase mb-2">
              Primary Muscle Group *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MUSCLE_GROUPS.map(mg => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => setMuscleGroup(mg)}
                  className={`py-2 px-3 text-xs font-bold uppercase transition-colors ${
                    muscleGroup === mg
                      ? 'bg-primary text-black'
                      : 'bg-[#1a1a1a] text-[#666] hover:bg-[#222] hover:text-white'
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-[10px] text-[#666] font-mono uppercase mb-2">
              Equipment *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {EQUIPMENT_OPTIONS.map(eq => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => setEquipment(eq)}
                  className={`py-2 px-2 text-[10px] font-bold uppercase transition-colors ${
                    equipment === eq
                      ? 'bg-primary text-black'
                      : 'bg-[#1a1a1a] text-[#666] hover:bg-[#222] hover:text-white'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] text-[#666] font-mono uppercase mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2 text-[10px] font-bold uppercase transition-colors ${
                    category === cat
                      ? 'bg-primary text-black'
                      : 'bg-[#1a1a1a] text-[#666] hover:bg-[#222] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Video URL */}
          <div>
            <label className="block text-[10px] text-[#666] font-mono uppercase mb-2">
              Form Video URL (Optional)
            </label>
            <input
              type="url"
              value={customVideoUrl}
              onChange={(e) => setCustomVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-3 font-mono text-sm focus:border-primary focus:outline-none placeholder-[#444]"
            />
            <p className="text-[9px] text-[#666] mt-1.5 font-mono">
              Add a YouTube link for exercise form guidance
            </p>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[#333]">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest italic text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create & Add to Workout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Swap Options Modal Component - Session vs Persistent
interface SwapOptionsModalProps {
  exerciseName: string;
  onSessionOnly: () => void;
  onPersistent: () => void;
  onCancel: () => void;
}

const SwapOptionsModal = ({ exerciseName, onSessionOnly, onPersistent, onCancel }: SwapOptionsModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center animate-fade-in backdrop-blur-sm">
      <div className="bg-[#111] w-full max-w-sm mx-4 border border-[#333]">
        {/* Header */}
        <div className="p-4 border-b border-[#333] text-center">
          <h2 className="volt-header text-lg text-white">SWAP EXERCISE</h2>
          <p className="text-[10px] text-[#666] font-mono uppercase mt-1">
            Replacing with {exerciseName}
          </p>
        </div>

        {/* Options */}
        <div className="p-4 space-y-3">
          {/* Session Only Option */}
          <button
            onClick={onSessionOnly}
            className="w-full py-4 px-4 bg-[#1a1a1a] border border-[#333] hover:border-primary hover:bg-[#222] transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#222] group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <RefreshCw size={18} className="text-[#666] group-hover:text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase text-sm group-hover:text-primary transition-colors">
                  This Session Only
                </h4>
                <p className="text-[10px] text-[#666] font-mono">
                  Swap just for this workout
                </p>
              </div>
            </div>
          </button>

          {/* Persistent Option */}
          <button
            onClick={onPersistent}
            className="w-full py-4 px-4 bg-[#1a1a1a] border border-[#333] hover:border-primary hover:bg-[#222] transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#222] group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <LinkIcon size={18} className="text-[#666] group-hover:text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase text-sm group-hover:text-primary transition-colors">
                  Update Template
                </h4>
                <p className="text-[10px] text-[#666] font-mono">
                  Also update for all future workouts
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Cancel */}
        <div className="p-4 border-t border-[#333]">
          <button
            onClick={onCancel}
            className="w-full py-3 text-[#666] hover:text-white font-bold uppercase text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutLogger;
