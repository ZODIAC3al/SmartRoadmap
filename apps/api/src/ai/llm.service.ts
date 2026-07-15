import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { createOpenAIClient } from './openai.client';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly isMockMode: boolean;
  private readonly client: OpenAI | null;

  constructor(private readonly config: ConfigService) {
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
    if (this.isMockMode || !this.client) return this.mockRoadmap(targetRole);

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.get<string>('OPENAI_MODEL_SMART', 'gpt-4o'),
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a curriculum designer. Reply with ONLY a JSON object of shape ' +
              '{title, totalEstimatedHours, modules:[{id,title,description,prerequisites[],' +
              'estimatedHours,topics[],difficulty,status,positionX,positionY}]}.',
          },
          {
            role: 'user',
            content: `Target role: "${targetRole}". Existing skills: ${skills.join(', ') || 'none'}.`,
          },
        ],
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
      if (!Array.isArray(parsed.modules) || parsed.modules.length === 0) {
        throw new Error('LLM returned a roadmap with no modules');
      }
      return parsed;
    } catch (error: any) {
      this.logger.error(`OpenAI roadmap generation failed: ${error.message}`);
      return this.mockRoadmap(targetRole); // graceful, terminating fallback
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
    if (this.isMockMode || !this.client) return null;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.get<string>('OPENAI_MODEL_FAST', 'gpt-4o-mini'),
        ...(options.json
          ? { response_format: { type: 'json_object' as const } }
          : {}),
        messages: [
          ...(options.system
            ? [{ role: 'system' as const, content: options.system }]
            : []),
          { role: 'user' as const, content: prompt },
        ],
      });
      return response.choices[0]?.message?.content?.trim() ?? null;
    } catch (error: any) {
      this.logger.error(`OpenAI completion failed: ${error.message}`);
      return null;
    }
  }

  async generateQuiz(
    topic: string,
    difficulty: string,
    count = 5,
  ): Promise<any[]> {
    if (this.isMockMode || !this.client)
      return this.mockQuiz(topic, difficulty, count);

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.get<string>('OPENAI_MODEL_FAST', 'gpt-4o-mini'),
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Reply with ONLY a JSON object {questions: [{id, question, options[], correctAnswer, explanation, difficulty}]}.',
          },
          {
            role: 'user',
            content: `Generate ${count} questions about "${topic}" at ${difficulty} level.`,
          },
        ],
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
      const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
      if (questions.length === 0) throw new Error('LLM returned no questions');
      return questions;
    } catch (error: any) {
      this.logger.error(`OpenAI quiz generation failed: ${error.message}`);
      return this.mockQuiz(topic, difficulty, count);
    }
  }
}
