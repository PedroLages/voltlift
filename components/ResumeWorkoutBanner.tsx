import React from 'react';
import { Play, X, Clock } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface ResumeWorkoutBannerProps {
  draftWorkout: {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
  };
  onResume: () => void;
  onDiscard: () => void;
}

export const ResumeWorkoutBanner: React.FC<ResumeWorkoutBannerProps> = ({
  draftWorkout,
  onResume,
  onDiscard
}) => {
  const draftAge = draftWorkout.endTime
    ? Math.floor((Date.now() - draftWorkout.endTime) / 60000) // Minutes since saved
    : 0;

  return (
    <div className="bg-gradient-to-r from-orange-500/20 to-primary/20 border-2 border-orange-500/50 p-4 mb-6 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-black uppercase italic text-white mb-1">Draft Workout Found</h3>
          <p className="text-xs text-[#aaa] font-mono">{draftWorkout.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <Clock size={12} className="text-[#666]" />
            <span className="text-[10px] text-[#666] font-mono">
              Saved {draftAge < 60 ? `${draftAge}m ago` : `${Math.floor(draftAge / 60)}h ago`}
            </span>
          </div>
        </div>
        <button
          onClick={onDiscard}
          className="text-[#666] hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <button
        onClick={onResume}
        className="w-full bg-orange-500 hover:bg-orange-400 text-black py-3 font-bold uppercase text-sm transition-colors flex items-center justify-center gap-2"
      >
        <Play size={16} fill="currentColor" />
        Resume Workout
      </button>
    </div>
  );
};

export default ResumeWorkoutBanner;
