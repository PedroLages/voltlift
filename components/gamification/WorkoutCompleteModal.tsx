/**
 * WorkoutCompleteModal Component
 *
 * Industrial celebration modal after completing a workout
 * Features: dramatic entrance, scan lines, lightning accents, shake effect
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Share2, Zap, Trophy, Target, Flame } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { IRON_RANKS, getRankForXP } from '../../services/gamification';
import { WorkoutSession } from '../../types';
import XPBar from './XPBar';
import { StreakDisplay } from './StreakDisplay';
import { ShareModal } from '../share';

interface WorkoutCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout?: WorkoutSession | null;
}

export const WorkoutCompleteModal: React.FC<WorkoutCompleteModalProps> = ({
  isOpen,
  onClose,
  workout
}) => {
  const lastWorkoutXP = useStore(state => state.lastWorkoutXP);
  const lastAchievements = useStore(state => state.lastAchievements);
  const lastLevelUp = useStore(state => state.lastLevelUp);
  const totalXP = useStore(state => state.gamification.totalXP);
  const streakCurrent = useStore(state => state.gamification.streak.current);
  const clearLastWorkoutRewards = useStore(state => state.clearLastWorkoutRewards);
  const settings = useStore(state => state.settings);
  const rank = useMemo(() => getRankForXP(totalXP), [totalXP]);

  const [showXP, setShowXP] = useState(false);
  const [showBonuses, setShowBonuses] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shakeEffect, setShakeEffect] = useState(false);

  // Count PRs hit for share card
  const prsHit = lastWorkoutXP?.bonuses.filter(b => b.name.includes('PR')).length || 0;

  // Staggered animation reveals with shake for PRs
  useEffect(() => {
    if (isOpen) {
      const timers = [
        setTimeout(() => setShowXP(true), 300),
        setTimeout(() => setShowBonuses(true), 800),
        setTimeout(() => setShowAchievements(true), 1200),
        setTimeout(() => setShowLevelUp(true), 1600),
      ];
      // Shake effect if PRs were hit
      if (prsHit > 0) {
        timers.push(setTimeout(() => setShakeEffect(true), 400));
        timers.push(setTimeout(() => setShakeEffect(false), 900));
      }
      return () => timers.forEach(clearTimeout);
    } else {
      setShowXP(false);
      setShowBonuses(false);
      setShowAchievements(false);
      setShowLevelUp(false);
      setShakeEffect(false);
    }
  }, [isOpen, prsHit]);

  const handleClose = () => {
    clearLastWorkoutRewards();
    onClose();
  };

  if (!isOpen || !lastWorkoutXP) return null;

  // Get rank color for styling
  const getRankColor = () => {
    if (rank.color.startsWith('text-[')) {
      return rank.color.match(/#[0-9a-fA-F]+/)?.[0] || '#ccff00';
    }
    return '#ccff00';
  };

  const rankColor = getRankColor();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div
        className={`
          bg-black border-2 border-primary p-6 mx-4 max-w-sm w-full
          shadow-neon-strong relative overflow-hidden
          animate-scale-in
          ${shakeEffect ? 'animate-shake' : ''}
        `}
        style={{
          clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Scan Lines Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(204, 255, 0, 0.1) 2px,
              rgba(204, 255, 0, 0.1) 4px
            )`,
          }}
        />

        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-primary" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-primary" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-primary" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-primary" />

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="flex justify-center mb-3">
            {lastLevelUp ? (
              <div className="relative">
                <Zap size={48} className="text-primary" fill="currentColor" />
                <div className="absolute inset-0 animate-pulse-glow" />
              </div>
            ) : prsHit > 0 ? (
              <Trophy size={48} className="text-yellow-400" />
            ) : (
              <Target size={48} className="text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-black italic uppercase text-white tracking-wider">
            {lastLevelUp ? 'RANK UP!' : prsHit > 0 ? 'RECORDS SMASHED!' : 'MISSION COMPLETE'}
          </h2>
          {lastLevelUp && (
            <p
              className="text-lg font-black italic mt-1"
              style={{ color: rankColor }}
            >
              Welcome to {rank.name}
            </p>
          )}
        </div>

        {/* XP Earned */}
        <div
          className={`
            transition-all duration-500 ease-out relative z-10
            ${showXP ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 p-4 mb-4"
            style={{
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary" fill="currentColor" />
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  XP EARNED
                </span>
              </div>
              <span className="text-3xl font-black font-mono text-primary">
                +{lastWorkoutXP.totalXP}
              </span>
            </div>

            {/* Base XP */}
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zinc-600 font-mono">BASE</span>
              <span className="text-zinc-400 font-mono">+{lastWorkoutXP.baseXP}</span>
            </div>

            {/* Bonuses */}
            {showBonuses && lastWorkoutXP.bonuses.length > 0 && (
              <div className="space-y-1 mt-3 pt-3 border-t border-zinc-800">
                {lastWorkoutXP.bonuses.map((bonus, i) => (
                  <div
                    key={i}
                    className={`
                      flex justify-between text-sm
                      transition-all duration-300
                      ${showBonuses ? 'opacity-100' : 'opacity-0'}
                    `}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <span className="text-primary font-bold uppercase text-xs">
                      {bonus.name}
                    </span>
                    <span className="text-primary font-mono font-bold">
                      +{bonus.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        {showAchievements && lastAchievements.length > 0 && (
          <div
            className={`
              transition-all duration-500 ease-out mb-4 relative z-10
              ${showAchievements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={14} className="text-yellow-500" />
              <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">
                Achievements Unlocked
              </span>
            </div>
            <div className="space-y-2">
              {lastAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-zinc-900 border-l-2 border-yellow-500 p-3"
                  style={{
                    boxShadow: 'inset 3px 0 10px rgba(234, 179, 8, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Trophy size={24} className="text-yellow-500" />
                    <div className="flex-1">
                      <div className="font-black italic uppercase text-yellow-400 text-sm">
                        {achievement.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {achievement.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-primary font-black font-mono">
                        +{achievement.xpReward}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4 relative z-10">
          <XPBar showNumbers />
        </div>

        {/* Streak */}
        <div className="flex justify-center mb-6 relative z-10">
          <StreakDisplay size="md" variant="badge" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 relative z-10">
          {/* Share Button */}
          {workout && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 py-3 bg-zinc-900 border border-zinc-700 text-white font-black italic uppercase tracking-wider hover:bg-zinc-800 hover:border-primary transition-all flex items-center justify-center gap-2"
              style={{
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              }}
            >
              <Share2 size={18} />
              SHARE
            </button>
          )}

          {/* Continue Button */}
          <button
            onClick={handleClose}
            className={`
              ${workout ? 'flex-1' : 'w-full'}
              py-3 bg-primary text-black font-black italic uppercase tracking-wider
              hover:shadow-neon-strong transition-all
            `}
            style={{
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
          >
            CONTINUE
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {workout && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          workout={workout}
          xpResult={lastWorkoutXP}
          userName={settings.name}
          totalXP={totalXP}
          streak={streakCurrent}
          prsHit={prsHit}
        />
      )}
    </div>
  );
};

export default WorkoutCompleteModal;
