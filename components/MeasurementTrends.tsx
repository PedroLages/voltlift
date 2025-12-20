import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { BodyMeasurements } from '../types';

type MeasurementKey = keyof BodyMeasurements;

interface MeasurementData {
  date: string;
  value: number;
}

export const MeasurementTrends: React.FC = () => {
  const { dailyLogs } = useStore();
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementKey>('chest');

  // Get all measurement data
  const measurementOptions: { key: MeasurementKey; label: string }[] = [
    { key: 'chest', label: 'Chest' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
    { key: 'leftArm', label: 'Left Arm' },
    { key: 'rightArm', label: 'Right Arm' },
    { key: 'leftThigh', label: 'Left Thigh' },
    { key: 'rightThigh', label: 'Right Thigh' },
    { key: 'neck', label: 'Neck' },
    { key: 'shoulders', label: 'Shoulders' },
    { key: 'leftCalf', label: 'Left Calf' },
    { key: 'rightCalf', label: 'Right Calf' },
  ];

  // Extract measurement data for selected measurement
  const getMeasurementData = (measurementKey: MeasurementKey): MeasurementData[] => {
    return Object.values(dailyLogs)
      .filter(log => log.measurements?.[measurementKey] !== undefined)
      .map(log => ({
        date: log.date,
        value: log.measurements![measurementKey]!
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const data = getMeasurementData(selectedMeasurement);

  // Calculate stats
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const firstValue = data.length > 0 ? data[0].value : 0;
  const change = latestValue - firstValue;
  const changePercent = firstValue > 0 ? ((change / firstValue) * 100) : 0;

  // Calculate min/max for summary cards
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;
  const minValue = data.length > 0 ? Math.min(...data.map(d => d.value)) : 0;

  // Chart rendering
  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <TrendingUp size={32} className="text-[#333] mx-auto mb-2" />
          <p className="text-sm text-[#666] font-mono">No data for {measurementOptions.find(m => m.key === selectedMeasurement)?.label}</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Start logging measurements to see trends</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 10;
    const padding = range * 0.1;

    const chartHeight = 200;

    // Generate SVG points
    const points = data.map((entry, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((maxValue + padding - entry.value) / (range + 2 * padding)) * 100;
      return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,100 ${points} 100,100`;

    return (
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
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
            fill="url(#measurement-gradient)"
            opacity="0.3"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((entry, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = ((maxValue + padding - entry.value) / (range + 2 * padding)) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1"
                fill="#3b82f6"
              />
            );
          })}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="measurement-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-[#666] font-mono -ml-2">
          <span>{(maxValue + padding).toFixed(1)}</span>
          <span>{((maxValue + minValue) / 2).toFixed(1)}</span>
          <span>{(minValue - padding).toFixed(1)}</span>
        </div>
      </div>
    );
  };

  const getTrendIcon = () => {
    if (Math.abs(change) < 0.5) return <Minus size={16} className="text-[#666]" />;
    if (change > 0) return <TrendingUp size={16} className="text-blue-500" />;
    return <TrendingDown size={16} className="text-orange-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Measurement Selector */}
      <div className="bg-[#111] border border-[#222] p-4">
        <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-3">
          Select Measurement
        </label>
        <div className="grid grid-cols-3 gap-2">
          {measurementOptions.map((option) => {
            const optionData = getMeasurementData(option.key);
            const hasData = optionData.length > 0;
            return (
              <button
                key={option.key}
                onClick={() => setSelectedMeasurement(option.key)}
                disabled={!hasData}
                className={`p-2 border text-[10px] font-bold uppercase transition-colors ${
                  selectedMeasurement === option.key
                    ? 'border-primary bg-primary/10 text-white'
                    : hasData
                    ? 'border-[#333] text-[#666] hover:border-[#555] hover:text-white'
                    : 'border-[#222] text-[#333] cursor-not-allowed opacity-50'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#111] border border-[#222] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase text-white mb-1">
              {measurementOptions.find(m => m.key === selectedMeasurement)?.label} Trend
            </h3>
            <p className="text-[10px] text-[#666] font-mono uppercase">
              {data.length} Measurements
            </p>
          </div>
          {data.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-black italic text-white">
                {latestValue.toFixed(1)}
                <span className="text-sm text-[#666] font-normal ml-1">in</span>
              </div>
              <div className={`text-xs font-mono flex items-center justify-end gap-1 ${
                Math.abs(change) < 0.5 ? 'text-[#666]' : change >= 0 ? 'text-blue-500' : 'text-orange-500'
              }`}>
                {getTrendIcon()}
                {change >= 0 ? '+' : ''}{change.toFixed(1)} in ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        {renderChart()}

        {/* Date Range */}
        {data.length > 0 && (
          <div className="flex justify-between mt-2 text-[10px] text-[#444] font-mono">
            <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111] border border-[#222] p-4">
            <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">Peak</div>
            <div className="text-2xl font-black italic text-white">{maxValue.toFixed(1)}<span className="text-sm text-[#666] font-normal ml-1">in</span></div>
          </div>
          <div className="bg-[#111] border border-[#222] p-4">
            <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">Lowest</div>
            <div className="text-2xl font-black italic text-white">{minValue.toFixed(1)}<span className="text-sm text-[#666] font-normal ml-1">in</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementTrends;
