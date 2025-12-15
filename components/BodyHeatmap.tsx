
import React, { useEffect, useRef } from 'react';

type MuscleIntensity = Record<string, number>;

const BodyHeatmap = ({ intensity }: { intensity: MuscleIntensity }) => {
  const anteriorSvgRef = useRef<HTMLObjectElement>(null);
  const posteriorSvgRef = useRef<HTMLObjectElement>(null);

  // Calculate total sets for each major muscle region
  const chestSets = (intensity['Chest'] || 0);
  const backSets = (intensity['Back'] || 0);
  const shouldersSets = (intensity['Shoulders'] || 0);
  const armsSets = (intensity['Arms'] || 0);
  const coreSets = (intensity['Core'] || 0);
  const legsSets = (intensity['Legs'] || 0);

  // Get solid color based on set count (for SVG fills)
  const getSolidColor = (sets: number) => {
    if (!sets || sets === 0) return '#1a1a1a'; // Inactive
    if (sets < 3) return '#333333';
    if (sets < 6) return '#4d5c00';
    if (sets < 10) return '#667a00';
    if (sets < 15) return '#99b800';
    return '#ccff00'; // Peak volt
  };

  // Apply colors to anterior SVG muscle groups
  useEffect(() => {
    const svgObject = anteriorSvgRef.current;
    if (!svgObject) return;

    const applyColors = () => {
      try {
        const svgDoc = svgObject.contentDocument;
        if (!svgDoc) return;

        // Map muscle groups to intensity data
        const muscleMap: Record<string, number> = {
          'CHEST': chestSets,
          'UPER_CHEST': chestSets, // Note: typo in SVG
          'DELTOIDS_ANTERIOR': shouldersSets,
          'DELTOIDS_EXTERIOR': shouldersSets,
          'TRAPEZIUS_UPPER': shouldersSets,
          'BICEPS': armsSets,
          'FOREARMS': armsSets,
          'ABS_UPPER': coreSets,
          'ABS_MIDDLE': coreSets,
          'ABS_LOWER': coreSets,
          'OBLIQUES': coreSets,
          'QUADS': legsSets,
          'CALVES_FRONT': legsSets,
          'NECK': 0, // Neck not tracked
        };

        // Apply colors to each muscle group
        Object.entries(muscleMap).forEach(([muscleId, sets]) => {
          const element = svgDoc.getElementById(muscleId);
          if (element) {
            const color = getSolidColor(sets);
            // Apply to all paths within the group
            const paths = element.querySelectorAll('path, polygon, rect, circle, ellipse');
            paths.forEach((path) => {
              (path as SVGElement).style.fill = color;
              (path as SVGElement).style.transition = 'fill 0.5s ease';
            });
            // Also try setting fill on the group itself
            element.style.fill = color;
          }
        });
      } catch (error) {
        console.error('Error applying colors to anterior SVG:', error);
      }
    };

    // Wait for SVG to load
    svgObject.addEventListener('load', applyColors);
    applyColors(); // Try immediately in case already loaded

    return () => {
      svgObject.removeEventListener('load', applyColors);
    };
  }, [chestSets, shouldersSets, armsSets, coreSets, legsSets]);

  // Apply colors to posterior SVG muscle groups
  useEffect(() => {
    const svgObject = posteriorSvgRef.current;
    if (!svgObject) return;

    const applyColors = () => {
      try {
        const svgDoc = svgObject.contentDocument;
        if (!svgDoc) return;

        // Map muscle groups to intensity data
        const muscleMap: Record<string, number> = {
          'SHOULDERS_BACK': shouldersSets,
          'TRAPS': backSets,
          'LATS': backSets,
          'TRICEPS': armsSets,
          'LOWER_BACK': coreSets,
          'GLUTES': legsSets,
          'HAMSTRINGS': legsSets,
          'CALVES_BACK': legsSets,
        };

        // Apply colors to each muscle group
        Object.entries(muscleMap).forEach(([muscleId, sets]) => {
          const element = svgDoc.getElementById(muscleId);
          if (element) {
            const color = getSolidColor(sets);
            // Apply to all paths within the group
            const paths = element.querySelectorAll('path, polygon, rect, circle, ellipse');
            paths.forEach((path) => {
              (path as SVGElement).style.fill = color;
              (path as SVGElement).style.transition = 'fill 0.5s ease';
            });
            // Also try setting fill on the group itself
            element.style.fill = color;
          }
        });
      } catch (error) {
        console.error('Error applying colors to SVG:', error);
      }
    };

    // Wait for SVG to load
    svgObject.addEventListener('load', applyColors);
    applyColors(); // Try immediately in case already loaded

    return () => {
      svgObject.removeEventListener('load', applyColors);
    };
  }, [shouldersSets, backSets, armsSets, coreSets, legsSets]);

  return (
    <div className="w-full bg-[#0a0a0a] border border-[#222] p-4 rounded">
      <div className="flex justify-between items-center mb-4 px-8 border-b border-[#222] pb-2">
        <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest">Anterior</span>
        <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest">Posterior</span>
      </div>

      <div className="flex gap-4">
        {/* FRONT VIEW - Premium Named SVG */}
        <div className="w-1/2 relative" style={{ aspectRatio: '368/549' }}>
          <object
            ref={anteriorSvgRef}
            data="/anatomy-front.svg"
            type="image/svg+xml"
            className="w-full h-full object-contain pointer-events-none"
            aria-label="Anterior anatomy"
          >
            <img src="/anatomy-front.svg" alt="Anterior anatomy fallback" />
          </object>
        </div>

        {/* BACK VIEW - Premium Named SVG */}
        <div className="w-1/2 relative" style={{ aspectRatio: '384/573' }}>
          {/* Premium vectorized anatomy with named muscle groups */}
          <object
            ref={posteriorSvgRef}
            data="/anatomy-back.svg"
            type="image/svg+xml"
            className="w-full h-full object-contain pointer-events-none"
            aria-label="Posterior anatomy"
          >
            <img src="/anatomy-back.svg" alt="Posterior anatomy fallback" />
          </object>
        </div>
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
