// Weight conversion utilities

const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;

/**
 * Convert pounds to kilograms
 */
export const lbsToKg = (lbs: number): number => {
  return Math.round(lbs * LBS_TO_KG * 100) / 100;
};

/**
 * Convert kilograms to pounds
 */
export const kgToLbs = (kg: number): number => {
  return Math.round(kg * KG_TO_LBS * 100) / 100;
};

/**
 * Convert weight based on target unit
 * @param weight - Weight value to convert
 * @param fromUnit - Current unit ('lbs' or 'kg')
 * @param toUnit - Target unit ('lbs' or 'kg')
 */
export const convertWeight = (
  weight: number,
  fromUnit: 'lbs' | 'kg',
  toUnit: 'lbs' | 'kg'
): number => {
  if (fromUnit === toUnit) return weight;
  return fromUnit === 'lbs' ? lbsToKg(weight) : kgToLbs(weight);
};

/**
 * Format weight with unit label
 */
export const formatWeight = (weight: number, unit: 'lbs' | 'kg'): string => {
  return `${weight} ${unit.toUpperCase()}`;
};

/**
 * Get standard plate sets for each unit system
 * @param unit - Unit system ('lbs' or 'kg')
 * @param customPlates - Optional custom plates array (will use defaults if not provided)
 */
export const getPlateSet = (unit: 'lbs' | 'kg', customPlates?: number[]): number[] => {
  if (customPlates && customPlates.length > 0) {
    return [...customPlates].sort((a, b) => b - a); // Sort descending for greedy algorithm
  }
  if (unit === 'kg') {
    return [25, 20, 15, 10, 5, 2.5, 1.25];
  }
  return [45, 35, 25, 10, 5, 2.5];
};

/**
 * Get standard bar weight for each unit system
 */
export const getStandardBarWeight = (unit: 'lbs' | 'kg'): number => {
  return unit === 'kg' ? 20 : 45;
};

/**
 * Calculate which plates to load on each side of the bar
 * @param targetWeight - Total target weight including bar
 * @param barWeight - Weight of the bar
 * @param unit - Unit system to use
 * @param customPlates - Optional custom plates array (will use defaults if not provided)
 */
export const calculatePlateLoading = (
  targetWeight: number,
  barWeight: number,
  unit: 'lbs' | 'kg',
  customPlates?: number[]
): number[] => {
  if (targetWeight <= barWeight) return [];

  let remaining = (targetWeight - barWeight) / 2; // Weight per side
  const plates = getPlateSet(unit, customPlates);
  const result: number[] = [];

  plates.forEach(plateWeight => {
    while (remaining >= plateWeight) {
      result.push(plateWeight);
      remaining -= plateWeight;
    }
  });

  return result;
};
