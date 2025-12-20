/**
 * ShareableWorkoutCard Component
 *
 * Industrial workout summary card for social media sharing
 * Optimized for html2canvas rendering - NO clipPath, simplified layout
 */

import React, { forwardRef } from 'react';
import { Zap, Trophy, Clock, Dumbbell, Target, Flame } from 'lucide-react';
import { WorkoutSession } from '../../types';
import { WorkoutXPResult, getRankForXP } from '../../services/gamification';
import { EXERCISE_LIBRARY } from '../../constants';

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

    // Get rank color as hex
    const getRankHex = () => {
      if (rank.color.startsWith('text-[')) {
        return rank.color.match(/#[0-9a-fA-F]+/)?.[0] || '#ccff00';
      }
      const colorMap: Record<string, string> = {
        'text-zinc-400': '#a1a1aa',
        'text-amber-500': '#f59e0b',
        'text-orange-500': '#f97316',
        'text-red-500': '#ef4444',
        'text-purple-500': '#a855f7',
      };
      return colorMap[rank.color] || '#ccff00';
    };

    const rankHex = getRankHex();

    // Variant styles
    const variants = {
      dark: {
        bg: '#000000',
        border: '#27272a',
        accent: '#ffffff',
        muted: '#71717a',
        highlight: '#ccff00',
      },
      neon: {
        bg: '#000000',
        border: '#ccff00',
        accent: '#ffffff',
        muted: '#a1a1aa',
        highlight: '#ccff00',
      },
      minimal: {
        bg: '#18181b',
        border: '#3f3f46',
        accent: '#ffffff',
        muted: '#71717a',
        highlight: '#60a5fa',
      },
    };

    const colors = variants[variant];

    return (
      <div
        ref={ref}
        style={{
          width: '500px',
          height: '600px',
          backgroundColor: colors.bg,
          border: `3px solid ${colors.border}`,
          fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
          position: 'relative',
          padding: '32px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          {/* Logo/Brand Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                backgroundColor: colors.highlight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ color: '#000', fontWeight: 900, fontSize: 16 }}>V</span>
              </div>
              <span style={{ color: colors.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                VOLTLIFT
              </span>
            </div>
            <span style={{ color: colors.muted, fontSize: 11, fontFamily: 'monospace' }}>{workoutDate}</span>
          </div>

          {/* Workout Title */}
          <div style={{
            fontSize: 32,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            color: colors.accent,
            lineHeight: 1.2,
            marginBottom: 12,
            wordBreak: 'break-word',
          }}>
            {workout.name}
          </div>

          {/* Exercises Preview */}
          <div style={{ color: colors.muted, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.4 }}>
            {exerciseNames.join(' // ')}
            {workout.logs.length > 3 && ` +${workout.logs.length - 3}`}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginBottom: 20,
        }}>
          <StatBox icon={<Clock size={16} color={colors.highlight} />} label="DURATION" value={`${duration}`} unit="MIN" colors={colors} />
          <StatBox icon={<Dumbbell size={16} color={colors.highlight} />} label="EXERCISES" value={`${exerciseCount}`} unit="" colors={colors} />
          <StatBox icon={<Target size={16} color={colors.highlight} />} label="SETS" value={`${totalSets}`} unit="TOTAL" colors={colors} />
          <StatBox
            icon={<Zap size={16} color={colors.highlight} />}
            label="VOLUME"
            value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}K` : `${totalVolume}`}
            unit="LBS"
            colors={colors}
          />
        </div>

        {/* XP & PRs Section */}
        {xpResult && (
          <div style={{
            backgroundColor: `${colors.highlight}15`,
            border: `2px solid ${colors.highlight}`,
            padding: 20,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Zap size={14} color={colors.highlight} fill={colors.highlight} />
                  <span style={{ color: colors.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>XP EARNED</span>
                </div>
                <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'monospace', color: colors.highlight, lineHeight: 1 }}>
                  +{xpResult.totalXP}
                </div>
              </div>
              {prsHit > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <Trophy size={36} color="#facc15" />
                  <div style={{ color: '#facc15', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginTop: 6 }}>
                    {prsHit} PR{prsHit > 1 ? 'S' : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div style={{ height: 20 }} />

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'absolute',
          bottom: 32,
          left: 32,
          right: 32,
        }}>
          {/* User Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              backgroundColor: '#27272a',
              border: `3px solid ${rankHex}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: colors.accent, fontWeight: 700, fontSize: 18 }}>
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div style={{ color: colors.accent, fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{userName}</div>
              <div style={{ color: rankHex, fontSize: 12, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                {rank.name}
              </div>
            </div>
          </div>

          {/* Streak Badge */}
          {streak > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#f9731630',
              border: '2px solid #f97316',
              padding: '8px 14px',
            }}>
              <Flame size={20} color="#f97316" fill="#f97316" />
              <span style={{ color: '#f97316', fontWeight: 900, fontFamily: 'monospace', fontSize: 18 }}>{streak}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ShareableWorkoutCard.displayName = 'ShareableWorkoutCard';

// Stat Box Component - html2canvas friendly (NO clipPath)
const StatBox: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  colors: { bg: string; border: string; accent: string; muted: string; highlight: string };
}> = ({ icon, label, value, unit, colors }) => (
  <div style={{
    backgroundColor: `${colors.highlight}10`,
    border: `2px solid ${colors.border}`,
    padding: 14,
    boxSizing: 'border-box',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      {icon}
      <span style={{ color: colors.muted, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: colors.highlight, lineHeight: 1 }}>{value}</span>
      {unit && <span style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>{unit}</span>}
    </div>
  </div>
);

export default ShareableWorkoutCard;
