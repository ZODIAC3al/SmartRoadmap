import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { AchievementDefinition } from '../../schemas/achievement-definition.schema';
import { UserAchievement } from '../../schemas/user-achievement.schema';
import { NotificationService } from '../notification/notification.service';

const DEFINITIONS = [
  // ── Bronze ─────────────────────────────────────────────────────────
  {
    key: 'first_login',
    title: 'Welcome Aboard',
    description: 'Signed in to SmartRoadmap for the very first time.',
    icon: '🚀',
    tier: 'bronze' as const,
  },
  {
    key: 'first_module',
    title: 'First Step Taken',
    description: 'Completed your first learning module successfully.',
    icon: '📖',
    tier: 'bronze' as const,
  },
  {
    key: 'first_quiz',
    title: 'Quiz Taker',
    description: 'Completed your first quiz assessment.',
    icon: '✏️',
    tier: 'bronze' as const,
  },
  {
    key: 'job_applied',
    title: 'Career Launcher',
    description: 'Checked out or applied to your first job match.',
    icon: '💼',
    tier: 'bronze' as const,
  },
  {
    key: 'cv_created',
    title: 'Resume Ready',
    description: 'Generated your first AI-powered CV.',
    icon: '📄',
    tier: 'bronze' as const,
  },
  {
    key: 'audio_listener',
    title: 'Sound Learner',
    description: 'Listened to your first AI audio summary.',
    icon: '🎧',
    tier: 'bronze' as const,
  },
  {
    key: 'first_voice_session',
    title: 'Voice Explorer',
    description: 'Had your first AI Voice Tutor session.',
    icon: '🎤',
    tier: 'bronze' as const,
  },
  // ── Silver ─────────────────────────────────────────────────────────
  {
    key: 'streak_7',
    title: 'Determined Learner',
    description: 'Maintained a 7-day consecutive learning streak.',
    icon: '🔥',
    tier: 'silver' as const,
  },
  {
    key: 'five_modules',
    title: 'Module Maven',
    description: 'Completed 5 learning modules on any track.',
    icon: '🏅',
    tier: 'silver' as const,
  },
  {
    key: 'quiz_streak_3',
    title: 'Quiz Streak',
    description: 'Passed 3 quizzes in a row without failing.',
    icon: '⚡',
    tier: 'silver' as const,
  },
  {
    key: 'cheatsheet_regenerated',
    title: 'Perfectionist',
    description: 'Regenerated an AI speech notes guide to get a better one.',
    icon: '🔄',
    tier: 'silver' as const,
  },
  {
    key: 'calendar_scheduler',
    title: 'Planner Pro',
    description: 'Added 5 study sessions to your learning calendar.',
    icon: '📅',
    tier: 'silver' as const,
  },
  // ── Gold ───────────────────────────────────────────────────────────
  {
    key: 'perfect_score',
    title: 'Absolute Mastery',
    description: 'Achieved a perfect score on an adaptive quiz.',
    icon: '🏆',
    tier: 'gold' as const,
  },
  {
    key: 'streak_30',
    title: 'Iron Will',
    description: 'Maintained a 30-day consecutive learning streak.',
    icon: '💎',
    tier: 'gold' as const,
  },
  {
    key: 'ten_modules',
    title: 'Track Champion',
    description: 'Completed 10 learning modules on any track.',
    icon: '🥇',
    tier: 'gold' as const,
  },
  {
    key: 'roadmap_complete',
    title: 'Roadmap Finisher',
    description: 'Completed an entire learning roadmap from start to finish.',
    icon: '🗺️',
    tier: 'gold' as const,
  },
];

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
    for (const def of DEFINITIONS) {
      await this.definitionModel.updateOne(
        { key: def.key },
        { $set: def },
        { upsert: true },
      );
    }
    this.logger.log(`Seeded ${DEFINITIONS.length} achievement definitions.`);
  }

  // ─────────────────────── Public Methods ───────────────────────────

  async getAchievementsForUser(userId: string) {
    const definitions = await this.definitionModel.find().sort({ tier: -1 }).exec();
    const unlocked = await this.userAchievementModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();
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
        unlockedAt: unlockedAt ?? null,
      };
    });
  }

  async getUserProgress(userId: string) {
    const total = await this.definitionModel.countDocuments();
    const unlocked = await this.userAchievementModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });
    return {
      total,
      unlocked,
      percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    };
  }

  async getRecentUnlocks(limit = 10) {
    const recent = await this.userAchievementModel
      .find()
      .sort({ unlockedAt: -1 })
      .limit(limit)
      .exec();

    const keys = [...new Set(recent.map((u) => u.achievementKey))];
    const definitions = await this.definitionModel.find({ key: { $in: keys } }).exec();
    const defsMap = new Map(definitions.map((d) => [d.key, d]));

    return recent.map((u) => {
      const def = defsMap.get(u.achievementKey);
      return {
        icon: def?.icon ?? '🏆',
        title: def?.title ?? u.achievementKey,
        tier: def?.tier ?? 'bronze',
        unlockedAt: u.unlockedAt,
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

      this.logger.log(`Achievement unlocked: User ${userId} → ${achievementKey}`);

      await this.notificationService.create(
        userId,
        `🏆 Achievement Unlocked: ${definition.title}`,
        `🏆 إنجاز جديد: ${definition.title}`,
        `Congratulations! You unlocked "${definition.title}" (${definition.tier} tier): ${definition.description}`,
        `تهانينا! لقد حصلت على إنجاز "${definition.title}" (${definition.tier}): ${definition.description}`,
        'achievement',
        '/achievements',
      );

      return true;
    } catch (err: any) {
      this.logger.error(`Failed to unlock ${achievementKey}: ${err.message}`);
      return false;
    }
  }

  // ─────────────────────── Event Listeners ──────────────────────────

  @OnEvent('module.completed')
  async handleModuleCompleted(payload: { userId: string; roadmapId: string; moduleId: string; completedCount?: number }) {
    await this.unlock(payload.userId, 'first_module');
    if ((payload.completedCount ?? 0) >= 5) await this.unlock(payload.userId, 'five_modules');
    if ((payload.completedCount ?? 0) >= 10) await this.unlock(payload.userId, 'ten_modules');
  }

  @OnEvent('roadmap.completed')
  async handleRoadmapCompleted(payload: { userId: string }) {
    await this.unlock(payload.userId, 'roadmap_complete');
  }

  @OnEvent('streak.incremented')
  async handleStreakIncremented(payload: { userId: string; streakCount: number }) {
    if (payload.streakCount >= 7) await this.unlock(payload.userId, 'streak_7');
    if (payload.streakCount >= 30) await this.unlock(payload.userId, 'streak_30');
  }

  @OnEvent('quiz.completed')
  async handleQuizCompleted(payload: { userId: string; score: number }) {
    await this.unlock(payload.userId, 'first_quiz');
  }

  @OnEvent('quiz.perfectScore')
  async handleQuizPerfectScore(payload: { userId: string; score: number }) {
    await this.unlock(payload.userId, 'perfect_score');
  }

  @OnEvent('job.applied')
  async handleJobApplied(payload: { userId: string }) {
    await this.unlock(payload.userId, 'job_applied');
  }

  @OnEvent('cv.created')
  async handleCvCreated(payload: { userId: string }) {
    await this.unlock(payload.userId, 'cv_created');
  }

  @OnEvent('audio.played')
  async handleAudioPlayed(payload: { userId: string }) {
    await this.unlock(payload.userId, 'audio_listener');
  }

  @OnEvent('voice.session.started')
  async handleVoiceSession(payload: { userId: string }) {
    await this.unlock(payload.userId, 'first_voice_session');
  }

  @OnEvent('cheatsheet.regenerated')
  async handleCheatsheetRegenerated(payload: { userId: string }) {
    await this.unlock(payload.userId, 'cheatsheet_regenerated');
  }

  @OnEvent('calendar.event.created')
  async handleCalendarEventCreated(payload: { userId: string; eventCount: number }) {
    if ((payload.eventCount ?? 0) >= 5) await this.unlock(payload.userId, 'calendar_scheduler');
  }
}
