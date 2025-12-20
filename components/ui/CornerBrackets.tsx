/**
 * CornerBrackets Component
 *
 * Industrial HUD-style corner brackets for VoltLift modals and cards
 * Part of the aggressive, angular aesthetic
 */

import React from 'react';

interface CornerBracketsProps {
  color?: string;
  size?: number; // Width/height of brackets in pixels
  className?: string;
}

/**
 * Decorative corner brackets for industrial HUD aesthetic
 *
 * Usage:
 * ```tsx
 * <div className="relative">
 *   <CornerBrackets color="#ccff00" size={4} />
 *   {/* Your content *\/}
 * </div>
 * ```
 */
export function CornerBrackets({
  color = '#ccff00',
  size = 4,
  className = '',
}: CornerBracketsProps) {
  const borderStyle = {
    borderColor: color,
  };

  return (
    <>
      {/* Top Left */}
      <div
        className={`absolute top-0 left-0 border-l-2 border-t-2 pointer-events-none z-10 ${className}`}
        style={{ ...borderStyle, width: size * 4, height: size * 4 }}
        aria-hidden="true"
      />

      {/* Top Right */}
      <div
        className={`absolute top-0 border-r-2 border-t-2 pointer-events-none z-10 ${className}`}
        style={{ ...borderStyle, width: size * 4, height: size * 4, right: size * 4 }}
        aria-hidden="true"
      />

      {/* Bottom Left */}
      <div
        className={`absolute left-0 border-l-2 border-b-2 pointer-events-none z-10 ${className}`}
        style={{ ...borderStyle, width: size * 4, height: size * 4, bottom: size * 4 }}
        aria-hidden="true"
      />

      {/* Bottom Right */}
      <div
        className={`absolute bottom-0 right-0 border-r-2 border-b-2 pointer-events-none z-10 ${className}`}
        style={{ ...borderStyle, width: size * 4, height: size * 4 }}
        aria-hidden="true"
      />
    </>
  );
}

export default CornerBrackets;
