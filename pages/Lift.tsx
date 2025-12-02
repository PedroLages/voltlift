
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Plus, ChevronRight, Dumbbell, PenTool, Trash2, Play, CalendarRange, X, Edit, Copy, FileText } from 'lucide-react';
import { Program, WorkoutSession } from '../types';
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

      {/* Primary Action: Quick Start */}
      <button 
        onClick={handleQuickStart}
        className="w-full group relative overflow-hidden bg-primary p-6 mb-8 skew-x-[-2deg] hover:scale-[1.02] transition-transform active:scale-95"
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

      {/* Tool Grid */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <button 
          onClick={() => navigate('/exercises')}
          className="bg-[#111] border border-[#222] p-5 flex flex-col justify-between h-32 hover:border-primary group transition-colors"
        >
            <Dumbbell className="text-[#666] group-hover:text-primary transition-colors" size={28} />
            <div className="text-left">
                <span className="block text-white font-bold uppercase italic text-lg leading-none group-hover:text-primary">Database</span>
                <span className="text-[10px] text-[#555] font-mono uppercase">Browse Library</span>
            </div>
        </button>
        <button 
          onClick={() => navigate('/builder')}
          className="bg-[#111] border border-[#222] p-5 flex flex-col justify-between h-32 hover:border-primary group transition-colors"
        >
            <PenTool className="text-[#666] group-hover:text-primary transition-colors" size={28} />
            <div className="text-left">
                <span className="block text-white font-bold uppercase italic text-lg leading-none group-hover:text-primary">Builder</span>
                <span className="text-[10px] text-[#555] font-mono uppercase">New Protocol</span>
            </div>
        </button>
      </div>

      {/* Programs (Macro-Cycles) */}
      <section className="mb-10">
          <div className="flex justify-between items-end mb-4 border-b border-[#222] pb-2">
            <h2 className="text-xl volt-header text-white">MACRO-CYCLES</h2>
            <span className="text-[10px] font-mono text-[#666]">{programs.length} AVAILABLE</span>
          </div>

          {programs.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="No Training Programs"
              description="Structured multi-week programs will appear here. Programs help you systematically progress through different training phases."
              actionLabel="Create Custom Template"
              onAction={() => navigate('/builder')}
            />
          ) : (
            <div className="space-y-3">
              {programs.map(prog => (
                  <div 
                    key={prog.id} 
                    className={`bg-[#0a0a0a] p-5 border-l-4 ${settings.activeProgram?.programId === prog.id ? 'border-primary bg-[#111]' : 'border-[#333] hover:border-[#666]'} flex flex-col gap-3 group relative`}
                  >
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="font-bold text-white uppercase italic tracking-wide text-lg group-hover:text-primary transition-colors">{prog.name}</h3>
                              <p className="text-[10px] text-[#888] font-mono uppercase mt-1 max-w-[80%]">{prog.description}</p>
                          </div>
                          {settings.activeProgram?.programId === prog.id && (
                              <span className="text-[10px] font-black uppercase bg-primary text-black px-2 py-1">Active</span>
                          )}
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-[#222] pt-3 mt-1">
                          <div className="flex gap-4">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#666] uppercase"><CalendarRange size={12}/> {prog.weeks} Weeks</span>
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#666] uppercase"><Dumbbell size={12}/> {prog.sessions.length} Sessions</span>
                          </div>
                          
                          <div className="flex gap-2">
                             <button 
                                onClick={() => setSelectedProgram(prog)}
                                className="text-xs font-bold uppercase text-[#888] hover:text-white transition-colors border border-[#444] px-2 py-1"
                              >
                                  View Schedule
                              </button>
                             {settings.activeProgram?.programId !== prog.id && (
                                <button 
                                  onClick={() => handleActivateProgram(prog.id)}
                                  className="text-xs font-bold uppercase text-white hover:text-primary transition-colors border border-white hover:border-primary px-2 py-1"
                                >
                                    Activate
                                </button>
                            )}
                          </div>
                      </div>
                  </div>
              ))}
            </div>
          )}
      </section>

      {/* Protocols List */}
      <section>
        <div className="flex justify-between items-end mb-4 border-b border-[#222] pb-2">
            <h2 className="text-xl volt-header text-white">SINGLE PROTOCOLS</h2>
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
