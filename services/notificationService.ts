/**
 * Notification Service
 * Handles all push notifications for IronPath/VoltLift
 * Uses Capacitor Local Notifications for iOS/Android native support
 *
 * Features:
 * - Permission management
 * - Workout reminders
 * - Rest timer alerts
 * - PR celebrations
 * - Weekly summaries
 */

import { localNotifications } from './localNotifications';

export type NotificationType =
  | 'workout-reminder'
  | 'rest-timer'
  | 'pr-celebration'
  | 'weekly-summary'
  | 'streak-alert'
  | 'deload-alert'
  | 'rest-day-suggestion'
  | 'goal-progress';

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  data?: any;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const permission = await localNotifications.requestPermission();
  // Return 'granted' or 'denied' from local notifications
  return permission;
}

/**
 * Check if notifications are supported and enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  if (!localNotifications.isSupported()) return false;
  const permission = await localNotifications.checkPermission();
  return permission === 'granted';
}

/**
 * Send a notification immediately (legacy Web API wrapper - not used)
 * Kept for backward compatibility but logs warning
 */
export function sendNotification(config: NotificationConfig): null {
  console.warn('sendNotification (Web API) is deprecated. Use Capacitor Local Notifications instead.');
  return null;
}

/**
 * Schedule a notification for a future time
 * Uses setTimeout for now (limited to ~24 days max)
 * For production, consider using Service Workers with Notification API
 */
export function scheduleNotification(
  config: NotificationConfig,
  scheduledTime: Date
): number | null {
  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();

  if (delay < 0) {
    console.warn('Cannot schedule notification in the past');
    return null;
  }

  // setTimeout has max delay of ~24.8 days (2^31-1 milliseconds)
  const MAX_TIMEOUT = 2147483647;
  if (delay > MAX_TIMEOUT) {
    console.warn('Notification delay exceeds maximum timeout');
    return null;
  }

  const timeoutId = window.setTimeout(() => {
    sendNotification(config);
  }, delay);

  return timeoutId;
}

/**
 * Cancel a scheduled notification
 */
export function cancelScheduledNotification(timeoutId: number): void {
  window.clearTimeout(timeoutId);
}

/**
 * Workout Reminder Notification
 */
export function sendWorkoutReminder(workoutName: string, scheduledTime: string): Notification | null {
  return sendNotification({
    title: '🔥 TIME TO LIFT',
    body: `${workoutName} starts ${scheduledTime}. Get ready to crush it!`,
    tag: 'workout-reminder',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { type: 'workout-reminder', workoutName },
  });
}

/**
 * Rest Timer Complete Notification
 */
export async function sendRestTimerAlert(nextExercise?: string): Promise<void> {
  await localNotifications.sendRestTimerAlert();
}

/**
 * PR Celebration Notification
 */
export async function sendPRCelebration(prType: string, exercise: string, achievement: string): Promise<void> {
  const message = `${exercise}: ${achievement}. You're getting stronger!`;
  await localNotifications.sendPRCelebration(exercise, message);
}

/**
 * Weekly Summary Notification
 */
export function sendWeeklySummary(stats: {
  workouts: number;
  totalVolume: number;
  prs: number;
  topExercise: string;
}): Notification | null {
  const { workouts, totalVolume, prs, topExercise } = stats;

  let body = `${workouts} workout${workouts !== 1 ? 's' : ''}, ${totalVolume.toLocaleString()}lbs total volume`;

  if (prs > 0) {
    body += `, ${prs} PR${prs !== 1 ? 's' : ''}!`;
  }

  if (topExercise) {
    body += ` Top exercise: ${topExercise}.`;
  }

  return sendNotification({
    title: '📊 WEEKLY RECAP',
    body,
    tag: 'weekly-summary',
    requireInteraction: false,
    vibrate: [200],
    data: { type: 'weekly-summary', stats },
  });
}

/**
 * Initialize notification listeners
 * Handles notification clicks and actions
 */
export function initializeNotificationListeners(): void {
  if (!('Notification' in window)) return;

  // Handle notification clicks (only works for notifications created by this page)
  // Note: For Service Worker notifications, you need to handle this in the SW
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      // Service worker is ready, can handle background notifications
      console.log('Service Worker ready for notifications');
    });
  }
}

/**
 * Get notification permission status text for UI
 */
export function getPermissionStatusText(): string {
  if (!('Notification' in window)) {
    return 'Notifications not supported';
  }

  switch (Notification.permission) {
    case 'granted':
      return 'Notifications enabled';
    case 'denied':
      return 'Notifications blocked';
    case 'default':
      return 'Notifications not enabled';
    default:
      return 'Unknown status';
  }
}

// =============================================================================
// Enhanced Notifications (P2 Improvements)
// =============================================================================

/**
 * Streak Alert Notification - Celebrate milestones or warn about streak risk
 */
export async function sendStreakAlert(
  streakDays: number,
  type: 'milestone' | 'at-risk' | 'broken'
): Promise<void> {
  // For now, only send milestone celebrations
  // at-risk and broken can be handled by daily logs/dashboard
  if (type === 'milestone') {
    await localNotifications.sendStreakAlert(streakDays);
  }
}

/**
 * Deload Alert Notification - Warn about accumulated fatigue
 */
export function sendDeloadAlert(
  urgency: 'suggested' | 'recommended' | 'urgent',
  averageRPE: number
): Notification | null {
  let title: string;
  let body: string;

  switch (urgency) {
    case 'urgent':
      title = '🛑 DELOAD NEEDED NOW';
      body = `Critical fatigue detected (${averageRPE} avg RPE). Your body NEEDS recovery. Reduce volume 50% this week.`;
      break;
    case 'recommended':
      title = '⚠️ DELOAD RECOMMENDED';
      body = `High fatigue accumulation (${averageRPE} avg RPE). Consider a lighter week to prevent overtraining.`;
      break;
    default:
      title = '💡 DELOAD SUGGESTED';
      body = `Moderate fatigue detected. A lighter session would help you recover and come back stronger.`;
  }

  return sendNotification({
    title,
    body,
    tag: 'deload-alert',
    requireInteraction: urgency === 'urgent',
    vibrate: urgency === 'urgent' ? [500, 200, 500] : [200, 100, 200],
    data: { type: 'deload-alert', urgency, averageRPE },
  });
}

/**
 * Rest Day Suggestion Notification
 */
export function sendRestDaySuggestion(
  consecutiveTrainingDays: number,
  reason: 'high-volume' | 'consecutive-days' | 'low-recovery'
): Notification | null {
  let body: string;

  switch (reason) {
    case 'high-volume':
      body = 'High training volume this week. A rest day would optimize your gains.';
      break;
    case 'consecutive-days':
      body = `${consecutiveTrainingDays} days straight! Rest is when muscles grow. Take today off.`;
      break;
    case 'low-recovery':
      body = 'Recovery metrics are low. An active rest day (walking, stretching) is recommended.';
      break;
  }

  return sendNotification({
    title: '😴 REST DAY SUGGESTION',
    body,
    tag: 'rest-day-suggestion',
    requireInteraction: false,
    vibrate: [100],
    data: { type: 'rest-day-suggestion', consecutiveTrainingDays, reason },
  });
}

/**
 * Goal Progress Notification - Celebrate progress toward goals
 */
export function sendGoalProgressAlert(
  goalType: 'weight' | 'strength' | 'volume',
  current: number,
  target: number,
  units: string
): Notification | null {
  const progress = Math.round((current / target) * 100);
  const remaining = target - current;

  let title: string;
  let body: string;

  if (progress >= 100) {
    title = '🎯 GOAL ACHIEVED!';
    body = `You hit your ${goalType} goal of ${target}${units}! Time to set a new target!`;
  } else if (progress >= 90) {
    title = '🔥 ALMOST THERE!';
    body = `${progress}% to your ${goalType} goal! Only ${Math.abs(remaining).toFixed(1)}${units} to go!`;
  } else if (progress >= 75) {
    title = '💪 CRUSHING IT!';
    body = `${progress}% toward your ${goalType} goal. Keep pushing!`;
  } else if (progress >= 50) {
    title = '📈 HALFWAY POINT!';
    body = `You're ${progress}% to your ${goalType} goal. The momentum is building!`;
  } else {
    title = '🚀 PROGRESS UPDATE';
    body = `${progress}% toward your ${goalType} goal. Every workout counts!`;
  }

  return sendNotification({
    title,
    body,
    tag: 'goal-progress',
    requireInteraction: progress >= 100,
    vibrate: progress >= 100 ? [300, 100, 300, 100, 300] : [200],
    data: { type: 'goal-progress', goalType, progress, current, target },
  });
}

// =============================================================================
// Scheduled Reminder Management
// =============================================================================

export interface ScheduledReminder {
  id: string;
  timeoutId: number;
  type: NotificationType;
  scheduledTime: Date;
  config: NotificationConfig;
}

// Store for managing scheduled reminders
const scheduledReminders: Map<string, ScheduledReminder> = new Map();

/**
 * Schedule a daily workout reminder at a specific time
 */
export function scheduleWorkoutReminderDaily(
  hour: number,
  minute: number,
  workoutName: string = 'Your workout'
): string {
  const id = `daily-workout-${hour}-${minute}`;

  // Cancel existing if present
  cancelReminder(id);

  const scheduleNext = () => {
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeoutId = scheduleNotification(
      {
        title: '🔥 TIME TO LIFT',
        body: `${workoutName} is calling. Get after it!`,
        tag: 'workout-reminder',
        vibrate: [200, 100, 200],
        data: { type: 'workout-reminder', workoutName },
      },
      scheduledTime
    );

    if (timeoutId) {
      scheduledReminders.set(id, {
        id,
        timeoutId,
        type: 'workout-reminder',
        scheduledTime,
        config: { title: '', body: '' },
      });

      // Reschedule for the next day after this one fires
      const msUntilFire = scheduledTime.getTime() - now.getTime();
      setTimeout(() => scheduleNext(), msUntilFire + 1000);
    }
  };

  scheduleNext();
  return id;
}

/**
 * Schedule a streak check reminder for end of day
 */
export function scheduleStreakCheckReminder(
  currentStreak: number,
  hasWorkedOutToday: boolean
): string | null {
  if (hasWorkedOutToday || currentStreak === 0) return null;

  const id = 'streak-check';
  cancelReminder(id);

  // Schedule for 8 PM
  const now = new Date();
  const reminderTime = new Date(now);
  reminderTime.setHours(20, 0, 0, 0);

  if (reminderTime <= now) return null; // Too late today

  const timeoutId = scheduleNotification(
    {
      title: '⚠️ STREAK AT RISK',
      body: `Your ${currentStreak}-day streak ends at midnight! There's still time!`,
      tag: 'streak-alert',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: { type: 'streak-alert', currentStreak },
    },
    reminderTime
  );

  if (timeoutId) {
    scheduledReminders.set(id, {
      id,
      timeoutId,
      type: 'streak-alert',
      scheduledTime: reminderTime,
      config: { title: '', body: '' },
    });
    return id;
  }

  return null;
}

/**
 * Cancel a scheduled reminder
 */
export function cancelReminder(id: string): void {
  const reminder = scheduledReminders.get(id);
  if (reminder) {
    cancelScheduledNotification(reminder.timeoutId);
    scheduledReminders.delete(id);
  }
}

/**
 * Cancel all scheduled reminders
 */
export function cancelAllReminders(): void {
  scheduledReminders.forEach((reminder) => {
    cancelScheduledNotification(reminder.timeoutId);
  });
  scheduledReminders.clear();
}

/**
 * Get all active scheduled reminders
 */
export function getScheduledReminders(): ScheduledReminder[] {
  return Array.from(scheduledReminders.values());
}
