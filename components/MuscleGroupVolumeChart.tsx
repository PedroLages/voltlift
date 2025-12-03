import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { MuscleGroupVolume, VolumeBalanceScore } from '../services/progressionData';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface MuscleGroupVolumeChartProps {
  distribution: MuscleGroupVolume[];
  balanceScore?: VolumeBalanceScore;
  height?: number;
}

// Color palette for muscle groups
const MUSCLE_COLORS: Record<string, string> = {
  'Chest': '#e74c3c',
  'Back': '#3498db',
  'Legs': '#2ecc71',
  'Shoulders': '#f39c12',
  'Arms': '#9b59b6',
  'Core': '#1abc9c',
  'Cardio': '#34495e'
};

const getColorForMuscle = (muscle: string): string => {
  return MUSCLE_COLORS[muscle] || '#95a5a6';
};

export const MuscleGroupVolumeChart: React.FC<MuscleGroupVolumeChartProps> = ({
  distribution,
  balanceScore,
  height = 300
}) => {
  if (distribution.length === 0) {
    return (
      <div className="bg-[#111] border border-[#222] p-6 text-center">
        <p className="text-sm text-[#666] font-mono">No volume data available</p>
      </div>
    );
  }

  // Prepare data for pie chart
  const chartData = distribution.map(d => ({
    name: d.muscleGroup,
    value: d.totalVolume,
    percentage: d.percentage,
    workouts: d.workoutCount
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0a0a0a] border border-primary p-3">
          <p className="text-xs font-bold text-white uppercase mb-2">{data.name}</p>
          <p className="text-sm font-mono text-primary">
            Volume: <span className="font-black">{(data.value / 1000).toFixed(1)}K LBS</span>
          </p>
          <p className="text-xs font-mono text-[#888] mt-1">
            {data.percentage.toFixed(1)}% • {data.workouts} workouts
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs font-mono">
            <div
              className="w-3 h-3"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white">{entry.value}</span>
            <span className="text-[#666] ml-auto">{entry.payload.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#111] border border-[#222] p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-black italic uppercase text-white">Muscle Group Distribution</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[#666] font-mono uppercase">
              {distribution.length} MUSCLE GROUPS
            </span>
            <span className="text-[10px] text-[#444]">•</span>
            <span className="text-[10px] text-[#666] font-mono uppercase">
              TOTAL: {(distribution.reduce((sum, d) => sum + d.totalVolume, 0) / 1000).toFixed(1)}K LBS
            </span>
          </div>
        </div>

        {/* Balance Score Badge */}
        {balanceScore && (
          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] px-3 py-2">
            {balanceScore.score >= 80 ? (
              <CheckCircle size={16} className="text-green-400" />
            ) : balanceScore.score >= 60 ? (
              <TrendingUp size={16} className="text-yellow-400" />
            ) : (
              <AlertCircle size={16} className="text-orange-400" />
            )}
            <div className="text-right">
              <div className="text-[10px] text-[#666] uppercase font-mono">Balance</div>
              <div className={`text-sm font-bold font-mono ${
                balanceScore.score >= 80 ? 'text-green-400' :
                balanceScore.score >= 60 ? 'text-yellow-400' :
                'text-orange-400'
              }`}>
                {balanceScore.score}/100
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColorForMuscle(entry.name)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>

      {/* Balance Recommendation */}
      {balanceScore && (
        <div className="mt-4 p-3 bg-[#0a0a0a] border border-[#333]">
          <p className="text-xs text-[#888] font-mono leading-relaxed">
            {balanceScore.recommendation}
          </p>
        </div>
      )}

      {/* Top/Bottom Performers */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#222]">
        <div className="text-center">
          <div className="text-[10px] text-[#666] uppercase font-mono mb-1">Most Trained</div>
          <div className="text-lg font-black italic text-primary">
            {distribution[0]?.muscleGroup || 'N/A'}
          </div>
          <div className="text-[10px] text-[#444] font-mono">
            {distribution[0]?.percentage.toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#666] uppercase font-mono mb-1">Least Trained</div>
          <div className="text-lg font-black italic text-orange-400">
            {distribution[distribution.length - 1]?.muscleGroup || 'N/A'}
          </div>
          <div className="text-[10px] text-[#444] font-mono">
            {distribution[distribution.length - 1]?.percentage.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuscleGroupVolumeChart;
