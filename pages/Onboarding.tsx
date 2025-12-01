import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Target, TrendingUp, Dumbbell, Heart, Zap, Shield, Crown } from 'lucide-react';
import { Goal } from '../types';

const Onboarding = () => {
  const { completeOnboarding } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Goal['type']>('Build Muscle');
  const [selectedExperience, setSelectedExperience] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');

  const goals: { id: Goal['type'], icon: React.ReactNode, label: string, desc: string }[] = [
    { id: 'Build Muscle', icon: <Dumbbell size={24} />, label: 'HYPERTROPHY', desc: 'Maximize muscle growth' },
    { id: 'Lose Fat', icon: <TrendingUp size={24} className="rotate-180" />, label: 'SHRED', desc: 'Burn fat, maintain muscle' },
    { id: 'Improve Endurance', icon: <Heart size={24} />, label: 'ENGINE', desc: 'Increase work capacity' },
    { id: 'General Fitness', icon: <Target size={24} />, label: 'FOUNDATION', desc: 'Overall health & movement' },
  ];

  const levels: { id: 'Beginner' | 'Intermediate' | 'Advanced', icon: React.ReactNode, label: string, desc: string }[] = [
    { id: 'Beginner', icon: <Shield size={24} />, label: 'ROOKIE', desc: '< 1 Year Experience' },
    { id: 'Intermediate', icon: <Zap size={24} />, label: 'VETERAN', desc: '1-3 Years Experience' },
    { id: 'Advanced', icon: <Crown size={24} />, label: 'ELITE', desc: '3+ Years Experience' },
  ];

  const handleFinish = () => {
    if (!name.trim()) return;
    completeOnboarding(name || 'Athlete', { type: selectedGoal, targetPerWeek: 4 }, selectedExperience);
    navigate('/');
  };

  const getRecommendation = () => {
      if (selectedExperience === 'Beginner') return 'FULL BODY PROTOCOL';
      if (selectedGoal === 'Improve Endurance') return 'HIIT / CIRCUIT A';
      return 'PUSH / PULL / LEGS';
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center animate-fade-in font-sans selection:bg-primary selection:text-black">
      
      {/* Progress Indicators */}
      <div className="flex gap-2 mb-12 w-full max-w-sm justify-center">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-12 bg-primary shadow-[0_0_10px_rgba(204,255,0,0.5)]' : i < step ? 'w-12 bg-[#333]' : 'w-4 bg-[#222]'}`} />
        ))}
      </div>

      <div className="w-full max-w-sm relative min-h-[400px]">
        {/* STEP 1: GOAL */}
        {step === 1 && (
          <div className="animate-slide-in-right absolute inset-0">
            <h1 className="text-5xl volt-header mb-2 text-center leading-[0.85]">
              PRIMARY<br/><span className="text-primary">OBJECTIVE</span>
            </h1>
            <p className="text-[#666] text-center mb-8 font-mono text-xs uppercase tracking-widest">Select your main focus</p>

            <div className="space-y-3">
              {goals.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGoal(g.id)}
                  className={`w-full p-4 border flex items-center gap-4 transition-all text-left group hover:scale-[1.02] active:scale-95 ${selectedGoal === g.id ? 'bg-[#111] border-primary shadow-[0_0_15px_rgba(204,255,0,0.1)]' : 'bg-black border-[#222] hover:border-[#444]'}`}
                >
                  <div className={`${selectedGoal === g.id ? 'text-primary' : 'text-[#444] group-hover:text-white transition-colors'}`}>{g.icon}</div>
                  <div>
                    <div className={`font-black italic uppercase text-lg leading-none ${selectedGoal === g.id ? 'text-white' : 'text-[#888] group-hover:text-[#ccc]'}`}>{g.label}</div>
                    <div className="text-[10px] text-[#555] font-mono uppercase mt-1">{g.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            
            <button onClick={() => setStep(2)} className="w-full mt-8 bg-white text-black py-4 font-black italic uppercase tracking-wider text-lg flex items-center justify-center gap-2 hover:bg-[#ccc] transition-colors">
              Next Phase <ChevronRight size={20} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* STEP 2: EXPERIENCE */}
        {step === 2 && (
          <div className="animate-slide-in-right absolute inset-0">
            <h1 className="text-5xl volt-header mb-2 text-center leading-[0.85]">
              COMBAT<br/><span className="text-white">HISTORY</span>
            </h1>
            <p className="text-[#666] text-center mb-8 font-mono text-xs uppercase tracking-widest">Gauge your experience level</p>

            <div className="space-y-3">
              {levels.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedExperience(l.id)}
                  className={`w-full p-5 border text-left transition-all hover:scale-[1.02] active:scale-95 ${selectedExperience === l.id ? 'bg-[#111] border-primary shadow-[0_0_15px_rgba(204,255,0,0.1)]' : 'bg-black border-[#222] hover:border-[#444]'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                      <div className={`font-black italic uppercase text-2xl ${selectedExperience === l.id ? 'text-white' : 'text-[#888]'}`}>{l.label}</div>
                      <div className={`${selectedExperience === l.id ? 'text-primary' : 'text-[#333]'}`}>{l.icon}</div>
                  </div>
                  <div className="text-[10px] text-[#666] font-mono uppercase">{l.desc}</div>
                </button>
              ))}
            </div>

             <div className="flex gap-4 mt-8">
               <button onClick={() => setStep(1)} className="flex-1 bg-[#111] text-[#666] py-4 font-bold uppercase tracking-wider hover:text-white transition-colors">Back</button>
               <button onClick={() => setStep(3)} className="flex-[2] bg-white text-black py-4 font-black italic uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#ccc] transition-colors">
                 Continue <ChevronRight size={20} strokeWidth={3} />
               </button>
             </div>
          </div>
        )}

        {/* STEP 3: IDENTITY & REVEAL */}
        {step === 3 && (
          <div className="animate-slide-in-right absolute inset-0 text-center">
            <h1 className="text-5xl volt-header mb-6 text-white leading-none">
                SYSTEM<br/><span className="text-primary">READY</span>
            </h1>

            <div className="mb-8">
              <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3 block">Enter Codename</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ATHLETE NAME"
                autoFocus
                className="w-full bg-[#0a0a0a] border-b-2 border-[#333] py-4 px-2 text-2xl font-black italic uppercase text-center text-white focus:border-primary outline-none placeholder-[#333]"
              />
            </div>

            <div className="bg-[#111] border border-[#222] p-6 mb-8 text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Dumbbell size={80} className="rotate-[-15deg]" />
              </div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest border border-primary/30 px-2 py-0.5 rounded-sm">Recommended Protocol</span>
              <h2 className="text-3xl font-black italic uppercase text-white mt-3">{getRecommendation()}</h2>
              <p className="text-xs text-[#888] mt-2 font-mono uppercase">
                Optimized for {selectedExperience} level {selectedGoal}
              </p>
            </div>

            <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 bg-[#111] text-[#666] py-4 font-bold uppercase tracking-wider hover:text-white transition-colors">Back</button>
                <button 
                    onClick={handleFinish} 
                    disabled={!name.trim()}
                    className="flex-[2] bg-primary text-black py-5 font-black italic uppercase tracking-wider text-xl shadow-[0_0_30px_rgba(204,255,0,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                INITIATE
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;