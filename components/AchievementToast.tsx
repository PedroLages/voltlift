/**
 * AchievementToast Component
 *
 * Quick notification banner for achievement unlocks
 * Appears at top of screen with tier-based styling
 */

import React, { useEffect } from 'react';
import { Trophy, Zap, X } from 'lucide-react';
import { Achievement } from '../types';
import { getTierColor } from '../utils/achievementUtils';
import { useNavigate } from 'react-router-dom';

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
  duration?: number;
}

/**
 * Toast notification for achievement unlocks
 * Shows briefly at top of screen, then auto-dismisses
 *
 * Usage:
 * ```tsx
 * <AchievementToast
 *   achievement={unlockedAchievement}
 *   onClose={() => setToast(null)}
 *   duration={4000}
 * />
 * ```
 */
export function AchievementToast({
  achievement,
  onClose,
  duration = 4000,
}: AchievementToastProps) {
  const navigate = useNavigate();
  const tierColor = getTierColor(achievement.tier);

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleViewAchievements = () => {
    onClose();
    navigate('/achievements');
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-slide-down">
      <div
        className="bg-black border-2 p-3 shadow-2xl relative"
        style={{
          borderColor: tierColor,
          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
          boxShadow: `0 0 20px ${tierColor}40`,
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 pointer-events-none" style={{ borderColor: tierColor }} />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 pointer-events-none" style={{ borderColor: tierColor }} />

        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-12 h-12 flex items-center justify-center border-2 flex-shrink-0"
            style={{
              borderColor: tierColor,
              backgroundColor: `${tierColor}15`,
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
          >
            <span className="text-2xl">{achievement.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={12} style={{ color: tierColor }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tierColor }}>
                Achievement Unlocked
              </span>
            </div>
            <h3 className="text-sm font-black italic uppercase text-white truncate">
              {achievement.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="flex items-center gap-1 px-1.5 py-0.5"
                style={{
                  backgroundColor: '#ccff0020',
                  border: '1px solid #ccff0040',
                  clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
                }}
              >
                <Zap size={8} className="text-primary" fill="currentColor" />
                <span className="text-[10px] font-bold font-mono text-primary">
                  +{achievement.xpReward} XP
                </span>
              </div>
              <button
                onClick={handleViewAchievements}
                className="text-[10px] font-bold uppercase text-zinc-400 hover:text-primary transition-colors"
              >
                View →
              </button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0"
            style={{
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
            }}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slide-down {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default AchievementToast;
