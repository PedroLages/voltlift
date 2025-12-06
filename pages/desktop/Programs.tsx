import React, { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Play, Target } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

export const DesktopPrograms: React.FC = () => {
  const { programs, templates, deleteTemplate, deleteProgram, settings } = useStore();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'programs' | 'templates'>('programs');

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Delete this template? This cannot be undone.')) {
      deleteTemplate(id);
    }
  };

  const handleDeleteProgram = (id: string) => {
    if (confirm('Delete this program? This cannot be undone.')) {
      deleteProgram(id);
    }
  };

  const activeProgram = settings.activeProgram
    ? programs.find(p => p.id === settings.activeProgram?.programId)
    : null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black italic text-white mb-2">PROGRAMS & TEMPLATES</h1>
        <p className="text-[#666] font-mono text-sm uppercase tracking-wider">
          Manage your workout programs and template library
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-[#222]">
        <button
          onClick={() => setSelectedTab('programs')}
          className={`px-6 py-3 font-bold uppercase text-sm transition-colors ${
            selectedTab === 'programs'
              ? 'text-primary border-b-2 border-primary'
              : 'text-[#666] hover:text-white'
          }`}
        >
          Programs ({programs.length})
        </button>
        <button
          onClick={() => setSelectedTab('templates')}
          className={`px-6 py-3 font-bold uppercase text-sm transition-colors ${
            selectedTab === 'templates'
              ? 'text-primary border-b-2 border-primary'
              : 'text-[#666] hover:text-white'
          }`}
        >
          Templates ({templates.length})
        </button>
      </div>

      {/* Active Program Banner */}
      {activeProgram && (
        <div className="bg-primary/10 border border-primary p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target size={20} className="text-primary" />
                <span className="text-xs uppercase font-bold tracking-widest text-primary">
                  Currently Active
                </span>
              </div>
              <h3 className="text-2xl font-black italic text-white mb-1">{activeProgram.name}</h3>
              <p className="text-sm text-[#888]">{activeProgram.description}</p>
            </div>
            <button
              onClick={() => navigate('/lift')}
              className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Programs Tab */}
      {selectedTab === 'programs' && (
        <div className="space-y-6">
          {/* Create New Program Button */}
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/builder')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
            >
              <Plus size={18} />
              Create New Program
            </button>
          </div>

          {/* Programs Grid */}
          {programs.length > 0 ? (
            <div className="grid grid-cols-2 gap-6">
              {programs.map(program => (
                <div
                  key={program.id}
                  className={`bg-[#111] border p-6 transition-colors ${
                    program.id === activeProgram?.id
                      ? 'border-primary'
                      : 'border-[#222] hover:border-[#444]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-black uppercase text-white mb-2">
                        {program.name}
                      </h3>
                      <p className="text-sm text-[#888] mb-4">{program.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-1">
                        Duration
                      </div>
                      <div className="text-lg font-black italic text-white">
                        {program.durationWeeks} weeks
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-1">
                        Sessions
                      </div>
                      <div className="text-lg font-black italic text-white">
                        {program.sessions.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-1">
                        Level
                      </div>
                      <div className="text-lg font-black italic text-white capitalize">
                        {program.difficulty}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/program/${program.id}`)}
                      className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white font-bold uppercase text-xs hover:bg-[#222] transition-colors"
                    >
                      View Details
                    </button>
                    {program.id !== activeProgram?.id && (
                      <button
                        onClick={() => handleDeleteProgram(program.id)}
                        className="px-4 py-2 bg-red-900/20 border border-red-900 text-red-500 font-bold uppercase text-xs hover:bg-red-900/40 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#111] border border-[#222] p-12 text-center">
              <BookOpen size={48} className="text-[#333] mx-auto mb-4" />
              <p className="text-sm text-[#666] mb-4">No programs created yet</p>
              <button
                onClick={() => navigate('/builder')}
                className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
              >
                Create Your First Program
              </button>
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {selectedTab === 'templates' && (
        <div className="space-y-6">
          {/* Create New Template Button */}
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/lift')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
            >
              <Plus size={18} />
              Create New Template
            </button>
          </div>

          {/* Templates Grid */}
          {templates.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="bg-[#111] border border-[#222] p-4 hover:border-[#444] transition-colors"
                >
                  <h3 className="text-sm font-bold uppercase text-white mb-2">
                    {template.name}
                  </h3>
                  <div className="text-xs text-[#666] font-mono mb-3">
                    {template.logs.length} exercises
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/lift')}
                      className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#333] text-white font-bold uppercase text-[10px] hover:bg-[#222] transition-colors flex items-center justify-center gap-1"
                    >
                      <Play size={12} />
                      Start
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-2 bg-red-900/20 border border-red-900 text-red-500 hover:bg-red-900/40 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#111] border border-[#222] p-12 text-center">
              <BookOpen size={48} className="text-[#333] mx-auto mb-4" />
              <p className="text-sm text-[#666] mb-4">No templates created yet</p>
              <button
                onClick={() => navigate('/lift')}
                className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
              >
                Create Your First Template
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DesktopPrograms;
