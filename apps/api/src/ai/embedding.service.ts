import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly isMockMode: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.isMockMode = !apiKey || apiKey.startsWith('sk-...') || apiKey.includes('placeholder');
    if (this.isMockMode) {
      this.logger.warn('OpenAI API Key is missing. Running in MOCK/OFFLINE mode for text embeddings.');
    }
  }

  async embed(text: string): Promise<number[]> {
    if (this.isMockMode) {
      // Return a simulated 1536-dimensional unit vector
      const vector = Array.from({ length: 1536 }, () => Math.random() - 0.5);
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      return vector.map(val => val / (magnitude || 1));
    }

    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: text,
      });
      return response.data[0]?.embedding || [];
    } catch (error: any) {
      this.logger.error('Failed to retrieve embeddings from OpenAI. Falling back to mock vector.', error.stack);
      return this.embed(text);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embed(text)));
  }
}
