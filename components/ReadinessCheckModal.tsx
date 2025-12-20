/**
 * ReadinessCheckModal Component
 *
 * Pre-workout wellness check-in modal
 * Industrial HUD-style design with quick 1-5 scale inputs
 */

import React, { useState, useMemo } from 'react';
import { X, Moon, Battery, Flame, Brain, Zap, AlertTriangle } from 'lucide-react';
import {
  calculateReadinessScore,
  getReadinessColor,
  getReadinessTextColor,
  type ReadinessInputs,
  type ReadinessResult,
} from '../services/readinessScore';
import { getAngularClipPath } from '../utils/achievementUtils';
import { MetricSlider } from './readiness/MetricSlider';

interface ReadinessCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inputs: ReadinessInputs, result: ReadinessResult) => void;
}

type ReadinessMetric = keyof ReadinessInputs;

interface MetricConfig {
  key: ReadinessMetric;
  label: string;
  icon: React.ReactNode;
  lowLabel: string;
  highLabel: string;
  color: string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'sleepQuality',
    label: 'SLEEP QUALITY',
    icon: <Moon className="w-5 h-5" />,
    lowLabel: 'Terrible',
    highLabel: 'Excellent',
    color: '#3b82f6', // blue-500
  },
  {
    key: 'perceivedRecovery',
    label: 'RECOVERY',
    icon: <Battery className="w-5 h-5" />,
    lowLabel: 'Exhausted',
    highLabel: 'Fresh',
    color: '#22c55e', // green-500
  },
  {
    key: 'sorenessLevel',
    label: 'SORENESS',
    icon: <Flame className="w-5 h-5" />,
    lowLabel: 'Severe',
    highLabel: 'None',
    color: '#f97316', // orange-500
  },
  {
    key: 'stressLevel',
    label: 'STRESS',
    icon: <Brain className="w-5 h-5" />,
    lowLabel: 'High',
    highLabel: 'Low',
    color: '#a855f7', // purple-500
  },
];

export function ReadinessCheckModal({ isOpen, onClose, onSubmit }: ReadinessCheckModalProps) {
  const [inputs, setInputs] = useState<ReadinessInputs>({
    sleepQuality: 3,
    perceivedRecovery: 3,
    sorenessLevel: 3,
    stressLevel: 3,
  });

  // Calculate result from inputs (no need for separate state)
  const result = useMemo(() => calculateReadinessScore(inputs), [inputs]);

  const handleInputChange = (metric: ReadinessMetric, value: number) => {
    setInputs({ ...inputs, [metric]: value });
  };

  const handleSubmit = () => {
    onSubmit(inputs, result);
    onClose();
  };

  const handleSkip = () => {
    // Use default neutral inputs
    const defaultInputs: ReadinessInputs = {
      sleepQuality: 3,
      perceivedRecovery: 3,
      sorenessLevel: 3,
      stressLevel: 3,
    };
    const defaultResult = calculateReadinessScore(defaultInputs);
    onSubmit(defaultInputs, defaultResult);
    onClose();
  };

  if (!isOpen) return null;

  const scoreColor = getReadinessColor(result.category);
  const textColorClass = getReadinessTextColor(result.category);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
      onClick={handleSkip}
      role="dialog"
      aria-modal="true"
      aria-labelledby="readiness-modal-title"
    >
      <div
        className="bg-black border-2 border-zinc-700 max-w-md w-full overflow-hidden flex flex-col relative"
        style={{
          clipPath: getAngularClipPath(16),
        }}
        onClick={(e) => e.stopPropagation()}
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
              <Zap size={20} className="text-black" fill="currentColor" />
            </div>
            <h2 id="readiness-modal-title" className="font-black italic uppercase text-white text-lg tracking-wide">Daily Check-in</h2>
          </div>
          <button
            onClick={handleSkip}
            aria-label="Skip readiness check"
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            style={{
              clipPath: getAngularClipPath(4),
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Readiness Score */}
        <div className="relative z-10 p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Readiness Score</div>
              <div className={`text-5xl font-black font-mono ${textColorClass}`}>
                {result.score}
              </div>
            </div>
            <div
              className="w-20 h-20 border-2 flex items-center justify-center"
              style={{
                borderColor: scoreColor,
                backgroundColor: `${scoreColor}15`,
                clipPath: getAngularClipPath(10),
                boxShadow: `0 0 20px ${scoreColor}30`,
              }}
            >
              {result.category === 'green' && <Battery className="w-10 h-10 text-green-500" fill="currentColor" />}
              {result.category === 'yellow' && <Battery className="w-10 h-10 text-yellow-500" />}
              {result.category === 'red' && <AlertTriangle className="w-10 h-10 text-red-500" />}
            </div>
          </div>

          {/* Recommendation */}
          <div
            className={`mt-4 p-3 border ${
              result.category === 'green' ? 'bg-green-500/10 border-green-500/30' :
              result.category === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-red-500/10 border-red-500/30'
            }`}
            style={{
              clipPath: getAngularClipPath(6),
            }}
          >
            <div className={`font-bold uppercase text-sm ${textColorClass}`}>
              {result.recommendation}
            </div>
          </div>
        </div>

        {/* Metrics Input */}
        <div className="relative z-10 p-4 space-y-4 max-h-[400px] overflow-y-auto">
          {METRICS.map((metric) => (
            <MetricSlider
              key={metric.key}
              label={metric.label}
              icon={metric.icon}
              value={inputs[metric.key]}
              onChange={(value) => handleInputChange(metric.key, value)}
              lowLabel={metric.lowLabel}
              highLabel={metric.highLabel}
              color={metric.color}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="relative z-10 p-4 border-t border-zinc-800 grid grid-cols-2 gap-2">
          <button
            onClick={handleSkip}
            className="py-3 font-bold text-sm uppercase transition-all border-2 bg-zinc-900 border-zinc-700 text-white hover:border-zinc-500"
            style={{
              clipPath: getAngularClipPath(6),
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            className="py-3 font-bold text-sm uppercase transition-all border-2 bg-primary border-primary text-black hover:shadow-neon"
            style={{
              clipPath: getAngularClipPath(6),
            }}
          >
            Start Workout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReadinessCheckModal;
