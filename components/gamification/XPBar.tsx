/**
 * XPBar Component
 *
 * Industrial power cell progress bar showing XP towards next level
 * Features: segmented cells, pulse effect, neon glow
 */

import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { IRON_RANKS, getRankForXP, getLevelProgress } from '../../services/gamification';
import { getRankHexColor } from '../../utils/rankColors';

interface XPBarProps {
  showNumbers?: boolean;
  compact?: boolean;
  cells?: number;
}

export const XPBar: React.FC<XPBarProps> = ({
  showNumbers = true,
  compact = false,
  cells = 10
}) => {
  const totalXP = useStore(state => state.gamification.totalXP);
  const xpToNextLevel = useStore(state => state.gamification.xpToNextLevel);
  const rank = useMemo(() => getRankForXP(totalXP), [totalXP]);
  const progress = useMemo(() => getLevelProgress(totalXP), [totalXP]);
  const xpToNext = xpToNextLevel;

  const isMaxLevel = rank.level === IRON_RANKS.length;
  const barHeight = compact ? 'h-3' : 'h-4';

  // Calculate filled cells (memoized for performance)
  const filledCells = useMemo(() => Math.floor((progress / 100) * cells), [progress, cells]);
  const partialFill = useMemo(() => ((progress / 100) * cells) % 1, [progress, cells]);

  // Get color based on rank using utility
  const barColor = useMemo(() => {
    if (isMaxLevel) return '#ccff00';
    return getRankHexColor(rank.color);
  }, [isMaxLevel, rank.color]);

  return (
    <div className="w-full">
      {showNumbers && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-primary" fill="currentColor" />
            <span className="text-xs text-white font-mono font-bold">
              {totalXP.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-600 font-mono">XP</span>
          </div>
          <span className="text-xs text-zinc-500 font-mono uppercase">
            {isMaxLevel
              ? 'MAXED'
              : `${xpToNext.toLocaleString()} TO RANK UP`}
          </span>
        </div>
      )}

      {/* Power Cell Container */}
      <div
        className={`w-full bg-zinc-900 border border-zinc-800 ${barHeight} flex gap-0.5 p-0.5`}
        style={{
          clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
        }}
      >
        {Array.from({ length: cells }).map((_, i) => {
          const isFilled = i < filledCells;
          const isPartial = i === filledCells && partialFill > 0;
          const isLast = i === filledCells - 1 || (i === filledCells && partialFill > 0);

          return (
            <div
              key={i}
              className={`
                flex-1 relative overflow-hidden
                transition-all duration-300
                ${isFilled || isPartial ? '' : 'bg-zinc-800/50'}
              `}
              style={{
                background: isFilled
                  ? barColor
                  : isPartial
                    ? `linear-gradient(to right, ${barColor} ${partialFill * 100}%, transparent ${partialFill * 100}%)`
                    : undefined,
                boxShadow: (isFilled || isPartial) ? `0 0 8px ${barColor}60` : undefined,
              }}
            >
              {/* Diagonal stripe pattern for filled cells */}
              {isFilled && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `repeating-linear-gradient(
                      -45deg,
                      transparent,
                      transparent 2px,
                      rgba(0,0,0,0.3) 2px,
                      rgba(0,0,0,0.3) 4px
                    )`,
                  }}
                />
              )}

              {/* Pulse effect on the leading edge - optimized with will-change */}
              {isLast && (
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 animate-pulse"
                  style={{
                    backgroundColor: barColor,
                    willChange: 'opacity'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black italic uppercase"
              style={{ color: barColor }}
            >
              {rank.name}
            </span>
            <span className="text-[10px] text-zinc-600 font-mono">
              LV.{rank.level.toString().padStart(2, '0')}
            </span>
          </div>
          {!isMaxLevel && rank.level < IRON_RANKS.length && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-600">NEXT:</span>
              <span
                className="text-xs font-bold italic uppercase"
                style={{
                  color: getRankHexColor(IRON_RANKS[rank.level].color)
                }}
              >
                {IRON_RANKS[rank.level].name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default XPBar;
