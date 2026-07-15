import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Roadmap } from '../../schemas/roadmap.schema';
import { Streak } from '../../schemas/streak.schema';
import { CalendarEvent } from '../../schemas/calendar-event.schema';
import { UserAchievement } from '../../schemas/user-achievement.schema';
import { AchievementDefinition } from '../../schemas/achievement-definition.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(Streak.name)
    private readonly streakModel: Model<Streak>,
    @InjectModel(CalendarEvent.name)
    private readonly eventModel: Model<CalendarEvent>,
    @InjectModel(UserAchievement.name)
    private readonly userAchievementModel: Model<UserAchievement>,
    @InjectModel(AchievementDefinition.name)
    private readonly definitionModel: Model<AchievementDefinition>,
  ) {}

  async getSummary(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    // 1. Fetch active roadmap progress and next module
    const roadmap = await this.roadmapModel.findOne({
      userId: userObjectId,
      status: 'active',
    }).exec();

    let roadmapProgress = 0;
    let nextModule = null;

    if (roadmap && roadmap.modules && roadmap.modules.length > 0) {
      const completed = roadmap.modules.filter((m) => m.status === 'completed').length;
      roadmapProgress = Math.round((completed / roadmap.modules.length) * 100);

      // Next module: prioritize in_progress modules first, then first locked module
      nextModule = roadmap.modules.find((m) => m.status === 'in_progress') ||
                   roadmap.modules.find((m) => m.status === 'locked') ||
                   null;
    }

    // 2. Fetch streaks
    const streak = await this.streakModel.findOne({ userId: userObjectId }).exec();
    const streakData = {
      current: streak?.currentStreak || 0,
      longest: streak?.longestStreak || 0,
      freezesAvailable: streak?.freezesAvailable || 0,
    };

    // 3. Fetch upcoming calendar events
    const upcomingEvents = await this.eventModel
      .find({
        userId: userObjectId,
        startAt: { $gte: new Date() },
      })
      .sort({ startAt: 1 })
      .limit(5)
      .exec();

    // 4. Fetch recent achievements
    const userEarned = await this.userAchievementModel
      .find({ userId: userObjectId })
      .sort({ unlockedAt: -1 })
      .limit(5)
      .exec();

    const recentAchievements = [];
    if (userEarned.length > 0) {
      const keys = userEarned.map((u) => u.achievementKey);
      const definitions = await this.definitionModel.find({ key: { $in: keys } }).exec();
      const defsMap = new Map(definitions.map((d) => [d.key, d]));

      for (const u of userEarned) {
        const def = defsMap.get(u.achievementKey);
        if (def) {
          recentAchievements.push({
            key: def.key,
            title: def.title,
            description: def.description,
            icon: def.icon,
            tier: def.tier,
            unlockedAt: u.unlockedAt,
          });
        }
      }
    }

    return {
      roadmapProgress,
      nextModule,
      streak: streakData,
      upcomingEvents,
      recentAchievements,
    };
  }
}
