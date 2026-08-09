import { Injectable, Logger } from '@nestjs/common';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  /** Fingerprint of the profile that produced this entry — used for invalidation */
  profileHash: string;
}

/**
 * In-process salary cache with a 24-hour TTL.
 *
 * Uses a plain Map keyed by userId so no external infrastructure (Redis, etc.)
 * is required. The cache is automatically invalidated when the user's career
 * profile changes — detected by comparing a lightweight hash of the profile
 * fields that affect salary prediction.
 */
@Injectable()
export class SalaryCacheService {
  private readonly logger = new Logger(SalaryCacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();

  /** Build a cache key strictly based on userId + country + jobTitle */
  buildCacheKey(userId: string, countryCode: string, jobTitle: string): string {
    const c = (countryCode || 'us').toLowerCase();
    const t = (jobTitle || '').toLowerCase().trim();
    return `${userId}:${c}:${t}`;
  }

  /** Compute a stable string fingerprint for the profile fields that drive salary. */
  buildProfileHash(profile: {
    currentRole?: string;
    targetRole?: string;
    experienceYears?: number;
    location?: string;
    skills?: string[];
    educationLevel?: string;
    certifications?: string[];
    industry?: string;
  }, countryCode: string = '', jobTitle: string = ''): string {
    return [
      jobTitle.toLowerCase().trim(),
      profile.currentRole ?? '',
      profile.targetRole ?? '',
      String(profile.experienceYears ?? 0),
      (profile.skills ?? []).slice().sort().join(','),
      profile.educationLevel ?? '',
      (profile.certifications ?? []).slice().sort().join(','),
      profile.industry ?? '',
      countryCode.toLowerCase(),
    ].join('|');
  }

  get<T>(cacheKey: string, profileHash: string): T | null {
    const entry = this.store.get(cacheKey) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();

    if (now > entry.expiresAt) {
      this.logger.debug(`Cache expired for key ${cacheKey}`);
      this.store.delete(cacheKey);
      return null;
    }

    if (entry.profileHash !== profileHash) {
      this.logger.debug(`Profile changed for key ${cacheKey} — cache invalidated`);
      this.store.delete(cacheKey);
      return null;
    }

    this.logger.debug(`Cache HIT for key ${cacheKey}`);
    return entry.data;
  }

  set<T>(cacheKey: string, profileHash: string, data: T): void {
    const anyData = data as any;
    if (anyData?.dataStatus === 'NO_DATA' || anyData?.dataStatus === 'API_ERROR') {
      this.logger.debug(`Skipping cache for status ${anyData?.dataStatus} (key: ${cacheKey})`);
      return;
    }
    this.store.set(cacheKey, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
      profileHash,
    });
    this.logger.debug(`Cache SET for key ${cacheKey} (TTL 24h)`);
  }

  /** Explicitly evict all cached entries for a user — called after profile update */
  invalidate(userId: string): void {
    const prefix = `${userId}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
    this.logger.debug(`Cache INVALIDATED for user ${userId}`);
  }
}
