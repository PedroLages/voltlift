/**
 * Recovery Score Card Component
 *
 * Displays ML-powered recovery insights:
 * - Current recovery score (composite)
 * - Fatigue prediction visualization
 * - Deload recommendations
 * - Volume adjustment suggestions
 *
 * This is the main user-facing ML output component.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Brain,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Calendar,
  Dumbbell
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  extractBanditContext,
  extractFeatureSequence,
  getVolumeRecommendation,
  initializeBanditState
} from '../services/ml';
import { FatiguePrediction, MuscleGroup, BanditState } from '../types';

interface RecoveryScoreCardProps {
  onOpenWellnessCheckin?: () => void;
  compact?: boolean;
}

interface RecoveryMetrics {
  overallScore: number; // 0-100
  fatigueLevel: number; // 0-1
  recoveryTrend: 'improving' | 'stable' | 'declining';
  acwr: number;
  dataQuality: 'low' | 'moderate' | 'high';
}

export function RecoveryScoreCard({ onOpenWellnessCheckin, compact = false }: RecoveryScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [banditState] = useState<BanditState>(initializeBanditState());

  const { workoutHistory, dailyLogs, settings } = useStore();

  // Calculate recovery metrics from data
  const metrics = useMemo((): RecoveryMetrics => {
    const today = Date.now();

    // Get last 7 days of features
    const features = extractFeatureSequence(workoutHistory, dailyLogs, today, 7);

    if (features.length === 0) {
      return {
        overallScore: 75, // Default optimistic
        fatigueLevel: 0.3,
        recoveryTrend: 'stable',
        acwr: 1.0,
        dataQuality: 'low'
      };
    }

    // Extract context for analysis
    const context = extractBanditContext(workoutHistory, dailyLogs, today);

    // Calculate overall recovery score (100 - fatigue as percentage)
    const recoveryScore = Math.round((1 - context.fatigueLevel) * 100);

    // Determine trend from recent data
    let trend: RecoveryMetrics['recoveryTrend'] = 'stable';
    if (features.length >= 3) {
      const recentRecovery = features.slice(-3).filter(f => f.perceivedRecovery > 0);
      if (recentRecovery.length >= 2) {
        const avg = recentRecovery.reduce((s, f) => s + f.perceivedRecovery, 0) / recentRecovery.length;
        const last = recentRecovery[recentRecovery.length - 1].perceivedRecovery;
        if (last > avg + 0.5) trend = 'improving';
        else if (last < avg - 0.5) trend = 'declining';
      }
    }

    // Data quality based on wellness check-ins
    const recentLogs = dailyLogs.filter(log => {
      const logDate = new Date(log.date).getTime();
      return today - logDate < 7 * 24 * 60 * 60 * 1000;
    });
    const checkinRate = recentLogs.filter(l => l.perceivedRecovery !== undefined).length / 7;
    const dataQuality = checkinRate >= 0.7 ? 'high' : checkinRate >= 0.4 ? 'moderate' : 'low';

    return {
      overallScore: recoveryScore,
      fatigueLevel: context.fatigueLevel,
      recoveryTrend: trend,
      acwr: context.acuteChronicRatio,
      dataQuality
    };
  }, [workoutHistory, dailyLogs]);

  // Get volume recommendation
  const volumeRec = useMemo(() => {
    const today = Date.now();
    const context = extractBanditContext(workoutHistory, dailyLogs, today);
    return getVolumeRecommendation(context, banditState, 'chest' as MuscleGroup);
  }, [workoutHistory, dailyLogs, banditState]);

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-green-500', bg: 'bg-green-500' };
    if (score >= 60) return { text: 'text-yellow-500', bg: 'bg-yellow-500' };
    if (score >= 40) return { text: 'text-orange-500', bg: 'bg-orange-500' };
    return { text: 'text-red-500', bg: 'bg-red-500' };
  };

  const scoreColor = getScoreColor(metrics.overallScore);

  // ACWR interpretation
  const getACWRStatus = (acwr: number) => {
    if (acwr < 0.8) return { status: 'Undertrained', color: 'text-blue-500', desc: 'Volume is below optimal' };
    if (acwr <= 1.3) return { status: 'Sweet Spot', color: 'text-green-500', desc: 'Optimal training load' };
    if (acwr <= 1.5) return { status: 'Caution', color: 'text-yellow-500', desc: 'Approaching high risk' };
    return { status: 'High Risk', color: 'text-red-500', desc: 'Injury risk elevated' };
  };

  const acwrStatus = getACWRStatus(metrics.acwr);

  // Battery icon based on recovery
  const BatteryIcon = metrics.overallScore >= 75 ? BatteryFull
    : metrics.overallScore >= 50 ? BatteryMedium
    : BatteryLow;

  // Check if wellness checkin is needed today
  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = dailyLogs.some(
    log => log.date === today && log.perceivedRecovery !== undefined
  );

  if (compact) {
    // Compact version for dashboard
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full bg-zinc-900 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${scoreColor.bg}/20`}>
            <BatteryIcon className={`w-6 h-6 ${scoreColor.text}`} />
          </div>
          <div className="text-left">
            <div className="text-sm text-gray-400">Recovery Score</div>
            <div className={`text-2xl font-bold ${scoreColor.text}`}>
              {metrics.overallScore}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasCheckedInToday && (
            <span className="text-xs bg-[#ccff00]/20 text-[#ccff00] px-2 py-1 rounded-full">
              Check-in needed
            </span>
          )}
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </button>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${scoreColor.bg}/20`}>
              <span className={`text-2xl font-bold ${scoreColor.text}`}>
                {metrics.overallScore}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Recovery Score
                {metrics.dataQuality === 'low' && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
                    Limited Data
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {metrics.recoveryTrend === 'improving' && (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">Improving</span>
                  </>
                )}
                {metrics.recoveryTrend === 'declining' && (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">Declining</span>
                  </>
                )}
                {metrics.recoveryTrend === 'stable' && (
                  <>
                    <Minus className="w-4 h-4 text-gray-500" />
                    <span>Stable</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button className="p-2 text-gray-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Score bar */}
        <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${scoreColor.bg} transition-all duration-500`}
            style={{ width: `${metrics.overallScore}%` }}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-zinc-800">
          {/* Check-in prompt */}
          {!hasCheckedInToday && onOpenWellnessCheckin && (
            <button
              onClick={onOpenWellnessCheckin}
              className="w-full p-4 bg-[#ccff00]/10 border-b border-zinc-800 flex items-center justify-between group hover:bg-[#ccff00]/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ccff00]/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#ccff00]" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-[#ccff00]">Complete Daily Check-in</div>
                  <div className="text-xs text-gray-400">Improves prediction accuracy</div>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-[#ccff00] transform -rotate-90 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-px bg-zinc-800">
            {/* ACWR */}
            <div className="bg-zinc-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400 uppercase">Workload Ratio</span>
              </div>
              <div className={`text-2xl font-bold ${acwrStatus.color}`}>
                {metrics.acwr.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">{acwrStatus.status}</div>
            </div>

            {/* Fatigue Level */}
            <div className="bg-zinc-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BatteryIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400 uppercase">Fatigue</span>
              </div>
              <div className={`text-2xl font-bold ${
                metrics.fatigueLevel < 0.4 ? 'text-green-500' :
                metrics.fatigueLevel < 0.7 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {Math.round(metrics.fatigueLevel * 100)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.fatigueLevel < 0.4 ? 'Low' :
                 metrics.fatigueLevel < 0.7 ? 'Moderate' : 'High'}
              </div>
            </div>
          </div>

          {/* Volume Recommendation */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-[#ccff00]" />
              <span className="text-sm font-bold text-white">AI Recommendation</span>
            </div>

            <div className={`p-4 rounded-xl border ${
              volumeRec.action === 'decrease' ? 'bg-red-500/10 border-red-500/30' :
              volumeRec.action === 'increase' ? 'bg-green-500/10 border-green-500/30' :
              'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  volumeRec.action === 'decrease' ? 'bg-red-500/20' :
                  volumeRec.action === 'increase' ? 'bg-green-500/20' :
                  'bg-blue-500/20'
                }`}>
                  <Dumbbell className={`w-5 h-5 ${
                    volumeRec.action === 'decrease' ? 'text-red-500' :
                    volumeRec.action === 'increase' ? 'text-green-500' :
                    'text-blue-500'
                  }`} />
                </div>
                <div>
                  <div className={`font-bold ${
                    volumeRec.action === 'decrease' ? 'text-red-500' :
                    volumeRec.action === 'increase' ? 'text-green-500' :
                    'text-blue-500'
                  }`}>
                    {volumeRec.action === 'decrease' ? 'Reduce Volume' :
                     volumeRec.action === 'increase' ? 'Increase Volume' :
                     'Maintain Volume'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {volumeRec.reasoning}
                  </div>
                </div>
              </div>

              {/* Confidence indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      volumeRec.action === 'decrease' ? 'bg-red-500' :
                      volumeRec.action === 'increase' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${volumeRec.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(volumeRec.confidence * 100)}% confidence
                </span>
              </div>
            </div>
          </div>

          {/* Context Factors */}
          {volumeRec.contextualAdjustments.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400 uppercase">Factors Considered</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {volumeRec.contextualAdjustments.map((factor, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-zinc-800 text-gray-300 px-2 py-1 rounded-full"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Data Quality Notice */}
          {metrics.dataQuality === 'low' && (
            <div className="p-4 bg-yellow-500/10 border-t border-yellow-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-yellow-500 text-sm">Limited Data Available</div>
                  <p className="text-xs text-gray-400 mt-1">
                    Complete daily wellness check-ins to improve prediction accuracy.
                    The AI learns from your patterns to give better recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecoveryScoreCard;
