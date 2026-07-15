import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { User } from '../../schemas/user.schema';

/**
 * Seeds welcome notifications / support chat for a brand new account.
 *
 * Runs ONCE at signup (fire-and-forget) instead of on every login, and is
 * disabled in production unless SEED_DEMO_CONTENT=true, so fake data like the
 * "97% match at Stripe" notification never reaches real users.
 */
@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly config: ConfigService,
  ) {}

  private get enabled(): boolean {
    if (this.config.get('SEED_DEMO_CONTENT') === 'true') return true;
    return this.config.get('NODE_ENV') !== 'production';
  }

  async seedForUser(userId: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const notificationModel = this.userModel.db.model('Notification');
      const messageModel = this.userModel.db.model('Message');
      const recipient = new Types.ObjectId(userId);

      if (await notificationModel.exists({ recipient })) return;

      const support =
        (await this.userModel.findOne({ email: 'support@smartroadmap.dev' })) ??
        (await new this.userModel({
          email: 'support@smartroadmap.dev',
          name: 'SmartRoadmap Support Team',
          // Unusable hash — this system account can never be logged into.
          passwordHash: '$2b$12$system.account.no.login.allowed.placeholder.hash.value',
          role: 'admin',
          provider: 'local',
          avatarUrl: '/logo.svg',
          isVerified: true,
          bio: 'AI-Powered SmartRoadmap Platform Guide & Helpdesk',
        }).save());

      await notificationModel.create({
        recipient,
        titleEn: 'Welcome to SmartRoadmap!',
        titleAr: 'مرحباً بك في SmartRoadmap!',
        contentEn:
          'Verify your tech skills, generate adaptive learning roadmaps, and match with hiring teams.',
        contentAr:
          'قم بطلب تقييم لمهاراتك، واحصل على خارطة طريق مخصصة للتعلم، وطابق ملفك مع جهات التوظيف.',
        type: 'general',
        link: '/roadmap',
        read: false,
      });

      await messageModel.create({
        sender: support._id,
        recipient,
        content:
          'Welcome to SmartRoadmap! Upload your resume to let the AI parser fill in your skills, then take a skill assessment to verify your passport.',
        read: false,
      });
    } catch (e: any) {
      this.logger.error(`Failed to seed onboarding data for ${userId}: ${e.message}`);
    }
  }
}
