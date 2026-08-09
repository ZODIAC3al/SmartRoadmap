import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbeddingService } from './embedding.service';

export const RESOURCES_COLLECTION = 'resources';
export const JOBS_COLLECTION = 'jobs';
const VECTOR_SIZE = 1536;

@Injectable()
export class RAGService implements OnModuleInit {
  private readonly logger = new Logger(RAGService.name);
  private readonly isMockMode: boolean;
  private readonly client: QdrantClient | null;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly config: ConfigService,
  ) {
    const url = this.config.get<string>('QDRANT_URL');
    const explicitMock = this.config.get<boolean>('MOCK_MODE') === true;

    this.isMockMode = explicitMock || !url;
    this.client = this.isMockMode
      ? null
      : new QdrantClient({
          url: url!,
          apiKey: this.config.get<string>('QDRANT_API_KEY'),
        });

    if (this.isMockMode) {
      this.logger.warn('Qdrant is not configured — RAG runs in MOCK mode.');
    }
  }

  /** Create collections on boot so the first upsert doesn't 404. */
  async onModuleInit(): Promise<void> {
    if (!this.client) return;
    for (const name of [RESOURCES_COLLECTION, JOBS_COLLECTION]) {
      try {
        const { collections } = await this.client.getCollections();
        if (collections.some((c) => c.name === name)) continue;
        await this.client.createCollection(name, {
          vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
        });
        this.logger.log(`Created Qdrant collection "${name}"`);
      } catch (error: any) {
        this.logger.error(
          `Could not ensure Qdrant collection "${name}": ${error.message}`,
        );
      }
    }
  }

  private mockResources(topic: string, limit: number) {
    const slug = topic.toLowerCase().replace(/\s+/g, '-');
    return [
      {
        title: `Comprehensive Guide to ${topic} for Beginners`,
        url: `https://example.com/resources/${slug}-guide`,
        type: 'article',
        moduleTopic: topic,
        difficulty: 'beginner',
        language: 'en',
      },
      {
        title: `Mastering ${topic} — Advanced Concepts & Projects`,
        url: `https://example.com/resources/${slug}-mastery`,
        type: 'video',
        moduleTopic: topic,
        difficulty: 'advanced',
        language: 'en',
      },
      {
        title: `${topic} Hands-on Build Challenge`,
        url: `https://example.com/resources/${slug}-project`,
        type: 'project',
        moduleTopic: topic,
        difficulty: 'intermediate',
        language: 'en',
      },
    ].slice(0, limit);
  }

  private mockJobs(skills: string[], limit: number) {
    return [
      {
        title: `Full Stack Engineer (${skills[0] ?? 'Web'})`,
        company: 'Developia Systems',
        location: 'Cairo',
        country: 'eg',
        requiredSkills: skills.slice(0, 3),
        salaryMin: 30000,
        salaryMax: 45000,
        remote: true,
        matchScore: 92,
      },
      {
        title: `Junior Developer — ${skills[1] ?? skills[0] ?? 'Backend'} Focus`,
        company: 'Smart Tech Solutions',
        location: 'New Cairo',
        country: 'eg',
        requiredSkills: skills,
        salaryMin: 15000,
        salaryMax: 22000,
        remote: false,
        matchScore: 85,
      },
    ].slice(0, limit);
  }

  private async search(
    collection: string,
    text: string,
    limit: number,
  ): Promise<any[]> {
    const vector = await this.embeddingService.embed(text);
    const results = await this.client!.search(collection, {
      vector,
      limit,
      with_payload: true,
    });
    return results.map((r) => ({
      ...(r.payload as Record<string, unknown>),
      matchScore: Math.round((r.score ?? 0) * 100),
    }));
  }

  async retrieveResources(topic: string, limit = 5): Promise<any[]> {
    if (!this.client) return this.mockResources(topic, limit);

    try {
      const hits = await this.search(RESOURCES_COLLECTION, topic, limit);
      // Empty index is a valid state — fall back to curated mocks, not to a retry.
      return hits.length ? hits : this.mockResources(topic, limit);
    } catch (error: any) {
      this.logger.error(`Qdrant resource search failed: ${error.message}`);
      return this.mockResources(topic, limit);
    }
  }

  async retrieveJobs(skills: string[], limit = 5): Promise<any[]> {
    if (!this.client) return this.mockJobs(skills, limit);

    try {
      const hits = await this.search(JOBS_COLLECTION, skills.join(', '), limit);
      return hits.length ? hits : this.mockJobs(skills, limit);
    } catch (error: any) {
      this.logger.error(`Qdrant job search failed: ${error.message}`);
      return this.mockJobs(skills, limit);
    }
  }

  /** Index documents so the search above has something to find. */
  async upsert(
    collection: string,
    docs: Array<{
      id: string | number;
      text: string;
      payload: Record<string, unknown>;
    }>,
  ): Promise<void> {
    if (!this.client || docs.length === 0) return;

    try {
      const vectors = await this.embeddingService.embedBatch(
        docs.map((d) => d.text),
      );
      await this.client.upsert(collection, {
        wait: true,
        points: docs.map((doc, i) => ({
          id: doc.id,
          vector: vectors[i],
          payload: doc.payload,
        })),
      });
    } catch (error: any) {
      this.logger.error(
        `Qdrant upsert into "${collection}" failed: ${error.message}`,
      );
    }
  }
}
