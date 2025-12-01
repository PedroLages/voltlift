import React from 'react';
import { Play, TrendingUp, Cpu } from 'lucide-react';

const Landing2 = () => {
  return (
    <div className="bg-[#0b0c15] text-white font-sans min-h-screen relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-700/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/20 rounded-full blur-[120px]" />

      <div className="relative z-10 container mx-auto px-6 py-20">
        
        {/* Nav (Mock) */}
        <div className="flex justify-between items-center mb-20 opacity-80">
            <div className="font-bold text-xl tracking-tighter flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-md"></div>
                IronPath
            </div>
            <button className="text-sm font-medium hover:text-violet-300 transition-colors">Sign In</button>
        </div>

        {/* Hero */}
        <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
                Train at the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Speed of Light.</span>
            </h1>
            <p className="text-slate-400 text-lg mb-8 max-w-md">
                Experience the future of fitness tracking. AI-powered insights wrapped in a beautiful, distraction-free interface.
            </p>
            
            <div className="flex gap-4">
                <button className="bg-white text-[#0b0c15] px-8 py-3 rounded-full font-bold hover:bg-violet-100 transition-colors">
                    Get Started
                </button>
                <button className="px-8 py-3 rounded-full font-medium border border-white/10 hover:bg-white/5 backdrop-blur-sm transition-colors flex items-center gap-2">
                    <Play size={16} fill="currentColor" /> Watch Demo
                </button>
            </div>
        </div>

        {/* Glass Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-24">
            {[
                { title: "Smart Metrics", icon: <TrendingUp className="text-violet-400" />, desc: "Real-time analytics on volume and 1RM." },
                { title: "Neural Coach", icon: <Cpu className="text-fuchsia-400" />, desc: "AI suggestions adapted to your fatigue." },
                { title: "Flow State", icon: <Play className="text-blue-400" />, desc: "Zero-latency logging for uninterrupted focus." }
            ].map((card, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:border-violet-500/50 transition-colors group">
                    <div className="mb-4 p-3 bg-white/5 w-fit rounded-xl group-hover:scale-110 transition-transform">{card.icon}</div>
                    <h3 className="font-bold text-xl mb-2">{card.title}</h3>
                    <p className="text-slate-400 text-sm">{card.desc}</p>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};

export default Landing2;