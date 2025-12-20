/**
 * AMAP Completion Modal
 *
 * Shows after completing an AMAP (As Many As Possible) set
 * Displays AI-enhanced Training Max suggestions based on performance
 */

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, CheckCircle2, AlertCircle, Zap, Brain } from 'lucide-react';
import { getTrainingMaxSuggestion } from '../services/gnCoachingService';
import {
  getAMAPProgression,
  getAMAPDescription,
  GN_AMAP_SQUAT_PROGRESSION,
  GN_AMAP_BENCH_PROGRESSION,
  GN_AMAP_DEADLIFT_PROGRESSION
} from '../utils/percentageCalculator';

interface AMAPCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newTM: number) => void;
  exerciseId: string;
  exerciseName: string;
  currentTM: number;
  amapReps: number;
  setData: {
    completedSets: number;
    totalSets: number;
    averageRPE?: number;
    missedReps: number;
  };
  recoveryMetrics?: {
    sleep?: number;
    stress?: number;
    soreness?: number;
    bodyweight?: number;
    bodyweightChange?: number;
  };
}

const AMAPCompletionModal: React.FC<AMAPCompletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  exerciseId,
  exerciseName,
  currentTM,
  amapReps,
  setData,
  recoveryMetrics
}) => {
  const [loading, setLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<{
    recommended: number;
    reasoning: string;
    confidence: 'high' | 'medium' | 'low';
    alternative?: number;
  } | null>(null);
  const [selectedTM, setSelectedTM] = useState(currentTM);
  const [customTM, setCustomTM] = useState(currentTM);
  const [useCustom, setUseCustom] = useState(false);

  // Get standard AMAP progression for comparison
  const amapTable = exerciseId === 'e4' ? GN_AMAP_SQUAT_PROGRESSION :
                   exerciseId === 'e1' ? GN_AMAP_BENCH_PROGRESSION :
                   GN_AMAP_DEADLIFT_PROGRESSION;
  const standardProgression = getAMAPProgression(amapTable, amapReps);
  const standardTM = currentTM + standardProgression;
  const standardDescription = getAMAPDescription(amapTable, amapReps);

  // Fetch AI suggestion on mount
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getTrainingMaxSuggestion(
        exerciseId,
        exerciseName,
        currentTM,
        amapReps,
        setData,
        recoveryMetrics
      ).then(suggestion => {
        setAiSuggestion(suggestion);
        setSelectedTM(suggestion.recommended);
        setCustomTM(suggestion.recommended);
        setLoading(false);
      }).catch(err => {
        console.error('Failed to get AI suggestion:', err);
        setAiSuggestion({
          recommended: standardTM,
          reasoning: standardDescription,
          confidence: 'medium'
        });
        setSelectedTM(standardTM);
        setCustomTM(standardTM);
        setLoading(false);
      });
    }
  }, [isOpen, exerciseId, exerciseName, currentTM, amapReps]);

  if (!isOpen) return null;

  // Determine performance tier
  const getPerformanceTier = () => {
    if (amapReps >= 10) return { label: 'Excellent', color: 'text-primary', icon: '🔥' };
    if (amapReps >= 7) return { label: 'Great', color: 'text-green-400', icon: '💪' };
    if (amapReps >= 5) return { label: 'Good', color: 'text-yellow-400', icon: '✓' };
    return { label: 'Needs Work', color: 'text-red-400', icon: '⚠️' };
  };

  const performance = getPerformanceTier();
  const finalTM = useCustom ? customTM : selectedTM;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border-2 border-primary max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#111] border-b border-[#222] p-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-primary uppercase tracking-wider italic">
            AMAP Complete
          </h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Performance Summary */}
          <div className="bg-black border-l-4 border-primary p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">{exerciseName}</h3>
              <span className="text-3xl">{performance.icon}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
              <div>
                <span className="text-[#666] uppercase text-xs">AMAP Reps</span>
                <p className={`text-2xl font-black ${performance.color}`}>{amapReps}</p>
              </div>
              <div>
                <span className="text-[#666] uppercase text-xs">Performance</span>
                <p className={`text-lg font-bold ${performance.color}`}>{performance.label}</p>
              </div>
            </div>
          </div>

          {/* AI Suggestion */}
          {loading ? (
            <div className="bg-black p-6 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-[#888] font-mono text-sm">Analyzing performance...</p>
            </div>
          ) : aiSuggestion && (
            <>
              {/* AI Recommendation */}
              <div className="bg-black border border-primary p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Brain size={20} className="text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-primary uppercase tracking-wider">
                        AI Coach Recommendation
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                        aiSuggestion.confidence === 'high' ? 'bg-green-900 text-green-300' :
                        aiSuggestion.confidence === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {aiSuggestion.confidence} confidence
                      </span>
                    </div>
                    <p className="text-sm text-[#ccc] leading-relaxed mb-3">{aiSuggestion.reasoning}</p>
                  </div>
                </div>

                {/* TM Options */}
                <div className="space-y-2">
                  {/* AI Recommended */}
                  <label className="flex items-center gap-3 p-3 bg-[#111] border-2 border-primary cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                    <input
                      type="radio"
                      checked={!useCustom && selectedTM === aiSuggestion.recommended}
                      onChange={() => {
                        setUseCustom(false);
                        setSelectedTM(aiSuggestion.recommended);
                      }}
                      className="accent-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">AI Recommended</span>
                        <span className="text-primary font-black text-lg">{aiSuggestion.recommended} lbs</span>
                      </div>
                      <span className="text-xs text-[#666]">
                        {aiSuggestion.recommended > currentTM ? `+${aiSuggestion.recommended - currentTM}` : aiSuggestion.recommended - currentTM} lbs change
                      </span>
                    </div>
                  </label>

                  {/* Alternative (if provided) */}
                  {aiSuggestion.alternative && (
                    <label className="flex items-center gap-3 p-3 bg-[#111] border-2 border-[#333] cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                      <input
                        type="radio"
                        checked={!useCustom && selectedTM === aiSuggestion.alternative}
                        onChange={() => {
                          setUseCustom(false);
                          setSelectedTM(aiSuggestion.alternative!);
                        }}
                        className="accent-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#aaa]">Conservative Option</span>
                          <span className="text-white font-black text-lg">{aiSuggestion.alternative} lbs</span>
                        </div>
                        <span className="text-xs text-[#666]">
                          {aiSuggestion.alternative > currentTM ? `+${aiSuggestion.alternative - currentTM}` : aiSuggestion.alternative - currentTM} lbs change
                        </span>
                      </div>
                    </label>
                  )}

                  {/* Standard AMAP (for comparison) */}
                  {standardTM !== aiSuggestion.recommended && (
                    <label className="flex items-center gap-3 p-3 bg-[#111] border-2 border-[#333] cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                      <input
                        type="radio"
                        checked={!useCustom && selectedTM === standardTM}
                        onChange={() => {
                          setUseCustom(false);
                          setSelectedTM(standardTM);
                        }}
                        className="accent-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#aaa]">Standard AMAP</span>
                          <span className="text-white font-black text-lg">{standardTM} lbs</span>
                        </div>
                        <span className="text-xs text-[#666]">{standardDescription}</span>
                      </div>
                    </label>
                  )}

                  {/* Custom Input */}
                  <label className="flex items-center gap-3 p-3 bg-[#111] border-2 border-[#333] cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                    <input
                      type="radio"
                      checked={useCustom}
                      onChange={() => setUseCustom(true)}
                      className="accent-primary"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-[#aaa] block mb-2">Custom Training Max</span>
                      <input
                        type="number"
                        value={customTM}
                        onChange={(e) => {
                          setCustomTM(Number(e.target.value));
                          setUseCustom(true);
                        }}
                        className="w-full bg-black border border-[#333] p-2 text-white font-mono text-center focus:border-primary outline-none"
                        step="5"
                        min={currentTM - 20}
                        max={currentTM + 30}
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#0a0a0a] p-4 border-l-4 border-primary">
                <div className="flex items-center justify-between text-sm font-mono">
                  <span className="text-[#888]">Current TM:</span>
                  <span className="text-white font-bold">{currentTM} lbs</span>
                </div>
                <div className="flex items-center justify-between text-sm font-mono mt-2">
                  <span className="text-[#888]">New TM:</span>
                  <span className="text-primary font-black text-lg">{finalTM} lbs</span>
                </div>
                <div className="flex items-center justify-between text-sm font-mono mt-1">
                  <span className="text-[#888]">Change:</span>
                  <span className={`font-bold ${finalTM > currentTM ? 'text-green-400' : finalTM < currentTM ? 'text-red-400' : 'text-yellow-400'}`}>
                    {finalTM > currentTM ? '+' : ''}{finalTM - currentTM} lbs
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-[#444] text-[#888] font-bold uppercase text-sm tracking-widest hover:border-white hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(finalTM)}
              disabled={loading}
              className="flex-1 py-3 bg-primary text-black font-black italic uppercase text-sm tracking-widest hover:bg-white shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Confirm {finalTM} lbs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AMAPCompletionModal;
