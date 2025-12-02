import React from 'react';
import { ExercisePRHistory, PRType } from '../types';
import { Trophy, TrendingUp, Zap, Calendar } from 'lucide-react';

interface PRHistoryTimelineProps {
  prHistory: ExercisePRHistory | undefined;
  exerciseName: string;
  units: 'kg' | 'lbs';
}

const PRHistoryTimeline: React.FC<PRHistoryTimelineProps> = ({ prHistory, exerciseName, units }) => {
  if (!prHistory || prHistory.records.length === 0) {
    return (
      <div className="p-8 text-center bg-[#111] border border-[#222] rounded">
        <Trophy size={32} className="mx-auto mb-4 text-[#333]" />
        <h3 className="text-white font-bold uppercase text-sm mb-2">No Records Yet</h3>
        <p className="text-[10px] text-[#666] font-mono">
          Complete a workout with {exerciseName} to start tracking your PRs
        </p>
      </div>
    );
  }

  const getPRIcon = (type: PRType) => {
    switch (type) {
      case 'weight':
        return <Trophy size={14} className="text-primary" />;
      case 'volume':
        return <TrendingUp size={14} className="text-blue-400" />;
      case 'reps':
        return <Zap size={14} className="text-yellow-400" />;
    }
  };

  const getPRLabel = (type: PRType) => {
    switch (type) {
      case 'weight':
        return 'WEIGHT PR';
      case 'volume':
        return 'VOLUME PR';
      case 'reps':
        return 'REP PR';
    }
  };

  const getPRColor = (type: PRType) => {
    switch (type) {
      case 'weight':
        return 'border-primary';
      case 'volume':
        return 'border-blue-400';
      case 'reps':
        return 'border-yellow-400';
    }
  };

  const formatPRValue = (pr: ExercisePRHistory['records'][0]) => {
    switch (pr.type) {
      case 'weight':
        return `${pr.value} ${units} × ${pr.reps} reps`;
      case 'volume':
        return `${pr.value} ${units} total`;
      case 'reps':
        return `${pr.value} reps @ ${pr.weight} ${units}`;
    }
  };

  // Sort records by date (newest first - already done in store, but double-check)
  const sortedRecords = [...prHistory.records].sort((a, b) => b.date - a.date);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest flex items-center gap-2">
          <Calendar size={14} /> PR History
        </h3>
        <div className="text-[10px] text-[#444] font-mono">
          {sortedRecords.length} record{sortedRecords.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-4 bottom-4 w-[2px] bg-[#222]" />

        {/* PR Records */}
        <div className="space-y-4">
          {sortedRecords.map((pr, index) => (
            <div key={`${pr.type}-${pr.date}`} className="relative pl-8">
              {/* Timeline dot */}
              <div className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 ${getPRColor(pr.type)} bg-black flex items-center justify-center`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>

              {/* PR Card */}
              <div className={`bg-[#111] border-l-2 ${getPRColor(pr.type)} p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPRIcon(pr.type)}
                    <span className="text-[10px] font-black uppercase text-white">
                      {getPRLabel(pr.type)}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#444] font-mono">
                    {new Date(pr.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="text-2xl font-black italic text-white mb-1">
                  {formatPRValue(pr)}
                </div>

                {/* Additional details for volume PRs */}
                {pr.type === 'volume' && pr.setDetails && (
                  <div className="text-[9px] text-[#666] font-mono mt-2">
                    {pr.setDetails.length} sets: {pr.setDetails.map(s => `${s.weight}×${s.reps}`).join(', ')}
                  </div>
                )}

                {/* Badge for first PR */}
                {index === sortedRecords.length - 1 && (
                  <div className="mt-2 inline-block px-2 py-1 bg-[#222] text-[8px] text-[#666] font-bold uppercase rounded">
                    First Record
                  </div>
                )}

                {/* Badge for current best */}
                {(pr.type === 'weight' && pr === prHistory.bestWeight) ||
                 (pr.type === 'volume' && pr === prHistory.bestVolume) ||
                 (pr.type === 'reps' && pr === prHistory.bestReps) ? (
                  <div className="mt-2 inline-block px-2 py-1 bg-primary/10 text-primary text-[8px] font-bold uppercase rounded">
                    Current Best
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="bg-[#111] p-3 border border-[#222] text-center">
          <div className="text-[9px] text-[#666] uppercase font-bold mb-1">Total PRs</div>
          <div className="text-xl font-black italic text-white">{sortedRecords.length}</div>
        </div>
        <div className="bg-[#111] p-3 border border-[#222] text-center">
          <div className="text-[9px] text-[#666] uppercase font-bold mb-1">Weight PRs</div>
          <div className="text-xl font-black italic text-white">
            {sortedRecords.filter(r => r.type === 'weight').length}
          </div>
        </div>
        <div className="bg-[#111] p-3 border border-[#222] text-center">
          <div className="text-[9px] text-[#666] uppercase font-bold mb-1">Volume PRs</div>
          <div className="text-xl font-black italic text-white">
            {sortedRecords.filter(r => r.type === 'volume').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRHistoryTimeline;
