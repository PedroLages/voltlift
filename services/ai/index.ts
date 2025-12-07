/**
 * VoltLift AI Service
 *
 * Main entry point for all AI features. Orchestrates:
 * - Local ML (progressive overload, recovery scoring)
 * - Cloud LLM (explanations, coaching, motivation)
 * - RAG (exercise guides, fitness knowledge)
 * - Caching (cost optimization, latency reduction)
 *
 * Design Principles:
 * 1. Offline-first: Critical features work without internet
 * 2. Cost-efficient: Cache aggressively, use Flash over Pro
 * 3. Graceful degradation: Always return something useful
 * 4. Transparent: Show users when AI is unavailable
 */

import {
  AIResponse,
  ProgressiveOverloadResponse,
  FormGuideResponse,
  WorkoutSummaryResponse,
  CoachingResponse,
  AIContext,
} from './types';
import { llmClient, decideOrchestration, selectModel } from './llm';
import { compilePrompt, getPromptWithABTest, getTemplateConfig, buildRPEInfo } from './prompts';
import { withCache, TTL_BY_FEATURE, aiCache, semanticCache } from './cache';
import { ragStore, getExerciseContext, getKnowledgeForTopic, semanticSearch } from './rag';
import {
  buildFullContext,
  buildUserContext,
  buildExerciseContext,
  compressContext,
} from './contextBuilder';
import {
  getProgressiveOverloadFallback,
  getRuleBasedTip,
  getFormGuideFallback,
  getWorkoutSummaryFallback,
  getMotivationFallback,
  getCoachingFallback,
  getErrorMessage,
} from './fallbacks';
import { runCoachingAgent, getQuickCoachingResponse } from './agent';

// Import local ML services
import { getSuggestion, ProgressiveSuggestion } from '../progressiveOverload';
import { WorkoutSession, UserSettings, DailyLog, Exercise } from '../../types';
import { EXERCISE_LIBRARY } from '../../constants';

// =============================================================================
// Initialization
// =============================================================================

let initialized = false;

/**
 * Initialize AI services (call on app startup)
 */
export async function initializeAI(): Promise<void> {
  if (initialized) return;

  try {
    // Initialize RAG document store
    await ragStore.initialize();

    // Prune expired cache entries
    aiCache.pruneExpired();

    initialized = true;
    console.log('[AI] Services initialized');
  } catch (error) {
    console.error('[AI] Initialization failed:', error);
  }
}

// =============================================================================
// Progressive Overload
// =============================================================================

/**
 * Get progressive overload suggestion with optional LLM explanation
 *
 * Strategy:
 * - ALWAYS use local ML for the actual suggestion (offline-first)
 * - Optionally enhance with LLM explanation when online
 */
export async function getProgressiveOverloadSuggestion(params: {
  exerciseId: string;
  history: WorkoutSession[];
  settings: UserSettings;
  dailyLogs: Record<string, DailyLog>;
  activeWorkout?: WorkoutSession | null;
  enhanceWithLLM?: boolean;
}): Promise<AIResponse<ProgressiveOverloadResponse>> {
  const {
    exerciseId,
    history,
    settings,
    dailyLogs,
    activeWorkout,
    enhanceWithLLM = false,
  } = params;

  const startTime = Date.now();
  const exercise = EXERCISE_LIBRARY.find((e) => e.id === exerciseId);

  // Get previous workout for this exercise
  const previousLog = history
    .filter((h) => h.status === 'completed')
    .sort((a, b) => b.startTime - a.startTime)
    .flatMap((h) => h.logs)
    .find((l) => l.exerciseId === exerciseId);

  const today = new Date().toISOString().split('T')[0];

  // ALWAYS get local suggestion first (critical path)
  const localSuggestion = getSuggestion(
    exerciseId,
    previousLog,
    dailyLogs[today],
    history,
    activeWorkout?.startTime || Date.now(),
    settings.experienceLevel,
    settings.suggestionHistory
  );

  // Build base response from local suggestion
  const baseResponse = getProgressiveOverloadFallback(
    localSuggestion,
    exercise?.name || exerciseId,
    settings.units
  );

  // If LLM enhancement not requested or offline, return local
  if (!enhanceWithLLM || !navigator.onLine) {
    return {
      success: true,
      data: baseResponse,
      source: 'fallback',
      latency: Date.now() - startTime,
    };
  }

  // Try to enhance with LLM (optional, non-blocking)
  return withCache(
    'progressive_overload',
    {
      exerciseId,
      weight: localSuggestion.weight,
      reps: localSuggestion.reps,
      recoveryScore: localSuggestion.recoveryScore,
    },
    async () => {
      if (!llmClient.isAvailable()) {
        return {
          success: true,
          data: baseResponse,
          source: 'fallback' as const,
          latency: Date.now() - startTime,
        };
      }

      const { templateId } = getPromptWithABTest('progressive_overload');

      const prompt = compilePrompt(templateId, {
        userName: settings.name,
        experienceLevel: settings.experienceLevel,
        goal: settings.goal.type,
        exerciseName: exercise?.name || exerciseId,
        lastWeight: previousLog?.sets.filter((s) => s.completed).pop()?.weight || 0,
        lastReps: previousLog?.sets.filter((s) => s.completed).pop()?.reps || 0,
        units: settings.units,
        rpeInfo: buildRPEInfo(previousLog?.sets.filter((s) => s.completed).pop()?.rpe),
        rpe: previousLog?.sets.filter((s) => s.completed).pop()?.rpe || 'N/A',
        recoveryScore: localSuggestion.recoveryScore,
        estimated1RM: localSuggestion.estimated1RM || 0,
        currentIntensity: localSuggestion.currentIntensity || 0,
        recentContext: `Recent workouts: ${history.slice(0, 3).length} sessions this week`,
      });

      const config = getTemplateConfig(templateId);
      const response = await llmClient.generateText(prompt, config, 'progressive_overload');

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            ...baseResponse,
            tip: response.data, // Replace tip with LLM version
          },
          source: 'llm' as const,
          latency: Date.now() - startTime,
          tokensUsed: response.tokensUsed,
          cost: response.cost,
        };
      }

      return {
        success: true,
        data: baseResponse,
        source: 'fallback' as const,
        latency: Date.now() - startTime,
      };
    },
    TTL_BY_FEATURE['progressive_overload']
  );
}

// =============================================================================
// Form Guide
// =============================================================================

/**
 * Get form guide for an exercise
 *
 * Strategy:
 * - Use RAG to retrieve exercise data
 * - Optionally personalize with LLM
 */
export async function getFormGuide(params: {
  exerciseId: string;
  settings: UserSettings;
  question?: string;
  personalize?: boolean;
}): Promise<AIResponse<FormGuideResponse>> {
  const { exerciseId, settings, question, personalize = false } = params;
  const startTime = Date.now();

  const exercise = EXERCISE_LIBRARY.find((e) => e.id === exerciseId);
  if (!exercise) {
    return {
      success: false,
      error: 'Exercise not found',
      source: 'fallback',
      latency: Date.now() - startTime,
    };
  }

  // Get RAG context
  const ragContext = await getExerciseContext(exerciseId, true);

  // If no personalization, return static guide
  if (!personalize || !question) {
    const guide = getFormGuideFallback(exercise);
    return {
      success: true,
      data: guide,
      source: 'fallback',
      latency: Date.now() - startTime,
    };
  }

  // Personalize with LLM
  return withCache(
    'form_guide',
    { exerciseId, question: question.substring(0, 50) },
    async () => {
      if (!llmClient.isAvailable()) {
        return {
          success: true,
          data: getFormGuideFallback(exercise),
          source: 'fallback' as const,
          latency: Date.now() - startTime,
        };
      }

      const prompt = compilePrompt('form_guide', {
        exerciseName: exercise.name,
        experienceLevel: settings.experienceLevel,
        equipment: exercise.equipment,
        question: question,
        existingGuide: exercise.formGuide?.join('\n') || '',
        commonMistakes: exercise.commonMistakes?.join('\n') || '',
      });

      const response = await llmClient.generateText(prompt, { maxTokens: 300 }, 'form_guide');

      if (response.success && response.data) {
        const baseGuide = getFormGuideFallback(exercise);
        return {
          success: true,
          data: {
            ...baseGuide,
            personalizedTip: response.data,
          },
          source: 'llm' as const,
          latency: Date.now() - startTime,
          tokensUsed: response.tokensUsed,
        };
      }

      return {
        success: true,
        data: getFormGuideFallback(exercise),
        source: 'fallback' as const,
        latency: Date.now() - startTime,
      };
    },
    TTL_BY_FEATURE['form_guide']
  );
}

// =============================================================================
// Workout Summary
// =============================================================================

/**
 * Generate workout summary after completing a workout
 */
export async function generateWorkoutSummary(params: {
  workout: WorkoutSession;
  settings: UserSettings;
  previousWeekVolume?: number;
  prsAchieved?: string[];
}): Promise<AIResponse<WorkoutSummaryResponse>> {
  const { workout, settings, previousWeekVolume, prsAchieved = [] } = params;
  const startTime = Date.now();

  // Calculate workout stats
  const duration = workout.endTime
    ? Math.round((workout.endTime - workout.startTime) / 1000 / 60)
    : 0;

  let totalVolume = 0;
  let totalRPE = 0;
  let rpeCount = 0;

  workout.logs.forEach((log) => {
    log.sets.forEach((set) => {
      if (set.completed) {
        totalVolume += set.weight * set.reps;
        if (set.rpe) {
          totalRPE += set.rpe;
          rpeCount++;
        }
      }
    });
  });

  const avgRPE = rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : undefined;

  // Build exercise details string
  const exerciseDetails = workout.logs
    .map((log) => {
      const exercise = EXERCISE_LIBRARY.find((e) => e.id === log.exerciseId);
      const sets = log.sets.filter((s) => s.completed);
      const setStr = sets.map((s) => `${s.weight}${settings.units}x${s.reps}`).join(', ');
      return `- ${exercise?.name || log.exerciseId}: ${setStr}`;
    })
    .join('\n');

  // Get fallback first (always available)
  const fallbackSummary = getWorkoutSummaryFallback({
    workoutName: workout.name,
    duration,
    exerciseCount: workout.logs.length,
    totalVolume,
    prsAchieved,
    previousVolume: previousWeekVolume,
    units: settings.units,
  });

  // Try LLM enhancement
  return withCache(
    'workout_summary',
    { workoutId: workout.id },
    async () => {
      if (!llmClient.isAvailable()) {
        return {
          success: true,
          data: fallbackSummary,
          source: 'fallback' as const,
          latency: Date.now() - startTime,
        };
      }

      const prompt = compilePrompt('workout_summary', {
        userName: settings.name,
        workoutName: workout.name,
        duration,
        exerciseDetails,
        prsAchieved: prsAchieved.length > 0 ? prsAchieved.join(', ') : 'None',
        totalVolume,
        units: settings.units,
        averageRPE: avgRPE || 'Not tracked',
        previousWeekVolume: previousWeekVolume || 'Unknown',
      });

      const response = await llmClient.generateText(prompt, { maxTokens: 400 }, 'workout_summary');

      if (response.success && response.data) {
        // Parse LLM response into structured format
        return {
          success: true,
          data: {
            summary: response.data,
            highlights: fallbackSummary.highlights,
            prsAchieved: fallbackSummary.prsAchieved,
            areasToImprove: fallbackSummary.areasToImprove,
            nextSessionFocus: fallbackSummary.nextSessionFocus,
          },
          source: 'llm' as const,
          latency: Date.now() - startTime,
          tokensUsed: response.tokensUsed,
        };
      }

      return {
        success: true,
        data: fallbackSummary,
        source: 'fallback' as const,
        latency: Date.now() - startTime,
      };
    },
    TTL_BY_FEATURE['workout_summary']
  );
}

// =============================================================================
// Motivation
// =============================================================================

/**
 * Get motivational quote
 */
export async function getMotivation(params: {
  settings: UserSettings;
  context?: string;
  streak?: number;
}): Promise<AIResponse<string>> {
  const { settings, context, streak } = params;
  const startTime = Date.now();

  // Use fallback for offline or cached
  const fallback = getMotivationFallback(streak, settings.goal.type);

  return withCache(
    'motivation',
    { streak: streak || 0, goal: settings.goal.type },
    async () => {
      if (!llmClient.isAvailable()) {
        return {
          success: true,
          data: fallback,
          source: 'fallback' as const,
          latency: Date.now() - startTime,
        };
      }

      const prompt = compilePrompt('motivation', {
        context: context || 'Starting workout',
        streak: streak || 0,
        goal: settings.goal.type,
      });

      const response = await llmClient.generateText(prompt, { maxTokens: 30, temperature: 0.9 }, 'motivation');

      return {
        success: true,
        data: response.success && response.data ? response.data : fallback,
        source: response.success ? 'llm' as const : 'fallback' as const,
        latency: Date.now() - startTime,
        tokensUsed: response.tokensUsed,
      };
    },
    TTL_BY_FEATURE['motivation']
  );
}

// =============================================================================
// AI Coaching
// =============================================================================

/**
 * Get AI coaching response for complex queries
 * Uses the agent for multi-step reasoning
 */
export async function getCoachingResponse(params: {
  query: string;
  settings: UserSettings;
  history: WorkoutSession[];
  dailyLogs: Record<string, DailyLog>;
  activeWorkout?: WorkoutSession | null;
  useAgent?: boolean;
}): Promise<AIResponse<string>> {
  const {
    query,
    settings,
    history,
    dailyLogs,
    activeWorkout,
    useAgent = true,
  } = params;

  const startTime = Date.now();

  // Build context
  const context = buildFullContext({
    settings,
    history,
    dailyLogs,
    activeWorkout,
  });

  // Use agent for complex reasoning
  if (useAgent) {
    const agentResult = await runCoachingAgent(
      query,
      settings,
      history,
      dailyLogs,
      activeWorkout
    );

    return {
      success: agentResult.success,
      data: agentResult.finalResponse,
      source: agentResult.totalTokens > 0 ? 'llm' : 'fallback',
      latency: agentResult.totalLatency,
      tokensUsed: agentResult.totalTokens,
    };
  }

  // Simple response (no agent)
  const response = await getQuickCoachingResponse(query, context);

  return {
    success: true,
    data: response,
    source: llmClient.isAvailable() ? 'llm' : 'fallback',
    latency: Date.now() - startTime,
  };
}

// =============================================================================
// Knowledge Search
// =============================================================================

/**
 * Search fitness knowledge base
 */
export async function searchKnowledge(query: string): Promise<string[]> {
  await ragStore.initialize();

  const results = await semanticSearch(query, { limit: 5 });

  return results.map((r) => r.document.content);
}

// =============================================================================
// Exercise Visual Generation
// =============================================================================

/**
 * Generate exercise visual using image model
 */
export async function generateExerciseVisual(params: {
  exerciseId: string;
  size?: '1K' | '2K' | '4K';
}): Promise<AIResponse<string>> {
  const { exerciseId, size = '1K' } = params;
  const startTime = Date.now();

  const exercise = EXERCISE_LIBRARY.find((e) => e.id === exerciseId);
  if (!exercise) {
    return {
      success: false,
      error: 'Exercise not found',
      source: 'fallback',
      latency: Date.now() - startTime,
    };
  }

  // Check cache first
  return withCache(
    'exercise_visual',
    { exerciseId, size },
    async () => {
      if (!llmClient.isAvailable()) {
        return {
          success: false,
          error: 'LLM not available',
          source: 'fallback' as const,
          latency: Date.now() - startTime,
        };
      }

      const prompt = compilePrompt('exercise_visual', {
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        viewAngle: 'side view, showing full body position',
      });

      const response = await llmClient.generateImage(prompt.userPrompt, size);

      return {
        ...response,
        latency: Date.now() - startTime,
      };
    },
    TTL_BY_FEATURE['exercise_visual']
  );
}

// =============================================================================
// Status & Utilities
// =============================================================================

/**
 * Get AI service status
 */
export function getAIStatus(): {
  initialized: boolean;
  llmAvailable: boolean;
  cacheSize: number;
  usageStats: ReturnType<typeof llmClient.getUsageStats>;
} {
  return {
    initialized,
    llmAvailable: llmClient.isAvailable(),
    cacheSize: aiCache.getStats().size,
    usageStats: llmClient.getUsageStats(),
  };
}

/**
 * Clear AI cache
 */
export function clearAICache(): void {
  aiCache.clear();
  semanticCache.clear();
}

/**
 * Get user-friendly error message
 */
export { getErrorMessage };

// =============================================================================
// Re-exports
// =============================================================================

export type {
  AIResponse,
  ProgressiveOverloadResponse,
  FormGuideResponse,
  WorkoutSummaryResponse,
  CoachingResponse,
  AIContext,
} from './types';

export { buildFullContext, buildUserContext } from './contextBuilder';
