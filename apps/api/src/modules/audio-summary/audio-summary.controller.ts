import { Controller, Get, NotFoundException, Param, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { AudioSummaryService } from './audio-summary.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('audio-summaries')
@ApiBearerAuth()
@Controller('audio-summaries')
export class AudioSummaryController {
  constructor(private readonly audioSummaryService: AudioSummaryService) {}

  @Get(':moduleId')
  async getAudioSummary(@CurrentUser() user: JwtUser, @Param('moduleId') moduleId: string) {
    const summary = await this.audioSummaryService.get(user.sub, moduleId);
    if (!summary) {
      throw new NotFoundException('Audio summary not yet generated');
    }
    return {
      success: true,
      data: summary,
    };
  }

  @Post(':moduleId/generate')
  async generateAudioSummary(@CurrentUser() user: JwtUser, @Param('moduleId') moduleId: string) {
    const summary = await this.audioSummaryService.generate(user.sub, moduleId);
    return {
      success: true,
      data: summary,
    };
  }

  /** Public streaming endpoint to allow native HTML5 audio components to play the MP3 files. */
  @Public()
  @Get('play/:filename')
  async playAudio(@Param('filename') filename: string, @Res() res: express.Response) {
    const filePath = await this.audioSummaryService.getAudioFilePath(filename);
    const contentType = filename.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.sendFile(filePath);
  }
}
