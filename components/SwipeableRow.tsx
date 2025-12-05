import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Copy } from 'lucide-react';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onDuplicate?: () => void;
  threshold?: number; // Distance in px to trigger action
  disabled?: boolean;
}

/**
 * SwipeableRow Component
 *
 * Provides swipe gestures for quick actions:
 * - Swipe left (→) to delete
 * - Swipe right (←) to duplicate
 *
 * Features:
 * - Smooth animations
 * - Haptic feedback
 * - Visual indicators
 * - Performance optimized (< 100ms response)
 */
export default function SwipeableRow({
  children,
  onDelete,
  onDuplicate,
  threshold = 80,
  disabled = false,
}: SwipeableRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [actionTriggered, setActionTriggered] = useState<'delete' | 'duplicate' | null>(null);

  const startX = useRef(0);
  const currentX = useRef(0);
  const rowRef = useRef<HTMLDivElement>(null);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;

    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || disabled) return;

    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Limit swipe distance
    const maxSwipe = 120;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));

    setOffsetX(limitedDiff);

    // Visual feedback when threshold reached
    if (Math.abs(limitedDiff) >= threshold) {
      if (limitedDiff < 0 && onDelete) {
        // Swipe left for delete
        if (navigator.vibrate) navigator.vibrate(10);
      } else if (limitedDiff > 0 && onDuplicate) {
        // Swipe right for duplicate
        if (navigator.vibrate) navigator.vibrate(10);
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isSwiping || disabled) return;

    const diff = currentX.current - startX.current;

    // Check if action threshold met
    if (Math.abs(diff) >= threshold) {
      if (diff < 0 && onDelete) {
        // Delete action
        setActionTriggered('delete');
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

        // Wait for animation then execute
        setTimeout(() => {
          onDelete();
          resetSwipe();
        }, 200);
      } else if (diff > 0 && onDuplicate) {
        // Duplicate action
        setActionTriggered('duplicate');
        if (navigator.vibrate) navigator.vibrate([50, 50]);

        // Wait for animation then execute
        setTimeout(() => {
          onDuplicate();
          resetSwipe();
        }, 200);
      } else {
        resetSwipe();
      }
    } else {
      resetSwipe();
    }

    setIsSwiping(false);
  };

  const resetSwipe = () => {
    setOffsetX(0);
    setActionTriggered(null);
  };

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping || disabled) return;

    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    const maxSwipe = 120;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setOffsetX(limitedDiff);
  };

  const handleMouseUp = () => {
    if (isSwiping) {
      handleTouchEnd();
    }
  };

  useEffect(() => {
    // Global mouse up listener for desktop
    const handleGlobalMouseUp = () => {
      if (isSwiping) {
        handleTouchEnd();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSwiping]);

  return (
    <div className="relative overflow-hidden">
      {/* Background action indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        {/* Duplicate indicator (left side, shown on right swipe) */}
        {onDuplicate && (
          <div
            className={`flex items-center gap-2 transition-opacity ${
              offsetX > threshold / 2 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Copy size={20} className="text-primary" />
            <span className="text-primary font-bold text-sm">DUPLICATE</span>
          </div>
        )}

        <div /> {/* Spacer */}

        {/* Delete indicator (right side, shown on left swipe) */}
        {onDelete && (
          <div
            className={`flex items-center gap-2 transition-opacity ${
              offsetX < -threshold / 2 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-red-500 font-bold text-sm">DELETE</span>
            <Trash2 size={20} className="text-red-500" />
          </div>
        )}
      </div>

      {/* Swipeable content */}
      <div
        ref={rowRef}
        className={`relative z-10 bg-background transition-transform ${
          actionTriggered ? 'duration-200' : 'duration-100'
        } ${isSwiping ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {children}
      </div>
    </div>
  );
}
