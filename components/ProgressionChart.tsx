import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ProgressionDataPoint, ExerciseProgression } from '../services/progressionData';

interface ProgressionChartProps {
  progression: ExerciseProgression;
  color?: string;
  height?: number;
}

export const ProgressionChart: React.FC<ProgressionChartProps> = ({
  progression,
  color = '#ccff00',
  height = 300
}) => {
  // Format data for Recharts
  const chartData = progression.dataPoints.map(point => ({
    date: new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    '1RM': point.value,
    weight: point.weight,
    reps: point.reps,
    fullDate: point.date
  }));

  // Determine trend
  const getTrendIcon = () => {
    if (progression.avgImprovement > 2) {
      return <TrendingUp size={16} className="text-green-400" />;
    } else if (progression.avgImprovement < -2) {
      return <TrendingDown size={16} className="text-red-400" />;
    }
    return <Minus size={16} className="text-[#666]" />;
  };

  const getTrendColor = () => {
    if (progression.avgImprovement > 2) return 'text-green-400';
    if (progression.avgImprovement < -2) return 'text-red-400';
    return 'text-[#666]';
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0a0a0a] border border-primary p-3">
          <p className="text-xs font-bold text-white uppercase mb-2">{data.fullDate}</p>
          <p className="text-sm font-mono text-primary">
            Est. 1RM: <span className="font-black">{data['1RM']} LBS</span>
          </p>
          <p className="text-[10px] font-mono text-[#888] mt-1">
            Set: {data.weight} lbs × {data.reps} reps
          </p>
        </div>
      );
    }
    return null;
  };

  if (progression.dataPoints.length === 0) {
    return (
      <div className="bg-[#111] border border-[#222] p-6 text-center">
        <p className="text-sm text-[#666] font-mono">No data available for this exercise</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#222] p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-black italic uppercase text-white">{progression.exerciseName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[#666] font-mono uppercase">
              {progression.totalWorkouts} WORKOUTS
            </span>
            <span className="text-[10px] text-[#444]">•</span>
            <span className="text-[10px] text-[#666] font-mono uppercase">
              BEST: {progression.best1RM} LBS
            </span>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] px-3 py-2">
          {getTrendIcon()}
          <span className={`text-sm font-bold font-mono ${getTrendColor()}`}>
            {progression.avgImprovement > 0 ? '+' : ''}{progression.avgImprovement.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis
            dataKey="date"
            stroke="#666"
            tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={{ stroke: '#333' }}
          />
          <YAxis
            stroke="#666"
            tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={{ stroke: '#333' }}
            label={{ value: 'Est. 1RM (LBS)', angle: -90, position: 'insideLeft', fill: '#666', fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="1RM"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6, fill: color, stroke: '#000', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#222]">
        <div className="text-center">
          <div className="text-[10px] text-[#666] uppercase font-mono mb-1">First</div>
          <div className="text-lg font-black italic text-white">
            {progression.dataPoints[0]?.value || 0}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#666] uppercase font-mono mb-1">Current</div>
          <div className="text-lg font-black italic text-primary">
            {progression.dataPoints[progression.dataPoints.length - 1]?.value || 0}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#666] uppercase font-mono mb-1">Best</div>
          <div className="text-lg font-black italic text-green-400">
            {progression.best1RM}
          </div>
        </div>
      </div>
    </div>
  );
};

// Volume chart variant
interface VolumeChartProps {
  data: ProgressionDataPoint[];
  title: string;
  color?: string;
  height?: number;
}

export const VolumeChart: React.FC<VolumeChartProps> = ({
  data,
  title,
  color = '#00d9ff',
  height = 250
}) => {
  const chartData = data.map(point => ({
    date: new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    volume: Math.round(point.volume),
    fullDate: point.date
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0a0a0a] border border-[#00d9ff] p-3">
          <p className="text-xs font-bold text-white uppercase mb-2">{data.fullDate}</p>
          <p className="text-sm font-mono text-[#00d9ff]">
            Volume: <span className="font-black">{(data.volume / 1000).toFixed(1)}K LBS</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-[#111] border border-[#222] p-6 text-center">
        <p className="text-sm text-[#666] font-mono">No volume data available</p>
      </div>
    );
  }

  const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);
  const avgVolume = totalVolume / data.length;

  return (
    <div className="bg-[#111] border border-[#222] p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-black italic uppercase text-white">{title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[#666] font-mono uppercase">
              {data.length} SESSIONS
            </span>
            <span className="text-[10px] text-[#444]">•</span>
            <span className="text-[10px] text-[#666] font-mono uppercase">
              AVG: {(avgVolume / 1000).toFixed(1)}K LBS
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis
            dataKey="date"
            stroke="#666"
            tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={{ stroke: '#333' }}
          />
          <YAxis
            stroke="#666"
            tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={{ stroke: '#333' }}
            label={{ value: 'Volume (LBS)', angle: -90, position: 'insideLeft', fill: '#666', fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="volume"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6, fill: color, stroke: '#000', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressionChart;
