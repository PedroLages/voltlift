import React from 'react';
import { CheckCircle2, Save, X } from 'lucide-react';

interface WorkoutCompletionModalProps {
  onFinish: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

export const WorkoutCompletionModal: React.FC<WorkoutCompletionModalProps> = ({
  onFinish,
  onSaveDraft,
  onCancel,
  onDismiss
}) => {
  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-[#111] border-2 border-primary p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-black italic uppercase text-white">Finish Workout?</h2>
          <button onClick={onDismiss} className="text-[#666] hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-[#aaa] font-mono mb-6 leading-relaxed">
          Choose how to save your progress. Finishing completes the workout and updates your stats.
        </p>

        {/* Options */}
        <div className="space-y-3">
          {/* Finish Option */}
          <button
            onClick={onFinish}
            className="w-full bg-primary text-black p-4 font-bold uppercase text-sm hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} />
            Finish & Save
          </button>

          {/* Save Draft Option */}
          <button
            onClick={onSaveDraft}
            className="w-full bg-[#222] text-white p-4 font-bold uppercase text-sm border border-[#444] hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Save as Draft
          </button>

          {/* Discard Option */}
          <button
            onClick={onCancel}
            className="w-full bg-transparent text-red-500 p-4 font-bold uppercase text-sm border border-red-500/30 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <X size={18} />
            Discard Workout
          </button>
        </div>

        {/* Help Text */}
        <p className="text-[10px] text-[#666] font-mono uppercase mt-4 text-center">
          Draft workouts can be resumed later from your dashboard
        </p>
      </div>
    </div>
  );
};

export default WorkoutCompletionModal;
