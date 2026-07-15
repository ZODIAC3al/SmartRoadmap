import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider } from '../ai-provider.interface';

export class GroqProvider implements AiProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GROQ_API_KEY') || '';
    this.model = this.config.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile';
  }

  async generateText(prompt: string, system?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const body = {
      model: this.model,
      messages: [
        ...(system ? [{ role: 'system' as const, content: system }] : []),
        { role: 'user' as const, content: prompt },
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Groq API error: ${res.statusText} - ${errorText}`);
    }

    const data: any = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? '';
  }

  async generateJSON<T>(prompt: string, schemaDescription: string, system?: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const body = {
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${system || ''}\nYou MUST return a JSON object matching this schema: ${schemaDescription}`,
        },
        { role: 'user', content: prompt },
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Groq API JSON error: ${res.statusText} - ${errorText}`);
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    return JSON.parse(content) as T;
  }

  async textToSpeech(text: string, voice?: string): Promise<Buffer> {
    this.logger.warn('Groq does not natively support TTS. Redirecting to mock audio buffer fallback.');
    const minimalMp3Base64 = 
      'SUQzBAAAAAAAAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXAzdgBUWFhYAAAAEgAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHgAAA2NvbXBhdGlibGVfYnJhbmRzAG1wM2JtcDMydXA1AFRFTkM="';
    return Buffer.from(minimalMp3Base64, 'base64');
  }
}
