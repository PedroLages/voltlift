
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Calendar, Clock, Box, Dumbbell, Share2, X, Activity } from 'lucide-react';
import { EXERCISE_LIBRARY } from '../constants';
import { SetTypeBadge } from '../components/SetTypeBadge';

const HistoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { history, settings } = useStore();
  const [showReceipt, setShowReceipt] = useState(false);
  
  const session = history.find(h => h.id === id);

  if (!session) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black">
            <h1 className="text-white volt-header mb-4">LOG NOT FOUND</h1>
            <button onClick={() => navigate('/history')} className="text-primary underline">Return</button>
        </div>
    );
  }

  const durationMin = session.endTime ? Math.floor((session.endTime - session.startTime) / 60000) : 0;
  const totalVolume = session.logs.reduce((acc, log) => {
      return acc + log.sets.reduce((sAcc, s) => s.completed ? sAcc + (s.weight * s.reps) : sAcc, 0);
  }, 0);

  // Avg Heart Rate
  const avgHeartRate = session.biometrics && session.biometrics.length > 0 
    ? Math.round(session.biometrics.reduce((acc, b) => acc + b.heartRate, 0) / session.biometrics.length)
    : 0;

  const HRChart = ({ data }: { data: { timestamp: number, heartRate: number }[] }) => {
      if (!data || data.length < 2) return null;
      
      const width = 100;
      const height = 40;
      const padding = 2;
      
      const minTime = data[0].timestamp;
      const maxTime = data[data.length-1].timestamp;
      const minHR = 50;
      const maxHR = 180;
      
      const getX = (t: number) => padding + ((t - minTime) / (maxTime - minTime)) * (width - 2*padding);
      const getY = (hr: number) => height - padding - ((hr - minHR) / (maxHR - minHR)) * (height - 2*padding);
      
      const points = data.map(d => `${getX(d.timestamp)},${getY(d.heartRate)}`).join(' ');
      
      return (
          <div className="w-full h-24 bg-[#111] border border-[#222] p-2 mb-6 relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <polyline 
                    points={points} 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth="1" 
                    vectorEffect="non-scaling-stroke"
                  />
              </svg>
              <div className="absolute top-2 right-2 flex items-center gap-1">
                  <Activity size={12} className="text-red-500" />
                  <span className="text-[10px] font-bold text-white uppercase">{avgHeartRate} BPM AVG</span>
              </div>
          </div>
      )
  };

  return (
    <div className="min-h-screen bg-black p-6 pb-24 font-sans text-white">
       {/* Receipt Modal */}
       {showReceipt && (
           <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
               <div className="absolute top-4 right-4">
                   <button onClick={() => setShowReceipt(false)} className="text-white"><X size={32} /></button>
               </div>
               
               <div className="bg-white text-black p-8 max-w-sm w-full font-mono text-sm relative shadow-2xl">
                    {/* Jagged Top */}
                    <div className="absolute top-0 left-0 right-0 h-4 -mt-4 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
                    
                    <div className="text-center mb-6 border-b-2 border-dashed border-black pb-4">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-1">VOLTLIFT.SYS</h2>
                        <p className="uppercase text-xs">{new Date(session.startTime).toLocaleDateString()}</p>
                        <p className="uppercase text-xs">{settings.name}</p>
                    </div>

                    <div className="space-y-4 mb-6">
                        {session.logs.map(log => {
                            const ex = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
                            const sets = log.sets.filter(s => s.completed);
                            const topSet = sets.sort((a,b) => b.weight - a.weight)[0];
                            if(!topSet) return null;

                            return (
                                <div key={log.id} className="flex justify-between items-end">
                                    <div>
                                        <div className="font-bold uppercase">{ex?.name}</div>
                                        <div className="text-xs">{sets.length} SETS</div>
                                    </div>
                                    <div className="font-bold">
                                        TOP: {topSet.weight}x{topSet.reps}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="border-t-2 border-dashed border-black pt-4 flex justify-between font-bold text-lg">
                        <span>TOTAL VOL</span>
                        <span>{(totalVolume/1000).toFixed(1)}K LBS</span>
                    </div>
                    
                    <div className="mt-8 text-center text-[10px] uppercase text-gray-500">
                        Verified by VoltLift
                    </div>
                    
                    {/* Jagged Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 -mb-4 bg-white" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
               </div>
               
               <p className="text-[#666] mt-8 text-xs font-mono uppercase animate-pulse">Screenshot to Share</p>
           </div>
       )}

       {/* Nav */}
       <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/history')} className="w-10 h-10 border border-[#333] flex items-center justify-center hover:bg-[#111] transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <span className="text-[10px] text-[#666] font-mono uppercase block">Log Detail</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">{id?.slice(0, 8)}</span>
                </div>
            </div>
            <button onClick={() => setShowReceipt(true)} className="flex items-center gap-2 text-primary hover:text-white transition-colors">
                <Share2 size={20} /> <span className="text-xs font-bold uppercase">Share</span>
            </button>
       </div>

       {/* Header */}
       <div className="mb-8">
           <h1 className="text-3xl volt-header uppercase italic leading-none mb-2">{session.name}</h1>
           <div className="flex items-center gap-2 text-[#888] text-xs font-bold uppercase tracking-wide">
               <Calendar size={14} />
               {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </div>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-2 gap-4 mb-4">
           <div className="bg-[#111] p-4 border border-[#222]">
               <div className="flex items-center gap-2 text-[#666] mb-2 text-[10px] uppercase font-bold tracking-widest">
                   <Clock size={12} /> Duration
               </div>
               <div className="text-2xl font-black italic">{durationMin} MIN</div>
           </div>
           <div className="bg-[#111] p-4 border border-[#222]">
               <div className="flex items-center gap-2 text-[#666] mb-2 text-[10px] uppercase font-bold tracking-widest">
                   <Box size={12} /> Volume
               </div>
               <div className="text-2xl font-black italic">{(totalVolume / 1000).toFixed(1)}K <span className="text-sm not-italic font-medium text-[#444]">LBS</span></div>
           </div>
       </div>

       {/* Heart Rate Chart */}
       {session.biometrics && session.biometrics.length > 0 && (
           <HRChart data={session.biometrics} />
       )}

       {/* Workout Notes */}
       {session.notes && (
           <div className="bg-[#111] border border-[#222] p-4 mt-6">
               <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
                   <StickyNote size={14} /> Workout Notes
               </h3>
               <p className="text-sm text-[#aaa] font-mono leading-relaxed whitespace-pre-wrap">
                   {session.notes.split(/(#\w+)/g).map((part, i) =>
                       part.startsWith('#') ? (
                           <span key={i} className="text-primary font-bold">{part}</span>
                       ) : (
                           <span key={i}>{part}</span>
                       )
                   )}
               </p>
           </div>
       )}

       {/* Logs */}
       <div className="space-y-6">
           <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest border-b border-[#222] pb-2">Session Data</h3>

           {session.logs.map((log, logIndex) => {
               const ex = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);

               // Circuit Notation Logic (A1, A2, B1, B2, etc.)
               let circuitLabel = '';
               if (log.supersetId) {
                 const uniqueSupersetIds = Array.from(new Set(session.logs.filter(l => l.supersetId).map(l => l.supersetId)));
                 const supersetGroupIndex = uniqueSupersetIds.indexOf(log.supersetId);
                 const groupLetter = String.fromCharCode(65 + supersetGroupIndex);
                 const logsInGroup = session.logs.filter(l => l.supersetId === log.supersetId);
                 const positionInGroup = logsInGroup.findIndex(l => l.id === log.id) + 1;
                 circuitLabel = `${groupLetter}${positionInGroup}`;
               }

               return (
                   <div key={log.id} className="bg-[#0a0a0a] border-l-2 border-[#333] pl-4 py-2">
                       <h4 className="font-bold text-lg uppercase italic mb-3 flex items-center gap-2">
                           {circuitLabel && (
                               <div className="flex items-center justify-center w-7 h-7 bg-primary text-black font-black text-xs border-2 border-primary/30 rounded-sm">
                                   {circuitLabel}
                               </div>
                           )}
                           <Dumbbell size={16} className="text-[#333]" />
                           {ex?.name || 'Unknown'}
                       </h4>
                       <div className="space-y-1">
                           {log.sets.map((set, i) => (
                               <div key={set.id} className={`grid grid-cols-5 text-sm py-1 border-b border-[#111] ${set.completed ? 'text-[#ccc]' : 'text-[#444]'}`}>
                                   <div className="font-mono text-[#444] text-[10px] flex items-center gap-1">
                                       {i + 1}
                                       <SetTypeBadge type={set.type} size="sm" />
                                   </div>
                                   <div className="text-right font-bold col-span-2">{set.weight} <span className="text-[10px] text-[#444]">LBS</span></div>
                                   <div className="text-right font-bold">{set.reps} <span className="text-[10px] text-[#444]">REPS</span></div>
                                   <div className="text-right flex justify-end">
                                       {set.completed ? <span className="text-primary text-[10px] font-black uppercase">Done</span> : <span className="text-red-900 text-[10px] uppercase">Miss</span>}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )
           })}
       </div>

    </div>
  );
};

export default HistoryDetail;
