/**
 * Cycle Completion Modal
 *
 * Shows after completing a 4-week training cycle
 * Displays deload recommendations and prepares for next cycle
 */

import React, { useState, useEffect } from 'react';
import { X, Trophy, Calendar, TrendingUp, Brain, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getDeloadRecommendation } from '../services/gnCoachingService';
import { WorkoutSession } from '../types';

interface CycleCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNextCycle: (shouldDeload: boolean) => void;
  cyclesCompleted: number;
  programName: string;
  recentSessions: WorkoutSession[];
  recoveryMetrics?: {
    avgSleep: number;
    avgStress: number;
    avgSoreness: number;
    bodyweightChange: number;
  };
  tmUpdates?: {
    squat?: { old: number; new: number };
    bench?: { old: number; new: number };
    deadlift?: { old: number; new: number };
  };
}

const CycleCompletionModal: React.FC<CycleCompletionModalProps> = ({
  isOpen,
  onClose,
  onStartNextCycle,
  cyclesCompleted,
  programName,
  recentSessions,
  recoveryMetrics,
  tmUpdates
}) => {
  const [loading, setLoading] = useState(true);
  const [deloadRec, setDeloadRec] = useState<{
    shouldDeload: boolean;
    urgency: 'high' | 'medium' | 'low';
    reasoning: string;
    suggestedWeeks: number;
  } | null>(null);

  // Calculate cycle stats
  const totalWorkouts = recentSessions.length;
  const totalVolume = recentSessions.reduce((sum, session) =>
    sum + session.logs.reduce((logSum, log) =>
      logSum + log.sets.reduce((setSum, set) =>
        setSum + (set.weight * set.reps), 0
      ), 0
    ), 0
  );

  // Fetch deload recommendation
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getDeloadRecommendation(cyclesCompleted, recentSessions, recoveryMetrics)
        .then(rec => {
          setDeloadRec(rec);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to get deload rec:', err);
          setDeloadRec({
            shouldDeload: true,
            urgency: 'high',
            reasoning: 'Cycle complete - standard deload recommended',
            suggestedWeeks: 1
          });
          setLoading(false);
        });
    }
  }, [isOpen, cyclesCompleted, recentSessions, recoveryMetrics]);

  if (!isOpen) return null;

  const urgencyColor = deloadRec?.urgency === 'high' ? 'text-red-400' :
                       deloadRec?.urgency === 'medium' ? 'text-yellow-400' :
                       'text-green-400';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border-2 border-primary max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#111] border-b border-[#222] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy size={24} className="text-primary" />
            <h2 className="text-xl font-black text-primary uppercase tracking-wider italic">
              Cycle Complete
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Cycle Summary */}
          <div className="bg-black border-l-4 border-primary p-4">
            <h3 className="text-lg font-bold text-white mb-4">{programName}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#666] uppercase text-xs block mb-1">Cycles Completed</span>
                <p className="text-3xl font-black text-primary">{cyclesCompleted}</p>
              </div>
              <div>
                <span className="text-[#666] uppercase text-xs block mb-1">Total Workouts</span>
                <p className="text-3xl font-black text-white">{totalWorkouts}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[#666] uppercase text-xs block mb-1">Total Volume</span>
                <p className="text-2xl font-black text-white">{totalVolume.toLocaleString()} lbs</p>
              </div>
            </div>
          </div>

          {/* Training Max Updates */}
          {tmUpdates && Object.keys(tmUpdates).length > 0 && (
            <div className="bg-black border border-primary p-4">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp size={16} />
                Training Max Updates
              </h4>
              <div className="space-y-2">
                {tmUpdates.squat && (
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-[#888]">Squat</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#666]">{tmUpdates.squat.old}</span>
                      <span className="text-primary">→</span>
                      <span className="text-white font-bold">{tmUpdates.squat.new} lbs</span>
                      <span className="text-green-400 text-xs">+{tmUpdates.squat.new - tmUpdates.squat.old}</span>
                    </div>
                  </div>
                )}
                {tmUpdates.bench && (
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-[#888]">Bench</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#666]">{tmUpdates.bench.old}</span>
                      <span className="text-primary">→</span>
                      <span className="text-white font-bold">{tmUpdates.bench.new} lbs</span>
                      <span className="text-green-400 text-xs">+{tmUpdates.bench.new - tmUpdates.bench.old}</span>
                    </div>
                  </div>
                )}
                {tmUpdates.deadlift && (
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-[#888]">Deadlift</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#666]">{tmUpdates.deadlift.old}</span>
                      <span className="text-primary">→</span>
                      <span className="text-white font-bold">{tmUpdates.deadlift.new} lbs</span>
                      <span className="text-green-400 text-xs">+{tmUpdates.deadlift.new - tmUpdates.deadlift.old}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deload Recommendation */}
          {loading ? (
            <div className="bg-black p-6 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-[#888] font-mono text-sm">Analyzing recovery needs...</p>
            </div>
          ) : deloadRec && (
            <div className={`bg-black border-2 p-4 ${
              deloadRec.shouldDeload ? 'border-yellow-500' : 'border-green-500'
            }`}>
              <div className="flex items-start gap-3 mb-3">
                <Brain size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-primary uppercase tracking-wider">
                      AI Coach Assessment
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${urgencyColor}`}>
                      {deloadRec.urgency} priority
                    </span>
                  </div>
                  <p className="text-sm text-[#ccc] leading-relaxed mb-3">{deloadRec.reasoning}</p>
                </div>
              </div>

              {deloadRec.shouldDeload ? (
                <div className="bg-yellow-900 bg-opacity-20 border-l-4 border-yellow-500 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-yellow-500 font-bold text-sm mb-1">Deload Recommended</h5>
                      <p className="text-xs text-yellow-200">
                        Next {deloadRec.suggestedWeeks} week{deloadRec.suggestedWeeks > 1 ? 's' : ''} should be deload training at 60% intensity
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-900 bg-opacity-20 border-l-4 border-green-500 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-green-500 font-bold text-sm mb-1">Ready for Next Cycle</h5>
                      <p className="text-xs text-green-200">
                        Recovery metrics look good - you can continue with full intensity
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recovery Metrics (if available) */}
          {recoveryMetrics && (
            <div className="bg-[#0a0a0a] p-4">
              <h4 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3">
                Recovery Metrics (Last 7 Days)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <div>
                  <span className="text-[#666]">Sleep</span>
                  <p className={`font-bold ${recoveryMetrics.avgSleep >= 7 ? 'text-green-400' : 'text-red-400'}`}>
                    {recoveryMetrics.avgSleep.toFixed(1)} hrs/night
                  </p>
                </div>
                <div>
                  <span className="text-[#666]">Stress</span>
                  <p className={`font-bold ${recoveryMetrics.avgStress <= 5 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {recoveryMetrics.avgStress.toFixed(1)}/10
                  </p>
                </div>
                <div>
                  <span className="text-[#666]">Soreness</span>
                  <p className={`font-bold ${recoveryMetrics.avgSoreness <= 5 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {recoveryMetrics.avgSoreness.toFixed(1)}/10
                  </p>
                </div>
                <div>
                  <span className="text-[#666]">Bodyweight Δ</span>
                  <p className="font-bold text-white">
                    {recoveryMetrics.bodyweightChange > 0 ? '+' : ''}{recoveryMetrics.bodyweightChange.toFixed(1)} lbs
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {deloadRec?.shouldDeload && (
              <button
                onClick={() => onStartNextCycle(true)}
                disabled={loading}
                className="w-full py-4 bg-yellow-600 text-black font-black italic uppercase text-sm tracking-widest hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                Start Deload Week ({deloadRec.suggestedWeeks}w @ 60%)
              </button>
            )}

            <button
              onClick={() => onStartNextCycle(false)}
              disabled={loading}
              className={`w-full py-4 font-black italic uppercase text-sm tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                deloadRec?.shouldDeload
                  ? 'border-2 border-[#444] text-[#888] hover:border-white hover:text-white'
                  : 'bg-primary text-black hover:bg-white shadow-[0_0_20px_rgba(204,255,0,0.3)]'
              }`}
            >
              <TrendingUp size={18} />
              {deloadRec?.shouldDeload ? 'Skip Deload & Continue' : 'Start Next Cycle'}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 border border-[#444] text-[#888] font-bold uppercase text-xs tracking-widest hover:border-white hover:text-white transition-colors"
            >
              Review Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycleCompletionModal;
