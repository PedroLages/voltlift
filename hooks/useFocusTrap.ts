/**
 * useFocusTrap Hook
 *
 * Implements keyboard accessibility for modals:
 * - Traps focus within modal (Tab cycles through focusable elements)
 * - Handles Escape key to close modal
 * - Respects WCAG 2.1 keyboard operability standards
 */

import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Focus trap and Escape key handler for modals
 *
 * Usage:
 * ```tsx
 * const modalRef = useFocusTrap({ isOpen, onClose });
 * return <div ref={modalRef}>...</div>
 * ```
 */
export function useFocusTrap({ isOpen, onClose }: UseFocusTrapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) return;

    // Focus first element on mount
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement?.focus();

    // Handle Tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Handle Tab key
      if (e.key === 'Tab') {
        // Get current focusable elements (may have changed)
        const currentFocusableElements = getFocusableElements(container);
        const currentFirstElement = currentFocusableElements[0];
        const currentLastElement = currentFocusableElements[currentFocusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: Moving backwards
          if (document.activeElement === currentFirstElement) {
            e.preventDefault();
            currentLastElement?.focus();
          }
        } else {
          // Tab: Moving forwards
          if (document.activeElement === currentLastElement) {
            e.preventDefault();
            currentFirstElement?.focus();
          }
        }
      }
    };

    // Add event listener
    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return containerRef;
}

export default useFocusTrap;
