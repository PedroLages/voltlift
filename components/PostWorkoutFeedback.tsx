/**
 * Post-Workout Feedback Component
 *
 * Collects feedback immediately after completing a workout:
 * - Workout difficulty (1-5)
 * - Satisfaction (1-5)
 * - Pain/discomfort flag
 * - Optional notes
 *
 * This data feeds into the Thompson Sampling bandit for volume optimization.
 */

import React, { useState } from 'react';
import {
  X,
  Dumbbell,
  ThumbsUp,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Check,
  Sparkles
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { WorkoutSession } from '../types';

interface PostWorkoutFeedbackProps {
  workout: WorkoutSession;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface RatingOption {
  value: number;
  label: string;
  emoji: string;
  description: string;
}

const DIFFICULTY_OPTIONS: RatingOption[] = [
  { value: 1, label: 'Too Easy', emoji: '🥱', description: 'Barely felt challenged' },
  { value: 2, label: 'Easy', emoji: '😌', description: 'Could have done much more' },
  { value: 3, label: 'Moderate', emoji: '💪', description: 'Challenging but manageable' },
  { value: 4, label: 'Hard', emoji: '🔥', description: 'Pushed my limits' },
  { value: 5, label: 'Brutal', emoji: '😤', description: 'Absolutely maxed out' }
];

const SATISFACTION_OPTIONS: RatingOption[] = [
  { value: 1, label: 'Terrible', emoji: '😞', description: 'Very disappointed' },
  { value: 2, label: 'Below Par', emoji: '😕', description: 'Not my best' },
  { value: 3, label: 'Okay', emoji: '😐', description: 'Average session' },
  { value: 4, label: 'Good', emoji: '😊', description: 'Happy with my effort' },
  { value: 5, label: 'Excellent', emoji: '🌟', description: 'Crushed it!' }
];

type Step = 'difficulty' | 'satisfaction' | 'pain' | 'notes' | 'complete';

export function PostWorkoutFeedback({ workout, isOpen, onClose, onComplete }: PostWorkoutFeedbackProps) {
  const [step, setStep] = useState<Step>('difficulty');
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [hadPain, setHadPain] = useState<boolean | null>(null);
  const [painNotes, setPainNotes] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  const { dailyLogs, updateDailyLog, addDailyLog } = useStore();

  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  const handleSave = () => {
    const feedbackData = {
      workoutDifficulty: difficulty || 3,
      workoutSatisfaction: satisfaction || 3,
      hadPainOrDiscomfort: hadPain || false,
      notes: [painNotes, generalNotes].filter(Boolean).join(' | ')
    };

    // Update or create daily log with feedback
    const existingLog = dailyLogs[today];
    if (existingLog) {
      updateDailyLog(today, feedbackData);
    } else {
      addDailyLog({
        date: today,
        ...feedbackData
      });
    }

    setStep('complete');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const goToNextStep = () => {
    const steps: Step[] = ['difficulty', 'satisfaction', 'pain', 'notes'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    } else {
      handleSave();
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'difficulty': return difficulty !== null;
      case 'satisfaction': return satisfaction !== null;
      case 'pain': return hadPain !== null;
      case 'notes': return true; // Notes are optional
      default: return false;
    }
  };

  const getStepProgress = () => {
    const steps: Step[] = ['difficulty', 'satisfaction', 'pain', 'notes'];
    const currentIndex = steps.indexOf(step);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  // Calculate workout stats for display
  const totalSets = workout.logs.reduce((sum, log) => sum + log.sets.filter(s => s.completed).length, 0);
  const totalVolume = workout.logs.reduce((sum, log) =>
    sum + log.sets.filter(s => s.completed).reduce((setSum, set) =>
      setSum + (set.weight || 0) * (set.reps || 0), 0
    ), 0
  );
  const avgRPE = workout.logs
    .flatMap(log => log.sets.filter(s => s.completed && s.rpe))
    .reduce((sum, set, _, arr) => sum + (set.rpe || 0) / arr.length, 0);

  const renderRatingGrid = (
    options: RatingOption[],
    selected: number | null,
    onSelect: (value: number) => void
  ) => (
    <div className="grid grid-cols-5 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`
            flex flex-col items-center justify-center p-3 rounded-xl
            transition-all duration-200 min-h-[100px]
            ${selected === option.value
              ? 'bg-[#ccff00] text-black ring-2 ring-[#ccff00] scale-105'
              : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }
          `}
        >
          <span className="text-2xl mb-1">{option.emoji}</span>
          <span className="text-xs font-bold">{option.label}</span>
        </button>
      ))}
    </div>
  );

  const renderPainStep = () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={() => setHadPain(false)}
          className={`
            flex-1 p-6 rounded-xl border-2 transition-all duration-200
            ${hadPain === false
              ? 'border-green-500 bg-green-500/10'
              : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
            }
          `}
        >
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              hadPain === false ? 'bg-green-500' : 'bg-zinc-800'
            }`}>
              <Check className={`w-8 h-8 ${hadPain === false ? 'text-black' : 'text-gray-400'}`} />
            </div>
            <span className="font-bold text-lg">No Pain</span>
            <span className="text-sm text-gray-400 mt-1">Felt good throughout</span>
          </div>
        </button>

        <button
          onClick={() => setHadPain(true)}
          className={`
            flex-1 p-6 rounded-xl border-2 transition-all duration-200
            ${hadPain === true
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
            }
          `}
        >
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              hadPain === true ? 'bg-orange-500' : 'bg-zinc-800'
            }`}>
              <AlertTriangle className={`w-8 h-8 ${hadPain === true ? 'text-black' : 'text-gray-400'}`} />
            </div>
            <span className="font-bold text-lg">Some Discomfort</span>
            <span className="text-sm text-gray-400 mt-1">Pain or unusual feeling</span>
          </div>
        </button>
      </div>

      {hadPain && (
        <div className="animate-fadeIn">
          <label className="block text-sm text-gray-400 mb-2">
            What did you experience? (optional)
          </label>
          <textarea
            value={painNotes}
            onChange={(e) => setPainNotes(e.target.value)}
            placeholder="e.g., Sharp pain in right shoulder during overhead press..."
            className="w-full p-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-gray-500 resize-none h-24 focus:outline-none focus:border-[#ccff00]"
          />
        </div>
      )}
    </div>
  );

  const renderNotesStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Any additional thoughts about this workout? This is optional but helps improve your recommendations.
      </p>
      <textarea
        value={generalNotes}
        onChange={(e) => setGeneralNotes(e.target.value)}
        placeholder="e.g., Felt strong on squats, might increase weight next time. Bench felt off today..."
        className="w-full p-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-gray-500 resize-none h-32 focus:outline-none focus:border-[#ccff00]"
      />

      {/* Quick workout summary */}
      <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
        <h4 className="text-sm font-bold text-gray-400 uppercase">Workout Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[#ccff00]">{totalSets}</div>
            <div className="text-xs text-gray-500">Sets</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#ccff00]">{Math.round(totalVolume).toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total lbs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#ccff00]">{avgRPE ? avgRPE.toFixed(1) : '--'}</div>
            <div className="text-xs text-gray-500">Avg RPE</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompletionStep = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-20 h-20 rounded-full bg-[#ccff00] flex items-center justify-center mb-4 animate-bounce">
        <Sparkles className="w-10 h-10 text-black" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Feedback Received!</h3>
      <p className="text-gray-400 mb-4">
        This helps optimize your future training volume.
      </p>

      {/* Show what was recorded */}
      <div className="bg-zinc-900 rounded-xl p-4 w-full text-left">
        <div className="flex justify-between py-2 border-b border-zinc-800">
          <span className="text-gray-400">Difficulty</span>
          <span className="text-white">{DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.label}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-zinc-800">
          <span className="text-gray-400">Satisfaction</span>
          <span className="text-white">{SATISFACTION_OPTIONS.find(s => s.value === satisfaction)?.label}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-400">Any Pain</span>
          <span className={hadPain ? 'text-orange-500' : 'text-green-500'}>
            {hadPain ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );

  const stepConfig = {
    difficulty: {
      icon: Dumbbell,
      title: 'How hard was this workout?',
      subtitle: 'Rate the overall difficulty',
      content: (
        <>
          {renderRatingGrid(DIFFICULTY_OPTIONS, difficulty, setDifficulty)}
          {difficulty && (
            <p className="text-sm text-gray-400 text-center mt-4 animate-fadeIn">
              {DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.description}
            </p>
          )}
        </>
      )
    },
    satisfaction: {
      icon: ThumbsUp,
      title: 'How satisfied are you?',
      subtitle: 'Rate your overall satisfaction with this session',
      content: (
        <>
          {renderRatingGrid(SATISFACTION_OPTIONS, satisfaction, setSatisfaction)}
          {satisfaction && (
            <p className="text-sm text-gray-400 text-center mt-4 animate-fadeIn">
              {SATISFACTION_OPTIONS.find(s => s.value === satisfaction)?.description}
            </p>
          )}
        </>
      )
    },
    pain: {
      icon: AlertTriangle,
      title: 'Any pain or discomfort?',
      subtitle: 'This helps us adjust recommendations',
      content: renderPainStep()
    },
    notes: {
      icon: MessageSquare,
      title: 'Anything else to add?',
      subtitle: 'Optional notes about this workout',
      content: renderNotesStep()
    },
    complete: {
      icon: Sparkles,
      title: 'All Done!',
      subtitle: '',
      content: renderCompletionStep()
    }
  };

  const currentStep = stepConfig[step];
  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
      <div className="bg-zinc-950 rounded-2xl w-full max-w-md overflow-hidden border border-zinc-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-4 border-b border-zinc-800 sticky top-0 bg-zinc-950">
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
          <div className="p-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-950">
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
              {step === 'notes' ? 'Submit Feedback' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>

            {step === 'notes' && (
              <button
                onClick={handleSave}
                className="w-full py-3 mt-2 text-gray-400 hover:text-white text-sm"
              >
                Skip Notes
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PostWorkoutFeedback;
