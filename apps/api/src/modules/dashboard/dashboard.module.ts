import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import { Streak, StreakSchema } from '../../schemas/streak.schema';
import { CalendarEvent, CalendarEventSchema } from '../../schemas/calendar-event.schema';
import { UserAchievement, UserAchievementSchema } from '../../schemas/user-achievement.schema';
import { AchievementDefinition, AchievementDefinitionSchema } from '../../schemas/achievement-definition.schema';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: Streak.name, schema: StreakSchema },
      { name: CalendarEvent.name, schema: CalendarEventSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: AchievementDefinition.name, schema: AchievementDefinitionSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
