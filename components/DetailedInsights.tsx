/**
 * Detailed Insights Component
 *
 * P2 Analytics feature providing:
 * - Training volume recommendations (MEV/MAV/MRV guidance)
 * - Recovery metrics display
 * - Plateau detection
 * - Form degradation detection (RPE-based)
 */

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Battery,
  BatteryLow,
  BatteryFull,
  AlertTriangle,
  Target,
  Flame,
  Moon,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { WorkoutSession, DailyLog, ExperienceLevel, MuscleGroup } from '../types';
import { EXERCISE_LIBRARY } from '../constants';
import {
  getAllVolumeRecommendations,
  VolumeRecommendation,
  detectVolumeImbalances,
} from '../services/volumeOptimization';
import {
  getRecoveryAssessment,
  RecoveryAssessment,
  getQuickRecoveryStatus,
} from '../services/adaptiveRecovery';
import {
  extractExerciseTimeSeries,
  detectPlateau,
} from '../services/analytics';

interface DetailedInsightsProps {
  history: WorkoutSession[];
  dailyLogs: DailyLog[];
  experienceLevel: ExperienceLevel;
  selectedExerciseId?: string;
}

/**
 * Volume Recommendations Panel
 */
const VolumeRecommendationsPanel: React.FC<{
  recommendations: VolumeRecommendation[];
}> = ({ recommendations }) => {
  // Filter to show recommendations that need action and have valid landmarks
  const actionableRecs = recommendations.filter(
    (r) => r.landmarks && (r.changeDirection !== 'maintain' || r.landmarks.status !== 'optimal')
  );

  if (actionableRecs.length === 0) {
    return (
      <div className="bg-green-900/20 border-l-4 border-green-500 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="text-green-500" size={18} />
          <h4 className="text-green-500 font-black uppercase text-sm italic">
            Volume Optimized
          </h4>
        </div>
        <p className="text-xs text-[#ccc] font-mono">
          All muscle groups are within optimal training volume ranges. Keep up the consistency!
        </p>
      </div>
    );
  }

  const getStatusColor = (status: VolumeRecommendation['landmarks']['status'] | undefined) => {
    switch (status) {
      case 'overtrained':
        return { bg: 'bg-red-900/20', border: 'border-red-500', text: 'text-red-500' };
      case 'approaching_mrv':
        return { bg: 'bg-orange-900/20', border: 'border-orange-500', text: 'text-orange-500' };
      case 'undertrained':
        return { bg: 'bg-yellow-900/20', border: 'border-yellow-500', text: 'text-yellow-500' };
      case 'optimal':
      default:
        return { bg: 'bg-green-900/20', border: 'border-green-500', text: 'text-green-500' };
    }
  };

  const getDirectionIcon = (direction: VolumeRecommendation['changeDirection'] | undefined) => {
    switch (direction) {
      case 'increase':
        return <TrendingUp size={14} className="text-yellow-500" />;
      case 'decrease':
        return <TrendingDown size={14} className="text-red-500" />;
      case 'maintain':
      default:
        return <Minus size={14} className="text-green-500" />;
    }
  };

  return (
    <div className="space-y-3">
      {actionableRecs.slice(0, 4).map((rec) => {
        const colors = getStatusColor(rec.landmarks.status);
        return (
          <div
            key={rec.muscleGroup}
            className={`${colors.bg} border-l-4 ${colors.border} p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getDirectionIcon(rec.changeDirection)}
                <h5 className={`${colors.text} font-bold uppercase text-xs`}>
                  {rec.muscleGroup}
                </h5>
              </div>
              <span className="text-[10px] font-mono text-[#666]">
                {rec.currentVolume}/{rec.landmarks.mav} sets/wk
              </span>
            </div>

            {/* Volume Bar */}
            <div className="mb-2">
              <div className="relative h-2 bg-[#222] rounded-full overflow-hidden">
                {/* MEV zone */}
                <div
                  className="absolute h-full bg-yellow-900/50"
                  style={{
                    left: '0%',
                    width: `${(rec.landmarks.mev / rec.landmarks.mrv) * 100}%`,
                  }}
                />
                {/* MAV zone (optimal) */}
                <div
                  className="absolute h-full bg-green-900/50"
                  style={{
                    left: `${(rec.landmarks.mev / rec.landmarks.mrv) * 100}%`,
                    width: `${((rec.landmarks.mav - rec.landmarks.mev) / rec.landmarks.mrv) * 100}%`,
                  }}
                />
                {/* Current position */}
                <div
                  className={`absolute top-0 w-1 h-full ${colors.border.replace('border-', 'bg-')}`}
                  style={{
                    left: `${Math.min((rec.currentVolume / rec.landmarks.mrv) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-[#444] font-mono mt-1">
                <span>MEV:{rec.landmarks.mev}</span>
                <span>MAV:{rec.landmarks.mav}</span>
                <span>MRV:{rec.landmarks.mrv}</span>
              </div>
            </div>

            <p className="text-[10px] text-[#999] font-mono leading-relaxed">
              {rec.reasoning}
            </p>

            {rec.changeMagnitude > 0 && (
              <div className="mt-2 pt-2 border-t border-[#333]">
                <span className={`text-[10px] font-bold ${colors.text}`}>
                  Recommended: {rec.changeDirection === 'increase' ? '+' : '-'}
                  {rec.changeMagnitude} sets → {rec.recommendedVolume} sets/wk
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Recovery Metrics Panel
 */
const RecoveryMetricsPanel: React.FC<{
  assessment: RecoveryAssessment;
}> = ({ assessment }) => {
  const getBatteryIcon = (score: number) => {
    if (score >= 70) return <BatteryFull className="text-green-500" size={20} />;
    if (score >= 40) return <Battery className="text-yellow-500" size={20} />;
    return <BatteryLow className="text-red-500" size={20} />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const priorityRecs = assessment.recommendations.filter(
    (r) => r.priority === 'critical' || r.priority === 'high'
  );

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="bg-[#111] p-4 border border-[#222]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getBatteryIcon(assessment.overallRecoveryScore)}
            <div>
              <p className="text-[10px] text-[#666] uppercase font-bold">Recovery Score</p>
              <p className={`text-2xl font-black italic ${getScoreColor(assessment.overallRecoveryScore)}`}>
                {assessment.overallRecoveryScore}
                <span className="text-sm not-italic text-[#666] font-medium">/100</span>
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 text-[10px] font-black uppercase ${
            assessment.readyToTrain
              ? 'bg-green-900/30 text-green-500'
              : 'bg-red-900/30 text-red-500'
          }`}>
            {assessment.readyToTrain ? 'Ready to Train' : 'Rest Recommended'}
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#222]">
          <div>
            <div className="flex items-center gap-1 text-[#666] mb-1">
              <Moon size={12} />
              <span className="text-[8px] uppercase">Sleep Debt</span>
            </div>
            <p className={`text-sm font-bold ${
              assessment.sleepDebt > 5 ? 'text-red-500' :
              assessment.sleepDebt > 2 ? 'text-yellow-500' : 'text-white'
            }`}>
              {assessment.sleepDebt.toFixed(1)}h
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[#666] mb-1">
              <Flame size={12} />
              <span className="text-[8px] uppercase">Training Stress</span>
            </div>
            <p className={`text-sm font-bold ${
              assessment.trainingStress > 80 ? 'text-red-500' :
              assessment.trainingStress > 60 ? 'text-yellow-500' : 'text-white'
            }`}>
              {assessment.trainingStress}/100
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[#666] mb-1">
              <Activity size={12} />
              <span className="text-[8px] uppercase">Days to Rest</span>
            </div>
            <p className="text-sm font-bold text-white">
              {assessment.daysUntilRestDay}d
            </p>
          </div>
        </div>
      </div>

      {/* Priority Recommendations */}
      {priorityRecs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-[#666] uppercase tracking-wide">
            Priority Actions
          </p>
          {priorityRecs.slice(0, 3).map((rec, idx) => (
            <div
              key={idx}
              className={`p-3 border-l-4 ${
                rec.priority === 'critical'
                  ? 'bg-red-900/20 border-red-500'
                  : 'bg-orange-900/20 border-orange-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h5 className={`text-xs font-bold uppercase ${
                    rec.priority === 'critical' ? 'text-red-500' : 'text-orange-500'
                  }`}>
                    {rec.title}
                  </h5>
                  <p className="text-[10px] text-[#999] font-mono mt-1">
                    {rec.description}
                  </p>
                </div>
                {rec.daysUntilAction !== undefined && (
                  <span className="text-[8px] text-[#666] font-mono whitespace-nowrap ml-2">
                    {rec.daysUntilAction === 0 ? 'Today' : `${rec.daysUntilAction}d`}
                  </span>
                )}
              </div>
              {rec.actionItems.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#333]">
                  {rec.actionItems.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] text-[#ccc]">
                      <ChevronRight size={10} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Plateau Detection Panel
 */
const PlateauDetectionPanel: React.FC<{
  exerciseId: string;
  exerciseName: string;
  history: WorkoutSession[];
}> = ({ exerciseId, exerciseName, history }) => {
  const plateauResult = useMemo(() => {
    const timeSeries = extractExerciseTimeSeries(exerciseId, history);
    if (!timeSeries || timeSeries.dataPoints.length < 4) return null;
    return detectPlateau(timeSeries, 4);
  }, [exerciseId, history]);

  if (!plateauResult) {
    return (
      <div className="bg-[#111] p-4 border border-[#222]">
        <p className="text-xs text-[#666] font-mono">
          Need 4+ weeks of data to detect plateaus for {exerciseName}.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 border-l-4 ${
        plateauResult.isPlateaued
          ? 'bg-orange-900/20 border-orange-500'
          : 'bg-green-900/20 border-green-500'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {plateauResult.isPlateaued ? (
            <AlertTriangle className="text-orange-500" size={18} />
          ) : (
            <TrendingUp className="text-green-500" size={18} />
          )}
          <h4
            className={`font-bold uppercase text-sm italic ${
              plateauResult.isPlateaued ? 'text-orange-500' : 'text-green-500'
            }`}
          >
            {plateauResult.isPlateaued ? 'Plateau Detected' : 'Progressing Well'}
          </h4>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#666] uppercase">Current PR</p>
          <p className="text-lg font-black text-white">
            {plateauResult.currentPR}
            <span className="text-xs text-[#666] ml-1">lbs</span>
          </p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-[#ccc] font-mono leading-relaxed">
          {plateauResult.reasoning}
        </p>
      </div>

      <div className="flex items-center justify-between text-[10px] pt-3 border-t border-[#333]">
        <span className="text-[#666]">
          Weeks since PR: <span className="text-white font-bold">{plateauResult.weeksSincePR}</span>
        </span>
        {plateauResult.isPlateaued && (
          <span className="text-orange-500 font-bold uppercase">
            Consider variation
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Form Degradation Detection (RPE-based)
 */
const FormDegradationPanel: React.FC<{
  history: WorkoutSession[];
  exerciseId: string;
  exerciseName: string;
}> = ({ history, exerciseId, exerciseName }) => {
  const analysis = useMemo(() => {
    // Get recent workouts with this exercise
    const recentSessions = history
      .filter((h) => h.status === 'completed')
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 8);

    const exerciseLogs = recentSessions
      .flatMap((s) => s.logs)
      .filter((l) => l.exerciseId === exerciseId);

    if (exerciseLogs.length < 3) return null;

    // Analyze RPE trends across sets within workouts
    let earlySetRPE: number[] = [];
    let lateSetRPE: number[] = [];
    let rpeTrend: number[] = [];

    exerciseLogs.forEach((log) => {
      const completedSets = log.sets.filter((s) => s.completed && s.rpe);
      if (completedSets.length >= 3) {
        const halfPoint = Math.floor(completedSets.length / 2);
        const early = completedSets.slice(0, halfPoint);
        const late = completedSets.slice(halfPoint);

        const earlyAvg = early.reduce((sum, s) => sum + (s.rpe || 0), 0) / early.length;
        const lateAvg = late.reduce((sum, s) => sum + (s.rpe || 0), 0) / late.length;

        earlySetRPE.push(earlyAvg);
        lateSetRPE.push(lateAvg);
        rpeTrend.push(lateAvg - earlyAvg);
      }
    });

    if (rpeTrend.length < 2) return null;

    const avgRPEIncrease = rpeTrend.reduce((sum, v) => sum + v, 0) / rpeTrend.length;
    const avgEarly = earlySetRPE.reduce((sum, v) => sum + v, 0) / earlySetRPE.length;
    const avgLate = lateSetRPE.reduce((sum, v) => sum + v, 0) / lateSetRPE.length;

    // Form degradation: RPE increases significantly from early to late sets
    const isDegrading = avgRPEIncrease > 1.5; // RPE jumps more than 1.5 points
    const isCritical = avgRPEIncrease > 2.5; // Severe fatigue pattern

    return {
      isDegrading,
      isCritical,
      avgEarlyRPE: avgEarly,
      avgLateRPE: avgLate,
      rpeIncrease: avgRPEIncrease,
      dataPoints: rpeTrend.length,
    };
  }, [history, exerciseId]);

  if (!analysis) {
    return (
      <div className="bg-[#111] p-4 border border-[#222]">
        <p className="text-xs text-[#666] font-mono">
          Need RPE data from 3+ sessions to analyze form degradation for {exerciseName}.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 border-l-4 ${
        analysis.isCritical
          ? 'bg-red-900/20 border-red-500'
          : analysis.isDegrading
          ? 'bg-yellow-900/20 border-yellow-500'
          : 'bg-green-900/20 border-green-500'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {analysis.isCritical ? (
          <AlertTriangle className="text-red-500" size={18} />
        ) : analysis.isDegrading ? (
          <AlertTriangle className="text-yellow-500" size={18} />
        ) : (
          <Activity className="text-green-500" size={18} />
        )}
        <h4
          className={`font-bold uppercase text-sm italic ${
            analysis.isCritical
              ? 'text-red-500'
              : analysis.isDegrading
              ? 'text-yellow-500'
              : 'text-green-500'
          }`}
        >
          {analysis.isCritical
            ? 'Critical Form Breakdown'
            : analysis.isDegrading
            ? 'Form Degradation Detected'
            : 'Form Quality Stable'}
        </h4>
      </div>

      {/* RPE Progression Bar */}
      <div className="mb-3">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[8px] text-[#666] uppercase mb-1">Early Sets</p>
            <div className="h-3 bg-[#222] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${(analysis.avgEarlyRPE / 10) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-white font-mono mt-1">
              RPE {analysis.avgEarlyRPE.toFixed(1)}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-[8px] text-[#666] uppercase mb-1">Late Sets</p>
            <div className="h-3 bg-[#222] rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  analysis.isCritical
                    ? 'bg-red-500'
                    : analysis.isDegrading
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${(analysis.avgLateRPE / 10) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-white font-mono mt-1">
              RPE {analysis.avgLateRPE.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-[#999] font-mono leading-relaxed mb-2">
        {analysis.isCritical
          ? `RPE increases by ${analysis.rpeIncrease.toFixed(1)} points through workout. Reduce working sets or weight to maintain form quality.`
          : analysis.isDegrading
          ? `RPE increases by ${analysis.rpeIncrease.toFixed(1)} points through workout. Consider reducing volume or adding rest time.`
          : `Consistent effort across sets (+${analysis.rpeIncrease.toFixed(1)} RPE). Form quality maintained well.`}
      </p>

      <p className="text-[8px] text-[#666] font-mono">
        Based on {analysis.dataPoints} workout{analysis.dataPoints !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

/**
 * Main DetailedInsights Component
 */
const DetailedInsights: React.FC<DetailedInsightsProps> = ({
  history,
  dailyLogs,
  experienceLevel,
  selectedExerciseId,
}) => {
  // Get volume recommendations
  const volumeRecs = useMemo(() => {
    if (history.length < 2) return [];
    return getAllVolumeRecommendations(history, experienceLevel);
  }, [history, experienceLevel]);

  // Get recovery assessment
  const recoveryAssessment = useMemo(() => {
    if (history.length < 2 || dailyLogs.length < 2) return null;
    return getRecoveryAssessment(history, dailyLogs, experienceLevel);
  }, [history, dailyLogs, experienceLevel]);

  // Get selected exercise info
  const selectedExercise = EXERCISE_LIBRARY.find((e) => e.id === selectedExerciseId);

  if (history.length < 2) {
    return (
      <div className="bg-[#111] p-6 border border-[#222]">
        <h3 className="text-lg font-black italic uppercase text-white mb-2">
          Detailed Insights
        </h3>
        <p className="text-xs text-[#666] font-mono">
          Complete at least 2 workouts to unlock detailed training insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <h2 className="text-2xl font-black italic uppercase text-white flex items-center gap-2">
        <Activity size={24} /> Detailed Insights
      </h2>

      {/* Recovery Metrics */}
      {recoveryAssessment && (
        <div>
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Battery size={14} /> Recovery Status
          </h3>
          <RecoveryMetricsPanel assessment={recoveryAssessment} />
        </div>
      )}

      {/* Volume Recommendations */}
      {volumeRecs.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Target size={14} /> Volume Recommendations
          </h3>
          <VolumeRecommendationsPanel recommendations={volumeRecs} />
        </div>
      )}

      {/* Exercise-Specific Analysis */}
      {selectedExercise && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plateau Detection */}
          <div>
            <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Plateau Analysis
            </h3>
            <PlateauDetectionPanel
              exerciseId={selectedExercise.id}
              exerciseName={selectedExercise.name}
              history={history}
            />
          </div>

          {/* Form Degradation */}
          <div>
            <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle size={14} /> Form Quality
            </h3>
            <FormDegradationPanel
              history={history}
              exerciseId={selectedExercise.id}
              exerciseName={selectedExercise.name}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedInsights;
