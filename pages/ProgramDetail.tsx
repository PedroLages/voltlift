import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY } from '../constants';
import {
  ArrowLeft,
  Calendar,
  Zap,
  Target,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  Dumbbell,
  ExternalLink
} from 'lucide-react';

const ProgramDetail = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { programs, settings, templates, activateProgram, startWorkout } = useStore();

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts'>('workouts');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Find the program
  const program = useMemo(() => {
    return programs.find(p => p.id === programId);
  }, [programs, programId]);

  // Get template by ID
  const getTemplate = (templateId: string) => {
    return templates.find(t => t.id === templateId);
  };

  // Get exercise by ID
  const getExercise = (exerciseId: string) => {
    return EXERCISE_LIBRARY.find(e => e.id === exerciseId);
  };

  // Calculate sessions per week
  const getSessionsPerWeek = (programData: typeof program) => {
    if (!programData || programData.sessions.length === 0) return 0;
    const week1Sessions = programData.sessions.filter(s => s.week === 1);
    return week1Sessions.length;
  };

  // Get difficulty based on frequency
  const getDifficulty = (programData: typeof program) => {
    if (!programData) return { level: 'Unknown', color: 'text-[#666]' };
    const sessionsPerWeek = getSessionsPerWeek(programData);
    if (sessionsPerWeek >= 6) return { level: 'Advanced', color: 'text-red-400' };
    if (sessionsPerWeek >= 4) return { level: 'Intermediate', color: 'text-yellow-400' };
    return { level: 'Beginner', color: 'text-green-400' };
  };

  // Check if program is currently active
  const isActiveProgram = settings.activeProgram?.programId === programId;

  // Toggle day expansion
  const toggleDay = (dayKey: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  // Expand all days in a week
  const expandAllInWeek = (weekNum: number) => {
    if (!program) return;
    const weekSessions = program.sessions.filter(s => s.week === weekNum);
    const newExpanded = new Set(expandedDays);

    const allExpanded = weekSessions.every(s => expandedDays.has(`${s.week}-${s.day}`));

    weekSessions.forEach(s => {
      const key = `${s.week}-${s.day}`;
      if (allExpanded) {
        newExpanded.delete(key);
      } else {
        newExpanded.add(key);
      }
    });

    setExpandedDays(newExpanded);
  };

  // Handle join program
  const handleJoinProgram = () => {
    if (program) {
      activateProgram(program.id);
      navigate('/');
    }
  };

  // Handle start workout
  const handleStartWorkout = (templateId: string, week: number, day: number) => {
    startWorkout(templateId);
    navigate('/workout');
  };

  if (!program) {
    return (
      <div className="min-h-screen bg-black p-6 pb-24 font-sans text-white">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/programs')}
            className="w-10 h-10 border border-[#333] flex items-center justify-center hover:bg-[#111] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-[#666]">Program Not Found</span>
        </div>
        <div className="bg-[#111] border border-[#222] p-8 text-center">
          <p className="text-[#666] font-mono text-sm mb-4">The program you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/programs')}
            className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm tracking-widest hover:bg-white transition-colors"
          >
            Browse Programs
          </button>
        </div>
      </div>
    );
  }

  const sessionsPerWeek = getSessionsPerWeek(program);
  const difficulty = getDifficulty(program);

  // Get sessions grouped by week
  const sessionsByWeek = useMemo(() => {
    const grouped: Record<number, typeof program.sessions> = {};
    for (let i = 1; i <= program.weeks; i++) {
      grouped[i] = program.sessions.filter(s => s.week === i).sort((a, b) => a.day - b.day);
    }
    return grouped;
  }, [program]);

  return (
    <div className="min-h-screen bg-black font-sans text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-black z-20 border-b border-[#222]">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/programs')}
            className="text-[#888] hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>

          {/* Tabs */}
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'text-white border-primary'
                  : 'text-[#666] border-transparent hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('workouts')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeTab === 'workouts'
                  ? 'text-white border-primary'
                  : 'text-[#666] border-transparent hover:text-white'
              }`}
            >
              Workouts
            </button>
          </div>

          <button className="text-[#888] hover:text-white transition-colors">
            <ExternalLink size={20} />
          </button>
        </div>

        {/* Week Tabs - Only show in Workouts tab */}
        {activeTab === 'workouts' && (
          <div className="px-4 pb-3">
            {/* Program Variation Selector (if applicable) */}
            <div className="mb-3">
              <div className="bg-[#111] border border-[#333] rounded px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-white">{sessionsPerWeek} Day a Week</span>
                <ChevronDown size={16} className="text-[#666]" />
              </div>
            </div>

            {/* Week Tabs */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {Array.from({ length: program.weeks }, (_, i) => i + 1).map((weekNum) => (
                <button
                  key={weekNum}
                  onClick={() => setSelectedWeek(weekNum)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full border transition-colors ${
                    selectedWeek === weekNum
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'border-[#333] text-[#888] hover:border-[#555] hover:text-white'
                  }`}
                >
                  Week {weekNum}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' ? (
          /* Overview Tab */
          <div className="space-y-6">
            {/* Program Title */}
            <div>
              <h1 className="text-3xl font-black italic uppercase leading-tight mb-2">{program.name}</h1>
              {isActiveProgram && (
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 size={16} fill="currentColor" />
                  <span className="text-xs font-bold uppercase tracking-widest">Currently Active</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#111] border border-[#222] p-5 rounded">
              <p className="text-[#ccc] leading-relaxed">{program.description}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111] p-4 border border-[#222] rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-primary" />
                  <span className="text-[10px] text-[#666] uppercase font-bold">Duration</span>
                </div>
                <div className="text-2xl font-black italic text-white">{program.weeks} <span className="text-sm font-normal text-[#666]">weeks</span></div>
              </div>

              <div className="bg-[#111] p-4 border border-[#222] rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-primary" />
                  <span className="text-[10px] text-[#666] uppercase font-bold">Frequency</span>
                </div>
                <div className="text-2xl font-black italic text-white">{sessionsPerWeek} <span className="text-sm font-normal text-[#666]">days/wk</span></div>
              </div>

              <div className="bg-[#111] p-4 border border-[#222] rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} className="text-primary" />
                  <span className="text-[10px] text-[#666] uppercase font-bold">Level</span>
                </div>
                <div className={`text-2xl font-black italic ${difficulty.color}`}>{difficulty.level}</div>
              </div>

              <div className="bg-[#111] p-4 border border-[#222] rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-primary" />
                  <span className="text-[10px] text-[#666] uppercase font-bold">Sessions</span>
                </div>
                <div className="text-2xl font-black italic text-white">{program.sessions.length} <span className="text-sm font-normal text-[#666]">total</span></div>
              </div>
            </div>

            {/* What to Expect */}
            <div className="bg-[#111] border border-[#222] p-5 rounded">
              <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3">What to Expect</h3>
              <ul className="space-y-2 text-sm text-[#aaa]">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Consistent progression over {program.weeks} weeks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{sessionsPerWeek} training days per week with adequate recovery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Structured volume and intensity management</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* Workouts Tab */
          <div className="space-y-6">
            {/* Render weeks - show selected week prominently, others below */}
            {Array.from({ length: program.weeks }, (_, i) => i + 1)
              .filter(weekNum => weekNum === selectedWeek || weekNum === selectedWeek + 1)
              .map((weekNum) => {
                const weekSessions = sessionsByWeek[weekNum] || [];
                const isCurrentWeek = weekNum === selectedWeek;

                return (
                  <div key={weekNum}>
                    {/* Week Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-bold text-white">Week {weekNum}</h2>
                      <button
                        onClick={() => expandAllInWeek(weekNum)}
                        className="text-xs text-primary font-medium hover:text-white transition-colors"
                      >
                        {weekSessions.every(s => expandedDays.has(`${s.week}-${s.day}`)) ? 'Collapse All' : 'Expand All'}
                      </button>
                    </div>

                    {/* Day Cards */}
                    <div className="space-y-3">
                      {weekSessions.map((session, idx) => {
                        const dayKey = `${session.week}-${session.day}`;
                        const isExpanded = expandedDays.has(dayKey);
                        const template = getTemplate(session.templateId);
                        const exerciseCount = template?.logs.length || 0;

                        return (
                          <div
                            key={dayKey}
                            className="bg-[#111] border border-[#222] rounded overflow-hidden"
                          >
                            {/* Day Header */}
                            <button
                              onClick={() => toggleDay(dayKey)}
                              className="w-full px-4 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
                            >
                              <div>
                                <h3 className="text-base font-bold text-white text-left">Day {idx + 1}</h3>
                                <p className="text-xs text-[#666] mt-0.5">{exerciseCount} exercises</p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp size={20} className="text-[#666]" />
                              ) : (
                                <ChevronDown size={20} className="text-[#666]" />
                              )}
                            </button>

                            {/* Expanded Exercise List */}
                            {isExpanded && template && (
                              <div className="border-t border-[#222] px-4 py-3">
                                <div className="space-y-4">
                                  {template.logs.map((log, exerciseIdx) => {
                                    const exercise = getExercise(log.exerciseId);
                                    if (!exercise) return null;

                                    // Determine tier based on exercise order
                                    const tier = exerciseIdx === 0 ? 'T1' : exerciseIdx === 1 ? 'T2' : 'T3';
                                    const tierColor = tier === 'T1' ? 'text-primary' : tier === 'T2' ? 'text-blue-400' : 'text-[#888]';

                                    return (
                                      <div key={log.id} className="border-l-2 border-[#333] pl-3">
                                        <div className="flex items-start gap-2 mb-1">
                                          <span className={`text-sm font-bold ${tierColor}`}>{exerciseIdx + 1}</span>
                                          <div>
                                            <span className={`text-sm font-medium ${tierColor}`}>
                                              {exercise.name} ({tier})
                                            </span>
                                            <div className="text-xs text-[#888] mt-1 space-y-0.5">
                                              <p>{log.sets.length} Sets • {log.sets[0]?.reps || 10} Reps</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Start Workout Button */}
                                {isActiveProgram && (
                                  <button
                                    onClick={() => handleStartWorkout(session.templateId, session.week, session.day)}
                                    className="mt-4 w-full py-3 bg-[#1a1a1a] border border-[#333] rounded text-sm font-medium text-white hover:bg-[#222] transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Play size={14} />
                                    Start Week {session.week}, Day {idx + 1}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-[#222]">
        {!isActiveProgram ? (
          <button
            onClick={handleJoinProgram}
            className="w-full py-4 bg-[#6366f1] text-white font-bold rounded-lg text-base tracking-wide hover:bg-[#5558e3] transition-colors"
          >
            Join Program
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-primary text-black font-bold rounded-lg text-base tracking-wide hover:bg-white transition-colors"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default ProgramDetail;
