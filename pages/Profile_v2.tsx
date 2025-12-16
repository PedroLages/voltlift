import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Settings,
  User,
  BarChart,
  Zap,
  Check,
  Sparkles,
  Image,
  RefreshCw,
  Clock,
  Cloud,
  LogOut,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Target,
  Calendar,
  Activity,
  Repeat,
  Camera,
  Search,
  TrendingUp
} from 'lucide-react';
import { saveImageToDB, getImageFromDB } from '../utils/db';
import { EXERCISE_LIBRARY } from '../constants';
import { generateExerciseVisual } from '../services/geminiService';
import NotificationSettings from '../components/NotificationSettings';
import DataExport from '../components/DataExport';
import BodyMetricsLogger from '../components/BodyMetricsLogger';
import BodyweightChart from '../components/BodyweightChart';
import ProgressPhotos from '../components/ProgressPhotos';
import MeasurementTrends from '../components/MeasurementTrends';
import BodyLiftCorrelation from '../components/BodyLiftCorrelation';
import PerformanceInsights from '../components/PerformanceInsights';
import YearInReview from '../components/YearInReview';
import CollapsibleSection from '../components/CollapsibleSection';
import QuickSettings from '../components/QuickSettings';
import WeeklyGoalTracker from '../components/WeeklyGoalTracker';

const Profile = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, history, customExerciseVisuals, saveExerciseVisual, syncStatus, syncData, resetAllData, dailyLogs } = useStore();
  const { isAuthenticated, user, logout } = useAuthStore();

  // State
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [batchSize, setBatchSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [showPlateConfig, setShowPlateConfig] = useState(false);
  const [bodyMetricsTab, setBodyMetricsTab] = useState<'logger' | 'trends' | 'photos' | 'correlation'>('logger');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showYearInReview, setShowYearInReview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Validate image URL
  const isValidImageUrl = (url: string | null): url is string => {
    if (!url) return false;
    if (url.startsWith('data:')) {
      return url.startsWith('data:image/') && url.length > 50;
    }
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Load profile picture
  useEffect(() => {
    getImageFromDB('profile-picture').then((data) => {
      if (isValidImageUrl(data)) setProfilePicture(data);
    }).catch(err => console.error('Error loading profile picture:', err));
  }, []);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await saveImageToDB('profile-picture', base64);
        setProfilePicture(base64);
        setUploadingPicture(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setUploadingPicture(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
      setUploadingPicture(false);
    }
  };

  // Calculations
  const totalWorkouts = history.length;
  const totalVolume = history.reduce((acc, sess) => {
    let vol = 0;
    sess.logs.forEach(l => l.sets.forEach(s => { if(s.completed) vol += s.weight * s.reps; }));
    return acc + vol;
  }, 0);

  const toggleEquipment = (eq: string) => {
    const current = settings.availableEquipment;
    const updated = current.includes(eq)
      ? current.filter(i => i !== eq)
      : [...current, eq];
    updateSettings({ availableEquipment: updated });
  };

  const EQUIPMENT_TYPES = ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cable', 'Kettlebell'];

  const exercisesWithoutVisuals = EXERCISE_LIBRARY.filter(ex => !customExerciseVisuals[ex.id]);
  const progressPercent = Math.round((Object.keys(customExerciseVisuals).length / EXERCISE_LIBRARY.length) * 100);

  const handleBatchGenerate = async () => {
    const w = window as any;
    if (w.aistudio && w.aistudio.hasSelectedApiKey) {
      const hasKey = await w.aistudio.hasSelectedApiKey();
      if (!hasKey && w.aistudio.openSelectKey) {
        await w.aistudio.openSelectKey();
      }
    }

    setGeneratingBatch(true);
    setGenerationProgress(0);
    let completed = 0;

    for (const ex of exercisesWithoutVisuals) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const url = await generateExerciseVisual(ex.name, batchSize);
        if (url) {
          await saveExerciseVisual(ex.id, url);
        }
      } catch (e) {
        console.error(`Failed to gen for ${ex.name}`, e);
      }
      completed++;
      setGenerationProgress(Math.round((completed / exercisesWithoutVisuals.length) * 100));
    }
    setGeneratingBatch(false);
  };

  const toggleIronCloud = () => {
    updateSettings({
      ironCloud: {
        ...settings.ironCloud,
        enabled: !settings.ironCloud?.enabled
      }
    });
  };

  const handleResetAllData = () => {
    resetAllData();
    setShowResetConfirm(false);
  };

  // Empty state for new users
  const isNewUser = totalWorkouts === 0;

  return (
    <div className="p-6 pb-20">
      {/* PHASE 4: Updated section naming - "WARRIOR STATS" instead of "ATHLETE ID" */}
      <h1 className="text-3xl font-black italic uppercase mb-8 text-white">WARRIOR STATS</h1>

      {/* Profile Header */}
      <div className="flex items-center gap-6 mb-10 border-b border-[#222] pb-8">
        <div className="relative group">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="w-24 h-24 object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-24 h-24 bg-primary flex items-center justify-center text-5xl font-black italic text-black">
              {(settings.name || 'A').charAt(0)}
            </div>
          )}
          <label
            htmlFor="profile-picture-upload"
            className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Upload profile picture"
          >
            {uploadingPicture ? (
              <RefreshCw size={24} className="text-primary animate-spin" />
            ) : (
              <Camera size={24} className="text-primary" />
            )}
          </label>
          <input
            id="profile-picture-upload"
            type="file"
            accept="image/*"
            onChange={handleProfilePictureUpload}
            className="hidden"
          />
        </div>
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-wide text-white">{settings.name || 'Athlete'}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-1 bg-[#222] text-[#999] text-[10px] font-mono uppercase">
              {settings.goal?.type || 'Training'}
            </span>
          </div>
        </div>
      </div>

      {/* Account Section */}
      {isAuthenticated && user && (
        <section className="mb-12">
          <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-6 flex items-center gap-2">
            <div className="w-1 h-4 bg-primary" />
            ACCOUNT
          </h3>
          <div className="bg-[#111] border-l-4 border-primary divide-y divide-[#222]">
            <div className="p-5 flex justify-between items-center min-h-[56px]">
              <div>
                <span className="font-bold uppercase text-sm text-white">Email</span>
                <p className="text-xs text-[#999] font-mono mt-1">{user.email}</p>
              </div>
            </div>
            <div className="p-5 flex justify-between items-center min-h-[56px]">
              <span className="font-bold uppercase text-sm text-white">User ID</span>
              <span className="text-xs text-[#999] font-mono">{user.id.substring(0, 12)}...</span>
            </div>
            <div className="p-5">
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="w-full py-4 bg-red-900/20 border border-red-900/50 hover:border-red-500 text-red-400 hover:text-red-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all min-h-[48px]"
                aria-label="Sign out of account"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </section>
      )}

      {/* PHASE 2: Quick Settings Widget */}
      <QuickSettings />

      {/* Performance Data with Weekly Goal */}
      <section className="mb-12">
        <h3 className="text-sm font-black italic text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-primary" />
          PERFORMANCE DATA
        </h3>

        {/* PHASE 3: Empty state for new users */}
        {isNewUser ? (
          <div className="bg-[#111] border border-primary/30 p-8 text-center">
            <Zap size={48} className="text-primary mx-auto mb-4" fill="currentColor" />
            <h3 className="text-xl font-black italic uppercase mb-2 text-white">
              READY TO DOMINATE?
            </h3>
            <p className="text-sm text-[#999] mb-4">
              Log your first workout to unlock performance tracking
            </p>
            <button
              onClick={() => navigate('/lift')}
              className="px-6 py-3 bg-primary text-black font-black uppercase min-h-[48px]"
            >
              START FIRST WORKOUT
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[#111] p-6 border border-[#222]">
                <Zap className="text-primary mb-2" size={24} fill="currentColor" />
                <div className="text-4xl font-black italic text-white leading-none">{totalWorkouts}</div>
                <div className="text-[10px] text-[#999] uppercase tracking-widest mt-1">Sessions Complete</div>
              </div>
              <div className="bg-[#111] p-6 border border-[#222]">
                <div className="text-primary mb-2 font-black italic text-xl">{(settings.units || 'lbs').toUpperCase()}</div>
                <div className="text-4xl font-black italic text-white leading-none">{(totalVolume / 1000).toFixed(0)}K</div>
                <div className="text-[10px] text-[#999] uppercase tracking-widest mt-1">Total Volume</div>
              </div>
            </div>

            {/* PHASE 3: Weekly Goal Tracker */}
            <WeeklyGoalTracker />

            {/* PHASE 4: Simplified Year in Review link */}
            {totalWorkouts >= 10 && (
              <button
                onClick={() => setShowYearInReview(true)}
                className="w-full mt-4 py-3 border border-[#333] hover:border-primary text-white hover:text-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors min-h-[48px]"
                aria-label="View year in review"
              >
                <Calendar size={14} />
                View {new Date().getFullYear()} Wrapped
              </button>
            )}
          </>
        )}
      </section>

      {/* Year in Review Modal */}
      {showYearInReview && (
        <YearInReview year={new Date().getFullYear()} onClose={() => setShowYearInReview(false)} />
      )}

      {/* PHASE 2: Collapsible Body Metrics Section */}
      <CollapsibleSection
        title="Body Tracking"
        icon={<Activity size={18} className="text-primary" />}
        defaultExpanded={false}
        summary={`${Object.keys(dailyLogs).length} days logged`}
        tier="medium"
      >
        {/* PHASE 1: Fixed tab height with py-3 for 44px+ touch targets */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setBodyMetricsTab('logger')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all min-h-[44px] ${
              bodyMetricsTab === 'logger'
                ? 'bg-primary text-black'
                : 'bg-transparent text-[#888] border border-[#333] hover:border-primary/50 hover:text-white'
            }`}
            aria-label="View body metrics logger"
            aria-pressed={bodyMetricsTab === 'logger'}
          >
            Logger
          </button>
          <button
            onClick={() => setBodyMetricsTab('trends')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all min-h-[44px] ${
              bodyMetricsTab === 'trends'
                ? 'bg-primary text-black'
                : 'bg-transparent text-[#888] border border-[#333] hover:border-primary/50 hover:text-white'
            }`}
            aria-label="View body metrics trends"
            aria-pressed={bodyMetricsTab === 'trends'}
          >
            Trends
          </button>
          <button
            onClick={() => setBodyMetricsTab('photos')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all min-h-[44px] ${
              bodyMetricsTab === 'photos'
                ? 'bg-primary text-black'
                : 'bg-transparent text-[#888] border border-[#333] hover:border-primary/50 hover:text-white'
            }`}
            aria-label="View progress photos"
            aria-pressed={bodyMetricsTab === 'photos'}
          >
            Photos
          </button>
          <button
            onClick={() => setBodyMetricsTab('correlation')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all min-h-[44px] ${
              bodyMetricsTab === 'correlation'
                ? 'bg-primary text-black'
                : 'bg-transparent text-[#888] border border-[#333] hover:border-primary/50 hover:text-white'
            }`}
            aria-label="View body-lift correlation"
            aria-pressed={bodyMetricsTab === 'correlation'}
          >
            Correlation
          </button>
        </div>

        <div className="space-y-4">
          {bodyMetricsTab === 'logger' && (
            <>
              <BodyweightChart days={30} />
              <BodyMetricsLogger />
            </>
          )}
          {bodyMetricsTab === 'trends' && <MeasurementTrends />}
          {bodyMetricsTab === 'photos' && <ProgressPhotos />}
          {bodyMetricsTab === 'correlation' && <BodyLiftCorrelation />}
        </div>
      </CollapsibleSection>

      {/* PHASE 2: Collapsible Cloud Sync - PHASE 4: Renamed to "Cloud Armor" */}
      <CollapsibleSection
        title="Cloud Armor"
        icon={<Cloud size={18} className={settings.ironCloud?.enabled ? 'text-primary' : 'text-[#999]'} />}
        defaultExpanded={false}
        summary={settings.ironCloud?.enabled ? 'Synced' : 'Offline Mode'}
        tier="low"
      >
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-sm font-black italic uppercase text-white">
                {settings.ironCloud?.enabled ? 'SYNCING' : 'OFFLINE MODE'}
              </div>
              <p className="text-xs text-[#999] mt-1 uppercase">
                {settings.ironCloud?.enabled ? 'Data backed up' : 'Local only'}
              </p>
            </div>
            {/* PHASE 1: Improved toggle with ARIA label */}
            <button
              onClick={toggleIronCloud}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.ironCloud?.enabled ? 'bg-primary' : 'bg-[#333]'
              }`}
              aria-label={settings.ironCloud?.enabled ? 'Disable cloud sync' : 'Enable cloud sync'}
              aria-pressed={settings.ironCloud?.enabled}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-black rounded-full transition-transform ${
                  settings.ironCloud?.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {settings.ironCloud?.enabled && (
            <div>
              <div className="flex justify-between items-center text-xs font-bold uppercase text-[#999] mb-4 border-t border-[#222] pt-4">
                <span>Last Sync</span>
                <span>{settings.ironCloud.lastSync ? new Date(settings.ironCloud.lastSync).toLocaleTimeString() : 'Never'}</span>
              </div>
              <button
                onClick={() => syncData()}
                className="w-full py-3 border border-[#333] hover:border-primary text-xs font-bold uppercase tracking-widest text-white hover:text-primary transition-colors flex items-center justify-center gap-2 min-h-[48px]"
                aria-label="Force sync data"
              >
                <RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                Force Sync
              </button>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* PHASE 2: Collapsible System Config - PHASE 4: Renamed to "RIG SETUP" */}
      <CollapsibleSection
        title="Rig Setup"
        icon={<Settings size={18} className="text-[#999]" />}
        defaultExpanded={false}
        summary={`${settings.units.toUpperCase()} • ${settings.defaultRestTimer}s rest • ${settings.barWeight}${settings.units} bar`}
        tier="low"
      >
        <div className="bg-[#111] border border-[#222] divide-y divide-[#222]">
          {/* Codename */}
          <div className="p-5 flex justify-between items-center min-h-[56px]">
            <span className="font-bold uppercase text-sm text-white">Codename</span>
            <input
              className="bg-[#222] border border-[#333] px-3 py-2 text-right outline-none text-white focus:border-primary uppercase font-mono min-h-[44px]"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              aria-label="Your codename"
            />
          </div>

          {/* Bar Weight */}
          <div className="p-5 flex justify-between items-center min-h-[56px]">
            <span className="font-bold uppercase text-sm text-white">Bar Weight</span>
            <div className="flex bg-[#222] p-1">
              <button
                onClick={() => updateSettings({ barWeight: settings.units === 'kg' ? 20 : 45 })}
                className={`px-3 py-2 text-xs font-bold uppercase ${settings.barWeight === (settings.units === 'kg' ? 20 : 45) ? 'bg-primary text-black' : 'text-[#999]'}`}
                aria-label={`Set bar weight to ${settings.units === 'kg' ? '20kg' : '45lbs'}`}
                aria-pressed={settings.barWeight === (settings.units === 'kg' ? 20 : 45)}
              >
                {settings.units === 'kg' ? '20KG' : '45LBS'}
              </button>
              <button
                onClick={() => updateSettings({ barWeight: settings.units === 'kg' ? 15 : 35 })}
                className={`px-3 py-2 text-xs font-bold uppercase ${settings.barWeight === (settings.units === 'kg' ? 15 : 35) ? 'bg-primary text-black' : 'text-[#999]'}`}
                aria-label={`Set bar weight to ${settings.units === 'kg' ? '15kg' : '35lbs'}`}
                aria-pressed={settings.barWeight === (settings.units === 'kg' ? 15 : 35)}
              >
                {settings.units === 'kg' ? '15KG' : '35LBS'}
              </button>
            </div>
          </div>

          {/* Available Plates */}
          <div className="p-5 border-t border-[#222]">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold uppercase text-sm text-white">Available Plates</span>
              <button
                onClick={() => setShowPlateConfig(!showPlateConfig)}
                className="text-[10px] text-primary font-mono uppercase hover:text-white transition-colors"
                aria-label={showPlateConfig ? 'Hide plate configuration' : 'Show plate configuration'}
                aria-expanded={showPlateConfig}
              >
                {showPlateConfig ? 'Hide' : 'Configure'}
              </button>
            </div>
            {showPlateConfig && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                {(settings.units === 'kg'
                  ? [25, 20, 15, 10, 5, 2.5, 1.25]
                  : [45, 35, 25, 10, 5, 2.5]
                ).map(plate => {
                  const currentPlates = settings.availablePlates?.[settings.units] || [];
                  const isChecked = currentPlates.length === 0 || currentPlates.includes(plate);
                  return (
                    <label
                      key={plate}
                      className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors min-h-[48px] ${
                        isChecked ? 'border-primary bg-primary/10' : 'border-[#333] bg-black'
                      }`}
                    >
                      {/* PHASE 1: Fixed checkbox size to 24px */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const defaultPlates = settings.units === 'kg'
                            ? [25, 20, 15, 10, 5, 2.5, 1.25]
                            : [45, 35, 25, 10, 5, 2.5];

                          let newPlates: number[];
                          if (currentPlates.length === 0) {
                            newPlates = e.target.checked ? defaultPlates : defaultPlates.filter(p => p !== plate);
                          } else {
                            newPlates = e.target.checked
                              ? [...currentPlates, plate].sort((a, b) => b - a)
                              : currentPlates.filter(p => p !== plate);
                          }

                          updateSettings({
                            availablePlates: {
                              ...settings.availablePlates,
                              [settings.units]: newPlates
                            }
                          });
                        }}
                        className="w-6 h-6 accent-primary"
                        aria-label={`${plate} ${settings.units} plate`}
                      />
                      <span className="text-sm font-mono text-white">{plate} {settings.units}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-[#666] font-mono mt-2">
              Select plates available in your gym. Calculator will only use checked plates.
            </p>
          </div>

          {/* Frequency */}
          <div className="p-5 flex justify-between items-center min-h-[56px]">
            <span className="font-bold uppercase text-sm text-white">Frequency</span>
            <select
              value={settings.goal.targetPerWeek}
              onChange={(e) => updateSettings({ goal: { ...settings.goal, targetPerWeek: parseInt(e.target.value) } })}
              className="bg-[#222] text-white font-mono px-2 py-2 outline-none text-sm uppercase border border-[#333] focus:border-primary min-h-[44px]"
              aria-label="Weekly workout frequency"
            >
              <option value="2">2 Days</option>
              <option value="3">3 Days</option>
              <option value="4">4 Days</option>
              <option value="5">5 Days</option>
              <option value="6">6 Days</option>
            </select>
          </div>

          {/* PHASE 1: Removed duplicate bodyweight field - now only in Body Metrics */}

          {/* Gender */}
          <div className="p-5 flex justify-between items-center min-h-[56px]">
            <span className="font-bold uppercase text-sm text-white">Gender</span>
            <div className="flex bg-[#222] p-1">
              <button
                onClick={() => updateSettings({ gender: 'male' })}
                className={`px-4 py-2 text-xs font-bold uppercase ${settings.gender === 'male' ? 'bg-primary text-black' : 'text-[#999]'}`}
                aria-label="Set gender to male"
                aria-pressed={settings.gender === 'male'}
              >
                Male
              </button>
              <button
                onClick={() => updateSettings({ gender: 'female' })}
                className={`px-4 py-2 text-xs font-bold uppercase ${settings.gender === 'female' ? 'bg-primary text-black' : 'text-[#999]'}`}
                aria-label="Set gender to female"
                aria-pressed={settings.gender === 'female'}
              >
                Female
              </button>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* PHASE 3: Auto-Progression Settings */}
      <CollapsibleSection
        title="Auto-Progression"
        icon={<TrendingUp size={18} className="text-[#999]" />}
        defaultExpanded={false}
        summary={settings.autoProgression?.enabled ? 'Enabled' : 'Disabled'}
        tier="low"
      >
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm font-bold uppercase text-white">Enable Auto-Progression</div>
              <p className="text-xs text-[#999] mt-1">Automatically suggest weight increases</p>
            </div>
            <button
              onClick={() => updateSettings({
                autoProgression: {
                  enabled: !settings.autoProgression?.enabled,
                  upperBodyIncrement: settings.autoProgression?.upperBodyIncrement || (settings.units === 'kg' ? 2.5 : 5),
                  lowerBodyIncrement: settings.autoProgression?.lowerBodyIncrement || (settings.units === 'kg' ? 5 : 10)
                }
              })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.autoProgression?.enabled ? 'bg-primary' : 'bg-[#333]'
              }`}
              aria-label={settings.autoProgression?.enabled ? 'Disable auto-progression' : 'Enable auto-progression'}
              aria-pressed={settings.autoProgression?.enabled}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-black rounded-full transition-transform ${
                  settings.autoProgression?.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {settings.autoProgression?.enabled && (
            <div className="space-y-4 border-t border-[#222] pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-white">Upper Body Increment</span>
                <select
                  value={settings.autoProgression.upperBodyIncrement}
                  onChange={(e) => updateSettings({
                    autoProgression: {
                      ...settings.autoProgression!,
                      upperBodyIncrement: parseFloat(e.target.value)
                    }
                  })}
                  className="bg-[#222] text-white font-mono px-2 py-1 outline-none text-xs border border-[#333] focus:border-primary"
                  aria-label="Upper body weight increment"
                >
                  {settings.units === 'kg' ? (
                    <>
                      <option value="1.25">1.25 kg</option>
                      <option value="2.5">2.5 kg</option>
                      <option value="5">5 kg</option>
                    </>
                  ) : (
                    <>
                      <option value="2.5">2.5 lbs</option>
                      <option value="5">5 lbs</option>
                      <option value="10">10 lbs</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-white">Lower Body Increment</span>
                <select
                  value={settings.autoProgression.lowerBodyIncrement}
                  onChange={(e) => updateSettings({
                    autoProgression: {
                      ...settings.autoProgression!,
                      lowerBodyIncrement: parseFloat(e.target.value)
                    }
                  })}
                  className="bg-[#222] text-white font-mono px-2 py-1 outline-none text-xs border border-[#333] focus:border-primary"
                  aria-label="Lower body weight increment"
                >
                  {settings.units === 'kg' ? (
                    <>
                      <option value="2.5">2.5 kg</option>
                      <option value="5">5 kg</option>
                      <option value="10">10 kg</option>
                    </>
                  ) : (
                    <>
                      <option value="5">5 lbs</option>
                      <option value="10">10 lbs</option>
                      <option value="15">15 lbs</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* PHASE 3: Enhanced Rest Timer Options */}
      <CollapsibleSection
        title="Rest Timer Options"
        icon={<Clock size={18} className="text-[#999]" />}
        defaultExpanded={false}
        summary={`${settings.defaultRestTimer}s default`}
        tier="low"
      >
        <div className="bg-[#111] border border-[#222] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-white">Sound</span>
            <button
              onClick={() => updateSettings({
                restTimerOptions: {
                  ...settings.restTimerOptions,
                  sound: !settings.restTimerOptions?.sound,
                  vibration: settings.restTimerOptions?.vibration ?? true,
                  autoStart: settings.restTimerOptions?.autoStart ?? true
                }
              })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.restTimerOptions?.sound ? 'bg-primary' : 'bg-[#333]'
              }`}
              aria-label={settings.restTimerOptions?.sound ? 'Disable rest timer sound' : 'Enable rest timer sound'}
              aria-pressed={settings.restTimerOptions?.sound}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-black rounded-full transition-transform ${
                  settings.restTimerOptions?.sound ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-white">Vibration</span>
            <button
              onClick={() => updateSettings({
                restTimerOptions: {
                  ...settings.restTimerOptions,
                  sound: settings.restTimerOptions?.sound ?? true,
                  vibration: !settings.restTimerOptions?.vibration,
                  autoStart: settings.restTimerOptions?.autoStart ?? true
                }
              })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.restTimerOptions?.vibration ? 'bg-primary' : 'bg-[#333]'
              }`}
              aria-label={settings.restTimerOptions?.vibration ? 'Disable rest timer vibration' : 'Enable rest timer vibration'}
              aria-pressed={settings.restTimerOptions?.vibration}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-black rounded-full transition-transform ${
                  settings.restTimerOptions?.vibration ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-white">Auto-Start</span>
            <button
              onClick={() => updateSettings({
                restTimerOptions: {
                  ...settings.restTimerOptions,
                  sound: settings.restTimerOptions?.sound ?? true,
                  vibration: settings.restTimerOptions?.vibration ?? true,
                  autoStart: !settings.restTimerOptions?.autoStart
                }
              })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.restTimerOptions?.autoStart ? 'bg-primary' : 'bg-[#333]'
              }`}
              aria-label={settings.restTimerOptions?.autoStart ? 'Disable rest timer auto-start' : 'Enable rest timer auto-start'}
              aria-pressed={settings.restTimerOptions?.autoStart}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-black rounded-full transition-transform ${
                  settings.restTimerOptions?.autoStart ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* PHASE 2: Collapsible Gym Inventory - PHASE 4: Renamed to "ARSENAL" */}
      <CollapsibleSection
        title="Arsenal"
        icon={<Target size={18} className="text-[#999]" />}
        defaultExpanded={false}
        summary={`${settings.availableEquipment.length} types available`}
        tier="low"
      >
        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT_TYPES.map(eq => (
            <button
              key={eq}
              onClick={() => toggleEquipment(eq)}
              className={`p-4 border text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors min-h-[56px] ${
                settings.availableEquipment.includes(eq)
                  ? 'border-primary text-white bg-primary/10'
                  : 'border-[#333] text-[#999] hover:bg-[#1a1a1a]'
              }`}
              aria-label={`${settings.availableEquipment.includes(eq) ? 'Remove' : 'Add'} ${eq}`}
              aria-pressed={settings.availableEquipment.includes(eq)}
            >
              {eq}
              {settings.availableEquipment.includes(eq) && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* PHASE 2: Collapsible Visual Database - PHASE 4: Renamed to "EXERCISE VAULT" */}
      <CollapsibleSection
        title="Exercise Vault"
        icon={<Image size={18} className="text-[#999]" />}
        defaultExpanded={false}
        summary={`${progressPercent}% complete`}
        badge={`${exercisesWithoutVisuals.length} missing`}
        tier="low"
      >
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs text-[#999] font-mono">
                {exercisesWithoutVisuals.length} MISSING CUSTOM VISUALS
              </p>
            </div>
            <div className="text-3xl font-black italic text-primary">{progressPercent}%</div>
          </div>

          <div className="flex justify-end mb-2">
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value as any)}
              className="bg-[#111] text-[10px] text-white border border-[#333] px-2 py-1 outline-none font-mono uppercase focus:border-primary"
              disabled={generatingBatch}
              aria-label="Image resolution"
            >
              <option value="1K">1K High Res</option>
              <option value="2K">2K Ultra Res</option>
              <option value="4K">4K Max Res</option>
            </select>
          </div>

          <div className="w-full h-2 bg-[#222] mb-6 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${generatingBatch ? generationProgress : progressPercent}%` }}
            />
          </div>

          <button
            onClick={handleBatchGenerate}
            disabled={generatingBatch || exercisesWithoutVisuals.length === 0}
            className="w-full py-4 bg-[#222] border border-[#333] hover:border-primary text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px]"
            aria-label="Generate missing exercise visuals"
          >
            {generatingBatch ? (
              <>
                <RefreshCw size={16} className="animate-spin text-primary" />
                Generating Assets... {generationProgress}%
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-primary" />
                Generate Missing Assets
              </>
            )}
          </button>
          <p className="text-[10px] text-[#666] mt-2 text-center uppercase">Requires Paid API Key for High Res</p>
        </div>
      </CollapsibleSection>

      {/* Notification Settings Section */}
      <section className="mt-12">
        <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-6 flex items-center gap-2">
          <div className="w-1 h-4 bg-primary" />
          NOTIFICATIONS
        </h3>
        <NotificationSettings />
      </section>

      {/* Data Export Section */}
      <section className="mt-12">
        <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-6 flex items-center gap-2">
          <div className="w-1 h-4 bg-primary" />
          DATA EXPORT
        </h3>
        <DataExport />
      </section>

      {/* PHASE 4: Danger Zone renamed to "NUKE ZONE" */}
      <section className="mt-16 mb-10">
        <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <div className="w-1 h-4 bg-red-500" />
          NUKE ZONE
        </h3>
        <div className="bg-[#111] border-2 border-red-900/30 p-6">
          <div className="flex items-start gap-4 mb-4">
            <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase text-white mb-2">Reset All Data</h4>
              <p className="text-xs text-[#999] mb-3">
                Permanently delete all workout history, templates, body metrics, photos, and progress data.
                This action cannot be undone. Your account and basic settings will be preserved.
              </p>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 bg-red-900/20 border border-red-900 text-red-500 font-bold uppercase text-xs hover:bg-red-900/40 transition-colors flex items-center gap-2 min-h-[44px]"
                aria-label="Reset all data"
              >
                <Trash2 size={14} />
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] border-2 border-red-900 max-w-md w-full">
            <div className="flex items-center gap-3 p-6 border-b border-red-900/30 bg-red-900/10">
              <AlertTriangle size={32} className="text-red-500" />
              <div>
                <h3 className="text-lg font-black uppercase text-white">CONFIRM RESET</h3>
                <p className="text-xs text-red-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-white mb-4">
                Are you absolutely sure you want to reset all data? This will permanently delete:
              </p>
              <ul className="space-y-2 mb-6 text-xs text-[#999]">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  All workout history and logs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Personal records and strength scores
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Body measurements and progress photos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Custom templates and programs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  All daily logs and biometric data
                </li>
              </ul>
              <p className="text-xs text-primary mb-6">
                Your account, email, and basic settings will be preserved.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 bg-[#222] text-white font-bold uppercase text-xs border border-[#333] hover:bg-[#333] transition-colors min-h-[48px]"
                  aria-label="Cancel reset"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetAllData}
                  className="flex-1 py-3 bg-red-900 text-white font-bold uppercase text-xs hover:bg-red-800 transition-colors min-h-[48px]"
                  aria-label="Confirm reset all data"
                >
                  Reset Everything
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-[10px] text-[#444] font-mono uppercase">VoltLift Sys v1.0.5</p>
      </div>
    </div>
  );
};

export default Profile;
