
export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio';
export type ExerciseCategory = 'Compound' | 'Isolation' | 'Cardio' | 'Machine' | 'Bodyweight' | 'Plyometric';

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
}

export type SetType = 'N' | 'W' | 'D' | 'F'; // Normal, Warmup, Drop, Failure

export interface SetLog {
  id: string;
  reps: number;
  weight: number; // in lbs or kg
  rpe?: number; // Rate of Perceived Exertion (1-10)
  type: SetType;
  completed: boolean;
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
  status: 'active' | 'completed' | 'template';
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

export interface Program {
  id: string;
  name: string;
  description: string;
  weeks: number;
  sessions: ProgramSession[];
}

export interface DailyLog {
    date: string; // YYYY-MM-DD
    sleepHours?: number;
    proteinGrams?: number;
    waterLitres?: number;
    stressLevel?: number;
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
  bodyweight?: number; // User's bodyweight in lbs (for strength score calculations)
  gender?: 'male' | 'female'; // For strength standard classifications
  activeProgram?: {
      programId: string;
      currentSessionIndex: number;
      startDate: number;
  };
  ironCloud?: {
      enabled: boolean;
      email?: string;
      lastSync?: number;
  };
}
