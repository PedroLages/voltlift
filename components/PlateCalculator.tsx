import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Minus, RotateCcw } from 'lucide-react';
import {
  calculatePlateLoadout,
  groupPlates,
  STANDARD_PLATES_LBS,
  STANDARD_PLATES_KG,
  getStandardBarWeight,
  type Plate,
  type PlateLoadout
} from '../services/plateCalculator';

interface PlateCalculatorProps {
  units?: 'lbs' | 'kg';
  barWeight?: number;
  onClose?: () => void;
}

export const PlateCalculator: React.FC<PlateCalculatorProps> = ({
  units = 'lbs' as const,
  barWeight: initialBarWeight,
  onClose
}) => {
  const defaultBarWeight = initialBarWeight || getStandardBarWeight(units);
  const [targetWeight, setTargetWeight] = useState<string>('135');
  const [barWeight, setBarWeight] = useState<number>(defaultBarWeight);
  const [loadout, setLoadout] = useState<PlateLoadout | null>(null);

  const availablePlates = units === 'lbs' ? STANDARD_PLATES_LBS : STANDARD_PLATES_KG;

  // Calculate loadout whenever inputs change
  useEffect(() => {
    const weight = parseFloat(targetWeight);
    if (!isNaN(weight) && weight > 0) {
      const result = calculatePlateLoadout(weight, barWeight, availablePlates, units);
      setLoadout(result);
    } else {
      setLoadout(null);
    }
  }, [targetWeight, barWeight, units]);

  const increment = units === 'lbs' ? 5 : 2.5;

  const handleIncrement = () => {
    const current = parseFloat(targetWeight) || 0;
    setTargetWeight((current + increment).toString());
  };

  const handleDecrement = () => {
    const current = parseFloat(targetWeight) || 0;
    const newValue = Math.max(0, current - increment);
    setTargetWeight(newValue.toString());
  };

  const handleReset = () => {
    setTargetWeight(units === 'lbs' ? '135' : '60');
    setBarWeight(defaultBarWeight);
  };

  // Visual bar component
  const BarVisualization = ({ loadout }: { loadout: PlateLoadout }) => {
    const groupedPlates = groupPlates(loadout.platesPerSide);

    return (
      <div className="bg-[#0a0a0a] border border-[#333] p-6 overflow-x-auto">
        <div className="flex items-center justify-center gap-2 min-w-max">
          {/* Left plates */}
          <div className="flex items-center gap-1">
            {loadout.platesPerSide.map((plate, idx) => (
              <div
                key={`left-${idx}`}
                className="flex flex-col items-center"
                style={{
                  width: `${Math.max(30, plate.weight * 1.5)}px`,
                  height: `${Math.max(60, plate.weight * 2)}px`,
                  backgroundColor: plate.color,
                  border: '2px solid #000',
                  borderRadius: '4px'
                }}
              >
                <span className="text-[10px] font-bold text-white mt-auto mb-auto">
                  {plate.weight}
                </span>
              </div>
            ))}
          </div>

          {/* Bar */}
          <div className="relative">
            <div
              className="bg-[#444] border-2 border-[#666]"
              style={{ width: '200px', height: '12px', borderRadius: '6px' }}
            />
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] font-mono text-[#888] uppercase">
              Bar: {barWeight} {units}
            </div>
          </div>

          {/* Right plates (mirror of left) */}
          <div className="flex items-center gap-1">
            {loadout.platesPerSide.map((plate, idx) => (
              <div
                key={`right-${idx}`}
                className="flex flex-col items-center"
                style={{
                  width: `${Math.max(30, plate.weight * 1.5)}px`,
                  height: `${Math.max(60, plate.weight * 2)}px`,
                  backgroundColor: plate.color,
                  border: '2px solid #000',
                  borderRadius: '4px'
                }}
              >
                <span className="text-[10px] font-bold text-white mt-auto mb-auto">
                  {plate.weight}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const groupedPlates = loadout ? groupPlates(loadout.platesPerSide) : [];

  return (
    <div className="bg-[#111] border border-[#222] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calculator size={20} className="text-primary" />
          <h2 className="text-xl font-black italic uppercase text-white">Plate Calculator</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white text-sm font-bold uppercase"
          >
            Close
          </button>
        )}
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        {/* Target Weight Input */}
        <div>
          <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
            Target Weight
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrement}
              className="p-3 bg-[#222] border border-[#333] hover:border-primary transition-colors"
            >
              <Minus size={16} className="text-white" />
            </button>
            <input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="flex-1 bg-[#222] border border-[#333] p-3 text-white text-center font-mono text-2xl outline-none focus:border-primary"
              placeholder="135"
            />
            <span className="text-white font-mono text-sm w-12">{units.toUpperCase()}</span>
            <button
              onClick={handleIncrement}
              className="p-3 bg-[#222] border border-[#333] hover:border-primary transition-colors"
            >
              <Plus size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Bar Weight Selection */}
        <div>
          <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2 block">
            Bar Weight
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setBarWeight(units === 'lbs' ? 45 : 20)}
              className={`flex-1 py-2 text-xs font-bold uppercase ${
                barWeight === (units === 'lbs' ? 45 : 20)
                  ? 'bg-primary text-black'
                  : 'bg-[#222] text-[#666] border border-[#333] hover:border-primary'
              }`}
            >
              Standard ({units === 'lbs' ? '45' : '20'} {units})
            </button>
            <button
              onClick={() => setBarWeight(units === 'lbs' ? 35 : 15)}
              className={`flex-1 py-2 text-xs font-bold uppercase ${
                barWeight === (units === 'lbs' ? 35 : 15)
                  ? 'bg-primary text-black'
                  : 'bg-[#222] text-[#666] border border-[#333] hover:border-primary'
              }`}
            >
              Women's ({units === 'lbs' ? '35' : '15'} {units})
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-[#222] border border-[#333] hover:border-primary transition-colors"
              title="Reset"
            >
              <RotateCcw size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loadout && (
        <div className="space-y-6">
          {/* Bar Visualization */}
          <div>
            <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3">
              Bar Loadout
            </h3>
            <BarVisualization loadout={loadout} />
          </div>

          {/* Plate List */}
          <div>
            <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3">
              Plates Per Side
            </h3>
            <div className="bg-[#0a0a0a] border border-[#333] p-4">
              {groupedPlates.length > 0 ? (
                <div className="space-y-2">
                  {groupedPlates.map((plate, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-white font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 border border-black"
                          style={{ backgroundColor: plate.color }}
                        />
                        <span className="text-sm">
                          {plate.weight} {units}
                        </span>
                      </div>
                      <span className="text-xs text-[#666]">× {plate.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#666] font-mono text-sm">
                  No plates needed (bar only)
                </p>
              )}
            </div>
          </div>

          {/* Weight Summary */}
          <div className="bg-[#0a0a0a] border border-[#333] p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-[#666] uppercase font-mono mb-1">
                  Actual Total
                </div>
                <div className={`text-2xl font-black italic ${
                  loadout.isExact ? 'text-primary' : 'text-orange-400'
                }`}>
                  {loadout.totalWeight} {units}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#666] uppercase font-mono mb-1">
                  Difference
                </div>
                <div className={`text-2xl font-black italic ${
                  loadout.isExact ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {loadout.difference >= 0 ? '+' : ''}{loadout.difference.toFixed(1)} {units}
                </div>
              </div>
            </div>
            {!loadout.isExact && (
              <p className="text-[10px] text-orange-400 font-mono mt-3 text-center uppercase">
                Closest achievable weight with available plates
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlateCalculator;
