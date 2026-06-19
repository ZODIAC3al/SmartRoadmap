import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { QuizSession, QuizSessionSchema } from '../../schemas/quiz-session.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuizSession.name, schema: QuizSessionSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
    ]),
  ],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
