import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider } from '../ai-provider.interface';

export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly ttsModel: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY') || '';
    this.model =
      this.config.get<string>('GEMINI_MODEL') || 'gemini-3.6-flash';
    this.ttsModel =
      this.config.get<string>('GEMINI_TTS_MODEL') || 'gemini-3.6-flash';
  }

  private getModelUrl(modelName: string): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  async generateText(prompt: string, system?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const modelsToTry = Array.from(
      new Set([
        this.model,
        'gemini-3.6-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.7-flash',
        'gemini-3.5-flash',
        'gemini-flash-lite-latest',
      ]),
    );
    let lastError: Error | null = null;

    for (const m of modelsToTry) {
      try {
        const url = this.getModelUrl(m);
        const body = {
          contents: [{ parts: [{ text: prompt }] }],
          ...(system
            ? { systemInstruction: { parts: [{ text: system }] } }
            : {}),
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorText = await res.text();
          let shortMsg = `${res.statusText} (${res.status})`;
          try {
            const parsed = JSON.parse(errorText);
            shortMsg = parsed.error?.message || shortMsg;
          } catch {
            shortMsg = errorText.slice(0, 150);
          }
          throw new Error(`Gemini API error (${m}): ${shortMsg}`);
        }

        const data: any = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      } catch (err: any) {
        lastError = err;
        this.logger.debug(
          `Gemini model ${m} unavailable (${err.message}). Trying next fallback...`,
        );
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }

  async generateJSON<T>(
    prompt: string,
    schemaDescription: string,
    system?: string,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const modelsToTry = Array.from(
      new Set([
        this.model,
        'gemini-3.6-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.7-flash',
        'gemini-3.5-flash',
        'gemini-flash-lite-latest',
      ]),
    );
    let lastError: Error | null = null;

    for (const m of modelsToTry) {
      try {
        const url = this.getModelUrl(m);
        const body = {
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [
              {
                text: `${system || ''}\nYou MUST return a single JSON object. Schema requirements: ${schemaDescription}`,
              },
            ],
          },
          generationConfig: {
            responseMimeType: 'application/json',
          },
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorText = await res.text();
          let shortMsg = `${res.statusText} (${res.status})`;
          try {
            const parsed = JSON.parse(errorText);
            shortMsg = parsed.error?.message || shortMsg;
          } catch {
            shortMsg = errorText.slice(0, 150);
          }
          throw new Error(`Gemini API JSON error (${m}): ${shortMsg}`);
        }

        const data: any = await res.json();
        let content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        return JSON.parse(content) as T;
      } catch (err: any) {
        lastError = err;
        this.logger.debug(
          `Gemini JSON model ${m} unavailable (${err.message}). Trying next fallback...`,
        );
      }
    }

    throw lastError || new Error('All Gemini JSON models failed');
  }

  async textToSpeech(text: string, voice = 'en-US-Neural2-F'): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.logger.log(
      `GeminiProvider: rendering speech via Google TTS API for voice ${voice}`,
    );
    try {
      // Use the standard Google Cloud Text-to-Speech API which works with standard API keys
      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: voice.includes('-')
              ? voice.split('-').slice(0, 2).join('-')
              : 'en-US',
            name: voice,
          },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data.audioContent) {
          return Buffer.from(data.audioContent, 'base64');
        }
      }
      this.logger.warn(
        `Google Cloud TTS call returned status: ${res.status}. Falling back to Gemini generative audio...`,
      );

      // Fallback: Use Gemini model audio output modalities if Cloud TTS is not enabled on the key
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Read this text aloud: "${text}"` }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
            },
          },
        }),
      });

      if (geminiRes.ok) {
        const geminiData: any = await geminiRes.json();
        // Look for the base64 audio output parts
        const parts = geminiData.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (
            part.inlineData &&
            part.inlineData.mimeType.startsWith('audio/')
          ) {
            return Buffer.from(part.inlineData.data, 'base64');
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Gemini TextToSpeech synthesis failed: ${err.message}`);
    }

    // Default ultimate mock fallback to prevent crash
    const minimalMp3Base64 =
      'SUQzBAAAAAAAAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXAzdgBUWFhYAAAAEgAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHgAAA2NvbXBhdGlibGVfYnJhbmRzAG1wM2JtcDMydXA1AFRFTkM="';
    return Buffer.from(minimalMp3Base64, 'base64');
  }
}
