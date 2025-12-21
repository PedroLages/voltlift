/**
 * Achievements Page
 *
 * Displays all achievements (unlocked and locked) with filtering and progress
 * Industrial HUD-style design with VoltLift aesthetic
 */

import React from 'react';
import { Trophy, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { AchievementsGrid } from '../components/achievements';
import { getAngularClipPath } from '../utils/achievementUtils';

export default function Achievements() {
  const navigate = useNavigate();
  const { gamification } = useStore();

  const unlockedCount = gamification?.unlockedAchievements?.length || 0;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div
        className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b-2 border-primary"
        style={{
          clipPath: getAngularClipPath(0),
        }}
      >
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            style={{
              clipPath: getAngularClipPath(4),
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 bg-primary flex items-center justify-center"
              style={{
                clipPath: getAngularClipPath(6),
              }}
            >
              <Trophy size={20} className="text-black" fill="currentColor" />
            </div>
            <div>
              <h1 className="font-black italic uppercase text-white text-lg tracking-wide">
                Achievements
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                {unlockedCount} UNLOCKED
              </p>
            </div>
          </div>

          <div className="min-w-[44px]" /> {/* Spacer for centering */}
        </div>

        {/* Scan Lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5 z-0"
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
      </div>

      {/* Achievements Grid */}
      <div className="p-4">
        <AchievementsGrid compact={false} />
      </div>
    </div>
  );
}
