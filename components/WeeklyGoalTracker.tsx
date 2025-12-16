import React, { useMemo } from 'react';
import { Target, Check, X } from 'lucide-react';
import { useStore } from '../store/useStore';

export const WeeklyGoalTracker: React.FC = () => {
  const { settings, history } = useStore();
  const targetPerWeek = settings.goal?.targetPerWeek || 4;

  // Get current week's workouts
  const weeklyWorkouts = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekWorkouts = history.filter(session => {
      return session.completedAt && session.completedAt >= startOfWeek.getTime();
    });

    // Group by day
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const workoutsByDay = days.map((day, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);

      const hasWorkout = thisWeekWorkouts.some(w => {
        const workoutDate = new Date(w.completedAt!);
        return workoutDate.toDateString() === dayDate.toDateString();
      });

      const isToday = dayDate.toDateString() === now.toDateString();
      const isPast = dayDate < now && !isToday;

      return {
        day,
        hasWorkout,
        isToday,
        isPast
      };
    });

    return {
      count: thisWeekWorkouts.length,
      days: workoutsByDay
    };
  }, [history]);

  const progressPercent = Math.min((weeklyWorkouts.count / targetPerWeek) * 100, 100);
  const isOnTrack = weeklyWorkouts.count >= targetPerWeek;

  return (
    <div className="bg-[#111] border border-[#222] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-primary" />
        <h4 className="text-sm font-bold uppercase text-white">Weekly Goal</h4>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-2xl font-black italic text-white">
            {weeklyWorkouts.count} / {targetPerWeek}
          </span>
          <span className={`text-xs font-bold uppercase ${
            isOnTrack ? 'text-green-500' : 'text-[#666]'
          }`}>
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[#222] overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isOnTrack ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Day Indicators */}
      <div className="grid grid-cols-7 gap-1">
        {weeklyWorkouts.days.map(({ day, hasWorkout, isToday, isPast }) => (
          <div
            key={day}
            className={`flex flex-col items-center gap-1 p-2 border transition-colors ${
              isToday
                ? 'border-primary bg-primary/10'
                : hasWorkout
                ? 'border-green-500/30 bg-green-500/10'
                : isPast
                ? 'border-red-500/30 bg-red-500/10'
                : 'border-[#333]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase text-[#666]">{day}</span>
            {hasWorkout ? (
              <Check size={16} className="text-green-500" />
            ) : isPast ? (
              <X size={16} className="text-red-500/50" />
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>
        ))}
      </div>

      {/* Status Message */}
      {isOnTrack ? (
        <div className="mt-4 p-2 bg-green-500/10 border border-green-500/30">
          <p className="text-xs text-green-400 font-bold uppercase text-center">
            ✓ Goal Achieved!
          </p>
        </div>
      ) : (
        <div className="mt-4 p-2 bg-[#0a0a0a] border border-[#333]">
          <p className="text-xs text-[#888] text-center">
            {targetPerWeek - weeklyWorkouts.count} more {targetPerWeek - weeklyWorkouts.count === 1 ? 'workout' : 'workouts'} to hit your goal
          </p>
        </div>
      )}
    </div>
  );
};

export default WeeklyGoalTracker;
