import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationPreferences {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  streakAlerts: boolean;
  prCelebrations: boolean;
  weeklySummary: boolean;
  restTimerAlerts: boolean;
}

const DAILY_REMINDER_ID = 1;
const WEEKLY_SUMMARY_ID = 2;
const STREAK_ALERT_ID = 3;

class LocalNotificationService {
  private isNative = Capacitor.isNativePlatform();

  /**
   * Check if notifications are supported on this platform
   */
  isSupported(): boolean {
    return this.isNative;
  }

  /**
   * Request notification permissions (iOS will show native dialog)
   */
  async requestPermission(): Promise<'granted' | 'denied'> {
    if (!this.isNative) {
      return 'denied';
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return 'denied';
    }
  }

  /**
   * Check current permission status
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.isNative) {
      return 'denied';
    }

    try {
      const result = await LocalNotifications.checkPermissions();
      if (result.display === 'granted') return 'granted';
      if (result.display === 'denied') return 'denied';
      return 'prompt';
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return 'denied';
    }
  }

  /**
   * Schedule daily workout reminder
   */
  async scheduleDailyReminder(time: string): Promise<void> {
    if (!this.isNative) return;

    // Cancel existing reminder first
    await this.cancelDailyReminder();

    try {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0
      );

      // If time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: DAILY_REMINDER_ID,
            title: 'TIME TO LIFT 💪',
            body: 'Your workout is waiting. Get after it!',
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'day',
            },
            sound: 'default',
            actionTypeId: 'WORKOUT_REMINDER',
          },
        ],
      });

      console.log('✅ Daily reminder scheduled for', time);
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
    }
  }

  /**
   * Cancel daily reminder
   */
  async cancelDailyReminder(): Promise<void> {
    if (!this.isNative) return;

    try {
      await LocalNotifications.cancel({
        notifications: [{ id: DAILY_REMINDER_ID }],
      });
    } catch (error) {
      console.error('Failed to cancel daily reminder:', error);
    }
  }

  /**
   * Schedule weekly summary (Sundays at 8 PM)
   */
  async scheduleWeeklySummary(): Promise<void> {
    if (!this.isNative) return;

    // Cancel existing weekly summary first
    await this.cancelWeeklySummary();

    try {
      const now = new Date();
      const nextSunday = new Date(now);

      // Find next Sunday
      const daysUntilSunday = (7 - now.getDay()) % 7;
      nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
      nextSunday.setHours(20, 0, 0, 0); // 8 PM

      await LocalNotifications.schedule({
        notifications: [
          {
            id: WEEKLY_SUMMARY_ID,
            title: 'WEEKLY RECAP 📊',
            body: 'Check out your progress this week. Time to reflect and plan!',
            schedule: {
              at: nextSunday,
              repeats: true,
              every: 'week',
            },
            sound: 'default',
            actionTypeId: 'WEEKLY_SUMMARY',
          },
        ],
      });

      console.log('✅ Weekly summary scheduled for Sundays at 8 PM');
    } catch (error) {
      console.error('Failed to schedule weekly summary:', error);
    }
  }

  /**
   * Cancel weekly summary
   */
  async cancelWeeklySummary(): Promise<void> {
    if (!this.isNative) return;

    try {
      await LocalNotifications.cancel({
        notifications: [{ id: WEEKLY_SUMMARY_ID }],
      });
    } catch (error) {
      console.error('Failed to cancel weekly summary:', error);
    }
  }

  /**
   * Send streak alert notification (immediate)
   */
  async sendStreakAlert(streakDays: number): Promise<void> {
    if (!this.isNative) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: STREAK_ALERT_ID,
            title: `🔥 ${streakDays}-DAY STREAK!`,
            body: `Don't break it now. Keep the fire burning!`,
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
            sound: 'default',
            actionTypeId: 'STREAK_ALERT',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to send streak alert:', error);
    }
  }

  /**
   * Send PR celebration notification (immediate)
   */
  async sendPRCelebration(exerciseName: string, achievement: string): Promise<void> {
    if (!this.isNative) return;

    try {
      const notificationId = Date.now(); // Unique ID for each PR
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: `🏆 NEW PR: ${exerciseName.toUpperCase()}!`,
            body: achievement,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            actionTypeId: 'PR_CELEBRATION',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to send PR celebration:', error);
    }
  }

  /**
   * Send rest timer completion alert (immediate)
   */
  async sendRestTimerAlert(): Promise<void> {
    if (!this.isNative) return;

    try {
      const notificationId = Date.now();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: 'REST OVER ⏱️',
            body: 'Time to crush the next set!',
            schedule: { at: new Date(Date.now() + 500) }, // Half second delay
            sound: 'default',
            actionTypeId: 'REST_TIMER',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to send rest timer alert:', error);
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    if (!this.isNative) return;

    try {
      const notificationId = Date.now();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: 'TEST NOTIFICATION ✅',
            body: 'Your notifications are working! Get ready to lift.',
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            actionTypeId: 'TEST',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAll(): Promise<void> {
    if (!this.isNative) return;

    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: DAILY_REMINDER_ID },
          { id: WEEKLY_SUMMARY_ID },
          { id: STREAK_ALERT_ID },
        ],
      });
      console.log('✅ All scheduled notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  /**
   * Apply notification preferences (schedule/cancel based on settings)
   */
  async applyPreferences(preferences: NotificationPreferences): Promise<void> {
    if (!this.isNative || !preferences.enabled) {
      await this.cancelAll();
      return;
    }

    // Daily Reminder
    if (preferences.dailyReminder) {
      await this.scheduleDailyReminder(preferences.reminderTime);
    } else {
      await this.cancelDailyReminder();
    }

    // Weekly Summary
    if (preferences.weeklySummary) {
      await this.scheduleWeeklySummary();
    } else {
      await this.cancelWeeklySummary();
    }

    console.log('✅ Notification preferences applied');
  }
}

export const localNotifications = new LocalNotificationService();
