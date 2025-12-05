import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  scheduleNotification,
  cancelScheduledNotification,
  sendWorkoutReminder,
  sendWeeklySummary,
} from '../services/notificationService';

/**
 * NotificationScheduler
 * Runs in the background to schedule workout reminders and weekly summaries
 */
export default function NotificationScheduler() {
  const { settings, history } = useStore();

  // Schedule workout reminders
  useEffect(() => {
    const notificationSettings = settings.notifications;

    if (!notificationSettings?.enabled || !notificationSettings?.workoutReminders) {
      return; // Notifications disabled
    }

    const scheduledTimeouts: number[] = [];

    // Get reminder settings
    const reminderTime = notificationSettings.reminderTime || '09:00';
    const reminderDays = notificationSettings.reminderDays || [1, 3, 5]; // Mon, Wed, Fri

    // Parse reminder time
    const [hours, minutes] = reminderTime.split(':').map(Number);

    // Schedule notifications for each reminder day
    reminderDays.forEach((dayOfWeek) => {
      const now = new Date();
      const scheduledDate = new Date();

      // Calculate next occurrence of this day
      const currentDay = now.getDay();
      const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;

      scheduledDate.setDate(now.getDate() + (daysUntilTarget === 0 && now.getHours() >= hours ? 7 : daysUntilTarget));
      scheduledDate.setHours(hours, minutes, 0, 0);

      // Only schedule if in the future
      if (scheduledDate.getTime() > now.getTime()) {
        const timeoutId = scheduleNotification(
          {
            title: '🔥 TIME TO LIFT',
            body: `Your workout is scheduled for today. Get ready to crush it!`,
            tag: 'workout-reminder',
            requireInteraction: false,
            vibrate: [200, 100, 200],
            data: { type: 'workout-reminder' },
          },
          scheduledDate
        );

        if (timeoutId) {
          scheduledTimeouts.push(timeoutId);
        }
      }
    });

    // Cleanup: cancel scheduled notifications when component unmounts or settings change
    return () => {
      scheduledTimeouts.forEach((timeoutId) => cancelScheduledNotification(timeoutId));
    };
  }, [settings.notifications]);

  // Schedule weekly summary (Sunday at 8 PM)
  useEffect(() => {
    const notificationSettings = settings.notifications;

    if (!notificationSettings?.enabled || !notificationSettings?.weeklySummary) {
      return; // Weekly summary disabled
    }

    const now = new Date();
    const scheduledDate = new Date();

    // Calculate next Sunday at 8 PM
    const currentDay = now.getDay();
    const daysUntilSunday = (7 - currentDay) % 7;

    scheduledDate.setDate(now.getDate() + (daysUntilSunday === 0 && now.getHours() >= 20 ? 7 : daysUntilSunday));
    scheduledDate.setHours(20, 0, 0, 0);

    // Only schedule if in the future
    if (scheduledDate.getTime() > now.getTime()) {
      // Calculate weekly stats
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weeklyWorkouts = history.filter(
        (session) => session.status === 'completed' && session.endTime && session.endTime >= oneWeekAgo
      );

      const totalVolume = weeklyWorkouts.reduce((acc, sess) => {
        let vol = 0;
        sess.logs.forEach((l) => l.sets.forEach((s) => { if (s.completed) vol += s.weight * s.reps; }));
        return acc + vol;
      }, 0);

      // Count PRs this week (simplified - assumes PRs in personalRecords)
      const prsThisWeek = Object.values(settings.personalRecords).reduce((count, prHistory) => {
        const weeklyPRs = prHistory.records?.filter((pr) => pr.date >= oneWeekAgo) || [];
        return count + weeklyPRs.length;
      }, 0);

      // Find top exercise (most volume)
      const exerciseVolumes: Record<string, number> = {};
      weeklyWorkouts.forEach((sess) => {
        sess.logs.forEach((log) => {
          const volume = log.sets.reduce((sum, set) => sum + (set.completed ? set.weight * set.reps : 0), 0);
          exerciseVolumes[log.exerciseId] = (exerciseVolumes[log.exerciseId] || 0) + volume;
        });
      });

      const topExerciseId = Object.keys(exerciseVolumes).reduce((a, b) =>
        exerciseVolumes[a] > exerciseVolumes[b] ? a : b
      , '');

      // We can't easily get exercise name here without importing EXERCISE_LIBRARY
      // So we'll just send the summary without the top exercise name for now
      const topExercise = topExerciseId || '';

      const timeoutId = scheduleNotification(
        {
          title: '📊 WEEKLY RECAP',
          body: `${weeklyWorkouts.length} workout${weeklyWorkouts.length !== 1 ? 's' : ''}, ${totalVolume.toLocaleString()}${settings.units} total volume${prsThisWeek > 0 ? `, ${prsThisWeek} PR${prsThisWeek !== 1 ? 's' : ''}!` : ''}`,
          tag: 'weekly-summary',
          requireInteraction: false,
          vibrate: [200],
          data: {
            type: 'weekly-summary',
            stats: {
              workouts: weeklyWorkouts.length,
              totalVolume,
              prs: prsThisWeek,
              topExercise,
            },
          },
        },
        scheduledDate
      );

      // Cleanup
      return () => {
        if (timeoutId) {
          cancelScheduledNotification(timeoutId);
        }
      };
    }
  }, [settings.notifications, history, settings.personalRecords, settings.units]);

  // This component doesn't render anything
  return null;
}
