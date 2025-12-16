import React from 'react';
import { Settings, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate, useLocation } from 'react-router-dom';

export const QuickSettings: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleUnits = () => {
    updateSettings({ units: settings.units === 'lbs' ? 'kg' : 'lbs' });
  };

  const scrollToNotifications = () => {
    // If already on profile page, scroll directly
    if (location.pathname === '/profile') {
      const element = document.getElementById('notifications');
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Navigate to profile then scroll
      navigate('/profile');
      setTimeout(() => {
        const element = document.getElementById('notifications');
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <section className="mb-12">
      <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-6 flex items-center gap-2">
        <div className="w-1 h-4 bg-primary" />
        QUICK SETTINGS
      </h3>

      <div className="bg-[#111] border border-[#222] divide-y divide-[#222]">
        {/* Units Toggle */}
        <div className="p-4 flex items-center justify-between min-h-[56px]">
          <span className="font-bold uppercase text-sm text-white">Units</span>
          <div className="flex bg-[#222] p-1">
            <button
              onClick={() => updateSettings({ units: 'lbs' })}
              className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${
                settings.units === 'lbs' ? 'bg-primary text-black' : 'text-[#666]'
              }`}
              aria-label="Set units to pounds"
              aria-pressed={settings.units === 'lbs'}
            >
              LBS
            </button>
            <button
              onClick={() => updateSettings({ units: 'kg' })}
              className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${
                settings.units === 'kg' ? 'bg-primary text-black' : 'text-[#666]'
              }`}
              aria-label="Set units to kilograms"
              aria-pressed={settings.units === 'kg'}
            >
              KG
            </button>
          </div>
        </div>

        {/* Rest Timer */}
        <div className="p-4 flex items-center justify-between min-h-[56px]">
          <span className="font-bold uppercase text-sm text-white">Rest Timer</span>
          <select
            value={settings.defaultRestTimer || 90}
            onChange={(e) => updateSettings({ defaultRestTimer: parseInt(e.target.value) })}
            className="bg-[#222] text-white font-mono px-3 py-2 outline-none text-sm uppercase border border-[#333] focus:border-primary min-h-[44px]"
            aria-label="Default rest timer duration"
          >
            <option value="30">30s</option>
            <option value="60">60s</option>
            <option value="90">90s</option>
            <option value="120">2min</option>
            <option value="180">3min</option>
            <option value="300">5min</option>
          </select>
        </div>

        {/* Notifications Toggle */}
        <div className="p-4 flex items-center justify-between min-h-[56px]">
          <span className="font-bold uppercase text-sm text-white">Notifications</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666] uppercase">
              {settings.notifications?.enabled ? 'On' : 'Off'}
            </span>
            <button
              onClick={scrollToNotifications}
              className="text-primary hover:text-white transition-colors"
              aria-label="Configure notifications"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Link to All Settings */}
        <div className="p-4">
          <button
            onClick={() => navigate('/profile')} // In Phase 4, this will go to /profile/settings
            className="w-full py-3 border border-[#333] hover:border-primary text-white hover:text-primary font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors min-h-[48px]"
            aria-label="View all settings"
          >
            <Settings size={16} />
            ALL SETTINGS
          </button>
        </div>
      </div>
    </section>
  );
};

export default QuickSettings;
