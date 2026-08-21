import { Logger } from '@nestjs/common';
import axios from 'axios';
import { LLMProvider, ChatMessage } from './llm-provider.interface';

export class GeminiLLMProvider implements LLMProvider {
  private readonly logger = new Logger(GeminiLLMProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string = process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  ) {}

  /**
   * Ceiling on generated tokens. Output is billed at a higher rate than input
   * on every provider, and without a cap the model is free to fill its entire
   * response window — an unbounded cost for an answer nobody reads to the end.
   * Callers that genuinely need a long answer can raise it per call.
   */
  private static readonly DEFAULT_MAX_OUTPUT_TOKENS = 1024;

  async chat(
    messages: ChatMessage[],
    options?: { isJson?: boolean; maxOutputTokens?: number; temperature?: number },
  ): Promise<string> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const headers = { 'Content-Type': 'application/json' };

      // 1. Separate system instructions
      const systemMessage = messages.find((m) => m.role === 'system');
      const chatHistory = messages.filter((m) => m.role !== 'system');

      // 2. Map chat history to Gemini structure
      const contents = chatHistory.map((m) => {
        const role = m.role === 'user' ? 'user' : 'model';
        return {
          role,
          parts: [{ text: m.content }],
        };
      });

      const body: any = { contents };

      if (systemMessage) {
        body.systemInstruction = {
          parts: [{ text: systemMessage.content }],
        };
      }

      // Always send a generationConfig — an uncapped request is an uncapped bill.
      body.generationConfig = {
        maxOutputTokens:
          options?.maxOutputTokens ?? GeminiLLMProvider.DEFAULT_MAX_OUTPUT_TOKENS,
        ...(options?.temperature !== undefined
          ? { temperature: options.temperature }
          : {}),
        ...(options?.isJson ? { responseMimeType: 'application/json' } : {}),
      };

      const response = await axios.post(url, body, { headers });

      const usage = response.data?.usageMetadata;
      if (usage) {
        this.logger.debug(
          `Gemini tokens — prompt ${usage.promptTokenCount}, ` +
            `output ${usage.candidatesTokenCount}, total ${usage.totalTokenCount}`,
        );
      }

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty response returned from Gemini API');
      }

      return text;
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message;
      this.logger.debug(`Gemini API key call returned error: ${errMsg}`);
      throw new Error(`Gemini LLM Provider error: ${errMsg}`);
    }
  }
}
