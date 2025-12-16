import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  summary?: string;
  badge?: string;
  tier?: 'high' | 'medium' | 'low';
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = false,
  summary,
  badge,
  tier = 'medium'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const tierStyles = {
    high: 'border-l-4 border-primary bg-primary/5',
    medium: 'border border-[#222]',
    low: 'border border-[#333]'
  };

  const headerStyles = {
    high: 'text-sm font-black italic text-white',
    medium: 'text-xs font-bold text-[#999]',
    low: 'text-[10px] font-bold text-[#666]'
  };

  return (
    <section className={`mb-12 ${tierStyles[tier]} bg-[#111] overflow-hidden transition-all duration-300`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} section`}
      >
        <div className="flex items-center gap-3">
          {tier === 'high' && <div className="w-1 h-6 bg-primary" />}
          {icon}
          <div className="text-left">
            <h3 className={`${headerStyles[tier]} uppercase tracking-wider flex items-center gap-2`}>
              {title}
              {badge && (
                <span className="px-2 py-0.5 bg-primary/20 border border-primary/30 text-primary text-[9px] font-bold uppercase">
                  {badge}
                </span>
              )}
            </h3>
            {summary && !isExpanded && (
              <p className="text-[10px] text-[#666] mt-1 font-mono">{summary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp size={20} className="text-primary" />
          ) : (
            <ChevronDown size={20} className="text-[#666]" />
          )}
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 pt-0 space-y-4">
          {children}
        </div>
      </div>
    </section>
  );
};

export default CollapsibleSection;
