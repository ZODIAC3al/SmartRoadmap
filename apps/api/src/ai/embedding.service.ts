import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import type OpenAI from 'openai';
import { createOpenAIClient } from './openai.client';
import axios from 'axios';

/**
 * Embedding vectors are a pure function of (text, model): the same input always
 * produces the same output. Paying to embed a string twice is pure waste, and
 * the static resource index re-embeds the same documents on every boot.
 */
const EMBED_CACHE_MAX = 2000;

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly isMockMode: boolean;
  private readonly client: OpenAI | null;
  private readonly geminiApiKey: string | null;

  /** content hash -> vector. Bounded, insertion-ordered, evicts oldest first. */
  private readonly cache = new Map<string, number[]>();
  private hits = 0;
  private misses = 0;

  constructor(private readonly config: ConfigService) {
    const { isMockMode, client } = createOpenAIClient(config, this.logger);
    this.isMockMode = isMockMode;
    this.client = client;
    this.geminiApiKey = config.get<string>('GEMINI_API_KEY') || null;
  }

  private cacheKey(text: string): string {
    return createHash('sha1').update(text).digest('hex');
  }

  private readCache(text: string): number[] | null {
    const hit = this.cache.get(this.cacheKey(text));
    if (hit) {
      this.hits++;
      return hit;
    }
    this.misses++;
    return null;
  }

  private writeCache(text: string, vector: number[]): void {
    if (this.cache.size >= EMBED_CACHE_MAX) {
      // Map preserves insertion order, so the first key is the oldest entry.
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(this.cacheKey(text), vector);
  }

  /** Cache effectiveness, for the token-usage report. */
  getCacheStats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total ? Math.round((this.hits / total) * 100) : 0,
    };
  }

  /** Deterministic pseudo-embedding so mock results are stable across calls. */
  private mockEmbedding(text: string): number[] {
    let seed = 0;
    for (let i = 0; i < text.length; i++)
      seed = (seed * 31 + text.charCodeAt(i)) % 2 ** 31;

    const vector = Array.from({ length: 1536 }, () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31 - 0.5;
    });

    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map((v) => v / magnitude);
  }

  async embed(text: string): Promise<number[]> {
    const cached = this.readCache(text);
    if (cached) return cached;

    if (!this.isMockMode && this.client) {
      try {
        const response = await this.client.embeddings.create({
          model: this.config.get<string>(
            'OPENAI_EMBEDDING_MODEL',
            'text-embedding-3-small',
          ),
          input: text,
        });
        const vector = response.data[0]?.embedding ?? this.mockEmbedding(text);
        this.writeCache(text, vector);
        return vector;
      } catch (error: any) {
        this.logger.error(`OpenAI embedding failed: ${error.message}`);
      }
    }

    return this.mockEmbedding(text);
  }

  /**
   * Embed a batch, sending only the texts that are not already cached.
   *
   * Re-indexing a corpus where most documents are unchanged is the common case
   * — on boot, or after editing one resource — so this usually reduces the call
   * to the handful of documents that actually changed.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results = new Array<number[] | null>(texts.length).fill(null);
    const missingIndices: number[] = [];

    texts.forEach((text, i) => {
      const cached = this.readCache(text);
      if (cached) results[i] = cached;
      else missingIndices.push(i);
    });

    if (missingIndices.length === 0) {
      this.logger.debug(`Embedding batch fully cached (${texts.length} texts, 0 API calls)`);
      return results as number[][];
    }

    if (missingIndices.length < texts.length) {
      this.logger.debug(
        `Embedding batch: ${missingIndices.length}/${texts.length} texts need the API ` +
          `(${texts.length - missingIndices.length} served from cache)`,
      );
    }

    const fresh = await this.embedBatchUncached(missingIndices.map((i) => texts[i]));
    missingIndices.forEach((originalIndex, k) => {
      const vector = fresh[k];
      results[originalIndex] = vector;
      this.writeCache(texts[originalIndex], vector);
    });

    return results as number[][];
  }

  private async embedBatchUncached(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    if (!this.isMockMode) {
      // 1. Try OpenAI if client is available
      if (this.client) {
        try {
          const response = await this.client.embeddings.create({
            model: this.config.get<string>(
              'OPENAI_EMBEDDING_MODEL',
              'text-embedding-3-small',
            ),
            input: texts,
          });
          return response.data.map((d) => d.embedding);
        } catch (error: any) {
          this.logger.warn(`OpenAI batch embedding failed: ${error.message}. Trying Gemini fallback...`);
        }
      }

      // 2. Try Gemini
      if (this.geminiApiKey) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${this.geminiApiKey}`;
          const requests = texts.map((t) => ({
            model: 'models/gemini-embedding-2',
            content: { parts: [{ text: t }] },
            outputDimensionality: 1536,
          }));
          const response = await axios.post(
            url,
            { requests },
            {
              headers: { 'Content-Type': 'application/json' },
            },
          );
          const embeddings = response.data?.embeddings;
          if (Array.isArray(embeddings)) {
            return embeddings.map((e: any) => {
              const vector = e.values;
              const processed = vector.slice(0, 1536);
              while (processed.length < 1536) {
                processed.push(0);
              }
              return processed;
            });
          }
        } catch (error: any) {
          const errMsg = error.response?.data?.error?.message || error.message;
          this.logger.warn(`Gemini batch embedding gemini-embedding-2 failed: ${errMsg}. Retrying with gemini-embedding-001...`);
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${this.geminiApiKey}`;
            const requests = texts.map((t) => ({
              model: 'models/gemini-embedding-001',
              content: { parts: [{ text: t }] },
            }));
            const response = await axios.post(
              url,
              { requests },
              {
                headers: { 'Content-Type': 'application/json' },
              },
            );
            const embeddings = response.data?.embeddings;
            if (Array.isArray(embeddings)) {
              return embeddings.map((e: any) => {
                const vector = e.values;
                const processed = vector.slice(0, 1536);
                while (processed.length < 1536) {
                  processed.push(0);
                }
                return processed;
              });
            }
          } catch (retryError: any) {
            const retryMsg = retryError.response?.data?.error?.message || retryError.message;
            this.logger.error(`Gemini batch embedding gemini-embedding-001 also failed: ${retryMsg}`);
            throw new Error(`Embedding failed. OpenAI and Gemini both failed. Gemini root: ${retryMsg}`);
          }
        }
      } else {
        throw new Error('No valid embedding client or API Key configured in production/live mode.');
      }
    }

    return texts.map((t) => this.mockEmbedding(t));
  }
}
