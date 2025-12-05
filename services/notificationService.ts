/**
 * Notification Service
 * Handles all push notifications for VoltLift using Web Notifications API
 *
 * Features:
 * - Permission management
 * - Workout reminders
 * - Rest timer alerts
 * - PR celebrations
 * - Weekly summaries
 */

export type NotificationType = 'workout-reminder' | 'rest-timer' | 'pr-celebration' | 'weekly-summary';

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
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsEnabled(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Send a notification immediately
 */
export function sendNotification(config: NotificationConfig): Notification | null {
  if (!areNotificationsEnabled()) {
    console.warn('Notifications are not enabled');
    return null;
  }

  try {
    const notification = new Notification(config.title, {
      body: config.body,
      icon: config.icon || '/icon-192.png',
      badge: config.badge || '/icon-72.png',
      tag: config.tag,
      requireInteraction: config.requireInteraction,
      silent: config.silent,
      vibrate: config.vibrate,
      data: config.data,
    });

    // Auto-close after 5 seconds (unless requireInteraction is true)
    if (!config.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
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
export function sendRestTimerAlert(nextExercise?: string): Notification | null {
  const body = nextExercise
    ? `Rest complete. Next: ${nextExercise}`
    : 'Rest period complete. Time for your next set!';

  return sendNotification({
    title: '⏱️ REST COMPLETE',
    body,
    tag: 'rest-timer',
    requireInteraction: false,
    vibrate: [100, 50, 100, 50, 100],
    data: { type: 'rest-timer', nextExercise },
  });
}

/**
 * PR Celebration Notification
 */
export function sendPRCelebration(prType: string, exercise: string, achievement: string): Notification | null {
  return sendNotification({
    title: `🏆 NEW ${prType.toUpperCase()} PR!`,
    body: `${exercise}: ${achievement}. You're getting stronger!`,
    tag: 'pr-celebration',
    requireInteraction: true, // Keep it open until user clicks
    vibrate: [300, 100, 300, 100, 300],
    data: { type: 'pr-celebration', prType, exercise, achievement },
  });
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
