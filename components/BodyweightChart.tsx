import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';

interface BodyweightChartProps {
  days?: number;
}

export const BodyweightChart: React.FC<BodyweightChartProps> = ({ days = 30 }) => {
  const { getBodyweightTrend, settings } = useStore();
  const trend = getBodyweightTrend(days);

  if (trend.length === 0) {
    return (
      <div className="bg-[#111] border border-[#222] p-6 text-center">
        <TrendingUp size={32} className="text-[#333] mx-auto mb-2" />
        <p className="text-sm text-[#666] font-mono">No bodyweight data yet</p>
        <p className="text-[10px] text-[#444] font-mono mt-1">Start logging to see trends</p>
      </div>
    );
  };

  // Calculate chart dimensions
  const maxWeight = Math.max(...trend.map(t => t.weight));
  const minWeight = Math.min(...trend.map(t => t.weight));
  const range = maxWeight - minWeight || 10; // Fallback range if all same weight
  const padding = range * 0.1; // 10% padding top/bottom

  const chartHeight = 200;
  const chartWidth = 100; // Percentage

  // Generate SVG points for line chart
  const points = trend.map((entry, index) => {
    // Handle single data point case to avoid NaN (division by zero)
    const x = trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100;
    const y = ((maxWeight + padding - entry.weight) / (range + 2 * padding)) * 100;
    return `${x},${y}`;
  }).join(' ');

  // Generate area fill
  const areaPoints = `0,100 ${points} 100,100`;

  // Calculate change
  const change = trend.length >= 2 ? trend[trend.length - 1].weight - trend[0].weight : 0;
  const changePercent = trend.length >= 2 ? ((change / trend[0].weight) * 100) : 0;

  return (
    <div className="bg-[#111] border border-[#222] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase text-white mb-1">Bodyweight Trend</h3>
          <p className="text-[10px] text-[#666] font-mono uppercase">Last {days} Days</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black italic text-white">
            {trend[trend.length - 1].weight.toFixed(1)}
            <span className="text-sm text-[#666] font-normal ml-1">{settings.units}</span>
          </div>
          <div className={`text-xs font-mono ${change >= 0 ? 'text-orange-500' : 'text-blue-500'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)} {settings.units} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 100 100`}
          preserveAspectRatio="none"
          className="absolute inset-0"
        >
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#222" strokeWidth="0.2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#222" strokeWidth="0.2" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#222" strokeWidth="0.2" />

          {/* Area fill */}
          <polygon
            points={areaPoints}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#ccff00"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {trend.map((entry, index) => {
            // Handle single data point case to avoid NaN (division by zero)
            const x = trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100;
            const y = ((maxWeight + padding - entry.weight) / (range + 2 * padding)) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1"
                fill="#ccff00"
                className="hover:r-2 transition-all"
              />
            );
          })}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ccff00" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ccff00" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-[#666] font-mono -ml-2">
          <span>{(maxWeight + padding).toFixed(0)}</span>
          <span>{((maxWeight + minWeight) / 2).toFixed(0)}</span>
          <span>{(minWeight - padding).toFixed(0)}</span>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex justify-between mt-2 text-[10px] text-[#444] font-mono">
        <span>{new Date(trend[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>{new Date(trend[trend.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
};

export default BodyweightChart;
