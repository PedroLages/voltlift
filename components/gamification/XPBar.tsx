/**
 * XPBar Component
 *
 * Displays XP progress bar towards next level
 */

import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { IRON_RANKS, getRankForXP, getLevelProgress } from '../../services/gamification';

interface XPBarProps {
  showNumbers?: boolean;
  compact?: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({
  showNumbers = true,
  compact = false
}) => {
  const totalXP = useStore(state => state.gamification.totalXP);
  const xpToNextLevel = useStore(state => state.gamification.xpToNextLevel);
  const rank = useMemo(() => getRankForXP(totalXP), [totalXP]);
  const progress = useMemo(() => getLevelProgress(totalXP), [totalXP]);
  const xpToNext = xpToNextLevel;

  const isMaxLevel = rank.level === IRON_RANKS.length;
  const barHeight = compact ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      {showNumbers && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400 font-medium">
            {totalXP.toLocaleString()} XP
          </span>
          <span className="text-xs text-gray-500">
            {isMaxLevel
              ? 'MAX LEVEL'
              : `${xpToNext.toLocaleString()} to next`}
          </span>
        </div>
      )}

      <div className={`w-full bg-zinc-800 rounded-full ${barHeight} overflow-hidden`}>
        <div
          className={`${barHeight} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${progress}%`,
            backgroundColor: isMaxLevel ? '#ccff00' : '#3b82f6',
            boxShadow: isMaxLevel
              ? '0 0 10px rgba(204, 255, 0, 0.5)'
              : '0 0 6px rgba(59, 130, 246, 0.5)',
          }}
        />
      </div>

      {!compact && (
        <div className="flex justify-between items-center mt-1">
          <span className={`text-xs font-bold ${rank.color}`}>
            {rank.name}
          </span>
          {!isMaxLevel && rank.level < IRON_RANKS.length && (
            <span className={`text-xs ${IRON_RANKS[rank.level].color}`}>
              {IRON_RANKS[rank.level].name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default XPBar;
