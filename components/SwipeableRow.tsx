import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Copy } from 'lucide-react';

export interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onDuplicate?: () => void;
  threshold?: number; // Distance in px to reveal actions
  disabled?: boolean;
  key?: React.Key; // Allow React's special key prop
}

/**
 * SwipeableRow Component
 *
 * Provides swipe gestures for quick actions:
 * - Swipe left (←) to reveal delete button with confirmation
 * - Swipe right (→) to duplicate immediately
 *
 * Features:
 * - Smooth animations
 * - Haptic feedback
 * - Visual indicators
 * - Confirmation modal for delete
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRevealed, setIsRevealed] = useState<'delete' | 'duplicate' | null>(null);

  const startX = useRef(0);
  const currentX = useRef(0);
  const rowRef = useRef<HTMLDivElement>(null);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || showDeleteConfirm) return;

    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || disabled || showDeleteConfirm) return;

    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Limit swipe distance
    const maxSwipe = 120;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));

    setOffsetX(limitedDiff);

    // Haptic feedback when threshold reached
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
    if (!isSwiping || disabled || showDeleteConfirm) return;

    const diff = currentX.current - startX.current;

    // Check if action threshold met
    if (Math.abs(diff) >= threshold) {
      if (diff < 0 && onDelete) {
        // Swipe left - reveal delete button
        setIsRevealed('delete');
        setOffsetX(-120); // Keep revealed
        if (navigator.vibrate) navigator.vibrate([50, 50]);
      } else if (diff > 0 && onDuplicate) {
        // Swipe right - duplicate immediately
        if (navigator.vibrate) navigator.vibrate([50, 50]);
        onDuplicate();
        resetSwipe();
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
    setIsRevealed(null);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirm(false);
    resetSwipe();
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    resetSwipe();
  };

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || showDeleteConfirm) return;
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping || disabled || showDeleteConfirm) return;

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
    <>
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

          {/* Delete button (right side, shown on left swipe) */}
          {onDelete && isRevealed === 'delete' && (
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-2 bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              <Trash2 size={20} className="text-white" />
              <span className="text-white font-bold text-sm">DELETE</span>
            </button>
          )}

          {/* Delete indicator when swiping (not yet revealed) */}
          {onDelete && !isRevealed && (
            <div
              className={`flex items-center gap-2 transition-opacity ${
                offsetX < -threshold / 2 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="text-red-500 font-bold text-sm">SWIPE TO DELETE</span>
              <Trash2 size={20} className="text-red-500" />
            </div>
          )}
        </div>

        {/* Swipeable content */}
        <div
          ref={rowRef}
          className={`relative z-10 bg-background transition-transform ${
            isSwiping ? 'duration-100' : 'duration-200'
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in">
          <div className="bg-[#111] border-2 border-red-500 max-w-sm w-full mx-4 animate-scale-in">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-500/20 p-3 rounded">
                  <Trash2 size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-black uppercase text-white italic">
                  Confirm Delete
                </h3>
              </div>

              <p className="text-sm text-[#888] mb-6 font-mono">
                Are you sure you want to delete this set? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-3 border border-[#333] text-[#888] font-bold uppercase text-sm hover:bg-[#222] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-bold uppercase text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
