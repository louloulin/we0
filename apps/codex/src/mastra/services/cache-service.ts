/**
 * Cache Service for Mastra API
 * 
 * Provides intelligent caching for API responses, model outputs, and frequently accessed data
 * to improve performance and reduce API costs.
 */

import { createHash } from 'crypto';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
  lastAccessed: number;
}

export interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  enableMetrics?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalEntries: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * In-memory cache with LRU eviction and TTL support
 */
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private accessOrder = new Map<string, number>(); // For LRU tracking
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalEntries: 0,
    hitRate: 0,
    memoryUsage: 0,
  };

  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly enableMetrics: boolean;
  private accessCounter = 0;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000; // 1000 entries default
    this.enableMetrics = options.enableMetrics !== false;

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Generate cache key from input data
   */
  private generateKey(prefix: string, data: any): string {
    const serialized = JSON.stringify(data);
    const hash = createHash('sha256').update(serialized).digest('hex').substring(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    this.accessOrder.set(key, ++this.accessCounter);
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLRU(): void {
    if (this.cache.size < this.maxSize) return;

    // Find the least recently used key
    let lruKey = '';
    let lruAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder) {
      if (accessTime < lruAccess) {
        lruAccess = accessTime;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.accessOrder.delete(lruKey);
      this.metrics.evictions++;
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    this.updateMetrics();
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    if (!this.enableMetrics) return;

    this.metrics.totalEntries = this.cache.size;
    this.metrics.hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry).length * 2; // Rough estimate
    }
    this.metrics.memoryUsage = memoryUsage;
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      this.updateMetrics();
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.metrics.misses++;
      this.updateMetrics();
      return null;
    }

    // Update access tracking
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);
    this.metrics.hits++;
    this.updateMetrics();

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict LRU entries if cache is full
    this.evictLRU();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.updateMetrics();
  }

  /**
   * Cache a function result with automatic key generation
   */
  async cacheFunction<T>(
    prefix: string,
    fn: () => Promise<T>,
    input: any,
    ttl?: number
  ): Promise<T> {
    const key = this.generateKey(prefix, input);
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * Cache model responses
   */
  async cacheModelResponse<T>(
    model: string,
    messages: any[],
    options: any,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const input = { model, messages, options };
    return this.cacheFunction(`model:${model}`, fn, input, ttl);
  }

  /**
   * Cache API responses
   */
  async cacheApiResponse<T>(
    endpoint: string,
    params: any,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const input = { endpoint, params };
    return this.cacheFunction(`api:${endpoint}`, fn, input, ttl);
  }

  /**
   * Delete cached entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.accessOrder.delete(key);
      this.updateMetrics();
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalEntries: 0,
      hitRate: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Destroy the cache service and clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.clear();
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get cache status
   */
  getStatus() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
      metrics: this.getMetrics(),
    };
  }
}

// Global cache instance
export const cacheService = new CacheService({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 2000,
  enableMetrics: true,
});

// Clean up global instance on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    cacheService.destroy();
  });
  process.on('SIGINT', () => {
    cacheService.destroy();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cacheService.destroy();
    process.exit(0);
  });
}

export default cacheService;
