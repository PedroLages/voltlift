import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY } from '../constants';
import { getProgramMethodology } from '../utils/programMethodologies';
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
  ExternalLink,
  AlertCircle,
  Info
} from 'lucide-react';

const ProgramDetail = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { programs, settings, templates, activateProgram, startWorkout } = useStore();

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts'>('workouts');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<number | null>(null);

  // Find the program
  const program = useMemo(() => {
    return programs.find(p => p.id === programId);
  }, [programs, programId]);

  // Initialize selected frequency when program changes
  useEffect(() => {
    if (program) {
      // If program has multiple frequency options, don't auto-select (force user to choose)
      // If program has only one option or no variants, use the default frequency
      if (!program.supportedFrequencies || program.supportedFrequencies.length <= 1) {
        setSelectedFrequency(program.frequency);
      } else {
        setSelectedFrequency(null); // Force user to choose
      }
    }
  }, [program]);

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
    if (!acknowledged) {
      alert('Please acknowledge the commitment to this program');
      return;
    }

    // Validate frequency selection for programs with multiple variants
    if (program?.supportedFrequencies && program.supportedFrequencies.length > 1 && !selectedFrequency) {
      alert('Please select your preferred training frequency');
      return;
    }

    if (program) {
      // Determine which sessions to use
      const chosenFrequency = selectedFrequency || program.frequency;
      const sessions = (program.frequencyVariants?.[chosenFrequency]?.sessions) || program.sessions;

      // Activate the program with selected frequency
      activateProgram(program.id, chosenFrequency);

      // Auto-start the first session
      const firstSession = sessions.find(s => s.week === 1 && s.day === 1);
      if (firstSession) {
        startWorkout(firstSession.templateId);
        navigate('/workout');
      } else {
        navigate('/');
      }
    }
  };

  // Calculate estimated completion date
  const getCompletionDate = () => {
    if (!program) return '';
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + (program.weeks * 7));
    return endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

  // Get program-specific methodology
  const methodology = getProgramMethodology(program.id);

  // Get sessions grouped by week
  const sessionsByWeek = useMemo(() => {
    const grouped: Record<number, typeof program.sessions> = {};
    for (let i = 1; i <= program.weeks; i++) {
      grouped[i] = program.sessions.filter(s => s.week === i).sort((a, b) => a.day - b.day);
    }
    return grouped;
  }, [program]);

  return (
    <div className="min-h-screen bg-black font-sans text-white pb-40">
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

            {/* Program Methodology & Philosophy */}
            <div className="bg-[#111] border-l-4 border-primary p-5 rounded">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4 italic">Training Philosophy</h3>

              <div className="space-y-4">
                {/* Philosophy */}
                <div>
                  <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Approach</h4>
                  <p className="text-sm text-[#ccc] font-mono leading-relaxed">
                    {methodology.approach}
                  </p>
                </div>

                {/* Goals */}
                <div>
                  <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Primary Goals</h4>
                  <ul className="text-sm text-[#ccc] space-y-1.5 font-mono leading-relaxed">
                    {methodology.goals.map((goal, idx) => (
                      <li key={idx}>• {goal}</li>
                    ))}
                  </ul>
                </div>

                {/* Key Instructions */}
                <div>
                  <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Execution Guidelines</h4>
                  <ul className="text-sm text-[#ccc] space-y-1.5 font-mono leading-relaxed">
                    {methodology.guidelines.map((guideline, idx) => (
                      <li key={idx}>• {guideline}</li>
                    ))}
                  </ul>
                </div>

                {/* Training Principles */}
                <div>
                  <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Core Principles</h4>
                  <ul className="text-sm text-[#ccc] space-y-1.5 font-mono leading-relaxed">
                    {methodology.principles.map((principle, idx) => (
                      <li key={idx}>• <span className="text-primary font-bold">{principle.name}:</span> {principle.description}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Enrollment Section - Only show if not already enrolled */}
            {!isActiveProgram && (
              <>
                {/* Start Date Configuration */}
                <div>
                  <label className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3 block">Start Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#111] border-2 border-[#222] p-4 text-white font-mono focus:border-primary outline-none"
                    />
                    <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-[#444] font-mono mt-2">
                    Estimated completion: {getCompletionDate()}
                  </p>
                </div>

                {/* What Happens Next */}
                <div className="bg-[#111] border-l-4 border-primary p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">What Happens Next</h3>
                      <ol className="text-sm text-[#ccc] space-y-2 font-mono leading-relaxed list-decimal list-inside">
                        <li>Your first workout starts immediately after enrollment</li>
                        <li>Follow the program schedule in the order provided</li>
                        <li>Track all sets and reps for progression tracking</li>
                        <li>Access your active program from the dashboard</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                {/* Frequency Selection (if program supports multiple options) */}
                {program.supportedFrequencies && program.supportedFrequencies.length > 1 && (
                  <div className="bg-black border-l-4 border-primary p-4">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Zap size={16} />
                        Choose Your Training Frequency
                      </h3>
                      <p className="text-xs text-[#888] font-mono">
                        This program can be adapted to different training schedules. Select how many days per week you can commit to training.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {program.supportedFrequencies.sort((a, b) => a - b).map((freq) => {
                        const variant = program.frequencyVariants?.[freq];
                        const isSelected = selectedFrequency === freq;

                        return (
                          <button
                            key={freq}
                            onClick={() => setSelectedFrequency(freq)}
                            className={`p-4 border-2 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(204,255,0,0.2)]'
                                : 'border-[#333] hover:border-[#555] bg-[#0a0a0a]'
                            }`}
                          >
                            <div className="text-center">
                              <div className={`text-3xl font-black italic mb-1 ${isSelected ? 'text-primary' : 'text-white'}`}>
                                {freq}x
                              </div>
                              <div className={`text-xs uppercase tracking-widest font-bold ${isSelected ? 'text-primary' : 'text-[#666]'}`}>
                                Per Week
                              </div>
                              {variant?.description && (
                                <div className="text-[10px] text-[#888] mt-2 font-mono leading-relaxed">
                                  {variant.description}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-[#111] border-l-4 border-yellow-500 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">Important Commitment</h3>
                      <ul className="text-sm text-[#aaa] space-y-2 font-mono leading-relaxed">
                        <li>• This program requires {selectedFrequency || program.frequency} sessions per week for {program.weeks} weeks</li>
                        <li>• Consistency is critical - follow the prescribed order and rest days</li>
                        <li>• Your first workout begins immediately after clicking "Start Program"</li>
                        <li>• You can pause or deactivate the program anytime from your profile</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Acknowledgement Checkbox */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="w-5 h-5 mt-0.5 accent-primary cursor-pointer"
                    />
                    <span className="text-sm text-[#aaa] font-mono leading-relaxed group-hover:text-white transition-colors">
                      I understand this program requires {selectedFrequency || program.frequency} training sessions per week for {program.weeks} weeks. I commit to following the program as designed and tracking my progress accurately. I understand my first workout will start immediately upon enrollment.
                    </span>
                  </label>
                </div>
              </>
            )}
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
                    <div className="flex items-center justify-between mb-3 border-l-4 border-primary pl-3 bg-[#0a0a0a] py-2 pr-3">
                      <h2 className="text-lg font-black text-primary uppercase tracking-wider italic">Week {weekNum}</h2>
                      <button
                        onClick={() => expandAllInWeek(weekNum)}
                        className="text-xs text-primary font-bold uppercase tracking-wider hover:text-white transition-colors"
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
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a1a1a] to-black border-2 border-[#333] flex items-center justify-center shadow-lg flex-shrink-0">
                                  <span className="text-primary font-black text-base">{idx + 1}</span>
                                </div>
                                <div className="text-left">
                                  <h3 className="text-sm font-bold text-white uppercase">{template?.name || `Day ${idx + 1}`}</h3>
                                  <p className="text-[10px] text-[#666] font-mono mt-0.5">{exerciseCount} exercises</p>
                                </div>
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

      {/* Sticky Bottom Button - Positioned above bottom nav */}
      <div
        className="fixed left-0 right-0 px-4 pt-3 pb-2 bg-black border-t border-[#222] z-[60]"
        style={{ bottom: 'max(110px, calc(94px + env(safe-area-inset-bottom)))' }}
      >
        {!isActiveProgram ? (
          <button
            onClick={handleJoinProgram}
            disabled={!acknowledged}
            className={`w-full py-4 font-black italic uppercase text-lg tracking-widest transition-all flex items-center justify-center gap-2 ${
              acknowledged
                ? 'bg-primary text-black hover:bg-white shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                : 'bg-[#222] text-[#444] cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={20} />
            {acknowledged ? `Start ${program.name} Now` : 'Acknowledge Commitment to Continue'}
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-primary text-black font-black italic uppercase text-lg tracking-widest hover:bg-white transition-colors"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default ProgramDetail;
