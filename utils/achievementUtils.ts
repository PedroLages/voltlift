/**
 * Achievement Utilities
 *
 * Shared utilities for achievement components
 */

import { Achievement } from '../types';

/**
 * Get tier-specific color
 * Used for styling badges, modals, and other achievement UI
 */
export function getTierColor(tier: Achievement['tier']): string {
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
      return '#71717a'; // zinc-500
  }
}

/**
 * Get opacity values for tier-based styling
 */
export function getTierOpacities(unlocked: boolean) {
  return {
    bg: unlocked ? '20' : '08',
    border: unlocked ? '60' : '30',
  };
}

/**
 * Generate clip-path polygon for angular corners
 * @param size - Corner size in pixels (e.g., 8 for 8px corners)
 */
export function getAngularClipPath(size: number): string {
  return `polygon(${size}px 0, 100% 0, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0 100%, 0 ${size}px)`;
}
