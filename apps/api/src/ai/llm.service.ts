import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { createOpenAIClient } from './openai.client';
import { AiProviderFactory } from './ai-provider.factory';
import { AppCacheService } from '../common/cache/app-cache.service';
import { RAGService } from './rag.service';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly isMockMode: boolean;
  private readonly client: OpenAI | null;

  constructor(
    private readonly config: ConfigService,
    private readonly aiProviderFactory: AiProviderFactory,
    private readonly cache: AppCacheService,
    private readonly ragService: RAGService,
  ) {
    const { isMockMode, client } = createOpenAIClient(config, this.logger);
    this.isMockMode = isMockMode;
    this.client = client;
  }

  // ───────────────────────────── Mock builders ─────────────────────────────

  private mockRoadmap(targetRole: string) {
    return {
      title: `Complete Learning Journey for ${targetRole}`,
      totalEstimatedHours: 45,
      modules: [
        {
          id: 'mod-1',
          title: `Introduction to ${targetRole} Foundations`,
          description: `Core fundamentals, tools and environment setup for ${targetRole}.`,
          prerequisites: [],
          estimatedHours: 10,
          topics: [
            'Environment Setup',
            'Foundational Concepts',
            'Hello World Projects',
          ],
          difficulty: 'beginner',
          status: 'in_progress',
          positionX: 100,
          positionY: 150,
        },
        {
          id: 'mod-2',
          title: `Intermediate ${targetRole} & Best Practices`,
          description:
            'Core patterns, architecture, and clean code principles.',
          prerequisites: ['mod-1'],
          estimatedHours: 15,
          topics: [
            'Core Patterns',
            'Routing & Data Fetching',
            'State Management',
          ],
          difficulty: 'intermediate',
          status: 'locked',
          positionX: 300,
          positionY: 150,
        },
        {
          id: 'mod-3',
          title: `Advanced ${targetRole} & Deployment`,
          description:
            'Testing, CI/CD, production bundling, scalability and performance.',
          prerequisites: ['mod-2'],
          estimatedHours: 20,
          topics: [
            'Unit & Integration Testing',
            'Dockerization',
            'Cloud Deployment',
          ],
          difficulty: 'advanced',
          status: 'locked',
          positionX: 500,
          positionY: 150,
        },
      ],
    };
  }

  private mockQuiz(topic: string, difficulty: string, count: number) {
    return Array.from({ length: count }).map((_, index) => ({
      id: `q-${index + 1}`,
      question: `What is a primary concept of "${topic}" at a ${difficulty} level?`,
      options: [
        `Option A: Optimizing runtime execution of ${topic}`,
        `Option B: Structuring state declarations inside ${topic}`,
        `Option C: Implementing standardized interfaces for ${topic}`,
        `Option D: None of the above`,
      ],
      correctAnswer: `Option A: Optimizing runtime execution of ${topic}`,
      explanation: `Simulated explanation for ${topic} (${difficulty}).`,
      difficulty,
    }));
  }

  // ───────────────────────────── Public API ─────────────────────────────

  async generateRoadmap(
    targetRole: string,
    skills: string[] = [],
  ): Promise<any> {
    const sortedSkills = [...skills].sort().join(',');
    const cacheKey = `ai:roadmap:${this.cache.hashKey({ targetRole: targetRole.toLowerCase(), sortedSkills })}`;
    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(
        `[Cache Hit] Reusing cached roadmap for "${targetRole}"`,
      );
      return cached;
    }

    const providers = this.aiProviderFactory.getProvidersChain();

    for (const provider of providers) {
      if (provider.constructor.name === 'MockProvider') {
        const mock = this.mockRoadmap(targetRole);
        this.cache.set(cacheKey, mock, 3600 * 24); // 24h TTL
        return mock;
      }
      try {
        const prompt = `Design a comprehensive, professional, industry-grade learning roadmap for the target role: "${targetRole}". Existing developer skills: ${skills.length > 0 ? skills.join(', ') : 'None (starting from foundations)'}.`;
        const system =
          'You are a senior principal engineer and curriculum architect. ' +
          'Generate a rigorous, step-by-step career learning roadmap composed of 6 to 9 distinct, sequential modules progressing from foundational to intermediate and advanced mastery. ' +
          'Return ONLY a valid JSON object matching this schema: ' +
          '{\n' +
          '  "title": "Mastery Roadmap for [Role Name]",\n' +
          '  "totalEstimatedHours": 180,\n' +
          '  "modules": [\n' +
          '    {\n' +
          '      "id": "mod-1",\n' +
          '      "title": "Module Title",\n' +
          '      "description": "Clear 2-3 sentence technical description of core principles, tooling, and architectures taught.",\n' +
          '      "difficulty": "beginner", // must be "beginner", "intermediate", or "advanced"\n' +
          '      "estimatedHours": 15,\n' +
          '      "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],\n' +
          '      "prerequisites": [],\n' +
          '      "status": "in_progress", // "in_progress" for mod-1, "locked" for subsequent modules\n' +
          '      "positionX": 100,\n' +
          '      "positionY": 150\n' +
          '    }\n' +
          '  ]\n' +
          '}';

        const response = await provider.generateJSON<any>(
          prompt,
          'JSON object with title, totalEstimatedHours, and array of 6-9 modules',
          system,
        );
        if (Array.isArray(response.modules) && response.modules.length > 0) {
          // Assign sequential positions if missing or flat
          response.modules = response.modules.map((m: any, idx: number) => ({
            ...m,
            id: m.id || `mod-${idx + 1}`,
            status: idx === 0 ? 'in_progress' : (m.status || 'locked'),
            positionX: typeof m.positionX === 'number' ? m.positionX : 100 + idx * 220,
            positionY: typeof m.positionY === 'number' ? m.positionY : 150,
          }));
          this.cache.set(cacheKey, response, 3600 * 12); // 12h TTL
          return response;
        }
      } catch (error: any) {
        this.logger.debug(
          `Provider ${provider.constructor.name} unavailable for Roadmap (${error.message}). Trying next provider...`,
        );
      }
    }

    const fallback = this.mockRoadmap(targetRole);
    this.cache.set(cacheKey, fallback, 3600 * 24);
    return fallback;
  }

  /**
   * Generic single-shot completion used by CvService etc.
   * Returns null in mock mode or on failure, so callers can fall back locally.
   */
  async complete(
    prompt: string,
    options: { json?: boolean; system?: string } = {},
  ): Promise<string | null> {
    const cacheKey = `ai:complete:${this.cache.hashKey({ prompt, options })}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`[Cache Hit] Reusing cached completion`);
      return cached;
    }

    const providers = this.aiProviderFactory.getProvidersChain();

    for (const provider of providers) {
      if (provider.constructor.name === 'MockProvider') {
        return null;
      }
      try {
        let result: string | null = null;
        if (options.json) {
          const res = await provider.generateJSON<any>(
            prompt,
            'Valid JSON object',
            options.system,
          );
          result = JSON.stringify(res);
        } else {
          result = await provider.generateText(prompt, options.system);
        }

        if (result) {
          this.cache.set(cacheKey, result, 3600 * 6); // 6h TTL
          return result;
        }
      } catch (error: any) {
        this.logger.debug(
          `Provider ${provider.constructor.name} unavailable for Complete (${error.message}). Trying next provider...`,
        );
      }
    }

    return null;
  }

  async generateQuiz(
    topic: string,
    difficulty: string,
    count = 5,
  ): Promise<any[]> {
    const cacheKey = `ai:quiz:${this.cache.hashKey({ topic: topic.toLowerCase(), difficulty: difficulty.toLowerCase(), count })}`;
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`[Cache Hit] Reusing cached quiz for "${topic}"`);
      return cached;
    }

    const providers = this.aiProviderFactory.getProvidersChain();

    for (const provider of providers) {
      if (provider.constructor.name === 'MockProvider') {
        const mock = this.mockQuiz(topic, difficulty, count);
        this.cache.set(cacheKey, mock, 3600 * 24);
        return mock;
      }
      try {
        const prompt = `Generate ${count} questions about "${topic}" at ${difficulty} level.`;
        const system =
          'Reply with ONLY a JSON object {questions: [{id, question, options[], correctAnswer, explanation, difficulty}]}.';

        const response = await provider.generateJSON<{ questions: any[] }>(
          prompt,
          'JSON object with questions array containing id, question, options array, correctAnswer, explanation, and difficulty',
          system,
        );
        const questions = Array.isArray(response.questions)
          ? response.questions
          : [];
        if (questions.length > 0) {
          this.cache.set(cacheKey, questions, 3600 * 12);
          return questions;
        }
      } catch (error: any) {
        this.logger.debug(
          `Provider ${provider.constructor.name} unavailable for Quiz (${error.message}). Trying next provider...`,
        );
      }
    }

    const fallback = this.mockQuiz(topic, difficulty, count);
    this.cache.set(cacheKey, fallback, 3600 * 24);
    return fallback;
  }

  async generateRemedialNode(
    topicTitle: string,
    failPercentage: number,
  ): Promise<{ title: string; description: string }> {
    const cacheKey = `ai:remedial:${this.cache.hashKey({ topicTitle: topicTitle.toLowerCase(), failPercentage })}`;
    const cached = this.cache.get<{ title: string; description: string }>(
      cacheKey,
    );
    if (cached) {
      this.logger.debug(
        `[Cache Hit] Reusing cached remedial node for "${topicTitle}"`,
      );
      return cached;
    }

    const providers = this.aiProviderFactory.getProvidersChain();

    for (const provider of providers) {
      if (provider.constructor.name === 'MockProvider') {
        const mock = {
          title: `${topicTitle} Fundamentals (Remedial)`,
          description: `Targeted remedial review module generated due to ${failPercentage}% fail rate on ${topicTitle}.`,
        };
        this.cache.set(cacheKey, mock, 3600 * 24);
        return mock;
      }
      try {
        // Retrieve targeted remedial Sentence Window RAG context
        let ragContext = '';
        try {
          const { formattedContext } = await this.ragService.retrieveContext({
            domain: 'resources',
            query: topicTitle,
            strategy: 'sentence_window',
            limit: 3,
          });
          ragContext = formattedContext;
        } catch {
          // RAG optional fallback
        }

        const prompt = `Generate a targeted remedial sub-topic for a student struggling with "${topicTitle}" (Fail Rate: ${failPercentage}%).\n${ragContext}`;
        const system =
          'Reply with ONLY a JSON object of shape {"title": string, "description": string}. Use the provided RAG knowledge context to make the title and description specifically targeted at weak concepts.';

        const result = await provider.generateJSON<{
          title: string;
          description: string;
        }>(prompt, 'JSON object with title and description fields', system);
        if (result) {
          this.cache.set(cacheKey, result, 3600 * 12);
          return result;
        }
      } catch (error: any) {
        this.logger.debug(
          `Provider ${provider.constructor.name} unavailable for RemedialNode (${error.message}). Trying next provider...`,
        );
      }
    }

    const fallback = {
      title: `${topicTitle} Fundamentals (Remedial)`,
      description: `Targeted remedial review module generated due to ${failPercentage}% fail rate on ${topicTitle}.`,
    };
    this.cache.set(cacheKey, fallback, 3600 * 24);
    return fallback;
  }
}
