import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  fallbacks: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client!: Redis;
  private isConnected = false;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    fallbacks: 0,
  };

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('REDIS_HOST', '127.0.0.1');
    const port = this.config.get<number>('REDIS_PORT', 6379);

    this.client = new Redis({
      host,
      port,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 200, 3000);
      },
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log(`Connected to Redis server at ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.metrics.errors++;
      this.logger.warn(`Redis connection warning: ${err.message}. Degrading gracefully to database fallback.`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  /**
   * Builds standardized, isolated cache key.
   * Format: smartroadmap:{scope}:{domain}:{resource}:{id}
   */
  buildKey(scope: string, domain: string, resource: string, id: string): string {
    const cleanScope = scope.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanDomain = domain.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanResource = resource.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return `smartroadmap:${cleanScope}:${cleanDomain}:${cleanResource}:${id}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      this.metrics.fallbacks++;
      return null;
    }
    try {
      const data = await this.client.get(key);
      if (data) {
        this.metrics.hits++;
        return JSON.parse(data) as T;
      }
      this.metrics.misses++;
      return null;
    } catch (err: any) {
      this.metrics.errors++;
      this.metrics.fallbacks++;
      this.logger.warn(`Cache get failed for key "${key}": ${err.message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    if (!this.isConnected) return;
    try {
      const payload = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.client.set(key, payload, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, payload);
      }
    } catch (err: any) {
      this.metrics.errors++;
      this.logger.warn(`Cache set failed for key "${key}": ${err.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (err: any) {
      this.metrics.errors++;
      this.logger.warn(`Cache delete failed for key "${key}": ${err.message}`);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.debug(`Invalidated ${keys.length} keys matching pattern "${pattern}"`);
      }
    } catch (err: any) {
      this.metrics.errors++;
      this.logger.warn(`Cache pattern invalidation failed for "${pattern}": ${err.message}`);
    }
  }

  /**
   * Distributed Lock acquisition for Cache Stampede Protection (SET NX EX)
   */
  async acquireLock(lockKey: string, ttlMs = 5000): Promise<string | null> {
    if (!this.isConnected) return null;
    try {
      const lockToken = `lock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const result = await this.client.set(
        `lock:${lockKey}`,
        lockToken,
        'PX',
        ttlMs,
        'NX',
      );
      return result === 'OK' ? lockToken : null;
    } catch {
      return null;
    }
  }

  async releaseLock(lockKey: string, lockToken: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await this.client.eval(luaScript, 1, `lock:${lockKey}`, lockToken);
    } catch {
      // ignore unlock release errors
    }
  }

  /**
   * Helper executing fetcher on cache miss with Stampede Protection
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 300,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Attempt to acquire stampede protection lock
    const lockToken = await this.acquireLock(key, 5000);
    if (!lockToken) {
      // Another process is populating cache. Wait 200ms and re-check cache once
      await new Promise((resolve) => setTimeout(resolve, 200));
      const rechecked = await this.get<T>(key);
      if (rechecked !== null) {
        return rechecked;
      }
    }

    try {
      const freshData = await fetcher();
      if (freshData !== null && freshData !== undefined) {
        await this.set(key, freshData, ttlSeconds);
      }
      return freshData;
    } finally {
      if (lockToken) {
        await this.releaseLock(key, lockToken);
      }
    }
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }
}
