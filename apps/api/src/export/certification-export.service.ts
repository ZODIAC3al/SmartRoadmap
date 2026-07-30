import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Roadmap } from '../schemas/roadmap.schema';
import { Streak } from '../schemas/streak.schema';
import { UserAchievement } from '../schemas/user-achievement.schema';
import { TrackCertification } from '../schemas/track-certification.schema';
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
  expiresAt: Date;
  shareableUrl: string;
  badgeKey: string;
  isTrackComplete: boolean;
}

@Injectable()
export class CertificationExportService {
  private readonly logger = new Logger(CertificationExportService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(Streak.name) private readonly streakModel: Model<Streak>,
    @InjectModel(UserAchievement.name)
    private readonly achievementModel: Model<UserAchievement>,
    @InjectModel(TrackCertification.name)
    private readonly certModel: Model<TrackCertification>,
  ) {}

  /**
   * Called automatically by AssessmentService after each passed exam.
   * Checks if ALL non-remedial modules are completed; if so, issues the cert + badge.
   */
  async checkAndIssueCertification(
    userId: string,
  ): Promise<TrackCertification | null> {
    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    if (!roadmap) return null;

    const nonRemedialModules = roadmap.modules.filter(
      (m) => !m.id.endsWith('-remedial'),
    );
    const allComplete =
      nonRemedialModules.length > 0 &&
      nonRemedialModules.every((m) => m.status === 'completed');

    if (!allComplete) return null;

    // Already issued?
    const existing = await this.certModel.findOne({
      userId: new Types.ObjectId(userId),
      trackId: roadmap._id.toString(),
    });
    if (existing) {
      this.logger.log(
        `Certification already exists for user ${userId}, track ${roadmap._id}`,
      );
      return existing;
    }

    const verifiedSkills = Array.from(
      new Set(
        nonRemedialModules.flatMap((m) =>
          m.topics?.length ? m.topics : [m.title],
        ),
      ),
    );

    const certHash = crypto
      .createHash('sha256')
      .update(`${userId}_${roadmap._id}_track_complete`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();

    const certificateId = `DEV-CERT-${certHash}`;
    const shareableUrl = `https://devotopia.dev/certificates/${certificateId}`;
    const expiresAt = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000);
    const badgeKey = `track_complete_${roadmap._id}`;

    const streak = await this.streakModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    const cert = new this.certModel({
      userId: new Types.ObjectId(userId),
      trackId: roadmap._id.toString(),
      trackTitle: roadmap.title || roadmap.targetRole || 'Mastery Track',
      certificateId,
      verifiedSkills,
      shareableUrl,
      expiresAt,
      badgeKey,
      progressPercentage: 100,
      longestStreakDays: streak?.longestStreak || 0,
    });

    await cert.save();

    // Auto-grant the achievement badge
    try {
      await this.achievementModel.create({
        userId: new Types.ObjectId(userId),
        achievementKey: badgeKey,
        unlockedAt: new Date(),
      });
    } catch (_) {
      // Ignore duplicate key — badge already granted
    }

    this.logger.log(
      `✅ Track certification issued: ${certificateId} for user ${userId}`,
    );
    return cert;
  }

  async generateCertificationExport(
    userId: string,
    trackId: string,
  ): Promise<CertificationExportPayload> {
    this.logger.log(
      `Generating certification export for user ${userId}, track ${trackId}`,
    );

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      $or: [
        {
          _id: Types.ObjectId.isValid(trackId)
            ? new Types.ObjectId(trackId)
            : undefined,
        },
        { status: 'active' },
        { targetRole: new RegExp(trackId, 'i') },
      ],
    });

    const totalModules =
      roadmap?.modules?.filter((m) => !m.id.endsWith('-remedial')).length || 0;
    const completedModules =
      roadmap?.modules?.filter(
        (m) => m.status === 'completed' && !m.id.endsWith('-remedial'),
      ) || [];
    const progressPercentage =
      totalModules > 0
        ? Math.round((completedModules.length / totalModules) * 100)
        : 0;
    const isTrackComplete =
      totalModules > 0 && completedModules.length === totalModules;

    const verifiedSkills = Array.from(
      new Set(
        completedModules.flatMap((m) =>
          m.topics?.length ? m.topics : [m.title],
        ),
      ),
    );

    const streak = await this.streakModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    const achievementsUnlocked = await this.achievementModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    // Check if a persisted cert exists for this track
    const persistedCert = await this.certModel.findOne({
      userId: new Types.ObjectId(userId),
      trackId: roadmap?._id?.toString() || trackId,
    });

    let certificateId: string;
    let shareableUrl: string;
    let expiresAt: Date;
    let badgeKey: string;
    let issuedAt: Date;

    if (persistedCert) {
      certificateId = persistedCert.certificateId;
      shareableUrl = persistedCert.shareableUrl;
      expiresAt = persistedCert.expiresAt;
      badgeKey = persistedCert.badgeKey;
      issuedAt = (persistedCert.get('createdAt') as Date) || new Date();
    } else {
      const certHash = crypto
        .createHash('sha256')
        .update(`${userId}_${trackId}_${Date.now()}`)
        .digest('hex')
        .slice(0, 16)
        .toUpperCase();
      certificateId = `DEV-CERT-${certHash}`;
      shareableUrl = `https://devotopia.dev/certificates/${certificateId}`;
      expiresAt = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000);
      badgeKey = `track_complete_${trackId}`;
      issuedAt = new Date();
    }

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
      issuedAt,
      expiresAt,
      shareableUrl,
      badgeKey,
      isTrackComplete,
    };
  }

  /**
   * Returns a fully-styled HTML string for browser print-to-PDF.
   * Matches the Devotopia dark certificate visual from Image 1.
   */
  async generateCertificateHtml(
    userId: string,
    trackId: string,
  ): Promise<string> {
    const payload = await this.generateCertificationExport(userId, trackId);
    const user = await this.userModel.findById(userId);

    const skillPills = payload.verifiedSkills
      .map((s) => `<span class="pill">✓ ${s}</span>`)
      .join('');

    const issueDate = new Date(payload.issuedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const expiryDate = new Date(payload.expiresAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Devotopia Certification – ${payload.issuedTo.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', sans-serif;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 32px;
  }

  .cert-wrapper {
    background: #ffffff;
    border-radius: 20px;
    padding: 12px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.18);
    max-width: 780px;
    width: 100%;
  }

  .cert-card {
    background: #0f172a;
    border-radius: 14px;
    padding: 52px 56px;
    color: #fff;
    position: relative;
    overflow: hidden;
  }

  /* Decorative orb */
  .cert-card::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 260px; height: 260px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%);
    pointer-events: none;
  }
  .cert-card::after {
    content: '';
    position: absolute;
    bottom: -60px; left: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .logo-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 36px;
  }
  .logo-brand {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .logo-check {
    width: 22px; height: 22px;
    border-radius: 50%;
    background: #f97316;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
    color: #fff;
  }
  .logo-certified {
    font-size: 20px;
    font-weight: 300;
    color: #94a3b8;
    letter-spacing: 1px;
  }

  .recipient-name {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -1px;
    color: #fff;
    margin-bottom: 8px;
    line-height: 1.1;
  }
  .track-title {
    font-size: 16px;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 36px;
    letter-spacing: 0.3px;
  }

  .validation-box {
    border: 2px solid #f59e0b;
    border-radius: 10px;
    padding: 18px 20px;
    margin-bottom: 28px;
    background: rgba(245,158,11,0.04);
  }
  .validation-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    margin-bottom: 6px;
  }
  .validation-row:last-child { margin-bottom: 0; }
  .validation-label { font-weight: 800; color: #fff; white-space: nowrap; }
  .validation-value { font-weight: 600; color: #fbbf24; word-break: break-all; }
  .validation-link { color: #f59e0b; text-decoration: none; }

  .skills-section {
    margin-bottom: 28px;
  }
  .skills-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #6366f1;
    margin-bottom: 10px;
  }
  .pills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
  .pill {
    background: rgba(99,102,241,0.18);
    border: 1px solid rgba(99,102,241,0.35);
    color: #c7d2fe;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
  }

  .footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding-top: 20px;
    font-size: 11px;
    font-family: 'Courier New', monospace;
    color: #64748b;
  }
  .footer-date strong { color: #cbd5e1; }

  .streak-badge {
    background: rgba(245,158,11,0.15);
    border: 1px solid rgba(245,158,11,0.3);
    color: #fbbf24;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
  }

  @media print {
    body { background: #fff; padding: 0; }
    .cert-wrapper { box-shadow: none; border-radius: 0; padding: 0; }
    .cert-card { border-radius: 0; }
    @page { margin: 0; size: A4 landscape; }
  }
</style>
</head>
<body>
<div class="cert-wrapper">
  <div class="cert-card">
    <div class="logo-row">
      <div class="logo-brand">
        devotopia <span class="logo-check">✓</span>
      </div>
      <div class="logo-certified">certified</div>
    </div>

    <h1 class="recipient-name">${payload.issuedTo.name || user?.name || 'Learner'}</h1>
    <p class="track-title">Devotopia Certified – ${payload.trackInfo.title}</p>

    <div class="validation-box">
      <div class="validation-row">
        <span class="validation-label">VALIDATION NUMBER:</span>
        <span class="validation-value">${payload.certificateId}</span>
      </div>
      <div class="validation-row">
        <span class="validation-label">VALIDATE AT:</span>
        <a href="${payload.shareableUrl}" class="validation-link">${payload.shareableUrl}</a>
      </div>
    </div>

    ${
      payload.verifiedSkills.length > 0
        ? `
    <div class="skills-section">
      <div class="skills-label">Verified Competencies</div>
      <div class="pills-wrap">${skillPills}</div>
    </div>`
        : ''
    }

    <div class="footer-row">
      <div class="footer-date">
        <strong>Issue Date:</strong> ${issueDate}
      </div>
      <div class="streak-badge">🔥 ${payload.streakInfo.longestStreakDays} day streak</div>
      <div class="footer-date">
        <strong>Expiration Date:</strong> ${expiryDate}
      </div>
    </div>
  </div>
</div>
<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 400);
  };
</script>
</body>
</html>`;
  }

  /** Returns all issued certifications for a user (for dashboard display) */
  async getUserCertifications(userId: string): Promise<TrackCertification[]> {
    return this.certModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean() as any;
  }
}
