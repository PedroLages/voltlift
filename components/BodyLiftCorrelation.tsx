import React from 'react';
import { TrendingUp, Activity, Zap, Target } from 'lucide-react';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY } from '../constants';
import { calculate1RM } from '../services/strengthScore';

export const BodyLiftCorrelation: React.FC = () => {
  const { dailyLogs, history, settings } = useStore();

  // Get bodyweight trend data
  const bodyweightData = Object.values(dailyLogs)
    .filter(log => log.bodyweight)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(log => ({
      date: log.date,
      weight: log.bodyweight!,
      timestamp: new Date(log.date).getTime()
    }));

  if (bodyweightData.length < 2) {
    return (
      <div className="bg-[#111] border border-[#222] p-6 text-center">
        <Activity size={32} className="text-[#333] mx-auto mb-2" />
        <p className="text-sm text-[#666] font-mono">Insufficient data for correlation analysis</p>
        <p className="text-[10px] text-[#444] font-mono mt-1">Log bodyweight and complete workouts to see insights</p>
      </div>
    );
  }

  // Calculate bodyweight change
  const firstWeight = bodyweightData[0].weight;
  const latestWeight = bodyweightData[bodyweightData.length - 1].weight;
  const weightChange = latestWeight - firstWeight;
  const weightChangePercent = (weightChange / firstWeight) * 100;

  // Get strength changes for major lifts
  const majorLifts = ['bench-press', 'squat', 'deadlift', 'overhead-press'];
  const strengthChanges = majorLifts.map(exerciseId => {
    const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
    if (!exercise) return null;

    // Get all completed workouts with this exercise
    const workoutsWithExercise = history
      .filter(w => w.status === 'completed' && w.logs.some(l => l.exerciseId === exerciseId))
      .sort((a, b) => a.startTime - b.startTime);

    if (workoutsWithExercise.length < 2) return null;

    // Get first and last workout
    const firstWorkout = workoutsWithExercise[0];
    const lastWorkout = workoutsWithExercise[workoutsWithExercise.length - 1];

    const firstLog = firstWorkout.logs.find(l => l.exerciseId === exerciseId);
    const lastLog = lastWorkout.logs.find(l => l.exerciseId === exerciseId);

    if (!firstLog || !lastLog) return null;

    // Calculate estimated 1RM from best sets
    const getBest1RM = (log: any) => {
      const validSets = log.sets.filter((s: any) => s.completed && s.type !== 'W');
      if (validSets.length === 0) return 0;

      const best1RMs = validSets.map((s: any) => calculate1RM(s.weight, s.reps).estimated1RM);
      return Math.max(...best1RMs);
    };

    const first1RM = getBest1RM(firstLog);
    const last1RM = getBest1RM(lastLog);
    const strengthChange = last1RM - first1RM;
    const strengthChangePercent = first1RM > 0 ? (strengthChange / first1RM) * 100 : 0;

    return {
      exerciseId,
      name: exercise.name,
      first1RM,
      last1RM,
      strengthChange,
      strengthChangePercent,
      workoutCount: workoutsWithExercise.length
    };
  }).filter(Boolean);

  // Calculate lean mass proxy (bodyweight × strength score)
  const calculateLeanMassProxy = (weight: number, date: string) => {
    // Find workouts near this date (within 7 days)
    const timestamp = new Date(date).getTime();
    const nearbyWorkouts = history.filter(w => {
      const diff = Math.abs(w.startTime - timestamp);
      return diff < 7 * 24 * 60 * 60 * 1000 && w.status === 'completed';
    });

    if (nearbyWorkouts.length === 0) return null;

    // Calculate average strength across all exercises in nearby workouts
    let totalStrength = 0;
    let exerciseCount = 0;

    nearbyWorkouts.forEach(workout => {
      workout.logs.forEach(log => {
        const validSets = log.sets.filter(s => s.completed && s.type !== 'W');
        if (validSets.length > 0) {
          const maxSet = validSets.reduce((max, set) =>
            set.weight > max.weight ? set : max, validSets[0]
          );
          totalStrength += maxSet.weight;
          exerciseCount++;
        }
      });
    });

    if (exerciseCount === 0) return null;

    const avgStrength = totalStrength / exerciseCount;
    return weight * (avgStrength / 100); // Normalize
  };

  const leanMassProxyData = bodyweightData
    .map(entry => ({
      date: entry.date,
      value: calculateLeanMassProxy(entry.weight, entry.date)
    }))
    .filter(entry => entry.value !== null);

  const leanMassChange = leanMassProxyData.length >= 2
    ? leanMassProxyData[leanMassProxyData.length - 1].value! - leanMassProxyData[0].value!
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-[#111] border border-[#222] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase text-white">Body-Strength Correlation</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Bodyweight Change */}
          <div className="bg-black border border-[#222] p-3">
            <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-1">
              Bodyweight Change
            </div>
            <div className={`text-xl font-black italic ${weightChange >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
              {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)} {settings.units}
            </div>
            <div className="text-[10px] text-[#666] font-mono">
              {weightChangePercent >= 0 ? '+' : ''}{weightChangePercent.toFixed(1)}%
            </div>
          </div>

          {/* Lean Mass Proxy */}
          {leanMassChange !== 0 && (
            <div className="bg-black border border-[#222] p-3">
              <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-1">
                Lean Mass Index
              </div>
              <div className={`text-xl font-black italic ${leanMassChange >= 0 ? 'text-primary' : 'text-red-500'}`}>
                {leanMassChange >= 0 ? '+' : ''}{leanMassChange.toFixed(1)}
              </div>
              <div className="text-[10px] text-[#666] font-mono">
                Weight × Strength
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-[#444] font-mono">
          {weightChange > 0 && leanMassChange > 0 && (
            "Body weight increased with strength gains - likely lean muscle growth 💪"
          )}
          {weightChange < 0 && leanMassChange > 0 && (
            "Body weight decreased while strength increased - excellent fat loss with muscle retention 🔥"
          )}
          {weightChange > 0 && leanMassChange < 0 && (
            "Body weight increased but strength decreased - may indicate fat gain or overtraining"
          )}
          {weightChange < 0 && leanMassChange < 0 && (
            "Body weight and strength both decreased - possible muscle loss during cut"
          )}
        </p>
      </div>

      {/* Lift-Specific Changes */}
      {strengthChanges.length > 0 && (
        <div className="bg-[#111] border border-[#222] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-primary" />
            <h3 className="text-sm font-bold uppercase text-white">Strength Progress</h3>
          </div>

          <div className="space-y-3">
            {strengthChanges.map((lift: any) => (
              <div key={lift.exerciseId} className="bg-black border border-[#222] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-bold uppercase text-white">{lift.name}</div>
                    <div className="text-[10px] text-[#666] font-mono">{lift.workoutCount} Workouts</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-black italic ${lift.strengthChange >= 0 ? 'text-primary' : 'text-red-500'}`}>
                      {lift.strengthChange >= 0 ? '+' : ''}{lift.strengthChange.toFixed(0)} {settings.units}
                    </div>
                    <div className="text-[10px] text-[#666] font-mono">
                      {lift.strengthChangePercent >= 0 ? '+' : ''}{lift.strengthChangePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-[#222] overflow-hidden">
                  <div
                    className={`h-full transition-all ${lift.strengthChange >= 0 ? 'bg-primary' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(lift.strengthChangePercent), 100)}%` }}
                  />
                </div>

                {/* 1RM Estimates */}
                <div className="flex justify-between mt-2 text-[10px] text-[#666] font-mono">
                  <span>Est. 1RM: {lift.first1RM.toFixed(0)} → {lift.last1RM.toFixed(0)} {settings.units}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-[#111] border border-primary/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-primary" />
          <h4 className="text-xs font-bold uppercase text-white">Insights</h4>
        </div>
        <ul className="space-y-2 text-[10px] text-[#888] font-mono">
          {weightChange > 0 && strengthChanges.some((l: any) => l.strengthChange > 0) && (
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Bodyweight gain with strength increases suggests successful bulking phase</span>
            </li>
          )}
          {weightChange < 0 && strengthChanges.some((l: any) => l.strengthChange > 0) && (
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Weight loss with strength gains - optimal body recomposition</span>
            </li>
          )}
          {strengthChanges.every((l: any) => l.strengthChange > 0) && (
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>All major lifts improved - training program is working</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-[#666]">•</span>
            <span>Continue tracking bodyweight and workouts for more accurate correlations</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BodyLiftCorrelation;
