import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import {
  UserRecommendation,
  UserRecommendationSchema,
} from '../../schemas/recommendation.schema';
import {
  LearnerProfile,
  LearnerProfileSchema,
} from '../../schemas/learner-profile.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import {
  QuizSession,
  QuizSessionSchema,
} from '../../schemas/quiz-session.schema';
import {
  InterviewSession,
  InterviewSessionSchema,
} from '../../schemas/interview-session.schema';
import { Job, JobSchema } from '../../schemas/job.schema';
import { AIModule } from '../../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserRecommendation.name, schema: UserRecommendationSchema },
      { name: LearnerProfile.name, schema: LearnerProfileSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: QuizSession.name, schema: QuizSessionSchema },
      { name: InterviewSession.name, schema: InterviewSessionSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    AIModule,
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
