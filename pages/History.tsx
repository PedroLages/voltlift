import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Clock, Box, Filter, X, Dumbbell, Zap, TrendingUp, Target, Award } from 'lucide-react';
import { EXERCISE_LIBRARY } from '../constants';
import EmptyState from '../components/EmptyState';
import WorkoutCalendar from '../components/WorkoutCalendar';
import { WorkoutSession } from '../types';
import { formatDate, getDuration } from '../utils/formatters';

const History = () => {
  const { history, templates } = useStore();
  const navigate = useNavigate();

  // Filter state
  const [dateFilter, setDateFilter] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [exerciseFilter, setExerciseFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const getTotalVolume = (session: WorkoutSession) => {
    let volume = 0;
    session.logs.forEach((log) => {
      log.sets.forEach((set) => {
        if (set.completed) volume += (set.weight * set.reps);
      });
    });
    return volume;
  };

  // Calculate workout intensity (0-100 based on volume and sets)
  const getWorkoutIntensity = (session: WorkoutSession): number => {
    const volume = getTotalVolume(session);
    const totalSets = session.logs.reduce((sum, log) => sum + log.sets.filter(s => s.completed).length, 0);
    // Normalize: 50K lbs = 100%, 5 sets per exercise = bonus
    const volumeScore = Math.min(volume / 50000 * 70, 70);
    const setsScore = Math.min(totalSets / session.logs.length * 5 * 30, 30);
    return Math.round(volumeScore + setsScore);
  };

  // Get total stats
  const totalVolume = useMemo(() => {
    return history.reduce((sum, session) => sum + getTotalVolume(session), 0);
  }, [history]);

  const currentStreak = useMemo(() => {
    if (history.length === 0) return 0;
    let streak = 0;
    const sortedHistory = [...history].sort((a, b) => b.startTime - a.startTime);
    const today = new Date().setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedHistory.length; i++) {
      const sessionDate = new Date(sortedHistory[i].startTime).setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - sessionDate) / (24 * 60 * 60 * 1000));

      if (i === 0 && daysDiff > 1) break; // Streak broken
      if (i > 0) {
        const prevSessionDate = new Date(sortedHistory[i - 1].startTime).setHours(0, 0, 0, 0);
        const gapDays = Math.floor((prevSessionDate - sessionDate) / (24 * 60 * 60 * 1000));
        if (gapDays > 1) break; // Streak broken
      }
      streak++;
    }
    return streak;
  }, [history]);

  // Get all unique exercises from history
  const allExercises = useMemo(() => {
    const exerciseIds = new Set<string>();
    history.forEach(session => {
      session.logs.forEach(log => exerciseIds.add(log.exerciseId));
    });
    return Array.from(exerciseIds).map(id =>
      EXERCISE_LIBRARY.find(e => e.id === id)
    ).filter(Boolean);
  }, [history]);

  // Filter workouts based on selected filters
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Date filter
    if (dateFilter !== 'all') {
      const now = Date.now();
      const daysInMs: Record<string, number> = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };
      const cutoff = now - daysInMs[dateFilter];
      filtered = filtered.filter(session => session.startTime >= cutoff);
    }

    // Exercise filter
    if (exerciseFilter !== 'all') {
      filtered = filtered.filter(session =>
        session.logs.some(log => log.exerciseId === exerciseFilter)
      );
    }

    // Template filter
    if (templateFilter !== 'all') {
      filtered = filtered.filter(session => session.sourceTemplateId === templateFilter);
    }

    return filtered;
  }, [history, dateFilter, exerciseFilter, templateFilter]);

  // Check if any filters are active
  const hasActiveFilters = dateFilter !== 'all' || exerciseFilter !== 'all' || templateFilter !== 'all';

  // Clear all filters
  const clearFilters = () => {
    setDateFilter('all');
    setExerciseFilter('all');
    setTemplateFilter('all');
  };

  return (
    <div className="p-6 pb-20">
      {/* Aggressive Skewed Header with Voltage Theme */}
      <div className="relative mb-8">
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Zap className="text-primary" size={28} strokeWidth={3} />
              <h1 className="text-5xl font-black italic uppercase tracking-tight text-white" style={{ transform: 'skewX(-5deg)' }}>
                POWER LOGS
              </h1>
            </div>
            <div className="text-[10px] font-bold text-[#666] uppercase tracking-widest mt-1 ml-11">
              {history.length} SESSION{history.length !== 1 ? 'S' : ''} RECORDED
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-3 border-2 transition-all uppercase font-black text-xs italic tracking-wider ${
              hasActiveFilters
                ? 'border-primary bg-primary text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                : 'border-[#333] text-[#666] hover:border-primary hover:text-primary'
            }`}
            style={{ transform: 'skewX(-5deg)' }}
          >
            <span style={{ transform: 'skewX(5deg)' }} className="block">
              <Filter size={16} className="inline mr-1" />
              FILTER
              {hasActiveFilters && ` (${filteredHistory.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Power Stats Bar - Aggressive Metrics */}
      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Total Sessions */}
          <div className="bg-gradient-to-br from-[#111] to-black border-2 border-[#222] p-4 relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:bg-primary/10 transition-all" />
            <TrendingUp className="text-primary/50 mb-2" size={18} strokeWidth={3} />
            <div className="text-3xl font-black italic text-white">{history.length}</div>
            <div className="text-[9px] font-bold text-[#666] uppercase tracking-widest mt-1">SESSIONS</div>
          </div>

          {/* Total Volume */}
          <div className="bg-gradient-to-br from-[#111] to-black border-2 border-[#222] p-4 relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:bg-primary/10 transition-all" />
            <Target className="text-primary/50 mb-2" size={18} strokeWidth={3} />
            <div className="text-3xl font-black italic text-white">{(totalVolume / 1000).toFixed(0)}K</div>
            <div className="text-[9px] font-bold text-[#666] uppercase tracking-widest mt-1">LBS MOVED</div>
          </div>

          {/* Current Streak */}
          <div className="bg-gradient-to-br from-[#111] to-black border-2 border-[#222] p-4 relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:bg-primary/10 transition-all" />
            <Award className="text-primary/50 mb-2" size={18} strokeWidth={3} />
            <div className="text-3xl font-black italic text-white">{currentStreak}</div>
            <div className="text-[9px] font-bold text-[#666] uppercase tracking-widest mt-1">DAY STREAK</div>
          </div>
        </div>
      )}

      {/* Workout Calendar */}
      <WorkoutCalendar workouts={history} />

      {/* Filter Panel - Bold Pill-Based Design */}
      {showFilters && (
        <div className="mb-6 bg-gradient-to-br from-[#111] to-black border-2 border-primary/30 p-6 space-y-5 shadow-[0_0_30px_rgba(204,255,0,0.1)]">
          {/* Date Range Filter - Bold Pills */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-primary" />
              <label className="text-xs font-black italic text-white uppercase tracking-wider">
                TIME RANGE
              </label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: '7d', label: '7D' },
                { value: '30d', label: '30D' },
                { value: '90d', label: '90D' },
                { value: 'all', label: 'ALL' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setDateFilter(option.value as any)}
                  className={`py-3 px-4 text-xs font-black italic uppercase tracking-wider transition-all border-2 ${
                    dateFilter === option.value
                      ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                      : 'bg-black border-[#333] text-[#666] hover:text-white hover:border-[#555]'
                  }`}
                  style={{ transform: 'skewX(-5deg)' }}
                >
                  <span style={{ transform: 'skewX(5deg)' }} className="block">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Filter - Compact Pills */}
          {allExercises.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-primary" />
                <label className="text-xs font-black italic text-white uppercase tracking-wider">
                  EXERCISE
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExerciseFilter('all')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    exerciseFilter === 'all'
                      ? 'bg-primary text-black border-primary'
                      : 'bg-[#000] border-[#333] text-[#666] hover:text-white hover:border-[#555]'
                  }`}
                >
                  ALL
                </button>
                {allExercises.slice(0, 8).map(exercise => (
                  <button
                    key={exercise!.id}
                    onClick={() => setExerciseFilter(exercise!.id)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      exerciseFilter === exercise!.id
                        ? 'bg-primary text-black border-primary'
                        : 'bg-[#000] border-[#333] text-[#666] hover:text-white hover:border-[#555]'
                    }`}
                  >
                    {exercise!.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Template Filter - Compact Pills */}
          {templates.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-primary" />
                <label className="text-xs font-black italic text-white uppercase tracking-wider">
                  TEMPLATE
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTemplateFilter('all')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    templateFilter === 'all'
                      ? 'bg-primary text-black border-primary'
                      : 'bg-[#000] border-[#333] text-[#666] hover:text-white hover:border-[#555]'
                  }`}
                >
                  ALL
                </button>
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setTemplateFilter(template.id)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      templateFilter === template.id
                        ? 'bg-primary text-black border-primary'
                        : 'bg-[#000] border-[#333] text-[#666] hover:text-white hover:border-[#555]'
                    }`}
                  >
                    {template.name.substring(0, 15)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-3 border-2 border-primary/30 text-primary hover:bg-primary hover:text-black transition-all uppercase font-black text-xs italic tracking-wider flex items-center justify-center gap-2"
              style={{ transform: 'skewX(-5deg)' }}
            >
              <span style={{ transform: 'skewX(5deg)' }} className="flex items-center gap-2">
                <X size={14} strokeWidth={3} />
                CLEAR FILTERS
              </span>
            </button>
          )}
        </div>
      )}

      {/* Workout List - Diagonal Charge Cards with Intensity */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          history.length === 0 ? (
            <div className="mt-12 text-center">
              <div className="inline-block p-8 bg-gradient-to-br from-[#111] to-black border-2 border-[#222]">
                <Dumbbell className="text-primary/30 mx-auto mb-4" size={48} strokeWidth={2} />
                <h3 className="text-2xl font-black italic uppercase text-white mb-2">NO POWER LOGGED</h3>
                <p className="text-sm text-[#666] mb-6 max-w-sm">
                  Your first session awaits. Start building your strength empire.
                </p>
                <button
                  onClick={() => navigate('/lift')}
                  className="px-8 py-4 bg-primary text-black font-black italic uppercase text-sm tracking-wider hover:bg-white transition-all border-2 border-primary"
                  style={{ transform: 'skewX(-5deg)' }}
                >
                  <span style={{ transform: 'skewX(5deg)' }} className="block">START TRAINING</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-12 text-center">
              <div className="inline-block p-8 bg-gradient-to-br from-[#111] to-black border-2 border-[#222]">
                <Filter className="text-primary/30 mx-auto mb-4" size={48} strokeWidth={2} />
                <h3 className="text-2xl font-black italic uppercase text-white mb-2">NO MATCHES</h3>
                <p className="text-sm text-[#666] mb-6 max-w-sm">
                  No sessions match your filter criteria. Broaden your search.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-8 py-4 bg-primary text-black font-black italic uppercase text-sm tracking-wider hover:bg-white transition-all border-2 border-primary"
                  style={{ transform: 'skewX(-5deg)' }}
                >
                  <span style={{ transform: 'skewX(5deg)' }} className="block">CLEAR FILTERS</span>
                </button>
              </div>
            </div>
          )
        ) : (
          filteredHistory.map(session => {
            const intensity = getWorkoutIntensity(session);
            const volume = getTotalVolume(session);

            return (
              <div
                key={session.id}
                onClick={() => navigate(`/history/${session.id}`)}
                className="relative bg-gradient-to-r from-[#0a0a0a] via-[#111] to-[#0a0a0a] border-l-4 border-[#333] hover:border-primary p-5 transition-all group cursor-pointer overflow-hidden"
                style={{
                  boxShadow: '0 2px 0 0 rgba(51, 51, 51, 0.3)',
                }}
              >
                {/* Intensity Background Glow */}
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/10 to-transparent transition-all"
                  style={{ width: `${intensity}%` }}
                />

                {/* Diagonal Stripe Pattern */}
                <div
                  className="absolute top-0 right-0 w-32 h-full opacity-5"
                  style={{
                    background: 'repeating-linear-gradient(45deg, #ccff00, #ccff00 2px, transparent 2px, transparent 10px)',
                  }}
                />

                <div className="relative flex gap-4">
                  {/* Date Badge - Skewed */}
                  <div
                    className="flex flex-col items-center justify-center border-2 border-primary/30 bg-black w-16 h-16 shrink-0 group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-all"
                    style={{ transform: 'skewX(-5deg)' }}
                  >
                    <div style={{ transform: 'skewX(5deg)' }}>
                      <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider">
                        {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <div className="text-2xl font-black italic text-primary leading-none">
                        {new Date(session.startTime).getDate()}
                      </div>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black italic text-white uppercase tracking-wide text-lg group-hover:text-primary transition-colors truncate">
                      {session.name}
                    </h3>

                    {/* Intensity Bar */}
                    <div className="flex items-center gap-2 mt-2 mb-3">
                      <div className="flex-1 h-2 bg-[#0a0a0a] border border-[#222] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all"
                          style={{ width: `${intensity}%` }}
                        />
                      </div>
                      <span className="text-xs font-black italic text-primary w-8">{intensity}%</span>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#666] uppercase tracking-wider">
                        <Clock size={10} strokeWidth={3} />
                        {getDuration(session.startTime, session.endTime)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#666] uppercase tracking-wider">
                        <Box size={10} strokeWidth={3} />
                        {(volume / 1000).toFixed(1)}K LBS
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#666] uppercase tracking-wider">
                        <Zap size={10} strokeWidth={3} />
                        {session.logs.reduce((sum, log) => sum + log.sets.filter(s => s.completed).length, 0)} SETS
                      </div>
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex items-center">
                    <div className="w-10 h-10 border-2 border-[#222] bg-black flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all">
                      <ChevronRight
                        size={20}
                        strokeWidth={3}
                        className="text-[#666] group-hover:text-black transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default History;