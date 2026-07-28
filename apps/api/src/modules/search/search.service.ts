import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Roadmap } from '../../schemas/roadmap.schema';
import { LearningResource } from '../../schemas/learning-resource.schema';
import { RAGService, RESOURCES_COLLECTION } from '../../ai/rag.service';

const STATIC_FAQS = [
  { id: 'faq-1', title: 'How does SmartRoadmap generate roadmaps?', text: 'SmartRoadmap uses advanced Gemini Generative AI to design a fully customized roadmap based on your goals, current skills, and career level.', type: 'faq', url: '/roadmaps' },
  { id: 'faq-2', title: 'Can I change my learning roadmap later?', text: 'Yes, you can edit, extend, or add missing skills to your roadmap at any time from your roadmap details dashboard page.', type: 'faq', url: '/roadmaps' },
  { id: 'faq-3', title: 'How do I schedule a session with a mentor?', text: 'Go to the Mentors page, search for a mentor matching your target skills, click Book Session, choose a timing slot, and submit.', type: 'faq', url: '/mentors' },
  { id: 'faq-4', title: 'What is the community space for?', text: 'Community spaces are topic-based forums where you can post questions, share code resources, and converse with other learners and professionals.', type: 'faq', url: '/community' }
];

const STATIC_DOCUMENTATION = [
  { id: 'doc-1', title: 'SmartRoadmap REST API Authentication Guide', text: 'To authenticate requests, include Bearer JWT tokens in the Authorization header. Retrieve tokens via POST /auth/login.', type: 'documentation', url: '/resources' },
  { id: 'doc-2', title: 'Mentorship Guidelines & Code of Conduct', text: 'All mentors and learners must respect scheduled bookings. Cancellations must be made at least 24 hours prior to session start.', type: 'documentation', url: '/resources' }
];

const STATIC_COURSES = [
  { id: 'course-1', title: 'NestJS Framework Masterclass: Advanced Web Apps', text: 'Learn NestJS dependency injection, custom filters, middleware, mongoose schemas, and microservice architectures.', type: 'course', url: '/resources' },
  { id: 'course-2', title: 'NextJS 15 App Router and TailwindCSS styling', text: 'A comprehensive frontend masterclass explaining server components, client components, routing, and glassmorphic designs.', type: 'course', url: '/resources' }
];

@Injectable()
export class SearchService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(LearningResource.name) private readonly resourceModel: Model<LearningResource>,
    private readonly ragService: RAGService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Indexing static FAQs, documentation, and courses into Qdrant...');
    try {
      const docs = [
        ...STATIC_FAQS.map((item) => ({
          id: item.id,
          text: `${item.title} ${item.text}`,
          payload: { ...item, description: item.text },
        })),
        ...STATIC_DOCUMENTATION.map((item) => ({
          id: item.id,
          text: `${item.title} ${item.text}`,
          payload: { ...item, description: item.text },
        })),
        ...STATIC_COURSES.map((item) => ({
          id: item.id,
          text: `${item.title} ${item.text}`,
          payload: { ...item, description: item.text },
        })),
      ];

      await this.ragService.upsert(RESOURCES_COLLECTION, docs);
      this.logger.log(`Successfully indexed ${docs.length} static search resources.`);
    } catch (err: any) {
      this.logger.error(`Failed to index static search resources: ${err.message}`);
    }
  }

  async hybridSearch(query: string, limit = 5): Promise<any[]> {
    if (!query) return [];

    // 1. Qdrant Semantic Search (uses embeddings)
    const semanticHits = await this.ragService.retrieveResources(query, limit);

    // 2. Database Keyword Search (Mongoose regex check to support exact matches / fallbacks)
    const dbRoadmaps = await this.roadmapModel.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { targetRole: { $regex: query, $options: 'i' } },
      ],
    }).limit(limit).exec();

    const dbResources = await this.resourceModel.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    }).limit(limit).exec();

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
