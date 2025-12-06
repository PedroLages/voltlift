/**
 * Performance Insights Component
 *
 * Displays AI-powered performance trend analysis for Greg Nuckols programs
 * Shows Training Max history, volume trends, and AI coaching recommendations
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Brain, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { analyzePerformanceTrend } from '../services/gnCoachingService';
import { WorkoutSession, TrainingMax } from '../types';

interface PerformanceInsightsProps {
  exerciseId: string;
  exerciseName: string;
  trainingMax?: TrainingMax;
  recentSessions: WorkoutSession[];
}

const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({
  exerciseId,
  exerciseName,
  trainingMax,
  recentSessions
}) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<{
    trend: 'improving' | 'plateauing' | 'declining';
    keyFactors: string[];
    recommendations: string[];
  } | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Fetch AI insights
  const fetchInsights = async () => {
    if (!trainingMax || trainingMax.history.length < 2) return;

    setLoading(true);
    try {
      const result = await analyzePerformanceTrend(
        exerciseName,
        trainingMax.history.map(h => ({ value: h.value, date: h.date })),
        recentSessions
      );
      setInsight(result);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !insight && trainingMax?.history.length >= 2) {
      fetchInsights();
    }
  }, [expanded]);

  if (!trainingMax || trainingMax.history.length < 2) {
    return (
      <div className="bg-[#0a0a0a] border border-[#222] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-[#666] uppercase tracking-wider">Performance Insights</h3>
          <AlertCircle size={16} className="text-[#444]" />
        </div>
        <p className="text-xs text-[#666] font-mono">
          Complete at least 2 training cycles to unlock AI performance analysis
        </p>
      </div>
    );
  }

  // Calculate TM stats
  const currentTM = trainingMax.value;
  const oldestTM = trainingMax.history[trainingMax.history.length - 1].value;
  const totalGain = currentTM - oldestTM;
  const avgGainPerCycle = totalGain / (trainingMax.history.length - 1);

  // Determine trend icon/color
  const getTrendDisplay = () => {
    if (!insight) return { icon: Minus, color: 'text-[#666]', label: 'Analyzing' };

    switch (insight.trend) {
      case 'improving':
        return { icon: TrendingUp, color: 'text-green-400', label: 'Improving' };
      case 'declining':
        return { icon: TrendingDown, color: 'text-red-400', label: 'Declining' };
      default:
        return { icon: Minus, color: 'text-yellow-400', label: 'Plateauing' };
    }
  };

  const trendDisplay = getTrendDisplay();
  const TrendIcon = trendDisplay.icon;

  return (
    <div className="bg-[#0a0a0a] border border-[#222]">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-[#111] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Brain size={18} className="text-primary" />
          <div className="text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{exerciseName} Insights</h3>
            <p className="text-xs text-[#666] font-mono mt-0.5">
              {trainingMax.history.length} cycles • {totalGain > 0 ? '+' : ''}{totalGain} lbs total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 ${trendDisplay.color}`}>
            <TrendIcon size={18} />
            <span className="text-xs font-bold uppercase">{trendDisplay.label}</span>
          </div>
          <span className="text-[#666]">{expanded ? '−' : '+'}</span>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#222]">
          {/* TM History Chart */}
          <div className="bg-black p-3">
            <h4 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3">Training Max History</h4>
            <div className="space-y-2">
              {trainingMax.history.slice().reverse().map((tm, idx) => {
                const isLatest = idx === 0;
                const prevTM = idx < trainingMax.history.length - 1 ? trainingMax.history[trainingMax.history.length - idx - 2].value : tm.value;
                const change = tm.value - prevTM;

                return (
                  <div key={idx} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#666]">
                      Cycle {trainingMax.history.length - idx}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={isLatest ? 'text-primary font-bold' : 'text-white'}>
                        {tm.value} lbs
                      </span>
                      {change !== 0 && (
                        <span className={`text-xs ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {change > 0 ? '+' : ''}{change}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-[#222] flex items-center justify-between text-sm">
              <span className="text-[#888]">Avg Gain/Cycle</span>
              <span className={`font-bold ${avgGainPerCycle > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {avgGainPerCycle > 0 ? '+' : ''}{avgGainPerCycle.toFixed(1)} lbs
              </span>
            </div>
          </div>

          {/* AI Analysis */}
          {loading ? (
            <div className="bg-black p-6 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-[#888] font-mono text-xs">Analyzing patterns...</p>
            </div>
          ) : insight && (
            <>
              {/* Key Factors */}
              <div className="bg-black border-l-4 border-primary p-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Zap size={14} />
                  Key Factors
                </h4>
                <ul className="space-y-1.5 text-xs text-[#ccc] font-mono leading-relaxed">
                  {insight.keyFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="bg-black border-l-4 border-green-500 p-3">
                <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  Recommendations
                </h4>
                <ul className="space-y-1.5 text-xs text-[#ccc] font-mono leading-relaxed">
                  {insight.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 flex-shrink-0">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="w-full py-2 border border-[#333] text-[#888] text-xs font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default PerformanceInsights;
