/**
 * ShareableWorkoutCard Component
 *
 * A visually striking workout summary card designed for sharing on social media.
 * Renders workout stats, XP earned, and achievements in an Instagram/TikTok-friendly format.
 */

import React, { forwardRef } from 'react';
import { WorkoutSession } from '../../types';
import { WorkoutXPResult, IRON_RANKS, getRankForXP } from '../../services/gamification';
import { EXERCISE_LIBRARY } from '../../constants';
import { formatTime } from '../../utils/formatters';

interface ShareableWorkoutCardProps {
  workout: WorkoutSession;
  xpResult?: WorkoutXPResult | null;
  userName?: string;
  totalXP?: number;
  streak?: number;
  prsHit?: number;
  variant?: 'dark' | 'neon' | 'minimal';
}

export const ShareableWorkoutCard = forwardRef<HTMLDivElement, ShareableWorkoutCardProps>(
  ({ workout, xpResult, userName = 'Athlete', totalXP = 0, streak = 0, prsHit = 0, variant = 'neon' }, ref) => {
    // Calculate workout stats
    const duration = workout.endTime && workout.startTime
      ? Math.floor((workout.endTime - workout.startTime) / 1000 / 60)
      : 0;

    const exerciseCount = workout.logs.length;

    const totalSets = workout.logs.reduce(
      (sum, log) => sum + log.sets.filter(s => s.completed).length,
      0
    );

    const totalVolume = workout.logs.reduce((total, log) => {
      return total + log.sets
        .filter(s => s.completed && s.type !== 'W')
        .reduce((sum, set) => sum + (set.weight * set.reps), 0);
    }, 0);

    // Get exercise names for display (top 3)
    const exerciseNames = workout.logs.slice(0, 3).map(log => {
      const exercise = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
      return exercise?.name || 'Exercise';
    });

    const rank = getRankForXP(totalXP);
    const workoutDate = new Date(workout.startTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Variant styles
    const variants = {
      dark: {
        bg: 'bg-black',
        border: 'border-zinc-800',
        accent: 'text-white',
        muted: 'text-zinc-500',
        highlight: 'text-[#ccff00]',
        gradientFrom: 'from-zinc-900',
        gradientTo: 'to-black',
      },
      neon: {
        bg: 'bg-black',
        border: 'border-[#ccff00]/30',
        accent: 'text-white',
        muted: 'text-zinc-400',
        highlight: 'text-[#ccff00]',
        gradientFrom: 'from-[#ccff00]/10',
        gradientTo: 'to-black',
      },
      minimal: {
        bg: 'bg-zinc-900',
        border: 'border-zinc-700',
        accent: 'text-white',
        muted: 'text-zinc-500',
        highlight: 'text-blue-400',
        gradientFrom: 'from-zinc-800',
        gradientTo: 'to-zinc-900',
      },
    };

    const style = variants[variant];

    return (
      <div
        ref={ref}
        className={`
          w-[400px] aspect-[4/5] p-6
          ${style.bg} ${style.border} border-2
          bg-gradient-to-b ${style.gradientFrom} ${style.gradientTo}
          flex flex-col justify-between
          font-sans
        `}
        style={{
          fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div>
          {/* Logo/Brand */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-[#ccff00] flex items-center justify-center`}>
                <span className="text-black font-black text-sm">V</span>
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest ${style.muted}`}>
                VoltLift
              </span>
            </div>
            <span className={`text-xs ${style.muted}`}>{workoutDate}</span>
          </div>

          {/* Workout Title */}
          <h1 className={`text-2xl font-black uppercase italic leading-tight ${style.accent} mb-2`}>
            {workout.name}
          </h1>

          {/* Exercises Preview */}
          <div className={`text-sm ${style.muted} mb-4`}>
            {exerciseNames.join(' • ')}
            {workout.logs.length > 3 && ` +${workout.logs.length - 3} more`}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatBox
            label="Duration"
            value={`${duration}`}
            unit="min"
            highlight={style.highlight}
            muted={style.muted}
          />
          <StatBox
            label="Exercises"
            value={`${exerciseCount}`}
            unit=""
            highlight={style.highlight}
            muted={style.muted}
          />
          <StatBox
            label="Sets"
            value={`${totalSets}`}
            unit="total"
            highlight={style.highlight}
            muted={style.muted}
          />
          <StatBox
            label="Volume"
            value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : `${totalVolume}`}
            unit="lbs"
            highlight={style.highlight}
            muted={style.muted}
          />
        </div>

        {/* XP & Achievements */}
        {xpResult && (
          <div className={`bg-black/50 rounded-xl p-4 mb-4 border ${style.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs uppercase font-bold ${style.muted} mb-1`}>XP Earned</div>
                <div className={`text-3xl font-black ${style.highlight}`}>+{xpResult.totalXP}</div>
              </div>
              {prsHit > 0 && (
                <div className="text-center">
                  <div className="text-3xl mb-1">🏆</div>
                  <div className={`text-xs uppercase font-bold ${style.muted}`}>
                    {prsHit} PR{prsHit > 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border ${style.border}`}>
              <span className={`font-bold ${style.accent}`}>
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className={`font-bold ${style.accent}`}>{userName}</div>
              <div className={`text-xs ${rank.color}`}>{rank.name}</div>
            </div>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-500/20 px-3 py-1.5 rounded-full">
              <span className="text-lg">🔥</span>
              <span className="text-orange-400 font-bold">{streak}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ShareableWorkoutCard.displayName = 'ShareableWorkoutCard';

// Stat Box Component
const StatBox: React.FC<{
  label: string;
  value: string;
  unit: string;
  highlight: string;
  muted: string;
}> = ({ label, value, unit, highlight, muted }) => (
  <div className="text-center">
    <div className={`text-xs uppercase font-bold ${muted} mb-1`}>{label}</div>
    <div className="flex items-baseline justify-center gap-1">
      <span className={`text-2xl font-black ${highlight}`}>{value}</span>
      {unit && <span className={`text-sm ${muted}`}>{unit}</span>}
    </div>
  </div>
);

export default ShareableWorkoutCard;
