
import React from 'react';

type MuscleIntensity = Record<string, number>;

const BodyHeatmap = ({ intensity }: { intensity: MuscleIntensity }) => {
  
  const getColor = (sets: number) => {
      if (!sets || sets === 0) return '#1a1a1a'; // Inactive (Dark Gray)
      if (sets < 3) return '#333'; // Low
      if (sets < 6) return '#4d5c00'; // Starting to work
      if (sets < 10) return '#667a00'; // Moderate
      if (sets < 15) return '#99b800'; // High
      return '#ccff00'; // Peak (Volt)
  };

  const getOpacity = (sets: number) => {
      if (!sets || sets === 0) return 1;
      return 1;
  };

  // Organic, Rounded Paths (Hevy Style)
  // ViewBox: 0 0 200 400
  // Uses Quadratic Bezier (Q) for smooth curves and gaps between muscles
  const PATHS = {
      FRONT: {
          HEAD: "M100,15 Q115,15 118,40 Q115,65 100,65 Q85,65 82,40 Q85,15 100,15 Z",
          NECK: "M90,65 Q100,70 110,65 L112,75 Q100,80 88,75 Z",
          TRAPS: "M88,75 L112,75 L125,85 L75,85 Z",
          
          SHOULDERS_L: "M73,85 L45,92 Q38,105 40,115 Q50,118 65,115 Z",
          SHOULDERS_R: "M127,85 L155,92 Q162,105 160,115 Q150,118 135,115 Z",
          
          CHEST_L: "M99,87 L73,87 Q63,105 68,135 L99,135 Z",
          CHEST_R: "M101,87 L127,87 Q137,105 132,135 L101,135 Z",
          
          BICEPS_L: "M40,118 Q35,135 38,150 L60,150 Q63,135 65,118 Z",
          BICEPS_R: "M160,118 Q165,135 162,150 L140,150 Q137,135 135,118 Z",
          
          FOREARMS_L: "M38,153 L32,185 Q45,190 58,185 L60,153 Z",
          FOREARMS_R: "M162,153 L168,185 Q155,190 142,185 L140,153 Z",
          
          ABS: "M70,138 L130,138 Q125,165 120,185 L80,185 Q75,165 70,138 Z",
          OBLIQUES: "M68,138 Q60,160 78,185 L75,195 Q55,170 55,145 Z", // Left Oblique
          
          QUADS_L: "M75,195 L98,195 L95,265 Q70,260 65,230 Q65,210 75,195 Z",
          QUADS_R: "M125,195 L102,195 L105,265 Q130,260 135,230 Q135,210 125,195 Z",
          
          CALVES_L: "M70,275 L92,275 Q90,310 88,340 Q70,330 68,300 Q68,285 70,275 Z",
          CALVES_R: "M130,275 L108,275 Q110,310 112,340 Q130,330 132,300 Q132,285 130,275 Z"
      },
      BACK: {
          HEAD: "M100,15 Q115,15 118,40 Q115,65 100,65 Q85,65 82,40 Q85,15 100,15 Z",
          
          TRAPS_UPPER: "M100,65 L125,80 L100,105 L75,80 Z",
          
          SHOULDERS_L: "M73,82 L45,90 Q40,105 42,115 L65,110 Z",
          SHOULDERS_R: "M127,82 L155,90 Q160,105 158,115 L135,110 Z",
          
          LATS_L: "M70,115 L48,125 Q55,150 65,165 L95,175 L98,115 Z",
          LATS_R: "M130,115 L152,125 Q145,150 135,165 L105,175 L102,115 Z",
          
          TRICEPS_L: "M42,118 Q38,135 40,150 L58,150 Q60,135 63,118 Z",
          TRICEPS_R: "M158,118 Q162,135 160,150 L142,150 Q140,135 137,118 Z",
          
          LOWER_BACK: "M95,178 L105,178 L108,195 L92,195 Z",
          
          GLUTES_L: "M92,198 L65,198 Q60,220 70,235 L95,235 Z",
          GLUTES_R: "M108,198 L135,198 Q140,220 130,235 L105,235 Z",
          
          HAMSTRINGS_L: "M70,240 L95,240 L92,275 L68,275 Z",
          HAMSTRINGS_R: "M130,240 L105,240 L108,275 L132,275 Z",
          
          CALVES_L: "M68,280 L92,280 Q90,310 88,340 Q70,330 68,300 Z",
          CALVES_R: "M132,280 L108,280 Q110,310 112,340 Q130,330 132,300 Z"
      }
  };

  const Muscle = ({ d, muscleKey }: { d: string, muscleKey: string }) => {
      // Mapping Logic
      let sets = 0;
      if (muscleKey === 'CHEST') sets = intensity['Chest'] || 0;
      if (muscleKey === 'BACK' || muscleKey === 'TRAPS' || muscleKey === 'LATS') sets = intensity['Back'] || 0;
      if (muscleKey.includes('SHOULDERS')) sets = intensity['Shoulders'] || 0;
      if (muscleKey.includes('BICEPS') || muscleKey.includes('TRICEPS') || muscleKey.includes('FOREARMS')) sets = intensity['Arms'] || 0;
      if (muscleKey === 'ABS' || muscleKey === 'OBLIQUES' || muscleKey === 'LOWER_BACK') sets = intensity['Core'] || 0;
      if (muscleKey.includes('QUADS') || muscleKey.includes('GLUTES') || muscleKey.includes('HAMSTRINGS') || muscleKey.includes('CALVES')) sets = intensity['Legs'] || 0;

      const color = getColor(sets);
      const opacity = getOpacity(sets);

      return (
          <path 
              d={d} 
              fill={color} 
              stroke="#000" 
              strokeWidth="1.5"
              fillOpacity={opacity}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="transition-all duration-500 hover:brightness-110"
          >
              <title>{muscleKey}</title>
          </path>
      );
  };

  return (
    <div className="w-full bg-[#0a0a0a] border border-[#222] p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4 px-8 border-b border-[#222] pb-2">
            <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest">Anterior</span>
            <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest">Posterior</span>
        </div>
        
        <div className="flex gap-4">
            {/* FRONT VIEW */}
            <svg viewBox="0 0 200 400" className="w-1/2 h-full">
                <g transform="translate(0,10)">
                    <Muscle d={PATHS.FRONT.HEAD} muscleKey="HEAD" />
                    <Muscle d={PATHS.FRONT.NECK} muscleKey="TRAPS" />
                    <Muscle d={PATHS.FRONT.TRAPS} muscleKey="TRAPS" />
                    
                    <Muscle d={PATHS.FRONT.SHOULDERS_L} muscleKey="SHOULDERS" />
                    <Muscle d={PATHS.FRONT.SHOULDERS_R} muscleKey="SHOULDERS" />
                    
                    <Muscle d={PATHS.FRONT.CHEST_L} muscleKey="CHEST" />
                    <Muscle d={PATHS.FRONT.CHEST_R} muscleKey="CHEST" />
                    
                    <Muscle d={PATHS.FRONT.BICEPS_L} muscleKey="BICEPS" />
                    <Muscle d={PATHS.FRONT.BICEPS_R} muscleKey="BICEPS" />
                    <Muscle d={PATHS.FRONT.FOREARMS_L} muscleKey="FOREARMS" />
                    <Muscle d={PATHS.FRONT.FOREARMS_R} muscleKey="FOREARMS" />
                    
                    <Muscle d={PATHS.FRONT.ABS} muscleKey="ABS" />
                    <Muscle d={PATHS.FRONT.OBLIQUES} muscleKey="OBLIQUES" />
                    
                    <Muscle d={PATHS.FRONT.QUADS_L} muscleKey="QUADS" />
                    <Muscle d={PATHS.FRONT.QUADS_R} muscleKey="QUADS" />
                    
                    <Muscle d={PATHS.FRONT.CALVES_L} muscleKey="CALVES" />
                    <Muscle d={PATHS.FRONT.CALVES_R} muscleKey="CALVES" />
                </g>
            </svg>

            {/* BACK VIEW */}
            <svg viewBox="0 0 200 400" className="w-1/2 h-full">
                 <g transform="translate(0,10)">
                    <Muscle d={PATHS.BACK.HEAD} muscleKey="HEAD" />
                    
                    <Muscle d={PATHS.BACK.TRAPS_UPPER} muscleKey="TRAPS" />
                    
                    <Muscle d={PATHS.BACK.SHOULDERS_L} muscleKey="SHOULDERS" />
                    <Muscle d={PATHS.BACK.SHOULDERS_R} muscleKey="SHOULDERS" />
                    
                    <Muscle d={PATHS.BACK.LATS_L} muscleKey="LATS" />
                    <Muscle d={PATHS.BACK.LATS_R} muscleKey="LATS" />
                    
                    <Muscle d={PATHS.BACK.TRICEPS_L} muscleKey="TRICEPS" />
                    <Muscle d={PATHS.BACK.TRICEPS_R} muscleKey="TRICEPS" />
                    
                    <Muscle d={PATHS.BACK.LOWER_BACK} muscleKey="LOWER_BACK" />
                    
                    <Muscle d={PATHS.BACK.GLUTES_L} muscleKey="GLUTES" />
                    <Muscle d={PATHS.BACK.GLUTES_R} muscleKey="GLUTES" />
                    
                    <Muscle d={PATHS.BACK.HAMSTRINGS_L} muscleKey="HAMSTRINGS" />
                    <Muscle d={PATHS.BACK.HAMSTRINGS_R} muscleKey="HAMSTRINGS" />
                    
                    <Muscle d={PATHS.BACK.CALVES_L} muscleKey="CALVES" />
                    <Muscle d={PATHS.BACK.CALVES_R} muscleKey="CALVES" />
                 </g>
            </svg>
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
