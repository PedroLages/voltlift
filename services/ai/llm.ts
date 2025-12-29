/**
 * LLM Client & Orchestration
 *
 * Handles:
 * - Multi-model routing (Gemini Flash vs Pro)
 * - Error handling with retries and fallbacks
 * - Token tracking and cost management
 * - Rate limiting
 *
 * SECURITY: This client now proxies all AI requests through our backend API
 * to keep API keys secure on the server side.
 */

import {
  LLMConfig,
  LLMProvider,
  DEFAULT_LLM_CONFIG,
  AIResponse,
  TokenUsage,
  TokenBudget,
  CompiledPrompt,
} from './types';

// =============================================================================
// Backend API Configuration
// =============================================================================

const API_ENDPOINT = '/api/ai/suggestions';

// =============================================================================
// LLM Client
// =============================================================================

class LLMClient {
  private isAvailable: boolean = true;
  private tokenUsage: TokenUsage[] = [];
  private budget: TokenBudget = {
    dailyLimit: 100000, // ~$0.30/day for Flash
    monthlyLimit: 2000000,
    currentDailyUsage: 0,
    currentMonthlyUsage: 0,
  };

  constructor() {
    this.loadUsageFromStorage();
  }

  /**
   * Check if LLM is available (backend API is available)
   */
  checkAvailability(): boolean {
    return this.isAvailable;
  }

  /**
   * Get model name for provider
   */
  private getModelName(provider: LLMProvider): string {
    switch (provider) {
      case 'gemini-flash':
        return 'gemini-2.0-flash';
      case 'gemini-pro':
        return 'gemini-2.0-pro';
      default:
        return 'gemini-2.0-flash';
    }
  }

  /**
   * Estimate cost for tokens
   */
  private estimateCost(
    inputTokens: number,
    outputTokens: number,
    provider: LLMProvider
  ): number {
    // Pricing per 1M tokens (in cents)
    const pricing: Record<LLMProvider, { input: number; output: number }> = {
      'gemini-flash': { input: 7.5, output: 30 }, // $0.075/$0.30 per 1M
      'gemini-pro': { input: 125, output: 500 }, // $1.25/$5.00 per 1M
      'local': { input: 0, output: 0 },
    };

    const rates = pricing[provider];
    const inputCost = (inputTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;

    return inputCost + outputCost;
  }

  /**
   * Check if within budget
   */
  private isWithinBudget(): boolean {
    return (
      this.budget.currentDailyUsage < this.budget.dailyLimit &&
      this.budget.currentMonthlyUsage < this.budget.monthlyLimit
    );
  }

  /**
   * Track token usage
   */
  private trackUsage(
    inputTokens: number,
    outputTokens: number,
    model: string,
    feature: string
  ): void {
    const today = new Date().toISOString().split('T')[0];
    const cost = this.estimateCost(
      inputTokens,
      outputTokens,
      model.includes('flash') ? 'gemini-flash' : 'gemini-pro'
    );

    const usage: TokenUsage = {
      date: today,
      inputTokens,
      outputTokens,
      model,
      feature,
      cost,
    };

    this.tokenUsage.push(usage);
    this.budget.currentDailyUsage += inputTokens + outputTokens;
    this.budget.currentMonthlyUsage += inputTokens + outputTokens;

    this.saveUsageToStorage();
  }

  /**
   * Load usage from localStorage
   */
  private loadUsageFromStorage(): void {
    try {
      const stored = localStorage.getItem('voltlift-ai-usage');
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = today.substring(0, 7);

        // Reset daily/monthly if needed
        if (data.lastDay !== today) {
          this.budget.currentDailyUsage = 0;
        } else {
          this.budget.currentDailyUsage = data.dailyUsage || 0;
        }

        if (data.lastMonth !== thisMonth) {
          this.budget.currentMonthlyUsage = 0;
        } else {
          this.budget.currentMonthlyUsage = data.monthlyUsage || 0;
        }
      }
    } catch (e) {
      console.warn('Failed to load AI usage from storage:', e);
    }
  }

  /**
   * Save usage to localStorage
   */
  private saveUsageToStorage(): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(
        'voltlift-ai-usage',
        JSON.stringify({
          lastDay: today,
          lastMonth: today.substring(0, 7),
          dailyUsage: this.budget.currentDailyUsage,
          monthlyUsage: this.budget.currentMonthlyUsage,
        })
      );
    } catch (e) {
      console.warn('Failed to save AI usage to storage:', e);
    }
  }

  /**
   * Generate text completion (via secure backend API)
   */
  async generateText(
    prompt: CompiledPrompt,
    config: Partial<LLMConfig> = {},
    feature: string = 'unknown'
  ): Promise<AIResponse<string>> {
    const startTime = Date.now();
    const effectiveConfig = {
      ...DEFAULT_LLM_CONFIG['gemini-flash'],
      ...config,
    };

    // Check budget
    if (!this.isWithinBudget()) {
      return {
        success: false,
        error: 'Token budget exceeded',
        source: 'fallback',
        latency: Date.now() - startTime,
      };
    }

    const modelName = this.getModelName(effectiveConfig.provider);

    // Retry loop
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= effectiveConfig.retries; attempt++) {
      try {
        // Call backend API with timeout
        const response = await Promise.race([
          fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'generic',
              data: {
                prompt: prompt.systemPrompt
                  ? `${prompt.systemPrompt}\n\n${prompt.userPrompt}`
                  : prompt.userPrompt,
                maxTokens: effectiveConfig.maxTokens,
                temperature: effectiveConfig.temperature,
              },
            }),
          }),
          this.timeout(effectiveConfig.timeout),
        ]);

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'API request failed');
        }

        const text = data.result || '';
        const tokensUsed = prompt.tokenEstimate + Math.ceil(text.length / 4);

        // Track usage
        this.trackUsage(
          prompt.tokenEstimate,
          Math.ceil(text.length / 4),
          modelName,
          feature
        );

        return {
          success: true,
          data: text,
          source: 'llm',
          latency: Date.now() - startTime,
          tokensUsed,
          cost: this.estimateCost(
            prompt.tokenEstimate,
            Math.ceil(text.length / 4),
            effectiveConfig.provider
          ),
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `LLM attempt ${attempt + 1} failed:`,
          lastError.message
        );

        // Exponential backoff
        if (attempt < effectiveConfig.retries) {
          await this.sleep(Math.pow(2, attempt) * 500);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      source: 'fallback',
      latency: Date.now() - startTime,
    };
  }

  /**
   * Generate with structured output (JSON mode)
   */
  async generateStructured<T>(
    prompt: CompiledPrompt,
    config: Partial<LLMConfig> = {},
    feature: string = 'unknown'
  ): Promise<AIResponse<T>> {
    // Add JSON instruction to prompt
    const jsonPrompt: CompiledPrompt = {
      ...prompt,
      userPrompt: prompt.userPrompt + '\n\nRespond in valid JSON format only.',
    };

    const response = await this.generateText(jsonPrompt, config, feature);

    if (!response.success || !response.data) {
      return {
        ...response,
        data: undefined,
      } as AIResponse<T>;
    }

    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.data;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr) as T;
      return {
        ...response,
        data: parsed,
      };
    } catch (e) {
      return {
        success: false,
        error: 'Failed to parse JSON response',
        source: response.source,
        latency: response.latency,
      };
    }
  }

  /**
   * Generate image (currently not supported via backend API)
   * TODO: Add image generation endpoint to backend API if needed
   */
  async generateImage(
    prompt: string,
    size: '1K' | '2K' | '4K' = '1K'
  ): Promise<AIResponse<string>> {
    const startTime = Date.now();

    return {
      success: false,
      error: 'Image generation not currently supported via backend API',
      source: 'fallback',
      latency: Date.now() - startTime,
    };
  }

  /**
   * Get current usage stats
   */
  getUsageStats(): {
    dailyUsage: number;
    dailyLimit: number;
    monthlyUsage: number;
    monthlyLimit: number;
    dailyPercentage: number;
    monthlyPercentage: number;
    estimatedDailyCost: number;
    estimatedMonthlyCost: number;
  } {
    return {
      dailyUsage: this.budget.currentDailyUsage,
      dailyLimit: this.budget.dailyLimit,
      monthlyUsage: this.budget.currentMonthlyUsage,
      monthlyLimit: this.budget.monthlyLimit,
      dailyPercentage: (this.budget.currentDailyUsage / this.budget.dailyLimit) * 100,
      monthlyPercentage: (this.budget.currentMonthlyUsage / this.budget.monthlyLimit) * 100,
      estimatedDailyCost: this.estimateCost(
        this.budget.currentDailyUsage / 2,
        this.budget.currentDailyUsage / 2,
        'gemini-flash'
      ),
      estimatedMonthlyCost: this.estimateCost(
        this.budget.currentMonthlyUsage / 2,
        this.budget.currentMonthlyUsage / 2,
        'gemini-flash'
      ),
    };
  }

  /**
   * Set custom budget limits
   */
  setBudget(daily: number, monthly: number): void {
    this.budget.dailyLimit = daily;
    this.budget.monthlyLimit = monthly;
  }

  /**
   * Timeout helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), ms);
    });
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Model Selection Logic
// =============================================================================

export type TaskComplexity = 'simple' | 'moderate' | 'complex';

/**
 * Select optimal model based on task
 */
export function selectModel(
  complexity: TaskComplexity,
  requiresReasoning: boolean = false
): LLMProvider {
  // Simple tasks: always use Flash (faster, cheaper)
  if (complexity === 'simple') {
    return 'gemini-flash';
  }

  // Complex tasks with reasoning: use Pro
  if (complexity === 'complex' && requiresReasoning) {
    return 'gemini-pro';
  }

  // Default to Flash
  return 'gemini-flash';
}

/**
 * Determine task complexity
 */
export function assessComplexity(
  contextLength: number,
  requiresMultiStep: boolean,
  requiresPersonalization: boolean
): TaskComplexity {
  // Large context or multi-step reasoning = complex
  if (contextLength > 2000 || requiresMultiStep) {
    return 'complex';
  }

  // Personalization needs some reasoning
  if (requiresPersonalization) {
    return 'moderate';
  }

  return 'simple';
}

// =============================================================================
// Orchestration Decisions
// =============================================================================

export interface OrchestrationDecision {
  useLocal: boolean;
  useLLM: boolean;
  model: LLMProvider;
  reasoning: string;
}

/**
 * Decide whether to use local ML or cloud LLM
 */
export function decideOrchestration(params: {
  feature: string;
  hasLocalImplementation: boolean;
  requiresNaturalLanguage: boolean;
  requiresPersonalization: boolean;
  contextSize: number;
  isOnline: boolean;
}): OrchestrationDecision {
  const {
    feature,
    hasLocalImplementation,
    requiresNaturalLanguage,
    requiresPersonalization,
    contextSize,
    isOnline,
  } = params;

  // Features that MUST use local (offline-first critical path)
  const localOnlyFeatures = [
    'progressive_suggestion', // Weight/rep suggestions during workout
    'recovery_score', // Recovery calculation
    'volume_tracking', // Set counting
    'pr_detection', // Personal record detection
  ];

  if (localOnlyFeatures.includes(feature)) {
    return {
      useLocal: true,
      useLLM: false,
      model: 'local',
      reasoning: 'Critical path feature - local implementation required for offline support',
    };
  }

  // No internet = local only
  if (!isOnline) {
    return {
      useLocal: true,
      useLLM: false,
      model: 'local',
      reasoning: 'Offline - using local implementation',
    };
  }

  // Natural language output = LLM
  if (requiresNaturalLanguage && !hasLocalImplementation) {
    const model = contextSize > 1500 || requiresPersonalization ? 'gemini-pro' : 'gemini-flash';
    return {
      useLocal: false,
      useLLM: true,
      model,
      reasoning: `Natural language required - using ${model}`,
    };
  }

  // Hybrid: Use local for data, LLM for explanation
  if (hasLocalImplementation && requiresNaturalLanguage) {
    return {
      useLocal: true,
      useLLM: true,
      model: 'gemini-flash',
      reasoning: 'Hybrid - local for calculation, LLM for explanation',
    };
  }

  // Default: prefer local
  return {
    useLocal: hasLocalImplementation,
    useLLM: !hasLocalImplementation,
    model: hasLocalImplementation ? 'local' : 'gemini-flash',
    reasoning: hasLocalImplementation ? 'Local implementation available' : 'No local implementation',
  };
}

// =============================================================================
// Singleton Export
// =============================================================================

export const llmClient = new LLMClient();
