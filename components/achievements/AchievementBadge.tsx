/**
 * AchievementBadge Component
 *
 * Industrial-style achievement badge display
 * Shows locked/unlocked state with aggressive VoltLift aesthetic
 */

import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { Achievement } from '../../types';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  progress?: number; // 0-1 for partial progress
  compact?: boolean;
}

export function AchievementBadge({
  achievement,
  unlocked,
  progress = 0,
  compact = false,
}: AchievementBadgeProps) {
  // Tier colors
  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze':
        return '#cd7f32';
      case 'silver':
        return '#c0c0c0';
      case 'gold':
        return '#ffd700';
      case 'platinum':
        return '#e5e4e2';
      case 'diamond':
        return '#b9f2ff';
      default:
        return '#71717a';
    }
  };

  const tierColor = getTierColor(achievement.tier);
  const bgOpacity = unlocked ? '20' : '08';
  const borderOpacity = unlocked ? '60' : '30';

  if (compact) {
    // Compact version for grids
    return (
      <div
        className="relative bg-black border-2 p-3 flex flex-col items-center gap-2 transition-all hover:scale-105"
        style={{
          borderColor: `${tierColor}${borderOpacity}`,
          backgroundColor: `${tierColor}${bgOpacity}`,
          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
          opacity: unlocked ? 1 : 0.5,
          filter: unlocked ? 'none' : 'grayscale(1)',
        }}
      >
        {/* Badge Icon */}
        <div className="text-3xl">{achievement.icon}</div>

        {/* Lock Overlay */}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="bg-black/80 w-10 h-10 flex items-center justify-center border border-zinc-700"
              style={{
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              }}
            >
              <Lock className="w-5 h-5 text-zinc-500" />
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {!unlocked && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div
              className="h-full transition-all"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: tierColor,
                boxShadow: `0 0 8px ${tierColor}60`,
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // Full version with details
  return (
    <div
      className="relative bg-black border-2 p-4 transition-all hover:border-opacity-100"
      style={{
        borderColor: `${tierColor}${borderOpacity}`,
        backgroundColor: `${tierColor}${bgOpacity}`,
        clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
        opacity: unlocked ? 1 : 0.6,
        filter: unlocked ? 'none' : 'grayscale(0.8)',
      }}
    >
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 pointer-events-none" style={{ borderColor: tierColor }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 pointer-events-none" style={{ borderColor: tierColor }} />

      <div className="flex items-start gap-4">
        {/* Icon Section */}
        <div className="relative">
          <div
            className="w-16 h-16 flex items-center justify-center border-2"
            style={{
              borderColor: tierColor,
              backgroundColor: `${tierColor}15`,
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
          >
            <span className="text-4xl">{achievement.icon}</span>
          </div>

          {/* Lock Overlay */}
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="bg-black/90 w-full h-full flex items-center justify-center border-2 border-zinc-700"
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
              >
                <Lock className="w-6 h-6 text-zinc-500" />
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-black italic uppercase text-white text-sm tracking-wide">
              {achievement.name}
            </h3>
            {unlocked && (
              <div
                className="px-2 py-0.5 flex items-center gap-1"
                style={{
                  backgroundColor: `${tierColor}20`,
                  border: `1px solid ${tierColor}50`,
                  clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
                }}
              >
                <Zap size={10} style={{ color: tierColor }} fill={tierColor} />
                <span className="text-[10px] font-bold" style={{ color: tierColor }}>
                  +{achievement.xpReward} XP
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-400 mb-2">{achievement.description}</p>

          {/* Tier Badge */}
          <div
            className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase"
            style={{
              color: tierColor,
              backgroundColor: `${tierColor}15`,
              border: `1px solid ${tierColor}40`,
              clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
            }}
          >
            {achievement.tier}
          </div>

          {/* Progress Bar for Locked */}
          {!unlocked && progress > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Progress</span>
                <span className="text-[10px] text-zinc-400 font-mono">{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-2 bg-zinc-800 overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: tierColor,
                    boxShadow: `0 0 10px ${tierColor}60`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AchievementBadge;
