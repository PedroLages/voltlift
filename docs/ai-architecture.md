# VoltLift AI/LLM Architecture

## Overview

VoltLift uses a hybrid AI architecture that combines:
- **Local ML**: Fast, offline-first heuristics for critical path features
- **Cloud LLM**: Rich, contextual explanations and personalization
- **RAG**: Retrieval-augmented generation for exercise/fitness knowledge

```
                                 +-------------------+
                                 |   User Interface  |
                                 +--------+----------+
                                          |
                                          v
                              +-----------+-----------+
                              |    AI Service Layer   |
                              |    (services/ai/)     |
                              +-----------+-----------+
                                          |
              +---------------------------+---------------------------+
              |                           |                           |
              v                           v                           v
    +---------+---------+     +-----------+-----------+     +---------+---------+
    |   Local ML        |     |    LLM Client         |     |    RAG System     |
    | (progressiveOver- |     | (Gemini Flash/Pro)    |     |  (Knowledge Base) |
    |  load.ts, etc.)   |     +-----+-----+-----+-----+     +---------+---------+
    +---------+---------+           |     |     |                     |
              |                     |     |     |                     |
              |              +------+     |     +------+              |
              |              |            |            |              |
              v              v            v            v              v
    +-------------------+  +---------+ +-------+ +----------+ +----------------+
    | Offline Features  |  | Cache   | |Prompts| |Fallbacks | |Exercise Guides |
    | - Weight suggest  |  | Layer   | |Engine | |& Rules   | |Fitness KB      |
    | - Recovery score  |  +---------+ +-------+ +----------+ +----------------+
    | - PR detection    |
    | - Volume tracking |
    +-------------------+
```

## File Structure

```
services/ai/
├── index.ts          # Main entry point, public API
├── types.ts          # Type definitions
├── llm.ts            # LLM client & orchestration
├── prompts.ts        # Prompt templates & compilation
├── cache.ts          # Multi-tier caching
├── rag.ts            # RAG document store & search
├── contextBuilder.ts # Build AI context from app state
├── fallbacks.ts      # Graceful degradation handlers
└── agent.ts          # Multi-step reasoning agent
```

## Design Principles

### 1. Offline-First
Critical path features (workout logging, weight suggestions) work without internet.

```typescript
// Weight suggestions ALWAYS use local ML
const localSuggestion = getSuggestion(exerciseId, previousLog, dailyLog, history);

// LLM enhancement is optional
if (enhanceWithLLM && navigator.onLine) {
  const llmResponse = await llmClient.generateText(prompt);
}
```

### 2. Cost Optimization
- Use Gemini Flash (cheap, fast) for most tasks
- Reserve Gemini Pro for complex reasoning
- Cache aggressively (24hr+ TTL for static content)
- Track token usage with daily/monthly budgets

```typescript
// Model selection based on task complexity
const model = selectModel(complexity, requiresReasoning);
// 'gemini-flash' for simple tasks
// 'gemini-pro' for complex multi-step reasoning
```

### 3. Graceful Degradation
Every AI feature has a fallback:

| Feature | Primary | Fallback |
|---------|---------|----------|
| Progressive Overload | LLM tip + local suggestion | Rule-based tip + local suggestion |
| Form Guide | Personalized LLM | Static exercise data |
| Workout Summary | LLM narrative | Template-based summary |
| Motivation | LLM quote | Curated quote library |
| Coaching | Agent reasoning | Pattern-matched response |

### 4. Context Efficiency
User data is compressed to fit token budgets:

```typescript
function compressContext(context: AIContext, maxTokens: number): string {
  // Prioritize: user basics > biomarkers > current workout > history
  // Truncate history to fit budget
}
```

## Feature Implementation

### Progressive Overload Suggestions

**Flow:**
1. Local ML calculates weight/rep suggestion (always runs)
2. Optionally enhance with LLM explanation
3. Cache LLM responses by exercise + parameters

**Local ML (progressiveOverload.ts):**
- Estimates 1RM from previous performance
- Calculates recovery score from biomarkers
- Applies experience-based progression rates
- Learns from user acceptance patterns

**LLM Enhancement:**
- Adds contextual explanation
- Considers recent training history
- Provides motivational framing

### RAG System

**Document Types:**
- `exercise_guide`: Form instructions, tips, mistakes
- `form_tip`: Quick reference tips
- `fitness_knowledge`: Progressive overload, recovery, RPE, volume

**Search:**
- TF-IDF based text search (offline-capable)
- Can be extended with vector embeddings

```typescript
// Search for relevant knowledge
const results = await semanticSearch('how to break through a plateau');

// Get exercise-specific context
const context = await getExerciseContext('e1'); // Bench Press
```

### AI Agent

For complex queries requiring multi-step reasoning:

```typescript
// Agent plan for "Am I making progress?"
const plan = {
  goal: 'progress_check',
  steps: ['analyze_history', 'check_recovery', 'generate_response']
};

// Each step uses local tools or LLM
const result = await executePlan(plan, query, context);
```

**Agent Tools:**
- `analyzeHistory`: Volume trends, frequency, consistency
- `checkRecovery`: Sleep, stress, deload detection
- `suggestExercise`: Get progressive overload suggestion
- `analyzeWeakPoints`: Identify training imbalances

## Prompt Engineering

### Template System

```typescript
const PROMPT_TEMPLATES = {
  progressive_overload_v1: {
    systemPrompt: 'You are an expert strength coach...',
    userPromptTemplate: 'Exercise: {{exerciseName}}...',
    variables: ['exerciseName', 'lastWeight', ...],
    maxTokens: 150,
    temperature: 0.5,
    model: 'gemini-flash'
  }
};
```

### A/B Testing

```typescript
// Get variant for user
const { templateId, variant } = getPromptWithABTest('progressive_overload', userId);
// Returns 'progressive_overload_v1' or 'progressive_overload_v2' based on user hash
```

### Token Estimation

```typescript
// Estimate tokens before sending
const compiled = compilePrompt(templateId, variables);
console.log(compiled.tokenEstimate); // ~150 tokens
```

## Caching Strategy

### Cache Tiers

1. **In-Memory LRU**: Hot data, instant access
2. **localStorage**: Persist across sessions
3. **Semantic Cache**: Match similar queries

### TTL by Feature

```typescript
const TTL_BY_FEATURE = {
  'motivation': 1 * HOUR,        // Keep fresh
  'form_guide': 7 * DAYS,        // Static content
  'progressive_overload': 6 * HOURS,
  'workout_summary': 30 * DAYS,  // Historical
  'coaching': 2 * HOURS,         // Personalized
};
```

### Cache Key Generation

```typescript
const key = aiCache.generateKey('progressive_overload', {
  exerciseId: 'e1',
  weight: 135,
  reps: [8, 10],
  recoveryScore: 7
});
// Result: 'progressive_overload:a1b2c3d4'
```

## Cost Management

### Token Budget

```typescript
const budget = {
  dailyLimit: 100000,    // ~$0.30/day for Flash
  monthlyLimit: 2000000, // ~$6/month
};
```

### Usage Tracking

```typescript
const stats = llmClient.getUsageStats();
// {
//   dailyUsage: 45000,
//   dailyLimit: 100000,
//   estimatedDailyCost: 0.15, // cents
// }
```

### Model Pricing (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| Gemini Flash | $0.075 | $0.30 |
| Gemini Pro | $1.25 | $5.00 |

## Orchestration Logic

```typescript
function decideOrchestration(params) {
  // Critical path features = local only
  if (localOnlyFeatures.includes(feature)) {
    return { useLocal: true, useLLM: false };
  }

  // Offline = local only
  if (!navigator.onLine) {
    return { useLocal: true, useLLM: false };
  }

  // Natural language needed = hybrid
  if (requiresNaturalLanguage && hasLocalImplementation) {
    return { useLocal: true, useLLM: true };
  }

  // Default to cheapest option
  return { useLocal: true, useLLM: false };
}
```

## Integration Points

### With Store (Zustand)

```typescript
// In store action
suggestNextSet: async (exerciseIndex, setIndex) => {
  const suggestion = await getProgressiveOverloadSuggestion({
    exerciseId,
    history: get().history,
    settings: get().settings,
    dailyLogs: get().dailyLogs,
    activeWorkout: get().activeWorkout,
    enhanceWithLLM: navigator.onLine
  });

  // Update UI with suggestion
  set({ currentSuggestion: suggestion.data });
}
```

### With Components

```typescript
// In React component
const { data, source, latency } = await getFormGuide({
  exerciseId: 'e1',
  settings,
  question: 'How do I avoid shoulder pain?',
  personalize: true
});

// Show source indicator
<span>{source === 'llm' ? '✨ AI Enhanced' : 'Quick Guide'}</span>
```

## Error Handling

```typescript
// All AI functions return AIResponse<T>
interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'llm' | 'cache' | 'fallback';
  latency: number;
  tokensUsed?: number;
}

// Usage
const response = await getMotivation({ settings });
if (response.source === 'fallback') {
  // Show indicator that AI is unavailable
}
```

## Performance Metrics

| Operation | Target | Notes |
|-----------|--------|-------|
| Local suggestion | < 10ms | Always meets target |
| Cache hit | < 5ms | In-memory access |
| LLM call (Flash) | 500-1500ms | Network dependent |
| LLM call (Pro) | 1000-3000ms | More complex |
| RAG search | < 50ms | Local text search |

## Future Enhancements

1. **Vector Embeddings**: Use sentence transformers for semantic search
2. **Fine-tuned Models**: Train on fitness-specific data
3. **Voice Interface**: Speech-to-text for coaching
4. **Personalized Learning**: Adapt prompts based on user feedback
5. **Multi-modal**: Analyze workout videos for form feedback

## Testing

```typescript
// Test local fallback
llmClient.isAvailable = () => false;
const response = await getMotivation({ settings });
expect(response.source).toBe('fallback');
expect(response.data).toBeTruthy();

// Test cache
const first = await getFormGuide({ exerciseId: 'e1', settings });
const second = await getFormGuide({ exerciseId: 'e1', settings });
expect(second.source).toBe('cache');
expect(second.latency).toBeLessThan(5);
```
