
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { EXERCISE_LIBRARY } from '../constants';
import { Check, Plus, MoreHorizontal, Timer, Sparkles, X, AlertTriangle, RefreshCw, Trash2, StickyNote, Trophy, ArrowRight, Calculator, ChevronDown, Link as LinkIcon, Unlink, Heart } from 'lucide-react';
import { getProgressiveOverloadTip } from '../services/geminiService';
import { sendRestTimerAlert, sendPRCelebration } from '../services/notificationService';
import { SetType } from '../types';
import { formatTime } from '../utils/formatters';
import { calculatePlateLoading, formatWeight } from '../utils/conversions';
import { AISuggestionBadge, VolumeWarningBadge, RecoveryScore } from '../components/AISuggestionBadge';
import { checkAllPRs, PRDetection } from '../services/strengthScore';
import PRCelebration from '../components/PRCelebration';
import SetTypeSelector from '../components/SetTypeSelector';
import WorkoutCompletionModal from '../components/WorkoutCompletionModal';
import SwipeableRow from '../components/SwipeableRow';

const WorkoutLogger = () => {
  const { activeWorkout, finishWorkout, saveDraft, cancelWorkout, updateSet, addSet, duplicateSet, removeSet, addExerciseToActive, settings, history, swapExercise, updateExerciseLog, removeExerciseLog, getExerciseHistory, restTimerStart, restDuration, startRestTimer, stopRestTimer, toggleSuperset, updateActiveWorkout, addBiometricPoint, getProgressiveSuggestion, getVolumeWarning } = useStore();
  const navigate = useNavigate();
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [swapTargetLogId, setSwapTargetLogId] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [aiTip, setAiTip] = useState<{id: string, text: string} | null>(null);
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showNotesId, setShowNotesId] = useState<string | null>(null);

  // Plate Calculator State
  const [calculatorTarget, setCalculatorTarget] = useState<number | null>(null);

  // Timer Local State (synced with global)
  const [timeLeft, setTimeLeft] = useState(0);

  // PR Celebration State (Enhanced Multi-PR Detection)
  const [activePRs, setActivePRs] = useState<{ prs: PRDetection[]; exerciseName: string } | null>(null);

  // Live Heart Rate Simulation State
  const [bpm, setBpm] = useState(70);

  // Track if notification was sent for current rest timer session
  const [notificationSent, setNotificationSent] = useState(false);

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

  if (!activeWorkout) {
    return (
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
    );
  }

  const handleFinish = () => {
    setShowCompletionModal(true);
  };

  const handleCompleteWorkout = () => {
    finishWorkout();
    setShowCompletionModal(false);
    navigate('/history');
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
          // Trigger Global Rest Timer
          startRestTimer(settings.defaultRestTimer || 90);

          // Enhanced Multi-PR Detection (Alpha Progression strategy)
          const prHistory = settings.personalRecords[exerciseId];
          const currentSet = activeWorkout?.logs[exerciseIndex]?.sets[setIndex];

          if (currentSet && weight > 0 && reps > 0) {
              const detectedPRs = checkAllPRs(currentSet, prHistory);

              if (detectedPRs.length > 0) {
                  const exerciseName = EXERCISE_LIBRARY.find(e => e.id === exerciseId)?.name || 'Exercise';
                  setActivePRs({ prs: detectedPRs, exerciseName });

                  // Send PR celebration notification
                  if (settings.notifications?.enabled && settings.notifications?.prCelebrations) {
                      // Send notification for the most significant PR
                      const primaryPR = detectedPRs[0];
                      const achievement = primaryPR.type === 'weight'
                          ? `${primaryPR.newValue}${settings.units} x ${reps}`
                          : primaryPR.type === 'reps'
                          ? `${reps} reps @ ${weight}${settings.units}`
                          : `${primaryPR.newValue}${settings.units} volume`;

                      sendPRCelebration(
                          detectedPRs.length > 1 ? `${detectedPRs.length} PRs` : primaryPR.type,
                          exerciseName,
                          achievement
                      );
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

  const findSubstitutes = (exerciseId: string) => {
      const currentEx = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
      if (!currentEx) return [];
      
      return EXERCISE_LIBRARY.filter(e => 
          e.muscleGroup === currentEx.muscleGroup && 
          e.id !== exerciseId &&
          settings.availableEquipment.includes(e.equipment)
      );
  };

  const handleSwap = (logId: string, currentExerciseId: string) => {
      const subs = findSubstitutes(currentExerciseId);
      const currentEx = EXERCISE_LIBRARY.find(e => e.id === currentExerciseId);
      
      if (subs.length > 0) {
          const suggestion = subs[0];
          if(confirm(`Smart Swap: Replace ${currentEx?.name} with ${suggestion.name} based on your equipment?`)) {
              swapExercise(logId, suggestion.id);
          }
      } else {
          alert("No suitable substitutions found matching your available equipment.");
      }
  };

  const initiateManualSwap = (logId: string) => {
      setSwapTargetLogId(logId);
      setShowExerciseSelector(true);
      setActiveMenuId(null);
  };

  // Plate Calc Logic using unit-aware conversion utility
  const getPlates = (target: number) => {
      const bar = settings.barWeight || (settings.units === 'kg' ? 20 : 45);
      const customPlates = settings.availablePlates?.[settings.units];
      return calculatePlateLoading(target, bar, settings.units, customPlates);
  };

  // Rest Timer Progress Percentage
  const timerProgress = Math.min(100, Math.max(0, (timeLeft / restDuration) * 100));

  return (
    <div className="pb-32 bg-background min-h-screen" onClick={() => setActiveMenuId(null)}>
      {/* Enhanced PR Celebration (Multi-PR Detection + Confetti + Haptic) */}
      {activePRs && (
          <PRCelebration
              prs={activePRs.prs}
              exerciseName={activePRs.exerciseName}
              onClose={() => setActivePRs(null)}
              autoCloseDuration={5000}
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
                      <span className="text-4xl font-black italic text-primary">{calculatorTarget} <span className="text-lg text-white">{settings.units.toUpperCase()}</span></span>
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
                      Based on {settings.barWeight}{settings.units.toUpperCase()} Bar • Per Side Shown
                  </div>
              </div>
          </div>
      )}

      {/* Rest Timer Overlay */}
      {restTimerStart !== null && (
          <div className={`fixed bottom-24 left-4 right-4 bg-[#0a0a0a] border ${timeLeft === 0 ? 'border-primary animate-pulse' : 'border-[#333]'} p-0 z-40 shadow-2xl overflow-hidden animate-slide-up rounded-lg`}>
              {/* Progress Bar Background */}
              <div 
                className="absolute top-0 left-0 bottom-0 bg-[#222] transition-all duration-500 ease-linear z-0" 
                style={{ width: `${timerProgress}%` }}
              />
              
              <div className="relative z-10 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${timeLeft === 0 ? 'bg-primary' : 'bg-[#ccff00] animate-pulse'}`}></div>
                      <div>
                          <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest block mb-0.5">Recovery Mode</span>
                          <span className={`text-3xl font-black italic font-mono leading-none ${timeLeft === 0 ? 'text-primary' : 'text-white'}`}>
                              {timeLeft === 0 ? "GO!" : formatTime(timeLeft)}
                          </span>
                      </div>
                  </div>
                  
                  <div className="flex gap-2">
                       <button 
                        onClick={() => {
                            startRestTimer(restDuration + 30);
                        }} 
                        className="w-10 h-10 bg-black border border-[#333] text-white hover:text-primary hover:border-primary flex items-center justify-center rounded transition-colors"
                       >
                           <span className="text-[10px] font-bold">+30</span>
                       </button>
                       <button 
                        onClick={() => stopRestTimer()} 
                        className="w-10 h-10 bg-black border border-[#333] text-[#666] hover:text-white hover:border-white flex items-center justify-center rounded transition-colors"
                       >
                           <ArrowRight size={16} />
                       </button>
                  </div>
              </div>
          </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-black/95 border-b border-[#333] p-4 flex justify-between items-center safe-area-top" role="banner">
        <div className="flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); if(confirm("ABORT SESSION?")) { cancelWorkout(); navigate('/lift'); } }}
              aria-label="Abort workout session"
              className="text-[#666] text-xs font-bold uppercase tracking-wider hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
            Abort
            </button>
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
        <details className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
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
                        {/* Volume Warning Badge */}
                        {(() => {
                            const volumeWarning = getVolumeWarning(log.exerciseId);
                            return volumeWarning && <VolumeWarningBadge warning={volumeWarning} />;
                        })()}
                    </div>
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

              {/* AI Progressive Overload Suggestion */}
              <div className="px-4 pt-3">
                 {(() => {
                   const suggestion = getProgressiveSuggestion(log.exerciseId);
                   if (!suggestion) return null;

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
                 ) : (
                   <button
                    disabled={loadingAi === log.exerciseId}
                    onClick={(e) => { e.stopPropagation(); handleGetAiTip(log.exerciseId); }}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#666] flex items-center gap-1 hover:text-primary transition-colors disabled:opacity-50"
                   >
                     <Sparkles size={10} />
                     {loadingAi === log.exerciseId ? 'ANALYZING...' : 'GEMINI COACH (BETA)'}
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
                <div className="col-span-3">{settings.units.toUpperCase()}</div>
                <div className="col-span-3">REPS</div>
                <div className="col-span-2">RPE</div>
                <div className="col-span-3">DONE</div>
              </div>

              {/* Sets */}
              <div className="space-y-2 pb-4 px-3">
                {log.sets.map((set, setIndex) => {
                  const previousSet = previousLog?.sets[setIndex];

                  return (
                  <SwipeableRow
                    key={set.id}
                    onDelete={() => removeSet(exerciseIndex, setIndex)}
                    onDuplicate={() => duplicateSet(exerciseIndex, setIndex)}
                    disabled={set.completed}
                  >
                  <div className={`grid grid-cols-12 gap-2 items-start ${set.completed ? 'opacity-40 grayscale' : ''}`}>
                    {/* Set Type Selector */}
                    <div className="col-span-1 flex justify-center pt-2">
                      <SetTypeSelector
                        value={set.type}
                        onChange={(newType) => handleSetTypeChange(exerciseIndex, setIndex, newType)}
                        compact={true}
                        disabled={set.completed}
                      />
                    </div>
                    
                    {/* Weight Input */}
                    <div className="col-span-3 relative">
                      <input
                        type="number"
                        value={set.weight || ''}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, { weight: parseFloat(e.target.value) })}
                        placeholder={previousSet ? `${previousSet.weight}` : "0"}
                        aria-label={`Weight for set ${setIndex + 1} of ${exerciseDef?.name || 'exercise'}`}
                        inputMode="decimal"
                        className="w-full bg-black border-b-2 border-[#333] p-2 text-center text-lg font-bold text-white focus:border-primary outline-none placeholder-[#333]"
                        onClick={(e) => e.stopPropagation()}
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
                    </div>

                    {/* Reps Input */}
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, { reps: parseFloat(e.target.value) })}
                        placeholder={previousSet ? `${previousSet.reps}` : "0"}
                        aria-label={`Repetitions for set ${setIndex + 1} of ${exerciseDef?.name || 'exercise'}`}
                        inputMode="numeric"
                        className="w-full bg-black border-b-2 border-[#333] p-2 text-center text-lg font-bold text-white focus:border-primary outline-none placeholder-[#333]"
                        onClick={(e) => e.stopPropagation()}
                      />
                       {previousSet && !set.reps && (
                          <div className="text-[9px] text-[#444] text-center mt-1 font-mono">{previousSet.reps}</div>
                      )}
                    </div>

                    {/* RPE Input */}
                    <div className="col-span-2">
                        <select
                             value={set.rpe || ''}
                             onChange={(e) => updateSet(exerciseIndex, setIndex, { rpe: parseInt(e.target.value) })}
                             aria-label={`Rate of perceived exertion for set ${setIndex + 1} of ${exerciseDef?.name || 'exercise'}`}
                             className="w-full bg-black border-b-2 border-[#333] p-2 text-center text-sm font-bold text-[#888] focus:border-primary outline-none appearance-none"
                             onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">-</option>
                            {[...Array(10)].map((_, i) => (
                                <option key={i} value={10 - i}>{10 - i}</option>
                            ))}
                        </select>
                    </div>

                    {/* Completion Check */}
                    <div className="col-span-3 flex justify-center">
                       <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSetComplete(exerciseIndex, setIndex, !set.completed, set.weight, set.reps, log.exerciseId);
                        }}
                        className={`w-full h-10 flex items-center justify-center transition-all ${set.completed ? 'bg-primary text-black' : 'bg-[#222] text-[#444] hover:bg-[#333]'}`}
                       >
                         <Check size={20} strokeWidth={3} />
                       </button>
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
          onClick={(e) => { e.stopPropagation(); setSwapTargetLogId(null); setShowExerciseSelector(true); }}
          className="w-full py-6 border border-[#333] bg-[#0a0a0a] text-[#666] font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-2"
        >
          <Plus size={24} />
          Add Exercise
        </button>
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center animate-fade-in backdrop-blur-sm">
          <div className="bg-[#111] w-full max-w-md h-[80vh] border-t border-[#333] flex flex-col">
            <div className="p-4 border-b border-[#333] flex justify-between items-center">
              <h2 className="volt-header text-xl text-white">
                  {swapTargetLogId ? 'SWAP MOVEMENT' : 'SELECT MOVEMENT'}
              </h2>
              <button onClick={() => setShowExerciseSelector(false)} className="text-white"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {EXERCISE_LIBRARY.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => {
                    if (swapTargetLogId) {
                        swapExercise(swapTargetLogId, ex.id);
                    } else {
                        addExerciseToActive(ex.id);
                    }
                    setShowExerciseSelector(false);
                    setSwapTargetLogId(null);
                  }}
                  className="w-full text-left p-4 hover:bg-[#222] flex justify-between items-center group border-b border-[#222]"
                >
                  <div>
                    <h4 className="font-bold text-white uppercase italic group-hover:text-primary transition-colors">{ex.name}</h4>
                    <span className="text-[10px] text-[#666] font-mono">{ex.muscleGroup} // {ex.equipment}</span>
                  </div>
                  {swapTargetLogId ? (
                      <RefreshCw size={18} className="text-[#444] group-hover:text-primary" />
                  ) : (
                      <Plus size={18} className="text-[#444] group-hover:text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workout Completion Modal */}
      {showCompletionModal && (
        <WorkoutCompletionModal
          onFinish={handleCompleteWorkout}
          onSaveDraft={handleSaveDraft}
          onCancel={handleDiscardWorkout}
          onDismiss={() => setShowCompletionModal(false)}
        />
      )}
    </div>
  );
};

export default WorkoutLogger;
