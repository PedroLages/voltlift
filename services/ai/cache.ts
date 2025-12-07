/**
 * AI Response Cache
 *
 * Multi-tier caching strategy for AI responses:
 * 1. In-memory LRU cache for hot data
 * 2. localStorage for persistence across sessions
 * 3. Semantic cache for similar queries
 *
 * Benefits:
 * - Reduces API costs by avoiding duplicate calls
 * - Improves latency (cache hit < 5ms vs API 500-2000ms)
 * - Enables offline fallbacks
 */

import { CacheEntry, CacheConfig, AIResponse } from './types';

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 500,
  defaultTTL: 1000 * 60 * 60 * 24, // 24 hours
  persistToStorage: true,
};

// TTL by feature type (some responses are more time-sensitive)
export const TTL_BY_FEATURE: Record<string, number> = {
  'motivation': 1000 * 60 * 60, // 1 hour (keep it fresh)
  'form_guide': 1000 * 60 * 60 * 24 * 7, // 7 days (static content)
  'progressive_overload': 1000 * 60 * 60 * 6, // 6 hours (context-dependent)
  'workout_summary': 1000 * 60 * 60 * 24 * 30, // 30 days (historical)
  'program_explanation': 1000 * 60 * 60 * 24 * 7, // 7 days (static)
  'coaching': 1000 * 60 * 60 * 2, // 2 hours (personalized)
  'exercise_visual': 1000 * 60 * 60 * 24 * 30, // 30 days (generated images)
};

const STORAGE_KEY = 'voltlift-ai-cache';

class AICache {
  private cache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;
  private accessOrder: string[]; // For LRU eviction

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.cache = new Map();
    this.accessOrder = [];
    this.loadFromStorage();
  }

  /**
   * Generate cache key from feature and parameters
   */
  generateKey(feature: string, params: Record<string, any>): string {
    // Sort params for consistent key generation
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    const paramsHash = this.hashObject(sortedParams);
    return `${feature}:${paramsHash}`;
  }

  /**
   * Simple hash function for objects
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached value if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      return null;
    }

    // Update access order (LRU)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    // Increment hit counter
    entry.hits++;

    return entry.value;
  }

  /**
   * Store value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Evict if at capacity
    while (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0,
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);

    // Persist to storage
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove entry from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];

    if (this.config.persistToStorage) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to clear cache from localStorage:', e);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    totalHits: number;
    oldestEntry: number | null;
  } {
    let totalHits = 0;
    let totalAccesses = 0;
    let oldestTimestamp: number | null = null;

    this.cache.forEach((entry) => {
      totalHits += entry.hits;
      totalAccesses += entry.hits + 1; // +1 for the initial set
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    });

    return {
      size: this.cache.size,
      hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
      totalHits,
      oldestEntry: oldestTimestamp,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const keyToEvict = this.accessOrder.shift();
    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (!this.config.persistToStorage) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored) as CacheEntry<any>[];
      const now = Date.now();

      // Only load non-expired entries
      data.forEach((entry) => {
        if (now < entry.timestamp + entry.ttl) {
          this.cache.set(entry.key, entry);
          this.accessOrder.push(entry.key);
        }
      });

      console.log(`[AICache] Loaded ${this.cache.size} entries from storage`);
    } catch (e) {
      console.warn('Failed to load cache from localStorage:', e);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (!this.config.persistToStorage) return;

    try {
      const entries = Array.from(this.cache.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      // localStorage full - evict old entries
      console.warn('Failed to save cache to localStorage:', e);
      this.evictOldEntries(0.3); // Evict 30% of entries
      try {
        const entries = Array.from(this.cache.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch {
        // Give up on persistence
        console.error('Unable to persist cache');
      }
    }
  }

  /**
   * Evict oldest entries by percentage
   */
  private evictOldEntries(percentage: number): void {
    const countToEvict = Math.floor(this.cache.size * percentage);
    for (let i = 0; i < countToEvict; i++) {
      this.evictLRU();
    }
  }

  /**
   * Prune expired entries
   */
  pruneExpired(): number {
    const now = Date.now();
    let prunedCount = 0;

    this.cache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        prunedCount++;
      }
    });

    if (prunedCount > 0 && this.config.persistToStorage) {
      this.saveToStorage();
    }

    return prunedCount;
  }
}

// =============================================================================
// Semantic Cache (for similar queries)
// =============================================================================

interface SemanticCacheEntry {
  query: string;
  queryTokens: string[];
  response: any;
  timestamp: number;
  ttl: number;
}

class SemanticCache {
  private entries: SemanticCacheEntry[] = [];
  private maxEntries: number = 100;
  private similarityThreshold: number = 0.8;

  /**
   * Tokenize a query for similarity comparison
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Calculate Jaccard similarity between two token sets
   */
  private calculateSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Find similar cached query
   */
  find(query: string): any | null {
    const queryTokens = this.tokenize(query);
    const now = Date.now();

    // Clean expired entries
    this.entries = this.entries.filter(e => now < e.timestamp + e.ttl);

    for (const entry of this.entries) {
      const similarity = this.calculateSimilarity(queryTokens, entry.queryTokens);
      if (similarity >= this.similarityThreshold) {
        return entry.response;
      }
    }

    return null;
  }

  /**
   * Store query and response
   */
  store(query: string, response: any, ttl: number): void {
    // Evict if at capacity
    while (this.entries.length >= this.maxEntries) {
      this.entries.shift();
    }

    this.entries.push({
      query,
      queryTokens: this.tokenize(query),
      response,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear semantic cache
   */
  clear(): void {
    this.entries = [];
  }
}

// =============================================================================
// Singleton exports
// =============================================================================

export const aiCache = new AICache();
export const semanticCache = new SemanticCache();

// Utility function to wrap AI calls with caching
export async function withCache<T>(
  feature: string,
  params: Record<string, any>,
  fetchFn: () => Promise<AIResponse<T>>,
  ttl?: number
): Promise<AIResponse<T>> {
  const cacheKey = aiCache.generateKey(feature, params);
  const effectiveTTL = ttl || TTL_BY_FEATURE[feature] || DEFAULT_CACHE_CONFIG.defaultTTL;

  // Check cache first
  const cached = aiCache.get<AIResponse<T>>(cacheKey);
  if (cached) {
    return {
      ...cached,
      source: 'cache',
      latency: 0,
    };
  }

  // Fetch from API
  const startTime = Date.now();
  const response = await fetchFn();
  const latency = Date.now() - startTime;

  // Cache successful responses
  if (response.success) {
    aiCache.set(cacheKey, { ...response, latency }, effectiveTTL);
  }

  return { ...response, latency };
}
