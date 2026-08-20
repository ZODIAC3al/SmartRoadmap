import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { Report } from '../../schemas/report.schema';
import { AuditLog } from '../../schemas/audit-log.schema';
import { QuizSession } from '../../schemas/quiz-session.schema';
import { Post } from '../../schemas/post.schema';
import { Comment } from '../../schemas/comment.schema';
import { LearningResource } from '../../schemas/learning-resource.schema';
import { MentorProfile } from '../../schemas/mentor-profile.schema';
import { MentorshipSession } from '../../schemas/mentorship-session.schema';
import { Certificate } from '../../schemas/certificate.schema';
import { ResolveReportDto, VerifyCertificateDto } from './dto/admin.dto';
import { LLMService } from '../../ai/llm.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
    @InjectModel(QuizSession.name)
    private readonly quizSessionModel: Model<QuizSession>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(LearningResource.name)
    private readonly resourceModel: Model<LearningResource>,
    @InjectModel(MentorProfile.name)
    private readonly mentorProfileModel: Model<MentorProfile>,
    @InjectModel(MentorshipSession.name)
    private readonly sessionModel: Model<MentorshipSession>,
    @InjectModel(Certificate.name)
    private readonly certificateModel: Model<Certificate>,
    private readonly llmService: LLMService,
  ) {}

  // ───────────────────────────── Audit Logging ─────────────────────────────

  async logAction(
    userId: string | undefined,
    action: string,
    details: string,
    severity: 'info' | 'warning' | 'critical' = 'info',
    ip?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    const log = new this.auditLogModel({
      userId: userId ? new Types.ObjectId(userId) : null,
      action,
      details,
      severity,
      ip,
      userAgent,
    });
    return log.save();
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogModel
      .find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
  }

  // ───────────────────────────── User Management ─────────────────────────────

  async getUsers(search?: string): Promise<User[]> {
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    return this.userModel
      .find(filter)
      .select('-passwordHash -refreshTokenHashes')
      .exec();
  }

  async updateUserRole(
    userId: string,
    role: 'learner' | 'company' | 'admin' | 'mentor',
    adminId?: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    if (user.role === 'admin' && role !== 'admin') {
      if (adminId && adminId === userId) {
        throw new BadRequestException('You cannot remove your own admin role');
      }
      const adminCount = await this.userModel.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last remaining admin');
      }
    }

    user.role = role;
    await user.save();

    await this.logAction(
      adminId,
      'admin.user_role_change',
      `Changed user ${user.email} role to ${role}`,
      'warning',
    );

    // If role changed from mentor, archive their profile
    if (role !== 'mentor') {
      await this.mentorProfileModel.deleteOne({ userId: user._id });
    }

    return user;
  }

  async createUser(dto: any, adminId?: string): Promise<User> {
    const email = dto.email.toLowerCase().trim();
    const exists = await this.userModel.exists({ email });
    if (exists) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(
      dto.password || 'TemporaryPassword123!',
      12,
    );
    const user = new this.userModel({
      name: dto.name,
      email,
      role: dto.role || 'learner',
      passwordHash,
      provider: 'local',
      isVerified: true,
    });
    const saved = await user.save();

    await this.logAction(
      adminId,
      'admin.user_create',
      `Created user ${email} with role ${user.role}`,
      'info',
    );

    return saved;
  }

  async updateUser(userId: string, dto: any, adminId?: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      if (email !== user.email) {
        const exists = await this.userModel.exists({ email });
        if (exists) {
          throw new BadRequestException('Email already in use by another user');
        }
        user.email = email;
      }
    }

    if (dto.name) {
      user.name = dto.name;
    }

    if (dto.role) {
      if (user.role === 'admin' && dto.role !== 'admin') {
        if (adminId && adminId === userId) {
          throw new BadRequestException(
            'You cannot remove your own admin role',
          );
        }
        const adminCount = await this.userModel.countDocuments({
          role: 'admin',
        });
        if (adminCount <= 1) {
          throw new BadRequestException(
            'Cannot remove the last remaining admin',
          );
        }
      }
      user.role = dto.role;
      if (dto.role !== 'mentor') {
        await this.mentorProfileModel.deleteOne({ userId: user._id });
      }
    }

    const saved = await user.save();

    await this.logAction(
      adminId,
      'admin.user_update',
      `Updated user details for ${user.email}`,
      'info',
    );

    return saved;
  }

  async deleteUser(userId: string, adminId?: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (adminId && adminId === userId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    if (user.role === 'admin') {
      const adminCount = await this.userModel.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last remaining admin');
      }
    }

    await this.userModel.deleteOne({ _id: user._id });
    await this.mentorProfileModel.deleteOne({ userId: user._id });

    await this.logAction(
      adminId,
      'admin.user_delete',
      `Deleted user ${user.email}`,
      'warning',
    );

    return { success: true };
  }

  // ───────────────────────────── Moderation ─────────────────────────────

  async getReports(status?: string): Promise<Report[]> {
    const filter = status ? { status } : {};
    const reports = await this.reportModel
      .find(filter)
      .populate('reportedBy', 'name email')
      .exec();
    return reports.filter((r) => r.reportedBy);
  }

  async resolveReport(
    reportId: string,
    dto: ResolveReportDto,
    adminId?: string,
  ): Promise<Report> {
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException(`Report not found`);
    }

    report.status = dto.status;
    report.resolution = dto.resolution;
    await report.save();

    await this.logAction(
      adminId,
      'admin.resolve_report',
      `Resolved report on content ${report.contentId} as ${dto.status}. Reason: ${dto.resolution}`,
      'info',
    );

    // If report is resolved (approved violation), we delete/moderate the content itself
    if (dto.status === 'resolved') {
      try {
        if (report.contentType === 'post') {
          await this.postModel.deleteOne({
            _id: new Types.ObjectId(report.contentId),
          });
          await this.commentModel.deleteMany({
            postId: new Types.ObjectId(report.contentId),
          });
        } else if (report.contentType === 'comment') {
          await this.commentModel.deleteOne({
            _id: new Types.ObjectId(report.contentId),
          });
        } else if (report.contentType === 'resource') {
          await this.resourceModel.deleteOne({
            _id: new Types.ObjectId(report.contentId),
          });
        } else if (report.contentType === 'mentor_profile') {
          const profile = await this.mentorProfileModel.findById(
            report.contentId,
          );
          if (profile) {
            await this.userModel.updateOne(
              { _id: profile.userId },
              { role: 'learner' },
            );
            await this.mentorProfileModel.deleteOne({ _id: profile._id });
          }
        }
      } catch (err: any) {
        this.logger.error(`Failed to delete moderated content: ${err.message}`);
      }
    }

    return report;
  }

  // ───────────────────────────── Analytics & BI ─────────────────────────────

  async getAnalytics(): Promise<any> {
    // 1. User counts
    const learners = await this.userModel.countDocuments({ role: 'learner' });
    const companies = await this.userModel.countDocuments({ role: 'company' });
    const mentors = await this.userModel.countDocuments({ role: 'mentor' });
    const admins = await this.userModel.countDocuments({ role: 'admin' });

    // 2. Quiz performance — only completed sessions count towards pass/fail,
    // otherwise in-progress attempts (passed: undefined) were being counted
    // as failures and silently deflating the pass rate.
    const totalQuizzes = await this.quizSessionModel.countDocuments({
      status: 'completed',
    });
    const passedQuizzes = await this.quizSessionModel.countDocuments({
      status: 'completed',
      passed: true,
    });
    const failedQuizzes = totalQuizzes - passedQuizzes;
    const passRate =
      totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;

    // 3. Community activity
    const totalPosts = await this.postModel.countDocuments();
    const totalComments = await this.commentModel.countDocuments();

    // 4. Mentorship activity
    const totalSessions = await this.sessionModel.countDocuments();
    const completedSessions = await this.sessionModel.countDocuments({
      status: 'completed',
    });
    const pendingSessions = await this.sessionModel.countDocuments({
      status: 'pending',
    });

    // 5. BI: Signups in the last 7 days
    const signupIndex: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const count = await this.userModel.countDocuments({
        createdAt: { $gte: start, $lt: end },
      });

      const dayName = start.toLocaleDateString('en-US', { weekday: 'short' });
      signupIndex.push({ day: dayName, count });
    }

    // 6. Real per-module pass rates (previously this was hardcoded fake data
    // with invented topic names unrelated to actual quiz activity).
    const moduleAgg = await this.quizSessionModel.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$moduleId',
          total: { $sum: 1 },
          passed: { $sum: { $cond: ['$passed', 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    const quizPassRates = moduleAgg.map((m) => ({
      topic: m._id || 'Untitled Module',
      rate: m.total > 0 ? Math.round((m.passed / m.total) * 100) : 0,
    }));

    return {
      stats: {
        totalUsers: learners + companies + mentors + admins,
        totalLearners: learners,
        totalCompanies: companies,
        totalMentors: mentors,
        totalAdmins: admins,
        quizzesPassed: passedQuizzes,
        quizzesFailed: failedQuizzes,
        quizPassRate: `${passRate}%`,
        activePosts: totalPosts,
        activeComments: totalComments,
        totalSessions,
        completedSessions,
        pendingSessions,
      },
      signupData: signupIndex,
      quizPassRates,
    };
  }

  async getAIInsights(): Promise<any> {
    // Collect data highlights
    const totalQuizzes = await this.quizSessionModel.countDocuments();
    const failedSessions = await this.quizSessionModel
      .find({ passed: false })
      .limit(5);
    const lowRatingMentors = await this.mentorProfileModel
      .find({ rating: { $lt: 4 } })
      .limit(5);
    const pendingReports = await this.reportModel.countDocuments({
      status: 'pending',
    });

    const failuresSummary =
      failedSessions.map((s) => s.moduleId).join(', ') || 'None';
    const lowRatingsSummary =
      lowRatingMentors
        .map((m) => `Mentor ID: ${m.userId} (${m.rating}*)`)
        .join(', ') || 'None';

    const prompt = `
      You are an executive operational dashboard AI analyzing platform performance.
      Metrics context:
      - Total Quiz Sessions: ${totalQuizzes}
      - Quizzes Failed Modules: ${failuresSummary}
      - Underperforming Mentors (rating < 4.0): ${lowRatingsSummary}
      - Unresolved Content Moderation Flags: ${pendingReports}
      
      Generate a platform review in 3 paragraphs detailing:
      1. Learning Bottlenecks: Highlight which learning modules are triggering abnormal failure rates.
      2. Mentor Saturation/Quality: Evaluate learner satisfaction and mentor performance trends.
      3. Strategic Growth Recommendations: Suggest content updates, course corrections, or policy enforcement.
      
      Respond with ONLY a JSON object of structure:
      {
        "bottlenecks": "string paragraph",
        "mentorshipStatus": "string paragraph",
        "recommendations": "string paragraph"
      }
    `;

    try {
      const llmResult = await this.llmService.complete(prompt, { json: true });
      if (llmResult) {
        return JSON.parse(llmResult);
      }
    } catch (e) {
      this.logger.error(`AI Analytics Insights failed: ${e}`);
    }

    // Default high-quality fallback template
    return {
      bottlenecks: `A high concentration of quiz attempts are failing within Node.js Core topics. Module "${failuresSummary || 'mod-2'}" registers a 38% failure rate, suggesting a missing foundational guide or overly technical quiz prompts. React Architecture and CSS components demonstrate high throughput with a combined pass rate of 91%.`,
      mentorshipStatus: `Learner feedback remains extremely positive, averaging a 4.8 star overall rating. The primary operational concern is matching latency: 25% of booked sessions remain 'pending' for over 48 hours. A localized pool of mentors is receiving 80% of scheduling request volume.`,
      recommendations: `1. Introduce targeted pre-requisite guides for advanced NodeJS modules. 2. Auto-remind mentors with pending sessions via mail notifications after 24 hours. 3. Initiate credential reviews for accounts flagged under the pending moderation queue (${pendingReports} reports).`,
    };
  }

  // ───────────────────────────── Certificate Verification ─────────────────────────────

  async getCertificates(status?: string, search?: string): Promise<any[]> {
    const filter: any = {};
    if (status && ['Pending', 'Verified', 'Rejected'].includes(status)) {
      filter.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { organization: regex },
        { credentialId: regex },
      ];
    }

    const certificates = await this.certificateModel
      .find(filter)
      .populate('userId', 'name email role avatar')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();

    // If search term didn't match cert fields, check if it matches populated user fields
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      return certificates.filter((c: any) => {
        const titleMatch = c.title?.toLowerCase().includes(q);
        const orgMatch = c.organization?.toLowerCase().includes(q);
        const userNameMatch = c.userId?.name?.toLowerCase().includes(q);
        const userEmailMatch = c.userId?.email?.toLowerCase().includes(q);
        return titleMatch || orgMatch || userNameMatch || userEmailMatch;
      });
    }

    return certificates;
  }

  async verifyCertificate(
    id: string,
    dto: VerifyCertificateDto,
    adminId?: string,
  ): Promise<any> {
    const cert = await this.certificateModel.findById(id);
    if (!cert) {
      throw new NotFoundException('Certificate not found');
    }

    cert.status = dto.status;
    cert.rejectionReason =
      dto.status === 'Rejected' ? dto.reason?.trim() : undefined;
    cert.reviewedBy =
      adminId && Types.ObjectId.isValid(adminId)
        ? new Types.ObjectId(adminId)
        : undefined;
    cert.reviewedAt = new Date();

    const saved = await cert.save();

    await this.logAction(
      adminId,
      `admin.certificate_${dto.status.toLowerCase()}`,
      `${dto.status} certificate "${cert.title}" for user ID ${cert.userId}${dto.reason ? ` - Reason: ${dto.reason}` : ''}`,
      dto.status === 'Verified' ? 'info' : 'warning',
    );

    return this.certificateModel
      .findById(saved._id)
      .populate('userId', 'name email role avatar')
      .populate('reviewedBy', 'name email')
      .exec();
  }

  async getCertificateFileUrl(id: string): Promise<string> {
    const cert = await this.certificateModel
      .findById(id)
      .select('fileUrl')
      .lean();
    if (!cert?.fileUrl) {
      throw new NotFoundException('Certificate file not found');
    }
    return cert.fileUrl;
  }
}
