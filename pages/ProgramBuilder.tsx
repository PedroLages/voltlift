import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY } from '../constants';
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  Trash2,
  Calendar,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Copy,
  Layers,
  Target,
  BarChart2,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Program, ProgramSession, ProgramGoal, ProgramSplitType, ProgramDifficulty, WorkoutSession } from '../types';
import { haptic } from '../services/haptics';

interface WeekData {
  weekNumber: number;
  sessions: ProgramSession[];
  isExpanded: boolean;
}

const GOALS: ProgramGoal[] = ['Hypertrophy', 'Strength', 'Powerlifting', 'Power-Building', 'General Fitness'];
const SPLIT_TYPES: ProgramSplitType[] = ['PPL', 'Upper/Lower', 'Full Body', 'Body Part Split'];
const DIFFICULTIES: ProgramDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

const ProgramBuilder = () => {
  const navigate = useNavigate();
  const { templates, programs, saveProgram, saveTemplate } = useStore();

  // Program metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weeks, setWeeks] = useState(4);
  const [goal, setGoal] = useState<ProgramGoal>('Hypertrophy');
  const [splitType, setSplitType] = useState<ProgramSplitType>('PPL');
  const [difficulty, setDifficulty] = useState<ProgramDifficulty>('Intermediate');
  const [frequency, setFrequency] = useState(4);

  // Week management
  const [weekData, setWeekData] = useState<WeekData[]>([
    { weekNumber: 1, sessions: [], isExpanded: true }
  ]);

  // UI state
  const [activeWeek, setActiveWeek] = useState(1);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showQuickTemplateBuilder, setShowQuickTemplateBuilder] = useState(false);
  const [pendingSessionDay, setPendingSessionDay] = useState<number>(1);

  // Quick template builder state
  const [quickTemplateName, setQuickTemplateName] = useState('');
  const [quickTemplateExercises, setQuickTemplateExercises] = useState<string[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  // Update weeks
  const handleWeeksChange = (newWeeks: number) => {
    setWeeks(newWeeks);
    const currentWeeks = weekData.length;

    if (newWeeks > currentWeeks) {
      // Add weeks
      const newWeekData = [...weekData];
      for (let i = currentWeeks; i < newWeeks; i++) {
        newWeekData.push({
          weekNumber: i + 1,
          sessions: [],
          isExpanded: false
        });
      }
      setWeekData(newWeekData);
    } else if (newWeeks < currentWeeks) {
      // Remove weeks
      setWeekData(weekData.slice(0, newWeeks));
    }
  };

  // Copy week sessions to another week
  const copyWeekToAll = (sourceWeek: number) => {
    haptic('medium');
    const source = weekData.find(w => w.weekNumber === sourceWeek);
    if (!source) return;

    setWeekData(weekData.map(week => ({
      ...week,
      sessions: source.sessions.map(s => ({ ...s, week: week.weekNumber }))
    })));
  };

  // Add session to a week
  const addSessionToWeek = (templateId: string) => {
    haptic('selection');
    setWeekData(weekData.map(week => {
      if (week.weekNumber === activeWeek) {
        const newSession: ProgramSession = {
          templateId,
          week: activeWeek,
          day: pendingSessionDay
        };
        return {
          ...week,
          sessions: [...week.sessions, newSession].sort((a, b) => a.day - b.day)
        };
      }
      return week;
    }));
    setShowTemplateSelector(false);
  };

  // Remove session from week
  const removeSession = (weekNumber: number, sessionIndex: number) => {
    haptic('light');
    setWeekData(weekData.map(week => {
      if (week.weekNumber === weekNumber) {
        const newSessions = [...week.sessions];
        newSessions.splice(sessionIndex, 1);
        return { ...week, sessions: newSessions };
      }
      return week;
    }));
  };

  // Toggle week expansion
  const toggleWeek = (weekNumber: number) => {
    setWeekData(weekData.map(week => ({
      ...week,
      isExpanded: week.weekNumber === weekNumber ? !week.isExpanded : week.isExpanded
    })));
  };

  // Create quick template and add to session
  const handleQuickTemplateCreate = () => {
    if (!quickTemplateName.trim() || quickTemplateExercises.length === 0) return;

    haptic('success');
    saveTemplate(quickTemplateName, quickTemplateExercises);

    // Find the newly created template (it will be the last one)
    setTimeout(() => {
      const newTemplates = useStore.getState().templates;
      const newTemplate = newTemplates[newTemplates.length - 1];
      if (newTemplate) {
        addSessionToWeek(newTemplate.id);
      }
    }, 100);

    setShowQuickTemplateBuilder(false);
    setQuickTemplateName('');
    setQuickTemplateExercises([]);
  };

  // Validate and save program
  const handleSave = () => {
    if (!name.trim()) {
      haptic('error');
      alert('Program name is required');
      return;
    }

    // Collect all sessions
    const allSessions = weekData.flatMap(w => w.sessions);

    if (allSessions.length === 0) {
      haptic('error');
      alert('Add at least one workout session');
      return;
    }

    haptic('success');

    const program: Omit<Program, 'id'> = {
      name: name.trim(),
      description: description.trim(),
      weeks,
      sessions: allSessions,
      goal,
      splitType,
      difficulty,
      frequency
    };

    saveProgram(program);
    navigate('/programs');
  };

  // Get template by ID
  const getTemplate = (templateId: string) => {
    return templates.find(t => t.id === templateId);
  };

  // Calculate total sessions
  const totalSessions = weekData.reduce((acc, week) => acc + week.sessions.length, 0);

  // Available templates (excluding those already in current week)
  const currentWeekTemplateIds = weekData.find(w => w.weekNumber === activeWeek)?.sessions.map(s => s.templateId) || [];

  return (
    <div className="min-h-screen bg-black p-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/lift')}
          className="w-10 h-10 border border-[#333] flex items-center justify-center text-[#666] hover:text-white hover:border-[#444] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black uppercase italic text-white">Program Builder</h1>
        <div className="w-10" />
      </div>

      {/* Program Info Section */}
      <section className="mb-8">
        <div className="bg-[#111] border border-[#222] p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
              Program Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.G. POWER BUILDING 12-WEEK"
              className="w-full bg-black border border-[#333] px-4 py-3 text-white font-bold uppercase focus:border-primary outline-none placeholder-[#333]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your program goals and structure..."
              rows={2}
              className="w-full bg-black border border-[#333] px-4 py-3 text-white text-sm font-mono focus:border-primary outline-none placeholder-[#444] resize-none"
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Weeks */}
            <div>
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
                Duration
              </label>
              <select
                value={weeks}
                onChange={(e) => handleWeeksChange(parseInt(e.target.value))}
                className="w-full bg-black border border-[#333] px-3 py-2 text-white font-mono focus:border-primary outline-none"
              >
                {[1, 2, 3, 4, 6, 8, 10, 12, 16].map(w => (
                  <option key={w} value={w}>{w} {w === 1 ? 'Week' : 'Weeks'}</option>
                ))}
              </select>
            </div>

            {/* Frequency */}
            <div>
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
                Days/Week
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value))}
                className="w-full bg-black border border-[#333] px-3 py-2 text-white font-mono focus:border-primary outline-none"
              >
                {[2, 3, 4, 5, 6].map(f => (
                  <option key={f} value={f}>{f} Days</option>
                ))}
              </select>
            </div>

            {/* Goal */}
            <div>
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
                <Target size={10} className="inline mr-1" /> Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as ProgramGoal)}
                className="w-full bg-black border border-[#333] px-3 py-2 text-white font-mono text-sm focus:border-primary outline-none"
              >
                {GOALS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Split Type */}
            <div>
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
                <Layers size={10} className="inline mr-1" /> Split
              </label>
              <select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as ProgramSplitType)}
                className="w-full bg-black border border-[#333] px-3 py-2 text-white font-mono text-sm focus:border-primary outline-none"
              >
                {SPLIT_TYPES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
                <BarChart2 size={10} className="inline mr-1" /> Difficulty
              </label>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 text-xs font-bold uppercase border transition-colors ${
                      difficulty === d
                        ? 'bg-primary text-black border-primary'
                        : 'bg-black text-[#666] border-[#333] hover:border-[#444]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Week Schedule Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#666] uppercase tracking-widest flex items-center gap-2">
            <Calendar size={14} /> Weekly Schedule
          </h2>
          <span className="text-[10px] text-primary font-mono">
            {totalSessions} Total Sessions
          </span>
        </div>

        {/* Week Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
          {weekData.map(week => (
            <button
              key={week.weekNumber}
              onClick={() => {
                setActiveWeek(week.weekNumber);
                toggleWeek(week.weekNumber);
              }}
              className={`px-4 py-2 text-xs font-bold uppercase whitespace-nowrap transition-colors ${
                week.weekNumber === activeWeek
                  ? 'bg-primary text-black'
                  : 'bg-[#111] text-[#666] border border-[#222] hover:text-white'
              }`}
            >
              W{week.weekNumber}
              {week.sessions.length > 0 && (
                <span className="ml-1 text-[10px]">({week.sessions.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Active Week Content */}
        {weekData.map(week => week.weekNumber === activeWeek && (
          <div key={week.weekNumber} className="bg-[#111] border border-[#222]">
            {/* Week Header */}
            <div className="p-4 border-b border-[#222] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase text-white">Week {week.weekNumber}</h3>
                <p className="text-[10px] text-[#666] font-mono">
                  {week.sessions.length} sessions scheduled
                </p>
              </div>
              {week.weekNumber === 1 && weekData.length > 1 && (
                <button
                  onClick={() => copyWeekToAll(1)}
                  className="px-3 py-1 text-[10px] font-bold uppercase text-primary border border-primary/30 hover:bg-primary/10 transition-colors flex items-center gap-1"
                >
                  <Copy size={12} /> Copy to All
                </button>
              )}
            </div>

            {/* Day Slots */}
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5, 6, 7].slice(0, frequency).map(day => {
                const daySession = week.sessions.find(s => s.day === day);
                const template = daySession ? getTemplate(daySession.templateId) : null;

                return (
                  <div
                    key={day}
                    className={`border p-3 transition-colors ${
                      daySession ? 'border-primary/30 bg-primary/5' : 'border-[#333] bg-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-[#222] flex items-center justify-center text-xs font-black text-[#666]">
                          D{day}
                        </span>
                        {template ? (
                          <div>
                            <h4 className="text-sm font-bold uppercase text-white">{template.name}</h4>
                            <p className="text-[10px] text-[#666] font-mono">
                              {template.logs.length} exercises
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-[#444] font-mono uppercase">Rest Day</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {daySession ? (
                          <button
                            onClick={() => removeSession(week.weekNumber, week.sessions.indexOf(daySession))}
                            className="w-8 h-8 flex items-center justify-center text-[#666] hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setPendingSessionDay(day);
                              setShowTemplateSelector(true);
                            }}
                            className="px-3 py-1 text-[10px] font-bold uppercase text-primary border border-[#333] hover:border-primary transition-colors flex items-center gap-1"
                          >
                            <Plus size={12} /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Summary */}
      <div className="bg-[#0a0a0a] border border-[#222] p-4 mb-6">
        <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3">Program Summary</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xl font-black italic text-primary">{weeks}</div>
            <div className="text-[9px] text-[#666] uppercase">Weeks</div>
          </div>
          <div>
            <div className="text-xl font-black italic text-white">{frequency}</div>
            <div className="text-[9px] text-[#666] uppercase">Days/Wk</div>
          </div>
          <div>
            <div className="text-xl font-black italic text-white">{totalSessions}</div>
            <div className="text-[9px] text-[#666] uppercase">Sessions</div>
          </div>
          <div>
            <div className="text-xl font-black italic text-white">{weeks * frequency}</div>
            <div className="text-[9px] text-[#666] uppercase">Total</div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-6 left-6 right-6 z-30">
        <button
          onClick={handleSave}
          disabled={!name.trim() || totalSessions === 0}
          className="w-full bg-primary text-black py-4 font-black italic uppercase tracking-wider text-lg shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={20} /> Create Program
        </button>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="p-4 border-b border-[#333] flex justify-between items-center bg-black sticky top-0">
            <h2 className="text-lg font-black uppercase text-white">Select Template</h2>
            <button
              onClick={() => setShowTemplateSelector(false)}
              className="text-[#666] hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell size={48} className="mx-auto mb-4 text-[#333]" />
                <p className="text-[#666] mb-4">No templates yet</p>
                <button
                  onClick={() => {
                    setShowTemplateSelector(false);
                    setShowQuickTemplateBuilder(true);
                  }}
                  className="px-6 py-3 bg-primary text-black font-bold uppercase text-xs"
                >
                  Create Template
                </button>
              </div>
            ) : (
              <>
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => addSessionToWeek(template.id)}
                    className="w-full bg-[#111] border border-[#222] p-4 text-left hover:border-primary transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold uppercase text-white group-hover:text-primary transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-[10px] text-[#666] font-mono mt-1">
                          {template.logs.length} exercises
                        </p>
                      </div>
                      <Plus size={20} className="text-[#444] group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => {
                    setShowTemplateSelector(false);
                    setShowQuickTemplateBuilder(true);
                  }}
                  className="w-full border border-dashed border-[#333] p-4 text-center text-[#666] hover:text-primary hover:border-primary transition-colors"
                >
                  <Plus size={20} className="mx-auto mb-2" />
                  <span className="text-xs font-bold uppercase">Create New Template</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick Template Builder Modal */}
      {showQuickTemplateBuilder && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="p-4 border-b border-[#333] flex justify-between items-center bg-black sticky top-0">
            <h2 className="text-lg font-black uppercase text-white">Quick Template</h2>
            <button
              onClick={() => {
                setShowQuickTemplateBuilder(false);
                setQuickTemplateName('');
                setQuickTemplateExercises([]);
              }}
              className="text-[#666] hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
                Template Name
              </label>
              <input
                type="text"
                value={quickTemplateName}
                onChange={(e) => setQuickTemplateName(e.target.value)}
                placeholder="E.G. PUSH DAY"
                className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white font-bold uppercase focus:border-primary outline-none placeholder-[#333]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">
                  Exercises
                </label>
                <span className="text-[10px] text-primary font-mono">
                  {quickTemplateExercises.length} selected
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {quickTemplateExercises.map((exId, index) => {
                  const ex = EXERCISE_LIBRARY.find(e => e.id === exId);
                  return (
                    <div
                      key={index}
                      className="bg-[#111] border border-[#222] p-3 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#444] font-mono text-xs">{index + 1}</span>
                        <span className="text-sm font-bold uppercase text-white">{ex?.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setQuickTemplateExercises(quickTemplateExercises.filter((_, i) => i !== index));
                        }}
                        className="text-[#666] hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowExerciseSelector(true)}
                className="w-full py-3 border border-[#333] text-primary font-bold uppercase text-xs flex items-center justify-center gap-2 hover:border-primary transition-colors"
              >
                <Plus size={16} /> Add Exercise
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-[#333] bg-black">
            <button
              onClick={handleQuickTemplateCreate}
              disabled={!quickTemplateName.trim() || quickTemplateExercises.length === 0}
              className="w-full py-4 bg-primary text-black font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> Create & Add to Program
            </button>
          </div>
        </div>
      )}

      {/* Exercise Selector for Quick Template */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="p-4 border-b border-[#333] flex justify-between items-center bg-black sticky top-0">
            <h2 className="text-lg font-black uppercase text-white">Add Exercise</h2>
            <button
              onClick={() => setShowExerciseSelector(false)}
              className="text-[#666] hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {EXERCISE_LIBRARY.map(ex => (
              <button
                key={ex.id}
                onClick={() => {
                  setQuickTemplateExercises([...quickTemplateExercises, ex.id]);
                  setShowExerciseSelector(false);
                }}
                className="w-full text-left p-4 border-b border-[#222] hover:bg-[#111] flex justify-between items-center group"
              >
                <div>
                  <h4 className="font-bold text-white uppercase group-hover:text-primary transition-colors">
                    {ex.name}
                  </h4>
                  <span className="text-[10px] text-[#666] font-mono">{ex.muscleGroup}</span>
                </div>
                <Plus size={18} className="text-[#444] group-hover:text-primary" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramBuilder;
