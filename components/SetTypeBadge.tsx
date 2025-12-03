import React from 'react';
import { Flame, TrendingDown, Dumbbell } from 'lucide-react';
import { SetType } from '../types';

interface SetTypeBadgeProps {
  type: SetType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const SetTypeBadge: React.FC<SetTypeBadgeProps> = ({
  type,
  size = 'sm',
  showLabel = false
}) => {
  // Normal sets don't need a badge
  if (type === 'N') {
    return null;
  }

  const sizeClasses = {
    sm: 'text-[8px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-1',
    lg: 'text-xs px-3 py-1.5'
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  const badges = {
    W: {
      label: 'Warmup',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      icon: <Dumbbell size={iconSizes[size]} className="text-blue-400" />
    },
    D: {
      label: 'Drop Set',
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      icon: <TrendingDown size={iconSizes[size]} className="text-orange-400" />
    },
    F: {
      label: 'Failure',
      color: 'bg-red-500/20 text-red-400 border-red-500/50',
      icon: <Flame size={iconSizes[size]} className="text-red-400" />
    }
  };

  const badge = badges[type];

  return (
    <div
      className={`inline-flex items-center gap-1 font-bold uppercase border ${badge.color} ${sizeClasses[size]}`}
      title={badge.label}
    >
      {badge.icon}
      {showLabel && <span>{type}</span>}
    </div>
  );
};

// Type indicator for set type selector
interface SetTypeIndicatorProps {
  type: SetType;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const SetTypeIndicator: React.FC<SetTypeIndicatorProps> = ({
  type,
  isSelected,
  onClick,
  disabled = false
}) => {
  const typeConfig = {
    N: {
      label: 'Normal',
      shortLabel: 'N',
      color: 'bg-[#333] text-white border-[#444]',
      selectedColor: 'bg-primary text-black border-primary',
      icon: null
    },
    W: {
      label: 'Warmup',
      shortLabel: 'W',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      selectedColor: 'bg-blue-500 text-white border-blue-500',
      icon: <Dumbbell size={14} />
    },
    D: {
      label: 'Drop',
      shortLabel: 'D',
      color: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      selectedColor: 'bg-orange-500 text-white border-orange-500',
      icon: <TrendingDown size={14} />
    },
    F: {
      label: 'Failure',
      shortLabel: 'F',
      color: 'bg-red-500/10 text-red-400 border-red-500/30',
      selectedColor: 'bg-red-500 text-white border-red-500',
      icon: <Flame size={14} />
    }
  };

  const config = typeConfig[type];
  const colorClass = isSelected ? config.selectedColor : config.color;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1 px-3 py-2 border text-[10px] font-bold uppercase transition-all ${colorClass} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
      }`}
      title={config.label}
    >
      {config.icon}
      <span>{config.shortLabel}</span>
    </button>
  );
};

export default SetTypeBadge;
