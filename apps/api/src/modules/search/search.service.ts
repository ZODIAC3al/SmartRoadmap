import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Roadmap } from '../../schemas/roadmap.schema';
import { LearningResource } from '../../schemas/learning-resource.schema';
import { RAGService, RESOURCES_COLLECTION } from '../../ai/rag.service';

const STATIC_FAQS = [
  {
    id: 'faq-1',
    title: 'How does SmartRoadmap generate roadmaps?',
    text: 'SmartRoadmap uses Gemini Generative AI to create a personalized learning roadmap based on the learner goals, current skills, career level, and target career path.',
    type: 'faq',
    url: '/roadmaps',
  },
  {
    id: 'faq-2',
    title: 'Can I change my learning roadmap later?',
    text: 'Yes. Learners can edit their roadmap, extend it, or add missing skills from the roadmap details dashboard.',
    type: 'faq',
    url: '/roadmaps',
  },
  {
    id: 'faq-3',
    title: 'How do I schedule a session with a mentor?',
    text: 'Open the Mentors page, search for a mentor based on your target skills, open the mentor profile, click Book Session, select an available time slot, and confirm the booking.',
    type: 'faq',
    url: '/mentors',
  },
  {
    id: 'faq-4',
    title: 'What is the community space for?',
    text: 'Community spaces are topic-based forums where learners and professionals can ask questions, share code, exchange resources, and discuss technical topics.',
    type: 'faq',
    url: '/community',
  },
  {
    id: 'faq-5',
    title: 'How can I track my roadmap progress?',
    text: 'Learners can open their roadmap dashboard to view completed modules, remaining skills, progress percentage, and upcoming learning activities.',
    type: 'faq',
    url: '/roadmaps',
  },
  {
    id: 'faq-6',
    title: 'How do I find a course?',
    text: 'Open the Resources page and search for a technology, skill, or topic. SmartRoadmap displays relevant courses and learning resources.',
    type: 'faq',
    url: '/resources',
  },
  {
    id: 'faq-7',
    title: 'How can I find a mentor?',
    text: 'Go to the Mentors page and search or filter mentors by their skills and specialization. You can view their profile and available sessions before booking.',
    type: 'faq',
    url: '/mentors',
  },
  {
    id: 'faq-8',
    title: 'How do I search for jobs?',
    text: 'Open the Jobs page and search for positions using job titles, technologies, skills, or career-related keywords.',
    type: 'faq',
    url: '/jobs',
  },
  {
    id: 'faq-9',
    title: 'Can I update my skills?',
    text: 'Yes. Learners can update their skills from their profile. The updated skills can be used when generating or modifying a learning roadmap.',
    type: 'faq',
    url: '/profile',
  },
  {
    id: 'faq-10',
    title: 'What is Study Buddy AI?',
    text: 'Study Buddy AI is the SmartRoadmap chatbot that helps learners understand courses, projects, programming concepts, career topics, and platform features using relevant platform knowledge.',
    type: 'faq',
    url: '/chatbot',
  },
  {
    id: 'faq-11',
    title: 'How can I cancel a mentor session?',
    text: 'Open your scheduled mentoring sessions and select the session you want to cancel. Mentorship cancellations should be made according to the platform cancellation policy.',
    type: 'faq',
    url: '/mentors',
  },
  {
    id: 'faq-12',
    title: 'What are roadmap modules?',
    text: 'Roadmap modules are organized learning steps containing skills, topics, courses, or resources that help learners progress toward their target career.',
    type: 'faq',
    url: '/roadmaps',
  },
  {
    id: 'faq-13',
    title: 'What score do I need to pass an exam?',
    text: 'The passing score is 70 percent. You need to answer at least 70 percent of the total questions correctly to pass the exam.',
    type: 'faq',
    url: '/resources',
  },
  {
    id: 'faq-14',
    title: 'How many correct answers do I need to get a 70 percent score?',
    text: 'To get a passing score of 70 percent, multiply the total number of exam questions by 0.70. For example, you need 7 correct answers out of 10, 14 out of 20, 21 out of 30, 35 out of 50, or 70 out of 100.',
    type: 'faq',
    url: '/resources',
  },
  {
    id: 'faq-15',
    title: 'How is the exam score calculated?',
    text: 'The exam score is calculated by dividing the number of correct answers by the total number of questions and multiplying the result by 100. A score of 70 percent or higher is considered a passing score.',
    type: 'faq',
    url: '/resources',
  },
];

const STATIC_DOCUMENTATION = [
  {
    id: 'doc-1',
    title: 'SmartRoadmap REST API Authentication Guide',
    text: 'To authenticate requests, include Bearer JWT tokens in the Authorization header. Retrieve tokens via POST /auth/login.',
    type: 'documentation',
    url: '/resources',
  },
  {
    id: 'doc-2',
    title: 'Mentorship Guidelines & Code of Conduct',
    text: 'All mentors and learners must respect scheduled bookings. Cancellations must be made at least 24 hours prior to session start.',
    type: 'documentation',
    url: '/resources',
  },
];



@Injectable()
export class SearchService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(LearningResource.name)
    private readonly resourceModel: Model<LearningResource>,
    private readonly ragService: RAGService,
  ) { }

  async onApplicationBootstrap() {
    this.logger.log(
      'Indexing static FAQs, documentation, and courses into Qdrant...',
    );
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
      ];

      await this.ragService.upsert(RESOURCES_COLLECTION, docs);
      this.logger.log(
        `Successfully indexed ${docs.length} static search resources.`,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to index static search resources: ${err.message}`,
      );
    }
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
