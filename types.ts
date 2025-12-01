
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

export interface PersonalRecord {
  weight: number;
  date: number;
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
  personalRecords: Record<string, PersonalRecord>; // exerciseId -> Max Weight
  defaultRestTimer: number; // in seconds
  barWeight: number; // Weight of the bar (e.g., 45lbs)
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
