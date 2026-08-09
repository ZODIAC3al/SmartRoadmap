import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { Cv, CvSchema } from '../../schemas/cv.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { LearnerProfile, LearnerProfileSchema } from '../../schemas/learner-profile.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import { QuizSession, QuizSessionSchema } from '../../schemas/quiz-session.schema';
import { GitHubAccount, GitHubAccountSchema } from '../../schemas/github-account.schema';
import { LinkedInAccount, LinkedInAccountSchema } from '../../schemas/linkedin-account.schema';
import { UserAchievement, UserAchievementSchema } from '../../schemas/user-achievement.schema';
import { ProfileImportModule } from '../profile-import/profile-import.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cv.name, schema: CvSchema },
      { name: User.name, schema: UserSchema },
      { name: LearnerProfile.name, schema: LearnerProfileSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: QuizSession.name, schema: QuizSessionSchema },
      { name: GitHubAccount.name, schema: GitHubAccountSchema },
      { name: LinkedInAccount.name, schema: LinkedInAccountSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
    ]),
    ProfileImportModule,
  ],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}

