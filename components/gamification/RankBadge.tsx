/**
 * RankBadge Component
 *
 * Displays the user's current Iron Rank with color-coded badge
 */

import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { getRankForXP } from '../../services/gamification';

interface RankBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showLevel?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  size = 'md',
  showName = true,
  showLevel = false
}) => {
  const totalXP = useStore(state => state.gamification.totalXP);
  const rank = useMemo(() => getRankForXP(totalXP), [totalXP]);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  // Get the appropriate Tailwind color class
  const getColorStyle = () => {
    // Handle custom colors (like #ccff00 for IRON MASTER)
    if (rank.color.startsWith('text-[')) {
      const hex = rank.color.match(/#[0-9a-fA-F]+/)?.[0] || '#ccff00';
      return { color: hex, borderColor: hex };
    }
    return {};
  };

  const colorClasses = rank.color.startsWith('text-[') ? '' : rank.color;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        font-bold uppercase tracking-wider
        bg-zinc-900 border rounded-md
        ${sizeClasses[size]}
        ${colorClasses}
        ${rank.color.startsWith('text-[') ? '' : 'border-current'}
      `}
      style={getColorStyle()}
    >
      {showLevel && (
        <span className="opacity-70">LV{rank.level}</span>
      )}
      {showName && (
        <span>{rank.name}</span>
      )}
    </div>
  );
};

export default RankBadge;
