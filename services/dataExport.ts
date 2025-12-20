/**
 * Data Export Service
 * Provides functionality to export workout data in various formats
 */

import { WorkoutSession, ExerciseLog, SetLog, UserSettings, DailyLog } from '../types';
import { EXERCISE_LIBRARY } from '../constants';

// ============================================================================
// Types
// ============================================================================

export interface ExportOptions {
  includeWorkouts: boolean;
  includeTemplates: boolean;
  includePersonalRecords: boolean;
  includeBodyMetrics: boolean;
  dateRange?: { start: Date; end: Date };
  format: 'csv' | 'json';
}

export interface WorkoutExportRow {
  date: string;
  workoutName: string;
  exercise: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  setType: string;
  completed: boolean;
  volume: number;
}

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Export workouts to CSV format
 */
export function exportWorkoutsToCSV(
  workouts: WorkoutSession[],
  options?: { dateRange?: { start: Date; end: Date } }
): string {
  let filtered = workouts.filter(w => w.status === 'completed');

  // Apply date filter if provided
  if (options?.dateRange) {
    const { start, end } = options.dateRange;
    filtered = filtered.filter(w => {
      const date = new Date(w.startTime);
      return date >= start && date <= end;
    });
  }

  // Sort by date
  filtered.sort((a, b) => a.startTime - b.startTime);

  // Build CSV rows
  const rows: WorkoutExportRow[] = [];

  for (const workout of filtered) {
    const date = new Date(workout.startTime).toISOString().split('T')[0];

    for (const log of workout.logs) {
      const exercise = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
      const exerciseName = exercise?.name || log.exerciseId;

      log.sets.forEach((set, index) => {
        rows.push({
          date,
          workoutName: workout.name,
          exercise: exerciseName,
          setNumber: index + 1,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe || null,
          setType: set.type || 'N',
          completed: set.completed,
          volume: set.completed ? set.weight * set.reps : 0,
        });
      });
    }
  }

  // Generate CSV
  const headers = [
    'Date',
    'Workout',
    'Exercise',
    'Set',
    'Weight',
    'Reps',
    'RPE',
    'Type',
    'Completed',
    'Volume',
  ];

  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      [
        row.date,
        `"${row.workoutName}"`,
        `"${row.exercise}"`,
        row.setNumber,
        row.weight,
        row.reps,
        row.rpe || '',
        row.setType,
        row.completed ? 'Yes' : 'No',
        row.volume,
      ].join(',')
    ),
  ];

  return csvRows.join('\n');
}

/**
 * Export personal records to CSV
 */
export function exportPRsToCSV(
  personalRecords: UserSettings['personalRecords']
): string {
  const headers = ['Exercise', 'Weight PR', 'Volume PR', 'Reps PR', 'Est 1RM', 'Date'];
  const rows: string[] = [headers.join(',')];

  for (const [exerciseId, pr] of Object.entries(personalRecords)) {
    const exercise = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
    const exerciseName = exercise?.name || exerciseId;

    rows.push(
      [
        `"${exerciseName}"`,
        pr.weight?.value || '',
        pr.volume?.value || '',
        pr.reps?.value || '',
        pr.estimated1RM?.toFixed(1) || '',
        pr.weight?.date ? new Date(pr.weight.date).toISOString().split('T')[0] : '',
      ].join(',')
    );
  }

  return rows.join('\n');
}

/**
 * Export body metrics to CSV
 */
export function exportBodyMetricsToCSV(
  dailyLogs: Record<string, DailyLog>
): string {
  const headers = [
    'Date',
    'Bodyweight',
    'Sleep Hours',
    'Water Oz',
    'Chest',
    'Waist',
    'Hips',
    'Left Arm',
    'Right Arm',
    'Left Thigh',
    'Right Thigh',
  ];
  const rows: string[] = [headers.join(',')];

  // Sort by date
  const sortedDates = Object.keys(dailyLogs).sort();

  for (const date of sortedDates) {
    const log = dailyLogs[date];
    rows.push(
      [
        date,
        log.bodyweight || '',
        log.sleepHours || '',
        log.waterOz || '',
        log.measurements?.chest || '',
        log.measurements?.waist || '',
        log.measurements?.hips || '',
        log.measurements?.leftArm || '',
        log.measurements?.rightArm || '',
        log.measurements?.leftThigh || '',
        log.measurements?.rightThigh || '',
      ].join(',')
    );
  }

  return rows.join('\n');
}

// ============================================================================
// JSON Export
// ============================================================================

/**
 * Export all data to JSON format (for backup)
 */
export function exportAllToJSON(data: {
  workouts: WorkoutSession[];
  templates: WorkoutSession[];
  settings: UserSettings;
  dailyLogs: Record<string, DailyLog>;
}): string {
  const exportData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    data: {
      workouts: data.workouts.filter(w => w.status === 'completed'),
      templates: data.templates,
      personalRecords: data.settings.personalRecords,
      bodyMetrics: data.dailyLogs,
      userSettings: {
        name: data.settings.name,
        units: data.settings.units,
        goal: data.settings.goal,
        experienceLevel: data.settings.experienceLevel,
        bodyweight: data.settings.bodyweight,
        gender: data.settings.gender,
      },
    },
  };

  return JSON.stringify(exportData, null, 2);
}

// ============================================================================
// Download Helpers
// ============================================================================

/**
 * Trigger file download in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download workouts as CSV
 */
export function downloadWorkoutsCSV(workouts: WorkoutSession[]): void {
  const csv = exportWorkoutsToCSV(workouts);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(csv, `voltlift-workouts-${date}.csv`, 'text/csv');
}

/**
 * Download PRs as CSV
 */
export function downloadPRsCSV(personalRecords: UserSettings['personalRecords']): void {
  const csv = exportPRsToCSV(personalRecords);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(csv, `voltlift-prs-${date}.csv`, 'text/csv');
}

/**
 * Download body metrics as CSV
 */
export function downloadBodyMetricsCSV(dailyLogs: Record<string, DailyLog>): void {
  const csv = exportBodyMetricsToCSV(dailyLogs);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(csv, `voltlift-body-metrics-${date}.csv`, 'text/csv');
}

/**
 * Download full backup as JSON
 */
export function downloadFullBackup(data: {
  workouts: WorkoutSession[];
  templates: WorkoutSession[];
  settings: UserSettings;
  dailyLogs: Record<string, DailyLog>;
}): void {
  const json = exportAllToJSON(data);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(json, `voltlift-backup-${date}.json`, 'application/json');
}

// ============================================================================
// Summary Statistics Export
// ============================================================================

/**
 * Generate summary statistics for a date range
 */
export function generateSummaryStats(
  workouts: WorkoutSession[],
  dateRange?: { start: Date; end: Date }
): {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalExercises: number;
  averageDuration: number;
  mostFrequentExercise: string | null;
  personalRecordsHit: number;
} {
  let filtered = workouts.filter(w => w.status === 'completed');

  if (dateRange) {
    filtered = filtered.filter(w => {
      const date = new Date(w.startTime);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  const exerciseCount: Record<string, number> = {};
  let totalVolume = 0;
  let totalSets = 0;
  let totalDuration = 0;

  for (const workout of filtered) {
    if (workout.endTime) {
      totalDuration += workout.endTime - workout.startTime;
    }

    for (const log of workout.logs) {
      exerciseCount[log.exerciseId] = (exerciseCount[log.exerciseId] || 0) + 1;

      for (const set of log.sets) {
        if (set.completed) {
          totalSets++;
          totalVolume += set.weight * set.reps;
        }
      }
    }
  }

  const mostFrequent = Object.entries(exerciseCount).sort((a, b) => b[1] - a[1])[0];
  const mostFrequentExercise = mostFrequent
    ? EXERCISE_LIBRARY.find(e => e.id === mostFrequent[0])?.name || mostFrequent[0]
    : null;

  return {
    totalWorkouts: filtered.length,
    totalVolume,
    totalSets,
    totalExercises: Object.keys(exerciseCount).length,
    averageDuration: filtered.length > 0 ? Math.round(totalDuration / filtered.length / 60000) : 0,
    mostFrequentExercise,
    personalRecordsHit: 0, // Would need PR tracking integration
  };
}
