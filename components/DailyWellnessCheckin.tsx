/**
 * Daily Wellness Check-in Component
 *
 * Collects morning wellness data for ML-powered fatigue prediction:
 * - Muscle soreness (1-5)
 * - Perceived recovery (1-5)
 * - Energy level (1-5)
 * - Sleep hours and quality
 * - Stress level (1-5)
 *
 * This data feeds into the GRU fatigue predictor.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Moon,
  Zap,
  Heart,
  Brain,
  Activity,
  ChevronRight,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  isHealthKitAvailable,
  requestHealthPermissions,
  getSleepData
} from '../services/healthKitService';

interface DailyWellnessCheckinProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface RatingOption {
  value: number;
  label: string;
  emoji: string;
}

const SORENESS_OPTIONS: RatingOption[] = [
  { value: 1, label: 'None', emoji: '😌' },
  { value: 2, label: 'Light', emoji: '🙂' },
  { value: 3, label: 'Moderate', emoji: '😐' },
  { value: 4, label: 'Sore', emoji: '😣' },
  { value: 5, label: 'Very Sore', emoji: '😫' }
];

const RECOVERY_OPTIONS: RatingOption[] = [
  { value: 1, label: 'Exhausted', emoji: '😵' },
  { value: 2, label: 'Tired', emoji: '😩' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '😊' },
  { value: 5, label: 'Fully Recovered', emoji: '💪' }
];

const ENERGY_OPTIONS: RatingOption[] = [
  { value: 1, label: 'Drained', emoji: '🪫' },
  { value: 2, label: 'Low', emoji: '😴' },
  { value: 3, label: 'Normal', emoji: '⚡' },
  { value: 4, label: 'Energized', emoji: '🔥' },
  { value: 5, label: 'Peak Energy', emoji: '⚡⚡' }
];

const SLEEP_QUALITY_OPTIONS: RatingOption[] = [
  { value: 1, label: 'Terrible', emoji: '😫' },
  { value: 2, label: 'Poor', emoji: '😕' },
  { value: 3, label: 'Fair', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '😊' },
  { value: 5, label: 'Excellent', emoji: '😴✨' }
];

const STRESS_OPTIONS: RatingOption[] = [
  { value: 1, label: 'Calm', emoji: '🧘' },
  { value: 2, label: 'Relaxed', emoji: '😌' },
  { value: 3, label: 'Normal', emoji: '😐' },
  { value: 4, label: 'Stressed', emoji: '😰' },
  { value: 5, label: 'Very Stressed', emoji: '🤯' }
];

type Step = 'soreness' | 'recovery' | 'energy' | 'sleep' | 'stress' | 'complete';

export function DailyWellnessCheckin({ isOpen, onClose, onComplete }: DailyWellnessCheckinProps) {
  const [step, setStep] = useState<Step>('soreness');
  const [muscleSoreness, setMuscleSoreness] = useState<number | null>(null);
  const [perceivedRecovery, setPerceivedRecovery] = useState<number | null>(null);
  const [perceivedEnergy, setPerceivedEnergy] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);

  // HealthKit integration state
  const [healthKitAvailable, setHealthKitAvailable] = useState<boolean>(false);
  const [healthKitEnabled, setHealthKitEnabled] = useState<boolean>(false);
  const [sleepDataSource, setSleepDataSource] = useState<'manual' | 'healthkit'>('manual');
  const [isLoadingHealthData, setIsLoadingHealthData] = useState<boolean>(false);

  const { dailyLogs, addDailyLog, updateDailyLog, settings, updateSettings } = useStore();

  // Get today's date string
  const today = new Date().toISOString().split('T')[0];
  const existingLog = dailyLogs[today];

  // Check HealthKit availability on mount
  useEffect(() => {
    const checkHealthKit = async () => {
      const available = await isHealthKitAvailable();
      setHealthKitAvailable(available);

      // Load HealthKit enabled preference from settings
      if (settings.healthKitEnabled !== undefined) {
        setHealthKitEnabled(settings.healthKitEnabled);
      }
    };

    checkHealthKit();
  }, [settings.healthKitEnabled]);

  // Pre-fill if existing data
  useEffect(() => {
    if (existingLog) {
      if (existingLog.muscleSoreness) setMuscleSoreness(existingLog.muscleSoreness);
      if (existingLog.perceivedRecovery) setPerceivedRecovery(existingLog.perceivedRecovery);
      if (existingLog.perceivedEnergy) setPerceivedEnergy(existingLog.perceivedEnergy);
      if (existingLog.sleepHours) setSleepHours(existingLog.sleepHours);
      if (existingLog.sleepQuality) setSleepQuality(existingLog.sleepQuality);
      if (existingLog.stressLevel) setStressLevel(existingLog.stressLevel);
    }
  }, [existingLog]);

  // Auto-fetch sleep data from HealthKit when user reaches sleep step
  useEffect(() => {
    const fetchSleepData = async () => {
      if (step === 'sleep' && healthKitEnabled && !isLoadingHealthData) {
        setIsLoadingHealthData(true);

        // Get yesterday's date (sleep data is for the previous night)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        const hours = await getSleepData(dateStr);

        if (hours > 0) {
          setSleepHours(hours);
          setSleepDataSource('healthkit');
        }

        setIsLoadingHealthData(false);
      }
    };

    fetchSleepData();
  }, [step, healthKitEnabled]);

  if (!isOpen) return null;

  const handleEnableHealthKit = async () => {
    const granted = await requestHealthPermissions();

    if (granted) {
      setHealthKitEnabled(true);
      updateSettings({ healthKitEnabled: true });

      // Immediately fetch sleep data
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      setIsLoadingHealthData(true);
      const hours = await getSleepData(dateStr);

      if (hours > 0) {
        setSleepHours(hours);
        setSleepDataSource('healthkit');
      }

      setIsLoadingHealthData(false);
    }
  };

  const handleSave = () => {
    const wellnessData = {
      muscleSoreness: muscleSoreness || 3,
      perceivedRecovery: perceivedRecovery || 3,
      perceivedEnergy: perceivedEnergy || 3,
      sleepHours,
      sleepQuality: sleepQuality || 3,
      stressLevel: stressLevel || 3
    };

    if (existingLog) {
      updateDailyLog(today, wellnessData);
    } else {
      addDailyLog({
        date: today,
        ...wellnessData
      });
    }

    setStep('complete');
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const goToNextStep = () => {
    const steps: Step[] = ['soreness', 'recovery', 'energy', 'sleep', 'stress'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    } else {
      handleSave();
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'soreness': return muscleSoreness !== null;
      case 'recovery': return perceivedRecovery !== null;
      case 'energy': return perceivedEnergy !== null;
      case 'sleep': return sleepQuality !== null;
      case 'stress': return stressLevel !== null;
      default: return false;
    }
  };

  const getStepProgress = () => {
    const steps: Step[] = ['soreness', 'recovery', 'energy', 'sleep', 'stress'];
    const currentIndex = steps.indexOf(step);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const renderRatingButtons = (
    options: RatingOption[],
    selected: number | null,
    onSelect: (value: number) => void
  ) => (
    <div className="flex justify-between gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`
            flex-1 flex flex-col items-center justify-center p-3 rounded-xl
            transition-all duration-200 min-h-[80px]
            ${selected === option.value
              ? 'bg-[#ccff00] text-black ring-2 ring-[#ccff00] scale-105'
              : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }
          `}
        >
          <span className="text-2xl mb-1">{option.emoji}</span>
          <span className="text-xs font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );

  const renderSleepStep = () => (
    <div className="space-y-6">
      {/* HealthKit Integration Banner */}
      {healthKitAvailable && !healthKitEnabled && (
        <div className="bg-[#ccff00]/10 border border-[#ccff00]/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ccff00]/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-[#ccff00]" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white mb-1">Auto-import Sleep Data</h4>
              <p className="text-xs text-gray-400 mb-3">
                Connect Apple Health to automatically track your sleep. No more manual entry!
              </p>
              <button
                onClick={handleEnableHealthKit}
                className="w-full py-2 px-4 bg-[#ccff00] text-black rounded-lg font-bold text-sm hover:bg-[#b8e600] transition-colors"
              >
                Enable HealthKit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleep Data Source Indicator */}
      {healthKitEnabled && sleepDataSource === 'healthkit' && (
        <div className="flex items-center justify-center gap-2 text-xs text-[#ccff00] bg-[#ccff00]/10 py-2 px-3 rounded-lg">
          <Smartphone className="w-4 h-4" />
          <span>Imported from Apple Health</span>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoadingHealthData && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 py-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-[#ccff00] rounded-full animate-spin" />
          <span>Loading sleep data...</span>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-3">How many hours did you sleep?</label>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              setSleepHours(Math.max(0, sleepHours - 0.5));
              setSleepDataSource('manual'); // Mark as manually edited
            }}
            className="w-12 h-12 rounded-full bg-zinc-800 text-white text-2xl hover:bg-zinc-700"
          >
            -
          </button>
          <div className="text-center">
            <span className="text-5xl font-bold text-[#ccff00]">{sleepHours}</span>
            <span className="text-xl text-gray-400 ml-1">hrs</span>
          </div>
          <button
            onClick={() => {
              setSleepHours(Math.min(12, sleepHours + 0.5));
              setSleepDataSource('manual'); // Mark as manually edited
            }}
            className="w-12 h-12 rounded-full bg-zinc-800 text-white text-2xl hover:bg-zinc-700"
          >
            +
          </button>
        </div>
        <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              sleepHours < 6 ? 'bg-red-500' :
              sleepHours < 7 ? 'bg-yellow-500' :
              sleepHours <= 9 ? 'bg-green-500' :
              'bg-yellow-500'
            }`}
            style={{ width: `${(sleepHours / 12) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {sleepHours < 6 ? 'Below optimal - may impact recovery' :
           sleepHours < 7 ? 'Slightly below optimal' :
           sleepHours <= 9 ? 'Optimal range for recovery' :
           'Above typical needs'}
        </p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-3">How was your sleep quality?</label>
        {renderRatingButtons(SLEEP_QUALITY_OPTIONS, sleepQuality, setSleepQuality)}
      </div>
    </div>
  );

  const renderCompletionStep = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-20 h-20 rounded-full bg-[#ccff00]/20 flex items-center justify-center mb-4 animate-pulse">
        <Sparkles className="w-10 h-10 text-[#ccff00]" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Check-in Complete!</h3>
      <p className="text-gray-400">
        Your wellness data is being used to optimize your training.
      </p>
    </div>
  );

  const stepConfig = {
    soreness: {
      icon: Activity,
      title: 'How sore are your muscles?',
      subtitle: 'Rate your overall muscle soreness from yesterday',
      content: renderRatingButtons(SORENESS_OPTIONS, muscleSoreness, setMuscleSoreness)
    },
    recovery: {
      icon: Heart,
      title: 'How recovered do you feel?',
      subtitle: 'Rate your overall recovery status',
      content: renderRatingButtons(RECOVERY_OPTIONS, perceivedRecovery, setPerceivedRecovery)
    },
    energy: {
      icon: Zap,
      title: "What's your energy level?",
      subtitle: 'How energized do you feel right now?',
      content: renderRatingButtons(ENERGY_OPTIONS, perceivedEnergy, setPerceivedEnergy)
    },
    sleep: {
      icon: Moon,
      title: 'How did you sleep?',
      subtitle: 'Sleep quality significantly impacts recovery',
      content: renderSleepStep()
    },
    stress: {
      icon: Brain,
      title: 'How stressed are you?',
      subtitle: 'Mental stress affects physical recovery',
      content: renderRatingButtons(STRESS_OPTIONS, stressLevel, setStressLevel)
    },
    complete: {
      icon: Sparkles,
      title: 'Done!',
      subtitle: '',
      content: renderCompletionStep()
    }
  };

  const currentStep = stepConfig[step];
  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 rounded-2xl w-full max-w-md overflow-hidden border border-zinc-800">
        {/* Header */}
        <div className="relative p-4 border-b border-zinc-800">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress bar */}
          {step !== 'complete' && (
            <div className="h-1 bg-zinc-800 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-[#ccff00] transition-all duration-300"
                style={{ width: `${getStepProgress()}%` }}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ccff00]/20 flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-[#ccff00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{currentStep.title}</h2>
              {currentStep.subtitle && (
                <p className="text-sm text-gray-400">{currentStep.subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {currentStep.content}
        </div>

        {/* Footer */}
        {step !== 'complete' && (
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={goToNextStep}
              disabled={!canProceed()}
              className={`
                w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2
                transition-all duration-200
                ${canProceed()
                  ? 'bg-[#ccff00] text-black hover:bg-[#b8e600]'
                  : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {step === 'stress' ? 'Complete Check-in' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyWellnessCheckin;
