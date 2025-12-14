import React, { useMemo, useState } from 'react';
import { AlertTriangle, Shield, ChevronDown, ChevronUp, Clock, TrendingDown, Zap, RefreshCw, X, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { analyzeDeloadNeed, DeloadRecommendation, DeloadUrgency } from '../services/autoDeload';
import { haptic } from '../services/haptics';

const URGENCY_STYLES: Record<DeloadUrgency, { bg: string; border: string; text: string; badge: string }> = {
  critical: {
    bg: 'bg-red-900/20',
    border: 'border-red-500',
    text: 'text-red-500',
    badge: 'bg-red-500 text-white'
  },
  recommended: {
    bg: 'bg-orange-900/20',
    border: 'border-orange-500',
    text: 'text-orange-500',
    badge: 'bg-orange-500 text-black'
  },
  soon: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500',
    text: 'text-yellow-500',
    badge: 'bg-yellow-500 text-black'
  },
  none: {
    bg: 'bg-green-900/20',
    border: 'border-primary',
    text: 'text-primary',
    badge: 'bg-primary text-black'
  }
};

const URGENCY_LABELS: Record<DeloadUrgency, string> = {
  critical: 'DELOAD NOW',
  recommended: 'DELOAD SOON',
  soon: 'MONITOR',
  none: 'ALL GOOD'
};

export const DeloadAlert: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { history, settings } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);

  const deloadAnalysis = useMemo(() => {
    // Convert experience level to lowercase for the service
    const level = (settings.experienceLevel || 'Intermediate').toLowerCase() as 'beginner' | 'intermediate' | 'advanced';
    return analyzeDeloadNeed(
      history,
      level,
      undefined // lastDeloadDate not yet implemented in settings
    );
  }, [history, settings.experienceLevel]);

  const styles = URGENCY_STYLES[deloadAnalysis.urgency];

  // Don't show anything if urgency is 'none' and compact mode
  if (deloadAnalysis.urgency === 'none' && compact) {
    return null;
  }

  const toggleExpanded = () => {
    haptic('selection');
    setExpanded(!expanded);
  };

  if (compact) {
    return (
      <button
        onClick={toggleExpanded}
        className={`w-full ${styles.bg} border-l-4 ${styles.border} p-4 flex items-center justify-between transition-all`}
      >
        <div className="flex items-center gap-3">
          {deloadAnalysis.urgency === 'none' ? (
            <Shield size={20} className={styles.text} />
          ) : (
            <AlertTriangle size={20} className={styles.text} />
          )}
          <div className="text-left">
            <span className={`${styles.badge} px-2 py-0.5 text-[10px] font-black uppercase`}>
              {URGENCY_LABELS[deloadAnalysis.urgency]}
            </span>
            <p className="text-[10px] text-[#666] font-mono mt-1">
              {deloadAnalysis.weeksSinceLastDeload}w since deload • Score: {deloadAnalysis.score}/100
            </p>
          </div>
        </div>
        <ChevronDown size={16} className="text-[#666]" />
      </button>
    );
  }

  return (
    <div className={`${styles.bg} border ${styles.border}`}>
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {deloadAnalysis.urgency === 'none' ? (
            <Shield size={24} className={styles.text} />
          ) : (
            <AlertTriangle size={24} className={styles.text} />
          )}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className={`font-black uppercase italic text-sm ${styles.text}`}>
                Recovery Status
              </h3>
              <span className={`${styles.badge} px-2 py-0.5 text-[10px] font-black uppercase`}>
                {URGENCY_LABELS[deloadAnalysis.urgency]}
              </span>
            </div>
            <p className="text-[10px] text-[#666] font-mono mt-1">
              {deloadAnalysis.weeksSinceLastDeload} weeks since last deload
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-2xl font-black italic ${styles.text}`}>
              {deloadAnalysis.score}
            </div>
            <div className="text-[8px] text-[#666] uppercase">Fatigue Score</div>
          </div>
          {expanded ? (
            <ChevronUp size={20} className="text-[#666]" />
          ) : (
            <ChevronDown size={20} className="text-[#666]" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-[#333] p-4 space-y-4">
          {/* Fatigue Indicators */}
          {deloadAnalysis.fatigueIndicators.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2">
                Fatigue Indicators
              </h4>
              <div className="space-y-2">
                {deloadAnalysis.fatigueIndicators.map((indicator, idx) => (
                  <div
                    key={idx}
                    className="bg-black/30 p-3 border-l-2"
                    style={{
                      borderColor: indicator.severity === 'severe' ? '#ef4444' :
                                  indicator.severity === 'moderate' ? '#f97316' : '#eab308'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white uppercase">
                        {indicator.type.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 uppercase font-bold ${
                        indicator.severity === 'severe' ? 'bg-red-500 text-white' :
                        indicator.severity === 'moderate' ? 'bg-orange-500 text-black' :
                        'bg-yellow-500 text-black'
                      }`}>
                        {indicator.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888] font-mono">
                      {indicator.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stalled Exercises */}
          {deloadAnalysis.stalledExercises.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2">
                Stalled Lifts
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {deloadAnalysis.stalledExercises.slice(0, 4).map((stall, idx) => (
                  <div key={idx} className="bg-black/30 p-3 border border-[#333]">
                    <div className="text-xs font-bold text-white uppercase truncate">
                      {stall.exerciseName}
                    </div>
                    <div className="text-[10px] text-[#666] font-mono mt-1">
                      Stalled {stall.stallDuration}w at {stall.stalledAt}lbs
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {deloadAnalysis.recommendations.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2">
                Recommendations
              </h4>
              <ul className="space-y-2">
                {deloadAnalysis.recommendations.slice(0, 4).map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className={`${styles.text} mt-0.5`}>•</span>
                    <span className="text-xs text-[#ccc] font-mono leading-relaxed">
                      {rec}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deload Protocol Button */}
          {deloadAnalysis.urgency !== 'none' && (
            <button
              onClick={() => setShowProtocol(true)}
              className={`w-full py-3 border ${styles.border} ${styles.text} font-bold uppercase text-xs flex items-center justify-center gap-2 hover:bg-black/30 transition-colors`}
            >
              <Calendar size={14} />
              View Deload Protocol
            </button>
          )}
        </div>
      )}

      {/* Deload Protocol Modal */}
      {showProtocol && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <div className="bg-[#111] border-2 border-primary max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#222] sticky top-0 bg-[#111]">
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <RefreshCw size={18} className="text-primary" />
                Deload Protocol
              </h3>
              <button
                onClick={() => setShowProtocol(false)}
                className="text-[#666] hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Protocol Type */}
              <div className="bg-black border border-[#222] p-4">
                <div className="text-[10px] text-[#666] uppercase mb-1">Recommended Type</div>
                <div className="text-xl font-black italic text-primary uppercase">
                  {deloadAnalysis.suggestedDeloadType.replace('_', ' ')} Deload
                </div>
              </div>

              {/* Duration & Reductions */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black border border-[#222] p-3 text-center">
                  <div className="text-2xl font-black italic text-white">
                    {deloadAnalysis.deloadProtocol.durationDays}
                  </div>
                  <div className="text-[9px] text-[#666] uppercase">Days</div>
                </div>
                <div className="bg-black border border-[#222] p-3 text-center">
                  <div className="text-2xl font-black italic text-orange-400">
                    -{deloadAnalysis.deloadProtocol.volumeReduction}%
                  </div>
                  <div className="text-[9px] text-[#666] uppercase">Volume</div>
                </div>
                <div className="bg-black border border-[#222] p-3 text-center">
                  <div className="text-2xl font-black italic text-yellow-400">
                    -{deloadAnalysis.deloadProtocol.intensityReduction}%
                  </div>
                  <div className="text-[9px] text-[#666] uppercase">Intensity</div>
                </div>
              </div>

              {/* Focus Areas */}
              <div>
                <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2">
                  Focus Areas
                </h4>
                <ul className="space-y-2">
                  {deloadAnalysis.deloadProtocol.focusAreas.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Zap size={12} className="text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-[#ccc] font-mono">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Activities */}
              <div>
                <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2">
                  Recommended Activities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {deloadAnalysis.deloadProtocol.activities.map((activity, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-black border border-[#333] text-[10px] font-mono text-[#888] uppercase"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowProtocol(false)}
                className="w-full py-3 bg-primary text-black font-bold uppercase text-xs hover:bg-white transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeloadAlert;
