import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

interface CacheItem<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  totalHits: number;
  totalMisses: number;
  hitRatio: number;
  estimatedTokensSaved: number;
}

/**
 * High-performance in-memory cache with TTL, LRU eviction, and stats.
 * Used across LLM prompts, GitHub/LinkedIn data, Job Matching, and DB aggregations.
 */
@Injectable()
export class AppCacheService {
  private readonly logger = new Logger(AppCacheService.name);
  private readonly store = new Map<string, CacheItem<unknown>>();
  private readonly MAX_ENTRIES = 2000;

  private totalHits = 0;
  private totalMisses = 0;
  private estimatedTokensSaved = 0;

  /** Generate deterministic SHA-256 hash for complex inputs */
  hashKey(input: unknown): string {
    const raw = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
  }

  get<T>(key: string): T | null {
    const item = this.store.get(key) as CacheItem<T> | undefined;
    if (!item) {
      this.totalMisses++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.totalMisses++;
      return null;
    }

    item.hits++;
    this.totalHits++;
    // Estimate ~150 tokens saved per cached LLM / heavy query response
    this.estimatedTokensSaved += 150;
    return item.data;
  }

  set<T>(key: string, data: T, ttlSeconds = 300): void {
    if (this.store.size >= this.MAX_ENTRIES) {
      // LRU eviction: remove first (oldest) entry
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
      hits: 0,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): CacheStats {
    const total = this.totalHits + this.totalMisses;
    return {
      size: this.store.size,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      hitRatio: total > 0 ? Number((this.totalHits / total).toFixed(3)) : 0,
      estimatedTokensSaved: this.estimatedTokensSaved,
    };
  }

  clear(): void {
    this.store.clear();
  }
}
