/**
 * Recovery Score Card Component
 *
 * Industrial HUD-style recovery insights display
 * Features: corner brackets, power bar, scan lines, sharp angular containers
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Brain,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Dumbbell,
  Zap
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  extractBanditContext,
  extractFeatureSequence,
  getVolumeRecommendation,
  initializeBanditState
} from '../services/ml';
import { MuscleGroup, BanditState } from '../types';

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

  const { workoutHistory, dailyLogs } = useStore();

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

    // Calculate fatigue level from avgFatigue7d (1-5 scale, normalized to 0-1)
    const fatigueLevel = (context.avgFatigue7d - 1) / 4;

    // Calculate ACWR from the most recent features
    const latestFeature = features[features.length - 1];
    const acwr = latestFeature?.acuteChronicRatio ?? 1.0;

    // Calculate overall recovery score (100 - fatigue as percentage)
    const recoveryScore = Math.round((1 - fatigueLevel) * 100);

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
    const recentLogs = Object.values(dailyLogs).filter(log => {
      const logDate = new Date(log.date).getTime();
      return today - logDate < 7 * 24 * 60 * 60 * 1000;
    });
    const checkinRate = recentLogs.filter(l => l.perceivedRecovery !== undefined).length / 7;
    const dataQuality = checkinRate >= 0.7 ? 'high' : checkinRate >= 0.4 ? 'moderate' : 'low';

    return {
      overallScore: recoveryScore,
      fatigueLevel,
      recoveryTrend: trend,
      acwr,
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
    if (score >= 80) return { hex: '#22c55e', text: 'text-green-500', bg: 'bg-green-500' };
    if (score >= 60) return { hex: '#eab308', text: 'text-yellow-500', bg: 'bg-yellow-500' };
    if (score >= 40) return { hex: '#f97316', text: 'text-orange-500', bg: 'bg-orange-500' };
    return { hex: '#ef4444', text: 'text-red-500', bg: 'bg-red-500' };
  };

  const scoreColor = getScoreColor(metrics.overallScore);

  // ACWR interpretation
  const getACWRStatus = (acwr: number) => {
    if (acwr < 0.8) return { status: 'UNDERTRAINED', color: '#3b82f6', desc: 'Volume is below optimal' };
    if (acwr <= 1.3) return { status: 'OPTIMAL', color: '#22c55e', desc: 'Optimal training load' };
    if (acwr <= 1.5) return { status: 'CAUTION', color: '#eab308', desc: 'Approaching high risk' };
    return { status: 'HIGH RISK', color: '#ef4444', desc: 'Injury risk elevated' };
  };

  const acwrStatus = getACWRStatus(metrics.acwr);

  // Battery icon based on recovery
  const BatteryIcon = metrics.overallScore >= 75 ? BatteryFull
    : metrics.overallScore >= 50 ? BatteryMedium
    : BatteryLow;

  // Check if wellness checkin is needed today
  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = dailyLogs[today]?.perceivedRecovery !== undefined;

  // Power cells for progress bar (10 cells)
  const filledCells = Math.floor(metrics.overallScore / 10);
  const partialFill = (metrics.overallScore % 10) / 10;

  if (compact) {
    // Compact version for dashboard
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full bg-black border border-zinc-800 p-4 flex items-center justify-between hover:border-zinc-600 transition-colors relative"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-primary pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-primary pointer-events-none" />

        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 flex items-center justify-center border-2"
            style={{
              borderColor: scoreColor.hex,
              backgroundColor: `${scoreColor.hex}20`,
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
          >
            <BatteryIcon className="w-6 h-6" style={{ color: scoreColor.hex }} />
          </div>
          <div className="text-left">
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Recovery Score</div>
            <div className="text-2xl font-black font-mono" style={{ color: scoreColor.hex }}>
              {metrics.overallScore}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasCheckedInToday && (
            <span
              className="text-[10px] bg-primary/20 text-primary px-2 py-1 font-bold uppercase"
              style={{
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              }}
            >
              Check-in
            </span>
          )}
          <ChevronDown className="w-5 h-5 text-zinc-500" />
        </div>
      </button>
    );
  }

  return (
    <div
      className="bg-black border border-zinc-800 overflow-hidden relative"
      style={{
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
      }}
    >
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary pointer-events-none z-10" />
      <div className="absolute top-0 right-4 w-4 h-4 border-r-2 border-t-2 border-primary pointer-events-none z-10" />
      <div className="absolute bottom-4 left-0 w-4 h-4 border-l-2 border-b-2 border-primary pointer-events-none z-10" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary pointer-events-none z-10" />

      {/* Scan Lines Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 z-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(204, 255, 0, 0.1) 2px,
            rgba(204, 255, 0, 0.1) 4px
          )`,
        }}
      />

      {/* Header */}
      <div
        className="p-4 cursor-pointer relative z-10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Score Circle */}
            <div
              className="w-16 h-16 flex items-center justify-center border-2 relative"
              style={{
                borderColor: scoreColor.hex,
                backgroundColor: `${scoreColor.hex}15`,
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                boxShadow: `0 0 20px ${scoreColor.hex}30, inset 0 0 15px ${scoreColor.hex}10`,
              }}
            >
              <span className="text-2xl font-black font-mono" style={{ color: scoreColor.hex }}>
                {metrics.overallScore}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black italic uppercase text-white flex items-center gap-2">
                Recovery Status
                {metrics.dataQuality === 'low' && (
                  <span
                    className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 font-bold not-italic"
                    style={{
                      clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                    }}
                  >
                    LIMITED DATA
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                {metrics.recoveryTrend === 'improving' && (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-bold uppercase text-xs">Improving</span>
                  </>
                )}
                {metrics.recoveryTrend === 'declining' && (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 font-bold uppercase text-xs">Declining</span>
                  </>
                )}
                {metrics.recoveryTrend === 'stable' && (
                  <>
                    <Minus className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-500 font-bold uppercase text-xs">Stable</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button className="p-2 text-zinc-500 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Power Cell Progress Bar */}
        <div className="mt-4 flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => {
            const isFilled = i < filledCells;
            const isPartial = i === filledCells && partialFill > 0;

            return (
              <div
                key={i}
                className="flex-1 h-3 relative overflow-hidden border border-zinc-800"
                style={{
                  backgroundColor: isFilled || isPartial ? `${scoreColor.hex}20` : '#18181b',
                  clipPath: 'polygon(2px 0, 100% 0, 100% calc(100% - 2px), calc(100% - 2px) 100%, 0 100%, 0 2px)',
                }}
              >
                <div
                  className="absolute inset-0 transition-all duration-300"
                  style={{
                    backgroundColor: scoreColor.hex,
                    width: isFilled ? '100%' : isPartial ? `${partialFill * 100}%` : '0%',
                    boxShadow: isFilled ? `0 0 8px ${scoreColor.hex}60` : undefined,
                  }}
                />
                {/* Diagonal stripe pattern */}
                {isFilled && (
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 2px,
                        rgba(0,0,0,0.4) 2px,
                        rgba(0,0,0,0.4) 4px
                      )`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-zinc-800 relative z-10">
          {/* Check-in prompt */}
          {!hasCheckedInToday && onOpenWellnessCheckin && (
            <button
              onClick={onOpenWellnessCheckin}
              className="w-full p-4 bg-primary/10 border-b border-zinc-800 flex items-center justify-between group hover:bg-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 bg-primary/20 flex items-center justify-center border border-primary/50"
                  style={{
                    clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                  }}
                >
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-black text-primary uppercase text-sm">Complete Daily Check-in</div>
                  <div className="text-[10px] text-zinc-500 uppercase">Improves prediction accuracy</div>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-primary transform -rotate-90 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-px bg-zinc-800">
            {/* ACWR */}
            <div className="bg-zinc-950 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Workload Ratio</span>
              </div>
              <div className="text-2xl font-black font-mono" style={{ color: acwrStatus.color }}>
                {metrics.acwr.toFixed(2)}
              </div>
              <div
                className="text-[10px] font-bold uppercase mt-1 px-2 py-0.5 inline-block"
                style={{
                  color: acwrStatus.color,
                  backgroundColor: `${acwrStatus.color}20`,
                  clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
                }}
              >
                {acwrStatus.status}
              </div>
            </div>

            {/* Fatigue Level */}
            <div className="bg-zinc-950 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BatteryIcon className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Fatigue</span>
              </div>
              <div className={`text-2xl font-black font-mono ${
                metrics.fatigueLevel < 0.4 ? 'text-green-500' :
                metrics.fatigueLevel < 0.7 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {Math.round(metrics.fatigueLevel * 100)}%
              </div>
              <div
                className={`text-[10px] font-bold uppercase mt-1 px-2 py-0.5 inline-block ${
                  metrics.fatigueLevel < 0.4 ? 'text-green-500 bg-green-500/20' :
                  metrics.fatigueLevel < 0.7 ? 'text-yellow-500 bg-yellow-500/20' : 'text-red-500 bg-red-500/20'
                }`}
                style={{
                  clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
                }}
              >
                {metrics.fatigueLevel < 0.4 ? 'LOW' :
                 metrics.fatigueLevel < 0.7 ? 'MODERATE' : 'HIGH'}
              </div>
            </div>
          </div>

          {/* Volume Recommendation */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-xs font-black italic uppercase text-white">AI Recommendation</span>
            </div>

            <div
              className={`p-4 border-2 relative ${
                volumeRec.action === 'decrease' ? 'bg-red-500/10 border-red-500/50' :
                volumeRec.action === 'increase' ? 'bg-green-500/10 border-green-500/50' :
                'bg-blue-500/10 border-blue-500/50'
              }`}
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 flex items-center justify-center ${
                    volumeRec.action === 'decrease' ? 'bg-red-500/20' :
                    volumeRec.action === 'increase' ? 'bg-green-500/20' :
                    'bg-blue-500/20'
                  }`}
                  style={{
                    clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                  }}
                >
                  <Dumbbell className={`w-5 h-5 ${
                    volumeRec.action === 'decrease' ? 'text-red-500' :
                    volumeRec.action === 'increase' ? 'text-green-500' :
                    'text-blue-500'
                  }`} />
                </div>
                <div>
                  <div className={`font-black uppercase ${
                    volumeRec.action === 'decrease' ? 'text-red-500' :
                    volumeRec.action === 'increase' ? 'text-green-500' :
                    'text-blue-500'
                  }`}>
                    {volumeRec.action === 'decrease' ? 'Reduce Volume' :
                     volumeRec.action === 'increase' ? 'Increase Volume' :
                     'Maintain Volume'}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {volumeRec.reasoning}
                  </div>
                </div>
              </div>

              {/* Confidence indicator - power cells */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1.5"
                      style={{
                        backgroundColor: i < Math.round(volumeRec.confidence * 10)
                          ? volumeRec.action === 'decrease' ? '#ef4444'
                            : volumeRec.action === 'increase' ? '#22c55e'
                            : '#3b82f6'
                          : '#27272a',
                        clipPath: 'polygon(1px 0, 100% 0, 100% calc(100% - 1px), calc(100% - 1px) 100%, 0 100%, 0 1px)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {Math.round(volumeRec.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Context Factors */}
          {volumeRec.contextualAdjustments.length > 0 && (
            <div className="px-4 pb-4 bg-zinc-950">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Factors Considered</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {volumeRec.contextualAdjustments.map((factor, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 font-mono"
                    style={{
                      clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
                    }}
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Data Quality Notice */}
          {metrics.dataQuality === 'low' && (
            <div className="p-4 bg-yellow-500/10 border-t border-yellow-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-yellow-500 text-sm uppercase">Limited Data Available</div>
                  <p className="text-xs text-zinc-400 mt-1">
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
