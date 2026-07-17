import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VoiceAgentService } from './voice-agent.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('voice-agent')
@ApiBearerAuth()
@Controller('voice-agent')
export class VoiceAgentController {
  constructor(private readonly voiceAgentService: VoiceAgentService) {}

  /**
   * GET /voice-agent/token
   * Requires a valid JWT session. Returns a 60-second single-use AssemblyAI
   * token the browser uses to connect to wss://agents.assemblyai.com/v1/ws.
   * The raw API key never leaves the server.
   */
  @Get('token')
  @HttpCode(HttpStatus.OK)
  async getToken(@CurrentUser() _user: JwtUser) {
    return this.voiceAgentService.mintToken();
  }
}
