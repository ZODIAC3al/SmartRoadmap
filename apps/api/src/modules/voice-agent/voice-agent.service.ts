import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class VoiceAgentService {
  private readonly logger = new Logger(VoiceAgentService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    // Use get() (not getOrThrow) so the app starts even without ASSEMBLYAI_API_KEY.
    // The key is validated lazily inside mintToken() when the feature is actually used.
    this.apiKey = this.config.get<string>('ASSEMBLYAI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn(
        'ASSEMBLYAI_API_KEY not set — Voice Agent feature is disabled.',
      );
    }
  }

  /**
   * Mint a short-lived single-use token for the browser to connect to the
   * AssemblyAI Voice Agent WebSocket directly — without exposing the raw API key.
   *
   * Auth: Bearer prefix IS required for agents.assemblyai.com (unlike STT endpoints).
   * The token expires in 60 s and is single-use per session.
   */
  async mintToken(maxSessionSeconds = 1800): Promise<{ token: string }> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'ASSEMBLYAI_API_KEY is not configured — Voice Agent feature is unavailable.',
      );
    }
    try {
      const res = await axios.get<{ token: string }>(
        'https://agents.assemblyai.com/v1/token',
        {
          params: {
            expires_in_seconds: 60,
            max_session_duration_seconds: maxSessionSeconds,
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 8_000,
        },
      );
      return { token: res.data.token };
    } catch (err: any) {
      this.logger.error(`Failed to mint AssemblyAI token: ${err.message}`);
      throw new InternalServerErrorException(
        'Failed to mint voice agent token',
      );
    }
  }
}
