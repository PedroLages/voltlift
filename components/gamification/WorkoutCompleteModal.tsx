/**
 * WorkoutCompleteModal Component
 *
 * Celebratory modal shown after completing a workout
 * Displays XP earned, achievements unlocked, and level ups
 * Includes share functionality for social media
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Share2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { IRON_RANKS, getRankForXP } from '../../services/gamification';
import { WorkoutSession } from '../../types';
import XPBar from './XPBar';
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

  // Count PRs hit for share card
  const prsHit = lastWorkoutXP?.bonuses.filter(b => b.name.includes('PR')).length || 0;

  // Staggered animation reveals
  useEffect(() => {
    if (isOpen) {
      const timers = [
        setTimeout(() => setShowXP(true), 300),
        setTimeout(() => setShowBonuses(true), 800),
        setTimeout(() => setShowAchievements(true), 1200),
        setTimeout(() => setShowLevelUp(true), 1600),
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setShowXP(false);
      setShowBonuses(false);
      setShowAchievements(false);
      setShowLevelUp(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    clearLastWorkoutRewards();
    onClose();
  };

  if (!isOpen || !lastWorkoutXP) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl p-6 mx-4 max-w-sm w-full border border-zinc-800 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">
            {lastLevelUp ? '🎉' : '💪'}
          </div>
          <h2 className="text-xl font-black uppercase text-white">
            {lastLevelUp ? 'LEVEL UP!' : 'WORKOUT COMPLETE'}
          </h2>
          {lastLevelUp && (
            <p className={`text-lg font-bold mt-1 ${rank.color}`}>
              Welcome to {rank.name}!
            </p>
          )}
        </div>

        {/* XP Earned */}
        <div
          className={`
            transition-all duration-500 ease-out
            ${showXP ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <div className="bg-zinc-800 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 text-sm font-medium">XP EARNED</span>
              <span className="text-2xl font-black text-[#ccff00]">
                +{lastWorkoutXP.totalXP}
              </span>
            </div>

            {/* Base XP */}
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Base Workout</span>
              <span className="text-gray-300">+{lastWorkoutXP.baseXP}</span>
            </div>

            {/* Bonuses */}
            {showBonuses && lastWorkoutXP.bonuses.length > 0 && (
              <div className="space-y-1 mt-2 pt-2 border-t border-zinc-700">
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
                    <span className="text-blue-400">{bonus.name}</span>
                    <span className="text-blue-300 font-medium">+{bonus.amount}</span>
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
              transition-all duration-500 ease-out mb-4
              ${showAchievements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">
              Achievements Unlocked
            </h3>
            <div className="space-y-2">
              {lastAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-3 border border-yellow-600/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-yellow-400 text-sm">
                        {achievement.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {achievement.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#ccff00] font-bold text-sm">
                        +{achievement.xpReward}
                      </div>
                      <div className="text-xs text-gray-500">XP</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <XPBar showNumbers />
        </div>

        {/* Streak */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <span className="text-2xl">🔥</span>
          <span className="text-lg font-bold text-orange-400">
            {streakCurrent} Day Streak
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* Share Button */}
          {workout && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-xl uppercase tracking-wider hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={18} />
              Share
            </button>
          )}

          {/* Continue Button */}
          <button
            onClick={handleClose}
            className={`${workout ? 'flex-1' : 'w-full'} py-3 bg-[#ccff00] text-black font-bold rounded-xl uppercase tracking-wider hover:bg-[#b8e600] transition-colors`}
          >
            Continue
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
