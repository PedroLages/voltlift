/**
 * Gamification Service
 *
 * Handles XP calculation, level progression, streaks, and achievements.
 * Designed for engagement without being annoying.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GamificationState,
  IronRank,
  Achievement,
  XPTransaction,
  UnlockedAchievement,
  StreakData,
  WorkoutSession,
} from '../types';

// ============================================================================
// IRON RANK SYSTEM (Levels)
// ============================================================================

export const IRON_RANKS: IronRank[] = [
  { level: 1, name: 'ROOKIE', minXP: 0, maxXP: 499, color: 'text-gray-400' },
  { level: 2, name: 'REGULAR', minXP: 500, maxXP: 1499, color: 'text-green-400' },
  { level: 3, name: 'WARRIOR', minXP: 1500, maxXP: 3999, color: 'text-blue-400' },
  { level: 4, name: 'CHAMPION', minXP: 4000, maxXP: 9999, color: 'text-purple-400' },
  { level: 5, name: 'LEGEND', minXP: 10000, maxXP: 24999, color: 'text-orange-400' },
  { level: 6, name: 'IRON MASTER', minXP: 25000, maxXP: Infinity, color: 'text-[#ccff00]', perks: ['Beta Features', 'Custom Themes'] },
];

/**
 * Get rank info for a given XP amount
 */
export function getRankForXP(totalXP: number): IronRank {
  for (let i = IRON_RANKS.length - 1; i >= 0; i--) {
    if (totalXP >= IRON_RANKS[i].minXP) {
      return IRON_RANKS[i];
    }
  }
  return IRON_RANKS[0];
}

/**
 * Calculate XP needed to reach next level
 */
export function getXPToNextLevel(totalXP: number): number {
  const currentRank = getRankForXP(totalXP);
  if (currentRank.level === IRON_RANKS.length) {
    return 0; // Max level
  }
  return currentRank.maxXP + 1 - totalXP;
}

/**
 * Calculate progress percentage to next level
 */
export function getLevelProgress(totalXP: number): number {
  const currentRank = getRankForXP(totalXP);
  if (currentRank.maxXP === Infinity) return 100;

  const levelXP = totalXP - currentRank.minXP;
  const levelRange = currentRank.maxXP - currentRank.minXP + 1;
  return Math.round((levelXP / levelRange) * 100);
}

// ============================================================================
// XP CALCULATIONS
// ============================================================================

export interface WorkoutXPResult {
  baseXP: number;
  bonuses: { name: string; amount: number }[];
  totalXP: number;
}

/**
 * Calculate XP earned from completing a workout
 */
export function calculateWorkoutXP(workout: WorkoutSession, options?: {
  hitPRs?: number;
  currentStreak?: number;
  volumeTotal?: number;
}): WorkoutXPResult {
  const { hitPRs = 0, currentStreak = 0, volumeTotal = 0 } = options || {};

  // Base XP for completing any workout
  const baseXP = 100;

  const bonuses: { name: string; amount: number }[] = [];

  // Exercise count bonus (more exercises = more XP, caps at 8)
  const exerciseCount = Math.min(workout.logs.length, 8);
  if (exerciseCount > 3) {
    const exerciseBonus = (exerciseCount - 3) * 10;
    bonuses.push({ name: `${exerciseCount} Exercises`, amount: exerciseBonus });
  }

  // Volume bonus (every 5000 lbs = 25 XP, caps at 100 XP)
  if (volumeTotal > 0) {
    const volumeBonus = Math.min(100, Math.floor(volumeTotal / 5000) * 25);
    if (volumeBonus > 0) {
      bonuses.push({ name: 'Volume Bonus', amount: volumeBonus });
    }
  }

  // PR bonus (50 XP per PR)
  if (hitPRs > 0) {
    bonuses.push({ name: `${hitPRs} PR${hitPRs > 1 ? 's' : ''} Hit`, amount: hitPRs * 50 });
  }

  // Streak bonus (scales with streak length)
  if (currentStreak >= 3) {
    const streakBonus = Math.min(200, currentStreak * 15);
    bonuses.push({ name: `${currentStreak}-Day Streak`, amount: streakBonus });
  }

  // Duration bonus (30+ minute workouts)
  if (workout.endTime && workout.startTime) {
    const durationMins = (workout.endTime - workout.startTime) / 1000 / 60;
    if (durationMins >= 45) {
      bonuses.push({ name: 'Long Session', amount: 50 });
    } else if (durationMins >= 30) {
      bonuses.push({ name: 'Solid Session', amount: 25 });
    }
  }

  // Weekend warrior bonus
  const dayOfWeek = new Date(workout.startTime).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    bonuses.push({ name: 'Weekend Warrior', amount: 20 });
  }

  // Early bird / Night owl bonus
  const hour = new Date(workout.startTime).getHours();
  if (hour < 7) {
    bonuses.push({ name: 'Early Bird', amount: 15 });
  } else if (hour >= 21) {
    bonuses.push({ name: 'Night Owl', amount: 15 });
  }

  const totalXP = baseXP + bonuses.reduce((sum, b) => sum + b.amount, 0);

  return { baseXP, bonuses, totalXP };
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  // Workout Milestones
  {
    id: 'first_blood',
    name: 'FIRST BLOOD',
    description: 'Complete your first workout',
    icon: '💪',
    category: 'workout',
    xpReward: 100,
    requirement: { type: 'workout_count', value: 1 },
    tier: 'bronze',
  },
  {
    id: 'getting_started',
    name: 'GETTING STARTED',
    description: 'Complete 10 workouts',
    icon: '🔥',
    category: 'workout',
    xpReward: 250,
    requirement: { type: 'workout_count', value: 10 },
    tier: 'bronze',
  },
  {
    id: 'dedicated',
    name: 'DEDICATED',
    description: 'Complete 50 workouts',
    icon: '⭐',
    category: 'workout',
    xpReward: 500,
    requirement: { type: 'workout_count', value: 50 },
    tier: 'silver',
  },
  {
    id: 'century_club',
    name: 'CENTURY CLUB',
    description: 'Complete 100 workouts',
    icon: '🏆',
    category: 'workout',
    xpReward: 1000,
    requirement: { type: 'workout_count', value: 100 },
    tier: 'gold',
  },

  // Streak Achievements
  {
    id: 'three_day_streak',
    name: 'MOMENTUM',
    description: 'Maintain a 3-day workout streak',
    icon: '🔥',
    category: 'streak',
    xpReward: 150,
    requirement: { type: 'streak_days', value: 3 },
    tier: 'bronze',
  },
  {
    id: 'week_warrior',
    name: 'WEEK WARRIOR',
    description: 'Maintain a 7-day workout streak',
    icon: '💎',
    category: 'streak',
    xpReward: 300,
    requirement: { type: 'streak_days', value: 7 },
    tier: 'silver',
  },
  {
    id: 'iron_will',
    name: 'IRON WILL',
    description: 'Maintain a 30-day workout streak',
    icon: '🦾',
    category: 'streak',
    xpReward: 1000,
    requirement: { type: 'streak_days', value: 30 },
    tier: 'gold',
  },

  // Strength Achievements
  {
    id: 'pr_hunter',
    name: 'PR HUNTER',
    description: 'Hit 10 personal records',
    icon: '🎯',
    category: 'strength',
    xpReward: 300,
    requirement: { type: 'pr_count', value: 10 },
    tier: 'bronze',
  },
  {
    id: 'pr_master',
    name: 'PR MASTER',
    description: 'Hit 50 personal records',
    icon: '👑',
    category: 'strength',
    xpReward: 750,
    requirement: { type: 'pr_count', value: 50 },
    tier: 'silver',
  },

  // Volume Achievements
  {
    id: 'ton_lifter',
    name: 'TON LIFTER',
    description: 'Lift 100,000 lbs total volume',
    icon: '🏋️',
    category: 'volume',
    xpReward: 500,
    requirement: { type: 'total_volume', value: 100000 },
    tier: 'bronze',
  },
  {
    id: 'million_pound_club',
    name: 'MILLION POUND CLUB',
    description: 'Lift 1,000,000 lbs total volume',
    icon: '💎',
    category: 'volume',
    xpReward: 2000,
    requirement: { type: 'total_volume', value: 1000000 },
    tier: 'platinum',
  },

  // Program Achievements
  {
    id: 'program_graduate',
    name: 'PROGRAM GRADUATE',
    description: 'Complete a full workout program',
    icon: '🎓',
    category: 'milestone',
    xpReward: 750,
    requirement: { type: 'program_complete', value: 1 },
    tier: 'gold',
  },
];

/**
 * Check which achievements have been newly unlocked
 */
export function checkAchievements(
  gamificationState: GamificationState,
): Achievement[] {
  const unlockedIds = new Set(gamificationState.unlockedAchievements.map(a => a.achievementId));

  return ACHIEVEMENTS.filter(achievement => {
    if (unlockedIds.has(achievement.id)) return false;

    const { type, value } = achievement.requirement;

    switch (type) {
      case 'workout_count':
        return gamificationState.totalWorkouts >= value;
      case 'streak_days':
        return gamificationState.streak.current >= value ||
               gamificationState.streak.longest >= value;
      case 'total_volume':
        return gamificationState.totalVolume >= value;
      case 'pr_count':
        return gamificationState.totalPRs >= value;
      default:
        return false;
    }
  });
}

// ============================================================================
// STREAK MANAGEMENT
// ============================================================================

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date as ISO string
 */
export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Update streak based on workout completion
 */
export function updateStreak(currentStreak: StreakData): StreakData {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  // Already worked out today
  if (currentStreak.lastWorkoutDate === today) {
    return currentStreak;
  }

  // Continuing streak from yesterday
  if (currentStreak.lastWorkoutDate === yesterday) {
    const newStreak = currentStreak.current + 1;
    return {
      ...currentStreak,
      current: newStreak,
      longest: Math.max(newStreak, currentStreak.longest),
      lastWorkoutDate: today,
    };
  }

  // Streak broken, but check if we have a freeze
  if (currentStreak.freezesRemaining > 0 && currentStreak.current > 0) {
    // Check if gap is only 1 day (missed yesterday)
    const lastDate = new Date(currentStreak.lastWorkoutDate);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 2) {
      // Use a freeze to maintain streak
      return {
        ...currentStreak,
        current: currentStreak.current + 1,
        longest: Math.max(currentStreak.current + 1, currentStreak.longest),
        lastWorkoutDate: today,
        freezesRemaining: currentStreak.freezesRemaining - 1,
        freezesUsedThisWeek: currentStreak.freezesUsedThisWeek + 1,
      };
    }
  }

  // Streak broken, start fresh
  return {
    current: 1,
    longest: Math.max(1, currentStreak.longest),
    lastWorkoutDate: today,
    streakStartDate: today,
    freezesRemaining: currentStreak.freezesRemaining,
    freezesUsedThisWeek: currentStreak.freezesUsedThisWeek,
  };
}

/**
 * Reset weekly freezes (call this on Monday)
 */
export function resetWeeklyFreezes(streak: StreakData): StreakData {
  return {
    ...streak,
    freezesRemaining: 2, // 2 rest days per week
    freezesUsedThisWeek: 0,
  };
}

// ============================================================================
// STATE MANAGEMENT HELPERS
// ============================================================================

/**
 * Create initial gamification state for new users
 */
export function createInitialGamificationState(): GamificationState {
  return {
    totalXP: 0,
    currentLevel: 1,
    xpToNextLevel: 500,
    xpHistory: [],
    streak: {
      current: 0,
      longest: 0,
      lastWorkoutDate: '',
      streakStartDate: '',
      freezesRemaining: 2,
      freezesUsedThisWeek: 0,
    },
    unlockedAchievements: [],
    totalWorkouts: 0,
    totalVolume: 0,
    totalPRs: 0,
  };
}

/**
 * Award XP and update state
 */
export function awardXP(
  state: GamificationState,
  amount: number,
  source: XPTransaction['source'],
  description: string,
  workoutId?: string
): GamificationState {
  const newTotalXP = state.totalXP + amount;
  const newRank = getRankForXP(newTotalXP);

  const transaction: XPTransaction = {
    id: uuidv4(),
    amount,
    source,
    description,
    timestamp: Date.now(),
    workoutId,
  };

  // Keep last 50 transactions
  const xpHistory = [transaction, ...state.xpHistory].slice(0, 50);

  return {
    ...state,
    totalXP: newTotalXP,
    currentLevel: newRank.level,
    xpToNextLevel: getXPToNextLevel(newTotalXP),
    xpHistory,
  };
}

/**
 * Process workout completion - update all gamification metrics
 */
export function processWorkoutCompletion(
  state: GamificationState,
  workout: WorkoutSession,
  prsHit: number,
  workoutVolume: number
): {
  newState: GamificationState;
  xpEarned: WorkoutXPResult;
  newAchievements: Achievement[];
  leveledUp: boolean;
} {
  const previousLevel = state.currentLevel;

  // Update streaks
  let newState: GamificationState = {
    ...state,
    streak: updateStreak(state.streak),
    totalWorkouts: state.totalWorkouts + 1,
    totalVolume: state.totalVolume + workoutVolume,
    totalPRs: state.totalPRs + prsHit,
  };

  // Calculate XP
  const xpResult = calculateWorkoutXP(workout, {
    hitPRs: prsHit,
    currentStreak: newState.streak.current,
    volumeTotal: workoutVolume,
  });

  // Award XP
  newState = awardXP(newState, xpResult.totalXP, 'workout_complete', `Completed ${workout.name}`, workout.id);

  // Check for new achievements
  const newAchievements = checkAchievements(newState);

  // Award achievement XP and record unlocks
  for (const achievement of newAchievements) {
    newState = awardXP(newState, achievement.xpReward, 'achievement', `Unlocked: ${achievement.name}`);
    newState.unlockedAchievements = [
      ...newState.unlockedAchievements,
      {
        achievementId: achievement.id,
        unlockedAt: Date.now(),
        xpAwarded: achievement.xpReward,
      },
    ];
  }

  const leveledUp = newState.currentLevel > previousLevel;

  return {
    newState,
    xpEarned: xpResult,
    newAchievements,
    leveledUp,
  };
}
