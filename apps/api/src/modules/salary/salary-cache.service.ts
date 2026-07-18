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

  /** Compute a stable string fingerprint for the profile fields that drive salary */
  buildProfileHash(profile: {
    currentRole?: string;
    targetRole?: string;
    experienceYears?: number;
    location?: string;
    skills?: string[];
    educationLevel?: string;
    certifications?: string[];
    industry?: string;
  }): string {
    return [
      profile.currentRole ?? '',
      profile.targetRole ?? '',
      String(profile.experienceYears ?? 0),
      profile.location ?? '',
      (profile.skills ?? []).sort().join(','),
      profile.educationLevel ?? '',
      (profile.certifications ?? []).sort().join(','),
      profile.industry ?? '',
    ].join('|');
  }

  get<T>(userId: string, profileHash: string): T | null {
    const entry = this.store.get(userId) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();

    if (now > entry.expiresAt) {
      this.logger.debug(`Cache expired for user ${userId}`);
      this.store.delete(userId);
      return null;
    }

    if (entry.profileHash !== profileHash) {
      this.logger.debug(`Profile changed for user ${userId} — cache invalidated`);
      this.store.delete(userId);
      return null;
    }

    this.logger.debug(`Cache HIT for user ${userId}`);
    return entry.data;
  }

  set<T>(userId: string, profileHash: string, data: T): void {
    this.store.set(userId, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
      profileHash,
    });
    this.logger.debug(`Cache SET for user ${userId} (TTL 24h)`);
  }

  /** Explicitly evict a user's cached salary — called after profile update */
  invalidate(userId: string): void {
    this.store.delete(userId);
    this.logger.debug(`Cache INVALIDATED for user ${userId}`);
  }
}
