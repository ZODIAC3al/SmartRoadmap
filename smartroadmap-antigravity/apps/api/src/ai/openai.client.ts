import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Single source of truth for "are we running against real OpenAI, or mocks?".
 *
 * Mock mode is now an EXPLICIT decision (MOCK_MODE=true) or the absence of a key
 * in non-production. `env.validation.ts` makes both impossible in production, so
 * a live deployment can never silently serve fake AI output.
 */
export function createOpenAIClient(config: ConfigService, logger: Logger) {
  const explicitMock = config.get<boolean>('MOCK_MODE') === true;
  const apiKey = config.get<string>('OPENAI_API_KEY');
  const usable =
    !!apiKey && !apiKey.startsWith('sk-...') && !apiKey.includes('placeholder');

  const isMockMode = explicitMock || !usable;
  if (isMockMode) {
    logger.warn('Running in MOCK mode — AI responses are simulated.');
    return { isMockMode: true as const, client: null };
  }

  return { isMockMode: false as const, client: new OpenAI({ apiKey }) };
}
