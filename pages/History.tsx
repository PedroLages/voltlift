import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Clock, Box, Filter, X, Dumbbell } from 'lucide-react';
import { EXERCISE_LIBRARY } from '../constants';
import EmptyState from '../components/EmptyState';

const History = () => {
  const { history, templates } = useStore();
  const navigate = useNavigate();

  // Filter state
  const [dateFilter, setDateFilter] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [exerciseFilter, setExerciseFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDuration = (start: number, end?: number) => {
    if (!end) return '--';
    const minutes = Math.floor((end - start) / 60000);
    return `${minutes} MIN`;
  };

  const getTotalVolume = (session: any) => {
    let volume = 0;
    session.logs.forEach((log: any) => {
      log.sets.forEach((set: any) => {
        if (set.completed) volume += (set.weight * set.reps);
      });
    });
    return (volume / 1000).toFixed(1) + 'K LBS';
  };

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
      {/* Header with Filter Button */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl volt-header">LOGS</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border-2 transition-all uppercase font-bold text-xs ${
            hasActiveFilters
              ? 'border-primary text-primary'
              : 'border-[#333] text-[#666] hover:border-[#555] hover:text-white'
          }`}
        >
          <Filter size={14} />
          {hasActiveFilters && <span className="text-[10px]">({filteredHistory.length})</span>}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 bg-[#111] border border-[#222] p-5 space-y-4">
          {/* Date Range Filter */}
          <div>
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
              Date Range
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: '7d', label: '7 Days' },
                { value: '30d', label: '30 Days' },
                { value: '90d', label: '90 Days' },
                { value: 'all', label: 'All Time' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setDateFilter(option.value as any)}
                  className={`py-2 px-3 text-[10px] font-bold uppercase transition-all ${
                    dateFilter === option.value
                      ? 'bg-primary text-black'
                      : 'bg-[#000] border border-[#333] text-[#666] hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Filter */}
          <div>
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
              Exercise
            </label>
            <select
              value={exerciseFilter}
              onChange={(e) => setExerciseFilter(e.target.value)}
              className="w-full bg-[#000] border border-[#333] text-white p-3 text-sm font-mono focus:border-primary focus:outline-none"
            >
              <option value="all">All Exercises</option>
              {allExercises.map(exercise => (
                <option key={exercise!.id} value={exercise!.id}>
                  {exercise!.name}
                </option>
              ))}
            </select>
          </div>

          {/* Template Filter */}
          <div>
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
              Template
            </label>
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="w-full bg-[#000] border border-[#333] text-white p-3 text-sm font-mono focus:border-primary focus:outline-none"
            >
              <option value="all">All Templates</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-3 border-2 border-[#333] text-[#666] hover:border-primary hover:text-primary transition-all uppercase font-bold text-xs flex items-center justify-center gap-2"
            >
              <X size={14} />
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Workout List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          history.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No Workout History"
              description="Complete your first workout to start tracking your fitness journey. Your workout logs will appear here for easy review and progress tracking."
              actionLabel="Start Training"
              onAction={() => navigate('/lift')}
            />
          ) : (
            <EmptyState
              icon={Filter}
              title="No Matching Workouts"
              description="No workouts match your current filter criteria. Try adjusting your filters or clear them to see all workouts."
              actionLabel="Clear Filters"
              onAction={clearFilters}
            />
          )
        ) : (
          filteredHistory.map(session => (
            <div 
              key={session.id} 
              onClick={() => navigate(`/history/${session.id}`)}
              className="bg-[#111] border-l-2 border-[#333] hover:border-primary p-5 flex gap-5 transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center border border-[#333] bg-black w-14 h-14 shrink-0">
                 <span className="text-xs font-bold text-[#666] uppercase">{new Date(session.startTime).toLocaleDateString('en-US', {weekday: 'short'})}</span>
                 <span className="text-lg font-black italic text-white">{new Date(session.startTime).getDate()}</span>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white uppercase italic tracking-wide text-lg group-hover:text-primary transition-colors">{session.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#666] uppercase tracking-wider">
                      <Clock size={10} /> {getDuration(session.startTime, session.endTime)}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#666] uppercase tracking-wider">
                      <Box size={10} /> {getTotalVolume(session)}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-[#333] group-hover:text-primary transition-colors">
                <ChevronRight size={20} strokeWidth={3} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;