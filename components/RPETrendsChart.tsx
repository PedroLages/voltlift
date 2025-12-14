import React, { useMemo, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface RPEDataPoint {
  date: string;
  displayDate: string;
  avgRPE: number;
  setCount: number;
  highRPESets: number;
}

export const RPETrendsChart: React.FC = () => {
  const { history } = useStore();
  const [timeRange, setTimeRange] = useState<30 | 60 | 90>(30);

  // Calculate RPE trends from workout history
  const rpeData = useMemo(() => {
    const cutoffDate = Date.now() - timeRange * 24 * 60 * 60 * 1000;

    const workouts = history
      .filter(w => w.status === 'completed' && w.endTime && w.endTime >= cutoffDate)
      .sort((a, b) => (a.endTime || 0) - (b.endTime || 0));

    const data: RPEDataPoint[] = [];

    for (const workout of workouts) {
      const rpes: number[] = [];
      let highRPECount = 0;

      for (const log of workout.logs) {
        for (const set of log.sets) {
          if (set.completed && set.rpe !== undefined && set.rpe > 0) {
            rpes.push(set.rpe);
            if (set.rpe >= 9) highRPECount++;
          }
        }
      }

      if (rpes.length > 0) {
        const date = new Date(workout.endTime || workout.startTime);
        data.push({
          date: date.toISOString().split('T')[0],
          displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          avgRPE: Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10,
          setCount: rpes.length,
          highRPESets: highRPECount,
        });
      }
    }

    return data;
  }, [history, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (rpeData.length === 0) {
      return { average: 0, trend: 0, highRPEPercentage: 0, recommendation: '' };
    }

    const average = rpeData.reduce((sum, d) => sum + d.avgRPE, 0) / rpeData.length;

    // Calculate trend (compare first half vs second half)
    const mid = Math.floor(rpeData.length / 2);
    const firstHalf = rpeData.slice(0, mid);
    const secondHalf = rpeData.slice(mid);

    const firstAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, d) => sum + d.avgRPE, 0) / firstHalf.length
      : 0;
    const secondAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, d) => sum + d.avgRPE, 0) / secondHalf.length
      : 0;

    const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    // High RPE percentage
    const totalSets = rpeData.reduce((sum, d) => sum + d.setCount, 0);
    const totalHighRPE = rpeData.reduce((sum, d) => sum + d.highRPESets, 0);
    const highRPEPercentage = totalSets > 0 ? (totalHighRPE / totalSets) * 100 : 0;

    // Generate recommendation
    let recommendation = '';
    if (average >= 9 && trend > 5) {
      recommendation = 'Consider a deload week - fatigue is accumulating rapidly';
    } else if (average >= 8.5) {
      recommendation = 'Training intensity is high - monitor recovery closely';
    } else if (average <= 6) {
      recommendation = 'You have room to push harder if progress stalls';
    } else if (trend < -10) {
      recommendation = 'RPE trending down - great recovery or consider adding intensity';
    } else {
      recommendation = 'RPE levels are sustainable for consistent progress';
    }

    return {
      average: Math.round(average * 10) / 10,
      trend: Math.round(trend),
      highRPEPercentage: Math.round(highRPEPercentage),
      recommendation,
    };
  }, [rpeData]);

  const getTrendIcon = () => {
    if (Math.abs(stats.trend) < 5) return <Minus size={14} className="text-[#666]" />;
    if (stats.trend > 0) return <TrendingUp size={14} className="text-orange-500" />;
    return <TrendingDown size={14} className="text-green-500" />;
  };

  const getRPEColor = (rpe: number) => {
    if (rpe >= 9) return '#ef4444'; // red
    if (rpe >= 8) return '#f97316'; // orange
    if (rpe >= 7) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  if (rpeData.length === 0) {
    return (
      <div className="bg-[#111] border border-[#222] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase text-white">RPE Trends</h3>
        </div>
        <div className="text-center py-8">
          <Activity size={32} className="text-[#333] mx-auto mb-2" />
          <p className="text-sm text-[#666]">No RPE data yet</p>
          <p className="text-[10px] text-[#444]">Log RPE on your sets to see trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#222] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase text-white">RPE Trends</h3>
        </div>
        <div className="flex gap-1">
          {[30, 60, 90].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days as 30 | 60 | 90)}
              className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
                timeRange === days
                  ? 'bg-primary text-black'
                  : 'bg-[#222] text-[#666] hover:text-white'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-black border border-[#222] p-3 text-center">
          <div className="text-2xl font-black italic" style={{ color: getRPEColor(stats.average) }}>
            {stats.average}
          </div>
          <div className="text-[9px] text-[#666] uppercase font-bold">Avg RPE</div>
        </div>
        <div className="bg-black border border-[#222] p-3 text-center">
          <div className="text-2xl font-black italic text-white flex items-center justify-center gap-1">
            {getTrendIcon()}
            {Math.abs(stats.trend)}%
          </div>
          <div className="text-[9px] text-[#666] uppercase font-bold">Trend</div>
        </div>
        <div className="bg-black border border-[#222] p-3 text-center">
          <div className="text-2xl font-black italic text-red-500">
            {stats.highRPEPercentage}%
          </div>
          <div className="text-[9px] text-[#666] uppercase font-bold">RPE 9+</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rpeData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="displayDate"
              stroke="#444"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[5, 10]}
              stroke="#444"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              ticks={[6, 7, 8, 9, 10]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111',
                border: '1px solid #333',
                borderRadius: 0,
                fontSize: 12,
              }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              formatter={(value: number, name: string) => [
                `${value} RPE`,
                'Average',
              ]}
            />
            <ReferenceLine y={8} stroke="#333" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="avgRPE"
              stroke="#ccff00"
              strokeWidth={2}
              dot={{ fill: '#ccff00', r: 3 }}
              activeDot={{ fill: '#fff', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendation */}
      <div className="bg-black border border-[#222] p-3 flex items-start gap-2">
        <AlertTriangle size={14} className="text-primary mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-[#ccc] font-mono leading-relaxed">
          {stats.recommendation}
        </p>
      </div>
    </div>
  );
};

export default RPETrendsChart;
