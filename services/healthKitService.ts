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
 */
export async function requestHealthPermissions(): Promise<boolean> {
  try {
    await Health.requestPermission({
      read: ['sleep', 'heart_rate_variability_sdnn', 'resting_heart_rate'],
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
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Sleep duration in hours
 */
export async function getSleepData(date: string): Promise<number> {
  try {
    const result = await Health.queryData({
      type: 'sleep',
      startDate: `${date}T00:00:00.000Z`,
      endDate: `${date}T23:59:59.999Z`
    });

    if (!result.data || result.data.length === 0) {
      return 0; // No sleep data available
    }

    // Sum all sleep sessions for this date
    const totalMinutes = result.data.reduce((sum: number, session: any) => {
      const start = new Date(session.startDate).getTime();
      const end = new Date(session.endDate).getTime();
      const minutes = (end - start) / (1000 * 60);
      return sum + minutes;
    }, 0);

    return Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal place
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
    const result = await Health.queryData({
      type: 'heart_rate_variability_sdnn',
      startDate: `${date}T00:00:00.000Z`,
      endDate: `${date}T23:59:59.999Z`
    });

    if (!result.data || result.data.length === 0) {
      return undefined;
    }

    // Calculate average HRV for the day
    const avgHRV = result.data.reduce((sum: number, reading: any) => {
      return sum + reading.value;
    }, 0) / result.data.length;

    return Math.round(avgHRV);
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
    const result = await Health.queryData({
      type: 'resting_heart_rate',
      startDate: `${date}T00:00:00.000Z`,
      endDate: `${date}T23:59:59.999Z`
    });

    if (!result.data || result.data.length === 0) {
      return undefined;
    }

    // Calculate average resting HR for the day
    const avgRHR = result.data.reduce((sum: number, reading: any) => {
      return sum + reading.value;
    }, 0) / result.data.length;

    return Math.round(avgRHR);
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
