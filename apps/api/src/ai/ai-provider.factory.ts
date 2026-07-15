import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider } from './ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { MockProvider } from './providers/mock.provider';

@Injectable()
export class AiProviderFactory {
  private readonly logger = new Logger(AiProviderFactory.name);
  private readonly providers: Map<string, AiProvider> = new Map();

  constructor(private readonly config: ConfigService) {
    const isMock = this.config.get<boolean>('MOCK_MODE') === true;

    // 1. OpenAI Setup
    const openAiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!isMock && openAiKey && !openAiKey.startsWith('sk-...')) {
      this.providers.set('openai', new OpenAIProvider(this.config));
    } else {
      this.logger.warn('OpenAI running in Mock Mode.');
      this.providers.set('openai', new MockProvider());
    }

    // 2. Gemini Setup
    const geminiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!isMock && geminiKey) {
      this.providers.set('gemini', new GeminiProvider(this.config));
    } else {
      this.logger.warn('Gemini running in Mock Mode.');
      this.providers.set('gemini', new MockProvider());
    }

    // 3. Groq Setup
    const groqKey = this.config.get<string>('GROQ_API_KEY');
    if (!isMock && groqKey) {
      this.providers.set('groq', new GroqProvider(this.config));
    } else {
      this.logger.warn('Groq running in Mock Mode.');
      this.providers.set('groq', new MockProvider());
    }

    // Default Mock provider
    this.providers.set('mock', new MockProvider());
  }

  getProvider(preferredName?: string): AiProvider {
    const name = preferredName?.toLowerCase();
    
    if (name && this.providers.has(name)) {
      return this.providers.get(name)!;
    }

    // Default fallback resolution path
    if (this.providers.has('openai') && !(this.providers.get('openai') instanceof MockProvider)) {
      return this.providers.get('openai')!;
    }
    if (this.providers.has('gemini') && !(this.providers.get('gemini') instanceof MockProvider)) {
      return this.providers.get('gemini')!;
    }
    if (this.providers.has('groq') && !(this.providers.get('groq') instanceof MockProvider)) {
      return this.providers.get('groq')!;
    }

    return this.providers.get('mock')!;
  }
}
