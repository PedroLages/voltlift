import React from 'react';
import { Activity, Shield, Zap, ChevronRight, Check } from 'lucide-react';

const Landing1 = () => {
  return (
    <div className="bg-[#09090b] text-[#f4f4f5] font-sans min-h-screen">
      {/* Hero */}
      <div className="px-6 py-12 flex flex-col items-center text-center max-w-lg mx-auto mt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#27272a] text-[#10b981] text-xs font-bold uppercase tracking-wider mb-6">
          <Zap size={14} fill="currentColor" />
          <span>v2.0 Now Available</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Master Your <br/><span className="text-[#10b981]">Physique.</span>
        </h1>
        <p className="text-[#a1a1aa] text-lg mb-8 leading-relaxed">
          The intelligent workout tracker designed for progressive overload. Simple, powerful, and built for serious lifters.
        </p>
        <button className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-[#09090b] px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95">
          Start Training Free <ChevronRight size={20} />
        </button>
        <p className="text-xs text-[#a1a1aa] mt-4">No credit card required • iOS & Android</p>
      </div>

      {/* Mockup / Visual */}
      <div className="px-6 pb-12">
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 max-w-sm mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#10b981]"></div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="text-xs text-[#a1a1aa]">Current Session</div>
                    <div className="font-bold">Push Day (Heavy)</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#27272a] flex items-center justify-center text-[#10b981]">
                    <Activity size={16} />
                </div>
            </div>
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between items-center p-3 bg-[#09090b] rounded-lg border border-[#27272a]">
                        <span className="text-sm font-medium">Bench Press</span>
                        <span className="text-xs text-[#a1a1aa]">225lbs x 8</span>
                        <div className="w-5 h-5 rounded bg-[#10b981] flex items-center justify-center text-[#09090b]"><Check size={12}/></div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-[#18181b] py-16 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
                <div className="w-10 h-10 bg-[#27272a] rounded-lg flex items-center justify-center text-[#10b981] mb-2"><Activity /></div>
                <h3 className="font-bold text-lg">Auto-Progression</h3>
                <p className="text-[#a1a1aa] text-sm leading-relaxed">The app automatically suggests weight increases based on your performance.</p>
            </div>
            <div className="space-y-2">
                <div className="w-10 h-10 bg-[#27272a] rounded-lg flex items-center justify-center text-[#10b981] mb-2"><Shield /></div>
                <h3 className="font-bold text-lg">Form Guides</h3>
                <p className="text-[#a1a1aa] text-sm leading-relaxed">Detailed instructions and common mistakes for over 100+ exercises.</p>
            </div>
            <div className="space-y-2">
                <div className="w-10 h-10 bg-[#27272a] rounded-lg flex items-center justify-center text-[#10b981] mb-2"><Zap /></div>
                <h3 className="font-bold text-lg">Lightning Fast</h3>
                <p className="text-[#a1a1aa] text-sm leading-relaxed">Log your sets in seconds. No clutter, no ads, just focus.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Landing1;