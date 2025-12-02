import React from 'react';
import { Zap, Flame, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing4 = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-black text-white min-h-screen font-sans">
      
      {/* Nav */}
      <nav className="p-6 flex justify-between items-center">
        <div className="text-2xl font-black italic tracking-tighter text-[#ccff00]">VOLTLIFT</div>
        <button onClick={() => navigate('/')} className="bg-[#222] hover:bg-[#333] px-4 py-2 rounded font-bold text-sm uppercase tracking-wide">Login</button>
      </nav>

      {/* Hero */}
      <div className="container mx-auto px-6 pt-12 pb-24 text-center">
        <div className="inline-block px-4 py-1 border border-[#ccff00] text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-6 rounded skew-x-[-12deg]">
            <span className="skew-x-[12deg] inline-block">Early Access</span>
        </div>
        <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter leading-[0.9] mb-8">
            PUSH<br/>
            YOUR<br/>
            <span className="text-[#ccff00]">LIMITS</span>
        </h1>
        <p className="max-w-xl mx-auto text-gray-400 text-lg mb-10 font-medium">
            Stop guessing. Start growing. The aggressive tracker for athletes who want to break records, not just sweat.
        </p>
        <button 
            onClick={() => navigate('/onboarding')}
            className="bg-[#ccff00] text-black px-10 py-5 rounded-lg font-black text-xl italic uppercase tracking-wider hover:scale-105 transition-transform shadow-[0_0_40px_rgba(204,255,0,0.3)]"
        >
            Join The Cult
        </button>
      </div>

      {/* Statistics Strip */}
      <div className="bg-[#111] border-y border-[#333] py-12">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
                <Flame size={40} className="text-[#ccff00] mb-4" />
                <h3 className="text-3xl font-black italic">100%</h3>
                <p className="text-gray-500 uppercase text-xs font-bold tracking-widest">Focus</p>
            </div>
            <div className="flex flex-col items-center border-l border-r border-[#333]">
                <Zap size={40} className="text-[#ccff00] mb-4" />
                <h3 className="text-3xl font-black italic">ZERO</h3>
                <p className="text-gray-500 uppercase text-xs font-bold tracking-widest">Distractions</p>
            </div>
            <div className="flex flex-col items-center">
                <Timer size={40} className="text-[#ccff00] mb-4" />
                <h3 className="text-3xl font-black italic">2x</h3>
                <p className="text-gray-500 uppercase text-xs font-bold tracking-widest">Faster Logging</p>
            </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 text-center">
          <p className="text-[#333] font-bold text-xs uppercase tracking-widest">VoltLift © 2025</p>
      </div>
    </div>
  );
};

export default Landing4;