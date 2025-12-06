import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Calendar, Zap, Target, CheckCircle2, Info, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Program, ProgramGoal, ProgramSplitType, ProgramDifficulty } from '../types';

const ProgramBrowser = () => {
  const navigate = useNavigate();
  const { programs, settings } = useStore();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [selectedGoals, setSelectedGoals] = useState<ProgramGoal[]>([]);
  const [selectedSplits, setSelectedSplits] = useState<ProgramSplitType[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<ProgramDifficulty[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedFrequencies, setSelectedFrequencies] = useState<number[]>([]);

  // Calculate sessions per week for a program
  const getSessionsPerWeek = (program: Program) => {
    if (program.sessions.length === 0) return 0;

    // Get unique days across all weeks
    const week1Sessions = program.sessions.filter(s => s.week === 1);
    return week1Sessions.length;
  };

  // Get difficulty badge based on program's difficulty metadata
  const getDifficulty = (program: Program) => {
    const colorMap = {
      'Beginner': 'text-green-400',
      'Intermediate': 'text-yellow-400',
      'Advanced': 'text-red-400'
    };
    return { level: program.difficulty, color: colorMap[program.difficulty] };
  };

  // Check if a program is currently active
  const isActiveProgram = (programId: string) => {
    return settings.activeProgram?.programId === programId;
  };

  // Get duration category for a program
  const getDurationCategory = (weeks: number): string => {
    if (weeks <= 6) return '4-6 weeks';
    if (weeks <= 9) return '7-9 weeks';
    if (weeks <= 12) return '10-12 weeks';
    return '12+ weeks';
  };

  // Filter programs based on selected criteria
  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      // Filter by goal
      if (selectedGoals.length > 0 && !selectedGoals.includes(program.goal)) {
        return false;
      }

      // Filter by split type
      if (selectedSplits.length > 0 && !selectedSplits.includes(program.splitType)) {
        return false;
      }

      // Filter by difficulty
      if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(program.difficulty)) {
        return false;
      }

      // Filter by duration
      if (selectedDurations.length > 0) {
        const durationCategory = getDurationCategory(program.weeks);
        if (!selectedDurations.includes(durationCategory)) {
          return false;
        }
      }

      // Filter by frequency
      if (selectedFrequencies.length > 0 && !selectedFrequencies.includes(program.frequency)) {
        return false;
      }

      return true;
    });
  }, [programs, selectedGoals, selectedSplits, selectedDifficulties, selectedDurations, selectedFrequencies]);

  // Toggle filter selection
  const toggleFilter = <T,>(value: T, selectedValues: T[], setSelectedValues: React.Dispatch<React.SetStateAction<T[]>>) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter(v => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedGoals([]);
    setSelectedSplits([]);
    setSelectedDifficulties([]);
    setSelectedDurations([]);
    setSelectedFrequencies([]);
  };

  // Count active filters
  const activeFilterCount = selectedGoals.length + selectedSplits.length + selectedDifficulties.length + selectedDurations.length + selectedFrequencies.length;

  return (
    <div className="min-h-screen bg-black p-6 pb-24 font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lift')}
            className="w-10 h-10 border border-[#333] flex items-center justify-center hover:bg-[#111] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] text-[#666] font-mono uppercase block">Programs</span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Browse</span>
          </div>
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-[#333] hover:border-primary transition-colors relative"
        >
          <Filter size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Filter</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-black text-[10px] font-black rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl volt-header uppercase italic leading-none mb-2">PROGRAM LIBRARY</h1>
        <p className="text-[#888] text-sm font-mono">
          {filteredPrograms.length} {filteredPrograms.length === 1 ? 'program' : 'programs'} available
        </p>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-[#111] border border-[#222] p-4 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] text-[#666] hover:text-white uppercase tracking-wider flex items-center gap-1"
              >
                <X size={12} />
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Training Goal Filter */}
            <div>
              <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-2">Training Goal</label>
              <div className="flex flex-wrap gap-2">
                {(['Hypertrophy', 'Strength', 'Powerlifting', 'Power-Building', 'General Fitness'] as ProgramGoal[]).map(goal => (
                  <button
                    key={goal}
                    onClick={() => toggleFilter(goal, selectedGoals, setSelectedGoals)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                      selectedGoals.includes(goal)
                        ? 'bg-primary text-black border-primary'
                        : 'bg-black text-[#888] border-[#333] hover:border-primary hover:text-white'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Type Filter */}
            <div>
              <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-2">Split Type</label>
              <div className="flex flex-wrap gap-2">
                {(['PPL', 'Upper/Lower', 'Full Body', 'Body Part Split'] as ProgramSplitType[]).map(split => (
                  <button
                    key={split}
                    onClick={() => toggleFilter(split, selectedSplits, setSelectedSplits)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                      selectedSplits.includes(split)
                        ? 'bg-primary text-black border-primary'
                        : 'bg-black text-[#888] border-[#333] hover:border-primary hover:text-white'
                    }`}
                  >
                    {split}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-2">Duration</label>
              <div className="flex flex-wrap gap-2">
                {['4-6 weeks', '7-9 weeks', '10-12 weeks', '12+ weeks'].map(duration => (
                  <button
                    key={duration}
                    onClick={() => toggleFilter(duration, selectedDurations, setSelectedDurations)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                      selectedDurations.includes(duration)
                        ? 'bg-primary text-black border-primary'
                        : 'bg-black text-[#888] border-[#333] hover:border-primary hover:text-white'
                    }`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency Filter */}
            <div>
              <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-2">Frequency</label>
              <div className="flex flex-wrap gap-2">
                {[3, 4, 5, 6].map(freq => (
                  <button
                    key={freq}
                    onClick={() => toggleFilter(freq, selectedFrequencies, setSelectedFrequencies)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                      selectedFrequencies.includes(freq)
                        ? 'bg-primary text-black border-primary'
                        : 'bg-black text-[#888] border-[#333] hover:border-primary hover:text-white'
                    }`}
                  >
                    {freq}x/week
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-2">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {(['Beginner', 'Intermediate', 'Advanced'] as ProgramDifficulty[]).map(diff => (
                  <button
                    key={diff}
                    onClick={() => toggleFilter(diff, selectedDifficulties, setSelectedDifficulties)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                      selectedDifficulties.includes(diff)
                        ? 'bg-primary text-black border-primary'
                        : 'bg-black text-[#888] border-[#333] hover:border-primary hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Cards */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-12">
          <Target size={48} className="mx-auto text-[#333] mb-4" />
          <h3 className="text-lg font-black uppercase text-[#666] mb-2">No Programs Found</h3>
          <p className="text-sm text-[#666] mb-4">Try adjusting your filters</p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-primary text-black font-bold uppercase text-xs tracking-widest hover:bg-white transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrograms.map((program) => {
            const sessionsPerWeek = getSessionsPerWeek(program);
            const difficulty = getDifficulty(program);
            const isActive = isActiveProgram(program.id);

            return (
              <div
                key={program.id}
                className={`bg-[#111] border-2 ${isActive ? 'border-primary' : 'border-[#222]'} p-4 hover:border-[#333] transition-colors cursor-pointer`}
                onClick={() => navigate(`/program/${program.id}`)}
              >
                {/* Active Badge */}
                {isActive && (
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Active Program</span>
                  </div>
                )}

                {/* Program Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-black italic uppercase text-white">{program.name}</h2>
                      <span className="px-2 py-0.5 bg-[#222] text-[9px] font-bold uppercase tracking-wider text-primary border border-[#333]">
                        {program.goal}
                      </span>
                    </div>
                    <p className="text-sm text-[#aaa] leading-relaxed">{program.description}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProgram(program);
                    }}
                    className="text-[#666] hover:text-primary transition-colors ml-4"
                  >
                    <Info size={20} />
                  </button>
                </div>

                {/* Program Stats */}
                <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#222]">
                  <div>
                    <div className="flex items-center gap-1 text-[#666] mb-1">
                      <Calendar size={12} />
                      <span className="text-[9px] uppercase font-bold tracking-widest">Duration</span>
                    </div>
                    <div className="text-sm font-black italic text-white">{program.weeks}w</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[#666] mb-1">
                      <Zap size={12} />
                      <span className="text-[9px] uppercase font-bold tracking-widest">Freq</span>
                    </div>
                    <div className="text-sm font-black italic text-white">{sessionsPerWeek}x</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[#666] mb-1">
                      <Target size={12} />
                      <span className="text-[9px] uppercase font-bold tracking-widest">Level</span>
                    </div>
                    <div className={`text-sm font-black italic ${difficulty.color}`}>{difficulty.level}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[#666] mb-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest">Split</span>
                    </div>
                    <div className="text-[10px] font-bold text-white">{program.splitType}</div>
                  </div>
                </div>

                {/* Enroll Button */}
                {!isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/program/${program.id}`);
                    }}
                    className="w-full mt-4 py-3 bg-primary text-black font-black italic uppercase text-sm tracking-widest hover:bg-white shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-all"
                  >
                    Start Program
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Program Detail Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-fade-in">
          <div className="p-6 border-b border-[#333] flex justify-between items-center">
            <h2 className="volt-header text-xl uppercase italic">{selectedProgram.name}</h2>
            <button onClick={() => setSelectedProgram(null)} className="text-white hover:text-primary">
              <ArrowLeft size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-2">Overview</h3>
              <p className="text-sm text-[#aaa] leading-relaxed">{selectedProgram.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#111] p-4 border border-[#222]">
                <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-1">Total Sessions</div>
                <div className="text-2xl font-black italic text-white">{selectedProgram.sessions.length}</div>
              </div>
              <div className="bg-[#111] p-4 border border-[#222]">
                <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-1">Per Week</div>
                <div className="text-2xl font-black italic text-white">{getSessionsPerWeek(selectedProgram)}x</div>
              </div>
            </div>

            {/* Schedule Preview */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3">Week 1 Schedule</h3>
              <div className="space-y-2">
                {selectedProgram.sessions
                  .filter(s => s.week === 1)
                  .map((session, index) => (
                    <div key={index} className="bg-[#111] border border-[#222] p-3 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-white uppercase">Day {session.day}</span>
                        <span className="text-[10px] text-[#666] font-mono ml-2">{session.templateId}</span>
                      </div>
                      <Calendar size={14} className="text-[#444]" />
                    </div>
                  ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/program/${selectedProgram.id}`)}
                className="w-full py-3 border border-white text-white font-bold uppercase text-sm tracking-widest hover:border-primary hover:text-primary transition-colors"
              >
                View Full Program
              </button>

              {!isActiveProgram(selectedProgram.id) && (
                <button
                  onClick={() => navigate(`/program/${selectedProgram.id}`)}
                  className="w-full py-4 bg-primary text-black font-black italic uppercase text-lg tracking-widest hover:bg-white transition-colors"
                >
                  Start {selectedProgram.name}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramBrowser;
