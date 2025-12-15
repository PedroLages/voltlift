import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export default function SyncStatusIndicator() {
  const syncStatus = useStore((state) => state.syncStatus);
  const [showSynced, setShowSynced] = useState(false);

  // Auto-hide "All synced" message after 3 seconds
  useEffect(() => {
    if (syncStatus === 'synced') {
      setShowSynced(true);
      const timer = setTimeout(() => setShowSynced(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  // Don't show anything if idle or if synced message has faded
  if (syncStatus === 'idle' || (syncStatus === 'synced' && !showSynced)) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <div className="bg-black/90 backdrop-blur-sm border border-[#ccff00]/20 rounded px-4 py-2 flex items-center gap-2 shadow-lg">
        {syncStatus === 'syncing' && (
          <>
            <div className="w-4 h-4 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-300">Syncing to cloud...</span>
          </>
        )}

        {syncStatus === 'synced' && showSynced && (
          <>
            <svg className="w-4 h-4 text-[#ccff00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-[#ccff00]">All synced</span>
          </>
        )}

        {syncStatus === 'partial' && (
          <>
            <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-yellow-500">Some data failed to sync</span>
          </>
        )}

        {syncStatus === 'error' && (
          <>
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm text-red-500">Sync failed</span>
          </>
        )}
      </div>
    </div>
  );
}
