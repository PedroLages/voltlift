/**
 * StreakDisplay Component
 *
 * Shows current workout streak with fire animation
 */

import React from 'react';
import { useStore } from '../../store/useStore';

interface StreakDisplayProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'badge';
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  size = 'md',
  showLabel = true,
  variant = 'default'
}) => {
  const streak = useStore(state => state.gamification.streak);

  const sizeClasses = {
    sm: { icon: 'text-lg', text: 'text-sm', container: 'gap-0.5' },
    md: { icon: 'text-2xl', text: 'text-base', container: 'gap-1' },
    lg: { icon: 'text-3xl', text: 'text-xl', container: 'gap-1.5' },
  };

  const classes = sizeClasses[size];

  // Determine color intensity based on streak length
  const getStreakColor = () => {
    if (streak.current === 0) return 'text-gray-500';
    if (streak.current < 3) return 'text-orange-400';
    if (streak.current < 7) return 'text-orange-500';
    if (streak.current < 14) return 'text-red-500';
    if (streak.current < 30) return 'text-red-600';
    return 'text-[#ccff00]'; // IRON MASTER color for 30+ day streaks
  };

  if (variant === 'badge') {
    return (
      <div
        className={`
          inline-flex items-center ${classes.container}
          px-2 py-1 rounded-lg
          ${streak.current > 0 ? 'bg-orange-500/20' : 'bg-zinc-800'}
        `}
      >
        <span className={`${classes.icon} ${streak.current > 0 ? 'animate-pulse' : ''}`}>
          {streak.current > 0 ? '🔥' : '❄️'}
        </span>
        <span className={`${classes.text} font-bold ${getStreakColor()}`}>
          {streak.current}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${classes.container}`}>
      <span
        className={`${classes.icon} ${streak.current >= 3 ? 'animate-pulse' : ''}`}
        style={{
          filter: streak.current >= 7 ? 'drop-shadow(0 0 4px rgba(255, 100, 0, 0.6))' : undefined
        }}
      >
        {streak.current > 0 ? '🔥' : '❄️'}
      </span>
      <div className="flex flex-col">
        <span className={`${classes.text} font-bold ${getStreakColor()}`}>
          {streak.current}
        </span>
        {showLabel && (
          <span className="text-xs text-gray-500">
            {streak.current === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>
    </div>
  );
};

export default StreakDisplay;
