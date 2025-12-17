
import React from 'react';

type MuscleIntensity = Record<string, number>;

const BodyHeatmap = ({ intensity }: { intensity: MuscleIntensity }) => {
  // Calculate total sets for each major muscle region
  const chestSets = (intensity['Chest'] || 0);
  const backSets = (intensity['Back'] || 0);
  const shouldersSets = (intensity['Shoulders'] || 0);
  const armsSets = (intensity['Arms'] || 0);
  const coreSets = (intensity['Core'] || 0);
  const legsSets = (intensity['Legs'] || 0);

  // Get intensity level and color (iOS-compatible approach)
  const getIntensityStyle = (sets: number) => {
    if (!sets || sets === 0) return { bg: 'bg-[#1a1a1a]', label: 'Rested' };
    if (sets < 3) return { bg: 'bg-[#333333]', label: 'Light' };
    if (sets < 6) return { bg: 'bg-[#4d5c00]', label: 'Moderate' };
    if (sets < 10) return { bg: 'bg-[#667a00]', label: 'Heavy' };
    if (sets < 15) return { bg: 'bg-[#99b800]', label: 'Intense' };
    return { bg: 'bg-[#ccff00]', label: 'Peak' };
  };

  // Define muscle regions with their set counts
  const muscleRegions = [
    { name: 'Chest', sets: chestSets, position: 'front' },
    { name: 'Shoulders', sets: shouldersSets, position: 'both' },
    { name: 'Arms', sets: armsSets, position: 'both' },
    { name: 'Core', sets: coreSets, position: 'front' },
    { name: 'Back', sets: backSets, position: 'back' },
    { name: 'Legs', sets: legsSets, position: 'both' },
  ];

  return (
    <div className="w-full bg-[#0a0a0a] border border-[#222] p-4">
      <div className="flex justify-between items-center mb-4 px-8 border-b border-[#222] pb-2">
        <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest">Anterior</span>
        <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest">Posterior</span>
      </div>

      <div className="flex gap-4">
        {/* FRONT VIEW - Simple img tag for iOS compatibility */}
        <div className="w-1/2 relative" style={{ aspectRatio: '368/549' }}>
          <img
            src="/anatomy-front.svg"
            alt="Anterior anatomy"
            className="w-full h-full object-contain"
          />
        </div>

        {/* BACK VIEW - Simple img tag for iOS compatibility */}
        <div className="w-1/2 relative" style={{ aspectRatio: '384/573' }}>
          <img
            src="/anatomy-back.svg"
            alt="Posterior anatomy"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Muscle Intensity List */}
      <div className="mt-4 space-y-2 border-t border-[#222] pt-4">
        {muscleRegions.map((region) => {
          const style = getIntensityStyle(region.sets);
          return (
            <div key={region.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 ${style.bg} ${region.sets === 0 ? 'border border-[#333]' : ''}`}></div>
                <span className="text-xs font-bold uppercase text-white">{region.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#666] font-mono uppercase">{style.label}</span>
                <span className="text-xs font-black text-primary">{region.sets} sets</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 border-t border-[#222] pt-3">
        <div className="flex items-center gap-1 text-[8px] text-[#666] uppercase font-mono">
          <div className="w-2 h-2 rounded-full bg-[#ccff00]"></div> 15+ Sets
        </div>
        <div className="flex items-center gap-1 text-[8px] text-[#666] uppercase font-mono">
          <div className="w-2 h-2 rounded-full bg-[#667a00]"></div> 5-10 Sets
        </div>
        <div className="flex items-center gap-1 text-[8px] text-[#666] uppercase font-mono">
          <div className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#333]"></div> Rested
        </div>
      </div>
    </div>
  );
};

export default BodyHeatmap;
