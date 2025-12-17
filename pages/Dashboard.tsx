
import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Activity, Flame, ChevronRight, Play, Clock, BarChart2, Timer, Brain, Calendar, Cloud, Moon, Droplets, Dumbbell, AlertCircle, Monitor, X, Repeat, Target } from 'lucide-react';
import { getWorkoutMotivation } from '../services/geminiService';
import { EXERCISE_LIBRARY } from '../constants';
import EmptyState from '../components/EmptyState';
import { formatTime } from '../utils/formatters';
import { RecoveryScore } from '../components/AISuggestionBadge';
import { StrengthScore } from '../components/StrengthScore';
import ResumeWorkoutBanner from '../components/ResumeWorkoutBanner';
import { getPeriodizationStatus } from '../services/periodization';
import { getQuickRecoveryStatus } from '../services/adaptiveRecovery';
import { getTopWeakPoint } from '../services/workoutIntelligence';
import SmartInsightsPanel from '../components/SmartInsightsPanel';
import DeloadAlert from '../components/DeloadAlert';
import { RecoveryScoreCard } from '../components/RecoveryScoreCard';
import { DailyWellnessCheckin } from '../components/DailyWellnessCheckin';

const Dashboard = () => {
  const { settings, history, activeWorkout, restTimerStart, restDuration, stopRestTimer, getFatigueStatus, programs, templates, startWorkout, resumeWorkout, syncStatus, logDailyBio, dailyLogs, getVolumeWarning } = useStore();
  const navigate = useNavigate();
  const [motivation, setMotivation] = useState("LOADING PROTOCOL...");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [showDesktopBanner, setShowDesktopBanner] = useState(false);
  const [showWellnessCheckin, setShowWellnessCheckin] = useState(false);

  // Check if user is on desktop and hasn't dismissed the banner
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    const hasDismissed = localStorage.getItem('desktopBannerDismissed') === 'true';
    setShowDesktopBanner(isDesktop && !hasDismissed);
  }, []);

  const dismissDesktopBanner = () => {
    localStorage.setItem('desktopBannerDismissed', 'true');
    setShowDesktopBanner(false);
  };

  const workoutsThisWeek = history.filter(h => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return h.startTime > oneWeekAgo && h.status === 'completed';
  }).length;

  // Find most recent draft workout
  const draftWorkout = history.find(h => h.status === 'draft');

  const handleResumeDraft = () => {
    if (draftWorkout) {
      resumeWorkout(draftWorkout.id);
      navigate('/workout');
    }
  };

  const handleDiscardDraft = () => {
    if (draftWorkout && confirm('Discard this draft workout?')) {
      const newHistory = history.filter(h => h.id !== draftWorkout.id);
      // This will need a method in the store, but for now just using history filter
    }
  };

  const fatigue = getFatigueStatus();
  
  // Daily Log Logic
  const today = new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs[today] || { date: today };

  // Check if user needs to complete daily wellness check-in
  const todayLogForCheckin = dailyLogs.find(log => log.date === today);
  const needsWellnessCheckin = !todayLogForCheckin?.perceivedRecovery;

  // Show wellness check-in prompt on first load if needed and user has history
  useEffect(() => {
    if (needsWellnessCheckin && history.length >= 3 && !activeWorkout) {
      // Delay showing to not interrupt immediately
      const timer = setTimeout(() => {
        setShowWellnessCheckin(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [needsWellnessCheckin, history.length, activeWorkout]);

  // Calculate Recovery Score from daily log
  const getRecoveryScore = () => {
    if (!todayLog.sleepHours) return 7; // Neutral if no data

    let score = 7;
    if (todayLog.sleepHours >= 8) score += 2;
    else if (todayLog.sleepHours >= 7) score += 1;
    else if (todayLog.sleepHours >= 6) score -= 1;
    else score -= 3;

    if (todayLog.stressLevel) {
      if (todayLog.stressLevel >= 8) score -= 2;
      else if (todayLog.stressLevel >= 6) score -= 1;
    }

    return Math.max(0, Math.min(10, score));
  };

  // Get Volume Warnings for all muscle groups
  const getVolumeWarnings = () => {
    const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
    return muscleGroups
      .map(mg => {
        // For dashboard, we check volume per muscle group by finding exercises
        const recentExercises = history
          .filter(h => h.status === 'completed')
          .flatMap(h => h.logs.map(l => l.exerciseId));

        // Get first exercise of this muscle group to check volume
        const firstExerciseId = EXERCISE_LIBRARY.find(e => e.muscleGroup === mg)?.id;
        if (!firstExerciseId) return null;

        const warning = getVolumeWarning(firstExerciseId);
        return warning?.warning ? { muscleGroup: mg, warning } : null;
      })
      .filter((item): item is { muscleGroup: string; warning: { warning: boolean; message: string; sets: number } } => item !== null);
  };

  const recoveryScore = getRecoveryScore();
  const volumeWarnings = getVolumeWarnings();

  // Phase 3: Periodization Status
  const periodizationStatus = useMemo(() => {
    if (history.length < 3) return null;
    const dailyLogsArray = Object.values(dailyLogs).map(log => ({
      date: new Date(log.date).getTime(),
      sleepHours: log.sleepHours,
      mood: log.mood,
      stressLevel: log.stressLevel,
      energyLevel: log.energyLevel,
      notes: log.notes || '',
      waterLitres: log.waterLitres
    }));
    return getPeriodizationStatus(history, dailyLogsArray, settings.experienceLevel);
  }, [history, dailyLogs, settings.experienceLevel]);

  // Phase 3: Recovery Status
  const quickRecoveryStatus = useMemo(() => {
    if (history.length < 2) return null;
    const dailyLogsArray = Object.values(dailyLogs).map(log => ({
      date: new Date(log.date).getTime(),
      sleepHours: log.sleepHours,
      mood: log.mood,
      stressLevel: log.stressLevel,
      energyLevel: log.energyLevel,
      notes: log.notes || '',
      waterLitres: log.waterLitres
    }));
    return getQuickRecoveryStatus(history, dailyLogsArray, settings.experienceLevel);
  }, [history, dailyLogs, settings.experienceLevel]);

  // Phase 3: Weak Point
  const topWeakPoint = useMemo(() => {
    if (history.length < 5) return null;
    return getTopWeakPoint(history, settings.experienceLevel);
  }, [history, settings.experienceLevel]);

  useEffect(() => {
    getWorkoutMotivation(settings.name).then(setMotivation);
  }, [settings.name]);

  useEffect(() => {
    if (activeWorkout) {
        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [activeWorkout]);

  // Rest Timer Logic for Banner
  useEffect(() => {
      if (restTimerStart) {
          const interval = setInterval(() => {
              const gone = Math.floor((Date.now() - restTimerStart) / 1000);
              const left = restDuration - gone;
              if (left <= 0) {
                  setRestTimeLeft(0);
              } else {
                  setRestTimeLeft(left);
              }
          }, 500);
          return () => clearInterval(interval);
      } else {
          setRestTimeLeft(0);
      }
  }, [restTimerStart, restDuration]);

  const getNextExerciseName = () => {
      if (!activeWorkout) return '';
      const nextLog = activeWorkout.logs.find(log => log.sets.some(s => !s.completed));
      if (!nextLog) return 'Cooldown';
      const exercise = EXERCISE_LIBRARY.find(e => e.id === nextLog.exerciseId);
      return exercise ? exercise.name : 'Unknown';
  };

  // Logic for Active Program Display
  let currentProgramDetails = null;
  if (settings.activeProgram) {
      const prog = programs.find(p => p.id === settings.activeProgram?.programId);
      if (prog) {
          const sessionIndex = settings.activeProgram.currentSessionIndex;
          const session = prog.sessions[sessionIndex];
          const template = templates.find(t => t.id === session.templateId);
          currentProgramDetails = {
              name: prog.name,
              sessionIndex: sessionIndex + 1,
              totalSessions: prog.sessions.length,
              week: session?.week,
              day: session?.day,
              nextTemplate: template
          };
      }
  }

  const handleStartProgramSession = () => {
      if (currentProgramDetails?.nextTemplate) {
          startWorkout(currentProgramDetails.nextTemplate.id);
          navigate('/workout');
      }
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-32">
      {/* Desktop Banner */}
      {showDesktopBanner && (
        <div className="hidden md:block bg-primary/10 border-2 border-primary p-4 -mx-6 -mt-6 mb-4">
          <div className="flex items-start gap-3">
            <Monitor size={24} className="text-primary flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase text-white mb-1">
                Desktop Dashboard Available
              </h3>
              <p className="text-xs text-[#888] mb-3">
                You're on a desktop. Try our powerful desktop dashboard with advanced analytics, calendar view, and data management.
              </p>
              <button
                onClick={() => navigate('/desktop')}
                className="px-4 py-2 bg-primary text-black font-bold uppercase text-xs hover:bg-white transition-colors"
              >
                Open Desktop View
              </button>
            </div>
            <button
              onClick={dismissDesktopBanner}
              className="text-[#666] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-start pt-4">
        <div>
          <h1 className="text-4xl volt-header leading-none text-white">
            HELLO <br/> <span className="text-primary">{settings.name}</span>
          </h1>
          <p className="text-xs text-textMuted font-mono uppercase mt-2 tracking-widest">{motivation}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            {/* User Avatar - Click to open profile */}
            <div
                onClick={() => navigate('/profile')}
                className="w-12 h-12 bg-[#222] flex items-center justify-center text-primary font-black text-xl italic border border-[#333] cursor-pointer hover:border-primary hover:scale-105 transition-all overflow-hidden"
                aria-label="Open profile"
            >
                {settings.profilePictureUrl ? (
                    <img
                        src={settings.profilePictureUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    settings.name.charAt(0)
                )}
            </div>

            {/* IronCloud Status */}
            {settings.ironCloud?.enabled && (
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest">
                    <Cloud size={12} className={syncStatus === 'syncing' ? 'text-primary animate-pulse' : syncStatus === 'error' ? 'text-red-500' : 'text-[#666]'} />
                    <span className={syncStatus === 'synced' ? 'text-[#444]' : 'text-primary'}>{syncStatus === 'synced' ? 'CLOUD OK' : syncStatus}</span>
                </div>
            )}
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-2">
        {/* Primary Metric - Sessions This Week */}
        <div className="bg-[#111] p-6 border border-primary/30 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(204,255,0,0.1)]">
          <div className="mb-3 text-primary"><Flame size={24} /></div>
          <span className="text-5xl font-black italic text-primary leading-none">{workoutsThisWeek}</span>
          <span className="text-xs font-bold text-white uppercase mt-2 tracking-widest">SESSIONS THIS WEEK</span>
        </div>

        <StatCard icon={<Activity size={18} />} value={history.length} label="TOTAL" color="text-white" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-2 -mt-4">
        <StatCard icon={<TrendingUp size={18} />} value={`${settings.goal.targetPerWeek}`} label="WEEKLY TARGET" color="text-primary" />
        <div className="bg-[#111] p-4 border border-[#222] flex flex-col items-center justify-center text-center">
          <div className="mb-3 text-white"><Calendar size={18} /></div>
          <span className="text-3xl font-black italic text-white leading-none">{workoutsThisWeek >= settings.goal.targetPerWeek ? '✓' : Math.max(0, settings.goal.targetPerWeek - workoutsThisWeek)}</span>
          <span className="text-[10px] font-bold text-[#666] uppercase mt-1 tracking-widest">REMAINING</span>
        </div>
      </div>

      {/* Neural Coach Widget */}
      <div className="bg-[#111] border border-[#222] p-4 flex gap-4 items-stretch">
          <div className="flex-1 border-r border-[#222] pr-4">
              <div className="flex items-center gap-2 mb-2">
                  <Brain size={16} className="text-[#666]" />
                  <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Neural Status</span>
              </div>
              <div className="text-2xl font-black italic uppercase leading-none mb-1" style={{ color: fatigue.color }}>
                  {fatigue.status}
              </div>
              <p className="text-[10px] text-white font-mono uppercase leading-tight">{fatigue.recommendation}</p>
          </div>
          
          <div className="flex-1 pl-2">
             <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-[#666]" />
                  <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Active Cycle</span>
              </div>
              {currentProgramDetails ? (
                  <div>
                      <div className="text-white font-bold text-sm uppercase leading-tight mb-1">{currentProgramDetails.name}</div>
                      <div className="text-[10px] text-primary font-mono uppercase">
                          Week {currentProgramDetails.week} • Session {currentProgramDetails.sessionIndex}/{currentProgramDetails.totalSessions}
                      </div>
                  </div>
              ) : (
                  <div>
                      <div className="text-[#444] font-bold text-sm uppercase">CHOOSE YOUR PROTOCOL</div>
                      <button onClick={() => navigate('/programs')} className="text-[10px] text-primary underline font-mono uppercase mt-1">SELECT PROGRAM</button>
                  </div>
              )}
          </div>
      </div>

      {/* ML-Powered Recovery Score Card */}
      {history.length >= 3 && (
        <RecoveryScoreCard
          onOpenWellnessCheckin={() => setShowWellnessCheckin(true)}
        />
      )}

      {/* P2: Smart Insights Panel - Fatigue, Goals, Streak */}
      <SmartInsightsPanel />

      {/* P3: Auto-Deload Detection Alert */}
      {history.length >= 4 && (
        <DeloadAlert compact />
      )}

      {/* Phase 3: Periodization Status Widget */}
      {periodizationStatus && (
        <div className="bg-[#111] border border-[#222] p-4">
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Repeat size={14} /> Training Cycle
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Current Phase */}
            <div className="bg-[#0a0a0a] border border-[#333] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-primary" />
                <span className="text-[10px] font-bold text-[#888] uppercase">Current Phase</span>
              </div>
              <div className="text-xl font-black uppercase italic" style={{
                color: periodizationStatus.currentPhase === 'accumulation' ? '#4ade80' :
                       periodizationStatus.currentPhase === 'intensification' ? '#f59e0b' :
                       periodizationStatus.currentPhase === 'deload' ? '#60a5fa' : '#888'
              }}>
                {periodizationStatus.currentPhase}
              </div>
              <p className="text-[9px] text-[#555] font-mono uppercase mt-1">
                {periodizationStatus.currentPhase === 'accumulation' ? 'Building volume' :
                 periodizationStatus.currentPhase === 'intensification' ? 'Peak intensity' :
                 periodizationStatus.currentPhase === 'deload' ? 'Recovery week' : 'Maintain'}
              </p>
            </div>

            {/* Days Until Deload */}
            <div className="bg-[#0a0a0a] border border-[#333] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className={periodizationStatus.daysUntilDeload <= 3 ? 'text-orange-400' : 'text-[#666]'} />
                <span className="text-[10px] font-bold text-[#888] uppercase">Next Deload</span>
              </div>
              <div className={`text-xl font-black italic ${periodizationStatus.daysUntilDeload <= 3 ? 'text-orange-400' : 'text-white'}`}>
                {periodizationStatus.daysUntilDeload} Days
              </div>
              <p className="text-[9px] text-[#555] font-mono uppercase mt-1">
                {periodizationStatus.daysUntilDeload === 0 ? 'Deload now!' : 'Until recovery'}
              </p>
            </div>
          </div>

          {periodizationStatus.needsDeload && (
            <div className="mt-3 bg-orange-500/10 border border-orange-500/30 p-3 flex items-center gap-2">
              <AlertCircle size={14} className="text-orange-400" />
              <span className="text-[10px] text-orange-400 font-bold uppercase">Deload Week Recommended</span>
            </div>
          )}
        </div>
      )}

      {/* Phase 3: Weak Point Alert */}
      {topWeakPoint && topWeakPoint !== 'No weak points detected - training is balanced!' && (
        <div className="bg-[#111] border border-primary/30 p-4">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
            <Target size={14} /> Priority Focus
          </h3>
          <p className="text-sm text-white font-mono leading-relaxed">
            {topWeakPoint}
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="mt-3 text-[10px] text-primary underline font-mono uppercase"
          >
            View Full Analysis →
          </button>
        </div>
      )}

      {/* Bio-Feedback / Recovery Protocol */}
      <div className="bg-[#111] border border-[#222] p-4">
           <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity size={14} /> Recovery Protocol
           </h3>

           {/* Recovery Score Display */}
           <div className="mb-4 bg-[#0a0a0a] border border-[#333] p-4">
               <RecoveryScore score={recoveryScore} compact={false} />
           </div>

           <div className="grid grid-cols-2 gap-3">
                {/* Sleep Input */}
                <div className="bg-[#0a0a0a] border border-[#333] p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Moon size={16} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-[#888] uppercase">Sleep</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="24"
                            step="0.5"
                            placeholder="7.5"
                            value={todayLog.sleepHours || ''}
                            onChange={(e) => logDailyBio(today, { sleepHours: parseFloat(e.target.value) })}
                            className="flex-1 bg-[#111] border border-[#444] px-3 py-2 text-2xl font-mono text-white text-center outline-none focus:border-primary focus:text-primary transition-colors min-h-[44px]"
                            aria-label="Sleep hours"
                        />
                        <span className="text-xs text-[#666] font-mono">HRS</span>
                    </div>
                    <span className="text-[9px] text-[#555] font-mono uppercase tracking-wide">Tap to log (0-24)</span>
                </div>

                {/* Water Input */}
                <div className="bg-[#0a0a0a] border border-[#333] p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Droplets size={16} className="text-cyan-400" />
                        <span className="text-[10px] font-bold text-[#888] uppercase">Water</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="20"
                            step="0.5"
                            placeholder="3.0"
                            value={todayLog.waterLitres || ''}
                            onChange={(e) => logDailyBio(today, { waterLitres: parseFloat(e.target.value) })}
                            className="flex-1 bg-[#111] border border-[#444] px-3 py-2 text-2xl font-mono text-white text-center outline-none focus:border-primary focus:text-primary transition-colors min-h-[44px]"
                            aria-label="Water litres"
                        />
                        <span className="text-xs text-[#666] font-mono">L</span>
                    </div>
                    <span className="text-[9px] text-[#555] font-mono uppercase tracking-wide">Tap to log (0-20)</span>
                </div>
           </div>
      </div>

      {/* Volume Warnings */}
      {volumeWarnings.length > 0 && (
          <div className="bg-[#111] border border-orange-500/30 p-4">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle size={14} /> Volume Alerts
              </h3>
              <div className="space-y-2">
                  {volumeWarnings.map(({ muscleGroup, warning }) => (
                      <div key={muscleGroup} className="bg-[#0a0a0a] border border-orange-500/20 p-3 flex justify-between items-center">
                          <div>
                              <div className="text-sm font-bold text-white uppercase">{muscleGroup}</div>
                              <div className="text-[10px] text-orange-400 font-mono mt-1">
                                  {Math.round(warning!.sets)} sets this week
                              </div>
                          </div>
                          <div className="text-[10px] text-orange-400 font-bold uppercase text-right">
                              {warning!.sets >= 22 ? 'DELOAD NEXT' : 'AT LIMIT'}
                          </div>
                      </div>
                  ))}
              </div>
              <p className="text-[9px] text-[#666] font-mono uppercase mt-3">
                  Reduce volume to prevent overtraining and injury
              </p>
          </div>
      )}

      {/* Strength Score Widget */}
      <StrengthScore
          personalRecords={settings.personalRecords}
          bodyweight={settings.bodyweight}
          gender={settings.gender}
      />

      {/* Active Workout Banner */}
      {activeWorkout ? (
        <div 
          onClick={() => navigate('/workout')}
          className="bg-[#111] border border-primary p-0 overflow-hidden cursor-pointer hover:bg-[#1a1a1a] transition-colors group relative"
        >
          {/* Rest Timer Override Style */}
          {restTimerStart && (
              <div className="absolute top-0 left-0 bottom-0 bg-primary/20 w-full animate-pulse z-0"></div>
          )}
          
          <div className="absolute top-0 left-0 bottom-0 bg-primary/5 w-1/3 skew-x-[-10deg] -ml-4"></div>

          <div className="p-5 flex justify-between items-center relative z-10">
            <div>
                {restTimerStart ? (
                     <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"/>
                        <h3 className="font-bold text-primary uppercase text-sm tracking-wider">Resting...</h3>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                        <h3 className="font-bold text-green-500 uppercase text-sm tracking-wider">Session Active</h3>
                    </div>
                )}
                
                {restTimerStart ? (
                    <p className="volt-header text-4xl text-white font-mono">{formatTime(restTimeLeft)}</p>
                ) : (
                    <p className="volt-header text-xl text-white mb-1">{activeWorkout.name}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs font-mono text-[#888] mt-1">
                    <span className="flex items-center gap-1"><Clock size={12}/> {formatTime(elapsedTime)}</span>
                    {!restTimerStart && (
                         <span className="flex items-center gap-1 text-white"><Play size={12} fill="currentColor"/> Up Next: {getNextExerciseName()}</span>
                    )}
                </div>
            </div>
            
            {restTimerStart ? (
                 <div className="w-12 h-12 bg-black border border-primary text-primary flex items-center justify-center rounded-full">
                     <Timer size={24} />
                 </div>
            ) : (
                <div className="w-12 h-12 bg-primary flex items-center justify-center text-black group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(204,255,0,0.4)]">
                    <ChevronRight size={24} strokeWidth={3} />
                </div>
            )}
          </div>
        </div>
      ) : (
          <div
            onClick={currentProgramDetails ? handleStartProgramSession : () => navigate('/lift')}
            className={`relative overflow-hidden border-2 p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${currentProgramDetails ? 'border-primary bg-primary/10 hover:bg-primary/15 shadow-[0_0_20px_rgba(204,255,0,0.2)]' : 'border-primary/30 bg-[#111] hover:bg-[#1a1a1a] hover:border-primary/50'}`}
          >
              {/* Diagonal accent stripe */}
              <div className="absolute top-0 left-0 bottom-0 bg-primary/5 w-1/4 skew-x-[-15deg] -ml-8"></div>

              <div className="relative z-10">
                  <div className={`mb-4 ${currentProgramDetails ? 'text-primary' : 'text-primary/70 group-hover:text-primary'} transition-colors`}>
                      <Dumbbell size={48} strokeWidth={2} />
                  </div>

                  <h3 className={`volt-header text-2xl mb-2 ${currentProgramDetails ? 'text-primary' : 'text-white'}`}>
                      {currentProgramDetails ? `Start Week ${currentProgramDetails.week} Day ${currentProgramDetails.day}` : 'Ready to Dominate?'}
                  </h3>

                  <p className={`text-xs font-mono uppercase tracking-wide mb-3 ${currentProgramDetails ? 'text-white' : 'text-[#888]'}`}>
                      {currentProgramDetails ? `Up Next: ${currentProgramDetails.nextTemplate?.name}` : 'Tap to select your protocol'}
                  </p>

                  {/* Action indicator */}
                  <div className={`flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest ${currentProgramDetails ? 'text-primary' : 'text-primary/50 group-hover:text-primary'} transition-colors`}>
                      <Play size={12} fill="currentColor" />
                      <span>{currentProgramDetails ? 'Start Session' : 'Go to Lift Hub'}</span>
                      <ChevronRight size={12} strokeWidth={3} />
                  </div>
              </div>
          </div>
      )}

      {/* Recent Activity Mini-Feed */}
      <section>
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-[#666] uppercase tracking-widest">Recent Logs</h2>
              {history.length > 3 && (
                  <button
                      onClick={() => navigate('/history')}
                      className="text-[10px] text-primary font-mono uppercase tracking-wider hover:underline"
                  >
                      View All ({history.length})
                  </button>
              )}
          </div>
          {history.length === 0 ? (
              <EmptyState
                  icon={Dumbbell}
                  title="ZERO SESSIONS LOGGED"
                  description="DESTROY YOUR FIRST WORKOUT. BUILD YOUR LEGACY. TRACK EVERY REP."
                  actionLabel="DOMINATE NOW"
                  onAction={() => navigate('/lift')}
              />
          ) : (
              <div className="space-y-2">
                  {history.slice(0, 3).map(h => {
                      const duration = h.endTime ? Math.floor((h.endTime - h.startTime) / 1000 / 60) : 0;
                      const date = new Date(h.startTime);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const dateStr = isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                          <div
                              key={h.id}
                              className="bg-[#111] border border-[#222] p-4 flex justify-between items-center hover:bg-[#1a1a1a] hover:border-[#333] transition-colors cursor-pointer group"
                              onClick={() => navigate('/history')}
                          >
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                      <div className="font-bold text-white uppercase italic group-hover:text-primary transition-colors">{h.name}</div>
                                      {h.status === 'completed' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-[#666] font-mono uppercase">
                                      <span className={isToday ? 'text-primary' : ''}>{dateStr}</span>
                                      {duration > 0 && (
                                          <>
                                              <span>•</span>
                                              <span>{duration} min</span>
                                          </>
                                      )}
                                      <span>•</span>
                                      <span>{h.logs.length} exercises</span>
                                  </div>
                              </div>
                              <ChevronRight size={16} className="text-[#444] group-hover:text-primary transition-colors" strokeWidth={2} />
                          </div>
                      );
                  })}
              </div>
          )}
      </section>

      {/* Daily Wellness Check-in Modal */}
      <DailyWellnessCheckin
        isOpen={showWellnessCheckin}
        onClose={() => setShowWellnessCheckin(false)}
        onComplete={() => setShowWellnessCheckin(false)}
      />

    </div>
  );
};

const StatCard = ({ icon, value, label, color }: { icon: React.ReactNode, value: number | string, label: string, color: string }) => (
  <div className="bg-[#111] p-4 border border-[#222] flex flex-col items-center justify-center text-center">
    <div className={`mb-3 ${color}`}>{icon}</div>
    <span className="text-3xl font-black italic text-white leading-none">{value}</span>
    <span className="text-[10px] font-bold text-[#666] uppercase mt-1 tracking-widest">{label}</span>
  </div>
);

export default Dashboard;
