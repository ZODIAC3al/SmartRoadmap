import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbeddingService } from './embedding.service';
import * as crypto from 'crypto';

export const RESOURCES_COLLECTION = 'resources';
export const JOBS_COLLECTION = 'jobs';
const VECTOR_SIZE = 1536;

@Injectable()
export class RAGService implements OnModuleInit {
  private readonly logger = new Logger(RAGService.name);
  private readonly isMockMode: boolean;
  public readonly client: QdrantClient | null;

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
    filter?: any,
  ): Promise<any[]> {
    const vector = await this.embeddingService.embed(text);
    const results = await this.client!.search(collection, {
      vector,
      limit,
      filter,
      with_payload: true,
    });
    return results.map((r) => ({
      ...(r.payload as Record<string, unknown>),
      matchScore: Math.round((r.score ?? 0) * 100),
    }));
  }

  /**
   * Sentence Window Retrieval:
   * Retrieves specific focused leaf chunks along with surrounding sentence context
   * (windowBefore + targetChunk + windowAfter) for precise definitions, code snippets,
   * and targeted remedial explanations.
   */
  async sentenceWindowSearch(
    collection: string,
    query: string,
    limit = 5,
  ): Promise<any[]> {
    const filter = {
      must: [{ key: 'nodeType', match: { value: 'sentence' } }],
    };
    const hits = this.client
      ? await this.search(collection, query, limit, filter)
      : this.mockResources(query, limit);

    return hits.map((hit) => {
      const coreText = hit.text || hit.title || hit.content || '';
      const windowBefore = hit.windowBefore ? hit.windowBefore + ' ' : '';
      const windowAfter = hit.windowAfter ? ' ' + hit.windowAfter : '';
      return {
        ...hit,
        retrievalStrategy: 'sentence_window',
        contextWindow: `${windowBefore}${coreText}${windowAfter}`.trim(),
      };
    });
  }

  /**
   * Auto-Merging Retrieval:
   * Groups child hit chunks by parent document / section ID. If child hits meet
   * density threshold, auto-merges them into full hierarchical section content.
   */
  async autoMergingSearch(
    collection: string,
    query: string,
    limit = 5,
  ): Promise<any[]> {
    const filter = {
      must: [{ key: 'nodeType', match: { value: 'child_chunk' } }],
    };
    const hits = this.client
      ? await this.search(collection, query, limit * 2, filter)
      : this.mockResources(query, limit);

    // Group hits by parentId or title
    const parentGroups = new Map<string, any[]>();
    for (const hit of hits) {
      const parentId = hit.parentId || hit.company || hit.title || 'default';
      if (!parentGroups.has(parentId)) {
        parentGroups.set(parentId, []);
      }
      parentGroups.get(parentId)!.push(hit);
    }

    const mergedResults: any[] = [];
    for (const [parentId, childHits] of parentGroups.entries()) {
      // 50% threshold: since each parent has ~4 children, 2 hits means 50%.
      if (childHits.length >= 2) {
        let mergedContent = '';
        let mergedTitle = childHits[0].title || childHits[0].parentTitle || parentId;

        // Fetch the full parent chunk from Qdrant
        if (this.client) {
          try {
             const parentRes = await this.client.scroll(collection, {
               filter: {
                 must: [{ key: 'chunkId', match: { value: parentId } }]
               },
               limit: 1,
               with_payload: true,
             });
             if (parentRes.points && parentRes.points.length > 0) {
                const parentPayload = parentRes.points[0].payload as any;
                if (parentPayload.text) {
                   mergedContent = parentPayload.text;
                   mergedTitle = parentPayload.title || mergedTitle;
                }
             }
          } catch (e: any) {
             this.logger.error(`Failed to fetch parent chunk: ${e.message}`);
          }
        }

        if (!mergedContent) {
           mergedContent = childHits
            .map((c) => c.contextWindow || c.text || c.content || c.description || c.title)
            .join('\n\n');
        }

        mergedResults.push({
          ...childHits[0],
          isMerged: true,
          retrievalStrategy: 'auto_merging',
          title: mergedTitle,
          content: mergedContent,
          matchScore: Math.max(...childHits.map((c) => c.matchScore || 85)),
        });
      } else {
        mergedResults.push({
          ...childHits[0],
          isMerged: false,
          retrievalStrategy: 'auto_merging',
        });
      }
    }

    return mergedResults.slice(0, limit);
  }

  /** Unified RAG Context Retrieval */
  async retrieveContext(options: {
    domain: 'resources' | 'jobs';
    query: string;
    strategy?: 'sentence_window' | 'auto_merging';
    limit?: number;
  }): Promise<{ hits: any[]; formattedContext: string }> {
    const collection =
      options.domain === 'jobs' ? JOBS_COLLECTION : RESOURCES_COLLECTION;
    const strategy = options.strategy || 'sentence_window';
    const limit = options.limit || 5;

    let hits: any[];
    if (options.domain === 'jobs') {
      hits = this.client
        ? await this.search(collection, options.query, limit)
        : this.mockJobs([options.query], limit);
    } else if (strategy === 'auto_merging') {
      hits = await this.autoMergingSearch(collection, options.query, limit);
    } else {
      hits = await this.sentenceWindowSearch(collection, options.query, limit);
    }

    const formattedContext = this.formatRetrievedContext(hits, strategy);
    return { hits, formattedContext };
  }

  /** Grounded prompt formatter for LLM prompt builder */
  formatRetrievedContext(
    hits: any[],
    strategy: 'sentence_window' | 'auto_merging',
  ): string {
    if (!hits || hits.length === 0) return '';

    const lines = hits.map((hit, idx) => {
      const source = hit.title || hit.company || `Doc #${idx + 1}`;
      const body =
        hit.contextWindow || hit.content || hit.description || hit.text || JSON.stringify(hit);
      return `[Knowledge Source ${idx + 1}: ${source} (${strategy})]\n${body}`;
    });

    return `\n[Retrieved Grounded Knowledge Context (${strategy})]\n${lines.join('\n\n')}\n`;
  }

  async retrieveResources(topic: string, limit = 5): Promise<any[]> {
    if (!this.client) return this.mockResources(topic, limit);

    try {
      const hits = await this.search(RESOURCES_COLLECTION, topic, limit);
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
        points: docs.map((doc, i) => {
          let pointId = doc.id;
          if (typeof pointId === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pointId)) {
            const hash = crypto.createHash('md5').update(pointId).digest('hex');
            pointId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
          }
          return {
            id: pointId,
            vector: vectors[i],
            payload: { ...doc.payload, originalId: doc.id },
          };
        }),
      });
    } catch (error: any) {
      this.logger.error(
        `Qdrant upsert into "${collection}" failed: ${error.message}`,
      );
    }
  }
}

