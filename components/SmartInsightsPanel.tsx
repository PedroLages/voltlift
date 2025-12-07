/**
 * Smart Insights Panel
 *
 * P2 Enhancement: Unified dashboard panel showing:
 * - Fatigue analysis with deload recommendations
 * - Body weight goal progress with predictions
 * - Streak status and milestone alerts
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Target,
  TrendingUp,
  TrendingDown,
  Flame,
  Calendar,
  ChevronRight,
  Scale,
  Zap,
  Activity,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  analyzeFatigue,
  FatigueAnalysis,
  getFatigueLevelColor,
} from '../services/fatigueAnalysis';
import { BodyMetricsGoals } from '../types';

interface SmartInsightsPanelProps {
  onSetWeightGoal?: () => void;
}

export const SmartInsightsPanel: React.FC<SmartInsightsPanelProps> = ({
  onSetWeightGoal,
}) => {
  const { history, settings, dailyLogs, getWeightGoalProgress, setBodyMetricsGoal } = useStore();
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [goalDirection, setGoalDirection] = useState<'lose' | 'gain' | 'maintain'>('maintain');
  const [targetWeight, setTargetWeight] = useState('');

  // Calculate fatigue analysis
  const fatigueAnalysis = useMemo(() => {
    const completedWorkouts = history.filter((w) => w.status === 'completed');
    return analyzeFatigue(completedWorkouts, 28);
  }, [history]);

  // Get weight goal progress
  const weightProgress = getWeightGoalProgress();

  // Calculate streak
  const streak = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if worked out today or yesterday
    const workedOutToday = history.some(
      (w) =>
        w.status === 'completed' &&
        w.endTime &&
        new Date(w.endTime).toISOString().split('T')[0] === today
    );

    const workedOutYesterday = history.some(
      (w) =>
        w.status === 'completed' &&
        w.endTime &&
        new Date(w.endTime).toISOString().split('T')[0] === yesterday
    );

    // Count streak days
    let count = 0;
    let checkDate = workedOutToday ? new Date() : new Date(Date.now() - 86400000);

    while (count < 365) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasWorkout = history.some(
        (w) =>
          w.status === 'completed' &&
          w.endTime &&
          new Date(w.endTime).toISOString().split('T')[0] === dateStr
      );

      if (hasWorkout) {
        count++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    const isAtRisk = !workedOutToday && count > 0;

    return { days: count, atRisk: isAtRisk, workedOutToday };
  }, [history]);

  // Handle setting a new weight goal
  const handleSetGoal = () => {
    const target = parseFloat(targetWeight);
    if (isNaN(target) || target <= 0) return;

    const currentWeight = settings.bodyweight || 0;

    setBodyMetricsGoal({
      targetWeight: {
        value: target,
        units: settings.units,
        startDate: Date.now(),
        startWeight: currentWeight,
        direction: goalDirection,
      },
    });

    setShowGoalSetup(false);
    setTargetWeight('');
  };

  // Get battery icon based on fatigue level
  const FatigueIcon = () => {
    switch (fatigueAnalysis.overallFatigueLevel) {
      case 'critical':
        return <BatteryLow className="text-red-500" size={20} />;
      case 'high':
        return <BatteryMedium className="text-orange-500" size={20} />;
      case 'moderate':
        return <BatteryMedium className="text-yellow-500" size={20} />;
      default:
        return <BatteryFull className="text-green-500" size={20} />;
    }
  };

  const fatigueColors = getFatigueLevelColor(fatigueAnalysis.overallFatigueLevel);

  // Check if there's anything actionable to show
  const hasInsights =
    fatigueAnalysis.deloadRecommendation ||
    weightProgress ||
    streak.days >= 3 ||
    streak.atRisk ||
    fatigueAnalysis.averageRPE > 0;

  if (!hasInsights && !showGoalSetup) {
    // No insights yet - show a prompt to get started
    return (
      <div className="bg-[#111] border border-[#222] p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="text-primary" size={18} />
          <h3 className="text-sm font-black uppercase text-white">Smart Insights</h3>
        </div>
        <p className="text-xs text-[#666] mb-3">
          Complete a few workouts with RPE tracking and log your bodyweight to unlock personalized
          insights.
        </p>
        <button
          onClick={() => setShowGoalSetup(true)}
          className="text-xs text-primary font-bold uppercase hover:text-white transition-colors"
        >
          Set a weight goal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-4">
      {/* Goal Setup Modal */}
      {showGoalSetup && (
        <div className="bg-[#111] border border-primary/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black uppercase text-white">Set Weight Goal</h4>
            <button onClick={() => setShowGoalSetup(false)} className="text-[#666] hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Direction Selection */}
            <div className="grid grid-cols-3 gap-2">
              {(['lose', 'maintain', 'gain'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setGoalDirection(dir)}
                  className={`py-2 text-xs font-bold uppercase transition-colors ${
                    goalDirection === dir
                      ? 'bg-primary text-black'
                      : 'bg-[#222] text-[#666] hover:text-white'
                  }`}
                >
                  {dir === 'lose' ? 'Lose' : dir === 'gain' ? 'Gain' : 'Maintain'}
                </button>
              ))}
            </div>

            {/* Target Weight Input */}
            {goalDirection !== 'maintain' && (
              <div>
                <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-1">
                  Target Weight ({settings.units})
                </label>
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder={`e.g., ${goalDirection === 'lose' ? '165' : '185'}`}
                  className="w-full bg-black border border-[#333] px-3 py-2 text-white font-mono focus:border-primary outline-none"
                />
              </div>
            )}

            {/* Current Weight Display */}
            {settings.bodyweight && (
              <p className="text-[10px] text-[#444] font-mono">
                Current: {settings.bodyweight} {settings.units}
              </p>
            )}

            <button
              onClick={handleSetGoal}
              disabled={goalDirection !== 'maintain' && !targetWeight}
              className="w-full py-2 bg-primary text-black font-bold uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
            >
              Set Goal
            </button>
          </div>
        </div>
      )}

      {/* Deload Alert (Priority - shows first if urgent) */}
      {fatigueAnalysis.deloadRecommendation &&
        fatigueAnalysis.deloadRecommendation.urgency !== 'suggested' && (
          <div
            className={`${fatigueColors.bg} border-l-4 ${fatigueColors.border} p-4`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={fatigueColors.text} size={20} />
              <div className="flex-1">
                <h4 className={`text-sm font-black uppercase ${fatigueColors.text}`}>
                  {fatigueAnalysis.deloadRecommendation.urgency === 'urgent'
                    ? 'Deload Needed'
                    : 'Deload Recommended'}
                </h4>
                <p className="text-xs text-[#ccc] mt-1">
                  {fatigueAnalysis.deloadRecommendation.reason}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-[10px] bg-black/30 px-2 py-1 text-[#888]">
                    -{fatigueAnalysis.deloadRecommendation.volumeReduction}% volume
                  </span>
                  <span className="text-[10px] bg-black/30 px-2 py-1 text-[#888]">
                    {fatigueAnalysis.deloadRecommendation.durationDays} days
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Combined Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Fatigue Status */}
        <div className="bg-[#111] border border-[#222] p-3">
          <div className="flex items-center gap-2 mb-2">
            <FatigueIcon />
            <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Fatigue
            </span>
          </div>
          <p className={`text-lg font-black uppercase ${fatigueColors.text}`}>
            {fatigueAnalysis.overallFatigueLevel}
          </p>
          {fatigueAnalysis.averageRPE > 0 && (
            <p className="text-[10px] text-[#444] font-mono mt-1">
              Avg RPE: {fatigueAnalysis.averageRPE}
            </p>
          )}
        </div>

        {/* Streak */}
        <div
          className={`bg-[#111] border ${
            streak.atRisk ? 'border-orange-500/50' : 'border-[#222]'
          } p-3`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame
              className={streak.atRisk ? 'text-orange-500' : 'text-primary'}
              size={20}
            />
            <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Streak
            </span>
          </div>
          <p className="text-lg font-black text-white">
            {streak.days} <span className="text-sm font-normal text-[#666]">days</span>
          </p>
          {streak.atRisk && (
            <p className="text-[10px] text-orange-500 font-mono mt-1">At risk today!</p>
          )}
        </div>
      </div>

      {/* Weight Goal Progress */}
      {weightProgress ? (
        <div className="bg-[#111] border border-[#222] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Scale className="text-primary" size={18} />
              <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
                Weight Goal
              </span>
            </div>
            <span className="text-xs font-mono text-[#666]">
              {weightProgress.current.toFixed(1)} → {weightProgress.target.toFixed(1)}{' '}
              {settings.units}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-[#222] rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${
                weightProgress.onTrack ? 'bg-primary' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(100, weightProgress.progress)}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white">
              {weightProgress.progress}% complete
            </span>
            <span className="text-[10px] text-[#666]">
              {weightProgress.remaining.toFixed(1)} {settings.units} to go
            </span>
          </div>

          {/* Predicted Date */}
          {weightProgress.predictedDate && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#222]">
              <Calendar size={14} className="text-[#666]" />
              <span className="text-[10px] text-[#666]">
                On track for{' '}
                <span className="text-white">
                  {weightProgress.predictedDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </span>
            </div>
          )}

          {!weightProgress.onTrack && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#222]">
              <TrendingDown size={14} className="text-orange-500" />
              <span className="text-[10px] text-orange-500">
                Trending opposite direction - adjust diet or activity
              </span>
            </div>
          )}
        </div>
      ) : (
        !showGoalSetup && (
          <button
            onClick={() => setShowGoalSetup(true)}
            className="w-full bg-[#111] border border-[#222] p-4 flex items-center justify-between hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Target className="text-[#666] group-hover:text-primary" size={18} />
              <span className="text-xs text-[#666] uppercase font-bold group-hover:text-white">
                Set Weight Goal
              </span>
            </div>
            <ChevronRight className="text-[#444] group-hover:text-primary" size={16} />
          </button>
        )
      )}

      {/* Exercise Fatigue Alerts */}
      {fatigueAnalysis.exerciseFatigue.filter((e) => e.fatigueStatus === 'overtrained').length >
        0 && (
        <div className="bg-red-900/20 border border-red-500/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-red-500" size={16} />
            <span className="text-[10px] text-red-500 uppercase font-bold">
              Overtrained Exercises
            </span>
          </div>
          <div className="space-y-1">
            {fatigueAnalysis.exerciseFatigue
              .filter((e) => e.fatigueStatus === 'overtrained')
              .slice(0, 3)
              .map((ex) => (
                <div key={ex.exerciseId} className="flex items-center justify-between">
                  <span className="text-xs text-[#888] capitalize">
                    {ex.exerciseId.replace(/-/g, ' ')}
                  </span>
                  <span className="text-[10px] text-red-500 font-mono">RPE {ex.lastSessionRPE}</span>
                </div>
              ))}
          </div>
          <p className="text-[10px] text-[#666] mt-2">{fatigueAnalysis.exerciseFatigue[0]?.recommendation}</p>
        </div>
      )}
    </div>
  );
};

export default SmartInsightsPanel;
