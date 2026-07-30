import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Roadmap } from '../../schemas/roadmap.schema';
import { Streak } from '../../schemas/streak.schema';
import { CalendarEvent } from '../../schemas/calendar-event.schema';
import { UserAchievement } from '../../schemas/user-achievement.schema';
import { AchievementDefinition } from '../../schemas/achievement-definition.schema';
import { QuizSession } from '../../schemas/quiz-session.schema';
import { ProgressSnapshot } from '../../schemas/progress-snapshot.schema';
import { CheatSheet } from '../../schemas/cheat-sheet.schema';
import { TrackCertification } from '../../schemas/track-certification.schema';

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
    @InjectModel(QuizSession.name)
    private readonly quizSessionModel: Model<QuizSession>,
    @InjectModel(ProgressSnapshot.name)
    private readonly snapshotModel: Model<ProgressSnapshot>,
    @InjectModel(CheatSheet.name)
    private readonly cheatSheetModel: Model<CheatSheet>,
    @InjectModel(TrackCertification.name)
    private readonly certModel: Model<TrackCertification>,
  ) {}

  async getSummary(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    // 1. Fetch active roadmap progress and next module
    const roadmap = await this.roadmapModel
      .findOne({
        userId: userObjectId,
        status: 'active',
      })
      .exec();

    let roadmapProgress = 0;
    let nextModule = null;

    if (roadmap && roadmap.modules && roadmap.modules.length > 0) {
      const completed = roadmap.modules.filter(
        (m) => m.status === 'completed',
      ).length;
      roadmapProgress = Math.round((completed / roadmap.modules.length) * 100);

      // Next module: prioritize in_progress modules first, then first locked module
      nextModule =
        roadmap.modules.find((m) => m.status === 'in_progress') ||
        roadmap.modules.find((m) => m.status === 'locked') ||
        null;
    }

    // 2. Fetch streaks from MongoDB
    let streak = await this.streakModel
      .findOne({ userId: userObjectId })
      .exec();
    if (!streak) {
      try {
        streak = await this.streakModel.create({
          userId: userObjectId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: new Date().toISOString().split('T')[0],
          freezesAvailable: 2,
          timezone: 'UTC',
        });
      } catch {
        // ignore duplicate
      }
    }

    const streakData = {
      current: streak?.currentStreak || 1,
      longest: streak?.longestStreak || 1,
      freezesAvailable: streak?.freezesAvailable ?? 2,
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

    // 4. Fetch recent achievements from MongoDB
    let userEarned = await this.userAchievementModel
      .find({ userId: userObjectId })
      .sort({ unlockedAt: -1 })
      .limit(6)
      .exec();

    // Auto-grant default Devotopia badges if learner has none stored in DB yet
    if (userEarned.length === 0) {
      const defaultBadgeKeys = [
        'ai_architect',
        'solutions_architect',
        'cloud_practitioner',
        'security_engineer',
      ];
      for (const key of defaultBadgeKeys) {
        try {
          await this.userAchievementModel.create({
            userId: userObjectId,
            achievementKey: key,
            unlockedAt: new Date(),
          });
        } catch {
          // ignore duplicate
        }
      }
      userEarned = await this.userAchievementModel
        .find({ userId: userObjectId })
        .sort({ unlockedAt: -1 })
        .limit(6)
        .exec();
    }

    const recentAchievements = [];
    if (userEarned.length > 0) {
      const keys = userEarned.map((u) => u.achievementKey);
      const definitions = await this.definitionModel
        .find({ key: { $in: keys } })
        .exec();
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

    // 5. Fetch quiz history from real db records
    const quizSessions = await this.quizSessionModel
      .find({ userId: userObjectId, status: 'completed' })
      .sort({ createdAt: 1 })
      .limit(10)
      .exec();

    const quizHistory = quizSessions.map((q) => ({
      score: q.score || 0,
      moduleId: q.moduleId,
      completedAt: q.completedAt || (q as any).createdAt,
    }));

    // 6. Fetch progress snapshots (time spent or score)
    const snapshots = await this.snapshotModel
      .find({ userId: userObjectId })
      .sort({ createdAt: 1 })
      .limit(10)
      .exec();

    const progressHistory = snapshots.map((s) => ({
      event: s.event,
      score: s.scoreAtEvent || 0,
      timeSpentMinutes: Math.round(s.timeSpentSeconds / 60) || 0,
      createdAt: (s as any).createdAt,
    }));

    // 7. Fetch stored AI cheatsheets for all modules
    const cheatSheets = await this.cheatSheetModel
      .find({ userId: userObjectId })
      .exec();
    const storedCheatSheets = cheatSheets.map((cs) => ({
      moduleId: cs.moduleId,
      content: cs.content,
      versionsCount: cs.versions?.length || 1,
      updatedAt: (cs as any).updatedAt || (cs as any).createdAt,
    }));

    // 8. Fetch issued track certifications from DB
    const issuedCertifications = await this.certModel
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      roadmapProgress,
      nextModule,
      streak: streakData,
      upcomingEvents,
      recentAchievements,
      quizHistory,
      progressHistory,
      activeRoadmap: roadmap
        ? {
            id: roadmap._id.toString(),
            title: roadmap.title,
            targetRole: roadmap.targetRole,
            modules: roadmap.modules || [],
          }
        : null,
      storedCheatSheets,
      issuedCertifications,
    };
  }

  /**
   * Returns per-day activity data for the given period (7d / 30d / 90d).
   * Used by frontend chart components.
   */
  async getActivity(userId: string, period: '7d' | '30d' | '90d' = '30d') {
    const userObjectId = new Types.ObjectId(userId);
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period] ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Quiz sessions per day
    const quizSessions = await this.quizSessionModel
      .find({
        userId: userObjectId,
        status: 'completed',
        createdAt: { $gte: since },
      })
      .select('score createdAt')
      .lean()
      .exec();

    // Progress snapshots per day
    const snapshots = await this.snapshotModel
      .find({ userId: userObjectId, createdAt: { $gte: since } })
      .select('event timeSpentSeconds createdAt')
      .lean()
      .exec();

    // Streak data
    const streak = await this.streakModel
      .findOne({ userId: userObjectId })
      .exec();

    // Build a date-keyed map for the period
    const buckets: Record<
      string,
      {
        date: string;
        quizzes: number;
        minutesStudied: number;
        avgScore: number;
      }
    > = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      buckets[key] = { date: key, quizzes: 0, minutesStudied: 0, avgScore: 0 };
    }

    const quizScoresByDay: Record<string, number[]> = {};
    for (const q of quizSessions) {
      const key = new Date((q as any).createdAt).toISOString().split('T')[0];
      if (buckets[key]) {
        buckets[key].quizzes += 1;
        if (!quizScoresByDay[key]) quizScoresByDay[key] = [];
        quizScoresByDay[key].push(q.score || 0);
      }
    }

    for (const s of snapshots) {
      const key = new Date((s as any).createdAt).toISOString().split('T')[0];
      if (buckets[key]) {
        buckets[key].minutesStudied += Math.round(
          (s.timeSpentSeconds || 0) / 60,
        );
      }
    }

    // Compute avg scores
    for (const [key, scores] of Object.entries(quizScoresByDay)) {
      if (buckets[key] && scores.length > 0) {
        buckets[key].avgScore = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length,
        );
      }
    }

    return {
      period,
      days: Object.values(buckets),
      summary: {
        totalQuizzes: quizSessions.length,
        totalMinutes: snapshots.reduce(
          (acc, s) => acc + Math.round((s.timeSpentSeconds || 0) / 60),
          0,
        ),
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
      },
    };
  }
}
