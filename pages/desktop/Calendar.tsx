import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Dumbbell } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

export const DesktopCalendar: React.FC = () => {
  const { history } = useStore();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const completedWorkouts = history.filter(w => w.status === 'completed');

  // Get workouts for a specific date
  const getWorkoutsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return completedWorkouts.filter(w => {
      const workoutDate = new Date(w.startTime);
      return workoutDate.toDateString() === dateStr;
    });
  };

  // Calendar generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Fill in leading empty days
  for (let i = 0; i < startingDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Fill in days of month
  for (let day = 1; day <= daysInMonth; day++) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(new Date(year, month, day));
  }

  // Fill in trailing empty days
  while (currentWeek.length < 7) {
    currentWeek.push(null);
  }
  weeks.push(currentWeek);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black italic text-white mb-2">CALENDAR</h1>
        <p className="text-[#666] font-mono text-sm uppercase tracking-wider">
          Visual workout schedule and history
        </p>
      </div>

      {/* Calendar Controls */}
      <div className="bg-[#111] border border-[#222] p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-[#1a1a1a] transition-colors"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <h2 className="text-2xl font-black italic text-white">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-[#1a1a1a] transition-colors"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-[#666] uppercase tracking-widest p-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((date, dayIndex) => {
                if (!date) {
                  return <div key={`empty-${weekIndex}-${dayIndex}`} className="aspect-square" />;
                }

                const workouts = getWorkoutsForDate(date);
                const hasWorkout = workouts.length > 0;
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={date.toISOString()}
                    className={`aspect-square border transition-colors ${
                      isToday ? 'border-primary bg-primary/5' : 'border-[#222]'
                    } ${
                      hasWorkout ? 'bg-[#1a1a1a] hover:bg-[#222] cursor-pointer' : 'bg-black'
                    }`}
                    onClick={() => {
                      if (workouts.length === 1) {
                        navigate(`/history/${workouts[0].id}`);
                      }
                    }}
                  >
                    <div className="p-2 h-full flex flex-col">
                      <div className={`text-xs font-mono ${isToday ? 'text-primary font-bold' : 'text-[#888]'}`}>
                        {date.getDate()}
                      </div>
                      {hasWorkout && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <Dumbbell size={16} className="text-primary mb-1" />
                          <div className="text-[10px] text-primary font-bold">
                            {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon size={20} className="text-primary" />
            <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Workouts This Month
            </span>
          </div>
          <div className="text-4xl font-black italic text-white">
            {completedWorkouts.filter(w => {
              const workoutDate = new Date(w.startTime);
              return workoutDate.getMonth() === month && workoutDate.getFullYear() === year;
            }).length}
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell size={20} className="text-primary" />
            <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Training Days
            </span>
          </div>
          <div className="text-4xl font-black italic text-white">
            {new Set(
              completedWorkouts
                .filter(w => {
                  const workoutDate = new Date(w.startTime);
                  return workoutDate.getMonth() === month && workoutDate.getFullYear() === year;
                })
                .map(w => new Date(w.startTime).toDateString())
            ).size}
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon size={20} className="text-blue-500" />
            <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Days Remaining
            </span>
          </div>
          <div className="text-4xl font-black italic text-white">
            {lastDayOfMonth.getDate() - new Date().getDate()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopCalendar;
