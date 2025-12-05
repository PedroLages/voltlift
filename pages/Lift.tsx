
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Plus, ChevronRight, Dumbbell, PenTool, Trash2, Play, CalendarRange, X, Edit, Copy, FileText, Zap } from 'lucide-react';
import { Program, WorkoutSession } from '../types';
import { EXERCISE_LIBRARY } from '../constants';
import TemplateEditor from '../components/TemplateEditor';
import EmptyState from '../components/EmptyState';

const Lift = () => {
  const navigate = useNavigate();
  const { templates, programs, startWorkout, deleteTemplate, duplicateTemplate, activateProgram, settings } = useStore();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutSession | null>(null);

  const handleStartTemplate = (id: string) => {
    startWorkout(id);
    navigate('/workout');
  };

  const handleQuickStart = () => {
    startWorkout();
    navigate('/workout');
  };

  const handleEditTemplate = (e: React.MouseEvent, template: WorkoutSession) => {
    e.stopPropagation();
    setEditingTemplate(template);
  };

  const handleDuplicateTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    duplicateTemplate(id);
  };

  const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this protocol?")) {
        deleteTemplate(id);
    }
  };

  const handleActivateProgram = (id: string) => {
      if (confirm("Activate this program? This will reset your current cycle progress.")) {
          activateProgram(id);
          navigate('/'); // Go to dashboard to see new status
      }
  };

  return (
    <div className="p-6 pb-28 min-h-screen bg-background">
      {/* Header */}
      <header className="mb-8 pt-4">
        <h1 className="text-5xl volt-header leading-[0.85] text-white">
          TRAINING<br/>
          <span className="text-primary">COMMAND</span>
        </h1>
      </header>

      {/* Primary Action: Quick Start - Contextual sizing based on active program */}
      {settings.activeProgram ? (
        /* Compact version when program is active */
        <button
          onClick={handleQuickStart}
          aria-label="Start empty workout session"
          className="w-full group bg-[#111] border border-[#222] p-4 mb-8 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 text-white">
              <Play size={18} className="text-[#666] group-hover:text-primary transition-colors" />
              <div className="text-left">
                <span className="block text-sm font-bold uppercase italic">Empty Session</span>
                <span className="text-[10px] text-[#555] font-mono uppercase">Freestyle Workout</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-[#333] group-hover:text-primary transition-colors" />
          </div>
        </button>
      ) : (
        /* Full hero version when no program */
        <button
          onClick={handleQuickStart}
          aria-label="Start empty workout session"
          className="w-full group relative overflow-hidden bg-primary p-6 mb-8 skew-x-[-2deg] hover:scale-[1.02] transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary focus:ring-offset-4 focus:ring-offset-black"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
          <div className="flex justify-between items-center skew-x-[2deg]">
            <div className="flex flex-col items-start text-black">
              <span className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Play fill="currentColor" size={24} /> Initiate
              </span>
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Empty Session</span>
            </div>
            <ChevronRight size={32} className="text-black stroke-[3px]" />
          </div>
        </button>
      )}

      {/* Tool Grid - 2x2 with equal weight */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate('/programs')}
          aria-label="Browse training programs"
          className="bg-[#111] border border-[#222] p-5 flex flex-col justify-between h-32 hover:border-primary group transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
        >
            <CalendarRange className="text-[#666] group-hover:text-primary transition-colors" size={28} aria-hidden="true" />
            <div className="text-left">
                <span className="block text-white font-bold uppercase italic text-lg leading-none group-hover:text-primary">Programs</span>
                <span className="text-[10px] text-[#555] font-mono uppercase">{programs.length} Available</span>
            </div>
        </button>
        <button
          onClick={() => navigate('/exercises')}
          aria-label="Browse exercise library"
          className="bg-[#111] border border-[#222] p-5 flex flex-col justify-between h-32 hover:border-primary group transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
        >
            <Dumbbell className="text-[#666] group-hover:text-primary transition-colors" size={28} aria-hidden="true" />
            <div className="text-left">
                <span className="block text-white font-bold uppercase italic text-lg leading-none group-hover:text-primary">Database</span>
                <span className="text-[10px] text-[#555] font-mono uppercase">Browse Library</span>
            </div>
        </button>
        <button
          onClick={() => navigate('/builder')}
          aria-label="Create new workout template"
          className="bg-[#111] border border-[#222] p-5 flex flex-col justify-between h-32 hover:border-primary group transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
        >
            <PenTool className="text-[#666] group-hover:text-primary transition-colors" size={28} aria-hidden="true" />
            <div className="text-left">
                <span className="block text-white font-bold uppercase italic text-lg leading-none group-hover:text-primary">Builder</span>
                <span className="text-[10px] text-[#555] font-mono uppercase">New Protocol</span>
            </div>
        </button>
        <button
          onClick={() => navigate('/analytics')}
          aria-label="View workout analytics"
          className="bg-[#111] border border-[#222] p-5 flex flex-col justify-between h-32 hover:border-primary group transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
        >
            <FileText className="text-[#666] group-hover:text-primary transition-colors" size={28} aria-hidden="true" />
            <div className="text-left">
                <span className="block text-white font-bold uppercase italic text-lg leading-none group-hover:text-primary">Analytics</span>
                <span className="text-[10px] text-[#555] font-mono uppercase">View Stats</span>
            </div>
        </button>
      </div>

      {/* Active Program (Enhanced) - Only shows if user has an active program */}
      {settings.activeProgram && (
        <section className="mb-8">
          <div className="flex justify-between items-end mb-4 border-b border-[#222] pb-2">
            <h2 className="text-xl volt-header text-white">ACTIVE PROGRAM</h2>
          </div>

          {(() => {
            const activeProg = programs.find(p => p.id === settings.activeProgram?.programId);
            if (!activeProg) return null;

            // Get next session details
            const sessionIndex = settings.activeProgram.currentSessionIndex;
            const nextSession = activeProg.sessions[sessionIndex];
            const nextTemplate = nextSession ? templates.find(t => t.id === nextSession.templateId) : null;

            // Get exercises from template
            const exerciseList = nextTemplate?.logs.slice(0, 3).map((log, idx) => {
              const exercise = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
              const tier = idx === 0 ? 'T1' : idx === 1 ? 'T2' : 'T3';
              return { name: exercise?.name || 'Unknown', tier };
            }) || [];

            const remainingCount = (nextTemplate?.logs.length || 0) - 3;

            // Calculate progress
            const progressPercent = Math.round((sessionIndex / activeProg.sessions.length) * 100);

            return (
              <div className="relative overflow-hidden bg-gradient-to-br from-[#111] to-[#0a0a0a] border-2 border-primary/50 shadow-[0_0_30px_rgba(204,255,0,0.15)]">
                {/* Diagonal accent stripe */}
                <div className="absolute top-0 right-0 bottom-0 bg-primary/5 w-1/3 skew-x-[15deg] translate-x-12"></div>

                <div className="relative p-6 space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black italic uppercase text-white mb-1">{activeProg.name}</h3>
                      <p className="text-xs text-[#888] font-mono uppercase">
                        Week {nextSession?.week} • Day {nextSession?.day} • Session {sessionIndex + 1}/{activeProg.sessions.length}
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-primary text-black px-3 py-1.5 shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                      ACTIVE
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-[#666] font-mono uppercase tracking-widest">Progress</span>
                      <span className="text-[9px] text-primary font-bold">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-[#222] overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Workout Preview */}
                  {nextTemplate && (
                    <div className="bg-[#0a0a0a] border border-[#222] p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-primary" />
                        <span className="text-xs font-bold uppercase text-primary tracking-widest">Up Next</span>
                        <span className="text-xs text-[#666] font-mono">{nextTemplate.name}</span>
                      </div>

                      {/* Exercise Chips */}
                      <div className="flex flex-wrap gap-2">
                        {exerciseList.map((ex, idx) => (
                          <div
                            key={idx}
                            className={`px-2 py-1 text-[10px] font-bold uppercase ${
                              ex.tier === 'T1'
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : ex.tier === 'T2'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-[#222] text-[#888] border border-[#333]'
                            }`}
                          >
                            {ex.tier}: {ex.name}
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <div className="px-2 py-1 text-[10px] font-bold uppercase bg-[#222] text-[#666] border border-[#333]">
                            +{remainingCount} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        if (nextTemplate) {
                          startWorkout(nextTemplate.id);
                          navigate('/workout');
                        }
                      }}
                      className="flex-1 bg-primary text-black py-4 font-black italic uppercase text-lg tracking-wider hover:bg-white transition-colors shadow-[0_4px_20px_rgba(204,255,0,0.3)] hover:shadow-[0_4px_30px_rgba(204,255,0,0.5)] flex items-center justify-center gap-2 group"
                    >
                      <Play size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                      START SESSION
                    </button>
                    <button
                      onClick={() => navigate(`/program/${activeProg.id}`)}
                      className="px-5 py-4 border-2 border-white/20 text-white font-bold uppercase text-xs tracking-widest hover:border-primary hover:text-primary transition-colors"
                    >
                      VIEW
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* Protocols List - Moved to top for quick access */}
      <section className="mb-10">
        <div className="flex justify-between items-end mb-4 border-b border-[#222] pb-2">
            <h2 className="text-xl volt-header text-white">QUICK PROTOCOLS</h2>
            <span className="text-[10px] font-mono text-[#666]">{templates.length} LOADED</span>
        </div>

        <div className="space-y-3">
            {templates.map(t => (
              <div
                key={t.id}
                onClick={() => handleStartTemplate(t.id)}
                className="bg-[#0a0a0a] p-5 border-l-4 border-[#333] hover:border-primary flex justify-between items-center cursor-pointer transition-colors group relative"
              >
                <div>
                  <h3 className="font-bold text-white uppercase italic tracking-wide text-lg group-hover:text-primary transition-colors">{t.name}</h3>
                  <div className="flex gap-2 mt-1">
                      <span className="px-1.5 py-0.5 bg-[#222] text-[#888] text-[10px] font-mono uppercase">{t.logs.length} MOVEMENTS</span>
                      {['t1', 't2'].includes(t.id) && <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-mono uppercase">SYSTEM</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Edit button for all templates */}
                    <button
                        onClick={(e) => handleEditTemplate(e, t)}
                        className="w-8 h-8 flex items-center justify-center text-[#444] hover:text-primary hover:bg-[#1a1a1a] rounded transition-colors z-10"
                        title="Edit Template"
                    >
                        <Edit size={16} />
                    </button>

                    {/* Duplicate button */}
                    <button
                        onClick={(e) => handleDuplicateTemplate(e, t.id)}
                        className="w-8 h-8 flex items-center justify-center text-[#444] hover:text-blue-400 hover:bg-[#001a1a] rounded transition-colors z-10"
                        title="Duplicate Template"
                    >
                        <Copy size={16} />
                    </button>

                    {/* Only show delete for custom templates */}
                    {t.logs.length > 0 && !['t1', 't2'].includes(t.id) && (
                        <button
                            onClick={(e) => handleDeleteTemplate(e, t.id)}
                            className="w-8 h-8 flex items-center justify-center text-[#444] hover:text-red-500 hover:bg-[#1a0000] rounded transition-colors z-10"
                            title="Delete Template"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}

                    <ChevronRight size={24} className="text-[#333] group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-[#111] w-full max-w-lg max-h-[80vh] flex flex-col border border-[#333] shadow-2xl">
                <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
                    <div>
                        <h2 className="volt-header text-xl text-white">{selectedProgram.name}</h2>
                        <span className="text-[10px] font-mono text-primary uppercase">{selectedProgram.weeks} WEEK BLOCK</span>
                    </div>
                    <button onClick={() => setSelectedProgram(null)} className="text-white hover:text-primary"><X size={24}/></button>
                </div>
                
                <div className="overflow-y-auto p-4 space-y-6">
                    <p className="text-xs text-[#888] font-mono uppercase leading-relaxed border-b border-[#222] pb-4">
                        {selectedProgram.description}
                    </p>
                    
                    {[...Array(selectedProgram.weeks)].map((_, weekIndex) => (
                        <div key={weekIndex}>
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2 border-l-2 border-primary pl-2">
                                Week {weekIndex + 1}
                            </h3>
                            <div className="space-y-2 pl-4 border-l border-[#222] ml-0.5">
                                {selectedProgram.sessions
                                    .filter(s => s.week === weekIndex + 1)
                                    .map((session, i) => {
                                        const template = templates.find(t => t.id === session.templateId);
                                        return (
                                            <div key={i} className="flex items-center gap-4 py-2 border-b border-[#222] last:border-0">
                                                <span className="text-[10px] font-mono text-[#666]">Day {session.day}</span>
                                                <span className="text-sm font-bold text-[#ccc] uppercase">{template?.name || 'Unknown Protocol'}</span>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-[#333] bg-[#0a0a0a]">
                     <button 
                        onClick={() => {
                            handleActivateProgram(selectedProgram.id);
                            setSelectedProgram(null);
                        }}
                        className="w-full bg-primary text-black py-3 font-black italic uppercase tracking-wider hover:bg-white transition-colors"
                     >
                         Activate Cycle
                     </button>
                </div>
            </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}

    </div>
  );
};

export default Lift;
