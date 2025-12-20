import { X, RefreshCw, Dumbbell, Check, ChevronRight } from 'lucide-react';
import { Exercise } from '../types';

interface SmartSwapModalProps {
  currentExercise: Exercise;
  suggestedExercise: Exercise;
  allSuggestions: Exercise[];
  onConfirm: (exerciseId: string) => void;
  onCancel: () => void;
  onViewAll: () => void;
}

export const SmartSwapModal = ({
  currentExercise,
  suggestedExercise,
  allSuggestions,
  onConfirm,
  onCancel,
  onViewAll,
}: SmartSwapModalProps) => {
  return (
    <div
      className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center animate-fade-in backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#0a0a0a] w-full max-w-sm border-2 border-primary/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#111]">
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className="text-primary" />
            <h2 className="volt-header text-lg text-white">SMART SWAP</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-[#666] hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current Exercise */}
          <div className="bg-[#111] border border-[#333] p-3">
            <div className="text-[10px] text-[#666] uppercase tracking-wider mb-2">
              Current Movement
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#222] flex items-center justify-center border border-[#333]">
                <Dumbbell size={18} className="text-[#666]" />
              </div>
              <div>
                <h3 className="font-bold text-white uppercase italic">
                  {currentExercise.name}
                </h3>
                <p className="text-[10px] text-[#666] font-mono">
                  {currentExercise.muscleGroup} • {currentExercise.equipment}
                </p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-primary/20 border border-primary/50 flex items-center justify-center rotate-90">
              <ChevronRight size={18} className="text-primary" />
            </div>
          </div>

          {/* Suggested Exercise */}
          <div className="bg-primary/10 border-2 border-primary/50 p-3">
            <div className="text-[10px] text-primary uppercase tracking-wider mb-2 font-bold">
              Suggested Replacement
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 flex items-center justify-center border border-primary/50">
                <Dumbbell size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white uppercase italic">
                  {suggestedExercise.name}
                </h3>
                <p className="text-[10px] text-[#999] font-mono">
                  {suggestedExercise.muscleGroup} • {suggestedExercise.equipment}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase bg-primary/20 px-2 py-1">
                <Check size={12} />
                Match
              </div>
            </div>
          </div>

          {/* Other Options Notice */}
          {allSuggestions.length > 1 && (
            <button
              onClick={onViewAll}
              className="w-full py-2 text-[11px] text-[#666] hover:text-primary transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>+{allSuggestions.length - 1} other options available</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[#333] space-y-2">
          <button
            onClick={() => onConfirm(suggestedExercise.id)}
            className="w-full py-4 bg-primary text-black font-black uppercase italic tracking-widest text-sm hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Confirm Swap
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-[#111] text-[#666] font-bold uppercase tracking-wider text-xs hover:bg-[#222] hover:text-white transition-colors border border-[#333]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
