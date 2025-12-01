import React from 'react';
import { Leaf, Wind, Sun } from 'lucide-react';

const Landing5 = () => {
  return (
    <div className="bg-[#1c1917] text-[#e7e5e4] min-h-screen font-serif">
      
      {/* Hero */}
      <div className="container mx-auto px-6 py-24 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 md:pr-12">
            <span className="text-[#d6d3d1] font-sans text-xs uppercase tracking-[0.2em] mb-4 block">Mindful Training</span>
            <h1 className="text-5xl md:text-7xl mb-6 leading-tight font-medium text-[#fafaf9]">
                Strength in <br/>
                <i className="text-[#a8a29e]">Stillness.</i>
            </h1>
            <p className="text-[#a8a29e] font-sans text-lg leading-relaxed mb-10 max-w-md">
                A workout tracker that respects your peace of mind. Minimalist, quiet, and designed to help you build a sustainable practice.
            </p>
            <div className="flex gap-6 font-sans">
                <button className="bg-[#e7e5e4] text-[#1c1917] px-8 py-3 rounded-full font-medium hover:bg-white transition-colors">
                    Begin Journey
                </button>
                <button className="text-[#e7e5e4] underline decoration-[#57534e] hover:decoration-[#e7e5e4] transition-all underline-offset-4">
                    Read Philosophy
                </button>
            </div>
        </div>
        
        {/* Visual Abstract */}
        <div className="md:w-1/2 mt-16 md:mt-0 relative">
             <div className="w-full aspect-[4/5] bg-[#292524] rounded-t-[10rem] rounded-b-[2rem] overflow-hidden relative">
                 <div className="absolute bottom-10 left-10 right-10 top-20 bg-[#44403c] rounded-t-[8rem] rounded-b-xl opacity-50"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                     <Sun className="text-[#e7e5e4] opacity-80" size={64} strokeWidth={1} />
                 </div>
             </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="bg-[#292524] py-20 px-6 font-sans">
          <div className="container mx-auto grid md:grid-cols-3 gap-12">
              <div>
                  <Leaf className="text-[#a8a29e] mb-4" strokeWidth={1.5} />
                  <h3 className="font-serif text-2xl mb-3 text-[#e7e5e4]">Natural Progression</h3>
                  <p className="text-[#78716c] leading-relaxed">Grow at your own pace. Our algorithms adapt to your body's natural rhythm.</p>
              </div>
              <div>
                  <Wind className="text-[#a8a29e] mb-4" strokeWidth={1.5} />
                  <h3 className="font-serif text-2xl mb-3 text-[#e7e5e4]">Breathe & Focus</h3>
                  <p className="text-[#78716c] leading-relaxed">Interfaces designed to reduce cognitive load, allowing you to focus on the lift.</p>
              </div>
              <div>
                  <Sun className="text-[#a8a29e] mb-4" strokeWidth={1.5} />
                  <h3 className="font-serif text-2xl mb-3 text-[#e7e5e4]">Consistency</h3>
                  <p className="text-[#78716c] leading-relaxed">Build a habit that lasts a lifetime. Track not just weight, but the quality of your movement.</p>
              </div>
          </div>
      </div>

    </div>
  );
};

export default Landing5;