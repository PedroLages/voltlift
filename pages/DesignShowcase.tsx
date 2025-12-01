import React, { useState } from 'react';
import Landing1 from './landings/Landing1';
import Landing2 from './landings/Landing2';
import Landing3 from './landings/Landing3';
import Landing4 from './landings/Landing4';
import Landing5 from './landings/Landing5';
import { Palette, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DesignShowcase = () => {
  const [variant, setVariant] = useState(1);
  const navigate = useNavigate();

  const renderVariant = () => {
    switch(variant) {
      case 1: return <Landing1 />;
      case 2: return <Landing2 />;
      case 3: return <Landing3 />;
      case 4: return <Landing4 />;
      case 5: return <Landing5 />;
      default: return <Landing1 />;
    }
  };

  const getVariantName = (v: number) => {
    switch(v) {
      case 1: return "Emerald Prime (Current)";
      case 2: return "Midnight Pulse";
      case 3: return "Raw Iron";
      case 4: return "Volt";
      case 5: return "Zen Strength";
      default: return "";
    }
  };

  return (
    <div className="relative">
      {/* Design Switcher Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-900 border-b border-neutral-800 p-2 flex items-center justify-between overflow-x-auto shadow-xl">
        <div className="flex gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 border-r border-neutral-700 mr-2 text-white font-bold">
            <Palette size={16} />
            <span className="hidden sm:inline">Design Lab</span>
          </div>
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${variant === v ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
            >
              {v}. {getVariantName(v).split(' ')[0]}
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/')} className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded ml-2 shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Render Selected Landing Page */}
      <div className="pt-14 min-h-screen">
        {renderVariant()}
      </div>
    </div>
  );
};

export default DesignShowcase;