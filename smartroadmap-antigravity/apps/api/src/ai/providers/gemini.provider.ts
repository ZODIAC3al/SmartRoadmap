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
    this.model = this.config.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
    this.ttsModel = this.config.get<string>('GEMINI_TTS_MODEL') || 'gemini-2.0-flash';
  }

  private getModelUrl(modelName: string): string {
    if (this.apiKey.startsWith('AQ.')) {
      return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    }
    return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey.startsWith('AQ.')) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else {
      headers['x-goog-api-key'] = this.apiKey;
    }
    return headers;
  }

  async generateText(prompt: string, system?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const modelsToTry = Array.from(new Set([this.model, 'gemini-2.0-flash', 'gemini-1.5-flash']));
    let lastError: Error | null = null;

    for (const m of modelsToTry) {
      try {
        const url = this.getModelUrl(m);
        const body = {
          contents: [{ parts: [{ text: prompt }] }],
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Gemini API error (${m}): ${res.statusText} - ${errorText}`);
        }

        const data: any = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Gemini model ${m} failed, attempting next model fallback... (${err.message})`);
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }

  async generateJSON<T>(prompt: string, schemaDescription: string, system?: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const modelsToTry = Array.from(new Set([this.model, 'gemini-2.0-flash', 'gemini-1.5-flash']));
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
          throw new Error(`Gemini API JSON error (${m}): ${res.statusText} - ${errorText}`);
        }

        const data: any = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
        return JSON.parse(content) as T;
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Gemini JSON model ${m} failed, attempting next model fallback... (${err.message})`);
      }
    }

    throw lastError || new Error('All Gemini JSON models failed');
  }

  async textToSpeech(text: string, voice = 'en-US-Neural2-F'): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.logger.log(`GeminiProvider: rendering speech via Google TTS API for voice ${voice}`);
    try {
      // Use the standard Google Cloud Text-to-Speech API which works with standard API keys
      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: voice.includes('-') ? voice.split('-').slice(0, 2).join('-') : 'en-US', name: voice },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data.audioContent) {
          return Buffer.from(data.audioContent, 'base64');
        }
      }
      this.logger.warn(`Google Cloud TTS call returned status: ${res.status}. Falling back to Gemini generative audio...`);
      
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
          if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
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
