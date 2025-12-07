/**
 * RAG (Retrieval-Augmented Generation) System
 *
 * Provides contextual knowledge retrieval for:
 * - Exercise form guides
 * - Program explanations
 * - Fitness knowledge base
 * - Personalized tips based on user data
 *
 * Uses local text-based search (TF-IDF inspired) for offline-first operation.
 * Can be extended with vector embeddings for semantic search.
 */

import { RAGDocument, RAGQuery, RAGResult } from './types';
import { MuscleGroup } from '../../types';
import { EXERCISE_LIBRARY } from '../../constants';
// Note: Programs imported when needed to avoid circular dependency

// =============================================================================
// Document Store
// =============================================================================

class RAGDocumentStore {
  private documents: Map<string, RAGDocument> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map(); // term -> docIds
  private initialized: boolean = false;

  /**
   * Initialize the document store with static content
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Index exercise form guides
    EXERCISE_LIBRARY.forEach((exercise) => {
      // Form guide document
      this.addDocument({
        id: `exercise_guide_${exercise.id}`,
        type: 'exercise_guide',
        content: this.buildExerciseGuideContent(exercise),
        metadata: {
          exerciseId: exercise.id,
          muscleGroup: exercise.muscleGroup as MuscleGroup,
          difficulty: exercise.difficulty,
        },
      });

      // Form tips document
      if (exercise.tips && exercise.tips.length > 0) {
        this.addDocument({
          id: `form_tip_${exercise.id}`,
          type: 'form_tip',
          content: `${exercise.name} tips: ${exercise.tips.join('. ')}`,
          metadata: {
            exerciseId: exercise.id,
            muscleGroup: exercise.muscleGroup as MuscleGroup,
          },
        });
      }
    });

    // Add fitness knowledge base
    this.addFitnessKnowledge();

    this.initialized = true;
    console.log(`[RAG] Initialized with ${this.documents.size} documents`);
  }

  /**
   * Build comprehensive content for exercise guide
   */
  private buildExerciseGuideContent(exercise: any): string {
    const parts = [
      `Exercise: ${exercise.name}`,
      `Primary Muscle: ${exercise.muscleGroup}`,
      exercise.secondaryMuscles?.length
        ? `Secondary Muscles: ${exercise.secondaryMuscles.join(', ')}`
        : '',
      `Equipment: ${exercise.equipment}`,
      `Category: ${exercise.category}`,
      `Difficulty: ${exercise.difficulty}`,
      '',
      'Form Guide:',
      ...(exercise.formGuide || []).map((step: string, i: number) => `${i + 1}. ${step}`),
      '',
      'Common Mistakes:',
      ...(exercise.commonMistakes || []).map((m: string) => `- ${m}`),
      '',
      'Tips:',
      ...(exercise.tips || []).map((t: string) => `- ${t}`),
    ];

    return parts.filter(Boolean).join('\n');
  }

  /**
   * Add static fitness knowledge documents
   */
  private addFitnessKnowledge(): void {
    const knowledgeBase = [
      // Progressive Overload
      {
        id: 'knowledge_progressive_overload',
        type: 'fitness_knowledge' as const,
        content: `Progressive Overload Principles:
Progressive overload is the gradual increase of stress placed on the body during training.
Methods include: increasing weight, adding reps, adding sets, reducing rest time.
For beginners: aim for 5-10% weight increase when you can complete all target reps.
For intermediates: 2.5-5% increases or microloading with 1.25kg plates.
For advanced: periodization with planned deloads every 4-6 weeks.
Signs you need more weight: completing all sets with 2+ reps in reserve.
Signs you need less weight: failing before target reps, form breakdown, excessive fatigue.`,
        metadata: { source: 'internal' },
      },
      // Recovery
      {
        id: 'knowledge_recovery',
        type: 'fitness_knowledge' as const,
        content: `Recovery Guidelines:
Sleep: 7-9 hours for optimal recovery. Sleep deprivation can reduce strength by 7-11%.
Rest between sets: Strength (3-5min), Hypertrophy (1-2min), Endurance (30-60s).
Rest between sessions: Same muscle group needs 48-72 hours recovery.
Deload weeks: Every 4-8 weeks, reduce volume/intensity by 40-50%.
Signs of overtraining: persistent fatigue, strength regression, poor sleep, irritability.
Active recovery: light cardio, stretching, foam rolling on rest days.`,
        metadata: { source: 'internal' },
      },
      // RPE Guide
      {
        id: 'knowledge_rpe',
        type: 'fitness_knowledge' as const,
        content: `RPE (Rate of Perceived Exertion) Guide:
RPE 10: Maximum effort, no reps left in the tank. True failure.
RPE 9: Could do 1 more rep. Very hard.
RPE 8: Could do 2-3 more reps. Challenging but sustainable.
RPE 7: Could do 4-6 more reps. Moderate effort.
RPE 6 and below: Warmup territory.
Training zones: Strength (RPE 8-9), Hypertrophy (RPE 7-8), Endurance (RPE 6-7).
RPE is subjective and improves with experience.
Use RPE to autoregulate - adjust weight based on daily readiness.`,
        metadata: { source: 'internal' },
      },
      // Volume Guidelines
      {
        id: 'knowledge_volume',
        type: 'fitness_knowledge' as const,
        content: `Training Volume Guidelines:
MEV (Minimum Effective Volume): 6-8 sets per muscle group per week.
MAV (Maximum Adaptive Volume): 12-20 sets per muscle group per week.
MRV (Maximum Recoverable Volume): 20-25 sets per muscle group per week.
Beginners: Start at MEV, progress slowly.
Intermediates: Train at MAV for optimal hypertrophy.
Advanced: Periodize between MEV and MRV.
Volume accumulation: Large muscles (back, legs) can handle more volume.
Isolation exercises: Count as 0.5 sets toward muscle group volume.`,
        metadata: { source: 'internal' },
      },
      // Muscle Group Balance
      {
        id: 'knowledge_balance',
        type: 'fitness_knowledge' as const,
        content: `Muscle Group Balance:
Push/Pull Ratio: Aim for 1:1 to 1:1.5 (slightly more pull).
Anterior/Posterior Chain: Balance front and back of body.
Common imbalances: Too much pressing, not enough rowing.
Fix shoulder issues: More face pulls, rear delt work.
Fix posture: Strengthen back, stretch chest and hip flexors.
Lower body: Balance quads and hamstrings (1:0.6-0.8 ratio).
Core: Anti-rotation and anti-extension as important as flexion.`,
        metadata: { source: 'internal' },
      },
      // Nutrition Basics
      {
        id: 'knowledge_nutrition',
        type: 'fitness_knowledge' as const,
        content: `Nutrition for Strength Training:
Protein: 1.6-2.2g per kg bodyweight for muscle building.
Timing: 20-40g protein per meal, spread across 4-5 meals.
Pre-workout: Carbs + protein 1-2 hours before training.
Post-workout: Protein within 2 hours (anabolic window is broader than once thought).
Hydration: 2-3 liters water daily, more during training.
Creatine: 3-5g daily, most researched supplement for strength.
Sleep + nutrition: Both critical for recovery and adaptation.`,
        metadata: { source: 'internal' },
      },
    ];

    knowledgeBase.forEach((doc) => this.addDocument(doc));
  }

  /**
   * Add a document to the store
   */
  addDocument(doc: RAGDocument): void {
    this.documents.set(doc.id, doc);
    this.indexDocument(doc);
  }

  /**
   * Index document for search
   */
  private indexDocument(doc: RAGDocument): void {
    const terms = this.tokenize(doc.content);

    terms.forEach((term) => {
      if (!this.invertedIndex.has(term)) {
        this.invertedIndex.set(term, new Set());
      }
      this.invertedIndex.get(term)!.add(doc.id);
    });
  }

  /**
   * Tokenize text for indexing
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 2)
      .filter((term) => !STOP_WORDS.has(term));
  }

  /**
   * Search documents
   */
  search(query: RAGQuery): RAGResult[] {
    const queryTerms = this.tokenize(query.query);
    const scores: Map<string, number> = new Map();

    // Calculate TF-IDF-like scores
    queryTerms.forEach((term) => {
      const matchingDocs = this.invertedIndex.get(term);
      if (!matchingDocs) return;

      // IDF: rarer terms are more important
      const idf = Math.log(this.documents.size / matchingDocs.size);

      matchingDocs.forEach((docId) => {
        const currentScore = scores.get(docId) || 0;
        scores.set(docId, currentScore + idf);
      });
    });

    // Apply filters
    let results: RAGResult[] = [];

    scores.forEach((score, docId) => {
      const doc = this.documents.get(docId);
      if (!doc) return;

      // Type filter
      if (query.type && doc.type !== query.type) return;

      // Exercise filter
      if (query.filters?.exerciseId && doc.metadata.exerciseId !== query.filters.exerciseId) {
        return;
      }

      // Muscle group filter
      if (query.filters?.muscleGroup && doc.metadata.muscleGroup !== query.filters.muscleGroup) {
        return;
      }

      results.push({
        document: doc,
        score: score / queryTerms.length, // Normalize by query length
      });
    });

    // Sort by score and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, query.topK || 5);
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): RAGDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Get all documents of a type
   */
  getDocumentsByType(type: RAGDocument['type']): RAGDocument[] {
    return Array.from(this.documents.values()).filter((doc) => doc.type === type);
  }

  /**
   * Get exercise guide
   */
  getExerciseGuide(exerciseId: string): RAGDocument | undefined {
    return this.documents.get(`exercise_guide_${exerciseId}`);
  }

  /**
   * Get form tips for exercise
   */
  getFormTips(exerciseId: string): RAGDocument | undefined {
    return this.documents.get(`form_tip_${exerciseId}`);
  }
}

// =============================================================================
// Stop Words (common words to filter)
// =============================================================================

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
  'their', 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
  'your', 'you', 'we', 'our', 'my', 'me', 'he', 'she', 'his', 'her',
]);

// =============================================================================
// RAG Query Helpers
// =============================================================================

/**
 * Build context from RAG results for LLM prompt
 */
export function buildRAGContext(results: RAGResult[], maxTokens: number = 500): string {
  if (results.length === 0) {
    return '';
  }

  let context = '';
  let currentTokens = 0;
  const tokensPerChar = 0.25; // Approximate

  for (const result of results) {
    const content = result.document.content;
    const contentTokens = Math.ceil(content.length * tokensPerChar);

    if (currentTokens + contentTokens > maxTokens) {
      // Truncate content to fit
      const remainingTokens = maxTokens - currentTokens;
      const remainingChars = Math.floor(remainingTokens / tokensPerChar);
      if (remainingChars > 50) {
        context += content.substring(0, remainingChars) + '...\n\n';
      }
      break;
    }

    context += content + '\n\n';
    currentTokens += contentTokens;
  }

  return context.trim();
}

/**
 * Get relevant knowledge for a topic
 */
export async function getKnowledgeForTopic(
  topic: string,
  limit: number = 3
): Promise<string> {
  await ragStore.initialize();

  const results = ragStore.search({
    query: topic,
    type: 'fitness_knowledge',
    topK: limit,
  });

  return buildRAGContext(results);
}

/**
 * Get exercise-specific context
 */
export async function getExerciseContext(
  exerciseId: string,
  includeRelated: boolean = true
): Promise<string> {
  await ragStore.initialize();

  const guide = ragStore.getExerciseGuide(exerciseId);
  const tips = ragStore.getFormTips(exerciseId);

  let context = '';

  if (guide) {
    context += guide.content + '\n\n';
  }

  if (tips) {
    context += tips.content + '\n\n';
  }

  // Optionally include related knowledge
  if (includeRelated && guide) {
    const muscleGroup = guide.metadata.muscleGroup;
    if (muscleGroup) {
      const relatedKnowledge = ragStore.search({
        query: `${muscleGroup} training technique`,
        type: 'fitness_knowledge',
        topK: 1,
      });

      if (relatedKnowledge.length > 0) {
        context += 'Related Knowledge:\n' + relatedKnowledge[0].document.content;
      }
    }
  }

  return context.trim();
}

/**
 * Semantic search across all documents
 */
export async function semanticSearch(
  query: string,
  options: {
    type?: RAGDocument['type'];
    muscleGroup?: MuscleGroup;
    limit?: number;
  } = {}
): Promise<RAGResult[]> {
  await ragStore.initialize();

  return ragStore.search({
    query,
    type: options.type,
    filters: {
      muscleGroup: options.muscleGroup,
    },
    topK: options.limit || 5,
  });
}

// =============================================================================
// Singleton Export
// =============================================================================

export const ragStore = new RAGDocumentStore();

// Initialize on import (async)
if (typeof window !== 'undefined') {
  ragStore.initialize().catch(console.error);
}
