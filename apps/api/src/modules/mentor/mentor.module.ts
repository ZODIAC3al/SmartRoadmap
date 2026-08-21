import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MentorController } from './mentor.controller';
import { MentorService } from './mentor.service';
import {
  MentorProfile,
  MentorProfileSchema,
} from '../../schemas/mentor-profile.schema';
import {
  MentorshipSession,
  MentorshipSessionSchema,
} from '../../schemas/mentorship-session.schema';
import {
  MentorRating,
  MentorRatingSchema,
} from '../../schemas/mentor-rating.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import { Cv, CvSchema } from '../../schemas/cv.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { AIModule } from '../../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MentorProfile.name, schema: MentorProfileSchema },
      { name: MentorshipSession.name, schema: MentorshipSessionSchema },
      { name: MentorRating.name, schema: MentorRatingSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: Cv.name, schema: CvSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AIModule,
  ],
  controllers: [MentorController],
  providers: [MentorService],
  exports: [MentorService],
})
export class MentorModule {}
