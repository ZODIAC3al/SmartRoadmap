import { Logger } from '@nestjs/common';
import { AiProvider } from '../ai-provider.interface';

export class MockProvider implements AiProvider {
  private readonly logger = new Logger(MockProvider.name);

  async generateText(prompt: string, system?: string): Promise<string> {
    this.logger.log('MockProvider: generating text');
    return `Simulated AI text response for prompt: "${prompt.substring(0, 50)}..."`;
  }

  async generateJSON<T>(prompt: string, schemaDescription: string, system?: string): Promise<T> {
    this.logger.log(`MockProvider: generating JSON matching schema: ${schemaDescription}`);

    // Fallback template structures
    if (schemaDescription.includes('modules') || prompt.toLowerCase().includes('roadmap')) {
      const roleMatch =
        prompt.match(/targetRole[:\s"]+([^",\n]+)/i) ||
        prompt.match(/role[:\s"]+([^",\n]+)/i);
      const role = roleMatch ? roleMatch[1].trim() : 'Software Developer';

      return {
        title: `Complete Learning Journey for ${role}`,
        totalEstimatedHours: 85,
        modules: [
          {
            id: 'mod-1',
            title: `${role} Foundations`,
            description: `Core fundamentals, environment setup, and essential tools for ${role}.`,
            prerequisites: [],
            estimatedHours: 12,
            topics: ['Environment Setup', 'Core Concepts', 'Tooling & CLI', 'Hello World Project'],
            difficulty: 'beginner',
            status: 'in_progress',
            positionX: 560,
            positionY: 340,
          },
          {
            id: 'mod-2',
            title: 'Core Patterns & Architecture',
            description: 'Design patterns, clean code principles, and architectural best practices.',
            prerequisites: ['mod-1'],
            estimatedHours: 18,
            topics: ['Design Patterns', 'SOLID Principles', 'Clean Architecture', 'Code Review'],
            difficulty: 'intermediate',
            status: 'locked',
            positionX: 800,
            positionY: 190,
          },
          {
            id: 'mod-3',
            title: 'Data & State Management',
            description: 'Working with data flows, state patterns, and persistence layers.',
            prerequisites: ['mod-1'],
            estimatedHours: 15,
            topics: ['State Machines', 'Data Structures', 'Caching', 'Async Patterns'],
            difficulty: 'intermediate',
            status: 'locked',
            positionX: 800,
            positionY: 490,
          },
          {
            id: 'mod-4',
            title: 'Testing & Quality Assurance',
            description: 'Unit, integration, and end-to-end testing strategies for production code.',
            prerequisites: ['mod-2', 'mod-3'],
            estimatedHours: 20,
            topics: ['Unit Tests', 'Integration Tests', 'E2E Testing', 'TDD', 'CI/CD'],
            difficulty: 'advanced',
            status: 'locked',
            positionX: 1040,
            positionY: 290,
          },
          {
            id: 'mod-5',
            title: 'Deployment & Production',
            description: 'Containerisation, cloud deployment, monitoring, and scalability at scale.',
            prerequisites: ['mod-4'],
            estimatedHours: 20,
            topics: ['Docker', 'Kubernetes', 'Cloud Platforms', 'Observability', 'Scaling'],
            difficulty: 'advanced',
            status: 'locked',
            positionX: 1040,
            positionY: 440,
          },
        ],
      } as any as T;
    }

    if (prompt.toLowerCase().includes('quiz') || prompt.toLowerCase().includes('question')) {
      return Array.from({ length: 5 }).map((_, index) => ({
        id: `q-${index + 1}`,
        question: `What is a primary concept at this level?`,
        options: [
          `Option A: Optimizing runtime execution`,
          `Option B: Structuring state declarations`,
          `Option C: Implementing standardized interfaces`,
          `Option D: None of the above`,
        ],
        correctAnswer: `Option A: Optimizing runtime execution`,
        explanation: `Simulated explanation for simulated quiz.`,
        difficulty: 'medium',
      })) as any as T;
    }

    // Default empty fallback
    return {} as T;
  }

  async textToSpeech(text: string, voice?: string): Promise<Buffer> {
    this.logger.log(`MockProvider: converting text to speech: "${text.substring(0, 30)}..."`);
    // Return a valid minimal 1-second silence MP3 file buffer
    const minimalMp3Base64 =
      'SUQzBAAAAAAAAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXAzdgBUWFhYAAAAEgAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHgAAA2NvbXBhdGlibGVfYnJhbmRzAG1wM2JtcDMydXA1AFRFTkM=';
    return Buffer.from(minimalMp3Base64, 'base64');
  }
}
