import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';

const ProgramEnroll = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { programs, activateProgram } = useStore();

  const program = programs.find(p => p.id === programId);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [acknowledged, setAcknowledged] = useState(false);

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black">
        <h1 className="text-white volt-header mb-4">PROGRAM NOT FOUND</h1>
        <button onClick={() => navigate('/programs')} className="text-primary underline">
          Return to Programs
        </button>
      </div>
    );
  }

  const handleEnroll = () => {
    if (!acknowledged) {
      alert('Please acknowledge the commitment to this program');
      return;
    }

    activateProgram(program.id);
    navigate('/');
  };

  // Calculate sessions per week
  const getSessionsPerWeek = () => {
    const week1Sessions = program.sessions.filter(s => s.week === 1);
    return week1Sessions.length;
  };

  // Calculate estimated completion date
  const getCompletionDate = () => {
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + (program.weeks * 7));
    return endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-black p-6 pb-24 font-sans text-white">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/programs')}
          className="w-10 h-10 border border-[#333] flex items-center justify-center hover:bg-[#111] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="text-[10px] text-[#666] font-mono uppercase block">Program Enrollment</span>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Setup</span>
        </div>
      </div>

      {/* Program Overview */}
      <div className="mb-8">
        <h1 className="text-3xl volt-header uppercase italic leading-none mb-2">{program.name}</h1>
        <p className="text-[#888] text-sm font-mono leading-relaxed">{program.description}</p>
      </div>

      {/* Program Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#111] p-4 border border-[#222]">
          <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">Duration</div>
          <div className="text-2xl font-black italic text-white">{program.weeks} Weeks</div>
          <div className="text-[10px] text-[#444] font-mono mt-1">{program.sessions.length} Total Sessions</div>
        </div>
        <div className="bg-[#111] p-4 border border-[#222]">
          <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">Frequency</div>
          <div className="text-2xl font-black italic text-white">{getSessionsPerWeek()}x/Week</div>
          <div className="text-[10px] text-[#444] font-mono mt-1">Weekly Sessions</div>
        </div>
      </div>

      {/* Start Date Configuration */}
      <div className="mb-8">
        <label className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3 block">Start Date</label>
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-[#111] border-2 border-[#222] p-4 text-white font-mono focus:border-primary outline-none"
          />
          <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" />
        </div>
        <p className="text-[10px] text-[#444] font-mono mt-2">
          Estimated completion: {getCompletionDate()}
        </p>
      </div>

      {/* Week 1 Preview */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3">Week 1 Schedule</h3>
        <div className="space-y-2">
          {program.sessions
            .filter(s => s.week === 1)
            .map((session, index) => (
              <div key={index} className="bg-[#111] border border-[#222] p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-white uppercase">Day {session.day}</span>
                  <span className="text-[10px] text-[#666] font-mono ml-2 uppercase">{session.templateId}</span>
                </div>
                <div className="text-[10px] text-[#444] font-mono">
                  {new Date(startDate).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-[#111] border-l-4 border-yellow-500 p-4 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">Important</h3>
            <ul className="text-sm text-[#aaa] space-y-2 font-mono leading-relaxed">
              <li>• This program requires {getSessionsPerWeek()} sessions per week</li>
              <li>• Follow the prescribed order and rest days</li>
              <li>• Track all sets and reps accurately for progression</li>
              <li>• You can pause or stop the program anytime from settings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Acknowledgement Checkbox */}
      <div className="mb-8">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-primary cursor-pointer"
          />
          <span className="text-sm text-[#aaa] font-mono leading-relaxed group-hover:text-white transition-colors">
            I understand the commitment required and will follow this program to the best of my ability.
          </span>
        </label>
      </div>

      {/* Enroll Button */}
      <button
        onClick={handleEnroll}
        disabled={!acknowledged}
        className={`w-full py-4 font-black italic uppercase text-lg tracking-widest transition-all ${
          acknowledged
            ? 'bg-primary text-black hover:bg-white shadow-[0_0_20px_rgba(204,255,0,0.3)]'
            : 'bg-[#222] text-[#444] cursor-not-allowed'
        }`}
      >
        {acknowledged ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 size={20} />
            Start {program.name}
          </span>
        ) : (
          'Acknowledge to Continue'
        )}
      </button>
    </div>
  );
};

export default ProgramEnroll;
