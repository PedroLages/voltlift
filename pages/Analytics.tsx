import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY } from '../constants';
import { ArrowLeft, TrendingUp, BarChart2, Calendar, Activity, Zap, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BodyHeatmap from '../components/BodyHeatmap';
import PRHistoryTimeline from '../components/PRHistoryTimeline';
import EmptyState from '../components/EmptyState';
import { ProgressionChart, VolumeChart } from '../components/ProgressionChart';
import MuscleGroupVolumeChart from '../components/MuscleGroupVolumeChart';
import VolumeBreakdownTable from '../components/VolumeBreakdownTable';
import {
  getExerciseProgression,
  getVolumeProgression,
  getMuscleGroupVolumeDistribution,
  calculateVolumeBalanceScore,
  getWeeklyVolumeBreakdown
} from '../services/progressionData';

const Analytics = () => {
  const { history, settings } = useStore();
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


  const exercisePRHistory = settings.personalRecords[selectedExerciseId];

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

      {/* Muscle Heatmap Section */}
      <div className="mb-10">
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} /> Recovery Status (Last 7 Days)
          </h3>
          <div className="grid grid-cols-2 gap-4 items-center">
              <BodyHeatmap intensity={muscleIntensity} />
              <div className="space-y-4">
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