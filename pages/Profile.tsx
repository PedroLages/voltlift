import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
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
  TrendingUp,
  Shield,
  Radio,
  Crosshair
} from 'lucide-react';
import { saveImageToDB, getImageFromDB } from '../utils/db';
import { EXERCISE_LIBRARY } from '../constants';
import { generateExerciseVisual } from '../services/geminiService';
import { backend } from '../services/backend';
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

// Tactical Section Header Component
const TacticalHeader = ({ title, statusLabel, statusActive }: { title: string; statusLabel: string; statusActive: boolean }) => (
  <div className="relative mb-6 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="relative">
        {/* Corner brackets */}
        <div className="absolute -left-2 -top-2 w-3 h-3 border-l-2 border-t-2 border-primary"></div>
        <div className="absolute -right-2 -top-2 w-3 h-3 border-r-2 border-t-2 border-primary"></div>
        <h3 className="text-xs font-black italic uppercase tracking-[0.2em] text-white px-4 py-2 bg-[#0a0a0a]">
          {title}
        </h3>
        <div className="absolute -left-2 -bottom-2 w-3 h-3 border-l-2 border-b-2 border-primary"></div>
        <div className="absolute -right-2 -bottom-2 w-3 h-3 border-r-2 border-b-2 border-primary"></div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${statusActive ? 'bg-primary animate-pulse' : 'bg-[#333]'}`}></div>
      <span className={`text-[9px] font-mono uppercase tracking-wider ${statusActive ? 'text-primary' : 'text-[#666]'}`}>
        {statusLabel}
      </span>
    </div>
  </div>
);

// Glitch Text Effect Component
const GlitchText = ({ children }: { children: React.ReactNode }) => (
  <div className="relative group">
    <span className="relative z-10">{children}</span>
    <span className="absolute top-0 left-0 opacity-0 group-hover:opacity-70 text-primary group-hover:animate-ping duration-100" aria-hidden="true">
      {children}
    </span>
  </div>
);

// Tactical Stat Card with diagonal cut
const TacticalStatCard = ({ icon, value, label, trend }: { icon: React.ReactNode; value: string; label: string; trend?: string }) => (
  <div className="relative bg-[#0a0a0a] border-l-2 border-primary overflow-hidden group hover:bg-[#111] transition-colors"
       style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
    {/* Scanline effect */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-b from-transparent via-primary to-transparent animate-pulse pointer-events-none"></div>

    <div className="relative p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="text-primary">{icon}</div>
        {trend && (
          <span className="text-[9px] font-mono text-primary bg-primary/10 px-2 py-0.5 border border-primary/30">
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-black italic text-white leading-none mb-1 tabular-nums">{value}</div>
      <div className="text-[9px] text-[#666] uppercase tracking-[0.15em] font-mono">{label}</div>
    </div>

    {/* Diagonal accent */}
    <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary/20" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>
  </div>
);

// Rounded Toggle Switch
const MilitaryToggle = ({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) => (
  <button
    onClick={onToggle}
    className={`relative w-14 h-7 rounded-full border-2 transition-all duration-300 ${
      enabled ? 'bg-primary/20 border-primary' : 'bg-[#111] border-[#333]'
    }`}
    aria-label={label}
    aria-pressed={enabled}
  >
    <span
      className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full transition-all duration-300 ease-in-out ${
        enabled ? 'translate-x-7 bg-primary' : 'translate-x-0 bg-[#666]'
      }`}
    />
  </button>
);

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

  // Load profile picture (cloud first, then local fallback)
  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        // Priority 1: Load from cloud if URL exists in settings
        if (settings.profilePictureUrl) {
          setProfilePicture(settings.profilePictureUrl);
          // Cache to IndexedDB for offline access
          await saveImageToDB('profile-picture', settings.profilePictureUrl);
          return;
        }

        // Priority 2: Fallback to local IndexedDB (for offline or legacy data)
        const localData = await getImageFromDB('profile-picture');
        if (isValidImageUrl(localData)) {
          setProfilePicture(localData);
        }
      } catch (err) {
        console.error('Error loading profile picture:', err);
      }
    };

    loadProfilePicture();
  }, [settings.profilePictureUrl]);

  // Handle profile picture upload using Capacitor Camera (iOS/Android native support)
  const handleProfilePictureCapture = async () => {
    setUploadingPicture(true);

    try {
      // Use Capacitor Camera API for native iOS/Android camera/photo library access
      const photo = await CapacitorCamera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Prompts user to choose between Camera or Photos
        quality: 90,
        allowEditing: true,
        width: 500,
        height: 500,
      });

      const base64 = photo.dataUrl!;

      try {
        // Try to upload to cloud storage
        const cloudUrl = await backend.storage.uploadImage('profile-picture', base64);

        // Save cloud URL to settings (will trigger sync)
        updateSettings({ profilePictureUrl: cloudUrl });

        // Cache locally for offline access
        await saveImageToDB('profile-picture', base64);

        // Update local state
        setProfilePicture(cloudUrl);

        console.log('✅ Profile picture uploaded to cloud:', cloudUrl);
      } catch (cloudError) {
        console.warn('⚠️ Cloud upload failed, saving locally only:', cloudError);

        // Fallback: Save to IndexedDB only
        await saveImageToDB('profile-picture', base64);
        setProfilePicture(base64);

        alert('Profile picture saved locally. Enable cloud sync to access across devices.');
      }

      setUploadingPicture(false);
    } catch (error: any) {
      console.error('Error capturing profile picture:', error);

      // User cancelled camera - don't show error
      if (error.message && error.message.includes('User cancelled')) {
        setUploadingPicture(false);
        return;
      }

      alert('Failed to capture profile picture. Please check camera permissions in Settings.');
      setUploadingPicture(false);
    }
  };

  // Fallback for web: HTML file input
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

        try {
          // Try to upload to cloud storage
          const cloudUrl = await backend.storage.uploadImage('profile-picture', base64);

          // Save cloud URL to settings (will trigger sync)
          updateSettings({ profilePictureUrl: cloudUrl });

          // Cache locally for offline access
          await saveImageToDB('profile-picture', base64);

          // Update local state
          setProfilePicture(cloudUrl);

          console.log('✅ Profile picture uploaded to cloud:', cloudUrl);
        } catch (cloudError) {
          console.warn('⚠️ Cloud upload failed, saving locally only:', cloudError);

          // Fallback: Save to IndexedDB only
          await saveImageToDB('profile-picture', base64);
          setProfilePicture(base64);

          alert('Profile picture saved locally. Enable cloud sync to access across devices.');
        }

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
    <div className="p-6 pb-20 relative">
      {/* Hexagon grid background pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23ccff00' stroke-width='0.5'/%3E%3C/svg%3E")`,
             backgroundSize: '60px 60px'
           }}>
      </div>

      {/* Main Header - Command Center Style */}
      <div className="relative mb-10">
        <div className="absolute -left-6 top-0 w-1 h-full bg-gradient-to-b from-primary via-primary/50 to-transparent"></div>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-3xl font-black italic uppercase text-white tracking-wider">
            <GlitchText>COMMAND DECK</GlitchText>
          </h1>
          <div className="flex items-center gap-1.5">
            <Radio size={12} className="text-primary animate-pulse" />
            <span className="text-[10px] font-mono text-primary uppercase tracking-wider">ONLINE</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-[#666] tracking-[0.2em] uppercase">
          Operator ID: {(settings.name || 'ALPHA').toUpperCase().slice(0, 12)}
        </div>
      </div>

      {/* Profile Header - Military ID Card Style */}
      <div className="mb-12 bg-[#0a0a0a] border border-[#222] relative overflow-hidden">
        {/* Circuit board corner detail */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <svg viewBox="0 0 100 100" className="text-primary fill-current">
            <circle cx="50" cy="50" r="2"/>
            <line x1="50" y1="50" x2="80" y2="20" stroke="currentColor" strokeWidth="0.5"/>
            <line x1="50" y1="50" x2="20" y2="80" stroke="currentColor" strokeWidth="0.5"/>
            <circle cx="80" cy="20" r="2"/>
            <circle cx="20" cy="80" r="2"/>
          </svg>
        </div>

        <div className="relative flex items-start gap-6 p-6 border-l-4 border-primary">
          {/* Profile picture with targeting reticle */}
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 border border-primary/30 pointer-events-none"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Crosshair size={32} className="text-primary animate-pulse" />
            </div>

            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-24 h-24 object-cover border-2 border-[#222] group-hover:border-primary transition-colors"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#222] group-hover:border-primary transition-colors flex items-center justify-center text-5xl font-black italic text-primary">
                {(settings.name || 'A').charAt(0)}
              </div>
            )}

            {/* Use Capacitor Camera for native apps, file input for web */}
            {(window as any).Capacitor ? (
              // Native iOS/Android: Use Capacitor Camera API
              <button
                onClick={handleProfilePictureCapture}
                className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Capture profile picture"
                disabled={uploadingPicture}
              >
                {uploadingPicture ? (
                  <RefreshCw size={24} className="text-primary animate-spin" />
                ) : (
                  <Camera size={24} className="text-primary" />
                )}
              </button>
            ) : (
              // Web: Use standard file input
              <>
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
                  className="sr-only"
                  style={{ position: 'absolute', left: '-9999px' }}
                />
              </>
            )}

            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-l border-t border-primary pointer-events-none"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 border-r border-t border-primary pointer-events-none"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l border-b border-primary pointer-events-none"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r border-b border-primary pointer-events-none"></div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-wide text-white mb-2">
                  {settings.name || 'OPERATOR'}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0a0a0a] border border-primary/30 text-[10px] font-mono uppercase tracking-wider text-primary">
                    <Shield size={10} />
                    [{settings.goal?.type || 'TRAINING'}]
                  </span>
                  <span className="text-[9px] font-mono text-[#666] uppercase tracking-wider">
                    CLEARANCE: ALPHA-1
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats - inline tactical display */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#000] border border-[#1a1a1a] p-3">
                <div className="text-[9px] font-mono text-[#666] uppercase tracking-wider mb-1">Missions</div>
                <div className="text-xl font-black italic text-white tabular-nums">{totalWorkouts}</div>
              </div>
              <div className="bg-[#000] border border-[#1a1a1a] p-3">
                <div className="text-[9px] font-mono text-[#666] uppercase tracking-wider mb-1">Volume</div>
                <div className="text-xl font-black italic text-primary tabular-nums">{(totalVolume / 1000).toFixed(0)}K</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Section */}
      {isAuthenticated && user && (
        <section className="mb-12">
          <TacticalHeader title="⌜AUTHENTICATION⌟" statusLabel="VERIFIED" statusActive={true} />

          <div className="bg-[#0a0a0a] border-l-2 border-primary divide-y divide-[#1a1a1a]">
            <div className="p-5 flex justify-between items-center min-h-[56px]">
              <div>
                <span className="font-bold uppercase text-sm text-white tracking-wider">Comm Link</span>
                <p className="text-xs text-[#999] font-mono mt-1">{user.email}</p>
              </div>
            </div>
            <div className="p-5 flex justify-between items-center min-h-[56px]">
              <span className="font-bold uppercase text-sm text-white tracking-wider">Operator ID</span>
              <span className="text-xs text-[#999] font-mono">{user.id.substring(0, 12)}...</span>
            </div>
            <div className="p-5">
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="w-full py-4 bg-red-900/20 border-2 border-red-900/50 hover:border-red-500 text-red-400 hover:text-red-300 font-black italic uppercase tracking-widest flex items-center justify-center gap-3 transition-all min-h-[48px] group"
                aria-label="Sign out of account"
                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
              >
                <LogOut size={16} className="group-hover:rotate-180 transition-transform duration-300" />
                <span className="tracking-[0.2em]">TERMINATE SESSION</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Control Matrix - Redesigned Quick Settings */}
      <section className="mb-12">
        <TacticalHeader title="⌜CONTROL MATRIX⌟" statusLabel="OPERATIONAL" statusActive={true} />

        <div className="space-y-3">
          {/* Units */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 relative group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-2 h-2 bg-primary/20" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}></div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-black uppercase text-white tracking-wider mb-1">Measurement Protocol</div>
                <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">SYSTEM UNITS</div>
              </div>
              <div className="flex gap-1 bg-[#000] p-1 border border-[#222]">
                <button
                  onClick={() => updateSettings({ units: 'kg' })}
                  className={`px-4 py-2 text-xs font-black italic uppercase tracking-wider transition-all min-h-[44px] ${
                    settings.units === 'kg' ? 'bg-primary text-black' : 'text-[#666] hover:text-white'
                  }`}
                  aria-label="Set units to kilograms"
                  aria-pressed={settings.units === 'kg'}
                >
                  KG
                </button>
                <button
                  onClick={() => updateSettings({ units: 'lbs' })}
                  className={`px-4 py-2 text-xs font-black italic uppercase tracking-wider transition-all min-h-[44px] ${
                    settings.units === 'lbs' ? 'bg-primary text-black' : 'text-[#666] hover:text-white'
                  }`}
                  aria-label="Set units to pounds"
                  aria-pressed={settings.units === 'lbs'}
                >
                  LBS
                </button>
              </div>
            </div>
          </div>

          {/* Rest Timer */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 relative group hover:border-primary/30 transition-colors"
               style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-black uppercase text-white tracking-wider mb-1">Recovery Protocol</div>
                <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">DEFAULT INTERVAL</div>
              </div>
              <select
                value={settings.defaultRestTimer}
                onChange={(e) => updateSettings({ defaultRestTimer: parseInt(e.target.value) })}
                className="bg-[#000] border border-[#333] text-primary font-mono px-4 py-2 text-sm uppercase tracking-wider focus:border-primary focus:outline-none min-h-[44px]"
                aria-label="Default rest timer duration"
              >
                <option value="60">60S</option>
                <option value="90">90S</option>
                <option value="120">120S</option>
                <option value="180">180S</option>
                <option value="240">240S</option>
                <option value="300">300S</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Data with Weekly Goal */}
      <section className="mb-12">
        <TacticalHeader title="⌜MISSION DATA⌟" statusLabel={isNewUser ? 'STANDBY' : 'ACTIVE'} statusActive={!isNewUser} />

        {isNewUser ? (
          <div className="bg-[#0a0a0a] border-2 border-primary/30 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #ccff00 0px, #ccff00 1px, transparent 1px, transparent 4px)',
                animation: 'scanlines 8s linear infinite'
              }}></div>
            </div>
            <Zap size={48} className="text-primary mx-auto mb-4" fill="currentColor" />
            <h3 className="text-xl font-black italic uppercase mb-2 text-white tracking-wider">
              READY TO DEPLOY?
            </h3>
            <p className="text-sm text-[#999] mb-6 font-mono uppercase tracking-wider">
              Initialize first mission to unlock tactical data
            </p>
            <button
              onClick={() => navigate('/lift')}
              className="px-8 py-4 bg-primary text-black font-black italic uppercase tracking-[0.2em] min-h-[48px] hover:bg-primary/90 transition-all relative group"
              style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
            >
              <span className="relative z-10">LAUNCH MISSION</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <TacticalStatCard
                icon={<Zap size={24} fill="currentColor" />}
                value={totalWorkouts.toString()}
                label="MISSIONS COMPLETE"
                trend="+12%"
              />
              <TacticalStatCard
                icon={<div className="text-primary font-black italic text-xl">{settings.units.toUpperCase()}</div>}
                value={`${(totalVolume / 1000).toFixed(0)}K`}
                label="TOTAL ORDNANCE"
                trend="+24%"
              />
            </div>

            <WeeklyGoalTracker />

            {totalWorkouts >= 10 && (
              <button
                onClick={() => setShowYearInReview(true)}
                className="w-full mt-4 py-3 border-2 border-[#222] hover:border-primary text-white hover:text-primary text-xs font-black italic uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all min-h-[48px] group"
                aria-label="View year in review"
              >
                <Calendar size={14} className="group-hover:rotate-12 transition-transform" />
                <span>TACTICAL REVIEW {new Date().getFullYear()}</span>
              </button>
            )}
          </>
        )}
      </section>

      {/* Year in Review Modal */}
      {showYearInReview && (
        <YearInReview year={new Date().getFullYear()} onClose={() => setShowYearInReview(false)} />
      )}

      {/* Body Tracking - renamed to "BIOMETRICS" */}
      <CollapsibleSection
        title="Biometric Scanner"
        icon={<Activity size={18} className="text-primary" />}
        defaultExpanded={false}
        summary={`${Object.keys(dailyLogs).length} logs recorded`}
        tier="medium"
      >
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['logger', 'trends', 'photos', 'correlation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setBodyMetricsTab(tab as any)}
              className={`px-5 py-3 text-xs font-black italic uppercase tracking-wider whitespace-nowrap transition-all min-h-[44px] ${
                bodyMetricsTab === tab
                  ? 'bg-primary text-black'
                  : 'bg-transparent text-[#888] border-2 border-[#222] hover:border-primary/50 hover:text-white'
              }`}
              aria-label={`View ${tab}`}
              aria-pressed={bodyMetricsTab === tab}
              style={bodyMetricsTab === tab ? { clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' } : {}}
            >
              {tab === 'logger' ? '◼ LOGGER' : tab === 'trends' ? '◼ TRENDS' : tab === 'photos' ? '◼ PHOTOS' : '◼ DATA'}
            </button>
          ))}
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

      {/* Cloud Armor */}
      <CollapsibleSection
        title="Data Shield"
        icon={<Cloud size={18} className={settings.ironCloud?.enabled ? 'text-primary' : 'text-[#666]'} />}
        defaultExpanded={false}
        summary={settings.ironCloud?.enabled ? 'Sync Active' : 'Local Only'}
        tier="low"
      >
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-sm font-black italic uppercase text-white tracking-wider">
                {settings.ironCloud?.enabled ? 'SYNCHRONIZED' : 'OFFLINE MODE'}
              </div>
              <p className="text-xs text-[#666] mt-1 uppercase font-mono tracking-wider">
                {settings.ironCloud?.enabled ? 'Cloud backup active' : 'Local storage only'}
              </p>
            </div>
            <MilitaryToggle
              enabled={settings.ironCloud?.enabled || false}
              onToggle={toggleIronCloud}
              label={settings.ironCloud?.enabled ? 'Disable cloud sync' : 'Enable cloud sync'}
            />
          </div>

          {settings.ironCloud?.enabled && (
            <div>
              <div className="flex justify-between items-center text-xs font-mono uppercase text-[#666] mb-4 border-t border-[#1a1a1a] pt-4 tracking-wider">
                <span>Last Sync</span>
                <span className="text-primary">{
                  settings.ironCloud.lastSync
                    ? (() => {
                        const date = new Date(settings.ironCloud.lastSync);
                        const use24h = settings.units === 'kg'; // KG users get 24-hour format
                        const timeOptions: Intl.DateTimeFormatOptions = {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: !use24h
                        };
                        const dateOptions: Intl.DateTimeFormatOptions = {
                          month: 'short',
                          day: 'numeric'
                        };
                        const time = date.toLocaleTimeString('en-US', timeOptions);
                        const dateStr = date.toLocaleDateString('en-US', dateOptions);
                        return `${dateStr}, ${time}`;
                      })()
                    : 'NEVER'
                }</span>
              </div>
              <button
                onClick={() => syncData()}
                disabled={syncStatus === 'syncing'}
                className="w-full py-3 border-2 border-[#222] hover:border-primary text-xs font-black italic uppercase tracking-[0.15em] text-white hover:text-primary transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Force sync data"
              >
                <RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin text-primary' : ''} />
                {syncStatus === 'syncing' ? 'SYNCING...' : 'FORCE SYNC'}
              </button>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Rig Setup */}
      <CollapsibleSection
        title="Hardware Config"
        icon={<Settings size={18} className="text-[#666]" />}
        defaultExpanded={false}
        summary={`${settings.units.toUpperCase()} • ${settings.defaultRestTimer}s • ${settings.barWeight}${settings.units}`}
        tier="low"
      >
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] divide-y divide-[#1a1a1a]">
          {/* Codename */}
          <div className="p-5 flex justify-between items-center min-h-[56px]">
            <span className="font-black uppercase text-sm text-white tracking-wider">Call Sign</span>
            <input
              className="bg-[#000] border-2 border-[#222] px-3 py-2 text-right outline-none text-primary focus:border-primary uppercase font-mono tracking-wider min-h-[44px]"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              aria-label="Your call sign"
            />
          </div>

          {/* Bar Weight */}
          <div className="p-5 flex justify-between items-center min-h-[56px]">
            <span className="font-black uppercase text-sm text-white tracking-wider">Bar Mass</span>
            <div className="flex bg-[#000] p-1 border border-[#222]">
              <button
                onClick={() => updateSettings({ barWeight: settings.units === 'kg' ? 20 : 45 })}
                className={`px-4 py-2 text-xs font-black italic uppercase tracking-wider transition-all ${settings.barWeight === (settings.units === 'kg' ? 20 : 45) ? 'bg-primary text-black' : 'text-[#666] hover:text-white'}`}
                aria-label={`Set bar weight to ${settings.units === 'kg' ? '20kg' : '45lbs'}`}
                aria-pressed={settings.barWeight === (settings.units === 'kg' ? 20 : 45)}
              >
                {settings.units === 'kg' ? '20KG' : '45LB'}
              </button>
              <button
                onClick={() => updateSettings({ barWeight: settings.units === 'kg' ? 15 : 35 })}
                className={`px-4 py-2 text-xs font-black italic uppercase tracking-wider transition-all ${settings.barWeight === (settings.units === 'kg' ? 15 : 35) ? 'bg-primary text-black' : 'text-[#666] hover:text-white'}`}
                aria-label={`Set bar weight to ${settings.units === 'kg' ? '15kg' : '35lbs'}`}
                aria-pressed={settings.barWeight === (settings.units === 'kg' ? 15 : 35)}
              >
                {settings.units === 'kg' ? '15KG' : '35LB'}
              </button>
            </div>
          </div>

          {/* Available Plates */}
          <div className="p-5 border-t border-[#1a1a1a]">
            <div className="flex justify-between items-center mb-3">
              <span className="font-black uppercase text-sm text-white tracking-wider">Plate Inventory</span>
              <button
                onClick={() => setShowPlateConfig(!showPlateConfig)}
                className="text-[10px] text-primary font-mono uppercase hover:text-white transition-colors tracking-wider"
                aria-label={showPlateConfig ? 'Hide plate configuration' : 'Show plate configuration'}
                aria-expanded={showPlateConfig}
              >
                [{showPlateConfig ? 'HIDE' : 'CONFIGURE'}]
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
                      className={`flex items-center gap-3 p-3 border cursor-pointer transition-all min-h-[48px] ${
                        isChecked ? 'border-primary bg-primary/5' : 'border-[#222] bg-[#0a0a0a] hover:border-[#333]'
                      }`}
                    >
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
            <p className="text-[10px] text-[#666] font-mono mt-2 uppercase tracking-wider">
              Select available plates for calculator optimization
            </p>
          </div>

          {/* Frequency */}
          <div className="p-5 flex justify-between items-center min-h-[56px]">
            <span className="font-black uppercase text-sm text-white tracking-wider">Mission Frequency</span>
            <select
              value={settings.goal.targetPerWeek}
              onChange={(e) => updateSettings({ goal: { ...settings.goal, targetPerWeek: parseInt(e.target.value) } })}
              className="bg-[#000] text-primary font-mono px-3 py-2 outline-none text-sm uppercase border-2 border-[#222] focus:border-primary min-h-[44px] tracking-wider"
              aria-label="Weekly workout frequency"
            >
              <option value="2">2 DAYS</option>
              <option value="3">3 DAYS</option>
              <option value="4">4 DAYS</option>
              <option value="5">5 DAYS</option>
              <option value="6">6 DAYS</option>
            </select>
          </div>

          {/* Gender */}
          <div className="p-5 flex justify-between items-center min-h-[56px]">
            <span className="font-black uppercase text-sm text-white tracking-wider">Operator Class</span>
            <div className="flex bg-[#000] p-1 border border-[#222]">
              <button
                onClick={() => updateSettings({ gender: 'male' })}
                className={`px-5 py-2 text-xs font-black italic uppercase tracking-wider transition-all ${settings.gender === 'male' ? 'bg-primary text-black' : 'text-[#666] hover:text-white'}`}
                aria-label="Set gender to male"
                aria-pressed={settings.gender === 'male'}
              >
                MALE
              </button>
              <button
                onClick={() => updateSettings({ gender: 'female' })}
                className={`px-5 py-2 text-xs font-black italic uppercase tracking-wider transition-all ${settings.gender === 'female' ? 'bg-primary text-black' : 'text-[#666] hover:text-white'}`}
                aria-label="Set gender to female"
                aria-pressed={settings.gender === 'female'}
              >
                FEMALE
              </button>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Auto-Progression Settings */}
      <CollapsibleSection
        title="Auto-Escalation"
        icon={<TrendingUp size={18} className="text-[#666]" />}
        defaultExpanded={false}
        summary={settings.autoProgression?.enabled ? 'Armed' : 'Disabled'}
        tier="low"
      >
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm font-black uppercase text-white tracking-wider">Enable Auto-Escalation</div>
              <p className="text-xs text-[#666] mt-1 font-mono uppercase tracking-wider">Automatic weight progression</p>
            </div>
            <MilitaryToggle
              enabled={settings.autoProgression?.enabled || false}
              onToggle={() => updateSettings({
                autoProgression: {
                  enabled: !settings.autoProgression?.enabled,
                  upperBodyIncrement: settings.autoProgression?.upperBodyIncrement || (settings.units === 'kg' ? 2.5 : 5),
                  lowerBodyIncrement: settings.autoProgression?.lowerBodyIncrement || (settings.units === 'kg' ? 5 : 10)
                }
              })}
              label={settings.autoProgression?.enabled ? 'Disable auto-progression' : 'Enable auto-progression'}
            />
          </div>

          {settings.autoProgression?.enabled && (
            <div className="space-y-4 border-t border-[#1a1a1a] pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-white tracking-wider">Upper Body</span>
                <select
                  value={settings.autoProgression.upperBodyIncrement}
                  onChange={(e) => updateSettings({
                    autoProgression: {
                      ...settings.autoProgression!,
                      upperBodyIncrement: parseFloat(e.target.value)
                    }
                  })}
                  className="bg-[#000] text-primary font-mono px-2 py-1 outline-none text-xs border border-[#222] focus:border-primary"
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
                <span className="text-xs font-black uppercase text-white tracking-wider">Lower Body</span>
                <select
                  value={settings.autoProgression.lowerBodyIncrement}
                  onChange={(e) => updateSettings({
                    autoProgression: {
                      ...settings.autoProgression!,
                      lowerBodyIncrement: parseFloat(e.target.value)
                    }
                  })}
                  className="bg-[#000] text-primary font-mono px-2 py-1 outline-none text-xs border border-[#222] focus:border-primary"
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

      {/* Rest Timer Options */}
      <CollapsibleSection
        title="Recovery Systems"
        icon={<Clock size={18} className="text-[#666]" />}
        defaultExpanded={false}
        summary={`${settings.defaultRestTimer}s protocol`}
        tier="low"
      >
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase text-white tracking-wider">Audio Alert</span>
            <MilitaryToggle
              enabled={settings.restTimerOptions?.sound ?? true}
              onToggle={() => updateSettings({
                restTimerOptions: {
                  ...settings.restTimerOptions,
                  sound: !settings.restTimerOptions?.sound,
                  vibration: settings.restTimerOptions?.vibration ?? true,
                  autoStart: settings.restTimerOptions?.autoStart ?? true
                }
              })}
              label={settings.restTimerOptions?.sound ? 'Disable rest timer sound' : 'Enable rest timer sound'}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase text-white tracking-wider">Haptic Feedback</span>
            <MilitaryToggle
              enabled={settings.restTimerOptions?.vibration ?? true}
              onToggle={() => updateSettings({
                restTimerOptions: {
                  ...settings.restTimerOptions,
                  sound: settings.restTimerOptions?.sound ?? true,
                  vibration: !settings.restTimerOptions?.vibration,
                  autoStart: settings.restTimerOptions?.autoStart ?? true
                }
              })}
              label={settings.restTimerOptions?.vibration ? 'Disable rest timer vibration' : 'Enable rest timer vibration'}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase text-white tracking-wider">Auto-Initialize</span>
            <MilitaryToggle
              enabled={settings.restTimerOptions?.autoStart ?? true}
              onToggle={() => updateSettings({
                restTimerOptions: {
                  ...settings.restTimerOptions,
                  sound: settings.restTimerOptions?.sound ?? true,
                  vibration: settings.restTimerOptions?.vibration ?? true,
                  autoStart: !settings.restTimerOptions?.autoStart
                }
              })}
              label={settings.restTimerOptions?.autoStart ? 'Disable rest timer auto-start' : 'Enable rest timer auto-start'}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Arsenal - Equipment */}
      <CollapsibleSection
        title="Armory Inventory"
        icon={<Target size={18} className="text-[#666]" />}
        defaultExpanded={false}
        summary={`${settings.availableEquipment.length} weapon types`}
        tier="low"
      >
        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT_TYPES.map(eq => (
            <button
              key={eq}
              onClick={() => toggleEquipment(eq)}
              className={`p-4 border text-xs font-black italic uppercase tracking-[0.1em] flex items-center justify-between transition-all min-h-[56px] ${
                settings.availableEquipment.includes(eq)
                  ? 'border-primary text-white bg-primary/5'
                  : 'border-[#222] text-[#666] hover:bg-[#0a0a0a] hover:border-[#333]'
              }`}
              aria-label={`${settings.availableEquipment.includes(eq) ? 'Remove' : 'Add'} ${eq}`}
              aria-pressed={settings.availableEquipment.includes(eq)}
              style={settings.availableEquipment.includes(eq) ? { clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' } : {}}
            >
              {eq}
              {settings.availableEquipment.includes(eq) && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Exercise Vault */}
      <CollapsibleSection
        title="Visual Database"
        icon={<Image size={18} className="text-[#666]" />}
        defaultExpanded={false}
        summary={`${progressPercent}% indexed`}
        badge={`${exercisesWithoutVisuals.length} missing`}
        tier="low"
      >
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs text-[#666] font-mono uppercase tracking-wider">
                {exercisesWithoutVisuals.length} ASSETS MISSING
              </p>
            </div>
            <div className="text-3xl font-black italic text-primary tabular-nums">{progressPercent}%</div>
          </div>

          <div className="flex justify-end mb-2">
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value as any)}
              className="bg-[#000] text-[10px] text-primary border border-[#222] px-2 py-1 outline-none font-mono uppercase focus:border-primary tracking-wider"
              disabled={generatingBatch}
              aria-label="Image resolution"
            >
              <option value="1K">1K RES</option>
              <option value="2K">2K RES</option>
              <option value="4K">4K RES</option>
            </select>
          </div>

          <div className="w-full h-2 bg-[#000] mb-6 overflow-hidden border border-[#1a1a1a]">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${generatingBatch ? generationProgress : progressPercent}%` }}
            />
          </div>

          <button
            onClick={handleBatchGenerate}
            disabled={generatingBatch || exercisesWithoutVisuals.length === 0}
            className="w-full py-4 bg-[#0a0a0a] border-2 border-[#222] hover:border-primary text-white font-black italic uppercase tracking-[0.15em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px]"
            aria-label="Generate missing exercise visuals"
          >
            {generatingBatch ? (
              <>
                <RefreshCw size={16} className="animate-spin text-primary" />
                GENERATING... {generationProgress}%
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-primary" />
                GENERATE ASSETS
              </>
            )}
          </button>
          <p className="text-[10px] text-[#666] mt-2 text-center uppercase font-mono tracking-wider">Requires API key for generation</p>
        </div>
      </CollapsibleSection>

      {/* Notification Settings Section */}
      <section id="notifications" className="mt-12">
        <TacticalHeader title="⌜ALERT SYSTEM⌟" statusLabel="MONITORING" statusActive={true} />
        <NotificationSettings />
      </section>

      {/* Data Export Section */}
      <section className="mt-12">
        <TacticalHeader title="⌜DATA EXTRACTION⌟" statusLabel="READY" statusActive={false} />
        <DataExport />
      </section>

      {/* Danger Zone - NUKE ZONE */}
      <section className="mt-16 mb-10">
        <div className="relative mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -left-2 -top-2 w-3 h-3 border-l-2 border-t-2 border-red-500"></div>
              <div className="absolute -right-2 -top-2 w-3 h-3 border-r-2 border-t-2 border-red-500"></div>
              <h3 className="text-xs font-black italic uppercase tracking-[0.2em] text-red-500 px-4 py-2 bg-red-900/10 border border-red-900/30">
                ⚠ NUKE ZONE ⚠
              </h3>
              <div className="absolute -left-2 -bottom-2 w-3 h-3 border-l-2 border-b-2 border-red-500"></div>
              <div className="absolute -right-2 -bottom-2 w-3 h-3 border-r-2 border-b-2 border-red-500"></div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-mono text-red-500 uppercase tracking-wider">ARMED</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border-2 border-red-900/30 p-6 relative overflow-hidden">
          {/* Danger stripes */}
          <div className="absolute inset-0 opacity-5 pointer-events-none"
               style={{
                 backgroundImage: 'repeating-linear-gradient(45deg, #ef4444 0px, #ef4444 20px, transparent 20px, transparent 40px)'
               }}>
          </div>

          <div className="relative flex items-start gap-4 mb-4">
            <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-1 animate-pulse" />
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase text-white mb-2 tracking-wider">Complete Data Wipe</h4>
              <p className="text-xs text-[#999] mb-3 font-mono uppercase tracking-wider leading-relaxed">
                Permanently erase all mission logs, biometric data, templates, and progress records.
                This is irreversible. Account credentials preserved.
              </p>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-5 py-3 bg-red-900/20 border-2 border-red-900 text-red-400 font-black italic uppercase text-xs hover:bg-red-900/40 transition-all flex items-center gap-3 min-h-[44px] tracking-[0.15em]"
                aria-label="Reset all data"
                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
              >
                <Trash2 size={14} />
                INITIATE WIPE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border-4 border-red-900 max-w-md w-full relative">
            {/* Danger corners */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-red-500"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-red-500"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-red-500"></div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-red-500"></div>

            <div className="flex items-center gap-3 p-6 border-b-2 border-red-900/30 bg-red-900/10">
              <AlertTriangle size={32} className="text-red-500 animate-pulse" />
              <div>
                <h3 className="text-lg font-black uppercase text-white tracking-wider">CONFIRM WIPE</h3>
                <p className="text-xs text-red-400 font-mono uppercase tracking-wider">Irreversible action</p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-white mb-4 font-mono uppercase tracking-wider">
                Confirm complete data erasure. Will delete:
              </p>
              <ul className="space-y-2 mb-6 text-xs text-[#999] font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">▸</span>
                  All workout logs and session data
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">▸</span>
                  Personal records and strength metrics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">▸</span>
                  Body measurements and photos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">▸</span>
                  Templates and programs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">▸</span>
                  All biometric logs
                </li>
              </ul>
              <p className="text-xs text-primary mb-6 font-mono uppercase tracking-wider">
                Account and credentials will be preserved.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 bg-[#111] text-white font-black italic uppercase text-xs border-2 border-[#333] hover:bg-[#1a1a1a] hover:border-[#444] transition-all min-h-[48px] tracking-[0.15em]"
                  aria-label="Cancel reset"
                >
                  ABORT
                </button>
                <button
                  onClick={handleResetAllData}
                  className="flex-1 py-3 bg-red-900 text-white font-black italic uppercase text-xs hover:bg-red-800 transition-all min-h-[48px] tracking-[0.15em]"
                  aria-label="Confirm reset all data"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
                >
                  EXECUTE WIPE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 text-center border-t border-[#1a1a1a] pt-8">
        <p className="text-[10px] text-[#444] font-mono uppercase tracking-[0.2em]">VOLTLIFT SYS v1.0.5 // TACTICAL INTERFACE</p>
      </div>

      {/* Add scanlines animation */}
      <style>{`
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default Profile;
