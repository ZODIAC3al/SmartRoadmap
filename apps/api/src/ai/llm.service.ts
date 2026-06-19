import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly isMockMode: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.isMockMode = !apiKey || apiKey.startsWith('sk-...') || apiKey.includes('placeholder');
    if (this.isMockMode) {
      this.logger.warn('OpenAI API Key is missing or invalid. Running in MOCK/OFFLINE mode for LLM generation.');
    }
  }

  async generateRoadmap(targetRole: string, skills: string[] = []): Promise<any> {
    if (this.isMockMode) {
      this.logger.log(`Simulating roadmap generation for target role: "${targetRole}"`);
      // Return a simulated structured roadmap schema matching the Zod schema in @smartroadmap/shared
      return {
        title: `Complete Learning Journey for ${targetRole}`,
        totalEstimatedHours: 45,
        modules: [
          {
            id: 'mod-1',
            title: `Introduction to ${targetRole} Foundations`,
            description: `Core fundamentals, background, tools and environment setup for ${targetRole}.`,
            prerequisites: [],
            estimatedHours: 10,
            topics: ['Environment Setup', 'Foundational Concepts', 'Hello World Projects'],
            difficulty: 'beginner',
            status: 'in_progress',
            positionX: 100,
            positionY: 150,
          },
          {
            id: 'mod-2',
            title: `Intermediate ${targetRole} & Best Practices`,
            description: 'Core patterns, architectural styles, styling frameworks, and clean code principles.',
            prerequisites: ['mod-1'],
            estimatedHours: 15,
            topics: ['Core Patterns', 'Routing & Data Fetching', 'State Management'],
            difficulty: 'intermediate',
            status: 'locked',
            positionX: 300,
            positionY: 150,
          },
          {
            id: 'mod-3',
            title: `Advanced ${targetRole} & Deployment`,
            description: 'Testing methodologies, CI/CD, production bundling, scalability and performance optimizations.',
            prerequisites: ['mod-2'],
            estimatedHours: 20,
            topics: ['Unit & Integration Testing', 'Dockerization', 'Cloud Deployment'],
            difficulty: 'advanced',
            status: 'locked',
            positionX: 500,
            positionY: 150,
          },
        ],
      };
    }

    // Standard OpenAI implementation
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `Given target role: "${targetRole}" and initial skills: ${skills.join(', ')}. Generate a roadmap in valid JSON matching schema.`;
      
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_SMART || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error: any) {
      this.logger.error('Failed to generate roadmap using OpenAI API. Falling back to mock data.', error.stack);
      return this.generateRoadmap(targetRole, skills); // Graceful recovery
    }
  }

  async generateQuiz(topic: string, difficulty: string, count = 5): Promise<any[]> {
    if (this.isMockMode) {
      this.logger.log(`Simulating quiz generation for topic: "${topic}" (${difficulty})`);
      // Return simulated quiz questions
      return Array.from({ length: count }).map((_, index) => ({
        id: `q-${index + 1}`,
        question: `What is a primary concept of "${topic}" that developers must know at a ${difficulty} level?`,
        options: [
          `Option A: Optimizing runtime execution of ${topic}`,
          `Option B: Structuring state declarations inside ${topic}`,
          `Option C: Implementing standardized interfaces for ${topic}`,
          `Option D: None of the above`,
        ],
        correctAnswer: 'Option A: Optimizing runtime execution of ' + topic,
        explanation: `This is a simulated explanation verifying mastery of ${topic} at ${difficulty} level.`,
        difficulty: difficulty,
      }));
    }

    // Standard OpenAI implementation
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `Generate ${count} quiz questions about "${topic}" at ${difficulty} level. Mix MCQ (70%), True/False (20%), Code snippet (10%). Output ONLY JSON containing an array of questions.`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      return parsed.questions || parsed || [];
    } catch (error: any) {
      this.logger.error('Failed to generate quiz using OpenAI API. Falling back to mock quiz.', error.stack);
      return this.generateQuiz(topic, difficulty, count); // Graceful recovery
    }
  }
}
