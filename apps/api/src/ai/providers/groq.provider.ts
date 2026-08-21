import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider } from '../ai-provider.interface';

export class GroqProvider implements AiProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = (this.config.get<string>('GROQ_API_KEY') || '').trim();
    this.model =
      (this.config.get<string>('GROQ_MODEL') || 'openai/gpt-oss-120b').trim();
  }

  async generateText(prompt: string, system?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const modelsToTry = Array.from(
      new Set([
        this.model,
        'openai/gpt-oss-120b',
        'qwen/qwen3.6-27b',
        'groq/compound',
        'openai/gpt-oss-20b',
      ]),
    );
    let lastError: Error | null = null;

    for (const m of modelsToTry) {
      try {
        const url = 'https://api.groq.com/openai/v1/chat/completions';
        const body = {
          model: m,
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
          throw new Error(`Groq API error (${m}): ${res.statusText} - ${errorText}`);
        }

        const data: any = await res.json();
        return data.choices?.[0]?.message?.content?.trim() ?? '';
      } catch (err: any) {
        lastError = err;
        this.logger.debug(
          `Groq model ${m} unavailable (${err.message}). Trying next fallback...`,
        );
      }
    }

    throw lastError || new Error('All Groq models failed');
  }

  async generateJSON<T>(
    prompt: string,
    schemaDescription: string,
    system?: string,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const modelsToTry = Array.from(
      new Set([
        this.model,
        'openai/gpt-oss-120b',
        'qwen/qwen3.6-27b',
        'groq/compound',
        'openai/gpt-oss-20b',
      ]),
    );
    let lastError: Error | null = null;

    for (const m of modelsToTry) {
      try {
        const url = 'https://api.groq.com/openai/v1/chat/completions';
        const body = {
          model: m,
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
          throw new Error(`Groq API JSON error (${m}): ${res.statusText} - ${errorText}`);
        }

        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content ?? '{}';
        return JSON.parse(content) as T;
      } catch (err: any) {
        lastError = err;
        this.logger.debug(
          `Groq JSON model ${m} unavailable (${err.message}). Trying next fallback...`,
        );
      }
    }

    throw lastError || new Error('All Groq JSON models failed');
  }

  async textToSpeech(text: string, voice?: string): Promise<Buffer> {
    this.logger.warn(
      'Groq does not natively support TTS. Redirecting to mock audio buffer fallback.',
    );
    const minimalMp3Base64 =
      'SUQzBAAAAAAAAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXAzdgBUWFhYAAAAEgAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHgAAA2NvbXBhdGlibGVfYnJhbmRzAG1wM2JtcDMydXA1AFRFTkM="';
    return Buffer.from(minimalMp3Base64, 'base64');
  }
}
