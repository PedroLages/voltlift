import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY } from '../constants';
import { ArrowLeft, TrendingUp, BarChart2, Calendar, Activity, Zap, Dumbbell, AlertTriangle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BodyHeatmap from '../components/BodyHeatmap';
import PRHistoryTimeline from '../components/PRHistoryTimeline';
import EmptyState from '../components/EmptyState';
import { ProgressionChart, VolumeChart } from '../components/ProgressionChart';
import MuscleGroupVolumeChart from '../components/MuscleGroupVolumeChart';
import VolumeBreakdownTable from '../components/VolumeBreakdownTable';
import DetailedInsights from '../components/DetailedInsights';
import RPETrendsChart from '../components/RPETrendsChart';
import {
  getExerciseProgression,
  getVolumeProgression,
  getMuscleGroupVolumeDistribution,
  calculateVolumeBalanceScore,
  getWeeklyVolumeBreakdown
} from '../services/progressionData';
import { assessInjuryRisk, RiskLevel } from '../services/injuryRisk';
import { forecastPR } from '../services/prForecasting';

const Analytics = () => {
  const { history, settings, dailyLogs } = useStore();
  const navigate = useNavigate();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(EXERCISE_LIBRARY[0]?.id || 'e1');
  const [dateRange, setDateRange] = useState<30 | 60 | 90>(90);

  // Get exercise progression data
  const progressionData = useMemo(() => {
    const selectedExercise = EXERCISE_LIBRARY.find(e => e.id === selectedExerciseId);
    if (!selectedExercise) return null;

    return getExerciseProgression(
      selectedExerciseId,
      selectedExercise.name,
      history,
      dateRange
    );
  }, [history, selectedExerciseId, dateRange]);

  // Get volume progression data
  const volumeData = useMemo(() => {
    return getVolumeProgression(history, dateRange);
  }, [history, dateRange]);

  // Get muscle group volume distribution
  const muscleGroupDistribution = useMemo(() => {
    return getMuscleGroupVolumeDistribution(history, EXERCISE_LIBRARY, dateRange);
  }, [history, dateRange]);

  // Calculate volume balance score
  const volumeBalance = useMemo(() => {
    return calculateVolumeBalanceScore(history, EXERCISE_LIBRARY, dateRange);
  }, [history, dateRange]);

  // Get weekly volume breakdown
  const weeklyVolumeData = useMemo(() => {
    return getWeeklyVolumeBreakdown(history, EXERCISE_LIBRARY, 12);
  }, [history]);

  // Convert dailyLogs object to array
  const dailyLogsArray = useMemo(() => {
    return Object.values(dailyLogs).map(log => ({
      date: new Date(log.date).getTime(),
      sleepHours: log.sleepHours,
      mood: log.mood,
      stressLevel: log.stressLevel,
      energyLevel: log.energyLevel,
      notes: log.notes || '',
      waterLitres: log.waterLitres
    }));
  }, [dailyLogs]);

  // Injury risk assessment
  const injuryRiskAssessment = useMemo(() => {
    if (history.length < 3) return null;
    return assessInjuryRisk(history, dailyLogsArray, 4);
  }, [history, dailyLogsArray]);

  // PR Forecast for selected exercise
  const prForecast = useMemo(() => {
    const selectedExercise = EXERCISE_LIBRARY.find(e => e.id === selectedExerciseId);
    if (!selectedExercise || history.length < 4) return null;

    return forecastPR(
      selectedExerciseId,
      selectedExercise.name,
      history,
      settings.experienceLevel || 'intermediate',
      8
    );
  }, [history, selectedExerciseId, settings.experienceLevel]);

  // 2. Prepare Data for Heatmap (Last 7 Days)
  const muscleIntensity = useMemo(() => {
      const intensity: Record<string, number> = {};
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      const recentSessions = history.filter(h => h.startTime > oneWeekAgo && h.status === 'completed');
      
      recentSessions.forEach(session => {
          session.logs.forEach(log => {
              const ex = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
              if (ex) {
                  const completedSets = log.sets.filter(s => s.completed).length;
                  intensity[ex.muscleGroup] = (intensity[ex.muscleGroup] || 0) + completedSets;
                  // Also count secondary? Maybe half value. 
                  // For now, primary only for clearer viz.
              }
          });
      });
      return intensity;
  }, [history]);


  const exercisePRHistory = settings.personalRecords?.[selectedExerciseId];

  // Helper to get risk styling
  const getRiskStyling = (risk: RiskLevel) => {
    switch (risk) {
      case 'critical':
        return { bg: 'bg-red-900/20', border: 'border-red-500', text: 'text-red-500', icon: AlertTriangle };
      case 'high':
        return { bg: 'bg-orange-900/20', border: 'border-orange-500', text: 'text-orange-500', icon: AlertTriangle };
      case 'moderate':
        return { bg: 'bg-yellow-900/20', border: 'border-yellow-500', text: 'text-yellow-500', icon: AlertTriangle };
      case 'low':
        return { bg: 'bg-green-900/20', border: 'border-primary', text: 'text-primary', icon: Shield };
    }
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-black">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/lift')} className="text-[#666] hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="volt-header text-3xl text-white">ANALYTICS</h1>
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="mt-16">
          <EmptyState
            icon={BarChart2}
            title="No Analytics Available"
            description="Complete your first workout to unlock detailed analytics, personal records, strength trends, and muscle recovery tracking. Your fitness data will come to life here."
            actionLabel="Start Training"
            onAction={() => navigate('/lift')}
          />
        </div>
      ) : (
        <div>

      {/* Injury Risk Warning Section */}
      {injuryRiskAssessment && (
        <div className="mb-10">
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield size={14} /> Injury Risk Assessment
          </h3>
          {(() => {
            const styling = getRiskStyling(injuryRiskAssessment.overallRisk);
            const RiskIcon = styling.icon;
            return (
              <div className={`${styling.bg} border-l-4 ${styling.border} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <RiskIcon className={styling.text} size={24} />
                    <div>
                      <h4 className={`${styling.text} font-black uppercase text-sm italic`}>
                        {injuryRiskAssessment.overallRisk.toUpperCase()} RISK
                      </h4>
                      <p className="text-[10px] text-[#666] font-mono">
                        Risk Score: {injuryRiskAssessment.riskScore}/100
                      </p>
                    </div>
                  </div>
                  {injuryRiskAssessment.needsDeload && (
                    <div className="bg-red-500 text-black px-3 py-1 text-[10px] font-black uppercase">
                      DELOAD NOW
                    </div>
                  )}
                </div>

                {/* Risk Factors */}
                {injuryRiskAssessment.riskFactors.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-[10px] font-bold text-white uppercase tracking-wide">
                      Detected Issues:
                    </p>
                    {injuryRiskAssessment.riskFactors.map((factor, idx) => (
                      <div key={idx} className="bg-black/30 p-2 border-l-2 border-[#333]">
                        <p className="text-xs text-white font-mono">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wide">
                    Recommendations:
                  </p>
                  {injuryRiskAssessment.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className={`${styling.text} mt-0.5`}>•</div>
                      <p className="text-xs text-[#ccc] font-mono flex-1">{rec}</p>
                    </div>
                  ))}
                </div>

                {!injuryRiskAssessment.needsDeload && injuryRiskAssessment.daysUntilRecommendedDeload > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#333]">
                    <p className="text-[10px] text-[#666] font-mono">
                      Next deload recommended in {injuryRiskAssessment.daysUntilRecommendedDeload} days
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Muscle Heatmap Section */}
      <div className="mb-10">
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} /> Recovery Status (Last 7 Days)
          </h3>

          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
              <BodyHeatmap intensity={muscleIntensity} />

              {/* Stats cards - horizontal on mobile, vertical on desktop */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:space-y-0">
                   <div className="bg-[#111] p-3 border-l-2 border-primary">
                       <h4 className="text-white font-bold uppercase text-xs italic">High Volume</h4>
                       <p className="text-[10px] text-[#666] mt-1 font-mono">
                           {Object.entries(muscleIntensity).sort((a,b) => b[1] - a[1])[0]?.[0] || 'None'}
                       </p>
                   </div>
                   <div className="bg-[#111] p-3 border-l-2 border-[#333]">
                       <h4 className="text-white font-bold uppercase text-xs italic">Neglected</h4>
                       <p className="text-[10px] text-[#666] mt-1 font-mono">
                           {['Legs', 'Back', 'Chest', 'Shoulders'].filter(m => !muscleIntensity[m] || muscleIntensity[m] < 3).join(', ') || 'None'}
                       </p>
                   </div>
              </div>
          </div>
      </div>

      {/* Exercise Selector & Date Range Filter */}
      <div className="mb-8 border-t border-[#222] pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Exercise Selector */}
              <div>
                  <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">Select Movement</label>
                  <select
                    value={selectedExerciseId}
                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] p-4 text-white font-bold uppercase outline-none focus:border-primary"
                  >
                      {EXERCISE_LIBRARY.map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                  </select>
              </div>

              {/* Date Range Filter */}
              <div>
                  <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">Time Range</label>
                  <div className="flex bg-[#111] border border-[#333]">
                      <button
                        onClick={() => setDateRange(30)}
                        className={`flex-1 py-4 text-xs font-bold uppercase transition-colors ${
                          dateRange === 30 ? 'bg-primary text-black' : 'text-[#666] hover:text-white'
                        }`}
                      >
                        30 Days
                      </button>
                      <button
                        onClick={() => setDateRange(60)}
                        className={`flex-1 py-4 text-xs font-bold uppercase transition-colors border-x border-[#333] ${
                          dateRange === 60 ? 'bg-primary text-black' : 'text-[#666] hover:text-white'
                        }`}
                      >
                        60 Days
                      </button>
                      <button
                        onClick={() => setDateRange(90)}
                        className={`flex-1 py-4 text-xs font-bold uppercase transition-colors ${
                          dateRange === 90 ? 'bg-primary text-black' : 'text-[#666] hover:text-white'
                        }`}
                      >
                        90 Days
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#111] p-4 border border-[#222]">
           <div className="flex items-center gap-2 text-primary mb-2">
               <TrendingUp size={16} /> <span className="text-[10px] font-black uppercase">Current 1RM</span>
           </div>
           <div className="text-3xl font-black italic text-white">
               {progressionData && progressionData.dataPoints.length > 0
                 ? progressionData.dataPoints[progressionData.dataPoints.length - 1].value
                 : 0}
               <span className="text-sm not-italic text-[#666] font-medium ml-1">LBS</span>
           </div>
        </div>
        <div className="bg-[#111] p-4 border border-[#222]">
           <div className="flex items-center gap-2 text-white mb-2">
               <Calendar size={16} /> <span className="text-[10px] font-black uppercase">Weight PR</span>
           </div>
           <div className="text-3xl font-black italic text-white">
               {exercisePRHistory?.bestWeight?.value || 0}
               <span className="text-sm not-italic text-[#666] font-medium ml-1">LBS</span>
           </div>
           {exercisePRHistory?.bestWeight && (
             <div className="text-[10px] text-[#444] font-mono mt-1">
               {new Date(exercisePRHistory.bestWeight.date).toLocaleDateString()} • {exercisePRHistory.bestWeight.reps} reps
             </div>
           )}
        </div>
        <div className="bg-[#111] p-4 border border-[#222]">
           <div className="flex items-center gap-2 text-white mb-2">
               <TrendingUp size={16} /> <span className="text-[10px] font-black uppercase">Volume PR</span>
           </div>
           <div className="text-3xl font-black italic text-white">
               {exercisePRHistory?.bestVolume?.value || 0}
               <span className="text-sm not-italic text-[#666] font-medium ml-1">LBS</span>
           </div>
           {exercisePRHistory?.bestVolume && (
             <div className="text-[10px] text-[#444] font-mono mt-1">
               {new Date(exercisePRHistory.bestVolume.date).toLocaleDateString()} • {exercisePRHistory.bestVolume.setDetails?.length} sets
             </div>
           )}
        </div>
        <div className="bg-[#111] p-4 border border-[#222]">
           <div className="flex items-center gap-2 text-white mb-2">
               <Zap size={16} /> <span className="text-[10px] font-black uppercase">Rep PR</span>
           </div>
           <div className="text-3xl font-black italic text-white">
               {exercisePRHistory?.bestReps?.value || 0}
               <span className="text-sm not-italic text-[#666] font-medium ml-1">REPS</span>
           </div>
           {exercisePRHistory?.bestReps && (
             <div className="text-[10px] text-[#444] font-mono mt-1">
               {new Date(exercisePRHistory.bestReps.date).toLocaleDateString()} @ {exercisePRHistory.bestReps.weight} lbs
             </div>
           )}
        </div>
      </div>

      {/* Progression Charts */}
      <div className="space-y-6 mb-8">
          {/* 1RM Progression Chart */}
          {progressionData && (
            <ProgressionChart
              progression={progressionData}
              color="#ccff00"
              height={300}
            />
          )}

          {/* Volume Progression Chart */}
          {volumeData.length > 0 && (
            <VolumeChart
              data={volumeData}
              title="Total Volume Trend"
              color="#00d9ff"
              height={250}
            />
          )}
      </div>

      {/* PR History Timeline */}
      <div className="mb-8">
          <PRHistoryTimeline
            prHistory={exercisePRHistory}
            exerciseName={EXERCISE_LIBRARY.find(e => e.id === selectedExerciseId)?.name || 'Exercise'}
            units={settings.units}
          />
      </div>

      {/* PR Forecast Section */}
      {prForecast && (
        <div className="mb-8 border-t border-[#222] pt-8">
          <h2 className="text-2xl font-black italic uppercase text-white mb-6 flex items-center gap-2">
            <TrendingUp size={24} /> PR Forecast (8 Weeks)
          </h2>

          {/* Forecast Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#111] p-4 border-l-4 border-primary">
              <p className="text-[10px] text-[#666] uppercase font-bold mb-1">Current PR</p>
              <p className="text-3xl font-black italic text-white">
                {prForecast.currentPR}
                <span className="text-sm not-italic text-[#666] font-medium ml-1">LBS</span>
              </p>
            </div>
            <div className="bg-[#111] p-4 border-l-4 border-primary">
              <p className="text-[10px] text-[#666] uppercase font-bold mb-1">Predicted PR</p>
              <p className="text-3xl font-black italic text-white">
                {prForecast.predictedPR}
                <span className="text-sm not-italic text-[#666] font-medium ml-1">LBS</span>
              </p>
              <p className="text-[10px] text-primary font-mono mt-1">
                +{prForecast.predictedPR - prForecast.currentPR} lbs in {prForecast.weeksToTarget} weeks
              </p>
            </div>
          </div>

          {/* Confidence & Achievability */}
          <div className="mb-6">
            <div className={`p-4 border-l-4 ${
              prForecast.isAchievable ? 'bg-green-900/20 border-green-500' : 'bg-orange-900/20 border-orange-500'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-white uppercase">
                    Confidence: {(prForecast.confidence * 100).toFixed(0)}%
                  </p>
                  <p className={`text-[10px] font-mono ${
                    prForecast.isAchievable ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {prForecast.isAchievable ? '✓ Achievable Target' : '⚠ Ambitious Target'}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-8 ${
                        i < Math.round(prForecast.confidence * 5) ? 'bg-primary' : 'bg-[#333]'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-[#ccc] font-mono leading-relaxed">
                {prForecast.reasoning}
              </p>
            </div>
          </div>

          {/* Projection Graph - Simple Visualization */}
          {prForecast.projectionCurve.length > 0 && (
            <div className="bg-[#111] p-6 border border-[#222]">
              <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">
                8-Week Projection Curve
              </h3>
              <div className="relative h-48">
                {/* Simple bar chart visualization */}
                <div className="flex items-end justify-between h-full gap-2">
                  {prForecast.projectionCurve.map((point, idx) => {
                    const maxWeight = Math.max(...prForecast.projectionCurve.map(p => p.weight));
                    const minWeight = Math.min(...prForecast.projectionCurve.map(p => p.weight));
                    const range = maxWeight - minWeight || 1;
                    const heightPercent = ((point.weight - minWeight) / range) * 100;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full">
                          <div
                            className={`w-full transition-all ${
                              idx === 0 ? 'bg-[#666]' : 'bg-primary'
                            }`}
                            style={{ height: `${Math.max(10, heightPercent)}%` }}
                          />
                          {idx === prForecast.projectionCurve.length - 1 && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] font-black text-primary">
                              {point.weight}
                            </div>
                          )}
                        </div>
                        <span className="text-[8px] text-[#666] font-mono">
                          {idx === 0 ? 'Now' : `W${idx}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#222]">
                <p className="text-[10px] text-[#666] font-mono">
                  Projection based on exponential curve fitting with {(prForecast.confidence * 100).toFixed(0)}% confidence
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Muscle Group Volume Analytics */}
      <div className="mb-8 border-t border-[#222] pt-8">
          <h2 className="text-2xl font-black italic uppercase text-white mb-6">Muscle Group Analytics</h2>

          {/* Muscle Group Volume Distribution */}
          <div className="mb-6">
            <MuscleGroupVolumeChart
              distribution={muscleGroupDistribution}
              balanceScore={volumeBalance}
              height={300}
            />
          </div>

          {/* Weekly Volume Breakdown */}
          <div>
            <VolumeBreakdownTable weeklyData={weeklyVolumeData} />
          </div>
      </div>

      {/* RPE Trends Section */}
      <div className="mb-8 border-t border-[#222] pt-8">
        <RPETrendsChart />
      </div>

      {/* Detailed Insights Section */}
      <div className="mb-8 border-t border-[#222] pt-8">
        <DetailedInsights
          history={history}
          dailyLogs={Object.values(dailyLogs)}
          experienceLevel={settings.experienceLevel || 'intermediate'}
          selectedExerciseId={selectedExerciseId}
        />
      </div>

      <div className="p-4 bg-[#111] border-l-2 border-primary">
          <h4 className="font-bold text-white uppercase italic text-sm mb-1">VoltLift Insight</h4>
          <p className="text-xs text-[#888] font-mono leading-relaxed">
              Consistently tracking specific movements allows the system to calculate your 1RM accurately.
              Focus on progressive overload to see this trend line climb.
          </p>
      </div>

        </div>
      )}

    </div>
  );
};

export default Analytics;