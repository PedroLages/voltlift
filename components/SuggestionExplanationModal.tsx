/**
 * SuggestionExplanationModal Component
 *
 * Educational modal explaining WHY an AI suggestion was made
 * Industrial HUD-style design with science-based explanations
 */

import React, { useEffect, useState } from 'react';
import { X, Brain, Zap, TrendingUp, Info, WifiOff } from 'lucide-react';
import { ProgressiveSuggestion } from '../services/progressiveOverload';
import { explainSuggestion } from '../services/geminiService';
import { ExerciseLog, UserSettings } from '../types';
import { getAngularClipPath } from '../utils/achievementUtils';
import { SuggestionExplanationResponse } from '../services/ai/types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { CornerBrackets } from './ui/CornerBrackets';

interface SuggestionExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: ProgressiveSuggestion;
  exerciseId: string;
  exerciseName: string;
  lastWorkout?: ExerciseLog;
  settings: UserSettings;
}

export function SuggestionExplanationModal({
  isOpen,
  onClose,
  suggestion,
  exerciseId,
  exerciseName,
  lastWorkout,
  settings,
}: SuggestionExplanationModalProps) {
  const [explanation, setExplanation] = useState<SuggestionExplanationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Focus trap and Escape key handler
  const modalRef = useFocusTrap({ isOpen, onClose });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const fetchExplanation = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await explainSuggestion(
          suggestion,
          exerciseId,
          lastWorkout,
          settings
        );

        if (result.success && result.data) {
          setExplanation(result.data);
        } else {
          setError(result.error || 'Failed to generate explanation');
        }
      } catch (err) {
        setError('Network error - please check your connection');
        console.error('Explanation error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [isOpen, suggestion, exerciseId, lastWorkout, settings]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="explanation-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-black border-2 border-primary max-w-lg w-full overflow-hidden flex flex-col relative"
        style={{
          clipPath: getAngularClipPath(16),
          boxShadow: '0 0 30px rgba(204, 255, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner Brackets */}
        <CornerBrackets color="#ccff00" size={4} />

        {/* Scan Lines */}
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
        <div className="relative z-10 flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 bg-primary flex items-center justify-center"
              style={{
                clipPath: getAngularClipPath(6),
              }}
            >
              <Brain size={20} className="text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="explanation-modal-title" className="font-black italic uppercase text-white text-sm tracking-wide">
                  Suggestion Explained
                </h2>
                {isOffline && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700">
                    <WifiOff size={10} className="text-zinc-500" />
                    <span className="text-[8px] text-zinc-500 uppercase font-bold">Offline</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase">{exerciseName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close explanation modal"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors motion-reduce:transition-none"
            style={{
              clipPath: getAngularClipPath(4),
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {error && (
            <div
              className="p-3 bg-red-500/10 border border-red-500/30"
              style={{ clipPath: getAngularClipPath(6) }}
            >
              <div className="flex items-start gap-2 text-red-500">
                <Info size={16} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && explanation && (
            <>
              {/* Main Explanation */}
              <div
                className="p-4 bg-zinc-900/50 border border-primary/30"
                style={{ clipPath: getAngularClipPath(8) }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Why This Works
                  </h3>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {explanation.explanation}
                </p>
              </div>

              {/* Key Factors */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Key Factors Considered
                </h3>
                <div className="space-y-2">
                  {explanation.keyFactors.map((factor, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-zinc-900/30 border border-zinc-800"
                      style={{ clipPath: getAngularClipPath(4) }}
                    >
                      <Zap size={14} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-zinc-400">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What to Expect */}
              <div
                className="p-3 bg-primary/10 border border-primary/30"
                style={{ clipPath: getAngularClipPath(6) }}
              >
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                      What to Expect
                    </h4>
                    <p className="text-xs text-zinc-300">{explanation.whatToExpect}</p>
                  </div>
                </div>
              </div>

              {/* Science Note (if available) */}
              {explanation.scienceBehindIt && (
                <div className="p-3 bg-zinc-900/30 border border-zinc-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    The Science
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {explanation.scienceBehindIt}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full min-h-[44px] py-3 font-bold text-sm uppercase transition-all motion-reduce:transition-none border-2 bg-primary border-primary text-black hover:shadow-neon motion-reduce:hover:shadow-none"
            style={{
              clipPath: getAngularClipPath(6),
            }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuggestionExplanationModal;
