/**
 * AchievementsGrid Component
 *
 * Display grid of all achievements with locked/unlocked states
 * Filters by category and shows progress
 */

import React, { useState, useMemo } from 'react';
import { Trophy, Target, Flame, Zap, Star, Award } from 'lucide-react';
import { Achievement } from '../../types';
import { ACHIEVEMENTS } from '../../services/gamification';
import { AchievementBadge } from './AchievementBadge';
import { useStore } from '../../store/useStore';

interface AchievementsGridProps {
  compact?: boolean;
}

type CategoryFilter = 'all' | Achievement['category'];

const CATEGORY_ICONS: Record<Achievement['category'], React.ReactNode> = {
  workout: <Target className="w-4 h-4" />,
  strength: <Trophy className="w-4 h-4" />,
  streak: <Flame className="w-4 h-4" />,
  volume: <Zap className="w-4 h-4" />,
  milestone: <Star className="w-4 h-4" />,
};

export function AchievementsGrid({ compact = false }: AchievementsGridProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const { gamification } = useStore();

  // Get unlocked achievement IDs
  const unlockedIds = useMemo(() => {
    return new Set(
      gamification?.unlockedAchievements?.map(a => a.achievementId) || []
    );
  }, [gamification?.unlockedAchievements]);

  // Filter achievements by category
  const filteredAchievements = useMemo(() => {
    if (filter === 'all') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter(a => a.category === filter);
  }, [filter]);

  // Calculate progress for each achievement
  const getAchievementProgress = (achievement: Achievement): number => {
    if (!gamification) return 0;
    if (unlockedIds.has(achievement.id)) return 1;

    const { type, value } = achievement.requirement;

    switch (type) {
      case 'workout_count':
        return Math.min(gamification.totalWorkouts / value, 1);
      case 'pr_count':
        return Math.min(gamification.totalPRs / value, 1);
      case 'streak_days':
        return Math.min(gamification.streak.current / value, 1);
      case 'total_volume':
        return Math.min(gamification.totalVolume / value, 1);
      case 'total_xp':
        return Math.min(gamification.totalXP / value, 1);
      default:
        return 0;
    }
  };

  // Stats
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedIds.size;
  const completionPercentage = Math.round((unlockedCount / totalAchievements) * 100);

  // Get unique categories
  const categories: CategoryFilter[] = ['all', ...Array.from(new Set(ACHIEVEMENTS.map(a => a.category)))];

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div
        className="bg-black border-2 border-zinc-700 p-4"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="font-black italic uppercase text-white tracking-wide">Achievements</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black font-mono text-primary">
              {unlockedCount}/{totalAchievements}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Unlocked</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-zinc-900 border border-zinc-700 overflow-hidden relative">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${completionPercentage}%`,
              boxShadow: '0 0 10px rgba(204, 255, 0, 0.6)',
            }}
          />
          {/* Diagonal Stripes */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 2px,
                rgba(0,0,0,0.4) 2px,
                rgba(0,0,0,0.4) 4px
              )`,
            }}
          />
        </div>
        <div className="text-center mt-1 text-xs text-zinc-500 font-mono">{completionPercentage}% Complete</div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isActive = filter === category;
          const categoryAchievements = category === 'all'
            ? ACHIEVEMENTS
            : ACHIEVEMENTS.filter(a => a.category === category);
          const categoryUnlocked = categoryAchievements.filter(a => unlockedIds.has(a.id)).length;

          return (
            <button
              key={category}
              onClick={() => setFilter(category)}
              aria-label={`Filter by ${category} achievements - ${categoryUnlocked} of ${categoryAchievements.length} unlocked`}
              aria-pressed={isActive}
              className={`
                px-3 py-1.5 border-2 transition-all text-xs font-bold uppercase flex items-center gap-2
                ${isActive
                  ? 'bg-primary border-primary text-black'
                  : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }
              `}
              style={{
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                boxShadow: isActive ? '0 0 15px rgba(204, 255, 0, 0.3)' : undefined,
              }}
            >
              {category !== 'all' && CATEGORY_ICONS[category as Achievement['category']]}
              {category}
              <span className={`text-[10px] ${isActive ? 'text-black' : 'text-zinc-600'}`}>
                ({categoryUnlocked}/{categoryAchievements.length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Achievements Grid */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {filteredAchievements.map((achievement) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          const progress = getAchievementProgress(achievement);

          return (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              unlocked={isUnlocked}
              progress={progress}
              compact={compact}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No achievements in this category</p>
        </div>
      )}
    </div>
  );
}

export default AchievementsGrid;
