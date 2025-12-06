import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Flame,
  Calendar as CalendarIcon,
  Dumbbell,
  Trophy,
  Target,
  Clock,
  Activity
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { EXERCISE_LIBRARY } from '../../constants';
import { formatTime } from '../../utils/formatters';

export const DesktopOverview: React.FC = () => {
  const { history, settings, programs, templates } = useStore();
  const navigate = useNavigate();

  // Calculate stats
  const completedWorkouts = history.filter(w => w.status === 'completed');
  const totalWorkouts = completedWorkouts.length;

  // Calculate current streak
  const calculateStreak = () => {
    const sorted = [...completedWorkouts].sort((a, b) => b.startTime - a.startTime);
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const workout of sorted) {
      const workoutDate = new Date(workout.startTime);
      workoutDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  // Get active program info
  const activeProgram = settings.activeProgram
    ? programs.find(p => p.id === settings.activeProgram?.programId)
    : null;

  // Calculate total workout time
  const totalMinutes = completedWorkouts.reduce((sum, w) => {
    if (w.endTime) {
      return sum + Math.floor((w.endTime - w.startTime) / 1000 / 60);
    }
    return sum;
  }, 0);

  // Get recent workouts
  const recentWorkouts = [...completedWorkouts]
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, 5);

  // Calculate personal records count
  const totalPRs = Object.keys(settings.personalRecords || {}).length;

  // Get most trained exercises
  const exerciseCounts = completedWorkouts.reduce((acc, workout) => {
    workout.logs.forEach(log => {
      acc[log.exerciseId] = (acc[log.exerciseId] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topExercises = Object.entries(exerciseCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black italic text-white mb-2">OVERVIEW</h1>
        <p className="text-[#666] font-mono text-sm uppercase tracking-wider">
          Your training command center
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Total Workouts */}
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex items-center gap-3 mb-3">
            <Dumbbell size={24} className="text-primary" />
            <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Total Workouts
            </span>
          </div>
          <div className="text-4xl font-black italic text-white">{totalWorkouts}</div>
        </div>

        {/* Current Streak */}
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex items-center gap-3 mb-3">
            <Flame size={24} className="text-orange-500" />
            <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Current Streak
            </span>
          </div>
          <div className="text-4xl font-black italic text-white">{currentStreak}</div>
          <div className="text-[10px] text-[#666] font-mono mt-1">
            {currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Total Time */}
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={24} className="text-blue-500" />
            <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Total Time
            </span>
          </div>
          <div className="text-4xl font-black italic text-white">
            {Math.floor(totalMinutes / 60)}
          </div>
          <div className="text-[10px] text-[#666] font-mono mt-1">hours trained</div>
        </div>

        {/* Personal Records */}
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex items-center gap-3 mb-3">
            <Trophy size={24} className="text-primary" />
            <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Personal Records
            </span>
          </div>
          <div className="text-4xl font-black italic text-white">{totalPRs}</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Active Program */}
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-primary" />
            <h2 className="text-lg font-black uppercase text-white">Active Program</h2>
          </div>
          {activeProgram ? (
            <div>
              <h3 className="text-2xl font-black italic text-white mb-2">
                {activeProgram.name}
              </h3>
              <p className="text-sm text-[#888] mb-4">{activeProgram.description}</p>
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <div className="text-sm text-[#666] uppercase font-bold tracking-widest">
                    Week {Math.floor((settings.activeProgram?.currentSessionIndex || 0) /
                      activeProgram.sessions.length * activeProgram.durationWeeks) + 1}
                  </div>
                  <div className="text-xs text-[#444] font-mono">
                    of {activeProgram.durationWeeks}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#666] uppercase font-bold tracking-widest">
                    Session {(settings.activeProgram?.currentSessionIndex || 0) + 1}
                  </div>
                  <div className="text-xs text-[#444] font-mono">
                    of {activeProgram.sessions.length}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/lift')}
                className="w-full px-4 py-2 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
              >
                Continue Program
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity size={48} className="text-[#333] mx-auto mb-3" />
              <p className="text-sm text-[#666] mb-4">No active program</p>
              <button
                onClick={() => navigate('/desktop/programs')}
                className="px-6 py-2 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
              >
                Browse Programs
              </button>
            </div>
          )}
        </div>

        {/* Top Exercises */}
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-primary" />
            <h2 className="text-lg font-black uppercase text-white">Most Trained</h2>
          </div>
          {topExercises.length > 0 ? (
            <div className="space-y-3">
              {topExercises.map(([exerciseId, count], index) => {
                const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
                return (
                  <div key={exerciseId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 border border-primary flex items-center justify-center">
                        <span className="text-xs font-black text-primary">{index + 1}</span>
                      </div>
                      <span className="text-sm font-bold text-white uppercase">
                        {exercise?.name || exerciseId}
                      </span>
                    </div>
                    <div className="text-sm font-mono text-[#666]">
                      {count} {count === 1 ? 'session' : 'sessions'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#666] text-center py-8">
              No exercise data yet
            </p>
          )}
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="bg-[#111] border border-[#222] p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon size={20} className="text-primary" />
          <h2 className="text-lg font-black uppercase text-white">Recent Workouts</h2>
        </div>
        {recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-black border border-[#222] p-4 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/history/${workout.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase text-white">{workout.name}</h3>
                  <span className="text-xs text-[#666] font-mono">
                    {new Date(workout.startTime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#888] font-mono">
                  <span>{workout.logs.length} exercises</span>
                  {workout.endTime && (
                    <span>{formatTime(Math.floor((workout.endTime - workout.startTime) / 1000))}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarIcon size={48} className="text-[#333] mx-auto mb-3" />
            <p className="text-sm text-[#666]">No workouts yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopOverview;
