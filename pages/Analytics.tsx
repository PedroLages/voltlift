import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY } from '../constants';
import { ArrowLeft, TrendingUp, BarChart2, Calendar, Activity, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BodyHeatmap from '../components/BodyHeatmap';
import PRHistoryTimeline from '../components/PRHistoryTimeline';

const Analytics = () => {
  const { history, settings } = useStore();
  const navigate = useNavigate();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(EXERCISE_LIBRARY[0].id);

  // 1. Prepare Data for Charting
  // We want to graph Estimated 1RM over time for the selected exercise.
  // Formula: Weight * (1 + Reps/30)
  
  const chartData = useMemo(() => {
    const dataPoints: { date: number, value: number, label: string }[] = [];

    // Sort history chronologically
    const sortedHistory = [...history]
        .filter(h => h.status === 'completed')
        .sort((a, b) => a.startTime - b.startTime);

    sortedHistory.forEach(session => {
        const log = session.logs.find(l => l.exerciseId === selectedExerciseId);
        if (log) {
            // Find best set in this session
            let max1RM = 0;
            log.sets.forEach(set => {
                if (set.completed && set.weight > 0 && set.reps > 0) {
                    const e1rm = set.weight * (1 + set.reps / 30);
                    if (e1rm > max1RM) max1RM = e1rm;
                }
            });

            if (max1RM > 0) {
                dataPoints.push({
                    date: session.startTime,
                    value: Math.round(max1RM),
                    label: new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                });
            }
        }
    });

    return dataPoints;
  }, [history, selectedExerciseId]);

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

  // 3. SVG Chart Logic
  const Chart = ({ data }: { data: typeof chartData }) => {
      if (data.length < 2) return <div className="h-64 flex items-center justify-center border border-[#333] text-[#666] font-mono text-xs uppercase">Not enough data to visualize trends.</div>;

      const width = 100;
      const height = 50;
      const padding = 5;

      const minVal = Math.min(...data.map(d => d.value)) * 0.9;
      const maxVal = Math.max(...data.map(d => d.value)) * 1.1;
      
      const getX = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);
      const getY = (val: number) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);

      const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

      return (
        <div className="relative w-full aspect-[2/1] bg-[#111] border border-[#222] p-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="#333" strokeWidth="0.5" strokeDasharray="2" />
                <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#333" strokeWidth="0.5" strokeDasharray="2" />
                <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#333" strokeWidth="0.5" strokeDasharray="2" />

                {/* The Line */}
                <polyline 
                    points={points} 
                    fill="none" 
                    stroke="#ccff00" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                />

                {/* Data Points */}
                {data.map((d, i) => (
                    <circle 
                        key={i} 
                        cx={getX(i)} 
                        cy={getY(d.value)} 
                        r="2" 
                        fill="#000" 
                        stroke="#ccff00" 
                        strokeWidth="1"
                    />
                ))}
            </svg>
            
            {/* Labels */}
            <div className="absolute top-2 left-2 text-[10px] text-[#666]">{Math.round(maxVal)}</div>
            <div className="absolute bottom-2 left-2 text-[10px] text-[#666]">{Math.round(minVal)}</div>
            <div className="absolute bottom-1 right-2 text-[10px] text-[#666]">{data[data.length-1]?.label}</div>
        </div>
      );
  };

  const exercisePRHistory = settings.personalRecords[selectedExerciseId];

  return (
    <div className="p-6 pb-24 min-h-screen bg-black">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="text-[#666] hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="volt-header text-3xl text-white">ANALYTICS</h1>
      </div>

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

      {/* Exercise Selector */}
      <div className="mb-8 border-t border-[#222] pt-8">
          <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">Select Movement Analysis</label>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#111] p-4 border border-[#222]">
           <div className="flex items-center gap-2 text-primary mb-2">
               <TrendingUp size={16} /> <span className="text-[10px] font-black uppercase">Est. 1RM</span>
           </div>
           <div className="text-3xl font-black italic text-white">
               {chartData.length > 0 ? chartData[chartData.length-1].value : 0} 
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

      {/* Main Chart */}
      <div className="mb-8">
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart2 size={14} /> Strength Trend (Estimated 1RM)
          </h3>
          <Chart data={chartData} />
      </div>

      {/* PR History Timeline */}
      <div className="mb-8">
          <PRHistoryTimeline
            prHistory={exercisePRHistory}
            exerciseName={EXERCISE_LIBRARY.find(e => e.id === selectedExerciseId)?.name || 'Exercise'}
            units={settings.units}
          />
      </div>

      <div className="p-4 bg-[#111] border-l-2 border-primary">
          <h4 className="font-bold text-white uppercase italic text-sm mb-1">IronPath Insight</h4>
          <p className="text-xs text-[#888] font-mono leading-relaxed">
              Consistently tracking specific movements allows the system to calculate your 1RM accurately.
              Focus on progressive overload to see this trend line climb.
          </p>
      </div>

    </div>
  );
};

export default Analytics;