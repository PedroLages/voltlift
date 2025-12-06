/**
 * Offline Indicator Component
 *
 * Displays a banner when the app is offline
 * - Detects browser online/offline status
 * - Auto-hides when back online
 * - Subtle, non-intrusive design
 * - Matches VoltLift branding
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);

      // Hide "reconnected" message after 3 seconds
      setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything if online and not showing reconnected message
  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${
        isOnline
          ? 'bg-[#ccff00] text-black'
          : 'bg-[#111] border-b border-orange-500/50 text-orange-400'
      } transition-all duration-300 animate-slide-down`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2">
        {isOnline ? (
          <>
            <Wifi size={14} className="shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Back Online
            </span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="shrink-0 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Offline Mode
            </span>
            <span className="hidden sm:inline text-[10px] opacity-70">
              // Your data is safe and will sync when reconnected
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
