import React, { useState } from 'react';
import { SetType } from '../types';
import { SetTypeIndicator } from './SetTypeBadge';
import { ChevronDown } from 'lucide-react';

interface SetTypeSelectorProps {
  value: SetType;
  onChange: (type: SetType) => void;
  compact?: boolean;
  disabled?: boolean;
}

export const SetTypeSelector: React.FC<SetTypeSelectorProps> = ({
  value,
  onChange,
  compact = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const setTypes: SetType[] = ['N', 'W', 'D', 'F'];

  // Compact mode: dropdown button
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`flex items-center gap-1 px-2 py-1 bg-[#222] border border-[#333] text-[10px] font-bold uppercase text-white transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'
          }`}
        >
          <span>{value}</span>
          <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && !disabled && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown menu */}
            <div className="absolute top-full left-0 mt-1 bg-[#0a0a0a] border border-[#333] z-50 min-w-[120px]">
              {setTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    onChange(type);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-[10px] font-bold uppercase transition-colors ${
                    value === type
                      ? 'bg-primary text-black'
                      : 'text-white hover:bg-[#222]'
                  }`}
                >
                  {type === 'N' && 'Normal'}
                  {type === 'W' && 'Warmup'}
                  {type === 'D' && 'Drop Set'}
                  {type === 'F' && 'Failure'}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full mode: button group
  return (
    <div className="flex gap-1">
      {setTypes.map((type) => (
        <SetTypeIndicator
          key={type}
          type={type}
          isSelected={value === type}
          onClick={() => onChange(type)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default SetTypeSelector;
