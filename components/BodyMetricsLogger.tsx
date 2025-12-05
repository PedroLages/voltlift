import React, { useState } from 'react';
import { Scale, Ruler, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useStore } from '../store/useStore';

export const BodyMetricsLogger: React.FC = () => {
  const { settings, dailyLogs, updateBodyweight, updateMeasurements, getBodyweightTrend, getLatestMeasurements } = useStore();

  const today = new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs[today];
  const latestMeasurements = getLatestMeasurements();

  const [bodyweight, setBodyweight] = useState(todayLog?.bodyweight?.toString() || settings.bodyweight?.toString() || '');
  const [showMeasurements, setShowMeasurements] = useState(false);

  // Measurement states
  const [chest, setChest] = useState(latestMeasurements?.chest?.toString() || '');
  const [waist, setWaist] = useState(latestMeasurements?.waist?.toString() || '');
  const [hips, setHips] = useState(latestMeasurements?.hips?.toString() || '');
  const [leftArm, setLeftArm] = useState(latestMeasurements?.leftArm?.toString() || '');
  const [rightArm, setRightArm] = useState(latestMeasurements?.rightArm?.toString() || '');
  const [leftThigh, setLeftThigh] = useState(latestMeasurements?.leftThigh?.toString() || '');
  const [rightThigh, setRightThigh] = useState(latestMeasurements?.rightThigh?.toString() || '');

  const handleSaveBodyweight = () => {
    const weight = parseFloat(bodyweight);
    if (!isNaN(weight) && weight > 0) {
      updateBodyweight(today, weight);
    }
  };

  const handleSaveMeasurements = () => {
    const measurements: any = {};
    if (chest) measurements.chest = parseFloat(chest);
    if (waist) measurements.waist = parseFloat(waist);
    if (hips) measurements.hips = parseFloat(hips);
    if (leftArm) measurements.leftArm = parseFloat(leftArm);
    if (rightArm) measurements.rightArm = parseFloat(rightArm);
    if (leftThigh) measurements.leftThigh = parseFloat(leftThigh);
    if (rightThigh) measurements.rightThigh = parseFloat(rightThigh);

    if (Object.keys(measurements).length > 0) {
      updateMeasurements(today, measurements);
    }
  };

  // Calculate trend from last 7 days
  const trend = getBodyweightTrend(7);
  const trendDirection = trend.length >= 2
    ? trend[trend.length - 1].weight - trend[0].weight
    : 0;

  const getTrendIcon = () => {
    if (Math.abs(trendDirection) < 0.5) return <Minus size={16} className="text-[#666]" />;
    if (trendDirection > 0) return <TrendingUp size={16} className="text-orange-500" />;
    return <TrendingDown size={16} className="text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Bodyweight Section */}
      <div className="bg-[#111] border border-[#222] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Scale size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase text-white">Bodyweight</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-2">
              Today's Weight ({settings.units})
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={bodyweight}
                onChange={(e) => setBodyweight(e.target.value)}
                onBlur={handleSaveBodyweight}
                placeholder={settings.bodyweight?.toString() || '0'}
                className="flex-1 bg-black border border-[#333] px-3 py-2 text-white font-mono text-lg focus:border-primary outline-none"
              />
              <button
                onClick={handleSaveBodyweight}
                className="px-4 py-2 bg-primary text-black font-bold uppercase text-xs hover:bg-white transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* 7-Day Trend */}
          {trend.length > 1 && (
            <div className="flex items-center justify-between p-3 bg-black border border-[#222]">
              <div className="flex items-center gap-2">
                {getTrendIcon()}
                <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest">7-Day Trend</span>
              </div>
              <span className="text-sm font-mono text-white">
                {trendDirection > 0 ? '+' : ''}{trendDirection.toFixed(1)} {settings.units}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body Measurements Section */}
      <div className="bg-[#111] border border-[#222] p-4">
        <button
          onClick={() => setShowMeasurements(!showMeasurements)}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center gap-2">
            <Ruler size={18} className="text-primary" />
            <h3 className="text-sm font-bold uppercase text-white">Body Measurements</h3>
          </div>
          <span className="text-[10px] text-[#666] uppercase font-bold">
            {showMeasurements ? 'Hide' : 'Show'}
          </span>
        </button>

        {showMeasurements && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Chest */}
              <div>
                <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-1">
                  Chest
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-black border border-[#333] px-2 py-1 text-white font-mono text-sm focus:border-primary outline-none"
                />
              </div>

              {/* Waist */}
              <div>
                <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-1">
                  Waist
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-black border border-[#333] px-2 py-1 text-white font-mono text-sm focus:border-primary outline-none"
                />
              </div>

              {/* Hips */}
              <div>
                <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-1">
                  Hips
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hips}
                  onChange={(e) => setHips(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-black border border-[#333] px-2 py-1 text-white font-mono text-sm focus:border-primary outline-none"
                />
              </div>

              {/* Left Arm */}
              <div>
                <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-1">
                  Left Arm
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={leftArm}
                  onChange={(e) => setLeftArm(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-black border border-[#333] px-2 py-1 text-white font-mono text-sm focus:border-primary outline-none"
                />
              </div>

              {/* Right Arm */}
              <div>
                <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-1">
                  Right Arm
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={rightArm}
                  onChange={(e) => setRightArm(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-black border border-[#333] px-2 py-1 text-white font-mono text-sm focus:border-primary outline-none"
                />
              </div>

              {/* Left Thigh */}
              <div>
                <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-1">
                  Left Thigh
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={leftThigh}
                  onChange={(e) => setLeftThigh(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-black border border-[#333] px-2 py-1 text-white font-mono text-sm focus:border-primary outline-none"
                />
              </div>

              {/* Right Thigh */}
              <div>
                <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-1">
                  Right Thigh
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={rightThigh}
                  onChange={(e) => setRightThigh(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-black border border-[#333] px-2 py-1 text-white font-mono text-sm focus:border-primary outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveMeasurements}
              className="w-full py-2 bg-[#222] text-white font-bold uppercase text-xs border border-[#444] hover:bg-[#333] transition-colors"
            >
              Save Measurements
            </button>

            <p className="text-[10px] text-[#444] font-mono text-center">
              All measurements in inches. Leave blank to skip.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BodyMetricsLogger;
