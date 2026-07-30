import { Logger } from '@nestjs/common';
import axios from 'axios';
import { LLMProvider, ChatMessage } from './llm-provider.interface';

export class GeminiLLMProvider implements LLMProvider {
  private readonly logger = new Logger(GeminiLLMProvider.name);

  constructor(private readonly apiKey: string) {}

  async chat(
    messages: ChatMessage[],
    options?: { isJson?: boolean },
  ): Promise<string> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

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

      if (options?.isJson) {
        body.generationConfig = {
          responseMimeType: 'application/json',
        };
      }

      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty response returned from Gemini API');
      }

      return text;
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message;
      this.logger.error(`Gemini chat call failed: ${errMsg}`);
      throw new Error(`Gemini LLM Provider error: ${errMsg}`);
    }
  }
}
