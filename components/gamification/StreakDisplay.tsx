/**
 * StreakDisplay Component
 *
 * Industrial streak counter with custom flame icon
 * Features: SVG flame, animated glow, angular badge, chain text
 */

import React from 'react';
import { Flame, Snowflake } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface StreakDisplayProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'badge' | 'compact';
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  size = 'md',
  showLabel = true,
  variant = 'default'
}) => {
  const streak = useStore(state => state.gamification.streak);

  const sizeConfig = {
    sm: { icon: 14, text: 'text-sm', number: 'text-lg', container: 'gap-1', cut: 4 },
    md: { icon: 18, text: 'text-base', number: 'text-xl', container: 'gap-1.5', cut: 6 },
    lg: { icon: 24, text: 'text-lg', number: 'text-2xl', container: 'gap-2', cut: 8 },
  };

  const config = sizeConfig[size];

  // Determine color and intensity based on streak length
  const getStreakStyle = () => {
    if (streak.current === 0) return { color: '#71717a', glow: false, intensity: 0 };
    if (streak.current < 3) return { color: '#fb923c', glow: false, intensity: 1 };
    if (streak.current < 7) return { color: '#f97316', glow: true, intensity: 2 };
    if (streak.current < 14) return { color: '#ef4444', glow: true, intensity: 3 };
    if (streak.current < 30) return { color: '#dc2626', glow: true, intensity: 4 };
    return { color: '#ccff00', glow: true, intensity: 5 }; // LEGENDARY
  };

  const style = getStreakStyle();

  // Get status text for longer streaks
  const getStatusText = () => {
    if (streak.current === 0) return 'DORMANT';
    if (streak.current < 3) return 'WARMING UP';
    if (streak.current < 7) return 'BUILDING';
    if (streak.current < 14) return 'CHAIN UNBROKEN';
    if (streak.current < 30) return 'UNSTOPPABLE';
    return 'LEGENDARY';
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        {streak.current > 0 ? (
          <Flame
            size={config.icon}
            style={{ color: style.color }}
            fill={style.intensity >= 2 ? style.color : 'none'}
          />
        ) : (
          <Snowflake size={config.icon} className="text-zinc-600" />
        )}
        <span
          className={`${config.number} font-black font-mono`}
          style={{ color: style.color }}
        >
          {streak.current}
        </span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={`
          inline-flex items-center ${config.container}
          px-3 py-1.5 border-2
        `}
        style={{
          borderColor: style.color,
          backgroundColor: `${style.color}15`,
          clipPath: `polygon(0 0, calc(100% - ${config.cut}px) 0, 100% ${config.cut}px, 100% 100%, ${config.cut}px 100%, 0 calc(100% - ${config.cut}px))`,
          boxShadow: style.glow ? `0 0 15px ${style.color}40, inset 0 0 10px ${style.color}10` : undefined,
        }}
      >
        {streak.current > 0 ? (
          <Flame
            size={config.icon}
            style={{ color: style.color }}
            fill={style.intensity >= 2 ? style.color : 'none'}
            className={style.intensity >= 3 ? 'animate-pulse' : ''}
          />
        ) : (
          <Snowflake size={config.icon} className="text-zinc-600" />
        )}
        <span
          className={`${config.number} font-black font-mono`}
          style={{ color: style.color }}
        >
          {streak.current}
        </span>
      </div>
    );
  }

  // Default variant - full display
  return (
    <div
      className={`
        flex items-center ${config.container}
        px-4 py-2 border-l-2 bg-zinc-900/50
      `}
      style={{
        borderColor: style.color,
        boxShadow: style.glow ? `inset 3px 0 10px ${style.color}20` : undefined,
      }}
    >
      {/* Flame Icon with Glow */}
      <div
        className="relative"
        style={{
          filter: style.glow ? `drop-shadow(0 0 6px ${style.color})` : undefined,
        }}
      >
        {streak.current > 0 ? (
          <Flame
            size={config.icon + 4}
            style={{ color: style.color }}
            fill={style.intensity >= 2 ? style.color : 'none'}
            className={style.intensity >= 3 ? 'animate-pulse' : ''}
          />
        ) : (
          <Snowflake size={config.icon + 4} className="text-zinc-600" />
        )}
      </div>

      {/* Text Content */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span
            className={`${config.number} font-black font-mono leading-none`}
            style={{ color: style.color }}
          >
            {streak.current}
          </span>
          {showLabel && (
            <span className="text-xs text-zinc-500 font-mono uppercase">
              {streak.current === 1 ? 'DAY' : 'DAYS'}
            </span>
          )}
        </div>
        {style.intensity >= 2 && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: style.color }}
          >
            {getStatusText()}
          </span>
        )}
      </div>
    </div>
  );
};

export default StreakDisplay;
