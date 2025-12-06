import React, { useState } from 'react';
import { TrendingUp, Activity, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { BodyweightChart } from '../../components/BodyweightChart';
import { BodyLiftCorrelation } from '../../components/BodyLiftCorrelation';
import { MeasurementTrends } from '../../components/MeasurementTrends';
import { ProgressPhotos } from '../../components/ProgressPhotos';
import { EXERCISE_LIBRARY } from '../../constants';

export const DesktopAnalytics: React.FC = () => {
  const { history, settings } = useStore();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'body' | 'strength' | 'photos'>('overview');

  const completedWorkouts = history.filter(w => w.status === 'completed');

  // Calculate volume over time
  const volumeData = completedWorkouts
    .sort((a, b) => a.startTime - b.startTime)
    .map(workout => {
      const totalVolume = workout.logs.reduce((sum, log) => {
        const exerciseVolume = log.sets
          .filter(s => s.completed && s.type !== 'W')
          .reduce((logSum, set) => logSum + (set.weight * set.reps), 0);
        return sum + exerciseVolume;
      }, 0);
      return {
        date: new Date(workout.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: totalVolume,
        timestamp: workout.startTime
      };
    });

  // Calculate workout frequency by day of week
  const dayOfWeekCounts = completedWorkouts.reduce((acc, workout) => {
    const day = new Date(workout.startTime).toLocaleDateString('en-US', { weekday: 'short' });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const daysOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayFrequency = daysOrder.map(day => ({
    day,
    count: dayOfWeekCounts[day] || 0
  }));

  const maxDayCount = Math.max(...dayFrequency.map(d => d.count), 1);

  // Calculate average workout duration
  const avgDuration = completedWorkouts.reduce((sum, w) => {
    if (w.endTime) {
      return sum + (w.endTime - w.startTime);
    }
    return sum;
  }, 0) / (completedWorkouts.length || 1);

  const avgMinutes = Math.floor(avgDuration / 1000 / 60);

  // Calculate total sets and reps
  const totalSets = completedWorkouts.reduce((sum, w) => {
    return sum + w.logs.reduce((logSum, log) => {
      return logSum + log.sets.filter(s => s.completed).length;
    }, 0);
  }, 0);

  const totalReps = completedWorkouts.reduce((sum, w) => {
    return sum + w.logs.reduce((logSum, log) => {
      return logSum + log.sets.filter(s => s.completed).reduce((setSum, s) => setSum + s.reps, 0);
    }, 0);
  }, 0);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'body' as const, label: 'Body Metrics', icon: TrendingUp },
    { id: 'strength' as const, label: 'Strength Analysis', icon: Zap },
    { id: 'photos' as const, label: 'Progress Photos', icon: CalendarIcon },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black italic text-white mb-2">ANALYTICS</h1>
        <p className="text-[#666] font-mono text-sm uppercase tracking-wider">
          Deep insights into your training performance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-[#222]">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-bold uppercase text-sm transition-colors ${
                selectedTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-[#666] hover:text-white'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-[#111] border border-[#222] p-6">
              <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">
                Avg Duration
              </div>
              <div className="text-3xl font-black italic text-white">{avgMinutes}</div>
              <div className="text-xs text-[#666] font-mono">minutes</div>
            </div>
            <div className="bg-[#111] border border-[#222] p-6">
              <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">
                Total Sets
              </div>
              <div className="text-3xl font-black italic text-white">{totalSets.toLocaleString()}</div>
            </div>
            <div className="bg-[#111] border border-[#222] p-6">
              <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">
                Total Reps
              </div>
              <div className="text-3xl font-black italic text-white">{totalReps.toLocaleString()}</div>
            </div>
            <div className="bg-[#111] border border-[#222] p-6">
              <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">
                Personal Records
              </div>
              <div className="text-3xl font-black italic text-primary">
                {Object.keys(settings.personalRecords || {}).length}
              </div>
            </div>
          </div>

          {/* Volume Over Time Chart */}
          {volumeData.length > 0 && (
            <div className="bg-[#111] border border-[#222] p-6">
              <h2 className="text-lg font-black uppercase text-white mb-4">Training Volume Over Time</h2>
              <div className="h-64 relative">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid */}
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#222" strokeWidth="0.2" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#222" strokeWidth="0.2" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#222" strokeWidth="0.2" />

                  {/* Volume bars */}
                  {volumeData.map((entry, i) => {
                    const maxVolume = Math.max(...volumeData.map(d => d.volume));
                    const x = (i / (volumeData.length - 1)) * 100;
                    const height = (entry.volume / maxVolume) * 100;
                    return (
                      <rect
                        key={i}
                        x={x - 0.5}
                        y={100 - height}
                        width="1"
                        height={height}
                        fill="#ccff00"
                        opacity="0.8"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Workout Frequency by Day */}
          <div className="bg-[#111] border border-[#222] p-6">
            <h2 className="text-lg font-black uppercase text-white mb-4">Workout Frequency by Day</h2>
            <div className="flex items-end justify-between gap-2 h-48">
              {dayFrequency.map(({ day, count }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 w-full flex items-end justify-center">
                    <div
                      className="w-full bg-primary transition-all"
                      style={{ height: `${(count / maxDayCount) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-white">{day}</div>
                  <div className="text-[10px] text-[#666] font-mono">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'body' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <BodyweightChart />
            </div>
            <div>
              <MeasurementTrends />
            </div>
          </div>
          <BodyLiftCorrelation />
        </div>
      )}

      {selectedTab === 'strength' && (
        <div className="space-y-8">
          <BodyLiftCorrelation />
        </div>
      )}

      {selectedTab === 'photos' && (
        <div>
          <ProgressPhotos />
        </div>
      )}
    </div>
  );
};

export default DesktopAnalytics;
