
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Settings, User, BarChart, Zap, Check, Sparkles, Image, RefreshCw, Clock, Cloud, ToggleLeft, ToggleRight, LogOut, Trash2, AlertTriangle, Target, Calendar, Activity, Repeat } from 'lucide-react';
import { EXERCISE_LIBRARY } from '../constants';
import { generateExerciseVisual } from '../services/geminiService';
import NotificationSettings from '../components/NotificationSettings';
import BodyMetricsLogger from '../components/BodyMetricsLogger';
import BodyweightChart from '../components/BodyweightChart';
import ProgressPhotos from '../components/ProgressPhotos';
import MeasurementTrends from '../components/MeasurementTrends';
import BodyLiftCorrelation from '../components/BodyLiftCorrelation';
import { getPeriodizationStatus, generateMesocyclePlan } from '../services/periodization';
import { getRecoveryAssessment } from '../services/adaptiveRecovery';
import { analyzeWeakPoints, suggestExerciseVariations } from '../services/workoutIntelligence';
import { calculateVolumeLandmarks, getVolumeRecommendation } from '../services/volumeOptimization';

const Profile = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, history, customExerciseVisuals, saveExerciseVisual, syncStatus, syncData, resetAllData, dailyLogs } = useStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [batchSize, setBatchSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [showPlateConfig, setShowPlateConfig] = useState(false);
  const [bodyMetricsTab, setBodyMetricsTab] = useState<'logger' | 'trends' | 'photos' | 'correlation'>('logger');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [intelligenceTab, setIntelligenceTab] = useState<'periodization' | 'recovery' | 'weak-points' | 'variations'>('periodization');

  const totalWorkouts = history.length;
  const totalVolume = history.reduce((acc, sess) => {
    let vol = 0;
    sess.logs.forEach(l => l.sets.forEach(s => { if(s.completed) vol += s.weight * s.reps; }));
    return acc + vol;
  }, 0);

  const toggleEquipment = (eq: string) => {
      const current = settings.availableEquipment;
      const updated = current.includes(eq) 
        ? current.filter(i => i !== eq)
        : [...current, eq];
      updateSettings({ availableEquipment: updated });
  };

  const EQUIPMENT_TYPES = ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cable', 'Kettlebell'];

  const exercisesWithoutVisuals = EXERCISE_LIBRARY.filter(ex => !customExerciseVisuals[ex.id]);
  const progressPercent = Math.round((Object.keys(customExerciseVisuals).length / EXERCISE_LIBRARY.length) * 100);

  // Phase 3: Training Intelligence Data
  const dailyLogsArray = useMemo(() => {
    return Object.values(dailyLogs).map(log => ({
      date: new Date(log.date).getTime(),
      sleepHours: log.sleepHours,
      mood: log.mood,
      stressLevel: log.stressLevel,
      energyLevel: log.energyLevel,
      notes: log.notes || '',
      waterLitres: log.waterLitres
    }));
  }, [dailyLogs]);

  const periodizationStatus = useMemo(() => {
    if (history.length < 3) return null;
    return getPeriodizationStatus(history, dailyLogsArray, settings.experienceLevel);
  }, [history, dailyLogsArray, settings.experienceLevel]);

  const mesocyclePlan = useMemo(() => {
    if (!periodizationStatus) return null;
    return generateMesocyclePlan(periodizationStatus, settings.experienceLevel);
  }, [periodizationStatus, settings.experienceLevel]);

  const recoveryAssessment = useMemo(() => {
    if (history.length < 2) return null;
    return getRecoveryAssessment(history, dailyLogsArray, settings.experienceLevel);
  }, [history, dailyLogsArray, settings.experienceLevel]);

  const weakPointAnalysis = useMemo(() => {
    if (history.length < 5) return null;
    return analyzeWeakPoints(history, settings.experienceLevel);
  }, [history, settings.experienceLevel]);

  const exerciseVariations = useMemo(() => {
    if (history.length < 3) return null;
    return suggestExerciseVariations(history, 8);
  }, [history]);

  const handleBatchGenerate = async () => {
      // API Key Check for Paid Model
      const w = window as any;
      if (w.aistudio && w.aistudio.hasSelectedApiKey) {
          const hasKey = await w.aistudio.hasSelectedApiKey();
          if (!hasKey && w.aistudio.openSelectKey) {
              await w.aistudio.openSelectKey();
          }
      }

      setGeneratingBatch(true);
      setGenerationProgress(0);
      let completed = 0;

      for (const ex of exercisesWithoutVisuals) {
          try {
              // Add delay to prevent race conditions and be nice to API
              await new Promise(resolve => setTimeout(resolve, 1000));
              const url = await generateExerciseVisual(ex.name, batchSize);
              if (url) {
                  await saveExerciseVisual(ex.id, url);
              }
          } catch (e) {
              console.error(`Failed to gen for ${ex.name}`, e);
          }
          completed++;
          setGenerationProgress(Math.round((completed / exercisesWithoutVisuals.length) * 100));
      }
      setGeneratingBatch(false);
  };
  
  const toggleIronCloud = () => {
      updateSettings({
          ironCloud: {
              ...settings.ironCloud,
              enabled: !settings.ironCloud?.enabled
          }
      });
  };

  const handleResetAllData = () => {
      resetAllData();
      setShowResetConfirm(false);
  };

  return (
    <div className="p-6 pb-20">
      <h1 className="text-4xl volt-header mb-8">ATHLETE ID</h1>

      <div className="flex items-center gap-6 mb-10 border-b border-[#222] pb-8">
        <div className="w-24 h-24 bg-primary flex items-center justify-center text-5xl font-black italic text-black">
          {(settings.name || 'A').charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight text-white">{settings.name || 'Athlete'}</h2>
          <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-[#222] text-[#888] text-[10px] font-mono uppercase">{settings.goal?.type || 'Training'}</span>
          </div>
        </div>
      </div>

      {/* Account Section */}
      {isAuthenticated && user && (
        <section className="mb-10">
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Account</h3>
          <div className="bg-[#111] border border-[#222] divide-y divide-[#222]">
            <div className="p-5 flex justify-between items-center">
              <div>
                <span className="font-bold uppercase text-sm">Email</span>
                <p className="text-xs text-[#666] font-mono mt-1">{user.email}</p>
              </div>
            </div>
            <div className="p-5 flex justify-between items-center">
              <span className="font-bold uppercase text-sm">User ID</span>
              <span className="text-xs text-[#666] font-mono">{user.id.substring(0, 12)}...</span>
            </div>
            <div className="p-5">
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="w-full py-4 bg-red-900/20 border border-red-900/50 hover:border-red-500 text-red-400 hover:text-red-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mb-10">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Performance Data</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111] p-6 border border-[#222]">
            <Zap className="text-primary mb-2" size={24} fill="currentColor" />
            <div className="text-4xl font-black italic text-white leading-none">{totalWorkouts}</div>
            <div className="text-[10px] text-[#666] uppercase tracking-widest mt-1">Sessions Complete</div>
          </div>
          <div className="bg-[#111] p-6 border border-[#222]">
            <div className="text-primary mb-2 font-black italic text-xl">{(settings.units || 'lbs').toUpperCase()}</div>
            <div className="text-4xl font-black italic text-white leading-none">{(totalVolume / 1000).toFixed(0)}K</div>
            <div className="text-[10px] text-[#666] uppercase tracking-widest mt-1">Total Volume</div>
          </div>
        </div>
      </section>

      {/* Body Metrics Section */}
      <section className="mb-10">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Body Metrics</h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setBodyMetricsTab('logger')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              bodyMetricsTab === 'logger'
                ? 'bg-primary text-black'
                : 'bg-[#111] text-[#666] border border-[#222] hover:text-white'
            }`}
          >
            Logger
          </button>
          <button
            onClick={() => setBodyMetricsTab('trends')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              bodyMetricsTab === 'trends'
                ? 'bg-primary text-black'
                : 'bg-[#111] text-[#666] border border-[#222] hover:text-white'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setBodyMetricsTab('photos')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              bodyMetricsTab === 'photos'
                ? 'bg-primary text-black'
                : 'bg-[#111] text-[#666] border border-[#222] hover:text-white'
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => setBodyMetricsTab('correlation')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              bodyMetricsTab === 'correlation'
                ? 'bg-primary text-black'
                : 'bg-[#111] text-[#666] border border-[#222] hover:text-white'
            }`}
          >
            Correlation
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {bodyMetricsTab === 'logger' && (
            <>
              <BodyweightChart days={30} />
              <BodyMetricsLogger />
            </>
          )}
          {bodyMetricsTab === 'trends' && <MeasurementTrends />}
          {bodyMetricsTab === 'photos' && <ProgressPhotos />}
          {bodyMetricsTab === 'correlation' && <BodyLiftCorrelation />}
        </div>
      </section>

      {/* Phase 3: Training Intelligence Section */}
      {(periodizationStatus || recoveryAssessment || weakPointAnalysis || exerciseVariations) && (
        <section className="mb-10">
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Training Intelligence</h3>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            <button
              onClick={() => setIntelligenceTab('periodization')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                intelligenceTab === 'periodization'
                  ? 'bg-primary text-black'
                  : 'bg-[#111] text-[#666] border border-[#222] hover:text-white'
              }`}
            >
              Periodization
            </button>
            <button
              onClick={() => setIntelligenceTab('recovery')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                intelligenceTab === 'recovery'
                  ? 'bg-primary text-black'
                  : 'bg-[#111] text-[#666] border border-[#222] hover:text-white'
              }`}
            >
              Recovery
            </button>
            <button
              onClick={() => setIntelligenceTab('weak-points')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                intelligenceTab === 'weak-points'
                  ? 'bg-primary text-black'
                  : 'bg-[#111] text-[#666] border border-[#222] hover:text-white'
              }`}
            >
              Weak Points
            </button>
            <button
              onClick={() => setIntelligenceTab('variations')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                intelligenceTab === 'variations'
                  ? 'bg-primary text-black'
                  : 'bg-[#111] text-[#666] border border-[#222] hover:text-white'
              }`}
            >
              Variations
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {/* Periodization Tab */}
            {intelligenceTab === 'periodization' && periodizationStatus && mesocyclePlan && (
              <>
                {/* Current Status */}
                <div className="bg-[#111] border border-[#222] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Repeat size={18} className="text-primary" />
                    <h4 className="text-sm font-bold uppercase text-white">Current Cycle Status</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-[#666] uppercase mb-1">Phase</div>
                      <div className="text-2xl font-black uppercase italic" style={{
                        color: periodizationStatus.currentPhase === 'accumulation' ? '#4ade80' :
                               periodizationStatus.currentPhase === 'intensification' ? '#f59e0b' :
                               periodizationStatus.currentPhase === 'deload' ? '#60a5fa' : '#888'
                      }}>
                        {periodizationStatus.currentPhase}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#666] uppercase mb-1">Days Until Deload</div>
                      <div className={`text-2xl font-black italic ${periodizationStatus.daysUntilDeload <= 3 ? 'text-orange-400' : 'text-white'}`}>
                        {periodizationStatus.daysUntilDeload}
                      </div>
                    </div>
                  </div>

                  {periodizationStatus.needsDeload && (
                    <div className="mt-4 bg-orange-500/10 border border-orange-500/30 p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-orange-400" />
                        <span className="text-xs text-orange-400 font-bold uppercase">Deload Week Recommended</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mesocycle Plan */}
                <div className="bg-[#111] border border-[#222] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-primary" />
                    <h4 className="text-sm font-bold uppercase text-white">Current {mesocyclePlan.durationWeeks} Week Block</h4>
                  </div>

                  <div className="bg-[#0a0a0a] border border-[#333] p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-bold uppercase" style={{
                        color: mesocyclePlan.phase === 'accumulation' ? '#4ade80' :
                               mesocyclePlan.phase === 'intensification' ? '#f59e0b' :
                               mesocyclePlan.phase === 'deload' ? '#60a5fa' : '#888'
                      }}>
                        {mesocyclePlan.phase}
                      </div>
                      <div className="text-[10px] text-[#666] font-mono">
                        {mesocyclePlan.durationWeeks} weeks
                      </div>
                    </div>
                    <div className="text-[10px] text-[#888] font-mono leading-relaxed mb-3">
                      {mesocyclePlan.focus}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-black border border-[#222] p-2">
                        <div className="text-[9px] text-[#666] uppercase mb-1">Volume</div>
                        <div className="text-xs font-bold text-white uppercase">{mesocyclePlan.volumeProgression}</div>
                      </div>
                      <div className="bg-black border border-[#222] p-2">
                        <div className="text-[9px] text-[#666] uppercase mb-1">Intensity</div>
                        <div className="text-xs font-bold text-white uppercase">{mesocyclePlan.intensityProgression}</div>
                      </div>
                    </div>
                    {mesocyclePlan.deloadScheduled && (
                      <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30">
                        <span className="text-xs font-bold uppercase text-blue-400">Deload Scheduled</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Recovery Tab */}
            {intelligenceTab === 'recovery' && recoveryAssessment && (
              <>
                {/* Overall Recovery Score */}
                <div className="bg-[#111] border border-[#222] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-primary" />
                    <h4 className="text-sm font-bold uppercase text-white">Recovery Status</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-[10px] text-[#666] uppercase mb-1">Recovery Score</div>
                      <div className={`text-3xl font-black italic ${recoveryAssessment.overallRecoveryScore >= 70 ? 'text-green-500' : recoveryAssessment.overallRecoveryScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {recoveryAssessment.overallRecoveryScore}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#666] uppercase mb-1">Sleep Debt</div>
                      <div className={`text-3xl font-black italic ${recoveryAssessment.sleepDebt > 5 ? 'text-red-500' : 'text-white'}`}>
                        {recoveryAssessment.sleepDebt.toFixed(1)}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#666] uppercase mb-1">Training Stress</div>
                      <div className={`text-3xl font-black italic ${recoveryAssessment.trainingStress > 75 ? 'text-orange-400' : 'text-white'}`}>
                        {recoveryAssessment.trainingStress}
                      </div>
                    </div>
                  </div>

                  <div className={`text-center p-3 border ${recoveryAssessment.readyToTrain ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                    <span className={`text-sm font-bold uppercase ${recoveryAssessment.readyToTrain ? 'text-green-400' : 'text-red-400'}`}>
                      {recoveryAssessment.readyToTrain ? '✓ Ready to Train' : '⚠ Need More Recovery'}
                    </span>
                  </div>
                </div>

                {/* Recovery Recommendations */}
                <div className="bg-[#111] border border-[#222] p-6">
                  <h4 className="text-xs font-bold uppercase text-[#666] mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    {recoveryAssessment.recommendations.slice(0, 5).map((rec, idx) => (
                      <div key={idx} className="bg-[#0a0a0a] border border-[#333] p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${rec.priority === 'critical' ? 'bg-red-500' : rec.priority === 'high' ? 'bg-orange-400' : rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                          <div className="flex-1">
                            <div className="text-sm font-bold text-white uppercase mb-1">{rec.title}</div>
                            <div className="text-[10px] text-[#888] font-mono mb-2">{rec.description}</div>
                            <ul className="space-y-1">
                              {rec.actionItems.map((item, i) => (
                                <li key={i} className="text-[10px] text-[#666] font-mono flex items-start gap-2">
                                  <span className="text-primary">→</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Weak Points Tab */}
            {intelligenceTab === 'weak-points' && weakPointAnalysis && (
              <>
                {/* Overall Balance Score */}
                <div className="bg-[#111] border border-[#222] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target size={18} className="text-primary" />
                    <h4 className="text-sm font-bold uppercase text-white">Training Balance</h4>
                  </div>

                  <div className="text-center mb-4">
                    <div className={`text-5xl font-black italic ${weakPointAnalysis.overallBalance >= 80 ? 'text-green-500' : weakPointAnalysis.overallBalance >= 60 ? 'text-yellow-500' : 'text-orange-400'}`}>
                      {weakPointAnalysis.overallBalance}
                    </div>
                    <div className="text-[10px] text-[#666] uppercase mt-1">Balance Score</div>
                  </div>

                  {weakPointAnalysis.priorityAreas.length > 0 && (
                    <div className="bg-[#0a0a0a] border border-[#333] p-3">
                      <div className="text-[10px] text-[#888] uppercase mb-2">Priority Areas:</div>
                      <div className="flex flex-wrap gap-2">
                        {weakPointAnalysis.priorityAreas.map(area => (
                          <span key={area} className="px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Weak Points List */}
                <div className="bg-[#111] border border-[#222] p-6">
                  <h4 className="text-xs font-bold uppercase text-[#666] mb-3">Detected Weak Points</h4>
                  {weakPointAnalysis.weakPoints.length === 0 ? (
                    <div className="text-center p-6 text-[#666]">
                      <Check size={24} className="mx-auto mb-2 text-green-500" />
                      <div className="text-sm uppercase">No Weak Points Detected!</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {weakPointAnalysis.weakPoints.slice(0, 10).map((wp, idx) => (
                        <div key={idx} className="bg-[#0a0a0a] border border-[#333] p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${wp.severity === 'severe' ? 'bg-red-500' : wp.severity === 'moderate' ? 'bg-orange-400' : 'bg-yellow-500'}`} />
                            <div className="flex-1">
                              <div className="text-sm font-bold text-white uppercase mb-1">{wp.description}</div>
                              <ul className="space-y-1">
                                {wp.recommendations.map((rec, i) => (
                                  <li key={i} className="text-[10px] text-[#666] font-mono flex items-start gap-2">
                                    <span className="text-primary">→</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Variations Tab */}
            {intelligenceTab === 'variations' && exerciseVariations && (
              <div className="bg-[#111] border border-[#222] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Repeat size={18} className="text-primary" />
                  <h4 className="text-sm font-bold uppercase text-white">Suggested Variations</h4>
                </div>

                {exerciseVariations.length === 0 ? (
                  <div className="text-center p-6 text-[#666]">
                    <Check size={24} className="mx-auto mb-2 text-green-500" />
                    <div className="text-sm uppercase">Exercise Selection Looks Good!</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exerciseVariations.slice(0, 8).map((variation, idx) => (
                      <div key={idx} className="bg-[#0a0a0a] border border-[#333] p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-sm font-bold text-white uppercase">
                              {variation.currentExercise.name}
                            </div>
                            <div className="text-[10px] text-[#666] font-mono mt-1">
                              {variation.weeksSinceVariation} weeks • {variation.isPlateaued ? 'Plateaued' : 'Due for change'}
                            </div>
                          </div>
                          {variation.isPlateaued && (
                            <span className="px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-bold uppercase">
                              Stalled
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 my-3">
                          <div className="h-px flex-1 bg-[#333]" />
                          <span className="text-[10px] text-primary font-mono">→</span>
                          <div className="h-px flex-1 bg-[#333]" />
                        </div>

                        <div className="mb-2">
                          <div className="text-sm font-bold text-primary uppercase">
                            {variation.suggestedVariation.name}
                          </div>
                        </div>

                        <div className="text-[10px] text-[#888] font-mono leading-relaxed">
                          {variation.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* VoltCloud Sync Section */}
      <section className="mb-10">
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">VoltCloud Network</h3>
          <div className="bg-[#111] border border-[#222] p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5">
                   <Cloud size={120} />
               </div>
               
               <div className="flex justify-between items-center mb-6 relative z-10">
                   <div>
                       <div className="text-lg font-black italic uppercase text-white flex items-center gap-2">
                           <Cloud size={20} className={settings.ironCloud?.enabled ? 'text-primary' : 'text-[#666]'} />
                           Sync Status
                       </div>
                       <p className="text-xs text-[#666] font-mono mt-1 uppercase">
                           {settings.ironCloud?.enabled ? (syncStatus === 'synced' ? 'All Systems Operational' : 'Syncing Data...') : 'Local Storage Only'}
                       </p>
                   </div>
                   <button onClick={toggleIronCloud} className="text-white hover:text-primary transition-colors">
                       {settings.ironCloud?.enabled ? <ToggleRight size={32} className="text-primary"/> : <ToggleLeft size={32} className="text-[#444]" />}
                   </button>
               </div>
               
               {settings.ironCloud?.enabled && (
                   <div className="relative z-10">
                       <div className="flex justify-between items-center text-xs font-bold uppercase text-[#888] mb-4 border-t border-[#222] pt-4">
                           <span>Last Sync</span>
                           <span>{settings.ironCloud.lastSync ? new Date(settings.ironCloud.lastSync).toLocaleTimeString() : 'Never'}</span>
                       </div>
                       <button 
                         onClick={() => syncData()} 
                         className="w-full py-3 border border-[#333] hover:border-primary text-xs font-bold uppercase tracking-widest text-white hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                           <RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} /> Force Sync
                       </button>
                   </div>
               )}
          </div>
      </section>

      <section className="mb-10">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Visual Database</h3>
        <div className="bg-[#111] border border-[#222] p-6">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <div className="flex items-center gap-2 text-white font-bold uppercase italic text-lg mb-1">
                        <Image size={18} />
                        Assets Status
                    </div>
                    <p className="text-xs text-[#666] font-mono">
                        {exercisesWithoutVisuals.length} MISSING CUSTOM VISUALS
                    </p>
                </div>
                <div className="text-3xl font-black italic text-primary">{progressPercent}%</div>
            </div>
            
            <div className="flex justify-end mb-2">
                <select 
                    value={batchSize} 
                    onChange={(e) => setBatchSize(e.target.value as any)}
                    className="bg-[#111] text-[10px] text-white border border-[#333] px-2 py-1 outline-none font-mono uppercase focus:border-primary"
                    disabled={generatingBatch}
                >
                    <option value="1K">1K High Res</option>
                    <option value="2K">2K Ultra Res</option>
                    <option value="4K">4K Max Res</option>
                </select>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-[#222] mb-6 overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${generatingBatch ? generationProgress : progressPercent}%` }}
                />
            </div>

            <button 
                onClick={handleBatchGenerate}
                disabled={generatingBatch || exercisesWithoutVisuals.length === 0}
                className="w-full py-4 bg-[#222] border border-[#333] hover:border-primary text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {generatingBatch ? (
                    <>
                        <RefreshCw size={16} className="animate-spin text-primary" />
                        Generating Assets... {generationProgress}%
                    </>
                ) : (
                    <>
                        <Sparkles size={16} className="text-primary" />
                        Generate Missing Assets
                    </>
                )}
            </button>
            <p className="text-[10px] text-[#444] mt-2 text-center uppercase">Requires Paid API Key for High Res</p>
        </div>
      </section>

      <section className="mb-10">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">System Config</h3>
        <div className="bg-[#111] border border-[#222] divide-y divide-[#222]">
          <div className="p-5 flex justify-between items-center">
            <span className="font-bold uppercase text-sm">Codename</span>
            <input 
              className="bg-transparent text-right outline-none text-[#888] focus:text-primary uppercase font-mono"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
            />
          </div>
          <div className="p-5 flex justify-between items-center">
            <span className="font-bold uppercase text-sm">Units</span>
            <div className="flex bg-[#222] p-1">
              <button 
                onClick={() => updateSettings({ units: 'lbs' })}
                className={`px-4 py-1 text-xs font-bold uppercase ${settings.units === 'lbs' ? 'bg-primary text-black' : 'text-[#666]'}`}
              >
                LBS
              </button>
              <button 
                onClick={() => updateSettings({ units: 'kg' })}
                className={`px-4 py-1 text-xs font-bold uppercase ${settings.units === 'kg' ? 'bg-primary text-black' : 'text-[#666]'}`}
              >
                KG
              </button>
            </div>
          </div>
          <div className="p-5 flex justify-between items-center">
            <span className="font-bold uppercase text-sm">Bar Weight</span>
            <div className="flex bg-[#222] p-1">
              <button
                onClick={() => updateSettings({ barWeight: settings.units === 'kg' ? 20 : 45 })}
                className={`px-3 py-1 text-xs font-bold uppercase ${settings.barWeight === (settings.units === 'kg' ? 20 : 45) ? 'bg-primary text-black' : 'text-[#666]'}`}
              >
                {settings.units === 'kg' ? '20KG' : '45LBS'}
              </button>
              <button
                onClick={() => updateSettings({ barWeight: settings.units === 'kg' ? 15 : 35 })}
                className={`px-3 py-1 text-xs font-bold uppercase ${settings.barWeight === (settings.units === 'kg' ? 15 : 35) ? 'bg-primary text-black' : 'text-[#666]'}`}
              >
                {settings.units === 'kg' ? '15KG' : '35LBS'}
              </button>
            </div>
          </div>

          {/* Available Plates Section */}
          <div className="p-5 border-t border-[#222]">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold uppercase text-sm">Available Plates</span>
              <button
                onClick={() => setShowPlateConfig(!showPlateConfig)}
                className="text-[10px] text-primary font-mono uppercase hover:text-white transition-colors"
              >
                {showPlateConfig ? 'Hide' : 'Configure'}
              </button>
            </div>
            {showPlateConfig && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {(settings.units === 'kg'
                  ? [25, 20, 15, 10, 5, 2.5, 1.25]
                  : [45, 35, 25, 10, 5, 2.5]
                ).map(plate => {
                  const currentPlates = settings.availablePlates?.[settings.units] || [];
                  const isChecked = currentPlates.length === 0 || currentPlates.includes(plate);
                  return (
                    <label
                      key={plate}
                      className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors ${
                        isChecked ? 'border-primary bg-primary/10' : 'border-[#333] bg-black'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const defaultPlates = settings.units === 'kg'
                            ? [25, 20, 15, 10, 5, 2.5, 1.25]
                            : [45, 35, 25, 10, 5, 2.5];

                          let newPlates: number[];
                          if (currentPlates.length === 0) {
                            // First time configuring, start with defaults minus this plate
                            newPlates = e.target.checked ? defaultPlates : defaultPlates.filter(p => p !== plate);
                          } else {
                            // Toggle plate in existing configuration
                            newPlates = e.target.checked
                              ? [...currentPlates, plate].sort((a, b) => b - a)
                              : currentPlates.filter(p => p !== plate);
                          }

                          updateSettings({
                            availablePlates: {
                              ...settings.availablePlates,
                              [settings.units]: newPlates
                            }
                          });
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm font-mono text-white">{plate} {settings.units}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-[#444] font-mono mt-2">
              Select plates available in your gym. Calculator will only use checked plates.
            </p>
          </div>

          <div className="p-5 flex justify-between items-center">
             <span className="font-bold uppercase text-sm">Rest Timer (Default)</span>
             <select
              value={settings.defaultRestTimer || 90}
              onChange={(e) => updateSettings({ defaultRestTimer: parseInt(e.target.value) })}
              className="bg-[#222] text-white font-mono rounded-none px-2 py-1 outline-none text-sm uppercase"
             >
               <option value="30">30 Seconds</option>
               <option value="60">60 Seconds</option>
               <option value="90">90 Seconds</option>
               <option value="120">2 Minutes</option>
               <option value="180">3 Minutes</option>
               <option value="300">5 Minutes</option>
             </select>
          </div>
          <div className="p-5 flex justify-between items-center">
             <span className="font-bold uppercase text-sm">Frequency</span>
             <select
              value={settings.goal.targetPerWeek}
              onChange={(e) => updateSettings({ goal: { ...settings.goal, targetPerWeek: parseInt(e.target.value) } })}
              className="bg-[#222] text-white font-mono rounded-none px-2 py-1 outline-none text-sm uppercase"
             >
               <option value="2">2 Days</option>
               <option value="3">3 Days</option>
               <option value="4">4 Days</option>
               <option value="5">5 Days</option>
               <option value="6">6 Days</option>
             </select>
          </div>
          <div className="p-5 flex justify-between items-center">
            <span className="font-bold uppercase text-sm">Bodyweight</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min="50"
                max="500"
                step="0.5"
                placeholder={settings.units === 'kg' ? '80' : '180'}
                value={settings.bodyweight || ''}
                onChange={(e) => updateSettings({ bodyweight: parseFloat(e.target.value) || undefined })}
                className="bg-[#222] text-white font-mono text-right px-3 py-1 outline-none text-sm uppercase w-20 focus:border focus:border-primary"
              />
              <span className="text-xs text-[#666] font-mono">{(settings.units || 'lbs').toUpperCase()}</span>
            </div>
          </div>
          <div className="p-5 flex justify-between items-center">
            <span className="font-bold uppercase text-sm">Gender</span>
            <div className="flex bg-[#222] p-1">
              <button
                onClick={() => updateSettings({ gender: 'male' })}
                className={`px-4 py-1 text-xs font-bold uppercase ${settings.gender === 'male' ? 'bg-primary text-black' : 'text-[#666]'}`}
              >
                Male
              </button>
              <button
                onClick={() => updateSettings({ gender: 'female' })}
                className={`px-4 py-1 text-xs font-bold uppercase ${settings.gender === 'female' ? 'bg-primary text-black' : 'text-[#666]'}`}
              >
                Female
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Gym Inventory</h3>
          <div className="bg-[#111] border border-[#222] p-5">
              <div className="grid grid-cols-2 gap-3">
                  {EQUIPMENT_TYPES.map(eq => (
                      <button
                        key={eq}
                        onClick={() => toggleEquipment(eq)}
                        className={`p-3 border text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${
                            settings.availableEquipment.includes(eq)
                            ? 'border-primary text-white bg-primary/10'
                            : 'border-[#333] text-[#666] hover:bg-[#1a1a1a]'
                        }`}
                      >
                          {eq}
                          {settings.availableEquipment.includes(eq) && <Check size={14} className="text-primary" />}
                      </button>
                  ))}
              </div>
          </div>
      </section>

      {/* Notification Settings Section */}
      <section className="mt-10">
          <NotificationSettings />
      </section>

      {/* Danger Zone */}
      <section className="mt-10 mb-10">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Danger Zone</h3>
        <div className="bg-[#111] border border-red-900/30 p-6">
          <div className="flex items-start gap-4 mb-4">
            <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase text-white mb-2">Reset All Data</h4>
              <p className="text-xs text-[#888] mb-3">
                Permanently delete all workout history, templates, body metrics, photos, and progress data.
                This action cannot be undone. Your account and basic settings will be preserved.
              </p>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 bg-red-900/20 border border-red-900 text-red-500 font-bold uppercase text-xs hover:bg-red-900/40 transition-colors flex items-center gap-2"
              >
                <Trash2 size={14} />
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] border-2 border-red-900 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-red-900/30 bg-red-900/10">
              <AlertTriangle size={32} className="text-red-500" />
              <div>
                <h3 className="text-lg font-black uppercase text-white">CONFIRM RESET</h3>
                <p className="text-xs text-red-400">This action cannot be undone</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-white mb-4">
                Are you absolutely sure you want to reset all data? This will permanently delete:
              </p>
              <ul className="space-y-2 mb-6 text-xs text-[#888]">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  All workout history and logs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Personal records and strength scores
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Body measurements and progress photos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Custom templates and programs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  All daily logs and biometric data
                </li>
              </ul>
              <p className="text-xs text-primary mb-6">
                Your account, email, and basic settings will be preserved.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 bg-[#222] text-white font-bold uppercase text-xs border border-[#333] hover:bg-[#333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetAllData}
                  className="flex-1 py-3 bg-red-900 text-white font-bold uppercase text-xs hover:bg-red-800 transition-colors"
                >
                  Reset Everything
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-[10px] text-[#333] font-mono uppercase">VoltLift Sys v1.0.4</p>
      </div>
    </div>
  );
};

export default Profile;
