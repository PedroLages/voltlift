import React, { useEffect, useState } from 'react';
import { CheckCircle2, Save, X, Trophy, Clock, TrendingUp, Zap } from 'lucide-react';
import { WorkoutSession, UserSettings } from '../types';
import { generateSessionSummary } from '../services/geminiService';
import { WorkoutSummaryResponse } from '../services/ai/types';
import { getAngularClipPath } from '../utils/achievementUtils';

interface WorkoutCompletionModalProps {
  workout: WorkoutSession;
  settings: UserSettings;
  previousWeekVolume?: number;
  prsAchieved?: string[];
  onFinish: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

export const WorkoutCompletionModal: React.FC<WorkoutCompletionModalProps> = ({
  workout,
  settings,
  previousWeekVolume,
  prsAchieved = [],
  onFinish,
  onSaveDraft,
  onCancel,
  onDismiss
}) => {
  const [summary, setSummary] = useState<WorkoutSummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Calculate workout stats
  const duration = workout.endTime
    ? Math.round((workout.endTime - workout.startTime) / 1000 / 60)
    : Math.round((Date.now() - workout.startTime) / 1000 / 60);

  let totalVolume = 0;
  let totalSets = 0;

  workout.logs.forEach((log) => {
    log.sets.forEach((set) => {
      if (set.completed) {
        totalVolume += set.weight * set.reps;
        totalSets++;
      }
    });
  });

  // Fetch AI summary on mount (optional enhancement)
  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const result = await generateSessionSummary(
          workout,
          settings,
          previousWeekVolume,
          prsAchieved
        );
        if (result.success && result.data) {
          setSummary(result.data);
        }
      } catch (err) {
        console.error('Failed to generate session summary:', err);
      } finally {
        setLoadingSummary(false);
      }
    };

    // Only fetch if online
    if (navigator.onLine) {
      fetchSummary();
    }
  }, [workout, settings, previousWeekVolume, prsAchieved]);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-black border-2 border-primary max-w-lg w-full overflow-hidden flex flex-col relative max-h-[90vh]"
        style={{
          clipPath: getAngularClipPath(16),
          boxShadow: '0 0 30px rgba(204, 255, 0, 0.3)',
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary pointer-events-none z-10" />
        <div className="absolute top-0 right-4 w-4 h-4 border-r-2 border-t-2 border-primary pointer-events-none z-10" />
        <div className="absolute bottom-4 left-0 w-4 h-4 border-l-2 border-b-2 border-primary pointer-events-none z-10" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary pointer-events-none z-10" />

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
              <CheckCircle2 size={20} className="text-black" />
            </div>
            <h2 className="font-black italic uppercase text-white text-lg tracking-wide">
              Workout Complete
            </h2>
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            style={{
              clipPath: getAngularClipPath(4),
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="relative z-10 p-4 border-b border-zinc-800 grid grid-cols-3 gap-2">
          <div
            className="p-3 bg-zinc-900/50 border border-zinc-700"
            style={{ clipPath: getAngularClipPath(6) }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Clock size={12} className="text-primary" />
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Time</span>
            </div>
            <div className="text-lg font-black font-mono text-white">{duration}m</div>
          </div>

          <div
            className="p-3 bg-zinc-900/50 border border-zinc-700"
            style={{ clipPath: getAngularClipPath(6) }}
          >
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp size={12} className="text-primary" />
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Volume</span>
            </div>
            <div className="text-lg font-black font-mono text-white">
              {Math.round(totalVolume).toLocaleString()}
            </div>
          </div>

          <div
            className="p-3 bg-zinc-900/50 border border-zinc-700"
            style={{ clipPath: getAngularClipPath(6) }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Trophy size={12} className="text-primary" />
              <span className="text-[10px] text-zinc-500 uppercase font-bold">PRs</span>
            </div>
            <div className="text-lg font-black font-mono text-white">{prsAchieved.length}</div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="relative z-10 p-4 overflow-y-auto max-h-[300px]">
          {loadingSummary && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {!loadingSummary && summary && (
            <div className="space-y-3">
              {/* AI Summary Text */}
              <div
                className="p-3 bg-primary/10 border border-primary/30"
                style={{ clipPath: getAngularClipPath(6) }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    AI Analysis
                  </h3>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{summary.summary}</p>
              </div>

              {/* Highlights */}
              {summary.highlights.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    Highlights
                  </h4>
                  <div className="space-y-1">
                    {summary.highlights.map((highlight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-400"
                        style={{ clipPath: getAngularClipPath(4) }}
                      >
                        <span className="text-primary">•</span>
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Focus */}
              {summary.nextSessionFocus && (
                <div
                  className="p-2 bg-zinc-900/50 border border-zinc-700"
                  style={{ clipPath: getAngularClipPath(4) }}
                >
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
                    Next Session Focus
                  </div>
                  <div className="text-xs text-zinc-300">{summary.nextSessionFocus}</div>
                </div>
              )}
            </div>
          )}

          {!loadingSummary && !summary && (
            <p className="text-sm text-zinc-500 text-center py-4">
              Great work! Choose how to save your progress.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="relative z-10 p-4 border-t border-zinc-800 space-y-2">
          <button
            onClick={onFinish}
            className="w-full py-3 font-bold text-sm uppercase transition-all border-2 bg-primary border-primary text-black hover:shadow-neon flex items-center justify-center gap-2"
            style={{
              clipPath: getAngularClipPath(6),
            }}
          >
            <CheckCircle2 size={18} />
            Finish & Save
          </button>

          <button
            onClick={onSaveDraft}
            className="w-full py-3 font-bold text-sm uppercase transition-all border-2 bg-zinc-900 border-zinc-700 text-white hover:border-zinc-500 flex items-center justify-center gap-2"
            style={{
              clipPath: getAngularClipPath(6),
            }}
          >
            <Save size={18} />
            Save as Draft
          </button>

          <button
            onClick={onCancel}
            className="w-full py-3 font-bold text-sm uppercase transition-all border-2 bg-transparent border-red-500/30 text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-2"
            style={{
              clipPath: getAngularClipPath(6),
            }}
          >
            <X size={18} />
            Discard Workout
          </button>

          <p className="text-[10px] text-zinc-600 font-mono uppercase text-center mt-2">
            Draft workouts can be resumed later
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkoutCompletionModal;
