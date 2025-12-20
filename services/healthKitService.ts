/**
 * HealthKit / Health Connect Integration Service
 *
 * Automatically imports health data from:
 * - iOS: HealthKit (Apple Health)
 * - Android: Health Connect (Google Health)
 *
 * Data imported:
 * - Sleep duration (for recovery score calculation)
 * - Heart rate variability (optional, for fatigue detection)
 * - Resting heart rate (optional, for recovery tracking)
 */

import { Health } from '@capgo/capacitor-health';
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
    const result = await Health.isAvailable();
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
 * NOTE: @capgo/capacitor-health only supports: steps, distance, calories, heartRate, weight
 * Sleep, HRV, and resting HR are NOT supported by this plugin
 */
export async function requestHealthPermissions(): Promise<boolean> {
  try {
    // Fixed: Use requestAuthorization() not requestPermission()
    // Limited to supported data types only
    await Health.requestAuthorization({
      read: ['heartRate'], // Only heartRate is supported from our original list
      write: [] // We only read, never write
    });
    return true;
  } catch (error) {
    console.error('HealthKit permission request failed:', error);
    return false;
  }
}

/**
 * Get sleep data for a specific date
 *
 * NOTE: Sleep data is NOT SUPPORTED by @capgo/capacitor-health
 * This function returns 0 and logs a warning
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Always returns 0 (sleep not supported)
 */
export async function getSleepData(date: string): Promise<number> {
  console.warn('Sleep data is not supported by @capgo/capacitor-health. Consider using manual input or switching to capacitor-health-extended.');
  return 0; // Sleep not supported by this plugin
}

/**
 * Get Heart Rate Variability (HRV) for a specific date
 * Higher HRV = better recovery
 *
 * NOTE: HRV is NOT SUPPORTED by @capgo/capacitor-health
 * This function returns undefined and logs a warning
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Always returns undefined (HRV not supported)
 */
export async function getHRVData(date: string): Promise<number | undefined> {
  console.warn('HRV data is not supported by @capgo/capacitor-health. Consider using manual input or switching to capacitor-health-extended.');
  return undefined; // HRV not supported by this plugin
}

/**
 * Get Resting Heart Rate for a specific date
 * Lower RHR = better fitness/recovery
 *
 * NOTE: Resting HR is NOT SUPPORTED by @capgo/capacitor-health
 * This function returns undefined and logs a warning
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Always returns undefined (resting HR not supported)
 */
export async function getRestingHRData(date: string): Promise<number | undefined> {
  console.warn('Resting heart rate is not supported by @capgo/capacitor-health. Consider using manual input or switching to capacitor-health-extended.');
  return undefined; // Resting HR not supported by this plugin
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
