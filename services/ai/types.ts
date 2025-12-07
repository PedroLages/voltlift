/**
 * AI/LLM Integration Types
 *
 * Core type definitions for the VoltLift AI pipeline.
 */

import { Exercise, WorkoutSession, UserSettings, MuscleGroup, Program } from '../../types';

// =============================================================================
// LLM Provider Configuration
// =============================================================================

export type LLMProvider = 'gemini-flash' | 'gemini-pro' | 'local';

export interface LLMConfig {
  provider: LLMProvider;
  maxTokens: number;
  temperature: number;
  timeout: number; // ms
  retries: number;
}

export const DEFAULT_LLM_CONFIG: Record<LLMProvider, LLMConfig> = {
  'gemini-flash': {
    provider: 'gemini-flash',
    maxTokens: 500,
    temperature: 0.7,
    timeout: 10000,
    retries: 2,
  },
  'gemini-pro': {
    provider: 'gemini-pro',
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 30000,
    retries: 1,
  },
  'local': {
    provider: 'local',
    maxTokens: 0, // N/A for local
    temperature: 0,
    timeout: 100,
    retries: 0,
  },
};

// =============================================================================
// Context Types - User data passed to LLM
// =============================================================================

export interface UserContext {
  name: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  goal: {
    type: string;
    targetPerWeek: number;
  };
  units: 'kg' | 'lbs';
  bodyweight?: number;
  trainingAge?: number; // weeks since first workout
}

export interface WorkoutContext {
  currentExercise?: Exercise;
  currentSessionDuration?: number; // minutes
  exercisesCompleted: number;
  totalVolume: number; // weight * reps
  averageRPE?: number;
  muscleGroupsWorked: MuscleGroup[];
}

export interface HistoricalContext {
  recentWorkouts: WorkoutSummary[];
  personalRecords: PRSummary[];
  weeklyVolume: Record<MuscleGroup, number>;
  streakDays: number;
  totalWorkouts: number;
}

export interface WorkoutSummary {
  date: string;
  duration: number;
  exercises: string[]; // exercise names
  totalVolume: number;
  averageRPE?: number;
}

export interface PRSummary {
  exerciseName: string;
  prType: 'weight' | 'volume' | 'reps';
  value: number;
  date: string;
}

export interface AIContext {
  user: UserContext;
  workout?: WorkoutContext;
  history: HistoricalContext;
  biomarkers?: BiomarkerContext;
}

export interface BiomarkerContext {
  sleepHours?: number;
  stressLevel?: number;
  recoveryScore: number;
  fatigueStatus: 'Fresh' | 'Optimal' | 'High Fatigue';
}

// =============================================================================
// RAG System Types
// =============================================================================

export interface RAGDocument {
  id: string;
  type: 'exercise_guide' | 'program_info' | 'fitness_knowledge' | 'form_tip';
  content: string;
  metadata: {
    exerciseId?: string;
    programId?: string;
    muscleGroup?: MuscleGroup;
    difficulty?: string;
    source?: string;
  };
  embedding?: number[]; // Vector embedding (if using external vector DB)
}

export interface RAGQuery {
  query: string;
  type?: RAGDocument['type'];
  filters?: {
    exerciseId?: string;
    muscleGroup?: MuscleGroup;
    difficulty?: string;
  };
  topK?: number;
}

export interface RAGResult {
  document: RAGDocument;
  score: number; // Relevance score 0-1
}

// =============================================================================
// Prompt Types
// =============================================================================

export interface PromptTemplate {
  id: string;
  version: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  maxTokens: number;
  temperature: number;
  model: LLMProvider;
}

export interface PromptVariables {
  [key: string]: string | number | boolean | object;
}

export interface CompiledPrompt {
  systemPrompt: string;
  userPrompt: string;
  tokenEstimate: number;
}

// =============================================================================
// AI Response Types
// =============================================================================

export interface AIResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'llm' | 'cache' | 'fallback';
  latency: number; // ms
  tokensUsed?: number;
  cost?: number; // estimated cost in cents
}

// Structured response types for different features
export interface ProgressiveOverloadResponse {
  tip: string;
  suggestedWeight?: number;
  suggestedReps?: [number, number];
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface FormGuideResponse {
  summary: string;
  keyPoints: string[];
  commonMistakes: string[];
  personalizedTip?: string;
}

export interface WorkoutSummaryResponse {
  summary: string;
  highlights: string[];
  prsAchieved: string[];
  areasToImprove: string[];
  nextSessionFocus: string;
}

export interface ProgramRecommendationResponse {
  programId: string;
  programName: string;
  matchScore: number;
  reasoning: string;
  expectedOutcomes: string[];
}

export interface CoachingResponse {
  message: string;
  suggestions: string[];
  motivation?: string;
  warningsOrCautions?: string[];
}

// =============================================================================
// Cache Types
// =============================================================================

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in ms
  hits: number;
}

export interface CacheConfig {
  maxSize: number; // Max entries
  defaultTTL: number; // Default TTL in ms
  persistToStorage: boolean;
}

// =============================================================================
// Token Tracking
// =============================================================================

export interface TokenUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  feature: string;
  cost: number;
}

export interface TokenBudget {
  dailyLimit: number;
  monthlyLimit: number;
  currentDailyUsage: number;
  currentMonthlyUsage: number;
}

// =============================================================================
// Agent Types (for multi-step reasoning)
// =============================================================================

export type AgentAction =
  | 'analyze_history'
  | 'check_recovery'
  | 'suggest_exercise'
  | 'explain_program'
  | 'generate_response';

export interface AgentStep {
  action: AgentAction;
  input: any;
  output: any;
  reasoning: string;
  timestamp: number;
}

export interface AgentPlan {
  goal: string;
  steps: AgentAction[];
  context: AIContext;
}

export interface AgentResult {
  success: boolean;
  finalResponse: string;
  steps: AgentStep[];
  totalLatency: number;
  totalTokens: number;
}
