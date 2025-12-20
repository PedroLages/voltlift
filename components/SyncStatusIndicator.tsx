import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';

// Add slide-down animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-down {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }
`;
if (!document.querySelector('style[data-sync-toast]')) {
  style.setAttribute('data-sync-toast', 'true');
  document.head.appendChild(style);
}

export default function SyncStatusIndicator() {
  const syncStatus = useStore((state) => state.syncStatus);
  const { isAuthenticated } = useAuthStore();
  const [showSynced, setShowSynced] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showPartial, setShowPartial] = useState(false);

  // Auto-hide "All synced" message after 3 seconds
  useEffect(() => {
    if (syncStatus === 'synced') {
      setShowSynced(true);
      const timer = setTimeout(() => setShowSynced(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  // Auto-hide "Sync failed" message after 5 seconds (longer for error visibility)
  useEffect(() => {
    if (syncStatus === 'error') {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  // Auto-hide "Partial sync" message after 5 seconds
  useEffect(() => {
    if (syncStatus === 'partial') {
      setShowPartial(true);
      const timer = setTimeout(() => setShowPartial(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  // Don't show anything if not authenticated or if messages have faded
  if (!isAuthenticated ||
      (syncStatus === 'synced' && !showSynced) ||
      (syncStatus === 'error' && !showError) ||
      (syncStatus === 'partial' && !showPartial)) {
    return null;
  }

  return (
    <div className="fixed top-4 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
      <div className="bg-black/95 backdrop-blur-sm border-2 px-4 py-3 flex items-center gap-3 shadow-2xl animate-slide-down max-w-sm w-full"
           style={{
             clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
             borderColor: syncStatus === 'error' ? '#ef4444' : syncStatus === 'synced' ? '#ccff00' : '#ccff00'
           }}>
        {syncStatus === 'syncing' && (
          <>
            <div className="w-4 h-4 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm font-black italic uppercase tracking-wider text-[#ccff00]">Syncing to cloud...</span>
          </>
        )}

        {syncStatus === 'synced' && showSynced && (
          <>
            <svg className="w-5 h-5 text-[#ccff00] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-black italic uppercase tracking-wider text-[#ccff00]">All synced</span>
          </>
        )}

        {syncStatus === 'partial' && (
          <>
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-black italic uppercase tracking-wider text-yellow-500">Partial sync</span>
          </>
        )}

        {syncStatus === 'error' && (
          <>
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm font-black italic uppercase tracking-wider text-red-500">Sync failed</span>
          </>
        )}
      </div>
    </div>
  );
}
