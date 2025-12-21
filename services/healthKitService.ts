/**
 * HealthKit / Health Connect Integration Service
 *
 * Automatically imports health data from:
 * - iOS: HealthKit (Apple Health)
 * - Android: Health Connect (Google Health)
 *
 * Data imported:
 * - Sleep duration (for recovery score calculation)
 * - Heart rate variability (for fatigue detection)
 * - Resting heart rate (for recovery tracking)
 * - Heart rate (for workout intensity)
 *
 * Uses: @flomentumsolutions/capacitor-health-extended
 * Supports: sleep, hrv, resting-heart-rate, heart-rate, and 25+ other metrics
 */

import { Health } from '@flomentumsolutions/capacitor-health-extended';
import { Capacitor } from '@capacitor/core';

export interface HealthData {
  sleepHours: number;
  hrv?: number; // Heart Rate Variability (ms)
  restingHR?: number; // Resting Heart Rate (bpm)
  date: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Check if HealthKit/Health Connect is available on this device
 */
export async function isHealthKitAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false; // Web doesn't support health data
  }

  try {
    const result = await Health.isHealthAvailable();
    return result.available;
  } catch (error) {
    console.error('HealthKit availability check failed:', error);
    return false;
  }
}

/**
 * Request permissions to read health data
 * Call this during onboarding or when user enables the feature
 *
 * Requests permissions for:
 * - READ_SLEEP - Sleep duration and quality
 * - READ_HRV - Heart rate variability (recovery indicator)
 * - READ_RESTING_HEART_RATE - Resting heart rate (fitness indicator)
 * - READ_HEART_RATE - Active heart rate (workout intensity)
 */
export async function requestHealthPermissions(): Promise<boolean> {
  try {
    const result = await Health.requestHealthPermissions({
      permissions: [
        'READ_SLEEP',
        'READ_HRV',
        'READ_RESTING_HEART_RATE',
        'READ_HEART_RATE'
      ]
    });

    // Check if at least one permission was granted
    const granted = result.permissions.some(p => p.granted);

    if (!granted) {
      console.warn('No health permissions granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('HealthKit permission request failed:', error);
    return false;
  }
}

/**
 * Get sleep data for a specific date
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Sleep duration in hours
 */
export async function getSleepData(date: string): Promise<number> {
  try {
    // Query aggregated sleep data for the day
    const result = await Health.queryAggregated({
      dataType: 'sleep',
      startDate: `${date}T00:00:00.000Z`,
      endDate: `${date}T23:59:59.999Z`,
      bucket: 'day'
    });

    if (!result.samples || result.samples.length === 0) {
      return 0; // No sleep data available
    }

    // Get total sleep minutes for the day
    const totalMinutes = result.samples.reduce((sum, sample) => {
      return sum + (sample.value || 0);
    }, 0);

    // Convert minutes to hours with 1 decimal place
    return Math.round((totalMinutes / 60) * 10) / 10;
  } catch (error) {
    console.error('Failed to fetch sleep data:', error);
    return 0;
  }
}

/**
 * Get Heart Rate Variability (HRV) for a specific date
 * Higher HRV = better recovery
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns HRV in milliseconds (average for the day)
 */
export async function getHRVData(date: string): Promise<number | undefined> {
  try {
    // Query latest HRV sample (typically morning measurement)
    const result = await Health.queryLatestSample({
      dataType: 'hrv'
    });

    if (!result.sample || !result.sample.value) {
      return undefined;
    }

    // Check if sample is from the requested date
    const sampleDate = new Date(result.sample.timestamp).toISOString().split('T')[0];
    if (sampleDate !== date) {
      return undefined; // Sample not from requested date
    }

    return Math.round(result.sample.value);
  } catch (error) {
    console.error('Failed to fetch HRV data:', error);
    return undefined;
  }
}

/**
 * Get Resting Heart Rate for a specific date
 * Lower RHR = better fitness/recovery
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Resting HR in bpm (average for the day)
 */
export async function getRestingHRData(date: string): Promise<number | undefined> {
  try {
    // Query latest resting HR sample
    const result = await Health.queryLatestSample({
      dataType: 'resting-heart-rate'
    });

    if (!result.sample || !result.sample.value) {
      return undefined;
    }

    // Check if sample is from the requested date
    const sampleDate = new Date(result.sample.timestamp).toISOString().split('T')[0];
    if (sampleDate !== date) {
      return undefined; // Sample not from requested date
    }

    return Math.round(result.sample.value);
  } catch (error) {
    console.error('Failed to fetch resting HR data:', error);
    return undefined;
  }
}

/**
 * Get all health data for a specific date
 * This is the main function to call from the app
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Complete health data for the day
 */
export async function getHealthDataForDate(date: string): Promise<HealthData> {
  const [sleepHours, hrv, restingHR] = await Promise.all([
    getSleepData(date),
    getHRVData(date),
    getRestingHRData(date)
  ]);

  return {
    sleepHours,
    hrv,
    restingHR,
    date
  };
}

/**
 * Auto-import health data for the last N days
 * Call this when user enables HealthKit integration
 *
 * @param daysBack - Number of days to import (default 30)
 * @returns Array of health data for each day
 */
export async function importHistoricalHealthData(daysBack: number = 30): Promise<HealthData[]> {
  const healthData: HealthData[] = [];
  const today = new Date();

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    const data = await getHealthDataForDate(dateStr);
    healthData.push(data);
  }

  return healthData;
}
