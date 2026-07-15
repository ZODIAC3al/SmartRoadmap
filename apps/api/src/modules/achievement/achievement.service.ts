import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { AchievementDefinition } from '../../schemas/achievement-definition.schema';
import { UserAchievement } from '../../schemas/user-achievement.schema';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AchievementService implements OnModuleInit {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    @InjectModel(AchievementDefinition.name)
    private readonly definitionModel: Model<AchievementDefinition>,
    @InjectModel(UserAchievement.name)
    private readonly userAchievementModel: Model<UserAchievement>,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    await this.seedDefinitions();
  }

  private async seedDefinitions() {
    const definitions = [
      {
        key: 'first_module',
        title: 'First Step taken',
        description: 'Completed your first learning module successfully.',
        icon: 'trophy-bronze',
        tier: 'bronze' as const,
      },
      {
        key: 'streak_7',
        title: 'Determined Learner',
        description: 'Maintained a 7-day consecutive learning streak.',
        icon: 'trophy-silver',
        tier: 'silver' as const,
      },
      {
        key: 'perfect_score',
        title: 'Absolute Mastery',
        description: 'Achieved a perfect score on an adaptive quiz.',
        icon: 'trophy-gold',
        tier: 'gold' as const,
      },
      {
        key: 'job_applied',
        title: 'Career Launcher',
        description: 'Checked out or applied to your first job match.',
        icon: 'trophy-bronze',
        tier: 'bronze' as const,
      },
    ];

    for (const def of definitions) {
      await this.definitionModel.updateOne(
        { key: def.key },
        { $set: def },
        { upsert: true },
      );
    }
    this.logger.log('Achievement definitions seeded successfully.');
  }

  async getAchievementsForUser(userId: string) {
    const definitions = await this.definitionModel.find().exec();
    const unlocked = await this.userAchievementModel.find({ userId: new Types.ObjectId(userId) }).exec();
    const unlockedKeysMap = new Map(unlocked.map((u) => [u.achievementKey, u.unlockedAt]));

    return definitions.map((def) => {
      const unlockedAt = unlockedKeysMap.get(def.key);
      return {
        key: def.key,
        title: def.title,
        description: def.description,
        icon: def.icon,
        tier: def.tier,
        unlocked: !!unlockedAt,
        unlockedAt,
      };
    });
  }

  async unlock(userId: string, achievementKey: string): Promise<boolean> {
    try {
      const definition = await this.definitionModel.findOne({ key: achievementKey });
      if (!definition) return false;

      const existing = await this.userAchievementModel.findOne({
        userId: new Types.ObjectId(userId),
        achievementKey,
      });
      if (existing) return false;

      const userAchievement = new this.userAchievementModel({
        userId: new Types.ObjectId(userId),
        achievementKey,
        unlockedAt: new Date(),
      });
      await userAchievement.save();

      this.logger.log(`Achievement unlocked: User ${userId} unlocked ${achievementKey}`);

      // Push notification & in-app message
      await this.notificationService.create(
        userId,
        `🏆 Achievement Unlocked: ${definition.title}`,
        `🏆 إنجاز جديد: ${definition.title}`,
        `Congratulations! You unlocked the ${definition.tier}-tier achievement: ${definition.description}`,
        `تهانينا! لقد حصلت على إنجاز من الفئة ${definition.tier}: ${definition.description}`,
        'achievement',
        '/achievements',
      );

      return true;
    } catch (err: any) {
      this.logger.error(`Failed to unlock achievement ${achievementKey}: ${err.message}`);
      return false;
    }
  }

  // ───────────────────────────── Event Listeners ─────────────────────────────

  @OnEvent('module.completed')
  async handleModuleCompleted(payload: { userId: string; roadmapId: string; moduleId: string }) {
    this.logger.log(`Achievement check on module.completed event for User ${payload.userId}`);
    // Check if they completed their first module
    // If we successfully unlock it, first_module will not unlock again because of unique check in unlock()
    await this.unlock(payload.userId, 'first_module');
  }

  @OnEvent('streak.incremented')
  async handleStreakIncremented(payload: { userId: string; streakCount: number }) {
    this.logger.log(`Achievement check on streak.incremented event for User ${payload.userId}: count ${payload.streakCount}`);
    if (payload.streakCount >= 7) {
      await this.unlock(payload.userId, 'streak_7');
    }
  }

  @OnEvent('quiz.perfectScore')
  async handleQuizPerfectScore(payload: { userId: string; score: number }) {
    this.logger.log(`Achievement check on quiz.perfectScore event for User ${payload.userId}`);
    await this.unlock(payload.userId, 'perfect_score');
  }

  @OnEvent('job.applied')
  async handleJobApplied(payload: { userId: string }) {
    this.logger.log(`Achievement check on job.applied event for User ${payload.userId}`);
    await this.unlock(payload.userId, 'job_applied');
  }
}
