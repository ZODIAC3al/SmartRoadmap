import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AssessmentService } from './assessment.service';

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('session/start')
  @HttpCode(HttpStatus.OK)
  async startSession(
    @Body('userId') userId: string,
    @Body('moduleId') moduleId: string,
    @Body('topic') topic: string,
  ) {
    return this.assessmentService.startSession(userId, moduleId, topic);
  }

  @Post('session/:id/answer')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Param('id') id: string,
    @Body('answer') answer: string,
    @Body('timeTaken') timeTaken?: number,
  ) {
    return this.assessmentService.submitAnswer(id, answer, timeTaken || 10);
  }
}
