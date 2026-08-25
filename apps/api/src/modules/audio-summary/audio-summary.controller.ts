import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { AudioSummaryService } from './audio-summary.service';
import { AiUsageService } from '../billing/ai-usage.service';
import { AIEntitlementGuard, RequireAiFeature } from '../billing/ai-entitlement.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('audio-summaries')
@ApiBearerAuth()
@Controller('audio-summaries')
@UseGuards(JwtAuthGuard)
export class AudioSummaryController {
  constructor(
    private readonly audioSummaryService: AudioSummaryService,
    private readonly aiUsageService: AiUsageService,
  ) {}

  @Get(':moduleId')
  async getAudioSummary(
    @CurrentUser() user: JwtUser,
    @Param('moduleId') moduleId: string,
  ) {
    const summary = await this.audioSummaryService.get(user.sub, moduleId);
    return {
      success: true,
      data: summary || null,
    };
  }

  @UseGuards(AIEntitlementGuard)
  @RequireAiFeature('AI_AUDIO_SUMMARY')
  @Post(':moduleId/generate')
  async generateAudioSummary(
    @CurrentUser() user: JwtUser,
    @Param('moduleId') moduleId: string,
  ) {
    const { reservationId } = await this.aiUsageService.reserve(user, 'AI_AUDIO_SUMMARY');
    try {
      const summary = await this.audioSummaryService.generate(user.sub, moduleId);
      await this.aiUsageService.finalize(reservationId, {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        status: 'success',
      });
      return {
        success: true,
        data: summary,
      };
    } catch (err: any) {
      await this.aiUsageService.release(reservationId, err?.message);
      throw err;
    }
  }

  /** Public streaming endpoint to allow native HTML5 audio components to play the MP3 files. */
  @Public()
  @Get('play/:filename')
  async playAudio(
    @Param('filename') filename: string,
    @Res() res: express.Response,
  ) {
    const filePath = await this.audioSummaryService.getAudioFilePath(filename);
    const contentType = filename.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.sendFile(filePath, {
      headers: {
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
