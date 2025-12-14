import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Trophy, Flame, Calendar, Timer, Check, AlertCircle, X } from 'lucide-react';
import { haptic } from '../services/haptics';

interface NotificationPreferences {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  streakAlerts: boolean;
  prCelebrations: boolean;
  weeklySummary: boolean;
  restTimerAlerts: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false,
  dailyReminder: true,
  reminderTime: '18:00',
  streakAlerts: true,
  prCelebrations: true,
  weeklySummary: true,
  restTimerAlerts: true,
};

const STORAGE_KEY = 'voltlift-notification-preferences';

export const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch {
        // Invalid JSON, use defaults
      }
    }

    // Check current permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    haptic('medium');
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);

    if (permission === 'granted') {
      setPreferences(prev => ({ ...prev, enabled: true }));
      haptic('success');

      // Show test notification
      new Notification('VOLTLIFT ACTIVATED', {
        body: 'Notifications are now enabled. Time to crush it!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    if (key === 'enabled' && !preferences.enabled && permissionStatus !== 'granted') {
      requestPermission();
      return;
    }

    haptic('selection');
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateReminderTime = (time: string) => {
    haptic('selection');
    setPreferences(prev => ({ ...prev, reminderTime: time }));
    setShowTimeModal(false);
  };

  const sendTestNotification = () => {
    if (permissionStatus !== 'granted') return;

    haptic('medium');
    new Notification('TEST NOTIFICATION', {
      body: 'Your notifications are working! Get ready to lift.',
      icon: '/icon-192.png',
    });

    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const ToggleSwitch = ({
    enabled,
    onToggle,
    disabled = false
  }: {
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${enabled ? 'bg-primary' : 'bg-[#333]'}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="bg-[#111] border border-[#222] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase text-white">Notifications</h3>
        </div>
        {permissionStatus === 'denied' && (
          <span className="text-[10px] text-red-500 font-bold uppercase flex items-center gap-1">
            <AlertCircle size={12} /> Blocked
          </span>
        )}
      </div>

      {/* Permission Request */}
      {permissionStatus !== 'granted' && permissionStatus !== 'denied' && (
        <button
          onClick={requestPermission}
          className="w-full py-3 bg-primary text-black font-bold uppercase text-xs mb-4 flex items-center justify-center gap-2 hover:bg-white transition-colors"
        >
          <Bell size={16} />
          Enable Notifications
        </button>
      )}

      {permissionStatus === 'denied' && (
        <div className="bg-red-900/20 border border-red-900 p-3 mb-4">
          <p className="text-[11px] text-red-400 font-mono">
            Notifications are blocked. Please enable them in your browser settings to receive workout reminders.
          </p>
        </div>
      )}

      {/* Notification Options */}
      <div className="space-y-3">
        {/* Master Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-[#222]">
          <div className="flex items-center gap-3">
            {preferences.enabled ? (
              <Bell size={16} className="text-primary" />
            ) : (
              <BellOff size={16} className="text-[#666]" />
            )}
            <div>
              <p className="text-sm font-bold text-white">All Notifications</p>
              <p className="text-[10px] text-[#666]">Master toggle for all alerts</p>
            </div>
          </div>
          <ToggleSwitch
            enabled={preferences.enabled}
            onToggle={() => togglePreference('enabled')}
            disabled={permissionStatus === 'denied'}
          />
        </div>

        {/* Daily Reminder */}
        <div className={`flex items-center justify-between py-2 ${!preferences.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-[#666]" />
            <div>
              <p className="text-sm font-bold text-white">Daily Reminder</p>
              <button
                onClick={() => preferences.enabled && setShowTimeModal(true)}
                className="text-[10px] text-primary hover:underline"
                disabled={!preferences.enabled}
              >
                {formatTime(preferences.reminderTime)}
              </button>
            </div>
          </div>
          <ToggleSwitch
            enabled={preferences.dailyReminder}
            onToggle={() => togglePreference('dailyReminder')}
            disabled={!preferences.enabled}
          />
        </div>

        {/* Streak Alerts */}
        <div className={`flex items-center justify-between py-2 ${!preferences.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <Flame size={16} className="text-[#666]" />
            <div>
              <p className="text-sm font-bold text-white">Streak Alerts</p>
              <p className="text-[10px] text-[#666]">Don't break your streak!</p>
            </div>
          </div>
          <ToggleSwitch
            enabled={preferences.streakAlerts}
            onToggle={() => togglePreference('streakAlerts')}
            disabled={!preferences.enabled}
          />
        </div>

        {/* PR Celebrations */}
        <div className={`flex items-center justify-between py-2 ${!preferences.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <Trophy size={16} className="text-[#666]" />
            <div>
              <p className="text-sm font-bold text-white">PR Celebrations</p>
              <p className="text-[10px] text-[#666]">Get notified of new records</p>
            </div>
          </div>
          <ToggleSwitch
            enabled={preferences.prCelebrations}
            onToggle={() => togglePreference('prCelebrations')}
            disabled={!preferences.enabled}
          />
        </div>

        {/* Weekly Summary */}
        <div className={`flex items-center justify-between py-2 ${!preferences.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-[#666]" />
            <div>
              <p className="text-sm font-bold text-white">Weekly Summary</p>
              <p className="text-[10px] text-[#666]">Sunday recap of your week</p>
            </div>
          </div>
          <ToggleSwitch
            enabled={preferences.weeklySummary}
            onToggle={() => togglePreference('weeklySummary')}
            disabled={!preferences.enabled}
          />
        </div>

        {/* Rest Timer Alerts */}
        <div className={`flex items-center justify-between py-2 ${!preferences.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <Timer size={16} className="text-[#666]" />
            <div>
              <p className="text-sm font-bold text-white">Rest Timer Alerts</p>
              <p className="text-[10px] text-[#666]">Sound when rest is over</p>
            </div>
          </div>
          <ToggleSwitch
            enabled={preferences.restTimerAlerts}
            onToggle={() => togglePreference('restTimerAlerts')}
            disabled={!preferences.enabled}
          />
        </div>
      </div>

      {/* Test Notification Button */}
      {permissionStatus === 'granted' && preferences.enabled && (
        <button
          onClick={sendTestNotification}
          className={`w-full mt-4 py-2 text-xs font-bold uppercase border transition-colors flex items-center justify-center gap-2 ${
            testSent
              ? 'border-green-500 text-green-500 bg-green-500/10'
              : 'border-[#333] text-[#666] hover:text-white hover:border-[#444]'
          }`}
        >
          {testSent ? (
            <>
              <Check size={14} />
              Notification Sent!
            </>
          ) : (
            <>
              <Bell size={14} />
              Send Test Notification
            </>
          )}
        </button>
      )}

      {/* Time Picker Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <div className="bg-[#111] border-2 border-primary max-w-xs w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#222]">
              <h3 className="text-sm font-bold uppercase text-white">Set Reminder Time</h3>
              <button onClick={() => setShowTimeModal(false)} className="text-[#666] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-2">
                {['06:00', '08:00', '12:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(time => (
                  <button
                    key={time}
                    onClick={() => updateReminderTime(time)}
                    className={`py-3 text-xs font-bold uppercase border transition-colors ${
                      preferences.reminderTime === time
                        ? 'bg-primary text-black border-primary'
                        : 'bg-black text-white border-[#333] hover:border-[#444]'
                    }`}
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-[10px] text-[#666] uppercase font-bold block mb-2">
                  Custom Time
                </label>
                <input
                  type="time"
                  value={preferences.reminderTime}
                  onChange={(e) => updateReminderTime(e.target.value)}
                  className="w-full bg-black border border-[#333] px-3 py-2 text-white font-mono focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
