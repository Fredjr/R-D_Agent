interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
}

interface CacheOptions {
  maxSize: number;
  defaultTTL: number; // Time to live in milliseconds
  maxMemoryMB: number;
  persistToStorage: boolean;
  compressionEnabled: boolean;
}

const DEFAULT_OPTIONS: CacheOptions = {
  maxSize: 1000,
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxMemoryMB: 50,
  persistToStorage: true,
  compressionEnabled: true
};

class PubMedCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  };
  private options: CacheOptions;
  private storageKey = 'pubmed_cache_v1';

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.loadFromStorage();
    this.startCleanupInterval();
  }

  private generateKey(endpoint: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }

  private compress(data: any): string {
    if (!this.options.compressionEnabled) {
      return JSON.stringify(data);
    }
    
    // Simple compression using JSON.stringify with replacer
    return JSON.stringify(data, (key, value) => {
      if (typeof value === 'string' && value.length > 100) {
        // Compress long strings by removing extra whitespace
        return value.replace(/\s+/g, ' ').trim();
      }
      return value;
    });
  }

  private decompress(compressedData: string): any {
    return JSON.parse(compressedData);
  }

  private estimateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      console.log(`🗑️ Evicted cache entry: ${oldestKey}`);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let evicted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        evicted++;
      }
    }

    if (evicted > 0) {
      console.log(`🧹 Cleaned up ${evicted} expired cache entries`);
    }
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private saveToStorage(): void {
    if (!this.options.persistToStorage) return;

    try {
      const cacheData = Array.from(this.cache.entries()).slice(0, 100); // Limit storage size
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private loadFromStorage(): void {
    if (!this.options.persistToStorage) return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const cacheData = JSON.parse(stored);
        const now = Date.now();
        
        for (const [key, entry] of cacheData) {
          // Only load non-expired entries
          if (now < entry.expiresAt) {
            this.cache.set(key, entry);
          }
        }
        
        console.log(`📦 Loaded ${this.cache.size} cache entries from storage`);
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  async get<T>(
    endpoint: string, 
    params: Record<string, any> = {},
    fetchFunction?: () => Promise<T>
  ): Promise<T | null> {
    const key = this.generateKey(endpoint, params);
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry && now < entry.expiresAt) {
      // Cache hit
      entry.accessCount++;
      entry.lastAccessed = now;
      this.stats.hits++;
      
      console.log(`✅ Cache hit: ${key} (accessed ${entry.accessCount} times)`);
      return this.decompress(entry.data);
    }

    // Cache miss
    this.stats.misses++;
    
    if (!fetchFunction) {
      console.log(`❌ Cache miss: ${key} (no fetch function provided)`);
      return null;
    }

    try {
      console.log(`🔄 Cache miss: ${key} - fetching fresh data`);
      const data = await fetchFunction();
      
      // Store in cache
      this.set(key, data);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch data for ${key}:`, error);
      throw error;
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.options.defaultTTL);
    
    // Check memory limits
    const estimatedSize = this.estimateSize(data);
    const maxSizeBytes = this.options.maxMemoryMB * 1024 * 1024;
    
    if (estimatedSize > maxSizeBytes / 10) {
      console.warn(`⚠️ Large cache entry (${(estimatedSize / 1024).toFixed(1)}KB): ${key}`);
    }

    // Evict if necessary
    while (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<string> = {
      data: this.compress(data),
      timestamp: now,
      expiresAt,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    console.log(`💾 Cached: ${key} (expires in ${Math.round((expiresAt - now) / 1000)}s)`);

    // Periodically save to storage
    if (this.cache.size % 10 === 0) {
      this.saveToStorage();
    }
  }

  delete(endpoint: string, params: Record<string, any> = {}): boolean {
    const key = this.generateKey(endpoint, params);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      console.log(`🗑️ Deleted cache entry: ${key}`);
    }
    
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, totalRequests: 0 };
    
    if (this.options.persistToStorage) {
      localStorage.removeItem(this.storageKey);
    }
    
    console.log('🧹 Cache cleared');
  }

  getStats(): CacheStats & typeof this.stats {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + this.estimateSize(entry.data), 0);
    const hitRate = this.stats.totalRequests > 0 ? (this.stats.hits / this.stats.totalRequests) * 100 : 0;
    const missRate = this.stats.totalRequests > 0 ? (this.stats.misses / this.stats.totalRequests) * 100 : 0;
    
    const timestamps = entries.map(e => e.timestamp);
    const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    return {
      ...this.stats,
      totalEntries: this.cache.size,
      totalSize,
      hitRate,
      missRate,
      oldestEntry,
      newestEntry
    };
  }

  // Preload commonly accessed data
  async preload(endpoints: Array<{ endpoint: string; params?: Record<string, any>; fetchFunction: () => Promise<any> }>): Promise<void> {
    console.log(`🚀 Preloading ${endpoints.length} cache entries...`);
    
    const promises = endpoints.map(async ({ endpoint, params = {}, fetchFunction }) => {
      const key = this.generateKey(endpoint, params);
      if (!this.cache.has(key)) {
        try {
          const data = await fetchFunction();
          this.set(key, data);
        } catch (error) {
          console.warn(`Failed to preload ${key}:`, error);
        }
      }
    });

    await Promise.allSettled(promises);
    console.log('✅ Preloading complete');
  }

  // Get cache entries matching a pattern
  getByPattern(pattern: RegExp): Array<{ key: string; data: any; entry: CacheEntry<any> }> {
    const matches: Array<{ key: string; data: any; entry: CacheEntry<any> }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(key)) {
        matches.push({
          key,
          data: this.decompress(entry.data),
          entry
        });
      }
    }
    
    return matches;
  }
}

// Global cache instance
export const pubmedCache = new PubMedCache({
  maxSize: 500,
  defaultTTL: 15 * 60 * 1000, // 15 minutes for PubMed data
  maxMemoryMB: 25,
  persistToStorage: true,
  compressionEnabled: true
});

// Utility functions for common PubMed endpoints
export const PubMedCacheUtils = {
  getCitations: (pmid: string, limit: number = 10) => 
    pubmedCache.get(`/api/proxy/pubmed/citations`, { pmid, limit }),
    
  getReferences: (pmid: string, limit: number = 10) => 
    pubmedCache.get(`/api/proxy/pubmed/references`, { pmid, limit }),
    
  getNetwork: (pmid: string, type: string, limit: number = 20) => 
    pubmedCache.get(`/api/proxy/pubmed/network`, { pmid, type, limit }),
    
  getCollectionNetwork: (collectionId: string, projectId: string, limit: number = 20) => 
    pubmedCache.get(`/api/proxy/collections/${collectionId}/pubmed-network`, { projectId, limit }),

  // Invalidate related cache entries when data changes
  invalidateArticle: (pmid: string) => {
    const patterns = [
      new RegExp(`pmid=${pmid}`),
      new RegExp(`/articles/${pmid}/`),
      new RegExp(`source_article_pmid.*${pmid}`)
    ];
    
    patterns.forEach(pattern => {
      const matches = pubmedCache.getByPattern(pattern);
      matches.forEach(({ key }) => pubmedCache.delete(key, {}));
    });
  },

  // Preload common data for a project
  preloadProject: async (projectId: string, collections: Array<{ collection_id: string }>) => {
    const endpoints = collections.map(collection => ({
      endpoint: `/api/proxy/collections/${collection.collection_id}/pubmed-network`,
      params: { projectId, limit: 50 },
      fetchFunction: () => fetch(`/api/proxy/collections/${collection.collection_id}/pubmed-network?projectId=${projectId}&limit=50`).then(r => r.json())
    }));

    await pubmedCache.preload(endpoints);
  }
};

export default pubmedCache;
