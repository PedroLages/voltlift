/**
 * AI Agent for Complex Multi-Step Reasoning
 *
 * Handles complex coaching queries that require:
 * - Multiple data analysis steps
 * - Combining local ML with LLM explanations
 * - Tool use (calling local services)
 *
 * Architecture:
 * 1. Plan: Determine required steps
 * 2. Execute: Run local analysis + LLM calls
 * 3. Synthesize: Combine results into response
 */

import {
  AgentAction,
  AgentStep,
  AgentPlan,
  AgentResult,
  AIContext,
  CoachingResponse,
} from './types';
import { llmClient, decideOrchestration } from './llm';
import { compilePrompt, buildHistoryContext, PROMPT_TEMPLATES } from './prompts';
import { buildFullContext, compressContext } from './contextBuilder';
import { getKnowledgeForTopic } from './rag';
import { withCache, TTL_BY_FEATURE } from './cache';
import { getCoachingFallback, getMotivationFallback } from './fallbacks';

// Import local ML services
import { getSuggestion, shouldDeloadWeek, checkVolumeWarning } from '../progressiveOverload';
import { analyzeWeakPoints, suggestExerciseVariations } from '../workoutIntelligence';
import { calculateOverallStrengthScore } from '../strengthScore';
import { WorkoutSession, UserSettings, DailyLog, ExerciseLog } from '../../types';
import { EXERCISE_LIBRARY } from '../../constants';

// =============================================================================
// Agent Tools (Local Services)
// =============================================================================

interface AgentTools {
  analyzeHistory: (history: WorkoutSession[], settings: UserSettings) => any;
  checkRecovery: (dailyLogs: Record<string, DailyLog>, history: WorkoutSession[]) => any;
  suggestExercise: (exerciseId: string, history: WorkoutSession[], dailyLogs: Record<string, DailyLog>) => any;
  analyzeWeakPoints: (history: WorkoutSession[], level: string) => any;
  checkDeload: (history: WorkoutSession[], dailyLogs: Record<string, DailyLog>) => any;
  getStrengthScore: (settings: UserSettings) => number;
}

const agentTools: AgentTools = {
  analyzeHistory: (history, settings) => {
    const completedWorkouts = history.filter(w => w.status === 'completed');
    const last30Days = completedWorkouts.filter(
      w => w.startTime > Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    // Calculate weekly frequency
    const weeks = Math.ceil(30 / 7);
    const avgFrequency = last30Days.length / weeks;

    // Calculate total volume trend
    const volumes = last30Days.map(w =>
      w.logs.reduce((sum, log) =>
        sum + log.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0), 0
      )
    );

    const avgVolume = volumes.length > 0
      ? volumes.reduce((a, b) => a + b, 0) / volumes.length
      : 0;

    // Recent vs previous volume trend
    const recentVolumes = volumes.slice(0, Math.floor(volumes.length / 2));
    const olderVolumes = volumes.slice(Math.floor(volumes.length / 2));

    const recentAvg = recentVolumes.length > 0
      ? recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
      : 0;
    const olderAvg = olderVolumes.length > 0
      ? olderVolumes.reduce((a, b) => a + b, 0) / olderVolumes.length
      : 0;

    const volumeTrend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    return {
      totalWorkouts: completedWorkouts.length,
      last30DaysWorkouts: last30Days.length,
      avgFrequency: Math.round(avgFrequency * 10) / 10,
      avgVolume: Math.round(avgVolume),
      volumeTrend: Math.round(volumeTrend),
      consistency: avgFrequency >= settings.goal.targetPerWeek ? 'on_track' : 'below_target',
    };
  },

  checkRecovery: (dailyLogs, history) => {
    const deloadCheck = shouldDeloadWeek(history, dailyLogs);
    const today = new Date().toISOString().split('T')[0];
    const todayLog = dailyLogs[today];

    return {
      shouldDeload: deloadCheck.shouldDeload,
      deloadReason: deloadCheck.reasoning,
      sleepHours: todayLog?.sleepHours,
      stressLevel: todayLog?.stressLevel,
      recentWorkoutCount: history.filter(
        w => w.status === 'completed' && w.startTime > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length,
    };
  },

  suggestExercise: (exerciseId, history, dailyLogs) => {
    // Get previous workout for this exercise
    const previousLog = history
      .filter(h => h.status === 'completed')
      .sort((a, b) => b.startTime - a.startTime)
      .flatMap(h => h.logs)
      .find(l => l.exerciseId === exerciseId);

    const today = new Date().toISOString().split('T')[0];
    const suggestion = getSuggestion(
      exerciseId,
      previousLog,
      dailyLogs[today],
      history,
      Date.now()
    );

    return {
      suggestion,
      hasHistory: !!previousLog,
      exerciseName: EXERCISE_LIBRARY.find(e => e.id === exerciseId)?.name || exerciseId,
    };
  },

  analyzeWeakPoints: (history, level) => {
    const analysis = analyzeWeakPoints(
      history,
      level.toLowerCase() as any
    );

    return {
      weakPoints: analysis.weakPoints.slice(0, 3),
      overallBalance: analysis.overallBalance,
      priorityAreas: analysis.priorityAreas,
      recommendations: analysis.recommendations,
    };
  },

  checkDeload: (history, dailyLogs) => {
    return shouldDeloadWeek(history, dailyLogs);
  },

  getStrengthScore: (settings) => {
    return calculateOverallStrengthScore(
      settings.personalRecords,
      settings.bodyweight || 180,
      settings.gender || 'male'
    );
  },
};

// =============================================================================
// Query Intent Classification
// =============================================================================

type QueryIntent =
  | 'progress_check'
  | 'exercise_suggestion'
  | 'program_advice'
  | 'recovery_question'
  | 'form_question'
  | 'general_coaching'
  | 'motivation';

function classifyIntent(query: string): QueryIntent {
  const queryLower = query.toLowerCase();

  // Progress-related
  if (
    queryLower.includes('progress') ||
    queryLower.includes('stronger') ||
    queryLower.includes('improve') ||
    queryLower.includes('gains') ||
    queryLower.includes('plateau')
  ) {
    return 'progress_check';
  }

  // Exercise-specific
  if (
    queryLower.includes('exercise') ||
    queryLower.includes('what should i do') ||
    queryLower.includes('substitute') ||
    queryLower.includes('alternative')
  ) {
    return 'exercise_suggestion';
  }

  // Program/routine
  if (
    queryLower.includes('program') ||
    queryLower.includes('routine') ||
    queryLower.includes('split') ||
    queryLower.includes('schedule')
  ) {
    return 'program_advice';
  }

  // Recovery
  if (
    queryLower.includes('tired') ||
    queryLower.includes('fatigue') ||
    queryLower.includes('recovery') ||
    queryLower.includes('rest') ||
    queryLower.includes('deload')
  ) {
    return 'recovery_question';
  }

  // Form
  if (
    queryLower.includes('form') ||
    queryLower.includes('technique') ||
    queryLower.includes('how to')
  ) {
    return 'form_question';
  }

  // Motivation
  if (
    queryLower.includes('motivat') ||
    queryLower.includes('inspire') ||
    queryLower.includes('push')
  ) {
    return 'motivation';
  }

  return 'general_coaching';
}

// =============================================================================
// Agent Planner
// =============================================================================

function createPlan(intent: QueryIntent, context: AIContext): AgentPlan {
  const plans: Record<QueryIntent, AgentAction[]> = {
    progress_check: ['analyze_history', 'check_recovery', 'generate_response'],
    exercise_suggestion: ['suggest_exercise', 'generate_response'],
    program_advice: ['analyze_history', 'check_recovery', 'generate_response'],
    recovery_question: ['check_recovery', 'generate_response'],
    form_question: ['generate_response'], // RAG handles this
    motivation: ['generate_response'],
    general_coaching: ['analyze_history', 'check_recovery', 'generate_response'],
  };

  return {
    goal: intent,
    steps: plans[intent],
    context,
  };
}

// =============================================================================
// Agent Executor
// =============================================================================

async function executePlan(
  plan: AgentPlan,
  query: string,
  history: WorkoutSession[],
  settings: UserSettings,
  dailyLogs: Record<string, DailyLog>
): Promise<AgentResult> {
  const steps: AgentStep[] = [];
  const startTime = Date.now();
  let totalTokens = 0;

  const toolResults: Record<string, any> = {};

  // Execute each step
  for (const action of plan.steps) {
    const stepStart = Date.now();
    let output: any;
    let reasoning: string;

    switch (action) {
      case 'analyze_history':
        output = agentTools.analyzeHistory(history, settings);
        reasoning = `Analyzed ${output.totalWorkouts} workouts. Consistency: ${output.consistency}`;
        break;

      case 'check_recovery':
        output = agentTools.checkRecovery(dailyLogs, history);
        reasoning = output.shouldDeload
          ? `Deload recommended: ${output.deloadReason}`
          : 'Recovery adequate';
        break;

      case 'suggest_exercise':
        // Extract exercise ID from query if mentioned
        const exerciseMatch = query.match(/for\s+(\w+(?:\s+\w+)*)/i);
        const exerciseId = exerciseMatch
          ? EXERCISE_LIBRARY.find(
              e => e.name.toLowerCase().includes(exerciseMatch[1].toLowerCase())
            )?.id || 'e1'
          : 'e1';
        output = agentTools.suggestExercise(exerciseId, history, dailyLogs);
        reasoning = `Suggestion for ${output.exerciseName}: ${output.suggestion.weight}x${output.suggestion.reps.join('-')}`;
        break;

      case 'generate_response':
        // Build prompt with accumulated context
        const contextStr = compressContext(plan.context, 800);
        const toolContext = Object.entries(toolResults)
          .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
          .join('\n');

        // Get relevant knowledge
        const knowledge = await getKnowledgeForTopic(query, 2);

        // Check if LLM is available
        const orchestration = decideOrchestration({
          feature: 'coaching',
          hasLocalImplementation: true,
          requiresNaturalLanguage: true,
          requiresPersonalization: true,
          contextSize: contextStr.length + toolContext.length,
          isOnline: navigator.onLine,
        });

        if (orchestration.useLLM && llmClient.checkAvailability()) {
          const prompt = compilePrompt('ai_coach', {
            userName: plan.context.user.name,
            experienceLevel: plan.context.user.experienceLevel,
            goal: plan.context.user.goal.type,
            frequency: settings.goal.targetPerWeek,
            bodyweight: settings.bodyweight || 'Unknown',
            units: settings.units,
            workoutContext: plan.context.workout
              ? `Currently in session: ${plan.context.workout.exercisesCompleted} exercises done`
              : 'Not in active session',
            historyContext: toolResults.analyze_history
              ? `${toolResults.analyze_history.last30DaysWorkouts} workouts in last 30 days, avg ${toolResults.analyze_history.avgFrequency}/week`
              : buildHistoryContext(plan.context.history.recentWorkouts),
            sleepHours: plan.context.biomarkers?.sleepHours || 'Unknown',
            stressLevel: plan.context.biomarkers?.stressLevel || 'Unknown',
            recoveryScore: plan.context.biomarkers?.recoveryScore || 7,
            fatigueStatus: plan.context.biomarkers?.fatigueStatus || 'Optimal',
            userQuery: query,
          });

          const llmResponse = await llmClient.generateText(
            prompt,
            { maxTokens: 400, temperature: 0.6 },
            'coaching'
          );

          if (llmResponse.success && llmResponse.data) {
            output = llmResponse.data;
            totalTokens += llmResponse.tokensUsed || 0;
            reasoning = 'Generated response using LLM with full context';
          } else {
            // Fallback
            const fallback = getCoachingFallback(plan.context, query);
            output = `${fallback.message}\n\nSuggestions:\n${fallback.suggestions.map(s => '- ' + s).join('\n')}`;
            reasoning = 'Used fallback due to LLM error';
          }
        } else {
          // Local fallback
          const fallback = getCoachingFallback(plan.context, query);
          output = `${fallback.message}\n\nSuggestions:\n${fallback.suggestions.map(s => '- ' + s).join('\n')}`;
          reasoning = orchestration.useLLM
            ? 'LLM unavailable, used local fallback'
            : 'Used local implementation';
        }
        break;

      default:
        output = null;
        reasoning = 'Unknown action';
    }

    toolResults[action] = output;
    steps.push({
      action,
      input: action === 'generate_response' ? { query, context: 'compressed' } : {},
      output,
      reasoning,
      timestamp: Date.now() - stepStart,
    });
  }

  // Get final response from last step
  const finalResponse = steps[steps.length - 1]?.output || 'Unable to generate response';

  return {
    success: true,
    finalResponse: typeof finalResponse === 'string' ? finalResponse : JSON.stringify(finalResponse),
    steps,
    totalLatency: Date.now() - startTime,
    totalTokens,
  };
}

// =============================================================================
// Main Agent Entry Point
// =============================================================================

export async function runCoachingAgent(
  query: string,
  settings: UserSettings,
  history: WorkoutSession[],
  dailyLogs: Record<string, DailyLog>,
  activeWorkout?: WorkoutSession | null
): Promise<AgentResult> {
  // Build context
  const context = buildFullContext({
    settings,
    history,
    dailyLogs,
    activeWorkout,
  });

  // Classify intent
  const intent = classifyIntent(query);

  // Create plan
  const plan = createPlan(intent, context);

  // Execute plan
  const result = await executePlan(plan, query, history, settings, dailyLogs);

  return result;
}

// =============================================================================
// Simplified Agent for Common Queries
// =============================================================================

export async function getQuickCoachingResponse(
  query: string,
  context: AIContext
): Promise<string> {
  // Use cache for common queries
  const cacheResult = await withCache(
    'coaching',
    { query: query.substring(0, 50), intent: classifyIntent(query) },
    async () => {
      // Simple LLM call without full agent pipeline
      if (llmClient.checkAvailability()) {
        const prompt = compilePrompt('ai_coach', {
          userName: context.user.name,
          experienceLevel: context.user.experienceLevel,
          goal: context.user.goal.type,
          frequency: context.user.goal.targetPerWeek,
          bodyweight: context.user.bodyweight || 'Unknown',
          units: context.user.units,
          workoutContext: context.workout
            ? `In session: ${context.workout.exercisesCompleted} exercises`
            : 'Not in session',
          historyContext: buildHistoryContext(context.history.recentWorkouts, 2),
          sleepHours: context.biomarkers?.sleepHours || 'Unknown',
          stressLevel: context.biomarkers?.stressLevel || 'Unknown',
          recoveryScore: context.biomarkers?.recoveryScore || 7,
          fatigueStatus: context.biomarkers?.fatigueStatus || 'Optimal',
          userQuery: query,
        });

        const response = await llmClient.generateText(
          prompt,
          { maxTokens: 300, temperature: 0.6 },
          'quick_coaching'
        );

        return response;
      }

      // Fallback
      const fallback = getCoachingFallback(context, query);
      return {
        success: true,
        data: fallback.message,
        source: 'fallback' as const,
        latency: 0,
      };
    },
    TTL_BY_FEATURE['coaching']
  );

  return cacheResult.data || getCoachingFallback(context, query).message;
}
