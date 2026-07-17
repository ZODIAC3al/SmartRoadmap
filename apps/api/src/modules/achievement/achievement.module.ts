import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AchievementDefinition, AchievementDefinitionSchema } from '../../schemas/achievement-definition.schema';
import { UserAchievement, UserAchievementSchema } from '../../schemas/user-achievement.schema';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AchievementDefinition.name, schema: AchievementDefinitionSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
    ]),
    NotificationModule,
  ],
  controllers: [AchievementController],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}
