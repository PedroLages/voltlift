import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Calendar, Zap, Target, CheckCircle2, Info } from 'lucide-react';
import { Program } from '../types';

const ProgramBrowser = () => {
  const navigate = useNavigate();
  const { programs, settings } = useStore();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Calculate sessions per week for a program
  const getSessionsPerWeek = (program: Program) => {
    if (program.sessions.length === 0) return 0;

    // Get unique days across all weeks
    const week1Sessions = program.sessions.filter(s => s.week === 1);
    return week1Sessions.length;
  };

  // Get difficulty badge based on frequency and program type
  const getDifficulty = (program: Program) => {
    const sessionsPerWeek = getSessionsPerWeek(program);

    if (sessionsPerWeek >= 6) return { level: 'Advanced', color: 'text-red-400' };
    if (sessionsPerWeek >= 4) return { level: 'Intermediate', color: 'text-yellow-400' };
    return { level: 'Beginner', color: 'text-green-400' };
  };

  // Check if a program is currently active
  const isActiveProgram = (programId: string) => {
    return settings.activeProgram?.programId === programId;
  };

  return (
    <div className="min-h-screen bg-black p-6 pb-24 font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 border border-[#333] flex items-center justify-center hover:bg-[#111] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] text-[#666] font-mono uppercase block">Programs</span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Browse</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl volt-header uppercase italic leading-none mb-2">PROGRAM LIBRARY</h1>
        <p className="text-[#888] text-sm font-mono">Structured training programs for every goal</p>
      </div>

      {/* Program Cards */}
      <div className="space-y-4">
        {programs.map((program) => {
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
                  <h2 className="text-xl font-black italic uppercase text-white mb-1">{program.name}</h2>
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
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#222]">
                <div>
                  <div className="flex items-center gap-1 text-[#666] mb-1">
                    <Calendar size={12} />
                    <span className="text-[9px] uppercase font-bold tracking-widest">Duration</span>
                  </div>
                  <div className="text-sm font-black italic text-white">{program.weeks} Weeks</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[#666] mb-1">
                    <Zap size={12} />
                    <span className="text-[9px] uppercase font-bold tracking-widest">Frequency</span>
                  </div>
                  <div className="text-sm font-black italic text-white">{sessionsPerWeek}x/Week</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[#666] mb-1">
                    <Target size={12} />
                    <span className="text-[9px] uppercase font-bold tracking-widest">Level</span>
                  </div>
                  <div className={`text-sm font-black italic ${difficulty.color}`}>{difficulty.level}</div>
                </div>
              </div>

              {/* Enroll Button */}
              {!isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/program-enroll/${program.id}`);
                  }}
                  className="w-full mt-4 py-3 bg-primary text-black font-bold uppercase text-sm tracking-widest hover:bg-white transition-colors"
                >
                  Start Program
                </button>
              )}
            </div>
          );
        })}
      </div>

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
                  onClick={() => navigate(`/program-enroll/${selectedProgram.id}`)}
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
