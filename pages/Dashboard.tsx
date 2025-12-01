
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Activity, Flame, ChevronRight, Play, Clock, BarChart2, Timer, Brain, Calendar, Cloud, Moon, Droplets } from 'lucide-react';
import { getWorkoutMotivation } from '../services/geminiService';
import { EXERCISE_LIBRARY } from '../constants';

const Dashboard = () => {
  const { settings, history, activeWorkout, restTimerStart, restDuration, stopRestTimer, getFatigueStatus, programs, templates, startWorkout, syncStatus, logDailyBio, dailyLogs } = useStore();
  const navigate = useNavigate();
  const [motivation, setMotivation] = useState("LOADING PROTOCOL...");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTimeLeft, setRestTimeLeft] = useState(0);

  const workoutsThisWeek = history.filter(h => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return h.startTime > oneWeekAgo && h.status === 'completed';
  }).length;

  const fatigue = getFatigueStatus();
  
  // Daily Log Logic
  const today = new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs[today] || { date: today };

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

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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
      {/* Header */}
      <header className="flex justify-between items-start pt-4">
        <div>
          <h1 className="text-4xl volt-header leading-none text-white">
            HELLO <br/> <span className="text-primary">{settings.name}</span>
          </h1>
          <p className="text-xs text-textMuted font-mono uppercase mt-2 tracking-widest">{motivation}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <div className="w-12 h-12 bg-[#222] flex items-center justify-center text-primary font-black text-xl italic border border-[#333]">
            {settings.name.charAt(0)}
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
      <div className="grid grid-cols-4 gap-2">
        <StatCard icon={<Flame size={18} />} value={workoutsThisWeek} label="SESSIONS" color="text-primary" />
        <StatCard icon={<Activity size={18} />} value={history.length} label="TOTAL" color="text-white" />
        <StatCard icon={<TrendingUp size={18} />} value={`${settings.goal.targetPerWeek}`} label="TARGET" color="text-white" />
        <button 
            onClick={() => navigate('/analytics')}
            className="bg-[#111] p-2 border border-[#333] flex flex-col items-center justify-center text-center hover:bg-[#222] transition-colors"
        >
            <div className="mb-2 text-[#666]"><BarChart2 size={18} /></div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Charts</span>
        </button>
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
                      <div className="text-[#444] font-bold text-sm uppercase">No Active Program</div>
                      <button onClick={() => navigate('/lift')} className="text-[10px] text-primary underline font-mono uppercase mt-1">Select Program</button>
                  </div>
              )}
          </div>
      </div>

      {/* Bio-Feedback / Recovery Protocol */}
      <div className="bg-[#111] border border-[#222] p-4">
           <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity size={14} /> Recovery Protocol
           </h3>
           <div className="flex gap-4">
                <div className="flex-1 bg-[#0a0a0a] border border-[#333] p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Moon size={16} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-[#888] uppercase">Sleep</span>
                    </div>
                    <input 
                        type="number" 
                        placeholder="--"
                        value={todayLog.sleepHours || ''}
                        onChange={(e) => logDailyBio(today, { sleepHours: parseFloat(e.target.value) })}
                        className="w-12 bg-transparent text-right font-mono text-white outline-none focus:text-primary"
                    />
                    <span className="text-[10px] text-[#444]">HRS</span>
                </div>
                <div className="flex-1 bg-[#0a0a0a] border border-[#333] p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Droplets size={16} className="text-cyan-400" />
                        <span className="text-[10px] font-bold text-[#888] uppercase">Water</span>
                    </div>
                     <input 
                        type="number" 
                        placeholder="--"
                        value={todayLog.waterLitres || ''}
                        onChange={(e) => logDailyBio(today, { waterLitres: parseFloat(e.target.value) })}
                        className="w-12 bg-transparent text-right font-mono text-white outline-none focus:text-primary"
                    />
                    <span className="text-[10px] text-[#444]">L</span>
                </div>
           </div>
      </div>

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
            className={`border border-dashed p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${currentProgramDetails ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'border-[#333] hover:border-[#666] hover:bg-[#111]'}`}
          >
              <h3 className={`font-bold uppercase italic text-lg mb-1 ${currentProgramDetails ? 'text-primary' : 'text-white'}`}>
                  {currentProgramDetails ? `Start Week ${currentProgramDetails.week} Day ${currentProgramDetails.day}` : 'Ready to train?'}
              </h3>
              <p className="text-xs text-[#666] font-mono uppercase">
                  {currentProgramDetails ? `Up Next: ${currentProgramDetails.nextTemplate?.name}` : 'Initiate a new protocol in the Lift Hub'}
              </p>
          </div>
      )}

      {/* Recent Activity Mini-Feed */}
      <section>
          <h2 className="text-sm font-bold text-[#666] uppercase tracking-widest mb-4">Recent Logs</h2>
          <div className="space-y-2">
              {history.slice(0, 3).map(h => (
                  <div key={h.id} className="bg-[#0a0a0a] p-4 border-l-2 border-[#222] flex justify-between items-center">
                      <div>
                          <div className="font-bold text-white uppercase italic">{h.name}</div>
                          <div className="text-[10px] text-[#555] font-mono">{new Date(h.startTime).toLocaleDateString()}</div>
                      </div>
                      <div className="text-xs font-bold text-[#444]">{h.logs.length} Exercises</div>
                  </div>
              ))}
              {history.length === 0 && (
                  <div className="text-center py-4 text-[#444] text-xs font-mono uppercase">No history data available.</div>
              )}
          </div>
      </section>

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
