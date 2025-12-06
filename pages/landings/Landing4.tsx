import React, { useState } from 'react';
import { Zap, Target, Brain, TrendingUp, X, Check, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing4 = () => {
  const navigate = useNavigate();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const painPoints = [
    "Forgetting what weight you used last week",
    "Scrolling through 47 notes apps to find your split",
    "Guessing if you're actually getting stronger",
    "Logging sets while your rest timer expires"
  ];

  const features = [
    {
      icon: <Brain size={32} />,
      title: "Your gym notes but with a brain",
      desc: "Remembers your last workout. Pre-fills everything. You just show up and lift heavier.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Target size={32} />,
      title: "Progressive overload on autopilot",
      desc: "Tells you exactly what to lift next. No math, no spreadsheets, just gains.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <TrendingUp size={32} />,
      title: "See your strength score go up",
      desc: "Track your 1RM estimates across all lifts. Watch the numbers climb every week.",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen font-sans overflow-hidden relative">
      {/* Animated background gradient */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-[#ccff00] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-500 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 p-6 flex justify-between items-center border-b border-[#222]">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-[#ccff00]" size={24} />
          <span className="text-2xl font-black italic tracking-tighter text-[#ccff00]">IRONPATH</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          onTouchStart={() => navigate('/login')}
          className="group relative px-6 py-2 bg-[#ccff00] text-black font-black text-sm uppercase tracking-wide overflow-hidden transition-all hover:px-8 cursor-pointer"
          style={{ touchAction: 'manipulation' }}
        >
          <span className="relative z-10">Login</span>
          <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </button>
      </nav>

      {/* Hero - Asymmetric */}
      <div className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 border-2 border-[#ccff00] bg-[#ccff00]/5 backdrop-blur-sm">
            <Zap className="text-[#ccff00]" size={16} fill="currentColor" />
            <span className="text-[#ccff00] text-xs font-black uppercase tracking-widest">Built by lifters, for lifters</span>
          </div>

          {/* Main headline - raw and specific */}
          <h1 className="text-6xl md:text-8xl font-black leading-[0.95] mb-8">
            <span className="block">Stop wasting</span>
            <span className="block">time in the</span>
            <span className="block text-[#ccff00] italic">notes app</span>
          </h1>

          {/* Real talk subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl leading-relaxed">
            Your phone is full of workout notes you'll never read again.
            <span className="text-white font-bold"> We built something better.</span>
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl">
            Track workouts in 3 taps. See your progress. Actually know if you're getting stronger.
            That's it. No bullshit features you'll never use.
          </p>

          {/* CTA - unconventional */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <button
              onClick={() => navigate('/login')}
              onTouchStart={() => navigate('/login')}
              className="group relative px-12 py-5 bg-[#ccff00] text-black font-black text-xl italic uppercase tracking-wider overflow-hidden transition-all hover:shadow-[0_0_60px_rgba(204,255,0,0.4)] cursor-pointer"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="relative z-10">Start Tracking</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ccff00] to-white transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </button>
            <div className="flex flex-col justify-center text-[10px] text-gray-500 uppercase tracking-wider">
              <span>✓ No credit card</span>
              <span>✓ Takes 30 seconds</span>
              <span>✓ Works offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Problem section - what you're fixing */}
      <div className="relative z-10 bg-gradient-to-b from-transparent via-[#0a0a0a] to-transparent py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-center">
              Tired of this?
            </h2>
            <p className="text-gray-400 text-center mb-12 text-lg">
              Join 1000+ lifters who deleted their notes app
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {painPoints.map((pain, i) => (
                <div
                  key={i}
                  className="group p-6 border-2 border-red-900/30 bg-red-900/5 hover:border-[#ccff00] hover:bg-[#ccff00]/5 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <X className="text-red-500 group-hover:text-[#ccff00] transition-colors flex-shrink-0" size={24} />
                    <p className="text-gray-300 group-hover:text-white transition-colors">{pain}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features - specific and human */}
      <div className="relative z-10 container mx-auto px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Three things we do<br/>
            <span className="text-[#ccff00] italic">really fucking well</span>
          </h2>
          <p className="text-gray-400 text-xl mb-16 max-w-2xl">
            We don't have 100 features. We have 3 that actually matter.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="group relative p-8 bg-[#0a0a0a] border-2 border-[#222] hover:border-[#ccff00] transition-all duration-300 overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${feature.color}`}></div>

                <div className="relative z-10">
                  <div className="text-[#ccff00] mb-4 transform group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-black mb-3 group-hover:text-[#ccff00] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                    {feature.desc}
                  </p>
                </div>

                {/* Number indicator */}
                <div className="absolute -top-4 -right-4 text-8xl font-black text-[#111] group-hover:text-[#ccff00]/20 transition-colors">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social proof - real voice */}
      <div className="relative z-10 bg-gradient-to-b from-transparent via-[#0a0a0a] to-transparent py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-16 text-center">
              What people actually say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border-l-4 border-[#ccff00] bg-[#0a0a0a]">
                <p className="text-lg mb-4 text-gray-300 italic">
                  "Finally deleted my 4-year-old Google Doc full of workouts. This just works."
                </p>
                <p className="text-sm text-gray-500">— Marcus, powerlifter</p>
              </div>
              <div className="p-6 border-l-4 border-purple-500 bg-[#0a0a0a]">
                <p className="text-lg mb-4 text-gray-300 italic">
                  "The pre-fill feature alone is worth it. I log sets in like 10 seconds now."
                </p>
                <p className="text-sm text-gray-500">— Sarah, CrossFit athlete</p>
              </div>
              <div className="p-6 border-l-4 border-blue-500 bg-[#0a0a0a]">
                <p className="text-lg mb-4 text-gray-300 italic">
                  "Seeing my strength score go up every week is addictive. I'm hooked."
                </p>
                <p className="text-sm text-gray-500">— Jake, bodybuilder</p>
              </div>
              <div className="p-6 border-l-4 border-orange-500 bg-[#0a0a0a]">
                <p className="text-lg mb-4 text-gray-300 italic">
                  "Not bloated with features I don't need. Just clean, fast tracking."
                </p>
                <p className="text-sm text-gray-500">— Alex, Olympic weightlifter</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA - bold */}
      <div className="relative z-10 container mx-auto px-6 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Ready to stop<br/>
            <span className="text-[#ccff00] italic">fucking around?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join the lifters who track smarter, not harder.
          </p>
          <button
            onClick={() => navigate('/login')}
            onTouchStart={() => navigate('/login')}
            className="group relative px-16 py-6 bg-[#ccff00] text-black font-black text-2xl italic uppercase tracking-wider overflow-hidden hover:shadow-[0_0_80px_rgba(204,255,0,0.5)] transition-all cursor-pointer"
            style={{ touchAction: 'manipulation' }}
          >
            <span className="relative z-10">Let's Go</span>
            <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300"></div>
          </button>
          <p className="text-gray-500 text-sm mt-6">
            Takes 30 seconds to sign up. No credit card. Cancel anytime (but you won't).
          </p>
        </div>
      </div>

      {/* Footer - minimal */}
      <div className="relative z-10 border-t border-[#222] py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[#444] font-bold text-xs uppercase tracking-widest">
            IronPath © 2025 · Made by lifters who got tired of Notes app workouts
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing4;
