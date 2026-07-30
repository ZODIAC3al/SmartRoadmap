import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import {
  QuizSession,
  QuizSessionSchema,
} from '../../schemas/quiz-session.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import {
  UserTopicResult,
  UserTopicResultSchema,
} from '../../schemas/user-topic-result.schema';

import { RoadmapModule } from '../roadmap/roadmap.module';
import { StreakModule } from '../streak/streak.module';

@Module({
  imports: [
    RoadmapModule,
    StreakModule,
    MongooseModule.forFeature([
      { name: QuizSession.name, schema: QuizSessionSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: UserTopicResult.name, schema: UserTopicResultSchema },
    ]),
  ],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
