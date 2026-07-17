import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider } from '../ai-provider.interface';

/**
 * HuggingFaceProvider
 * ────────────────────
 * Uses HF's OpenAI-compatible "router" chat-completions endpoint
 * (https://router.huggingface.co/v1/chat/completions), which lets you pick
 * any supported serverless model behind a single, familiar request shape.
 */
export class HuggingFaceProvider implements AiProvider {
  private readonly logger = new Logger(HuggingFaceProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly ttsModel: string;
  private readonly baseUrl = 'https://router.huggingface.co/v1/chat/completions';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('HF_TOKEN') || '';
    this.model = this.config.get<string>('HF_MODEL') || 'meta-llama/Llama-3.1-8B-Instruct';
    this.ttsModel = this.config.get<string>('HF_TTS_MODEL') || 'espnet/kan-bayashi_ljspeech_vits';
  }

  async generateText(prompt: string, system?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('HF_TOKEN is not configured');
    }

    const body = {
      model: this.model,
      messages: [
        ...(system ? [{ role: 'system' as const, content: system }] : []),
        { role: 'user' as const, content: prompt },
      ],
    };

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HuggingFace router error: ${res.statusText} - ${errorText}`);
    }

    const data: any = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? '';
  }

  async generateJSON<T>(prompt: string, schemaDescription: string, system?: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('HF_TOKEN is not configured');
    }

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            `${system || ''}\nYou MUST return a single JSON object and nothing else. ` +
            `Schema requirements: ${schemaDescription}`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    };

    let res: Response;
    try {
      res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(`HuggingFace router request failed: ${(err as Error).message}`);
    }

    if (!res.ok) {
      // Retry once without response_format in case the model doesn't support it.
      const { response_format, ...bodyWithoutFormat } = body as any;
      const retryRes = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(bodyWithoutFormat),
      });
      if (!retryRes.ok) {
        const errorText = await retryRes.text();
        throw new Error(`HuggingFace router JSON error: ${retryRes.statusText} - ${errorText}`);
      }
      res = retryRes;
    }

    const data: any = await res.json();
    const raw: string = data.choices?.[0]?.message?.content ?? '{}';
    // Strip markdown fences some models add despite instructions.
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as T;
  }

  async textToSpeech(text: string, voice?: string): Promise<Buffer> {
    if (!this.apiKey) {
      this.logger.warn('HF_TOKEN not configured — returning mock audio buffer.');
    } else {
      try {
        const res = await fetch(
          `https://api-inference.huggingface.co/models/${this.ttsModel}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({ inputs: text }),
          },
        );
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
        this.logger.warn(`HF TTS model returned status ${res.status}. Falling back to mock audio.`);
      } catch (err: any) {
        this.logger.error(`HuggingFace TTS synthesis failed: ${err.message}`);
      }
    }

    const minimalMp3Base64 =
      'SUQzBAAAAAAAAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXAzdgBUWFhYAAAAEgAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHgAAA2NvbXBhdGlibGVfYnJhbmRzAG1wM2JtcDMydXA1AFRFTkM="';
    return Buffer.from(minimalMp3Base64, 'base64');
  }
}
