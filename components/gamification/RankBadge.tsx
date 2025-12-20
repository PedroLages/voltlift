/**
 * RankBadge Component
 *
 * Displays the user's current Iron Rank with industrial angular design
 * Features: cut corners, neon glow, chevron accent
 */

import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getRankForXP } from '../../services/gamification';

interface RankBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showLevel?: boolean;
  showGlow?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  size = 'md',
  showName = true,
  showLevel = false,
  showGlow = true
}) => {
  const totalXP = useStore(state => state.gamification.totalXP);
  const rank = useMemo(() => getRankForXP(totalXP), [totalXP]);

  const sizeConfig = {
    sm: {
      container: 'text-xs px-2 py-0.5 gap-1',
      chevron: 10,
      cut: 6
    },
    md: {
      container: 'text-sm px-3 py-1 gap-1.5',
      chevron: 12,
      cut: 8
    },
    lg: {
      container: 'text-base px-4 py-1.5 gap-2',
      chevron: 14,
      cut: 10
    },
  };

  const config = sizeConfig[size];

  // Extract hex color for glow effect
  const getHexColor = () => {
    if (rank.color.startsWith('text-[')) {
      return rank.color.match(/#[0-9a-fA-F]+/)?.[0] || '#ccff00';
    }
    // Map Tailwind color classes to hex
    const colorMap: Record<string, string> = {
      'text-zinc-400': '#a1a1aa',
      'text-zinc-300': '#d4d4d8',
      'text-amber-400': '#fbbf24',
      'text-amber-500': '#f59e0b',
      'text-orange-400': '#fb923c',
      'text-orange-500': '#f97316',
      'text-red-400': '#f87171',
      'text-red-500': '#ef4444',
      'text-purple-400': '#c084fc',
      'text-purple-500': '#a855f7',
    };
    return colorMap[rank.color] || '#ccff00';
  };

  const hexColor = getHexColor();
  const colorClasses = rank.color.startsWith('text-[') ? '' : rank.color;

  return (
    <div
      className={`
        inline-flex items-center
        font-black uppercase tracking-wider
        bg-black border-2
        ${config.container}
        ${colorClasses}
        transition-all duration-200
      `}
      style={{
        color: rank.color.startsWith('text-[') ? hexColor : undefined,
        borderColor: hexColor,
        clipPath: `polygon(0 0, calc(100% - ${config.cut}px) 0, 100% ${config.cut}px, 100% 100%, 0 100%)`,
        boxShadow: showGlow ? `0 0 15px ${hexColor}40, inset 0 0 10px ${hexColor}10` : undefined,
      }}
    >
      {/* Power chevron accent */}
      <ChevronRight
        size={config.chevron}
        className="opacity-60"
        strokeWidth={3}
      />

      {showLevel && (
        <span className="font-mono opacity-70">
          {rank.level.toString().padStart(2, '0')}
        </span>
      )}

      {showName && (
        <span className="font-black italic">{rank.name}</span>
      )}
    </div>
  );
};

export default RankBadge;
