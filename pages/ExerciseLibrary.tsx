import React, { useState } from 'react';
import { EXERCISE_LIBRARY } from '../constants';
import { Search, Filter, X, Play, AlertCircle, Info, ScanFace, Sparkles } from 'lucide-react';
import { Exercise } from '../types';
import { generateExerciseVisual } from '../services/geminiService';
import { useStore } from '../store/useStore';

const ExerciseLibrary = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualSize, setVisualSize] = useState<'1K' | '2K' | '4K'>('1K');
  
  const { customExerciseVisuals, saveExerciseVisual } = useStore();

  const filteredExercises = EXERCISE_LIBRARY.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter ? ex.muscleGroup === filter : true;
    return matchesSearch && matchesFilter;
  });

  const uniqueGroups = Array.from(new Set(EXERCISE_LIBRARY.map(e => e.muscleGroup)));

  const handleGenerateVisual = async (name: string, id: string) => {
    // API Key Check for Paid Model
    const w = window as any;
    if (w.aistudio && w.aistudio.hasSelectedApiKey) {
        const hasKey = await w.aistudio.hasSelectedApiKey();
        if (!hasKey && w.aistudio.openSelectKey) {
            await w.aistudio.openSelectKey();
        }
    }

    setIsGenerating(true);
    const result = await generateExerciseVisual(name, visualSize);
    if (result) {
        saveExerciseVisual(id, result);
    } else {
        alert("Unable to generate visual. Check API Key configuration.");
    }
    setIsGenerating(false);
  };

  const closeSelection = () => {
      setSelectedExercise(null);
      setIsGenerating(false);
  }

  // Determine which image to show for the selected exercise
  const getDisplayImage = (ex: Exercise) => {
      return customExerciseVisuals[ex.id] || ex.gifUrl;
  };

  const hasCustomVisual = (ex: Exercise) => !!customExerciseVisuals[ex.id];

  return (
    <div className="p-6 pb-20">
      <h1 className="text-4xl volt-header mb-6">DATABASE</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" size={20} />
        <input 
          type="text"
          placeholder="SEARCH DATABASE..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111] border border-[#333] py-4 pl-12 pr-4 text-white font-bold uppercase tracking-wide focus:border-primary outline-none placeholder-[#444]"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-2">
        <button 
          onClick={() => setFilter(null)}
          className={`px-5 py-2 text-xs font-black italic uppercase tracking-wider whitespace-nowrap transition-all skew-x-[-10deg] ${!filter ? 'bg-primary text-black' : 'bg-[#222] text-[#666]'}`}
        >
          <span className="skew-x-[10deg] inline-block">ALL</span>
        </button>
        {uniqueGroups.map(group => (
          <button 
            key={group}
            onClick={() => setFilter(filter === group ? null : group)}
            className={`px-5 py-2 text-xs font-black italic uppercase tracking-wider whitespace-nowrap transition-all skew-x-[-10deg] ${filter === group ? 'bg-primary text-black' : 'bg-[#222] text-[#666]'}`}
          >
            <span className="skew-x-[10deg] inline-block">{group}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredExercises.map(ex => (
          <button 
            key={ex.id} 
            onClick={() => setSelectedExercise(ex)}
            className="w-full text-left bg-[#111] p-5 border-l-2 border-[#333] flex justify-between items-center hover:border-primary hover:bg-[#161616] transition-all group"
          >
             <div>
                <h3 className="font-bold text-white uppercase tracking-tight group-hover:italic">{ex.name}</h3>
                <p className="text-[10px] text-[#666] font-mono mt-1 uppercase">{ex.muscleGroup} // {ex.equipment}</p>
             </div>
             <div className="flex items-center gap-2">
                {customExerciseVisuals[ex.id] && <Sparkles size={12} className="text-primary" />}
                <div className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                ex.difficulty === 'Beginner' ? 'text-primary' :
                ex.difficulty === 'Intermediate' ? 'text-white' :
                'text-red-500'
                }`}>
                {ex.difficulty}
                </div>
             </div>
          </button>
        ))}
        
        {filteredExercises.length === 0 && (
          <div className="text-center py-12 text-[#444] font-mono uppercase">
            No data found.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111] w-full max-w-lg h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden animate-slide-up border-t border-[#333]">
            
            {/* Modal Header */}
            <div className="relative h-48 bg-[#222] shrink-0 border-b border-[#333]">
               {/* Background Texture */}
               <img src={getDisplayImage(selectedExercise)} alt={selectedExercise.name} className="w-full h-full object-cover opacity-20 grayscale" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/50 to-transparent" />
               
               <button 
                onClick={closeSelection}
                className="absolute top-4 right-4 w-10 h-10 bg-black flex items-center justify-center text-white border border-[#333] hover:border-primary z-20"
               >
                 <X size={24} />
               </button>
               
               <div className="absolute bottom-6 left-6 right-6 z-10">
                 <h2 className="text-3xl volt-header text-white leading-none mb-2 drop-shadow-lg">{selectedExercise.name}</h2>
                 <div className="flex gap-2">
                   <span className="px-2 py-1 bg-primary text-black text-[10px] font-black uppercase italic">{selectedExercise.category}</span>
                   <span className="px-2 py-1 bg-black border border-[#333] text-white text-[10px] font-bold uppercase tracking-wider">{selectedExercise.difficulty}</span>
                 </div>
               </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Visual Demonstration Section */}
              <section>
                <div className="flex justify-between items-end mb-4">
                     <h3 className="flex items-center gap-2 font-black italic uppercase text-lg text-white">
                        <ScanFace size={18} fill="currentColor" className="text-[#666]" /> Motion Guide
                     </h3>
                     {!hasCustomVisual(selectedExercise) && (
                         <div className="flex gap-2">
                             <select 
                                value={visualSize} 
                                onChange={(e) => setVisualSize(e.target.value as any)}
                                disabled={isGenerating}
                                className="bg-[#222] text-[10px] text-white border border-[#333] px-2 py-1 outline-none font-mono uppercase focus:border-primary disabled:opacity-50"
                             >
                                <option value="1K">1K RES</option>
                                <option value="2K">2K RES</option>
                                <option value="4K">4K RES</option>
                             </select>
                             <button 
                                onClick={() => handleGenerateVisual(selectedExercise.name, selectedExercise.id)}
                                disabled={isGenerating}
                                className="text-[10px] bg-[#222] hover:bg-[#333] text-primary px-3 py-1 font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-colors"
                             >
                                {isGenerating ? <Sparkles size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                {isGenerating ? 'Rendering...' : 'AI Blueprint'}
                             </button>
                         </div>
                     )}
                </div>

                <div className="w-full aspect-video bg-black border border-[#333] relative overflow-hidden group">
                    {/* Primary Visual */}
                    <img 
                        src={getDisplayImage(selectedExercise)} 
                        alt="Demonstration" 
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isGenerating ? 'opacity-50' : 'opacity-100'}`} 
                    />
                    
                    {/* Play Overlay (Only for GIF) */}
                    {!hasCustomVisual(selectedExercise) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-transparent transition-colors cursor-pointer">
                            <div className="w-12 h-12 bg-primary text-black flex items-center justify-center rounded-sm shadow-[0_0_20px_rgba(204,255,0,0.5)]">
                                <Play size={24} fill="currentColor" />
                            </div>
                        </div>
                    )}

                    {/* AI Label */}
                    {hasCustomVisual(selectedExercise) && (
                        <div className="absolute top-2 left-2 bg-primary text-black text-[10px] font-black px-2 py-0.5 uppercase italic">
                            Gemini Generated
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-[#666] mt-2 font-mono uppercase text-right">
                    {hasCustomVisual(selectedExercise) ? 'AI generated schematic may vary from actual form.' : 'Video placeholder active.'}
                </p>
              </section>

              {/* Form Guide */}
              <section>
                <h3 className="flex items-center gap-2 font-black italic uppercase text-lg mb-4 text-primary">
                  <Play size={18} fill="currentColor" /> Execution
                </h3>
                <div className="space-y-4 relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#222]"></div>
                  {selectedExercise.formGuide.map((step, i) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className="w-4 h-4 rounded-full bg-[#333] border-2 border-[#111] shrink-0 z-10"></div>
                      <p className="text-sm text-[#ccc] leading-relaxed uppercase font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Common Mistakes */}
              {selectedExercise.commonMistakes.length > 0 && (
                <section className="bg-[#1a0000] border border-red-900/30 p-4">
                  <h3 className="flex items-center gap-2 font-black italic uppercase text-lg mb-3 text-red-500">
                    <AlertCircle size={18} /> Errors
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {selectedExercise.commonMistakes.map((m, i) => (
                      <li key={i} className="flex gap-3 text-red-200/70">
                        <span className="text-red-500 font-bold">X</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Tips */}
              {selectedExercise.tips.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-2 font-black italic uppercase text-lg mb-3 text-blue-400">
                    <Info size={18} /> Pro Tips
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {selectedExercise.tips.map((t, i) => (
                      <li key={i} className="bg-[#111] border-l-2 border-blue-500 p-3 text-[#aaa]">
                        {t}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Muscles Worked */}
              <section className="pt-4 border-t border-[#222]">
                <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3">Target Muscles</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#333] text-white text-xs font-bold uppercase">{selectedExercise.muscleGroup} (Primary)</span>
                  {selectedExercise.secondaryMuscles?.map(m => (
                    <span key={m} className="px-3 py-1 bg-[#1a1a1a] border border-[#333] text-[#888] text-xs font-bold uppercase">{m}</span>
                  ))}
                </div>
              </section>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;