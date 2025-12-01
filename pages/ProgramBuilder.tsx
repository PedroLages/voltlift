import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY } from '../constants';
import { ArrowLeft, Plus, X, Save, Trash2 } from 'lucide-react';

const ProgramBuilder = () => {
  const navigate = useNavigate();
  const { saveTemplate } = useStore();
  
  const [name, setName] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return alert("PROTOCOL NAME REQUIRED");
    if (selectedExerciseIds.length === 0) return alert("NO MOVEMENTS SELECTED");
    
    saveTemplate(name, selectedExerciseIds);
    navigate('/');
  };

  const removeExercise = (index: number) => {
    const newIds = [...selectedExerciseIds];
    newIds.splice(index, 1);
    setSelectedExerciseIds(newIds);
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/')} className="text-[#666] hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="volt-header text-2xl text-white">NEW PROTOCOL</h1>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Form */}
      <div className="space-y-8">
        <div>
          <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">Protocol Identity</label>
          <input 
            type="text" 
            placeholder="E.G. LEG DAY HYPERTROPHY"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#111] border-b-2 border-[#333] py-4 px-2 text-xl font-bold uppercase text-white focus:border-primary outline-none placeholder-[#333]"
          />
        </div>

        <div>
           <div className="flex justify-between items-end mb-2">
               <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest block">Sequence</label>
               <span className="text-[10px] text-[#444] font-mono">{selectedExerciseIds.length} MOVEMENTS</span>
           </div>
           
           <div className="space-y-2 mb-4">
               {selectedExerciseIds.map((exId, index) => {
                   const ex = EXERCISE_LIBRARY.find(e => e.id === exId);
                   return (
                       <div key={index} className="bg-[#111] p-4 border border-[#222] flex justify-between items-center group">
                           <div className="flex items-center gap-4">
                               <span className="text-[#333] font-black italic text-lg">{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                               <div>
                                   <h4 className="font-bold text-white uppercase">{ex?.name}</h4>
                                   <span className="text-[10px] text-[#666] font-mono">{ex?.muscleGroup}</span>
                               </div>
                           </div>
                           <button onClick={() => removeExercise(index)} className="text-[#444] hover:text-red-500 transition-colors">
                               <Trash2 size={18} />
                           </button>
                       </div>
                   );
               })}
               
               {selectedExerciseIds.length === 0 && (
                   <div className="text-center py-8 border border-dashed border-[#333] text-[#444] uppercase text-xs font-bold tracking-widest">
                       No data assigned
                   </div>
               )}
           </div>

           <button 
             onClick={() => setShowSelector(true)}
             className="w-full py-4 border border-[#333] bg-[#0a0a0a] text-primary font-bold uppercase tracking-widest hover:bg-[#111] transition-colors flex items-center justify-center gap-2"
           >
             <Plus size={18} /> Add Movement
           </button>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 left-6 right-6 z-30">
          <button 
            onClick={handleSave}
            className="w-full bg-primary text-black py-4 font-black italic uppercase tracking-wider text-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            <Save size={20} /> Commit
          </button>
      </div>

      {/* Exercise Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-fade-in">
            <div className="p-6 border-b border-[#333] flex justify-between items-center bg-black">
                <h2 className="volt-header text-xl">DATABASE</h2>
                <button onClick={() => setShowSelector(false)} className="text-white"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {EXERCISE_LIBRARY.map(ex => (
                    <button
                        key={ex.id}
                        onClick={() => {
                            setSelectedExerciseIds([...selectedExerciseIds, ex.id]);
                            setShowSelector(false);
                        }}
                        className="w-full text-left p-4 hover:bg-[#111] flex justify-between items-center group border-b border-[#222]"
                    >
                        <div>
                            <h4 className="font-bold text-white uppercase italic group-hover:text-primary transition-colors">{ex.name}</h4>
                            <span className="text-[10px] text-[#666] font-mono">{ex.muscleGroup}</span>
                        </div>
                        <Plus size={18} className="text-[#444]" />
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ProgramBuilder;