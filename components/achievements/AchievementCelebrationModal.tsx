/**
 * AchievementCelebrationModal Component
 *
 * Dramatic unlock animation for achievements
 * Industrial explosion effect with neon glow
 */

import React, { useEffect, useState } from 'react';
import { X, Zap, Trophy } from 'lucide-react';
import { Achievement } from '../../types';
import { getTierColor, getAngularClipPath } from '../../utils/achievementUtils';
import { Confetti } from '../Confetti';

interface AchievementCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: Achievement | null;
}

export function AchievementCelebrationModal({
  isOpen,
  onClose,
  achievement,
}: AchievementCelebrationModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setShowConfetti(true); // Trigger confetti on open
      // Auto-close after 4 seconds
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
    setIsAnimating(false);
    setShowConfetti(false);
    return undefined;
  }, [isOpen]);

  if (!isOpen || !achievement) return null;

  const tierColor = getTierColor(achievement.tier);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-modal-title"
    >
      <div
        className={`
          relative bg-black border-2 max-w-md w-full overflow-hidden
          ${isAnimating ? 'animate-scale-in' : ''}
        `}
        style={{
          borderColor: tierColor,
          clipPath: getAngularClipPath(24),
          boxShadow: `0 0 60px ${tierColor}60, inset 0 0 40px ${tierColor}10`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Border Glow */}
        <div
          className="absolute inset-0 pointer-events-none animate-pulse-border"
          style={{
            background: `linear-gradient(45deg, ${tierColor}40, transparent, ${tierColor}40)`,
            clipPath: getAngularClipPath(24),
          }}
        />

        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 pointer-events-none animate-fade-in" style={{ borderColor: tierColor }} />
        <div className="absolute top-0 right-6 w-6 h-6 border-r-2 border-t-2 pointer-events-none animate-fade-in" style={{ borderColor: tierColor }} />
        <div className="absolute bottom-6 left-0 w-6 h-6 border-l-2 border-b-2 pointer-events-none animate-fade-in" style={{ borderColor: tierColor }} />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 pointer-events-none animate-fade-in" style={{ borderColor: tierColor }} />

        {/* Scan Lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10 animate-scan"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              ${tierColor}40 2px,
              ${tierColor}40 4px
            )`,
          }}
        />

        {/* Header */}
        <div className="relative p-6 border-b-2 text-center" style={{ borderColor: `${tierColor}40` }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-5 h-5 animate-bounce" style={{ color: tierColor }} />
            <h2 id="achievement-modal-title" className="font-black italic uppercase tracking-widest text-sm" style={{ color: tierColor }}>
              Achievement Unlocked
            </h2>
            <Trophy className="w-5 h-5 animate-bounce" style={{ color: tierColor }} />
          </div>
        </div>

        {/* Achievement Display */}
        <div className="relative p-8 flex flex-col items-center gap-6">
          {/* Icon with Glow */}
          <div className="relative">
            <div
              className="w-32 h-32 flex items-center justify-center border-4 animate-scale-in"
              style={{
                borderColor: tierColor,
                backgroundColor: `${tierColor}15`,
                clipPath: getAngularClipPath(16),
                boxShadow: `0 0 40px ${tierColor}80, inset 0 0 20px ${tierColor}20`,
              }}
            >
              <span className="text-7xl animate-bounce-slow">{achievement.icon}</span>
            </div>

            {/* Pulsing Glow Ring */}
            <div
              className="absolute inset-0 animate-pulse-ring"
              style={{
                border: `3px solid ${tierColor}`,
                clipPath: getAngularClipPath(16),
              }}
            />
          </div>

          {/* Name */}
          <div className="text-center">
            <h1
              className="text-3xl font-black italic uppercase mb-2 animate-slide-up"
              style={{ color: tierColor }}
            >
              {achievement.name}
            </h1>
            <p className="text-sm text-zinc-400 animate-fade-in">{achievement.description}</p>
          </div>

          {/* Tier & XP */}
          <div className="flex items-center gap-4 animate-fade-in">
            <div
              className="px-4 py-2 border-2"
              style={{
                borderColor: tierColor,
                backgroundColor: `${tierColor}20`,
                clipPath: getAngularClipPath(6),
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tierColor }}>
                {achievement.tier}
              </span>
            </div>

            <div
              className="px-4 py-2 border-2 flex items-center gap-2"
              style={{
                borderColor: '#ccff00',
                backgroundColor: '#ccff0020',
                clipPath: getAngularClipPath(6),
              }}
            >
              <Zap size={14} className="text-primary" fill="currentColor" />
              <span className="text-sm font-black font-mono text-primary">
                +{achievement.xpReward} XP
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="relative p-4 border-t-2" style={{ borderColor: `${tierColor}40` }}>
          <button
            onClick={onClose}
            className="w-full py-3 font-bold uppercase text-sm transition-all border-2"
            style={{
              borderColor: tierColor,
              color: tierColor,
              backgroundColor: 'transparent',
              clipPath: getAngularClipPath(8),
            }}
          >
            Continue
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse-border {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes pulse-ring {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.5;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slide-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-pulse-border {
          animation: pulse-border 2s infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-scan {
          animation: scan 3s linear infinite;
        }

        .animate-pulse-ring {
          animation: pulse-ring 2s infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>

      {/* Confetti Effect */}
      <Confetti
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
        particleCount={50}
        duration={3000}
      />
    </div>
  );
}

export default AchievementCelebrationModal;
