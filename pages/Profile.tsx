
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Settings, User, BarChart, Zap, Check, Sparkles, Image, RefreshCw, Clock, Cloud, ToggleLeft, ToggleRight } from 'lucide-react';
import { EXERCISE_LIBRARY } from '../constants';
import { generateExerciseVisual } from '../services/geminiService';
import PlateCalculator from '../components/PlateCalculator';
import NotificationSettings from '../components/NotificationSettings';
import BodyMetricsLogger from '../components/BodyMetricsLogger';
import BodyweightChart from '../components/BodyweightChart';

const Profile = () => {
  const { settings, updateSettings, history, customExerciseVisuals, saveExerciseVisual, syncStatus, syncData } = useStore();
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [batchSize, setBatchSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [showPlateConfig, setShowPlateConfig] = useState(false);

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

      <section className="mb-10">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Performance Data</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111] p-6 border border-[#222]">
            <Zap className="text-primary mb-2" size={24} fill="currentColor" />
            <div className="text-4xl font-black italic text-white leading-none">{totalWorkouts}</div>
            <div className="text-[10px] text-[#666] uppercase tracking-widest mt-1">Sessions Complete</div>
          </div>
          <div className="bg-[#111] p-6 border border-[#222]">
            <div className="text-primary mb-2 font-black italic text-xl">{settings.units.toUpperCase()}</div>
            <div className="text-4xl font-black italic text-white leading-none">{(totalVolume / 1000).toFixed(0)}K</div>
            <div className="text-[10px] text-[#666] uppercase tracking-widest mt-1">Total Volume</div>
          </div>
        </div>
      </section>

      {/* Body Metrics Section */}
      <section className="mb-10">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Body Metrics</h3>
        <div className="space-y-4">
          <BodyweightChart days={30} />
          <BodyMetricsLogger />
        </div>
      </section>

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
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min="10"
                max="100"
                step="0.5"
                placeholder={settings.units === 'kg' ? '20' : '45'}
                value={settings.barWeight || ''}
                onChange={(e) => updateSettings({ barWeight: parseFloat(e.target.value) || (settings.units === 'kg' ? 20 : 45) })}
                className="bg-[#222] text-white font-mono text-right px-3 py-1 outline-none text-sm uppercase w-20 focus:border focus:border-primary"
              />
              <span className="text-xs text-[#666] font-mono">{settings.units.toUpperCase()}</span>
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
              <span className="text-xs text-[#666] font-mono">{settings.units.toUpperCase()}</span>
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

      {/* Plate Calculator Section */}
      <section className="mt-10">
          <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Plate Calculator</h3>
          <PlateCalculator units={settings.units} />
      </section>

      <div className="mt-12 text-center">
        <p className="text-[10px] text-[#333] font-mono uppercase">VoltLift Sys v1.0.4</p>
      </div>
    </div>
  );
};

export default Profile;
