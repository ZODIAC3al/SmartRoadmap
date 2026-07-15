import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { createOpenAIClient } from './openai.client';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly isMockMode: boolean;
  private readonly client: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const { isMockMode, client } = createOpenAIClient(config, this.logger);
    this.isMockMode = isMockMode;
    this.client = client;
  }

  /** Deterministic pseudo-embedding so mock results are stable across calls. */
  private mockEmbedding(text: string): number[] {
    let seed = 0;
    for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) % 2 ** 31;

    const vector = Array.from({ length: 1536 }, () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31 - 0.5;
    });

    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map((v) => v / magnitude);
  }

  async embed(text: string): Promise<number[]> {
    if (this.isMockMode || !this.client) return this.mockEmbedding(text);

    try {
      const response = await this.client.embeddings.create({
        model: this.config.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
        input: text,
      });
      return response.data[0]?.embedding ?? this.mockEmbedding(text);
    } catch (error: any) {
      // Previously: `return this.embed(text)` → infinite recursion.
      this.logger.error(`OpenAI embedding failed: ${error.message}`);
      return this.mockEmbedding(text);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (this.isMockMode || !this.client) return texts.map((t) => this.mockEmbedding(t));

    try {
      // One batched request instead of N sequential ones.
      const response = await this.client.embeddings.create({
        model: this.config.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
        input: texts,
      });
      return response.data.map((d) => d.embedding);
    } catch (error: any) {
      this.logger.error(`OpenAI batch embedding failed: ${error.message}`);
      return texts.map((t) => this.mockEmbedding(t));
    }
  }
}
