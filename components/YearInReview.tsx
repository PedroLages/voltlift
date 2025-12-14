import React, { useState, useMemo } from 'react';
import { X, Calendar, Dumbbell, Trophy, Flame, TrendingUp, Zap, Target, ChevronLeft, ChevronRight, Share2, Award, BarChart2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY } from '../constants';
import { haptic } from '../services/haptics';

interface YearStats {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  totalDuration: number;
  averageWorkoutDuration: number;
  longestStreak: number;
  currentStreak: number;
  mostActiveMonth: { month: string; count: number };
  favoriteExercise: { name: string; count: number };
  strongestLift: { name: string; weight: number; reps: number };
  totalPRs: number;
  workoutDaysPerWeek: number;
  topExercises: { name: string; volume: number; sessions: number }[];
  monthlyWorkouts: { month: string; count: number }[];
  muscleGroupBreakdown: { group: string; volume: number; percentage: number }[];
}

const SLIDE_COLORS = [
  'from-[#ccff00]/20 to-black',
  'from-purple-900/30 to-black',
  'from-blue-900/30 to-black',
  'from-red-900/30 to-black',
  'from-green-900/30 to-black',
  'from-orange-900/30 to-black',
  'from-pink-900/30 to-black',
  'from-cyan-900/30 to-black',
];

export const YearInReview: React.FC<{ year?: number; onClose: () => void }> = ({ year = new Date().getFullYear(), onClose }) => {
  const { history, settings } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Calculate year stats
  const stats = useMemo((): YearStats | null => {
    const startOfYear = new Date(year, 0, 1).getTime();
    const endOfYear = new Date(year, 11, 31, 23, 59, 59).getTime();

    const yearWorkouts = history.filter(
      w => w.status === 'completed' && w.endTime && w.endTime >= startOfYear && w.endTime <= endOfYear
    );

    if (yearWorkouts.length === 0) return null;

    // Basic stats
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalDuration = 0;
    const exerciseCounts: Record<string, { count: number; volume: number }> = {};
    const muscleGroupVolume: Record<string, number> = {};
    const monthCounts: Record<number, number> = {};
    let bestLift = { exerciseId: '', weight: 0, reps: 0 };

    yearWorkouts.forEach(workout => {
      const duration = workout.endTime ? (workout.endTime - workout.startTime) / 60000 : 0;
      totalDuration += duration;

      const month = new Date(workout.endTime || workout.startTime).getMonth();
      monthCounts[month] = (monthCounts[month] || 0) + 1;

      workout.logs.forEach(log => {
        const exercise = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
        if (!exercise) return;

        exerciseCounts[log.exerciseId] = exerciseCounts[log.exerciseId] || { count: 0, volume: 0 };
        exerciseCounts[log.exerciseId].count++;

        log.sets.forEach(set => {
          if (set.completed) {
            const volume = set.weight * set.reps;
            totalVolume += volume;
            totalSets++;
            totalReps += set.reps;

            exerciseCounts[log.exerciseId].volume += volume;
            muscleGroupVolume[exercise.muscleGroup] = (muscleGroupVolume[exercise.muscleGroup] || 0) + volume;

            if (set.weight > bestLift.weight) {
              bestLift = { exerciseId: log.exerciseId, weight: set.weight, reps: set.reps };
            }
          }
        });
      });
    });

    // Calculate streaks
    const workoutDates = yearWorkouts
      .map(w => new Date(w.endTime || w.startTime).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let longestStreak = 1;
    let currentStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < workoutDates.length; i++) {
      const prevDate = new Date(workoutDates[i - 1]);
      const currDate = new Date(workoutDates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 2) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Find most active month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let mostActiveMonth = { month: months[0], count: 0 };
    Object.entries(monthCounts).forEach(([m, count]) => {
      if (count > mostActiveMonth.count) {
        mostActiveMonth = { month: months[parseInt(m)], count };
      }
    });

    // Find favorite exercise
    let favoriteExercise = { name: 'None', count: 0 };
    Object.entries(exerciseCounts).forEach(([id, data]) => {
      if (data.count > favoriteExercise.count) {
        const ex = EXERCISE_LIBRARY.find(e => e.id === id);
        favoriteExercise = { name: ex?.name || 'Unknown', count: data.count };
      }
    });

    // Get strongest lift
    const strongestLift = {
      name: EXERCISE_LIBRARY.find(e => e.id === bestLift.exerciseId)?.name || 'Unknown',
      weight: bestLift.weight,
      reps: bestLift.reps
    };

    // Top exercises by volume
    const topExercises = Object.entries(exerciseCounts)
      .map(([id, data]) => ({
        name: EXERCISE_LIBRARY.find(e => e.id === id)?.name || 'Unknown',
        volume: data.volume,
        sessions: data.count
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    // Monthly breakdown
    const monthlyWorkouts = months.map((month, idx) => ({
      month,
      count: monthCounts[idx] || 0
    }));

    // Muscle group breakdown
    const totalMuscleVolume = Object.values(muscleGroupVolume).reduce((a, b) => a + b, 0);
    const muscleGroupBreakdown = Object.entries(muscleGroupVolume)
      .map(([group, volume]) => ({
        group,
        volume,
        percentage: Math.round((volume / totalMuscleVolume) * 100)
      }))
      .sort((a, b) => b.volume - a.volume);

    // Count PRs from settings
    const totalPRs = Object.values(settings.personalRecords || {}).reduce((acc, pr) => {
      const prDate = pr.bestWeight?.date || 0;
      if (prDate >= startOfYear && prDate <= endOfYear) acc++;
      return acc;
    }, 0);

    return {
      totalWorkouts: yearWorkouts.length,
      totalVolume,
      totalSets,
      totalReps,
      totalDuration,
      averageWorkoutDuration: Math.round(totalDuration / yearWorkouts.length),
      longestStreak,
      currentStreak,
      mostActiveMonth,
      favoriteExercise,
      strongestLift,
      totalPRs,
      workoutDaysPerWeek: Math.round((yearWorkouts.length / 52) * 10) / 10,
      topExercises,
      monthlyWorkouts,
      muscleGroupBreakdown
    };
  }, [history, settings.personalRecords, year]);

  const slides = useMemo(() => {
    if (!stats) return [];

    return [
      // Slide 1: Welcome
      {
        title: `YOUR ${year}`,
        subtitle: 'WRAPPED',
        content: (
          <div className="text-center">
            <div className="text-8xl font-black italic text-primary mb-4 animate-bounce-in">
              {stats.totalWorkouts}
            </div>
            <p className="text-xl font-bold text-white uppercase">Total Workouts</p>
            <p className="text-sm text-[#666] mt-2">That's {stats.workoutDaysPerWeek} days per week on average</p>
          </div>
        )
      },
      // Slide 2: Volume
      {
        title: 'TOTAL VOLUME',
        subtitle: 'MOVED',
        content: (
          <div className="text-center">
            <div className="text-6xl font-black italic text-white mb-2 animate-scale-in">
              {(stats.totalVolume / 1000000).toFixed(1)}M
            </div>
            <p className="text-lg font-bold text-primary uppercase">Pounds Lifted</p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-black/50 p-4 border border-[#333]">
                <div className="text-2xl font-black italic text-white">{stats.totalSets}</div>
                <div className="text-[10px] text-[#666] uppercase">Total Sets</div>
              </div>
              <div className="bg-black/50 p-4 border border-[#333]">
                <div className="text-2xl font-black italic text-white">{stats.totalReps.toLocaleString()}</div>
                <div className="text-[10px] text-[#666] uppercase">Total Reps</div>
              </div>
            </div>
          </div>
        )
      },
      // Slide 3: Time
      {
        title: 'TIME',
        subtitle: 'INVESTED',
        content: (
          <div className="text-center">
            <div className="text-6xl font-black italic text-white mb-2 animate-scale-in">
              {Math.round(stats.totalDuration / 60)}
            </div>
            <p className="text-lg font-bold text-primary uppercase">Hours Training</p>
            <p className="text-sm text-[#666] mt-4">Average: {stats.averageWorkoutDuration} min per workout</p>
          </div>
        )
      },
      // Slide 4: Favorite Exercise
      {
        title: 'YOUR',
        subtitle: 'FAVORITE',
        content: (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-primary/20 border-2 border-primary flex items-center justify-center">
              <Dumbbell size={48} className="text-primary" />
            </div>
            <div className="text-2xl font-black italic text-white uppercase mb-2 animate-slide-up">
              {stats.favoriteExercise.name}
            </div>
            <p className="text-sm text-[#666]">You did this {stats.favoriteExercise.count} times this year</p>
          </div>
        )
      },
      // Slide 5: Strongest Lift
      {
        title: 'STRONGEST',
        subtitle: 'LIFT',
        content: (
          <div className="text-center">
            <Trophy size={64} className="mx-auto mb-4 text-yellow-500 animate-bounce-in" />
            <div className="text-2xl font-black italic text-white uppercase mb-2">
              {stats.strongestLift.name}
            </div>
            <div className="text-5xl font-black italic text-primary">
              {stats.strongestLift.weight}
              <span className="text-lg text-white ml-2">LBS</span>
            </div>
            <p className="text-sm text-[#666] mt-2">x{stats.strongestLift.reps} reps</p>
          </div>
        )
      },
      // Slide 6: Streak
      {
        title: 'CONSISTENCY',
        subtitle: 'KING',
        content: (
          <div className="text-center">
            <Flame size={64} className="mx-auto mb-4 text-orange-500 animate-pulse" />
            <div className="text-6xl font-black italic text-white mb-2">{stats.longestStreak}</div>
            <p className="text-lg font-bold text-primary uppercase">Day Longest Streak</p>
            <p className="text-sm text-[#666] mt-4">Most active: {stats.mostActiveMonth.month} with {stats.mostActiveMonth.count} workouts</p>
          </div>
        )
      },
      // Slide 7: Top Exercises
      {
        title: 'TOP',
        subtitle: 'MOVEMENTS',
        content: (
          <div>
            <div className="space-y-3">
              {stats.topExercises.map((ex, idx) => (
                <div
                  key={ex.name}
                  className="flex items-center gap-3 bg-black/50 p-3 border border-[#333] animate-slide-right"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-8 h-8 bg-primary text-black font-black flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white uppercase">{ex.name}</div>
                    <div className="text-[10px] text-[#666]">{ex.sessions} sessions • {(ex.volume / 1000).toFixed(0)}K lbs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      // Slide 8: Muscle Balance
      {
        title: 'MUSCLE',
        subtitle: 'BALANCE',
        content: (
          <div>
            <div className="space-y-2">
              {stats.muscleGroupBreakdown.slice(0, 6).map(mg => (
                <div key={mg.group}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white uppercase font-bold">{mg.group}</span>
                    <span className="text-primary">{mg.percentage}%</span>
                  </div>
                  <div className="h-3 bg-[#222] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-1000"
                      style={{ width: `${mg.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      // Slide 9: Final Summary
      {
        title: `${year}`,
        subtitle: 'COMPLETE',
        content: (
          <div className="text-center">
            <Award size={64} className="mx-auto mb-4 text-primary animate-bounce-in" />
            <p className="text-lg font-bold text-white mb-6">You showed up. You lifted. You grew.</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-black/50 p-3 border border-primary/30">
                <div className="text-xl font-black italic text-primary">{stats.totalWorkouts}</div>
                <div className="text-[8px] text-[#666] uppercase">Workouts</div>
              </div>
              <div className="bg-black/50 p-3 border border-primary/30">
                <div className="text-xl font-black italic text-primary">{(stats.totalVolume / 1000000).toFixed(1)}M</div>
                <div className="text-[8px] text-[#666] uppercase">Volume</div>
              </div>
              <div className="bg-black/50 p-3 border border-primary/30">
                <div className="text-xl font-black italic text-primary">{stats.longestStreak}</div>
                <div className="text-[8px] text-[#666] uppercase">Best Streak</div>
              </div>
            </div>
            <p className="text-xs text-[#666] uppercase">Keep pushing in {year + 1}</p>
          </div>
        )
      }
    ];
  }, [stats, year]);

  const nextSlide = () => {
    haptic('selection');
    setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  };

  const prevSlide = () => {
    haptic('selection');
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };

  if (!stats) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <Calendar size={64} className="mx-auto mb-4 text-[#333]" />
          <h2 className="text-xl font-black uppercase text-white mb-2">No Data for {year}</h2>
          <p className="text-sm text-[#666] mb-6">Complete some workouts to see your year in review!</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-primary text-black font-bold uppercase text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-b ${SLIDE_COLORS[currentSlide % SLIDE_COLORS.length]} flex flex-col`}>
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 flex items-center justify-center text-white hover:text-primary transition-colors"
      >
        <X size={24} />
      </button>

      {/* Progress Dots */}
      <div className="absolute top-4 left-4 right-16 flex gap-1 z-10">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 h-1 transition-colors ${
              idx <= currentSlide ? 'bg-primary' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1">
            {slide.title}
          </h2>
          <h1 className="text-4xl font-black italic text-white uppercase">
            {slide.subtitle}
          </h1>
        </div>

        {/* Slide Content */}
        <div className="w-full max-w-md">
          {slide.content}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 flex justify-between items-center">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`w-12 h-12 flex items-center justify-center border transition-colors ${
            currentSlide === 0
              ? 'border-[#333] text-[#333] cursor-not-allowed'
              : 'border-white/30 text-white hover:border-primary hover:text-primary'
          }`}
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-xs text-[#666] font-mono uppercase">
          {currentSlide + 1} / {slides.length}
        </div>

        {currentSlide === slides.length - 1 ? (
          <button
            onClick={onClose}
            className="px-6 py-3 bg-primary text-black font-bold uppercase text-xs hover:bg-white transition-colors"
          >
            Done
          </button>
        ) : (
          <button
            onClick={nextSlide}
            className="w-12 h-12 flex items-center justify-center border border-primary text-primary hover:bg-primary hover:text-black transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default YearInReview;
