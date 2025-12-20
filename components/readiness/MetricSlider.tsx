/**
 * MetricSlider Component
 *
 * Reusable 1-5 scale slider for readiness metrics
 * Used in daily wellness check-ins
 */

import React from 'react';
import { getAngularClipPath } from '../../utils/achievementUtils';

interface MetricSliderProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  color: string;
}

export function MetricSlider({
  label,
  icon,
  value,
  onChange,
  lowLabel,
  highLabel,
  color,
}: MetricSliderProps) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div style={{ color }}>{icon}</div>
          <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
            {label}
          </span>
        </div>
        <div
          className="px-2 py-1 bg-zinc-900 border border-zinc-700"
          style={{
            clipPath: getAngularClipPath(3),
          }}
        >
          <span className="text-white font-black font-mono">{value}</span>
        </div>
      </div>

      {/* 1-5 Scale Buttons */}
      <div className="grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5].map((scaleValue) => (
          <button
            key={scaleValue}
            onClick={() => onChange(scaleValue)}
            className={`
              h-10 border-2 transition-all font-bold text-sm
              ${value === scaleValue
                ? 'text-black'
                : 'bg-transparent text-zinc-600 border-zinc-700 hover:border-zinc-500'
              }
            `}
            style={{
              backgroundColor: value === scaleValue ? color : undefined,
              borderColor: value === scaleValue ? color : undefined,
              clipPath: getAngularClipPath(4),
              boxShadow: value === scaleValue ? `0 0 10px ${color}40` : undefined,
            }}
            aria-label={`Set ${label} to ${scaleValue}`}
          >
            {scaleValue}
          </button>
        ))}
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-[10px] text-zinc-600 uppercase px-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export default MetricSlider;
