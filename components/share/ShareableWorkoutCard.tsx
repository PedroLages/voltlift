/**
 * ShareableWorkoutCard Component
 *
 * Industrial workout summary card for social media sharing
 * Features: scan lines, corner brackets, angular stats, no emojis
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
          width: '400px',
          height: '500px',
          backgroundColor: colors.bg,
          border: `2px solid ${colors.border}`,
          fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))',
          boxShadow: variant === 'neon' ? `0 0 30px ${colors.highlight}30` : undefined,
        }}
      >
        {/* Scan Lines Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.05,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              ${colors.highlight}20 2px,
              ${colors.highlight}20 4px
            )`,
          }}
        />

        {/* Corner Brackets */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderLeft: `2px solid ${colors.highlight}`, borderTop: `2px solid ${colors.highlight}` }} />
        <div style={{ position: 'absolute', top: 0, right: 24, width: 20, height: 20, borderRight: `2px solid ${colors.highlight}`, borderTop: `2px solid ${colors.highlight}` }} />
        <div style={{ position: 'absolute', bottom: 24, left: 0, width: 20, height: 20, borderLeft: `2px solid ${colors.highlight}`, borderBottom: `2px solid ${colors.highlight}` }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRight: `2px solid ${colors.highlight}`, borderBottom: `2px solid ${colors.highlight}` }} />

        {/* Header */}
        <div style={{ marginBottom: 16, position: 'relative', zIndex: 1 }}>
          {/* Logo/Brand */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32,
                height: 32,
                backgroundColor: colors.highlight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              }}>
                <span style={{ color: '#000', fontWeight: 900, fontSize: 14 }}>V</span>
              </div>
              <span style={{ color: colors.muted, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                VOLTLIFT
              </span>
            </div>
            <span style={{ color: colors.muted, fontSize: 10, fontFamily: 'monospace' }}>{workoutDate}</span>
          </div>

          {/* Workout Title */}
          <h1 style={{
            fontSize: 28,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            color: colors.accent,
            lineHeight: 1.1,
            marginBottom: 8,
          }}>
            {workout.name}
          </h1>

          {/* Exercises Preview */}
          <div style={{ color: colors.muted, fontSize: 12, fontFamily: 'monospace' }}>
            {exerciseNames.join(' // ')}
            {workout.logs.length > 3 && ` +${workout.logs.length - 3}`}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
          position: 'relative',
          zIndex: 1,
        }}>
          <StatBox icon={<Clock size={14} color={colors.highlight} />} label="DURATION" value={`${duration}`} unit="MIN" colors={colors} />
          <StatBox icon={<Dumbbell size={14} color={colors.highlight} />} label="EXERCISES" value={`${exerciseCount}`} unit="" colors={colors} />
          <StatBox icon={<Target size={14} color={colors.highlight} />} label="SETS" value={`${totalSets}`} unit="TOTAL" colors={colors} />
          <StatBox
            icon={<Zap size={14} color={colors.highlight} />}
            label="VOLUME"
            value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}K` : `${totalVolume}`}
            unit="LBS"
            colors={colors}
          />
        </div>

        {/* XP & PRs Section */}
        {xpResult && (
          <div style={{
            backgroundColor: `${colors.highlight}10`,
            border: `1px solid ${colors.highlight}40`,
            padding: 16,
            marginBottom: 16,
            position: 'relative',
            zIndex: 1,
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Zap size={12} color={colors.highlight} fill={colors.highlight} />
                  <span style={{ color: colors.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>XP EARNED</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: colors.highlight }}>
                  +{xpResult.totalXP}
                </div>
              </div>
              {prsHit > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <Trophy size={32} color="#facc15" />
                  <div style={{ color: colors.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>
                    {prsHit} PR{prsHit > 1 ? 'S' : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {/* User Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              backgroundColor: '#27272a',
              border: `2px solid ${rankHex}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
            }}>
              <span style={{ color: colors.accent, fontWeight: 700, fontSize: 16 }}>
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div style={{ color: colors.accent, fontWeight: 700, fontSize: 14 }}>{userName}</div>
              <div style={{ color: rankHex, fontSize: 11, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                {rank.name}
              </div>
            </div>
          </div>

          {/* Streak Badge */}
          {streak > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#f9731620',
              border: '1px solid #f9731650',
              padding: '6px 12px',
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
            }}>
              <Flame size={18} color="#f97316" fill="#f97316" />
              <span style={{ color: '#f97316', fontWeight: 900, fontFamily: 'monospace', fontSize: 16 }}>{streak}</span>
            </div>
          )}
        </div>

        {/* Verified Stamp */}
        <div style={{
          position: 'absolute',
          bottom: 80,
          right: 24,
          opacity: 0.15,
          transform: 'rotate(-15deg)',
        }}>
          <div style={{
            border: `2px solid ${colors.highlight}`,
            padding: '4px 12px',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: '0.15em',
            color: colors.highlight,
            textTransform: 'uppercase',
          }}>
            VERIFIED
          </div>
        </div>
      </div>
    );
  }
);

ShareableWorkoutCard.displayName = 'ShareableWorkoutCard';

// Stat Box Component with industrial styling
const StatBox: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  colors: { bg: string; border: string; accent: string; muted: string; highlight: string };
}> = ({ icon, label, value, unit, colors }) => (
  <div style={{
    backgroundColor: `${colors.highlight}08`,
    border: `1px solid ${colors.border}`,
    padding: 12,
    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
      {icon}
      <span style={{ color: colors.muted, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: colors.highlight }}>{value}</span>
      {unit && <span style={{ fontSize: 10, color: colors.muted, textTransform: 'uppercase' }}>{unit}</span>}
    </div>
  </div>
);

export default ShareableWorkoutCard;
