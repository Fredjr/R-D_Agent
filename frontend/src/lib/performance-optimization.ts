/**
 * Performance Optimization System
 * Implements caching, lazy loading, and optimization strategies for the semantic features
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
}

export interface PerformanceMetrics {
  cache_hit_rate: number;
  average_response_time: number;
  memory_usage: number;
  api_calls_saved: number;
  user_experience_score: number;
}

export class PerformanceOptimizer {
  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue = new Map<string, Promise<any>>();
  private metrics: PerformanceMetrics = {
    cache_hit_rate: 0,
    average_response_time: 0,
    memory_usage: 0,
    api_calls_saved: 0,
    user_experience_score: 0
  };

  // Cache configuration
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CACHE_CLEANUP_INTERVAL = 60 * 1000; // 1 minute

  constructor() {
    this.startCacheCleanup();
    this.startMetricsCollection();
  }

  /**
   * Cached API call with deduplication
   */
  async cachedApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const startTime = performance.now();

    // Check cache first
    const cached = this.getFromCache<T>(key);
    if (cached) {
      this.updateMetrics('cache_hit', performance.now() - startTime);
      return cached;
    }

    // Check if request is already in progress (deduplication)
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    // Make the API call
    const promise = apiCall().then(result => {
      this.setCache(key, result, ttl);
      this.requestQueue.delete(key);
      this.updateMetrics('cache_miss', performance.now() - startTime);
      return result;
    }).catch(error => {
      this.requestQueue.delete(key);
      throw error;
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  /**
   * Get data from cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    return entry.data;
  }

  /**
   * Set data in cache
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
  }

  /**
   * Evict least recently used items
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Batch API calls for efficiency
   */
  async batchApiCalls<T>(
    requests: Array<{ key: string; apiCall: () => Promise<T>; ttl?: number }>
  ): Promise<T[]> {
    const promises = requests.map(req => 
      this.cachedApiCall(req.key, req.apiCall, req.ttl)
    );

    return Promise.all(promises);
  }

  /**
   * Preload data for better user experience
   */
  async preloadData(keys: string[], apiCalls: (() => Promise<any>)[]): Promise<void> {
    const preloadPromises = keys.map((key, index) => 
      this.cachedApiCall(key, apiCalls[index], this.DEFAULT_TTL * 2) // Longer TTL for preloaded data
    );

    // Don't wait for preloading to complete
    Promise.all(preloadPromises).catch(error => {
      console.warn('Preloading failed:', error);
    });
  }

  /**
   * Lazy loading with intersection observer
   */
  createLazyLoader(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    return new IntersectionObserver(callback, defaultOptions);
  }

  /**
   * Debounced function for search and user input
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttled function for scroll and resize events
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Memory-efficient data processing
   */
  processInChunks<T, R>(
    data: T[],
    processor: (chunk: T[]) => R[],
    chunkSize: number = 100
  ): R[] {
    const results: R[] = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkResults = processor(chunk);
      results.push(...chunkResults);
      
      // Allow other tasks to run
      if (i % (chunkSize * 10) === 0) {
        setTimeout(() => {}, 0);
      }
    }
    
    return results;
  }

  /**
   * Start cache cleanup process
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, this.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.calculateMetrics();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(type: 'cache_hit' | 'cache_miss', responseTime: number): void {
    // Update response time
    this.metrics.average_response_time = 
      (this.metrics.average_response_time + responseTime) / 2;

    // Update API calls saved
    if (type === 'cache_hit') {
      this.metrics.api_calls_saved++;
    }
  }

  /**
   * Calculate comprehensive metrics
   */
  private calculateMetrics(): void {
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0);
    const totalEntries = this.cache.size;
    
    this.metrics.cache_hit_rate = totalEntries > 0 ? totalHits / totalEntries : 0;
    this.metrics.memory_usage = this.estimateMemoryUsage();
    this.metrics.user_experience_score = this.calculateUXScore();
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    // Rough estimation of cache memory usage
    return this.cache.size * 1024; // Assume 1KB per entry on average
  }

  /**
   * Calculate user experience score
   */
  private calculateUXScore(): number {
    const hitRate = this.metrics.cache_hit_rate;
    const responseTime = this.metrics.average_response_time;
    
    // Score based on cache hit rate and response time
    const hitRateScore = hitRate * 0.6;
    const responseTimeScore = Math.max(0, (1000 - responseTime) / 1000) * 0.4;
    
    return Math.min(hitRateScore + responseTimeScore, 1.0);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.requestQueue.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hit_rate: number;
    memory_usage: number;
    oldest_entry: number;
  } {
    let oldestTimestamp = Date.now();
    
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      hit_rate: this.metrics.cache_hit_rate,
      memory_usage: this.metrics.memory_usage,
      oldest_entry: Date.now() - oldestTimestamp
    };
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer();
