import React, { useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';

export interface ToastProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
  duration?: number;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const Toast: React.FC<ToastProps> = ({
  message,
  action,
  onClose,
  duration = 5000,
  type = 'info',
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    info: 'bg-[#111] border-[#333] text-white',
    success: 'bg-[#111] border-primary text-white',
    warning: 'bg-[#111] border-orange-500 text-white',
    error: 'bg-[#111] border-red-500 text-white',
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 border shadow-2xl ${typeStyles[type]}`}
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-mono">{message}</span>
        </div>

        <div className="flex items-center gap-2">
          {action && (
            <button
              onClick={action.onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-black text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
            >
              <RotateCcw size={12} />
              {action.label}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 transition-colors rounded"
            aria-label="Close"
          >
            <X size={16} className="text-[#666]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
