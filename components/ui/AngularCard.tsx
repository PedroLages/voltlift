/**
 * AngularCard Component
 *
 * Reusable wrapper for VoltLift's industrial angular aesthetic
 * Provides consistent clip-path styling with configurable corner size
 */

import React, { CSSProperties } from 'react';
import { getAngularClipPath } from '../../utils/achievementUtils';

interface AngularCardProps {
  children: React.ReactNode;
  cornerSize?: number;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-modal'?: boolean;
}

/**
 * AngularCard - Industrial-style container with angular corners
 *
 * @param cornerSize - Size of angular corner cutoff in pixels (default: 8)
 * @param className - Additional Tailwind classes
 * @param style - Additional inline styles (merged with clipPath)
 * @param children - Card content
 *
 * @example
 * ```tsx
 * <AngularCard cornerSize={12} className="bg-black border-2 border-zinc-700 p-4">
 *   <p>Content with angular corners</p>
 * </AngularCard>
 * ```
 */
export function AngularCard({
  children,
  cornerSize = 8,
  className = '',
  style = {},
  onClick,
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-modal': ariaModal,
}: AngularCardProps) {
  const mergedStyle: CSSProperties = {
    clipPath: getAngularClipPath(cornerSize),
    ...style,
  };

  return (
    <div
      className={className}
      style={mergedStyle}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-modal={ariaModal}
    >
      {children}
    </div>
  );
}

export default AngularCard;
