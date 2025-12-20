/**
 * Utility for extracting hex color values from rank color classes
 * Consolidates color mapping logic used across gamification components
 */

const COLOR_MAP: Record<string, string> = {
  'text-zinc-400': '#a1a1aa',
  'text-green-400': '#4ade80',
  'text-blue-400': '#60a5fa',
  'text-purple-400': '#c084fc',
  'text-orange-400': '#fb923c',
  'text-red-400': '#f87171',
  'text-primary': '#ccff00',
};

/**
 * Extract hex color value from Tailwind class or custom hex string
 * @param rankColor - Either a Tailwind class (e.g., 'text-zinc-400') or hex color (e.g., 'text-[#a1a1aa]')
 * @returns Hex color string, defaults to primary color if not found
 */
export function getRankHexColor(rankColor: string): string {
  // Handle custom hex colors in Tailwind's arbitrary value syntax: text-[#hex]
  if (rankColor.startsWith('text-[')) {
    const match = rankColor.match(/#[0-9a-fA-F]+/);
    return match?.[0] || '#ccff00';
  }

  // Look up standard Tailwind colors
  return COLOR_MAP[rankColor] || '#ccff00';
}
