
export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio';
export type ExerciseCategory = 'Compound' | 'Isolation' | 'Cardio' | 'Machine' | 'Bodyweight' | 'Plyometric';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: string;
  category: ExerciseCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructions?: string; // Legacy field, kept for compatibility if needed
  formGuide: string[];
  commonMistakes: string[];
  tips: string[];
  gifUrl?: string; // Placeholder URL
  videoUrl?: string; // YouTube video URL for exercise demonstration
}

export type SetType = 'N' | 'W' | 'D' | 'F'; // Normal, Warmup, Drop, Failure

// Phase 2 AI: Track AI suggestion acceptance for learning
export interface SuggestionFeedback {
  exerciseId: string;
  suggestedWeight: number;
  actualWeight: number;
  suggestedReps: [number, number];
  actualReps: number;
  accepted: boolean; // Did user use suggested weight?
  timestamp: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface SetLog {
  id: string;
  reps: number;
  weight: number; // in lbs or kg
  rpe?: number; // Rate of Perceived Exertion (1-10)
  type: SetType;
  completed: boolean;

  // Phase 2 AI: Track AI suggestions and user acceptance
  aiSuggestion?: {
    weight: number;
    reps: [number, number];
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  aiSuggestionAccepted?: boolean; // Did user accept the AI suggestion?
}

export interface ExerciseLog {
  id: string;
  exerciseId: string;
  sets: SetLog[];
  notes?: string;
  supersetId?: string; // ID linking multiple logs together
}

export interface BiometricPoint {
  timestamp: number;
  heartRate: number;
}

export interface WorkoutSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  logs: ExerciseLog[];
  status: 'active' | 'completed' | 'template' | 'draft';
  sourceTemplateId?: string; // Tracks which template spawned this session
  biometrics?: BiometricPoint[]; // Phase 4: Heart Rate Data
  notes?: string; // General workout-level notes with tag support (#injury, #form, etc.)
}

export interface UserStats {
  totalWorkouts: number;
  totalVolume: number; // Cumulative weight moved
  streak: number;
}

export interface Goal {
  type: 'Build Muscle' | 'Lose Fat' | 'Improve Endurance' | 'General Fitness';
  targetPerWeek: number;
}

export type PRType = 'weight' | 'volume' | 'reps';

export interface PersonalRecord {
  value: number; // The PR value (weight in lbs/kg, volume in lbs/kg, or rep count)
  date: number;
  type: PRType;
  reps?: number; // For weight PRs, track the reps achieved at that weight
  weight?: number; // For rep PRs, track the weight used for those reps
  setDetails?: { weight: number; reps: number }[]; // For volume PRs, track all sets
}

export interface ExercisePRHistory {
  exerciseId: string;
  records: PersonalRecord[]; // All historical PRs sorted by date (newest first)
  bestWeight?: PersonalRecord; // Best weight PR
  bestVolume?: PersonalRecord; // Best volume PR (total weight × reps)
  bestReps?: PersonalRecord; // Best reps PR (most reps at any weight)
}

export interface ProgramSession {
  templateId: string;
  week: number;
  day: number;
}

export type ProgramGoal = 'Hypertrophy' | 'Strength' | 'Powerlifting' | 'Power-Building' | 'General Fitness';
export type ProgramSplitType = 'PPL' | 'Upper/Lower' | 'Full Body' | 'Body Part Split';
export type ProgramDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Program {
  id: string;
  name: string;
  description: string;
  weeks: number;
  sessions: ProgramSession[]; // Default frequency sessions
  // Metadata for filtering
  goal: ProgramGoal;
  splitType: ProgramSplitType;
  difficulty: ProgramDifficulty;
  frequency: number; // Default/minimum frequency
  // Support for multiple frequency variants (e.g., GZCLP 3-day vs 4-day, nSuns 4/5/6-day)
  supportedFrequencies?: number[]; // e.g., [3, 4] for GZCLP, [4, 5, 6] for nSuns
  frequencyVariants?: {
    [key: number]: {
      sessions: ProgramSession[];
      description?: string; // Optional description for this variant
    };
  };
}

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  neck?: number;
  shoulders?: number;
  leftCalf?: number;
  rightCalf?: number;
}

export interface DailyLog {
    date: string; // YYYY-MM-DD
    sleepHours?: number;
    sleepQuality?: number; // 1-5 scale (subjective sleep quality)
    proteinGrams?: number;
    waterLitres?: number;
    stressLevel?: number; // 1-5 scale (life stress)
    bodyweight?: number; // Bodyweight in lbs or kg
    measurements?: BodyMeasurements; // Body measurements in inches/cm
    progressPhoto?: string; // Base64 encoded image or URL

    // ML Wellness Features (for fatigue prediction)
    muscleSoreness?: number;      // 1-5 scale (1 = none, 5 = extreme)
    perceivedRecovery?: number;   // 1-5 scale (1 = exhausted, 5 = fully recovered)
    perceivedEnergy?: number;     // 1-5 scale (1 = drained, 5 = energized)

    // Post-workout feedback (for RL bandit)
    workoutDifficulty?: number;   // 1-5 scale (how hard was today's workout)
    workoutSatisfaction?: number; // 1-5 scale (did you perform well)
    hadPainOrDiscomfort?: boolean; // Any pain/injury during workout
}

export interface NotificationSettings {
  enabled: boolean; // Master toggle for all notifications
  workoutReminders: boolean;
  restTimerAlerts: boolean;
  prCelebrations: boolean;
  weeklySummary: boolean;
  reminderTime?: string; // Time for workout reminders (HH:MM format, e.g., "09:00")
  reminderDays?: number[]; // Days of week (0-6, Sunday-Saturday) for workout reminders
}

export interface UserSettings {
  name: string;
  units: 'kg' | 'lbs';
  goal: Goal;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  availableEquipment: string[];
  onboardingCompleted: boolean;
  personalRecords: Record<string, ExercisePRHistory>; // exerciseId -> PR History with best weight/volume/reps
  defaultRestTimer: number; // in seconds
  barWeight: number; // Weight of the bar (e.g., 45lbs)
  availablePlates?: {
    kg: number[];
    lbs: number[];
  }; // Customizable plates available in user's gym
  bodyweight?: number; // User's bodyweight in lbs (for strength score calculations)
  gender?: 'male' | 'female'; // For strength standard classifications
  activeProgram?: {
      programId: string;
      currentSessionIndex: number;
      startDate: number;
      selectedFrequency?: number; // User's chosen training frequency (e.g., 3, 4, 5, 6 days/week)
  };
  ironCloud?: {
      enabled: boolean;
      email?: string;
      lastSync?: number;
  };
  profilePictureUrl?: string; // Cloud storage URL for profile picture
  notifications?: NotificationSettings;
  favoriteExercises?: string[]; // Array of exerciseIds that user has starred

  // Phase 2 AI: Personalized learning from user behavior
  suggestionBias?: Record<string, number>; // exerciseId -> bias multiplier (1.0 = neutral, >1.0 = user lifts heavier, <1.0 = lighter)
  suggestionHistory?: SuggestionFeedback[]; // Store recent suggestion feedback for learning (last 50 per exercise)

  // Percentage-Based Programming (Greg Nuckols)
  trainingMaxes?: Record<string, TrainingMax>; // exerciseId -> Training Max
  activeProgramCycle?: {
    programId: string;
    currentCycle: number;
    cycleStartDate: number;
    weekInCycle: number;
  };

  // Body Metrics Goals (P2 Enhancement)
  bodyMetricsGoals?: BodyMetricsGoals;

  // Auto-Progression Settings (Phase 3)
  autoProgression?: {
    enabled: boolean;
    upperBodyIncrement: number; // lbs or kg
    lowerBodyIncrement: number; // lbs or kg
  };

  // Enhanced Rest Timer Options (Phase 3)
  restTimerOptions?: {
    sound: boolean;
    vibration: boolean;
    autoStart: boolean;
    customRestTimes?: {
      compound: number; // Heavy compound lifts (squat, bench, deadlift)
      isolation: number; // Isolation exercises
      cardio: number; // Cardio/conditioning
    };
  };
}

// Body Metrics Goals
export interface BodyMetricsGoals {
  targetWeight?: {
    value: number;
    units: 'kg' | 'lbs';
    startDate: number;
    targetDate?: number; // Optional deadline
    startWeight: number;
    direction: 'lose' | 'gain' | 'maintain';
  };
  measurements?: {
    chest?: { target: number; startValue: number; startDate: number };
    waist?: { target: number; startValue: number; startDate: number };
    hips?: { target: number; startValue: number; startDate: number };
    arms?: { target: number; startValue: number; startDate: number };
    thighs?: { target: number; startValue: number; startDate: number };
  };
  weeklyWeightChange?: number; // Target weekly change (0.5-1 lbs for healthy rate)
}

// ============================================
// Percentage-Based Programming Types
// ============================================

export interface PercentageSet {
  percentage: number;      // 70, 75, 80, etc.
  reps: number | 'AMAP';   // 5, 8, or "AMAP"
  rpe?: number;            // Optional RPE target
  rest?: number;           // Rest time in seconds
}

export interface TrainingMaxHistory {
  value: number;
  date: number;
  calculatedFrom?: {
    type: '1RM' | '3RM' | '5RM' | 'AMAP' | 'manual';
    value: number;
    reps?: number;
  };
  reason?: string; // "Cycle completion", "Manual adjustment", "AMAP progression", etc.
}

export interface TrainingMax {
  exerciseId: string;
  value: number;           // Current Training Max value
  lastUpdated: number;
  calculatedFrom?: {
    type: '1RM' | '3RM' | '5RM' | 'manual';
    value: number;
    date: number;
  };
  history: TrainingMaxHistory[]; // All historical TM values
}

export interface AMAPProgressionRule {
  minReps: number;         // Minimum reps to qualify for this tier
  maxReps?: number;        // Maximum reps (undefined = no max)
  weightIncrease: number;  // Weight to add to TM (in lbs/kg)
  description?: string;    // "Excellent", "Great", "Good", etc.
}

export type AMAPProgressionTable = AMAPProgressionRule[];

// Extended SetLog for percentage-based workouts
export interface PercentageSetLog extends SetLog {
  prescribed?: PercentageSet;      // What was prescribed (e.g., "70% × 5")
  calculatedWeight?: number;       // Auto-calculated weight from TM
  trainingMaxUsed?: number;        // TM value used for calculation
  isAMAP?: boolean;                // Was this an AMAP set?
  percentageUsed?: number;         // Actual percentage used (if different from prescribed)
}

// Extended Program for percentage-based programming
export interface PercentageProgram extends Program {
  requiresTrainingMax?: boolean;                    // Does this program need TMs?
  requiredExercises?: string[];                     // Which exercises need TMs?
  cycleLength?: number;                             // Weeks per cycle (e.g., 4)
  progressionType?: 'linear' | 'amap' | 'rm-based' | 'rpe'; // How progression works
  amapTables?: Record<string, AMAPProgressionTable>; // exerciseId -> AMAP progression rules
  tmMultiplier?: number;                            // TM = 1RM × multiplier (default 0.90)
  deloadWeek?: number;                              // Which week is deload? (e.g., week 4)
  testingWeek?: number;                             // Which week is testing? (e.g., week 4)
}

// =============================================================================
// ML TYPES - Fatigue Prediction & Volume Optimization
// =============================================================================

/**
 * Volume adjustment actions for the RL bandit
 */
export enum VolumeAction {
  INCREASE_AGGRESSIVE = 0,  // +20% volume
  INCREASE_MODERATE = 1,    // +10% volume
  MAINTAIN = 2,             // No change
  DECREASE_MODERATE = 3,    // -10% volume
  DELOAD = 4                // -40% volume (full deload)
}

/**
 * Context features for the contextual bandit
 */
export interface BanditContext {
  // Volume State (per muscle group)
  currentVolume: Record<MuscleGroup, number>;  // Sets/week for each muscle
  volumeVsMAV: Record<MuscleGroup, number>;    // Current / MAV ratio
  weeksAtCurrentVolume: number;

  // Recovery State
  avgSoreness7d: number;        // 1-5 scale
  avgFatigue7d: number;         // 1-5 scale
  sleepQuality7d: number;       // 1-5 scale

  // Performance State
  recentPRCount: number;        // PRs in last 2 weeks
  stalledExercises: number;     // Exercises with no progress (4+ weeks)
  avgRPETrend: number;          // Rising/falling RPE (-1 to 1)

  // Training Context
  weeksSinceDeload: number;
  experienceLevel: number;      // 0=beginner, 1=intermediate, 2=advanced
  trainingFrequency: number;    // Sessions per week

  // Historical Response (learned)
  responseToVolumeIncrease: number;  // -1 to 1 (negative = bad response)
  responseToVolumeDecrease: number;
}

/**
 * Output from the fatigue prediction model
 */
export interface FatiguePrediction {
  fatigueScore: number;        // 0-100 (100 = maximum fatigue)
  deloadProbability: number;   // 0-1 (probability needing deload in next 7 days)
  daysUntilDeload: number;     // 1-14 (predicted days until deload needed)
  confidence: number;          // 0-1 (model confidence based on data quality)
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendation: string;
  factors: {
    acwr: number;              // Acute:Chronic Workload Ratio
    rpeTrend: number;          // RPE progression over time
    sleepDebt: number;         // Accumulated sleep deficit
    sorenessScore: number;     // Recent muscle soreness
    recoveryScore: number;     // Perceived recovery
  };
}

/**
 * Output from the volume bandit
 */
export interface VolumeRecommendation {
  action: VolumeAction;
  confidence: number;          // 0-1 (based on learning progress)
  muscleGroup: MuscleGroup;
  currentVolume: number;
  recommendedVolume: number;
  reasoning: string;
  expectedOutcome: {
    performanceGain: number;   // Expected % improvement
    fatigueRisk: number;       // 0-1 risk of overtraining
  };
}

/**
 * Daily features extracted for ML models
 */
export interface DailyMLFeatures {
  date: string;

  // Training Load Features
  volumeTotal: number;           // Total sets performed
  volumePerMuscle: Record<MuscleGroup, number>;

  // Intensity Features
  avgRPE: number;                // Average RPE (0-10)
  maxRPE: number;                // Max RPE in session
  avgIntensity: number;          // Avg % of 1RM

  // Recovery Features
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  sorenessLevel: number;
  perceivedRecovery: number;
  perceivedEnergy: number;

  // Derived Features
  acwr: number;                  // Acute:Chronic Workload Ratio
  daysSinceRest: number;
  daysSinceDeload: number;
  weeklyVolumeChange: number;    // % change from previous week
  rpeTrend: number;              // 7-day RPE slope

  // Context
  dayOfWeek: number;             // 0-6
  isRestDay: boolean;
  trainingPhase: 'accumulation' | 'intensification' | 'deload' | 'unknown';
}

/**
 * Training record for ML model learning (stored for retraining)
 */
export interface MLTrainingRecord {
  id: string;
  userId: string;
  timestamp: number;

  // Context at time of recommendation
  context: BanditContext;

  // Action taken
  action: VolumeAction;

  // Outcome (collected 1-2 weeks later)
  reward: number;
  performanceChange: number;
  adherence: number;
  avgSoreness: number;
  avgFatigue: number;
  hadInjury: boolean;
}

/**
 * Bandit model state (Thompson Sampling with per-muscle-group Beta distributions)
 */
export interface BanditState {
  // Per-muscle-group action states (each action has alpha/beta params)
  muscleGroupStates: Record<MuscleGroup, {
    decrease: { alpha: number; beta: number };
    maintain: { alpha: number; beta: number };
    increase: { alpha: number; beta: number };
  }>;
  totalUpdates: number;
  lastUpdate: number;
  history: Array<{
    timestamp: number;
    muscleGroup: MuscleGroup;
    action: VolumeAction;
    reward: number;
    context: BanditContext;
  }>;
}
