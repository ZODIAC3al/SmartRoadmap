import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { createOpenAIClient } from './openai.client';
import { AiProviderFactory } from './ai-provider.factory';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly isMockMode: boolean;
  private readonly client: OpenAI | null;

  constructor(
    private readonly config: ConfigService,
    private readonly aiProviderFactory: AiProviderFactory,
  ) {
    const { isMockMode, client } = createOpenAIClient(config, this.logger);
    this.isMockMode = isMockMode;
    this.client = client;
  }

  // ───────────────────────────── Mock builders ─────────────────────────────
  // Pure functions. Fallbacks call THESE, never the public method again —
  // the previous `catch { return this.generateRoadmap(...) }` was an infinite
  // recursion that crashed the process on the first OpenAI failure.

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
    const providers = this.aiProviderFactory.getProvidersChain();

    for (const provider of providers) {
      if (provider.constructor.name === 'MockProvider') {
        return this.mockRoadmap(targetRole);
      }
      try {
        const prompt = `Target role: "${targetRole}". Existing skills: ${skills.join(', ') || 'none'}.`;
        const system =
          'You are a curriculum designer. Reply with ONLY a JSON object of shape ' +
          '{title, totalEstimatedHours, modules:[{id,title,description,prerequisites[],' +
          'estimatedHours,topics[],difficulty,status,positionX,positionY}]}.';

        const response = await provider.generateJSON<any>(
          prompt,
          'JSON object with title, totalEstimatedHours, and modules array',
          system,
        );
        if (Array.isArray(response.modules) && response.modules.length > 0) {
          return response;
        }
      } catch (error: any) {
        this.logger.debug(
          `Provider ${provider.constructor.name} unavailable for Roadmap (${error.message}). Trying next provider...`,
        );
      }
    }
    }

    return this.mockRoadmap(targetRole);
  }

  /**
   * Generic single-shot completion used by CvService etc.
   * Returns null in mock mode or on failure, so callers can fall back locally
   * instead of each service re-implementing `require('openai')` by hand.
   */
  async complete(
    prompt: string,
    options: { json?: boolean; system?: string } = {},
  ): Promise<string | null> {
    const providers = this.aiProviderFactory.getProvidersChain();

    for (const provider of providers) {
      if (provider.constructor.name === 'MockProvider') {
        return null;
      }
      try {
        if (options.json) {
          const res = await provider.generateJSON<any>(
            prompt,
            'Valid JSON object',
            options.system,
          );
          return JSON.stringify(res);
        } else {
          return await provider.generateText(prompt, options.system);
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
    const providers = this.aiProviderFactory.getProvidersChain();

    for (const provider of providers) {
      if (provider.constructor.name === 'MockProvider') {
        return this.mockQuiz(topic, difficulty, count);
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
          return questions;
        }
      } catch (error: any) {
        this.logger.debug(
          `Provider ${provider.constructor.name} unavailable for Quiz (${error.message}). Trying next provider...`,
        );
      }
    }

    return this.mockQuiz(topic, difficulty, count);
  }

  async generateRemedialNode(
    topicTitle: string,
    failPercentage: number,
  ): Promise<{ title: string; description: string }> {
    const providers = this.aiProviderFactory.getProvidersChain();

    for (const provider of providers) {
      if (provider.constructor.name === 'MockProvider') {
        return {
          title: `${topicTitle} Fundamentals (Remedial)`,
          description: `Targeted remedial review module generated due to ${failPercentage}% fail rate on ${topicTitle}.`,
        };
      }
      try {
        const prompt = `Generate a targeted remedial sub-topic for a student struggling with "${topicTitle}" (Fail Rate: ${failPercentage}%).`;
        const system =
          'Reply with ONLY a JSON object of shape {"title": string, "description": string}.';

        return await provider.generateJSON<{
          title: string;
          description: string;
        }>(prompt, 'JSON object with title and description fields', system);
      } catch (error: any) {
        this.logger.debug(
          `Provider ${provider.constructor.name} unavailable for RemedialNode (${error.message}). Trying next provider...`,
        );
      }
    }

    return {
      title: `${topicTitle} Fundamentals (Remedial)`,
      description: `Targeted remedial review module generated due to ${failPercentage}% fail rate on ${topicTitle}.`,
    };
  }
}