export interface Plate {
  weight: number;
  color: string; // For visual representation
  count?: number; // How many of this plate type
}

export interface PlateLoadout {
  platesPerSide: Plate[];
  totalWeight: number;
  barWeight: number;
  isExact: boolean; // Whether we hit the exact target weight
  difference: number; // Difference from target if not exact
}

// Standard plate sets (in lbs)
export const STANDARD_PLATES_LBS: Plate[] = [
  { weight: 45, color: '#e74c3c', count: 4 }, // Red
  { weight: 35, color: '#f39c12', count: 2 }, // Orange
  { weight: 25, color: '#3498db', count: 2 }, // Blue
  { weight: 10, color: '#2ecc71', count: 4 }, // Green
  { weight: 5, color: '#95a5a6', count: 2 },  // Gray
  { weight: 2.5, color: '#34495e', count: 2 } // Dark gray
];

// Standard plate sets (in kg)
export const STANDARD_PLATES_KG: Plate[] = [
  { weight: 25, color: '#e74c3c', count: 4 }, // Red
  { weight: 20, color: '#3498db', count: 2 }, // Blue
  { weight: 15, color: '#f39c12', count: 2 }, // Yellow
  { weight: 10, color: '#2ecc71', count: 4 }, // Green
  { weight: 5, color: '#95a5a6', count: 2 },  // White
  { weight: 2.5, color: '#e8e8e8', count: 2 }, // Light gray
  { weight: 1.25, color: '#34495e', count: 2 } // Dark gray
];

/**
 * Calculate the optimal plate combination for a given target weight
 * Uses greedy algorithm: largest plates first
 */
export function calculatePlateLoadout(
  targetWeight: number,
  barWeight: number = 45,
  availablePlates: Plate[] = STANDARD_PLATES_LBS,
  units: 'lbs' | 'kg' = 'lbs'
): PlateLoadout {
  // Weight to load on the bar (minus the bar itself)
  const weightToLoad = targetWeight - barWeight;

  if (weightToLoad <= 0) {
    return {
      platesPerSide: [],
      totalWeight: barWeight,
      barWeight,
      isExact: targetWeight === barWeight,
      difference: targetWeight - barWeight
    };
  }

  // Weight per side (divide by 2)
  const weightPerSide = weightToLoad / 2;

  // Sort plates by weight descending
  const sortedPlates = [...availablePlates].sort((a, b) => b.weight - a.weight);

  // Greedy algorithm to find plate combination
  const platesPerSide: Plate[] = [];
  let remainingWeight = weightPerSide;

  for (const plate of sortedPlates) {
    if (!plate.count || plate.count === 0) continue;

    // How many of this plate can we use?
    let usedCount = 0;
    const maxCount = plate.count || 0;

    while (remainingWeight >= plate.weight && usedCount < maxCount) {
      platesPerSide.push({ ...plate });
      remainingWeight -= plate.weight;
      usedCount++;
    }
  }

  // Calculate actual total weight
  const actualWeightPerSide = platesPerSide.reduce((sum, p) => sum + p.weight, 0);
  const totalWeight = barWeight + (actualWeightPerSide * 2);

  return {
    platesPerSide,
    totalWeight,
    barWeight,
    isExact: Math.abs(totalWeight - targetWeight) < 0.01, // Account for floating point
    difference: totalWeight - targetWeight
  };
}

/**
 * Get a grouped/condensed view of plates for display
 * e.g., [45, 45, 25, 10] => [{weight: 45, count: 2}, {weight: 25, count: 1}, {weight: 10, count: 1}]
 */
export function groupPlates(plates: Plate[]): Array<{ weight: number; count: number; color: string }> {
  const grouped = new Map<number, { count: number; color: string }>();

  plates.forEach(plate => {
    const existing = grouped.get(plate.weight);
    if (existing) {
      existing.count++;
    } else {
      grouped.set(plate.weight, { count: 1, color: plate.color });
    }
  });

  return Array.from(grouped.entries())
    .map(([weight, { count, color }]) => ({ weight, count, color }))
    .sort((a, b) => b.weight - a.weight); // Sort by weight descending
}

/**
 * Convert weight between units
 */
export function convertWeight(weight: number, from: 'lbs' | 'kg', to: 'lbs' | 'kg'): number {
  if (from === to) return weight;
  if (from === 'lbs' && to === 'kg') return weight * 0.453592;
  if (from === 'kg' && to === 'lbs') return weight * 2.20462;
  return weight;
}

/**
 * Get standard bar weight for unit
 */
export function getStandardBarWeight(units: 'lbs' | 'kg'): number {
  return units === 'lbs' ? 45 : 20;
}

/**
 * Validate if a weight is achievable with available plates
 */
export function isWeightAchievable(
  targetWeight: number,
  barWeight: number,
  availablePlates: Plate[]
): boolean {
  const loadout = calculatePlateLoadout(targetWeight, barWeight, availablePlates);
  return loadout.isExact;
}
