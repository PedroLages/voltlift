/**
 * Weekly Plateau Analysis Component
 *
 * Displays weekly performance summaries with plateau detection and actionable insights.
 * Uses ML-powered analytics from services/analytics.ts and services/workoutIntelligence.ts
 */

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { extractExerciseTimeSeries, detectPlateau, calculateTrend } from '../services/analytics';
import { analyzeWeakPoints } from '../services/workoutIntelligence';
import { EXERCISE_LIBRARY } from '../constants';

interface WeeklyPlateauAnalysisProps {
  className?: string;
}

export function WeeklyPlateauAnalysis({ className = '' }: WeeklyPlateauAnalysisProps) {
  const { workoutHistory, settings } = useStore();

  // Analyze all exercises for plateaus and trends
  const analysisData = useMemo(() => {
    const completedWorkouts = workoutHistory.filter(w => w.status === 'completed');

    if (completedWorkouts.length === 0) {
      return { exercises: [], weakPoints: [], hasData: false };
    }

    // Get all unique exercises from history
    const exerciseIds = new Set<string>();
    completedWorkouts.forEach(workout => {
      workout.logs.forEach(log => exerciseIds.add(log.exerciseId));
    });

    // Analyze each exercise
    const exercises = Array.from(exerciseIds).map(exerciseId => {
      const timeSeries = extractExerciseTimeSeries(exerciseId, completedWorkouts, 12); // Last 12 weeks
      const plateau = detectPlateau(timeSeries, 4); // Check last 4 weeks
      const trend = calculateTrend(timeSeries.dataPoints);

      return {
        exerciseId,
        exerciseName: timeSeries.exerciseName,
        plateau,
        trend,
        timeSeries
      };
    });

    // Analyze weak points (exercises with no progress in 8+ weeks)
    const weakPoints = analyzeWeakPoints(completedWorkouts, 8);

    return {
      exercises: exercises.filter(e => e.timeSeries.totalWorkouts >= 3), // Only show if 3+ workouts
      weakPoints,
      hasData: exercises.length > 0
    };
  }, [workoutHistory]);

  if (!analysisData.hasData) {
    return (
      <div className={`bg-zinc-900 rounded-xl p-6 border border-zinc-800 ${className}`}>
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">No Weekly Data Yet</h3>
          <p className="text-sm text-gray-400">
            Complete at least 3 workouts to see your weekly progress analysis.
          </p>
        </div>
      </div>
    );
  }

  // Categorize exercises
  const progressing = analysisData.exercises.filter(e => !e.plateau.isPlateaued && e.trend.slopePerWeek > 0);
  const plateaued = analysisData.exercises.filter(e => e.plateau.isPlateaued);
  const regressing = analysisData.exercises.filter(e => e.trend.slopePerWeek < -0.5);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Header */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-[#ccff00]" />
          Weekly Performance Summary
        </h2>

        <div className="grid grid-cols-3 gap-4">
          {/* Progressing */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-green-500">{progressing.length}</span>
            </div>
            <p className="text-xs text-green-400">Progressing</p>
          </div>

          {/* Plateaued */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Minus className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{plateaued.length}</span>
            </div>
            <p className="text-xs text-yellow-400">Plateaued</p>
          </div>

          {/* Regressing */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-red-500">{regressing.length}</span>
            </div>
            <p className="text-xs text-red-400">Regressing</p>
          </div>
        </div>
      </div>

      {/* Plateaued Exercises (Priority Alerts) */}
      {plateaued.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-bold text-white">Plateau Alerts</h3>
          </div>

          <div className="space-y-3">
            {plateaued.map(exercise => (
              <div
                key={exercise.exerciseId}
                className="bg-zinc-800 rounded-lg p-4 border border-zinc-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{exercise.exerciseName}</h4>
                    <p className="text-xs text-yellow-400 mt-1">
                      {exercise.plateau.weeksSincePR} weeks since PR
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Current PR</p>
                    <p className="text-sm font-bold text-[#ccff00]">
                      {Math.round(exercise.plateau.currentPR)} {settings.units}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-3">{exercise.plateau.reasoning}</p>

                {/* Actionable Suggestions */}
                <div className="flex items-start gap-2 bg-[#ccff00]/10 border border-[#ccff00]/20 rounded-lg p-3">
                  <Lightbulb className="w-4 h-4 text-[#ccff00] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white mb-1">Suggested Actions:</p>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Take a deload week (reduce weight by 10-15%)</li>
                      <li>• Try a variation ({getExerciseVariation(exercise.exerciseId)})</li>
                      <li>• Increase volume (add 1-2 sets per workout)</li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progressing Exercises (Positive Reinforcement) */}
      {progressing.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-green-500/20">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-bold text-white">Making Progress</h3>
          </div>

          <div className="space-y-3">
            {progressing.slice(0, 5).map(exercise => (
              <div
                key={exercise.exerciseId}
                className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">{exercise.exerciseName}</h4>
                  <p className="text-xs text-green-400 mt-1">
                    +{exercise.trend.slopePerWeek.toFixed(1)} {settings.units}/week progress
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            ))}
          </div>

          {progressing.length > 5 && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              +{progressing.length - 5} more exercises progressing
            </p>
          )}
        </div>
      )}

      {/* Weak Points (From workoutIntelligence.ts) */}
      {analysisData.weakPoints.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-[#ccff00]" />
            <h3 className="text-lg font-bold text-white">Weak Points to Address</h3>
          </div>

          <div className="space-y-2">
            {analysisData.weakPoints.map((weakPoint, index) => (
              <div
                key={index}
                className="bg-zinc-800 rounded-lg p-3 border border-zinc-700"
              >
                <h4 className="text-sm font-bold text-white mb-1">{weakPoint.exerciseName}</h4>
                <p className="text-xs text-gray-400">{weakPoint.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get exercise variation suggestion based on movement pattern
 */
function getExerciseVariation(exerciseId: string): string {
  const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
  if (!exercise) return 'similar exercise';

  // Movement pattern variations
  const variations: Record<string, string> = {
    'bench-press': 'Incline Bench Press or Dumbbell Press',
    'squat': 'Front Squat or Bulgarian Split Squat',
    'deadlift': 'Romanian Deadlift or Trap Bar Deadlift',
    'overhead-press': 'Push Press or Dumbbell Shoulder Press',
    'barbell-row': 'Pendlay Row or T-Bar Row',
    'pull-up': 'Lat Pulldown or Chin-Ups',
    'dumbbell-curl': 'Barbell Curl or Hammer Curl',
    'tricep-pushdown': 'Close-Grip Bench or Overhead Extension'
  };

  return variations[exerciseId] || `different ${exercise.muscleGroup.toLowerCase()} exercise`;
}

export default WeeklyPlateauAnalysis;
