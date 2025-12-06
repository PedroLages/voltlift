import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Skeleton Component
 *
 * Provides loading placeholders for content
 * - Smooth pulse animation
 * - Multiple variants (text, rect, circle)
 * - Customizable dimensions
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animate = true,
}) => {
  const baseClasses = 'bg-[#222]';
  const animateClasses = animate ? 'animate-pulse' : '';

  const variantClasses = {
    text: 'rounded h-4',
    rect: 'rounded',
    circle: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animateClasses} ${className}`}
      style={style}
    />
  );
};

/**
 * Skeleton Card Component
 * Pre-built skeleton for exercise history cards
 */
export const SkeletonExerciseCard: React.FC = () => {
  return (
    <div className="bg-[#111] border border-[#222] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width="60%" height={20} />
        <Skeleton variant="circle" width={24} height={24} />
      </div>

      {/* Stats Row */}
      <div className="flex gap-4">
        <Skeleton width={60} height={16} />
        <Skeleton width={60} height={16} />
        <Skeleton width={60} height={16} />
      </div>

      {/* Sets */}
      <div className="space-y-2">
        <Skeleton width="100%" height={12} />
        <Skeleton width="100%" height={12} />
        <Skeleton width="80%" height={12} />
      </div>
    </div>
  );
};

/**
 * Skeleton Stat Component
 * Pre-built skeleton for stat cards
 */
export const SkeletonStat: React.FC = () => {
  return (
    <div className="bg-[#111] border border-[#222] p-4">
      <Skeleton width={80} height={12} className="mb-2" />
      <Skeleton width="60%" height={32} />
    </div>
  );
};

/**
 * Skeleton Chart Component
 * Pre-built skeleton for charts
 */
export const SkeletonChart: React.FC = () => {
  return (
    <div className="bg-[#111] border border-[#222] p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={16} />
      </div>
      <Skeleton width="100%" height={200} className="mb-2" />
      <div className="flex justify-between">
        <Skeleton width={60} height={12} />
        <Skeleton width={60} height={12} />
      </div>
    </div>
  );
};

/**
 * Skeleton List Component
 * Pre-built skeleton for lists
 */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#111] border border-[#222] p-3 flex items-center gap-3">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height={14} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
