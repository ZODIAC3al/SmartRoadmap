// apps/api/src/modules/interview/interview.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { StartInterviewDto, SubmitInterviewAnswerDto } from './dto/interview.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('interview/session')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('start')
  async start(@Body() dto: StartInterviewDto, @Request() req: any) {
    const userId = req.user?.sub?.toString() || req.user?.id?.toString() || '';
    return this.interviewService.startInterview(dto, userId);
  }

  @Post(':id/answer')
  async answer(@Param('id') id: string, @Body() dto: SubmitInterviewAnswerDto) {
    return this.interviewService.submitAnswer(id, dto);
  }

  @Post(':id/pause')
  async pause(@Param('id') id: string) {
    return this.interviewService.pause(id);
  }

  @Post(':id/resume')
  async resume(@Param('id') id: string) {
    return this.interviewService.resume(id);
  }

  @Post(':id/end')
  async end(@Param('id') id: string) {
    return this.interviewService.endInterview(id);
  }

  @Get(':id/report')
  async report(@Param('id') id: string) {
    return this.interviewService.getReport(id);
  }
}
