import { Bell, BellOff, Clock, Award, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  requestNotificationPermission,
  areNotificationsEnabled,
  getPermissionStatusText,
} from '../services/notificationService';
import { useStore } from '../store/useStore';
import type { NotificationSettings as NotificationSettingsType } from '../types';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsType = {
  enabled: false,
  workoutReminders: true,
  restTimerAlerts: true,
  prCelebrations: true,
  weeklySummary: true,
  reminderTime: '09:00',
  reminderDays: [1, 3, 5], // Monday, Wednesday, Friday
};

export default function NotificationSettings() {
  const { settings, updateSettings } = useStore();
  const [permissionStatus, setPermissionStatus] = useState<string>(getPermissionStatusText());

  const notificationSettings = settings.notifications || DEFAULT_NOTIFICATION_SETTINGS;

  useEffect(() => {
    // Update permission status
    const interval = setInterval(() => {
      setPermissionStatus(getPermissionStatusText());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();

    if (permission === 'granted') {
      updateSettings({
        notifications: {
          ...notificationSettings,
          enabled: true,
        },
      });
      setPermissionStatus(getPermissionStatusText());
    } else {
      alert(
        'Notifications permission denied. Please enable notifications in your browser settings.'
      );
    }
  };

  const handleDisableNotifications = () => {
    updateSettings({
      notifications: {
        ...notificationSettings,
        enabled: false,
      },
    });
  };

  const toggleNotificationType = (type: keyof NotificationSettingsType) => {
    updateSettings({
      notifications: {
        ...notificationSettings,
        [type]: !notificationSettings[type],
      },
    });
  };

  const updateReminderTime = (time: string) => {
    updateSettings({
      notifications: {
        ...notificationSettings,
        reminderTime: time,
      },
    });
  };

  const toggleReminderDay = (day: number) => {
    const currentDays = notificationSettings.reminderDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();

    updateSettings({
      notifications: {
        ...notificationSettings,
        reminderDays: newDays,
      },
    });
  };

  const isNotificationEnabled = areNotificationsEnabled() && notificationSettings.enabled;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="volt-header text-lg text-white">NOTIFICATIONS</h3>
        <span className="text-xs text-muted font-mono">{permissionStatus}</span>
      </div>

      {/* Master Toggle */}
      <div className="bg-[#111] border border-[#333] p-4 rounded">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isNotificationEnabled ? (
              <Bell className="text-primary" size={20} />
            ) : (
              <BellOff className="text-muted" size={20} />
            )}
            <div>
              <h4 className="font-bold text-white">Push Notifications</h4>
              <p className="text-xs text-muted">
                {isNotificationEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={isNotificationEnabled ? handleDisableNotifications : handleEnableNotifications}
            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
              isNotificationEnabled
                ? 'bg-primary text-black hover:bg-primary/80'
                : 'bg-[#222] text-white hover:bg-[#333]'
            }`}
          >
            {isNotificationEnabled ? 'DISABLE' : 'ENABLE'}
          </button>
        </div>
      </div>

      {/* Notification Types */}
      {isNotificationEnabled && (
        <div className="space-y-2">
          {/* Workout Reminders */}
          <div className="bg-[#111] border border-[#333] p-4 rounded">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Clock className="text-primary" size={18} />
                <div>
                  <h4 className="font-bold text-white text-sm">Workout Reminders</h4>
                  <p className="text-xs text-muted">Get reminded on your workout days</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotificationType('workoutReminders')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notificationSettings.workoutReminders ? 'bg-primary' : 'bg-[#333]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-black rounded-full transition-transform ${
                    notificationSettings.workoutReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {notificationSettings.workoutReminders && (
              <>
                {/* Reminder Time */}
                <div className="mb-3">
                  <label className="text-xs text-muted font-mono mb-1 block">REMINDER TIME</label>
                  <input
                    type="time"
                    value={notificationSettings.reminderTime || '09:00'}
                    onChange={(e) => updateReminderTime(e.target.value)}
                    className="bg-[#000] border border-[#444] text-white px-3 py-2 rounded w-full font-mono"
                  />
                </div>

                {/* Reminder Days */}
                <div>
                  <label className="text-xs text-muted font-mono mb-2 block">REMINDER DAYS</label>
                  <div className="flex gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => toggleReminderDay(index)}
                        className={`flex-1 py-2 rounded font-bold text-xs transition-colors ${
                          (notificationSettings.reminderDays || []).includes(index)
                            ? 'bg-primary text-black'
                            : 'bg-[#222] text-muted hover:bg-[#333]'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rest Timer Alerts */}
          <div className="bg-[#111] border border-[#333] p-4 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-primary" size={18} />
                <div>
                  <h4 className="font-bold text-white text-sm">Rest Timer Alerts</h4>
                  <p className="text-xs text-muted">Alert when rest period completes</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotificationType('restTimerAlerts')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notificationSettings.restTimerAlerts ? 'bg-primary' : 'bg-[#333]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-black rounded-full transition-transform ${
                    notificationSettings.restTimerAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* PR Celebrations */}
          <div className="bg-[#111] border border-[#333] p-4 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="text-primary" size={18} />
                <div>
                  <h4 className="font-bold text-white text-sm">PR Celebrations</h4>
                  <p className="text-xs text-muted">Notify when you hit a personal record</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotificationType('prCelebrations')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notificationSettings.prCelebrations ? 'bg-primary' : 'bg-[#333]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-black rounded-full transition-transform ${
                    notificationSettings.prCelebrations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="bg-[#111] border border-[#333] p-4 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-primary" size={18} />
                <div>
                  <h4 className="font-bold text-white text-sm">Weekly Summary</h4>
                  <p className="text-xs text-muted">Sunday recap of your week</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotificationType('weeklySummary')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notificationSettings.weeklySummary ? 'bg-primary' : 'bg-[#333]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-black rounded-full transition-transform ${
                    notificationSettings.weeklySummary ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
