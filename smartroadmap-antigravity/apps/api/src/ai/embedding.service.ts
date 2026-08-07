import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { createOpenAIClient } from './openai.client';
import axios from 'axios';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly isMockMode: boolean;
  private readonly client: OpenAI | null;
  private readonly geminiApiKey: string | null;

  constructor(private readonly config: ConfigService) {
    const { isMockMode, client } = createOpenAIClient(config, this.logger);
    this.isMockMode = isMockMode;
    this.client = client;
    this.geminiApiKey = config.get<string>('GEMINI_API_KEY') || null;
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
    if (!this.isMockMode && this.client) {
      try {
        const response = await this.client.embeddings.create({
          model: this.config.get<string>(
            'OPENAI_EMBEDDING_MODEL',
            'text-embedding-3-small',
          ),
          input: text,
        });
        return response.data[0]?.embedding ?? this.mockEmbedding(text);
      } catch (error: any) {
        this.logger.error(`OpenAI embedding failed: ${error.message}`);
      }
    }

    if (this.geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.geminiApiKey}`;
        const response = await axios.post(url, {
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] }
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
        const vector = response.data?.embedding?.values;
        if (Array.isArray(vector)) {
          const padded = [...vector];
          while (padded.length < 1536) {
            padded.push(0);
          }
          return padded;
        }
      } catch (error: any) {
        const errMsg = error.response?.data?.error?.message || error.message;
        this.logger.error(`Gemini embedding failed: ${errMsg}`);
      }
    }

    return this.mockEmbedding(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.isMockMode && this.client) {
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
        this.logger.error(`OpenAI batch embedding failed: ${error.message}`);
      }
    }

    if (this.geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${this.geminiApiKey}`;
        const requests = texts.map((t) => ({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: t }] }
        }));
        const response = await axios.post(url, { requests }, {
          headers: { 'Content-Type': 'application/json' }
        });
        const embeddings = response.data?.embeddings;
        if (Array.isArray(embeddings)) {
          return embeddings.map((e: any) => {
            const vector = e.values;
            const padded = [...vector];
            while (padded.length < 1536) {
              padded.push(0);
            }
            return padded;
          });
        }
      } catch (error: any) {
        const errMsg = error.response?.data?.error?.message || error.message;
        this.logger.error(`Gemini batch embedding failed: ${errMsg}`);
      }
    }

    return texts.map((t) => this.mockEmbedding(t));
  }
}
