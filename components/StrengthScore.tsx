import React from 'react';
import { Trophy, TrendingUp, Award, Target } from 'lucide-react';
import { calculateOverallStrengthScore, classifyStrengthLevel, calculate1RM, getBest1RM } from '../services/strengthScore';
import type { ExercisePRHistory } from '../types';

interface StrengthScoreProps {
  personalRecords: Record<string, ExercisePRHistory>;
  bodyweight?: number;
  gender?: 'male' | 'female';
  compact?: boolean;
}

export const StrengthScore: React.FC<StrengthScoreProps> = ({
  personalRecords,
  bodyweight = 180, // Default fallback
  gender = 'male',
  compact = false
}) => {
  const overallScore = calculateOverallStrengthScore(personalRecords, bodyweight, gender);

  // Major lifts to display
  const majorLifts = [
    { id: 'bench-press', name: 'Bench Press', icon: '🏋️' },
    { id: 'barbell-squat', name: 'Squat', icon: '🦵' },
    { id: 'deadlift', name: 'Deadlift', icon: '💪' },
    { id: 'overhead-press', name: 'OHP', icon: '🎯' }
  ];

  // Calculate strength classification for each lift
  const liftClassifications = majorLifts.map(lift => {
    const prHistory = personalRecords[lift.id];
    if (!prHistory?.bestWeight) return null;

    const oneRM = calculate1RM(prHistory.bestWeight.value, prHistory.bestWeight.reps || 1);
    const classification = classifyStrengthLevel(lift.id, oneRM.estimated1RM, bodyweight, gender);

    return {
      ...lift,
      oneRM: oneRM.estimated1RM,
      classification
    };
  }).filter(Boolean);

  // Get score color and label
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'ELITE', color: 'text-[#ccff00]', bgColor: 'bg-[#ccff00]/10', borderColor: 'border-[#ccff00]/30' };
    if (score >= 60) return { label: 'ADVANCED', color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/30' };
    if (score >= 40) return { label: 'INTERMEDIATE', color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/30' };
    if (score >= 20) return { label: 'NOVICE', color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/30' };
    return { label: 'BEGINNER', color: 'text-orange-400', bgColor: 'bg-orange-400/10', borderColor: 'border-orange-400/30' };
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Elite': return 'text-[#ccff00] bg-[#ccff00]/10 border-[#ccff00]/30';
      case 'Advanced': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'Intermediate': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'Novice': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'Untrained': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      default: return 'text-[#666] bg-[#222]/50 border-[#333]';
    }
  };

  const status = getScoreStatus(overallScore);

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 border ${status.borderColor} ${status.bgColor}`}>
        <Trophy size={20} className={status.color} />
        <div className="flex-1">
          <div className="text-[10px] font-bold text-[#666] uppercase">Strength Score</div>
          <div className={`text-2xl font-black italic ${status.color}`}>
            {overallScore}/100
          </div>
        </div>
        <div className={`text-xs font-bold uppercase px-2 py-1 border ${status.borderColor} ${status.bgColor} ${status.color}`}>
          {status.label}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#222] p-4">
      {/* Header */}
      <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4 flex items-center gap-2">
        <Trophy size={14} /> Strength Score
      </h3>

      {/* Overall Score Circle */}
      <div className={`relative p-6 border ${status.borderColor} ${status.bgColor} mb-4`}>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className={`text-6xl font-black italic ${status.color} leading-none mb-2`}>
              {overallScore}
            </div>
            <div className="text-xs font-bold text-[#666] uppercase">/ 100</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className={`px-3 py-1.5 border ${status.borderColor} ${status.bgColor}`}>
              <span className={`text-sm font-black italic ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="text-[9px] text-[#666] font-mono uppercase text-center">
              Overall Rank
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-[#222] overflow-hidden">
            <div
              className={`h-full ${status.color.replace('text-', 'bg-')} transition-all duration-500`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Individual Lift Classifications */}
      {liftClassifications.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2">
            Major Lifts
          </div>
          {liftClassifications.map((lift: any) => (
            <div key={lift.id} className="bg-[#0a0a0a] border border-[#333] p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lift.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white uppercase">
                      {lift.name}
                    </div>
                    <div className="text-[10px] text-[#666] font-mono">
                      Est. 1RM: {lift.oneRM} LBS
                    </div>
                  </div>
                </div>
                {lift.classification && (
                  <div className={`text-[10px] font-bold uppercase px-2 py-1 border ${getLevelColor(lift.classification.level)}`}>
                    {lift.classification.level}
                  </div>
                )}
              </div>

              {/* Progress to next level */}
              {lift.classification && lift.classification.percentToNextLevel < 100 && (
                <div className="mt-2">
                  <div className="flex justify-between text-[9px] text-[#666] font-mono mb-1">
                    <span>{lift.classification.level}</span>
                    <span>Next: {lift.classification.nextLevelTarget} LBS ({lift.classification.percentToNextLevel}%)</span>
                  </div>
                  <div className="h-1 bg-[#222] overflow-hidden">
                    <div
                      className={`h-full ${getLevelColor(lift.classification.level).split(' ')[0].replace('text-', 'bg-')}`}
                      style={{ width: `${lift.classification.percentToNextLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Data State */}
      {liftClassifications.length === 0 && (
        <div className="text-center py-6">
          <Target size={32} className="text-[#444] mx-auto mb-2" />
          <p className="text-sm text-[#666] font-mono">
            Log major lifts to track strength score
          </p>
          <p className="text-[10px] text-[#555] font-mono mt-1">
            (Bench, Squat, Deadlift, OHP)
          </p>
        </div>
      )}

      {/* Bodyweight Info */}
      {bodyweight && (
        <div className="mt-4 pt-4 border-t border-[#222]">
          <div className="text-[9px] text-[#555] font-mono uppercase text-center">
            Bodyweight: {bodyweight} LBS · {gender === 'male' ? 'Male' : 'Female'} Standards
          </div>
        </div>
      )}
    </div>
  );
};

export default StrengthScore;
