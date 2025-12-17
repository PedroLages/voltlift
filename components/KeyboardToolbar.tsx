import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface KeyboardToolbarProps {
  /** Currently focused input element */
  currentInput: HTMLInputElement | null;
  /** Callback when Previous is clicked */
  onPrevious?: () => void;
  /** Callback when Next is clicked */
  onNext?: () => void;
  /** Callback when Done is clicked */
  onDone?: () => void;
  /** Whether Previous button should be disabled */
  hasPrevious?: boolean;
  /** Whether Next button should be disabled */
  hasNext?: boolean;
}

/**
 * iOS-style keyboard toolbar for form navigation
 * Displays Previous/Next arrows and Done button above the keyboard
 * Mimics native iOS form navigation behavior
 */
export default function KeyboardToolbar({
  currentInput,
  onPrevious,
  onNext,
  onDone,
  hasPrevious = true,
  hasNext = true,
}: KeyboardToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show toolbar when input is focused
    if (currentInput) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentInput]);

  // Auto-hide when keyboard is dismissed
  useEffect(() => {
    const handleBlur = () => {
      // Delay to check if another input was focused
      setTimeout(() => {
        if (document.activeElement?.tagName !== 'INPUT') {
          setIsVisible(false);
        }
      }, 100);
    };

    if (currentInput) {
      currentInput.addEventListener('blur', handleBlur);
      return () => currentInput.removeEventListener('blur', handleBlur);
    }
  }, [currentInput]);

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#333] safe-area-bottom"
      style={{
        // Position above keyboard (iOS Safe Area handles keyboard height)
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Previous/Next Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              onPrevious?.();
            }}
            disabled={!hasPrevious}
            className={`w-10 h-10 flex items-center justify-center border transition-colors ${
              hasPrevious
                ? 'border-[#333] text-white hover:border-primary hover:text-primary'
                : 'border-[#222] text-[#444] cursor-not-allowed'
            }`}
            aria-label="Previous field"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onNext?.();
            }}
            disabled={!hasNext}
            className={`w-10 h-10 flex items-center justify-center border transition-colors ${
              hasNext
                ? 'border-[#333] text-white hover:border-primary hover:text-primary'
                : 'border-[#222] text-[#444] cursor-not-allowed'
            }`}
            aria-label="Next field"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Field Label */}
        <div className="flex-1 text-center">
          <span className="text-xs font-mono text-[#666] uppercase tracking-wider">
            {currentInput?.getAttribute('aria-label') || 'Input'}
          </span>
        </div>

        {/* Done Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onDone?.();
            currentInput?.blur(); // Dismiss keyboard
          }}
          className="px-6 py-2 bg-primary text-black font-black italic uppercase tracking-wider text-sm hover:bg-white transition-colors"
          aria-label="Done"
        >
          Done
        </button>
      </div>
    </div>
  );
}
