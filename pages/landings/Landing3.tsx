import React from 'react';
import { ArrowRight, Disc, X } from 'lucide-react';

const Landing3 = () => {
  return (
    <div className="bg-[#111] text-[#eee] font-mono min-h-screen selection:bg-white selection:text-black">
      
      <div className="border-b border-[#333] p-4 flex justify-between items-center sticky top-0 bg-[#111] z-20">
        <span className="font-bold uppercase tracking-widest text-sm">IronPath.SYS</span>
        <span className="text-xs text-[#666]">[V.1.0.4]</span>
      </div>

      <div className="grid md:grid-cols-2 min-h-[80vh] border-b border-[#333]">
        
        {/* Left: Text */}
        <div className="p-8 md:p-16 flex flex-col justify-center border-r border-[#333]">
            <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.85] tracking-tighter mb-8">
                Lift<br/>
                Heavy<br/>
                Shit.
            </h1>
            <p className="text-[#888] text-sm uppercase tracking-widest mb-12 max-w-xs">
                No gradients. No fluff. Just raw data for raw strength. The tracking tool for the obsessed.
            </p>
            <button className="bg-white text-black py-4 px-6 font-bold uppercase tracking-widest hover:bg-[#ccc] transition-colors flex items-center justify-between group">
                <span>Initiate Protocol</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        {/* Right: Graphic */}
        <div className="relative bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-20" 
                 style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
            
            <div className="relative z-10 w-64 h-64 border-4 border-white rounded-full flex items-center justify-center animate-spin-slow">
                <div className="w-48 h-48 border-2 border-[#333] rounded-full flex items-center justify-center">
                    <Disc size={64} className="text-[#333]" />
                </div>
                <div className="absolute bottom-0 bg-white text-black px-2 py-1 text-xs font-bold font-sans">45 LBS</div>
            </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="overflow-hidden whitespace-nowrap py-4 border-b border-[#333] bg-white text-black">
        <div className="inline-block animate-marquee font-bold uppercase tracking-widest text-sm">
            Progressive Overload /// Hypertrophy Optimized /// Data Driven Results /// Kill Your Weakness /// IronPath /// 
            Progressive Overload /// Hypertrophy Optimized /// Data Driven Results /// Kill Your Weakness /// IronPath ///
        </div>
      </div>

      {/* Footer Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#333]">
         {['Squat', 'Bench', 'Deadlift', 'OHP'].map((lift) => (
             <div key={lift} className="p-8 hover:bg-[#222] transition-colors cursor-crosshair">
                 <h3 className="text-xs text-[#666] uppercase mb-2">Compound</h3>
                 <p className="font-bold text-xl uppercase">{lift}</p>
             </div>
         ))}
      </div>

    </div>
  );
};

export default Landing3;