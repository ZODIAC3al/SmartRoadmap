import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiProvider } from '../ai-provider.interface';
import { createOpenAIClient } from '../openai.client';

export class OpenAIProvider implements AiProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const { client } = createOpenAIClient(config, this.logger);
    this.client = client;
  }

  async generateText(prompt: string, system?: string): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client is in mock mode');
    }
    const response = await this.client.chat.completions.create({
      model: this.config.get<string>('OPENAI_MODEL_FAST', 'gpt-4o-mini'),
      messages: [
        ...(system ? [{ role: 'system' as const, content: system }] : []),
        { role: 'user' as const, content: prompt },
      ],
    });
    return response.choices[0]?.message?.content?.trim() ?? '';
  }

  async generateJSON<T>(prompt: string, schemaDescription: string, system?: string): Promise<T> {
    if (!this.client) {
      throw new Error('OpenAI client is in mock mode');
    }
    const response = await this.client.chat.completions.create({
      model: this.config.get<string>('OPENAI_MODEL_FAST', 'gpt-4o-mini'),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${system || ''}\nReturn a JSON object matching this schema or structure: ${schemaDescription}`,
        },
        { role: 'user', content: prompt },
      ],
    });
    const content = response.choices[0]?.message?.content ?? '{}';
    return JSON.parse(content) as T;
  }

  async textToSpeech(text: string, voice = 'alloy'): Promise<Buffer> {
    if (!this.client) {
      throw new Error('OpenAI client is in mock mode');
    }
    const mp3 = await this.client.audio.speech.create({
      model: 'tts-1',
      voice: voice as any,
      input: text,
    });
    return Buffer.from(await mp3.arrayBuffer());
  }
}
