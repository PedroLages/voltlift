/**
 * AI Suggestion Badge Component
 *
 * Displays offline AI Coach progressive overload suggestions with:
 * - Weight/rep recommendation
 * - Confidence indicator (high/medium/low)
 * - Reasoning tooltip
 * - One-tap to apply suggestion
 */

import React, { useState } from 'react';
import { Sparkles, Info, TrendingUp, AlertCircle } from 'lucide-react';
import { ProgressiveSuggestion } from '../services/progressiveOverload';

interface AISuggestionBadgeProps {
  suggestion: ProgressiveSuggestion;
  onApply?: () => void;
  showApplyButton?: boolean;
  compact?: boolean;
  units?: 'kg' | 'lbs';
}

export const AISuggestionBadge: React.FC<AISuggestionBadgeProps> = ({
  suggestion,
  onApply,
  showApplyButton = true,
  compact = false,
  units = 'lbs'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const confidenceColor = {
    high: 'text-[#ccff00] border-[#ccff00]',
    medium: 'text-blue-400 border-blue-400',
    low: 'text-orange-400 border-orange-400'
  }[suggestion.confidence];

  const confidenceIcon = {
    high: <TrendingUp size={12} />,
    medium: <Info size={12} />,
    low: <AlertCircle size={12} />
  }[suggestion.confidence];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 bg-black/50 border ${confidenceColor} text-[10px] font-bold uppercase tracking-wider`}>
        <Sparkles size={10} className="shrink-0" />
        <span>{suggestion.weight}{units} × {suggestion.reps[0]}-{suggestion.reps[1]}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowTooltip(!showTooltip);
          }}
          className="hover:opacity-70"
        >
          {confidenceIcon}
        </button>
        {showTooltip && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-[#111] border border-[#333] p-3 z-50 shadow-xl">
            <p className="text-[10px] font-mono text-[#aaa] mb-2">{suggestion.reasoning}</p>
            <div className="flex justify-between items-center text-[9px] text-[#666] uppercase">
              <span>Confidence: {suggestion.confidence}</span>
              <span>Recovery: {suggestion.recoveryScore}/10</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 px-4 py-3 bg-black/30 border ${confidenceColor} backdrop-blur-sm`}>
        <div className="flex items-center gap-2 flex-1">
          <Sparkles size={16} className="shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider">
              AI Suggests
            </span>
            <span className="text-lg font-black italic">
              {suggestion.weight} <span className="text-xs font-normal">{units.toUpperCase()}</span> × {suggestion.reps[0]}-{suggestion.reps[1]} <span className="text-xs font-normal">REPS</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            aria-label="Show reasoning"
          >
            {confidenceIcon}
          </button>

          {showApplyButton && onApply && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className="px-3 py-1.5 bg-primary text-black text-xs font-black uppercase italic tracking-wider hover:bg-white transition-colors"
            >
              Apply
            </button>
          )}
        </div>
      </div>

      {showTooltip && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-[#333] p-4 z-50 shadow-xl animate-fade-in">
          <div className="flex items-start gap-2 mb-3">
            <Info size={14} className={confidenceColor.split(' ')[0]} />
            <p className="text-xs font-mono text-[#aaa] leading-relaxed">
              {suggestion.reasoning}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-[#222] pt-3">
            <div>
              <span className="text-[#666] uppercase block mb-1">Confidence</span>
              <span className={`font-bold uppercase ${confidenceColor.split(' ')[0]}`}>
                {suggestion.confidence}
              </span>
            </div>
            <div>
              <span className="text-[#666] uppercase block mb-1">Recovery</span>
              <span className="font-bold text-white">
                {suggestion.recoveryScore}/10
              </span>
            </div>
          </div>

          {suggestion.shouldDeload && (
            <div className="mt-3 px-3 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={12} />
              Deload Recommended
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="mt-3 w-full text-center text-[10px] text-[#666] hover:text-white uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Volume Warning Badge Component
 * Shows when weekly volume approaches MRV
 */
interface VolumeWarningBadgeProps {
  warning: { warning: boolean; message: string; sets: number };
}

export const VolumeWarningBadge: React.FC<VolumeWarningBadgeProps> = ({ warning }) => {
  if (!warning.warning) return null;

  const isHighWarning = warning.sets >= 22;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 border ${
      isHighWarning
        ? 'bg-red-500/10 border-red-500/50 text-red-400'
        : 'bg-orange-500/10 border-orange-500/50 text-orange-400'
    } text-[10px] font-bold uppercase tracking-wider`}>
      <AlertCircle size={10} />
      <span>{Math.round(warning.sets)} sets/week</span>
    </div>
  );
};

/**
 * Recovery Score Indicator Component
 * Shows recovery readiness (0-10 scale)
 */
interface RecoveryScoreProps {
  score: number;
  compact?: boolean;
}

export const RecoveryScore: React.FC<RecoveryScoreProps> = ({ score, compact = false }) => {
  const getStatus = (score: number) => {
    if (score >= 8) return { label: 'FRESH', color: 'text-[#ccff00]' };
    if (score >= 6) return { label: 'READY', color: 'text-green-400' };
    if (score >= 4) return { label: 'FATIGUED', color: 'text-orange-400' };
    return { label: 'DEPLETED', color: 'text-red-400' };
  };

  const status = getStatus(score);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-[#111] border border-[#222]">
        <div className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-')}`} />
        <span className={`text-[10px] font-bold font-mono ${status.color}`}>
          {score}/10
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[#666] uppercase font-bold tracking-wider">
          Recovery
        </span>
        <span className={`text-xs font-bold uppercase ${status.color}`}>
          {status.label}
        </span>
      </div>
      <div className="flex gap-1">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 ${
              i < score
                ? status.color.replace('text-', 'bg-')
                : 'bg-[#222]'
            }`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-mono ${status.color} text-right`}>
        {score}/10
      </span>
    </div>
  );
};
