import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from '../../schemas/job.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import {
  QuizSession,
  QuizSessionSchema,
} from '../../schemas/quiz-session.schema';
import { Cv, CvSchema } from '../../schemas/cv.schema';
import { HiringService } from './hiring.service';
import { HiringController } from './hiring.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: User.name, schema: UserSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: QuizSession.name, schema: QuizSessionSchema },
      { name: Cv.name, schema: CvSchema },
    ]),
  ],
  controllers: [HiringController],
  providers: [HiringService],
  exports: [HiringService],
})
export class HiringModule {}
