import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, X, Clock, Dumbbell, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { haptic } from '../services/haptics';

/**
 * WorkoutRecoveryPrompt
 * Shows a modal when there's an interrupted workout that can be resumed
 */
export const WorkoutRecoveryPrompt: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkout, finishWorkout } = useStore();
  const [showPrompt, setShowPrompt] = useState(false);

  // Check if there's an interrupted workout on mount
  useEffect(() => {
    // Don't show prompt if already on workout page (actively working out)
    if (window.location.hash.includes('/workout')) {
      return;
    }

    if (activeWorkout) {
      // Check if this workout was already dismissed
      const dismissedWorkouts = JSON.parse(
        localStorage.getItem('dismissedWorkouts') || '[]'
      );
      if (dismissedWorkouts.includes(activeWorkout.id)) {
        return;
      }

      // Check if workout is old (more than 2 hours since start)
      const timeSinceStart = Date.now() - activeWorkout.startTime;
      const twoHours = 2 * 60 * 60 * 1000;

      // Only show prompt if workout is older than 2 hours
      // This prevents interruption during active workouts
      if (timeSinceStart > twoHours) {
        setShowPrompt(true);
      }
    }
  }, [activeWorkout]);

  if (!showPrompt || !activeWorkout) return null;

  const handleResume = () => {
    haptic('medium');
    setShowPrompt(false);
    navigate('/workout');
  };

  const handleDiscard = () => {
    haptic('warning');
    // Save as incomplete workout
    finishWorkout();
    setShowPrompt(false);
    setDismissed(true);
  };

  const handleDismiss = () => {
    haptic('light');
    // Add this workout to dismissed list so it doesn't show again
    const dismissedWorkouts = JSON.parse(
      localStorage.getItem('dismissedWorkouts') || '[]'
    );
    dismissedWorkouts.push(activeWorkout.id);
    localStorage.setItem('dismissedWorkouts', JSON.stringify(dismissedWorkouts));
    setShowPrompt(false);
  };

  // Calculate workout stats
  const completedSets = activeWorkout.logs.reduce(
    (acc, log) => acc + log.sets.filter(s => s.completed).length,
    0
  );
  const totalSets = activeWorkout.logs.reduce(
    (acc, log) => acc + log.sets.length,
    0
  );
  const exercisesStarted = activeWorkout.logs.filter(
    log => log.sets.some(s => s.completed)
  ).length;
  const elapsedMins = Math.floor((Date.now() - activeWorkout.startTime) / 60000);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-[#111] border-2 border-primary max-w-sm w-full animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-[#222] flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 border border-orange-500 flex items-center justify-center">
            <AlertTriangle size={20} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-white">Workout Found</h3>
            <p className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Interrupted Session Detected
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Workout Info */}
          <div className="bg-black border border-[#222] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Dumbbell size={16} className="text-primary" />
              <span className="text-sm font-bold uppercase text-white">
                {activeWorkout.name}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl font-black italic text-primary">
                  {completedSets}/{totalSets}
                </div>
                <div className="text-[9px] text-[#666] uppercase font-bold">Sets</div>
              </div>
              <div>
                <div className="text-xl font-black italic text-white">
                  {exercisesStarted}
                </div>
                <div className="text-[9px] text-[#666] uppercase font-bold">Exercises</div>
              </div>
              <div>
                <div className="text-xl font-black italic text-[#666]">
                  {elapsedMins}m
                </div>
                <div className="text-[9px] text-[#666] uppercase font-bold">Elapsed</div>
              </div>
            </div>
          </div>

          {/* Time warning */}
          <div className="flex items-center gap-2 text-[10px] text-orange-500 font-mono">
            <Clock size={12} />
            <span>Started {Math.floor(elapsedMins / 60)}h {elapsedMins % 60}m ago</span>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleResume}
              className="w-full py-3 bg-primary text-black font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors active-scale"
            >
              <Play size={18} fill="currentColor" />
              Resume Workout
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDiscard}
                className="py-2 bg-[#222] text-[#888] font-bold uppercase text-xs border border-[#333] hover:border-red-500 hover:text-red-500 transition-colors"
              >
                Save & End
              </button>
              <button
                onClick={handleDismiss}
                className="py-2 bg-[#222] text-[#888] font-bold uppercase text-xs border border-[#333] hover:border-white hover:text-white transition-colors"
              >
                Remind Later
              </button>
            </div>
          </div>

          <p className="text-[9px] text-[#444] font-mono text-center">
            Your progress has been auto-saved
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkoutRecoveryPrompt;
