/**
 * ProgressionSuggestionBadge Component
 *
 * Displays AI-powered weight/rep suggestions with industrial HUD aesthetic
 * Shows confidence level, reasoning, and recovery indicators
 */

import React, { useState } from 'react';
import { Zap, Brain, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { ProgressiveSuggestion } from '../services/suggestionService';
import { getAngularClipPath } from '../utils/achievementUtils';

interface ProgressionSuggestionBadgeProps {
  suggestion: ProgressiveSuggestion;
  exerciseName: string;
  units: 'kg' | 'lbs';
  onApply: () => void;
  onExplain?: () => void;
  compact?: boolean;
}

/**
 * Get confidence color based on level
 */
function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return '#22c55e'; // green-500
    case 'medium':
      return '#eab308'; // yellow-500
    case 'low':
      return '#ef4444'; // red-500
  }
}

/**
 * Get recovery status color
 */
function getRecoveryColor(score: number): string {
  if (score >= 8) return '#22c55e'; // green - FRESH
  if (score >= 6) return '#eab308'; // yellow - READY
  if (score >= 4) return '#f97316'; // orange - FATIGUED
  return '#ef4444'; // red - DEPLETED
}

export function ProgressionSuggestionBadge({
  suggestion,
  exerciseName,
  units,
  onApply,
  onExplain,
  compact = false,
}: ProgressionSuggestionBadgeProps) {
  const [showFullReasoning, setShowFullReasoning] = useState(false);

  const confidenceColor = getConfidenceColor(suggestion.confidence);
  const recoveryColor = getRecoveryColor(suggestion.recoveryScore);
  const isWarning = suggestion.shouldDeload || suggestion.confidence === 'low' || suggestion.recoveryScore < 5;

  const [minReps, maxReps] = suggestion.reps;
  const repsText = minReps === maxReps ? `${minReps}` : `${minReps}-${maxReps}`;

  if (compact) {
    // Compact version for inline display
    return (
      <div
        className="flex items-center gap-2 p-2 bg-black border"
        style={{
          borderColor: confidenceColor,
          clipPath: getAngularClipPath(4),
        }}
      >
        <Brain className="w-4 h-4" style={{ color: confidenceColor }} />
        <div className="flex-1">
          <span className="text-xs text-zinc-400 uppercase font-bold">AI:</span>
          <span className="ml-2 text-sm font-black text-white">
            {suggestion.weight} {units}
          </span>
          <span className="ml-1 text-xs text-zinc-500">× {repsText}</span>
        </div>
        <button
          onClick={onApply}
          className="px-2 py-1 text-xs font-bold uppercase bg-primary text-black hover:shadow-neon transition-all"
          style={{ clipPath: getAngularClipPath(3) }}
        >
          Apply
        </button>
      </div>
    );
  }

  // Full version with detailed info
  return (
    <div
      className="bg-black border-2 p-3 relative"
      style={{
        borderColor: confidenceColor,
        backgroundColor: isWarning ? `${confidenceColor}10` : 'black',
        clipPath: getAngularClipPath(8),
        boxShadow: `0 0 15px ${confidenceColor}30`,
      }}
    >
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 pointer-events-none" style={{ borderColor: confidenceColor }} />
      <div className="absolute top-0 right-2 w-2 h-2 border-r-2 border-t-2 pointer-events-none" style={{ borderColor: confidenceColor }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{
              backgroundColor: `${confidenceColor}20`,
              clipPath: getAngularClipPath(4),
            }}
          >
            <Brain className="w-4 h-4" style={{ color: confidenceColor }} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">AI Suggestion</p>
            <p className="text-xs text-zinc-400 font-mono">
              {suggestion.confidence.toUpperCase()} CONFIDENCE
            </p>
          </div>
        </div>

        {/* Recovery Indicator */}
        <div
          className="px-2 py-1 flex items-center gap-1"
          style={{
            backgroundColor: `${recoveryColor}15`,
            border: `1px solid ${recoveryColor}40`,
            clipPath: getAngularClipPath(3),
          }}
        >
          <Zap className="w-3 h-3" style={{ color: recoveryColor }} />
          <span className="text-[10px] font-bold font-mono" style={{ color: recoveryColor }}>
            {suggestion.recoveryScore}/10
          </span>
        </div>
      </div>

      {/* Suggested Weight/Reps */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-black font-mono text-white italic">
          {suggestion.weight}
        </span>
        <span className="text-lg text-zinc-400 font-bold">{units}</span>
        <span className="text-zinc-600">×</span>
        <span className="text-2xl font-black font-mono" style={{ color: confidenceColor }}>
          {repsText}
        </span>
        <span className="text-sm text-zinc-500">reps</span>
      </div>

      {/* Warning Banner */}
      {isWarning && (
        <div
          className="flex items-center gap-2 p-2 mb-3 border"
          style={{
            backgroundColor: '#ef444410',
            borderColor: '#ef444440',
            clipPath: getAngularClipPath(4),
          }}
        >
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-400 font-bold uppercase">
            {suggestion.shouldDeload
              ? 'Deload Recommended'
              : suggestion.recoveryScore < 5
              ? 'Low Recovery - Be Cautious'
              : 'Low Confidence - Verify First'}
          </span>
        </div>
      )}

      {/* Reasoning */}
      <div className="mb-3">
        <button
          onClick={() => setShowFullReasoning(!showFullReasoning)}
          className="flex items-center gap-2 w-full text-left mb-1"
        >
          <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Why?</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </button>
        {showFullReasoning && (
          <p className="text-xs text-zinc-400 leading-relaxed pl-2 border-l-2 border-zinc-800">
            {suggestion.reasoning}
          </p>
        )}
      </div>

      {/* Math Explanation (if available) */}
      {suggestion.mathExplanation && showFullReasoning && (
        <div
          className="p-2 mb-3"
          style={{
            backgroundColor: '#27272a', // zinc-800
            clipPath: getAngularClipPath(4),
          }}
        >
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Calculation:</p>
          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            {suggestion.mathExplanation}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onApply}
          className="flex-1 py-2 font-bold text-sm uppercase transition-all border-2 flex items-center justify-center gap-2 hover:shadow-neon"
          style={{
            backgroundColor: confidenceColor,
            borderColor: confidenceColor,
            color: '#000',
            clipPath: getAngularClipPath(4),
          }}
        >
          <CheckCircle size={16} />
          Apply Suggestion
        </button>

        {onExplain && (
          <button
            onClick={onExplain}
            className="px-3 py-2 font-bold text-sm uppercase transition-all border-2 bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
            style={{
              clipPath: getAngularClipPath(4),
            }}
            aria-label="Get detailed AI explanation"
          >
            <HelpCircle size={16} />
          </button>
        )}
      </div>

      {/* Estimated 1RM (if available) */}
      {suggestion.estimated1RM && showFullReasoning && (
        <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-600">
          <span>EST. 1RM</span>
          <span className="font-mono font-bold">
            {suggestion.estimated1RM} {units}
          </span>
        </div>
      )}
    </div>
  );
}

export default ProgressionSuggestionBadge;
