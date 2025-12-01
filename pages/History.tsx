import React from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Clock, Box } from 'lucide-react';

const History = () => {
  const { history } = useStore();
  const navigate = useNavigate();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDuration = (start: number, end?: number) => {
    if (!end) return '--';
    const minutes = Math.floor((end - start) / 60000);
    return `${minutes} MIN`;
  };

  const getTotalVolume = (session: any) => {
    let volume = 0;
    session.logs.forEach((log: any) => {
      log.sets.forEach((set: any) => {
        if (set.completed) volume += (set.weight * set.reps);
      });
    });
    return (volume / 1000).toFixed(1) + 'K LBS';
  };

  return (
    <div className="p-6 pb-20">
      <h1 className="text-4xl volt-header mb-8">LOGS</h1>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-12 border border-[#222] bg-[#111]">
              <p className="text-[#444] font-mono uppercase text-sm">No data recorded.</p>
          </div>
        ) : (
          history.map(session => (
            <div 
              key={session.id} 
              onClick={() => navigate(`/history/${session.id}`)}
              className="bg-[#111] border-l-2 border-[#333] hover:border-primary p-5 flex gap-5 transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center border border-[#333] bg-black w-14 h-14 shrink-0">
                 <span className="text-xs font-bold text-[#666] uppercase">{new Date(session.startTime).toLocaleDateString('en-US', {weekday: 'short'})}</span>
                 <span className="text-lg font-black italic text-white">{new Date(session.startTime).getDate()}</span>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white uppercase italic tracking-wide text-lg group-hover:text-primary transition-colors">{session.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#666] uppercase tracking-wider">
                      <Clock size={10} /> {getDuration(session.startTime, session.endTime)}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#666] uppercase tracking-wider">
                      <Box size={10} /> {getTotalVolume(session)}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-[#333] group-hover:text-primary transition-colors">
                <ChevronRight size={20} strokeWidth={3} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;