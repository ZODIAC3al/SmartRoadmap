import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Roadmap } from '../schemas/roadmap.schema';
import { Streak } from '../schemas/streak.schema';
import { UserAchievement } from '../schemas/user-achievement.schema';
import * as crypto from 'crypto';

export interface CertificationExportPayload {
  certificateId: string;
  issuedTo: {
    userId: string;
    name: string;
    email: string;
  };
  trackInfo: {
    trackId: string;
    title: string;
    completedModules: number;
    totalModules: number;
    progressPercentage: number;
  };
  verifiedSkills: string[];
  streakInfo: {
    longestStreakDays: number;
    currentStreakDays: number;
  };
  achievementsUnlocked: number;
  issuedAt: Date;
  shareableUrl: string;
}

@Injectable()
export class CertificationExportService {
  private readonly logger = new Logger(CertificationExportService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(Streak.name) private readonly streakModel: Model<Streak>,
    @InjectModel(UserAchievement.name) private readonly achievementModel: Model<UserAchievement>,
  ) {}

  async generateCertificationExport(userId: string, trackId: string): Promise<CertificationExportPayload> {
    this.logger.log(`Generating certification export for user ${userId}, track ${trackId}`);

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      $or: [{ status: 'active' }, { targetRole: new RegExp(trackId, 'i') }],
    });

    const totalModules = roadmap?.modules?.length || 0;
    const completedModules = roadmap?.modules?.filter((m) => m.status === 'completed') || [];
    const progressPercentage = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0;

    const verifiedSkills = Array.from(
      new Set(completedModules.flatMap((m) => m.topics || [m.title])),
    );

    const streak = await this.streakModel.findOne({ userId: new Types.ObjectId(userId) });
    const achievementsUnlocked = await this.achievementModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    const certHash = crypto
      .createHash('sha256')
      .update(`${userId}_${trackId}_${Date.now()}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();

    const certificateId = `DEV-CERT-${certHash}`;
    const shareableUrl = `https://devotopia.dev/certificates/${certificateId}`;

    return {
      certificateId,
      issuedTo: {
        userId,
        name: user.name || 'Devotopia Learner',
        email: user.email,
      },
      trackInfo: {
        trackId,
        title: roadmap?.title || `${trackId} Mastery Track`,
        completedModules: completedModules.length,
        totalModules,
        progressPercentage,
      },
      verifiedSkills,
      streakInfo: {
        longestStreakDays: streak?.longestStreak || 0,
        currentStreakDays: streak?.currentStreak || 0,
      },
      achievementsUnlocked,
      issuedAt: new Date(),
      shareableUrl,
    };
  }
}
