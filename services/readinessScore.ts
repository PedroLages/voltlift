/**
 * Readiness Score Service
 *
 * Calculates daily readiness score (0-100) from user inputs:
 * - Sleep quality (1-5)
 * - Perceived recovery (1-5)
 * - Soreness level (1-5)
 * - Stress level (1-5)
 *
 * Used to guide workout intensity recommendations.
 */

export interface ReadinessInputs {
  sleepQuality: number; // 1-5 scale (1 = terrible, 5 = excellent)
  perceivedRecovery: number; // 1-5 scale (1 = exhausted, 5 = fully recovered)
  sorenessLevel: number; // 1-5 scale (1 = severe, 5 = no soreness)
  stressLevel: number; // 1-5 scale (1 = very stressed, 5 = relaxed)
}

export interface ReadinessResult {
  score: number; // 0-100
  category: 'red' | 'yellow' | 'green'; // Red: <60, Yellow: 60-79, Green: 80+
  recommendation: string;
  adjustmentFactor: number; // 0.7-1.2 multiplier for volume/intensity
}

/**
 * Calculate readiness score from user inputs
 *
 * Weights:
 * - Sleep: 35% (most important for recovery)
 * - Perceived Recovery: 30%
 * - Soreness: 20%
 * - Stress: 15%
 */
export function calculateReadinessScore(inputs: ReadinessInputs): ReadinessResult {
  // Validate inputs
  const { sleepQuality, perceivedRecovery, sorenessLevel, stressLevel } = inputs;

  if (!isValidInput(sleepQuality) || !isValidInput(perceivedRecovery) ||
      !isValidInput(sorenessLevel) || !isValidInput(stressLevel)) {
    throw new Error('All inputs must be between 1-5');
  }

  // Convert 1-5 scale to 0-100 scale (normalize)
  const sleepScore = ((sleepQuality - 1) / 4) * 100;
  const recoveryScore = ((perceivedRecovery - 1) / 4) * 100;
  const sorenessScore = ((sorenessLevel - 1) / 4) * 100;
  const stressScore = ((stressLevel - 1) / 4) * 100;

  // Weighted average
  const weightedScore =
    (sleepScore * 0.35) +
    (recoveryScore * 0.30) +
    (sorenessScore * 0.20) +
    (stressScore * 0.15);

  // Round to whole number
  const score = Math.round(weightedScore);

  // Determine category
  let category: ReadinessResult['category'];
  let recommendation: string;
  let adjustmentFactor: number;

  if (score >= 80) {
    category = 'green';
    recommendation = 'Full gas! You\'re primed for a PR session.';
    adjustmentFactor = 1.1; // 10% volume boost
  } else if (score >= 60) {
    category = 'yellow';
    recommendation = 'Good to train, but listen to your body.';
    adjustmentFactor = 1.0; // Normal volume
  } else {
    category = 'red';
    recommendation = 'Scale back today. Focus on technique over load.';
    adjustmentFactor = 0.8; // 20% volume reduction
  }

  return {
    score,
    category,
    recommendation,
    adjustmentFactor,
  };
}

/**
 * Validate input is within 1-5 range
 */
function isValidInput(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * Get readiness category color hex
 */
export function getReadinessColor(category: ReadinessResult['category']): string {
  switch (category) {
    case 'green':
      return '#22c55e'; // green-500
    case 'yellow':
      return '#eab308'; // yellow-500
    case 'red':
      return '#ef4444'; // red-500
  }
}

/**
 * Get readiness category text color class
 */
export function getReadinessTextColor(category: ReadinessResult['category']): string {
  switch (category) {
    case 'green':
      return 'text-green-500';
    case 'yellow':
      return 'text-yellow-500';
    case 'red':
      return 'text-red-500';
  }
}

/**
 * Get readiness category background color class
 */
export function getReadinessBgColor(category: ReadinessResult['category']): string {
  switch (category) {
    case 'green':
      return 'bg-green-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'red':
      return 'bg-red-500';
  }
}
