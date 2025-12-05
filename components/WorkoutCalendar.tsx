import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { WorkoutSession } from '../types';

interface WorkoutCalendarProps {
  workouts: WorkoutSession[];
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ workouts }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get first and last day of current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Map workouts to dates
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, number>();
    workouts.forEach(workout => {
      const date = new Date(workout.startTime);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    });
    return map;
  }, [workouts]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date has workouts
  const getWorkoutCount = (day: number) => {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    return workoutsByDate.get(dateKey) || 0;
  };

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear();
  };

  // Generate calendar days array
  const calendarDays = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const workoutCount = getWorkoutCount(day);
    const today = isToday(day);

    calendarDays.push(
      <div
        key={day}
        className={`aspect-square flex flex-col items-center justify-center relative border transition-all ${
          workoutCount > 0
            ? 'border-primary bg-primary/10 hover:bg-primary/20'
            : 'border-[#222] hover:border-[#333]'
        } ${today ? 'ring-2 ring-white' : ''}`}
      >
        <span className={`text-xs font-bold ${workoutCount > 0 ? 'text-primary' : 'text-[#666]'} ${today ? 'text-white' : ''}`}>
          {day}
        </span>
        {workoutCount > 0 && (
          <div className="absolute bottom-0.5 flex items-center gap-0.5">
            {Array.from({ length: Math.min(workoutCount, 3) }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-primary rounded-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const totalWorkoutsThisMonth = Array.from(workoutsByDate.entries())
    .filter(([key]) => {
      const [year, month] = key.split('-').map(Number);
      return year === currentDate.getFullYear() && month === currentDate.getMonth();
    })
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="bg-[#0a0a0a] border border-[#222] p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm volt-header text-white uppercase">{monthName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Flame size={12} className="text-primary" />
            <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
              {totalWorkoutsThisMonth} Session{totalWorkoutsThisMonth !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="w-8 h-8 flex items-center justify-center border border-[#333] text-[#666] hover:border-primary hover:text-primary transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 h-8 flex items-center justify-center border border-[#333] text-[#666] hover:border-primary hover:text-primary transition-colors text-[10px] font-bold uppercase"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="w-8 h-8 flex items-center justify-center border border-[#333] text-[#666] hover:border-primary hover:text-primary transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-[#444] uppercase py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#222]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-[#222]" />
          <span className="text-[9px] text-[#666] uppercase font-mono">Rest</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-primary bg-primary/10" />
          <span className="text-[9px] text-primary uppercase font-mono">Trained</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white" />
          <span className="text-[9px] text-white uppercase font-mono">Today</span>
        </div>
      </div>
    </div>
  );
};

export default WorkoutCalendar;
