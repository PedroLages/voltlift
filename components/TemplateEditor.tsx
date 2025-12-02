import React, { useState, useEffect } from 'react';
import { WorkoutSession } from '../types';
import { EXERCISE_LIBRARY } from '../constants';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { useStore } from '../store/useStore';

interface TemplateEditorProps {
  template: WorkoutSession;
  onClose: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onClose }) => {
  const { updateTemplate } = useStore();
  const [templateName, setTemplateName] = useState(template.name);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>(
    template.logs.map(log => log.exerciseId)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const filteredExercises = EXERCISE_LIBRARY.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedExerciseIds.includes(ex.id)
  );

  const handleAddExercise = (exerciseId: string) => {
    setSelectedExerciseIds([...selectedExerciseIds, exerciseId]);
    setSearchTerm('');
    setShowExercisePicker(false);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExerciseIds(selectedExerciseIds.filter((_, i) => i !== index));
  };

  const handleMoveExercise = (from: number, to: number) => {
    const newList = [...selectedExerciseIds];
    const [removed] = newList.splice(from, 1);
    newList.splice(to, 0, removed);
    setSelectedExerciseIds(newList);
  };

  const handleSave = () => {
    if (templateName.trim() && selectedExerciseIds.length > 0) {
      updateTemplate(template.id, templateName, selectedExerciseIds);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-[#111] w-full max-w-2xl max-h-[85vh] flex flex-col border border-[#333] shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
          <div className="flex-1">
            <h2 className="volt-header text-xl text-white mb-2">EDIT PROTOCOL</h2>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full bg-[#222] text-white px-3 py-2 text-sm font-bold uppercase border border-[#333] focus:border-primary outline-none"
              placeholder="Protocol Name"
            />
          </div>
          <button onClick={onClose} className="text-white hover:text-primary ml-4">
            <X size={24} />
          </button>
        </div>

        {/* Exercise List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-[#888] uppercase tracking-widest">
              {selectedExerciseIds.length} Movements
            </h3>
            <button
              onClick={() => setShowExercisePicker(!showExercisePicker)}
              className="flex items-center gap-2 bg-primary text-black px-3 py-1.5 text-xs font-bold uppercase hover:bg-white transition-colors"
            >
              <Plus size={14} /> Add Exercise
            </button>
          </div>

          {/* Exercise Picker */}
          {showExercisePicker && (
            <div className="bg-[#0a0a0a] border border-[#333] p-3 mb-4">
              <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#666]" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full bg-[#222] text-white pl-9 pr-3 py-2 text-sm border border-[#444] focus:border-primary outline-none"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredExercises.slice(0, 20).map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => handleAddExercise(ex.id)}
                    className="w-full text-left px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] hover:border-l-2 hover:border-primary transition-all text-sm text-white"
                  >
                    <div className="font-bold">{ex.name}</div>
                    <div className="text-[10px] text-[#666] uppercase">
                      {ex.muscleGroup} • {ex.equipment}
                    </div>
                  </button>
                ))}
                {filteredExercises.length === 0 && (
                  <div className="text-center py-4 text-[#666] text-sm">
                    No exercises found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Exercises */}
          <div className="space-y-2">
            {selectedExerciseIds.map((exId, index) => {
              const exercise = EXERCISE_LIBRARY.find(e => e.id === exId);
              if (!exercise) return null;

              return (
                <div
                  key={`${exId}-${index}`}
                  className="bg-[#0a0a0a] border-l-4 border-primary p-3 flex justify-between items-center group"
                >
                  <div className="flex-1">
                    <h4 className="text-white font-bold uppercase text-sm">{exercise.name}</h4>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] text-[#666] uppercase">{exercise.muscleGroup}</span>
                      <span className="text-[10px] text-[#666] uppercase">{exercise.equipment}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Move Up */}
                    {index > 0 && (
                      <button
                        onClick={() => handleMoveExercise(index, index - 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#444] hover:text-primary hover:bg-[#1a1a1a] rounded transition-colors"
                      >
                        ↑
                      </button>
                    )}

                    {/* Move Down */}
                    {index < selectedExerciseIds.length - 1 && (
                      <button
                        onClick={() => handleMoveExercise(index, index + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#444] hover:text-primary hover:bg-[#1a1a1a] rounded transition-colors"
                      >
                        ↓
                      </button>
                    )}

                    {/* Remove */}
                    <button
                      onClick={() => handleRemoveExercise(index)}
                      className="w-8 h-8 flex items-center justify-center text-[#444] hover:text-red-500 hover:bg-[#1a0000] rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {selectedExerciseIds.length === 0 && (
              <div className="text-center py-8 text-[#666]">
                <p className="text-sm uppercase font-mono">No exercises added</p>
                <p className="text-xs mt-2">Click "Add Exercise" to start building your protocol</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333] bg-[#0a0a0a] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-[#222] text-white py-3 font-bold uppercase tracking-wider hover:bg-[#333] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!templateName.trim() || selectedExerciseIds.length === 0}
            className="flex-1 bg-primary text-black py-3 font-black italic uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Protocol
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
