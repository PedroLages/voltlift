/**
 * Prompt Engineering Module
 *
 * Centralized prompt management with:
 * - Versioned templates for A/B testing
 * - Variable injection with type safety
 * - Token estimation
 * - Optimized prompts for each use case
 */

import { PromptTemplate, PromptVariables, CompiledPrompt, AIContext, LLMProvider } from './types';

// =============================================================================
// Prompt Templates
// =============================================================================

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  // ---------------------------------------------------------------------------
  // Progressive Overload Tips
  // ---------------------------------------------------------------------------
  progressive_overload_v1: {
    id: 'progressive_overload_v1',
    version: '1.0.0',
    systemPrompt: `You are an expert strength coach specializing in progressive overload.
You analyze workout data and provide precise, actionable recommendations.
Keep responses concise - maximum 2 sentences.
Always include specific numbers (weight, reps).
Consider recovery status and training history.`,
    userPromptTemplate: `User: {{userName}} ({{experienceLevel}}, Goal: {{goal}})
Current Exercise: {{exerciseName}}
Last Performance: {{lastWeight}}{{units}} x {{lastReps}} reps {{rpeInfo}}
Recovery Score: {{recoveryScore}}/10
Estimated 1RM: {{estimated1RM}}{{units}}
Current Intensity: {{currentIntensity}}%

Recent Context: {{recentContext}}

Provide ONE specific progressive overload recommendation for the next set.`,
    variables: [
      'userName', 'experienceLevel', 'goal', 'exerciseName',
      'lastWeight', 'lastReps', 'units', 'rpeInfo',
      'recoveryScore', 'estimated1RM', 'currentIntensity', 'recentContext'
    ],
    maxTokens: 150,
    temperature: 0.5,
    model: 'gemini-flash',
  },

  progressive_overload_v2: {
    id: 'progressive_overload_v2',
    version: '2.0.0',
    systemPrompt: `Expert strength coach. Responses: MAX 25 words. Include exact weight/reps. No fluff.`,
    userPromptTemplate: `{{exerciseName}}: {{lastWeight}}{{units}}x{{lastReps}} (RPE {{rpe}}). Recovery: {{recoveryScore}}/10. 1RM: {{estimated1RM}}{{units}}.
Next set recommendation:`,
    variables: [
      'exerciseName', 'lastWeight', 'lastReps', 'units',
      'rpe', 'recoveryScore', 'estimated1RM'
    ],
    maxTokens: 60,
    temperature: 0.3,
    model: 'gemini-flash',
  },

  // ---------------------------------------------------------------------------
  // Suggestion Explanation
  // ---------------------------------------------------------------------------
  suggestion_explanation: {
    id: 'suggestion_explanation',
    version: '1.0.0',
    systemPrompt: `You are an expert strength coach explaining AI workout suggestions.
Explain the science behind progressive overload recommendations in clear, accessible language.
Focus on education - help users understand WHY, not just WHAT.
Keep it concise but informative.`,
    userPromptTemplate: `User: {{userName}} ({{experienceLevel}})
Exercise: {{exerciseName}}
Last Performance: {{lastWeight}}{{units}} x {{lastReps}} reps {{rpeInfo}}

AI Suggestion: {{suggestedWeight}}{{units}} x {{suggestedRepsMin}}-{{suggestedRepsMax}} reps
Confidence: {{confidence}}
Recovery Score: {{recoveryScore}}/10
{{deloadNote}}

Explain WHY this suggestion makes sense for progressive overload.
Include:
1. Main reasoning (2-3 sentences)
2. Key factors considered (bullet points)
3. What to expect from this approach (1 sentence)`,
    variables: [
      'userName', 'experienceLevel', 'exerciseName',
      'lastWeight', 'lastReps', 'units', 'rpeInfo',
      'suggestedWeight', 'suggestedRepsMin', 'suggestedRepsMax',
      'confidence', 'recoveryScore', 'deloadNote'
    ],
    maxTokens: 300,
    temperature: 0.5,
    model: 'gemini-flash',
  },

  // ---------------------------------------------------------------------------
  // Form Guide
  // ---------------------------------------------------------------------------
  form_guide: {
    id: 'form_guide',
    version: '1.0.0',
    systemPrompt: `You are a certified personal trainer providing form guidance.
Focus on safety and effectiveness.
Tailor advice based on user's experience level.
Be concise but thorough on key points.`,
    userPromptTemplate: `Exercise: {{exerciseName}}
User Level: {{experienceLevel}}
Equipment: {{equipment}}
User Question: {{question}}

Existing Form Guide:
{{existingGuide}}

Common Mistakes:
{{commonMistakes}}

Provide personalized form advice for this user.`,
    variables: [
      'exerciseName', 'experienceLevel', 'equipment',
      'question', 'existingGuide', 'commonMistakes'
    ],
    maxTokens: 300,
    temperature: 0.5,
    model: 'gemini-flash',
  },

  // ---------------------------------------------------------------------------
  // Workout Summary
  // ---------------------------------------------------------------------------
  workout_summary: {
    id: 'workout_summary',
    version: '1.0.0',
    systemPrompt: `You are an encouraging fitness coach analyzing completed workouts.
Highlight achievements and PRs.
Provide constructive feedback.
Keep the tone energetic and motivating.`,
    userPromptTemplate: `User: {{userName}}
Workout: {{workoutName}}
Duration: {{duration}} minutes
Exercises:
{{exerciseDetails}}

PRs Achieved: {{prsAchieved}}
Total Volume: {{totalVolume}}{{units}}
Average RPE: {{averageRPE}}

Previous Week's Volume: {{previousWeekVolume}}{{units}}

Generate a motivating workout summary with:
1. Key highlights (2-3 bullets)
2. Progress notes
3. Focus for next session`,
    variables: [
      'userName', 'workoutName', 'duration', 'exerciseDetails',
      'prsAchieved', 'totalVolume', 'units', 'averageRPE', 'previousWeekVolume'
    ],
    maxTokens: 400,
    temperature: 0.7,
    model: 'gemini-flash',
  },

  // ---------------------------------------------------------------------------
  // Motivation
  // ---------------------------------------------------------------------------
  motivation: {
    id: 'motivation',
    version: '1.0.0',
    systemPrompt: `You generate intense, short motivational quotes for workouts.
Style: aggressive, empowering, athletic.
Maximum 10 words.
Include one relevant emoji.`,
    userPromptTemplate: `Context: {{context}}
User's Streak: {{streak}} days
Goal: {{goal}}

Generate a workout motivation quote:`,
    variables: ['context', 'streak', 'goal'],
    maxTokens: 30,
    temperature: 0.9,
    model: 'gemini-flash',
  },

  // ---------------------------------------------------------------------------
  // Program Explanation
  // ---------------------------------------------------------------------------
  program_explanation: {
    id: 'program_explanation',
    version: '1.0.0',
    systemPrompt: `You are a knowledgeable strength and conditioning coach.
Explain training programs in accessible language.
Relate program design to user's specific goals.
Be educational but not overwhelming.`,
    userPromptTemplate: `Program: {{programName}}
Type: {{splitType}}
Frequency: {{frequency}} days/week
Goal: {{programGoal}}
Duration: {{weeks}} weeks

User's Goal: {{userGoal}}
User's Experience: {{experienceLevel}}

Description: {{programDescription}}

Explain why this program works and how it aligns with the user's goals.
Include:
1. Program philosophy (2-3 sentences)
2. Expected results
3. Key success factors`,
    variables: [
      'programName', 'splitType', 'frequency', 'programGoal',
      'weeks', 'userGoal', 'experienceLevel', 'programDescription'
    ],
    maxTokens: 500,
    temperature: 0.6,
    model: 'gemini-flash',
  },

  // ---------------------------------------------------------------------------
  // AI Coach (Complex Reasoning)
  // ---------------------------------------------------------------------------
  ai_coach: {
    id: 'ai_coach',
    version: '1.0.0',
    systemPrompt: `You are an elite AI fitness coach combining sports science knowledge with personalized coaching.
Analyze data thoroughly before making recommendations.
Consider: recovery, progressive overload, injury prevention, and motivation.
Be direct and actionable. Athletes prefer clear guidance over lengthy explanations.`,
    userPromptTemplate: `## User Profile
Name: {{userName}}
Experience: {{experienceLevel}}
Goal: {{goal}}
Training Frequency: {{frequency}} days/week
Bodyweight: {{bodyweight}}{{units}}

## Current Session Context
{{workoutContext}}

## Recent Training History
{{historyContext}}

## Biomarkers
Sleep: {{sleepHours}}hrs
Stress: {{stressLevel}}/10
Recovery: {{recoveryScore}}/10 ({{fatigueStatus}})

## Question/Request
{{userQuery}}

Provide coaching response:`,
    variables: [
      'userName', 'experienceLevel', 'goal', 'frequency', 'bodyweight', 'units',
      'workoutContext', 'historyContext', 'sleepHours', 'stressLevel',
      'recoveryScore', 'fatigueStatus', 'userQuery'
    ],
    maxTokens: 600,
    temperature: 0.6,
    model: 'gemini-pro',
  },

  // ---------------------------------------------------------------------------
  // Exercise Visual Generation
  // ---------------------------------------------------------------------------
  exercise_visual: {
    id: 'exercise_visual',
    version: '1.0.0',
    systemPrompt: '', // Image generation doesn't use system prompt
    userPromptTemplate: `Create a high-contrast, technical schematic line drawing of a person performing the exercise: {{exerciseName}}.
Style: Cyberpunk blueprint, white lines on black background, neon yellow (#ccff00) highlights on the primary muscle group ({{muscleGroup}}) being worked.
Minimalist and clean. Show proper form with anatomical accuracy.
View: {{viewAngle}}`,
    variables: ['exerciseName', 'muscleGroup', 'viewAngle'],
    maxTokens: 0, // N/A for image generation
    temperature: 0.8,
    model: 'gemini-pro', // Uses image model
  },

  // ---------------------------------------------------------------------------
  // Weak Point Analysis
  // ---------------------------------------------------------------------------
  weak_point_analysis: {
    id: 'weak_point_analysis',
    version: '1.0.0',
    systemPrompt: `You are a sports performance analyst specializing in identifying training imbalances.
Use data-driven analysis with specific metrics.
Prioritize actionable recommendations.`,
    userPromptTemplate: `## Volume Distribution (sets/week)
{{volumeData}}

## Strength Ratios
{{strengthRatios}}

## Exercise Progress Trends
{{progressTrends}}

## User Profile
Experience: {{experienceLevel}}
Goal: {{goal}}

Analyze weak points and provide:
1. Top 3 priority areas
2. Specific exercises to address each
3. Volume recommendations`,
    variables: [
      'volumeData', 'strengthRatios', 'progressTrends',
      'experienceLevel', 'goal'
    ],
    maxTokens: 500,
    temperature: 0.4,
    model: 'gemini-flash',
  },
};

// =============================================================================
// Prompt Compilation
// =============================================================================

/**
 * Estimate tokens from text (rough approximation)
 * GPT/Gemini: ~4 characters per token for English
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Compile a prompt template with variables
 */
export function compilePrompt(
  templateId: string,
  variables: PromptVariables
): CompiledPrompt {
  const template = PROMPT_TEMPLATES[templateId];

  if (!template) {
    throw new Error(`Unknown prompt template: ${templateId}`);
  }

  let userPrompt = template.userPromptTemplate;

  // Replace all variables
  for (const key of template.variables) {
    const value = variables[key];
    const placeholder = `{{${key}}}`;

    if (value === undefined) {
      console.warn(`Missing variable '${key}' for template '${templateId}'`);
      userPrompt = userPrompt.replace(placeholder, '[Not provided]');
    } else if (typeof value === 'object') {
      userPrompt = userPrompt.replace(placeholder, JSON.stringify(value, null, 2));
    } else {
      userPrompt = userPrompt.replace(placeholder, String(value));
    }
  }

  const systemPrompt = template.systemPrompt;
  const tokenEstimate = estimateTokens(systemPrompt + userPrompt);

  return {
    systemPrompt,
    userPrompt,
    tokenEstimate,
  };
}

/**
 * Get template configuration
 */
export function getTemplateConfig(templateId: string): {
  maxTokens: number;
  temperature: number;
  model: LLMProvider;
} {
  const template = PROMPT_TEMPLATES[templateId];

  if (!template) {
    return {
      maxTokens: 200,
      temperature: 0.7,
      model: 'gemini-flash',
    };
  }

  return {
    maxTokens: template.maxTokens,
    temperature: template.temperature,
    model: template.model,
  };
}

// =============================================================================
// Context Builders
// =============================================================================

/**
 * Build context string for recent workouts
 */
export function buildHistoryContext(
  history: { date: string; exercises: string[]; totalVolume: number }[],
  limit: number = 3
): string {
  if (history.length === 0) {
    return 'No recent workout history.';
  }

  return history
    .slice(0, limit)
    .map((w, i) => `${i + 1}. ${w.date}: ${w.exercises.join(', ')} (Volume: ${w.totalVolume})`)
    .join('\n');
}

/**
 * Build context string for current workout
 */
export function buildWorkoutContext(
  exercisesCompleted: number,
  totalVolume: number,
  muscleGroups: string[],
  duration: number
): string {
  return `Exercises completed: ${exercisesCompleted}
Total volume: ${totalVolume}
Muscle groups: ${muscleGroups.join(', ')}
Duration: ${duration} minutes`;
}

/**
 * Build RPE info string
 */
export function buildRPEInfo(rpe: number | undefined): string {
  if (rpe === undefined) return '';
  return `(RPE ${rpe}/10)`;
}

// =============================================================================
// A/B Testing Support
// =============================================================================

type PromptVariant = 'A' | 'B';

// A/B test configuration
const AB_TESTS: Record<string, { variants: string[]; weights: number[] }> = {
  progressive_overload: {
    variants: ['progressive_overload_v1', 'progressive_overload_v2'],
    weights: [0.5, 0.5], // 50/50 split
  },
};

/**
 * Get prompt template with A/B test selection
 */
export function getPromptWithABTest(
  feature: string,
  userId?: string
): { templateId: string; variant: PromptVariant } {
  const test = AB_TESTS[feature];

  if (!test) {
    return { templateId: feature, variant: 'A' };
  }

  // Deterministic selection based on userId (consistent experience)
  let random: number;
  if (userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    random = Math.abs(hash % 100) / 100;
  } else {
    random = Math.random();
  }

  // Select variant based on weights
  let cumulative = 0;
  for (let i = 0; i < test.variants.length; i++) {
    cumulative += test.weights[i];
    if (random < cumulative) {
      return {
        templateId: test.variants[i],
        variant: i === 0 ? 'A' : 'B',
      };
    }
  }

  return { templateId: test.variants[0], variant: 'A' };
}

// =============================================================================
// Prompt Optimization Utilities
// =============================================================================

/**
 * Truncate context to fit token budget
 */
export function truncateToTokenBudget(
  text: string,
  maxTokens: number
): string {
  const estimatedTokens = estimateTokens(text);

  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Truncate to approximately maxTokens worth of characters
  const targetChars = maxTokens * 4;
  return text.substring(0, targetChars) + '...';
}

/**
 * Format number with units for prompts
 */
export function formatWithUnits(
  value: number,
  units: 'kg' | 'lbs',
  precision: number = 1
): string {
  const formatted = value.toFixed(precision).replace(/\.0$/, '');
  return `${formatted}${units}`;
}
