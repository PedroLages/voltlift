import React from 'react';
import { WeeklyVolumeData } from '../services/progressionData';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface VolumeBreakdownTableProps {
  weeklyData: WeeklyVolumeData[];
  title?: string;
}

export const VolumeBreakdownTable: React.FC<VolumeBreakdownTableProps> = ({
  weeklyData,
  title = 'Weekly Volume Breakdown'
}) => {
  if (weeklyData.length === 0) {
    return (
      <div className="bg-[#111] border border-[#222] p-6 text-center">
        <p className="text-sm text-[#666] font-mono">No weekly data available</p>
      </div>
    );
  }

  // Calculate trends
  const getTrend = (currentWeek: WeeklyVolumeData, previousWeek?: WeeklyVolumeData) => {
    if (!previousWeek) return null;

    const change = currentWeek.totalVolume - previousWeek.totalVolume;
    const percentChange = previousWeek.totalVolume > 0
      ? (change / previousWeek.totalVolume) * 100
      : 0;

    return { change, percentChange };
  };

  // Get top 3 muscle groups for each week
  const getTopMuscles = (muscleBreakdown: Record<string, number>) => {
    return Object.entries(muscleBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([muscle, volume]) => ({ muscle, volume }));
  };

  // Average weekly volume
  const avgVolume = weeklyData.reduce((sum, week) => sum + week.totalVolume, 0) / weeklyData.length;

  return (
    <div className="bg-[#111] border border-[#222] p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-black italic uppercase text-white">{title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[#666] font-mono uppercase">
              {weeklyData.length} WEEKS
            </span>
            <span className="text-[10px] text-[#444]">•</span>
            <span className="text-[10px] text-[#666] font-mono uppercase">
              AVG: {(avgVolume / 1000).toFixed(1)}K LBS/WEEK
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-[10px] font-bold text-[#666] uppercase tracking-widest pb-2 pr-4">
                Week
              </th>
              <th className="text-[10px] font-bold text-[#666] uppercase tracking-widest pb-2 pr-4 text-right">
                Volume
              </th>
              <th className="text-[10px] font-bold text-[#666] uppercase tracking-widest pb-2 pr-4 text-right">
                Workouts
              </th>
              <th className="text-[10px] font-bold text-[#666] uppercase tracking-widest pb-2 pr-4 text-right">
                Trend
              </th>
              <th className="text-[10px] font-bold text-[#666] uppercase tracking-widest pb-2">
                Top Muscles
              </th>
            </tr>
          </thead>
          <tbody>
            {weeklyData.map((week, index) => {
              const previousWeek = index > 0 ? weeklyData[index - 1] : undefined;
              const trend = getTrend(week, previousWeek);
              const topMuscles = getTopMuscles(week.muscleBreakdown);
              const isCurrentWeek = index === weeklyData.length - 1;

              return (
                <tr
                  key={week.weekStart}
                  className={`border-b border-[#111] ${isCurrentWeek ? 'bg-[#0a0a0a]' : ''}`}
                >
                  {/* Week Date Range */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-[#444]" />
                      <div>
                        <div className="text-xs font-mono text-white">
                          {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-[9px] font-mono text-[#444]">
                          {new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Total Volume */}
                  <td className="py-3 pr-4 text-right">
                    <div className="text-sm font-bold font-mono text-white">
                      {(week.totalVolume / 1000).toFixed(1)}K
                    </div>
                    <div className="text-[9px] font-mono text-[#444]">LBS</div>
                  </td>

                  {/* Workout Count */}
                  <td className="py-3 pr-4 text-right">
                    <div className="text-sm font-bold font-mono text-white">
                      {week.workoutCount}
                    </div>
                    <div className="text-[9px] font-mono text-[#444]">sessions</div>
                  </td>

                  {/* Trend */}
                  <td className="py-3 pr-4 text-right">
                    {trend ? (
                      <div className="flex items-center justify-end gap-1">
                        {trend.change > 0 ? (
                          <>
                            <TrendingUp size={12} className="text-green-400" />
                            <span className="text-xs font-bold font-mono text-green-400">
                              +{trend.percentChange.toFixed(1)}%
                            </span>
                          </>
                        ) : trend.change < 0 ? (
                          <>
                            <TrendingDown size={12} className="text-red-400" />
                            <span className="text-xs font-bold font-mono text-red-400">
                              {trend.percentChange.toFixed(1)}%
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-mono text-[#666]">-</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-[#666]">-</span>
                    )}
                  </td>

                  {/* Top Muscles */}
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {topMuscles.map((item, i) => (
                        <span
                          key={item.muscle}
                          className="text-[9px] font-mono px-1.5 py-0.5 bg-[#222] text-[#888] border border-[#333]"
                        >
                          {item.muscle}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#222]">
        <div className="text-center">
          <div className="text-[10px] text-[#666] uppercase font-mono mb-1">Peak Week</div>
          <div className="text-lg font-black italic text-green-400">
            {(Math.max(...weeklyData.map(w => w.totalVolume)) / 1000).toFixed(1)}K
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#666] uppercase font-mono mb-1">Average</div>
          <div className="text-lg font-black italic text-white">
            {(avgVolume / 1000).toFixed(1)}K
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#666] uppercase font-mono mb-1">Current Week</div>
          <div className="text-lg font-black italic text-primary">
            {(weeklyData[weeklyData.length - 1]?.totalVolume / 1000).toFixed(1)}K
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeBreakdownTable;
