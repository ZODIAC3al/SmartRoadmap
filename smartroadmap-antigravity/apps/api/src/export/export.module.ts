import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportController } from './export.controller';
import { CertificationExportService } from './certification-export.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Roadmap, RoadmapSchema } from '../schemas/roadmap.schema';
import { Streak, StreakSchema } from '../schemas/streak.schema';
import { UserAchievement, UserAchievementSchema } from '../schemas/user-achievement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: Streak.name, schema: StreakSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
    ]),
  ],
  controllers: [ExportController],
  providers: [CertificationExportService],
  exports: [CertificationExportService],
})
export class ExportModule {}
