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
    const provider = this.aiProviderFactory.getProvider();
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
      if (!Array.isArray(response.modules) || response.modules.length === 0) {
        throw new Error('LLM returned a roadmap with no modules');
      }
      return response;
    } catch (error: any) {
      this.logger.error(`Roadmap generation failed: ${error.message}`);
      return this.mockRoadmap(targetRole);
    }
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
    const provider = this.aiProviderFactory.getProvider();
    if (provider.constructor.name === 'MockProvider') {
      return null;
    }

    try {
      if (options.json) {
        const res = await provider.generateJSON<any>(prompt, 'Valid JSON object', options.system);
        return JSON.stringify(res);
      } else {
        return await provider.generateText(prompt, options.system);
      }
    } catch (error: any) {
      this.logger.error(`Completion failed: ${error.message}`);
      return null;
    }
  }

  async generateQuiz(
    topic: string,
    difficulty: string,
    count = 5,
  ): Promise<any[]> {
    const provider = this.aiProviderFactory.getProvider();
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
      const questions = Array.isArray(response.questions) ? response.questions : [];
      if (questions.length === 0) throw new Error('LLM returned no questions');
      return questions;
    } catch (error: any) {
      this.logger.error(`Quiz generation failed: ${error.message}`);
      return this.mockQuiz(topic, difficulty, count);
    }
  }
}
