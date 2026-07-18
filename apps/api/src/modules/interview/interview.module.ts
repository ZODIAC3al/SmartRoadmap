// apps/api/src/modules/interview/interview.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIModule } from '../../ai/ai.module';
import { InterviewEngine } from './interview-engine';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { InterviewSession, InterviewSessionSchema } from '../../schemas/interview-session.schema';
import { InterviewReport, InterviewReportSchema } from '../../schemas/interview-report.schema';

@Module({
  imports: [
    AIModule,
    MongooseModule.forFeature([
      { name: InterviewSession.name, schema: InterviewSessionSchema },
      { name: InterviewReport.name, schema: InterviewReportSchema },
    ]),
  ],
  providers: [InterviewEngine, InterviewService],
  controllers: [InterviewController],
  exports: [InterviewService],
})
export class InterviewModule {}
