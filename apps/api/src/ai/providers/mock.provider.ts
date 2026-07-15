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
      return {
        title: `Complete Learning Journey`,
        totalEstimatedHours: 45,
        modules: [
          {
            id: 'mod-1',
            title: `Introduction Foundations`,
            description: `Core fundamentals, tools and environment setup.`,
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
            title: `Intermediate & Best Practices`,
            description: 'Core patterns, architecture, and clean code principles.',
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
            title: `Advanced & Deployment`,
            description: 'Testing, CI/CD, production bundling, scalability and performance.',
            prerequisites: ['mod-2'],
            estimatedHours: 20,
            topics: ['Unit & Integration Testing', 'Dockerization', 'Cloud Deployment'],
            difficulty: 'advanced',
            status: 'locked',
            positionX: 500,
            positionY: 150,
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
      'SUQzBAAAAAAAAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXAzdgBUWFhYAAAAEgAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHgAAA2NvbXBhdGlibGVfYnJhbmRzAG1wM2JtcDMydXA1AFRFTkM="';
    return Buffer.from(minimalMp3Base64, 'base64');
  }
}
