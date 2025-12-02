import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#111] border border-[#222] rounded">
      <div className="mb-4 p-4 rounded-full bg-[#1a1a1a] border border-[#333]">
        <Icon size={32} className="text-[#444]" />
      </div>

      <h3 className="text-white font-bold uppercase text-sm mb-2 tracking-wide">
        {title}
      </h3>

      <p className="text-[#666] text-xs font-mono max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex gap-3 w-full max-w-sm">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="flex-1 bg-primary text-black py-3 px-4 font-black italic uppercase tracking-wider hover:bg-white transition-colors text-sm"
            >
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="flex-1 bg-[#222] text-white py-3 px-4 font-bold uppercase tracking-wider hover:bg-[#333] transition-colors text-sm"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
