import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Roadmap } from '../../schemas/roadmap.schema';
import { LearningResource } from '../../schemas/learning-resource.schema';
import { RAGService, RESOURCES_COLLECTION } from '../../ai/rag.service';
import { IngestionService } from './ingestion.service';
@Injectable()
export class SearchService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(LearningResource.name)
    private readonly resourceModel: Model<LearningResource>,
    private readonly ragService: RAGService,
    private readonly ingestionService: IngestionService,
  ) { }

  async onApplicationBootstrap() {
    this.logger.log('Triggering PDF Document Ingestion Pipeline...');
    await this.ingestionService.processDocuments();
  }


  async hybridSearch(query: string, limit = 5): Promise<any[]> {
    if (!query) return [];

    // 1. Qdrant Semantic Search (uses embeddings)
    const semanticHits = await this.ragService.retrieveResources(query, limit);

    // 2. Database Keyword Search (Mongoose regex check to support exact matches / fallbacks)
    const dbRoadmaps = await this.roadmapModel
      .find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { targetRole: { $regex: query, $options: 'i' } },
        ],
      })
      .limit(limit)
      .exec();

    const dbResources = await this.resourceModel
      .find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
      .limit(limit)
      .exec();

    const keywordHits: any[] = [
      ...dbRoadmaps.map((r) => ({
        title: r.title,
        description: r.targetRole || 'Dynamic study roadmap',
        type: 'roadmap',
        url: `/roadmaps/${r._id}`,
        matchScore: 95,
      })),
      ...dbResources.map((r) => ({
        title: r.title,
        description: r.description || '',
        type: r.type || 'resource',
        url: r.url || '/resources',
        matchScore: 90,
      })),
    ];

    // 3. Combine, deduplicate, and sort the hits
    const combined = [...keywordHits, ...semanticHits];
    const seen = new Set<string>();
    const uniqueHits: any[] = [];

    for (const hit of combined) {
      const key = `${hit.type}-${hit.title}-${hit.url}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHits.push(hit);
      }
    }

    return uniqueHits
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, limit);
  }
}
