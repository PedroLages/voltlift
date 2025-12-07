# VoltLift Unified AI/ML Pipeline

> Combined findings from ML Engineer & AI Engineer analysis

## Executive Summary

This document synthesizes the ML recommendation system and AI/LLM integration pipelines into a unified architecture for VoltLift. The system combines **fast local ML** for scoring/ranking with **contextual LLM** for explanations and personalization.

**Key Metrics:**
- Total latency budget: <200ms
- Offline capability: 100% core features
- Monthly AI cost: ~$6 (2M tokens)
- Model storage: <10MB

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                              │
│  [Exercise Recs] [Program Match] [Progressive Overload] [Coach] │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED AI SERVICE                            │
│                   (services/ai/index.ts)                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Request    │──│   Router     │──│   Response Builder   │  │
│  │   Parser     │  │  (ML vs LLM) │  │   (Merge & Format)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   LOCAL ML      │   │   LLM CLIENT    │   │   CACHE LAYER   │
│   PIPELINE      │   │   (Gemini)      │   │   (Multi-tier)  │
│                 │   │                 │   │                 │
│ • Exercise Rec  │   │ • Flash (fast)  │   │ • Memory LRU    │
│ • Program Match │   │ • Pro (complex) │   │ • localStorage  │
│ • Overload Calc │   │ • Fallbacks     │   │ • Semantic      │
│ • Recovery Score│   │ • Token Budget  │   │ • TTL per type  │
└─────────────────┘   └─────────────────┘   └─────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE LAYER                               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  RAG System  │  │   Feature    │  │   User Context       │  │
│  │  (TF-IDF)    │  │   Store      │  │   Builder            │  │
│  │              │  │              │  │                      │  │
│  │ • Form guides│  │ • 150+ feats │  │ • Training history   │  │
│  │ • Programs   │  │ • Real-time  │  │ • Goals & prefs      │  │
│  │ • Nutrition  │  │ • Derived    │  │ • Recovery status    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Decision Matrix: ML vs LLM

| Feature | ML (Local) | LLM (Cloud) | Hybrid |
|---------|------------|-------------|--------|
| Exercise scoring | ✅ Primary | - | - |
| Exercise explanation | - | ✅ Primary | - |
| Program ranking | ✅ Primary | - | - |
| Program rationale | - | ✅ Primary | - |
| Weight suggestion | ✅ Primary | Enhancement | ✅ |
| Form coaching | - | ✅ Primary | RAG + LLM |
| Workout summary | - | ✅ Primary | Template fallback |
| Motivation | - | ✅ Primary | Quote library fallback |
| Weak point analysis | ✅ Detection | ✅ Explanation | ✅ |
| Recovery scoring | ✅ Primary | - | - |

### Decision Logic

```typescript
function routeRequest(request: AIRequest): 'ml' | 'llm' | 'hybrid' {
  // Always ML (offline-critical)
  if (['exercise_score', 'program_rank', 'recovery_score'].includes(request.type)) {
    return 'ml';
  }

  // Always LLM (requires generation)
  if (['form_guide', 'workout_summary', 'coaching'].includes(request.type)) {
    return 'llm';
  }

  // Hybrid (ML computes, LLM explains)
  if (['progressive_overload', 'weak_point', 'program_recommendation'].includes(request.type)) {
    return 'hybrid';
  }

  return 'llm'; // Default for unknown
}
```

---

## Component Integration

### 1. Exercise Recommendations (Hybrid)

**Flow:**
```
User opens "Add Exercise"
         │
         ▼
┌─────────────────────┐
│ ML: Score exercises │ ← 150+ features
│ (6-factor model)    │   <30ms
└─────────┬───────────┘
          │ Top 10 scored
          ▼
┌─────────────────────┐
│ LLM: Add rationale  │ ← "Based on your..."
│ (optional, cached)  │   <500ms (or cache hit)
└─────────┬───────────┘
          │
          ▼
    Display ranked list
    with explanations
```

**Scoring Formula (ML):**
```
Score = (0.30 × MuscleBalance) +
        (0.20 × RecoveryStatus) +
        (0.20 × UserPreference) +
        (0.15 × GoalAlignment) +
        (0.10 × ExperienceMatch) +
        (0.05 × NoveltyBonus)
```

### 2. Progressive Overload (Hybrid)

**Flow:**
```
User completes set
         │
         ▼
┌─────────────────────┐
│ ML: Calculate next  │ ← Performance trends
│ weight/reps         │   RPE history
└─────────┬───────────┘   Recovery status
          │               <20ms
          ▼
┌─────────────────────┐
│ LLM: Personalize    │ ← "Great progress on..."
│ suggestion text     │   "Consider deload..."
└─────────┬───────────┘   <500ms (cached 6hr)
          │
          ▼
    Show suggestion card
    with reasoning
```

**Decision Tree (ML):**
```
IF avgRPE < 7 AND reps ≥ target:
  → Increase weight 5-10 lbs
ELSE IF avgRPE > 8.5 OR consecutiveHardSessions > 3:
  → Suggest deload (-10%)
ELSE IF weightPlateau > 2 weeks:
  → Volume progression (more reps)
ELSE IF weightDecreasing:
  → Active recovery (-15%)
ELSE:
  → Maintain current
```

### 3. AI Coaching (LLM with RAG)

**Flow:**
```
User asks: "Why do my knees hurt during squats?"
         │
         ▼
┌─────────────────────┐
│ RAG: Retrieve       │ ← Search form guides
│ relevant docs       │   Fitness knowledge base
└─────────┬───────────┘   <50ms
          │ Top 3 docs
          ▼
┌─────────────────────┐
│ Context: Build      │ ← User history
│ user context        │   Recent workouts
└─────────┬───────────┘   Goals, experience
          │
          ▼
┌─────────────────────┐
│ LLM: Generate       │ ← Gemini Pro
│ personalized answer │   Max 500 tokens
└─────────┬───────────┘   <1500ms
          │
          ▼
    Display coaching
    response
```

---

## Data Flow

### Feature Pipeline

```
Raw Data Sources              Feature Engineering              Model Input
─────────────────             ───────────────────              ───────────

WorkoutSession[] ─────┐
                      │       ┌─────────────────┐
ExerciseLog[] ────────┼──────▶│ FeatureExtractor│
                      │       │                 │
SetLog[] ─────────────┤       │ • Aggregate     │──────▶ 150+ Features
                      │       │ • Normalize     │
UserSettings ─────────┤       │ • Derive        │        [User: 50]
                      │       │ • Window (7/30d)│        [Exercise: 30 each]
DailyLog[] ───────────┘       └─────────────────┘        [Context: 20]
```

### Context Compression (for LLM)

```typescript
// Full context: ~2000 tokens
// Compressed context: ~400 tokens

function compressContext(full: FullContext): CompressedContext {
  return {
    // User summary (50 tokens)
    user: `${full.experience} lifter, ${full.goal} focus, ${full.daysPerWeek}d/wk`,

    // Recent performance (100 tokens)
    recent: summarizeLast5Workouts(full.history),

    // Current state (50 tokens)
    current: {
      exercise: full.activeExercise?.name,
      lastWeight: full.lastSet?.weight,
      lastReps: full.lastSet?.reps,
      lastRPE: full.lastSet?.rpe,
    },

    // Relevant PRs (50 tokens)
    prs: getRelevantPRs(full.personalRecords, full.activeExercise),

    // Recovery (50 tokens)
    recovery: {
      sleep: full.dailyLog?.sleepQuality,
      fatigue: full.dailyLog?.fatigueLevel,
      restDays: full.daysSinceLastWorkout,
    },
  };
}
```

---

## Caching Strategy

### Cache Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ L1: Memory LRU Cache                                        │
│ • Size: 100 entries                                         │
│ • TTL: 5 minutes                                            │
│ • Use: Hot data, current session                            │
├─────────────────────────────────────────────────────────────┤
│ L2: localStorage Cache                                      │
│ • Size: 5MB limit                                           │
│ • TTL: Per feature type (see below)                         │
│ • Use: Cross-session persistence                            │
├─────────────────────────────────────────────────────────────┤
│ L3: Semantic Cache                                          │
│ • Similarity: Cosine > 0.85                                 │
│ • Use: Similar queries reuse responses                      │
└─────────────────────────────────────────────────────────────┘
```

### TTL Configuration

| Feature Type | TTL | Rationale |
|--------------|-----|-----------|
| Form Guide | 7 days | Static content |
| Exercise Visual | 30 days | Generated images |
| Motivation | 1 hour | Variety preferred |
| Progressive Overload | 6 hours | Context-dependent |
| Workout Summary | 30 days | Historical record |
| Coaching Response | 2 hours | Conversation context |

### Cache Key Generation

```typescript
function generateCacheKey(request: AIRequest): string {
  const params = {
    type: request.type,
    exerciseId: request.exerciseId,
    userId: hash(request.userId), // Privacy
    contextHash: hash(JSON.stringify(request.context)),
    promptVersion: request.promptVersion,
  };
  return `ai:${request.type}:${hash(params)}`;
}
```

---

## Cost Management

### Token Budget

| Period | Limit | Estimated Cost |
|--------|-------|----------------|
| Daily | 100,000 tokens | $0.30 |
| Monthly | 2,000,000 tokens | $6.00 |

### Model Selection

```typescript
function selectModel(request: AIRequest): GeminiModel {
  // Use Flash (cheap, fast) for:
  if (['motivation', 'form_guide', 'workout_summary'].includes(request.type)) {
    return 'gemini-1.5-flash';
  }

  // Use Pro (expensive, smart) for:
  if (['coaching', 'weak_point_analysis', 'complex_question'].includes(request.type)) {
    return 'gemini-1.5-pro';
  }

  // Default to Flash
  return 'gemini-1.5-flash';
}
```

### Cost per Feature (estimated)

| Feature | Model | Tokens | Cost/call |
|---------|-------|--------|-----------|
| Motivation | Flash | 100 | $0.00001 |
| Form Guide | Flash | 300 | $0.00003 |
| Progressive Overload | Flash | 400 | $0.00004 |
| Workout Summary | Flash | 500 | $0.00005 |
| Coaching | Pro | 800 | $0.0004 |
| Weak Point Analysis | Pro | 1000 | $0.0005 |

---

## Fallback Chain

Every AI feature has a graceful degradation path:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   LLM (Cloud)   │────▶│  Cache (Local)  │────▶│ Rule-based      │
│                 │fail │                 │miss │ Fallback        │
│ Full generation │     │ Previous result │     │ Template/Rules  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Fallback Examples

**Progressive Overload:**
```typescript
// LLM fails → Cache miss → Rule-based
function getProgressiveOverloadFallback(context: WorkoutContext): Suggestion {
  const lastWeight = context.lastSet?.weight || 0;
  const lastReps = context.lastSet?.reps || 0;
  const lastRPE = context.lastSet?.rpe || 7;

  if (lastRPE < 7 && lastReps >= 8) {
    return {
      action: 'increase',
      newWeight: lastWeight + 5,
      reasoning: 'Previous set felt manageable. Try adding 5 lbs.',
    };
  }
  // ... more rules
}
```

**Motivation:**
```typescript
const MOTIVATION_LIBRARY = [
  "Every rep counts. Make this one matter.",
  "You're stronger than yesterday.",
  "The iron doesn't lie. Neither does your effort.",
  // ... 50+ quotes
];

function getMotivationFallback(): string {
  return MOTIVATION_LIBRARY[Math.floor(Math.random() * MOTIVATION_LIBRARY.length)];
}
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Deliverables:**
- [ ] Local ML scoring (rule-based, no training)
- [ ] Basic LLM integration (Gemini Flash)
- [ ] Multi-tier cache system
- [ ] Fallback handlers

**Metrics:**
- Latency: <300ms (p95)
- Offline: Core features work
- Cost: <$3/month

### Phase 2: Enhancement (Weeks 5-8)

**Deliverables:**
- [ ] RAG system for form guides
- [ ] Context builder optimization
- [ ] Prompt versioning & A/B testing
- [ ] Semantic caching

**Metrics:**
- Latency: <200ms (p95)
- Cache hit rate: >40%
- User satisfaction: >70%

### Phase 3: Intelligence (Weeks 9-12)

**Deliverables:**
- [ ] Collaborative filtering for exercises
- [ ] LightGBM for progression
- [ ] Agent architecture for complex queries
- [ ] Personalization based on feedback

**Metrics:**
- Recommendation CTR: >40%
- Progression accuracy: >70%
- Cost: <$6/month

---

## File Structure

```
services/
├── ai/
│   ├── index.ts          # Public API
│   ├── types.ts          # Type definitions
│   ├── cache.ts          # Multi-tier caching
│   ├── prompts.ts        # Prompt templates
│   ├── rag.ts            # RAG system
│   ├── llm.ts            # LLM client
│   ├── fallbacks.ts      # Graceful degradation
│   ├── contextBuilder.ts # Context management
│   └── agent.ts          # Multi-step reasoning
├── ml/
│   ├── index.ts          # ML entry point
│   ├── features.ts       # Feature extraction
│   ├── exerciseRec.ts    # Exercise recommender
│   ├── programRec.ts     # Program recommender
│   ├── overload.ts       # Progressive overload
│   └── recovery.ts       # Recovery scoring
└── geminiService.ts      # Legacy (wraps new AI service)

docs/
├── ml-recommendation-pipeline.md
├── ml-architecture-diagram.md
├── ml-implementation-examples.md
├── ai-architecture.md
└── unified-ai-ml-pipeline.md  # This document
```

---

## API Reference

### Core Functions

```typescript
// Exercise Recommendations
getExerciseRecommendations(
  context: WorkoutContext,
  options?: { limit?: number; enhanceWithLLM?: boolean }
): Promise<ExerciseRecommendation[]>

// Program Recommendations
getProgramRecommendations(
  userSettings: UserSettings,
  options?: { limit?: number }
): Promise<ProgramRecommendation[]>

// Progressive Overload
getProgressiveOverloadSuggestion(
  exerciseId: string,
  context: WorkoutContext,
  options?: { enhanceWithLLM?: boolean }
): Promise<OverloadSuggestion>

// AI Coaching
getCoachingResponse(
  query: string,
  context: UserContext
): Promise<CoachingResponse>

// Workout Summary
getWorkoutSummary(
  workout: WorkoutSession
): Promise<WorkoutSummary>

// Motivation
getMotivation(
  context?: MotivationContext
): Promise<string>
```

### Response Types

```typescript
interface AIResponse<T> {
  data: T;
  meta: {
    source: 'ml' | 'llm' | 'cache' | 'fallback';
    latency: number;
    tokensUsed?: number;
    cacheHit: boolean;
    modelUsed?: string;
  };
}
```

---

## Monitoring & Observability

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| p50 latency | <100ms | >200ms |
| p95 latency | <200ms | >500ms |
| Cache hit rate | >50% | <30% |
| LLM error rate | <1% | >5% |
| Fallback rate | <10% | >25% |
| Daily token usage | <100K | >80K |

### Logging

```typescript
logger.info('ai_request', {
  type: request.type,
  source: response.meta.source,
  latency: response.meta.latency,
  cacheHit: response.meta.cacheHit,
  tokensUsed: response.meta.tokensUsed,
  modelUsed: response.meta.modelUsed,
  userId: hash(userId), // Privacy
});
```

---

## Security Considerations

1. **API Key Protection**: Gemini API key stored in environment variables only
2. **User Data Privacy**: Context compressed and anonymized before LLM calls
3. **PII Filtering**: Names, emails stripped from prompts
4. **Rate Limiting**: Per-user limits prevent abuse
5. **Input Validation**: All user inputs sanitized before processing

---

## Conclusion

This unified pipeline combines the strengths of local ML (speed, offline, privacy) with cloud LLM (intelligence, personalization, natural language). The phased rollout ensures incremental value delivery while managing costs and complexity.

**Total Implementation Effort**: ~12 weeks
**Ongoing Cost**: ~$6/month at scale
**User Value**: Personalized, intelligent fitness coaching that works offline
