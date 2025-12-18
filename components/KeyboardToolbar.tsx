import React, { useEffect, useState, useRef, useCallback } from 'react';
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

// Check if running in Capacitor native environment
const isCapacitorNative = (): boolean => {
  return typeof (window as any).Capacitor !== 'undefined' &&
         (window as any).Capacitor.isNativePlatform?.() === true;
};

/**
 * iOS-style keyboard toolbar for form navigation
 * Displays Previous/Next arrows and Done button above the keyboard
 *
 * Uses two different strategies:
 * - Native iOS (Capacitor): Uses @capacitor/keyboard plugin events
 * - Web: Uses visualViewport API
 *
 * Note: These approaches are mutually exclusive because Capacitor's
 * keyboard plugin prevents WebView resizing, which breaks visualViewport.
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Calculate keyboard height using visualViewport API (web only)
  const updateKeyboardHeight = useCallback(() => {
    // Skip visualViewport on native - we use Capacitor Keyboard events instead
    if (isCapacitorNative()) return;

    if (window.visualViewport) {
      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const calculatedKeyboardHeight = windowHeight - viewportHeight;

      // Only update if keyboard is actually visible (height > 100px to avoid false positives)
      if (calculatedKeyboardHeight > 100) {
        setKeyboardHeight(calculatedKeyboardHeight);
      } else {
        setKeyboardHeight(0);
      }
    }
  }, []);

  // Capacitor Keyboard Plugin Integration (native iOS)
  useEffect(() => {
    if (!isCapacitorNative()) return;

    let keyboardShowListener: any = null;
    let keyboardHideListener: any = null;

    const setupCapacitorKeyboard = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');

        // Listen for keyboard show events
        keyboardShowListener = await Keyboard.addListener('keyboardWillShow', (info) => {
          console.log('[KeyboardToolbar] Capacitor keyboard will show, height:', info.keyboardHeight);
          setKeyboardHeight(info.keyboardHeight);
        });

        // Listen for keyboard hide events
        keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
          console.log('[KeyboardToolbar] Capacitor keyboard will hide');
          setKeyboardHeight(0);
        });

        console.log('[KeyboardToolbar] Capacitor Keyboard listeners registered');
      } catch (error) {
        console.warn('[KeyboardToolbar] Failed to setup Capacitor Keyboard:', error);
      }
    };

    setupCapacitorKeyboard();

    return () => {
      // Cleanup listeners
      keyboardShowListener?.remove?.();
      keyboardHideListener?.remove?.();
    };
  }, []);

  // Listen to visualViewport changes (web only - keyboard open/close)
  useEffect(() => {
    // Skip on native - Capacitor handles keyboard events
    if (isCapacitorNative()) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      updateKeyboardHeight();
    };

    const handleScroll = () => {
      updateKeyboardHeight();
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleScroll);

    // Initial check
    updateKeyboardHeight();

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, [updateKeyboardHeight]);

  useEffect(() => {
    // Show toolbar when input is focused
    if (currentInput) {
      setIsVisible(true);
      // Recalculate keyboard height when input changes (web only)
      if (!isCapacitorNative()) {
        setTimeout(updateKeyboardHeight, 100);
      }
    } else {
      setIsVisible(false);
      setKeyboardHeight(0);
    }
  }, [currentInput, updateKeyboardHeight]);

  // Auto-hide when keyboard is dismissed
  useEffect(() => {
    const handleBlur = () => {
      // Delay to check if another input was focused
      setTimeout(() => {
        if (document.activeElement?.tagName !== 'INPUT' &&
            document.activeElement?.tagName !== 'TEXTAREA') {
          setIsVisible(false);
          setKeyboardHeight(0);
        }
      }, 150);
    };

    if (currentInput) {
      currentInput.addEventListener('blur', handleBlur);
      return () => currentInput.removeEventListener('blur', handleBlur);
    }
  }, [currentInput]);

  // Don't render if not visible or no keyboard detected
  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed left-0 right-0 z-[9999] bg-[#1a1a1a] border-t border-[#444]"
      style={{
        // Position above the keyboard
        bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px',
        // Add shadow for visibility
        boxShadow: '0 -2px 10px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2">
        {/* Previous/Next Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPrevious?.();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            disabled={!hasPrevious}
            className={`w-11 h-11 flex items-center justify-center rounded-lg transition-colors touch-manipulation ${
              hasPrevious
                ? 'bg-[#333] text-white active:bg-primary active:text-black'
                : 'bg-[#222] text-[#555] cursor-not-allowed'
            }`}
            aria-label="Previous field"
            type="button"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNext?.();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            disabled={!hasNext}
            className={`w-11 h-11 flex items-center justify-center rounded-lg transition-colors touch-manipulation ${
              hasNext
                ? 'bg-[#333] text-white active:bg-primary active:text-black'
                : 'bg-[#222] text-[#555] cursor-not-allowed'
            }`}
            aria-label="Next field"
            type="button"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Field Label - truncated for long labels */}
        <div className="flex-1 text-center px-2 overflow-hidden">
          <span className="text-[11px] font-mono text-[#888] uppercase tracking-wider truncate block">
            {currentInput?.getAttribute('aria-label')?.split(' for ')[0] || 'Input'}
          </span>
        </div>

        {/* Done Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDone?.();
            currentInput?.blur(); // Dismiss keyboard
          }}
          onTouchStart={(e) => e.stopPropagation()}
          className="px-5 py-2.5 bg-primary text-black font-bold uppercase text-sm rounded-lg active:bg-white transition-colors touch-manipulation min-h-[44px]"
          aria-label="Done"
          type="button"
        >
          Done
        </button>
      </div>
    </div>
  );
}
