import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);
  private readonly isMockMode: boolean;

  constructor(private readonly embeddingService: EmbeddingService) {
    const qdrantUrl = process.env.QDRANT_URL;
    const qdrantKey = process.env.QDRANT_API_KEY;
    this.isMockMode = !qdrantUrl || qdrantUrl.includes('placeholder') || !qdrantKey;
    if (this.isMockMode) {
      this.logger.warn('Qdrant settings are missing. Running in MOCK/OFFLINE mode for RAG searches.');
    }
  }

  async retrieveResources(topic: string, limit = 5): Promise<any[]> {
    if (this.isMockMode) {
      this.logger.log(`Simulating resource retrieval for topic: "${topic}"`);
      // Return mock learning resources based on keywords
      return [
        {
          title: `Comprehensive Guide to ${topic} for Beginners`,
          url: `https://example.com/resources/${topic.toLowerCase().replace(/\s+/g, '-')}-guide`,
          type: 'article',
          moduleTopic: topic,
          difficulty: 'beginner',
          language: 'en',
        },
        {
          title: `Mastering ${topic} - Advanced Concepts & Projects`,
          url: `https://example.com/resources/${topic.toLowerCase().replace(/\s+/g, '-')}-mastery`,
          type: 'video',
          moduleTopic: topic,
          difficulty: 'advanced',
          language: 'en',
        },
        {
          title: `${topic} Hands-on Build Challenge`,
          url: `https://example.com/resources/${topic.toLowerCase().replace(/\s+/g, '-')}-project`,
          type: 'project',
          moduleTopic: topic,
          difficulty: 'intermediate',
          language: 'en',
        },
      ].slice(0, limit);
    }

    try {
      const queryVector = await this.embeddingService.embed(topic);
      // Actual Qdrant REST client query would go here
      // For now, mock search response mimicking Qdrant return payload:
      return [];
    } catch (error: any) {
      this.logger.error('Failed querying Qdrant search. Falling back to local filter.', error.stack);
      return this.retrieveResources(topic, limit);
    }
  }

  async retrieveJobs(skills: string[], limit = 5): Promise<any[]> {
    if (this.isMockMode) {
      this.logger.log(`Simulating job matchmaking for skills: ${skills.join(', ')}`);
      // Return mock matched jobs
      return [
        {
          title: `Full Stack Engineer (${skills[0] || 'Web'})`,
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
          title: `Junior Developer - ${skills[1] || skills[0] || 'Backend'} Focus`,
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

    return [];
  }
}
