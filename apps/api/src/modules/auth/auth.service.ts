import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../schemas/user.schema';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;

  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
    this.jwtSecret = process.env.JWT_SECRET || 'smartroadmap_ultra_secret_key_2026_xyz';
  }

  // Pure cryptographic PBKDF2 hashing
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, passwordHash: string): boolean {
    const parts = passwordHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  // Pure token signing in Base64Url JSON
  private generateToken(user: User): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };

    const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest('base64url');

    return `${headerBase64}.${payloadBase64}.${signature}`;
  }

  // Parse and verify standard Base64Url JWT signature
  verifyToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;

      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Expired
      }
      return decodedPayload;
    } catch (e) {
      return null;
    }
  }

  async register(email: string, name: string, password: string, role: 'learner' | 'company' = 'learner'): Promise<any> {
    const existing = await this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw new BadRequestException('User with this email already exists.');
    }

    const passwordHash = this.hashPassword(password);
    const user = new this.userModel({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash,
      role,
      isVerified: true,
    });

    const saved = await user.save();
    await this.seedUserOnboarding(saved._id.toString());
    const token = this.generateToken(saved);

    return {
      token,
      user: {
        id: saved._id.toString(),
        email: saved.email,
        name: saved.name,
        role: saved.role,
      },
    };
  }

  async login(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const valid = this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = this.generateToken(user);
    await this.seedUserOnboarding(user._id.toString());

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async googleLogin(email: string, name: string, avatarUrl?: string): Promise<any> {
    this.logger.log(`Google auth login payload received: ${email}`);

    // If user already exists, authenticate them. Otherwise, register them dynamically.
    let user = await this.userModel.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      this.logger.log(`User does not exist, creating new social login user profile for: ${email}`);
      const mockPasswordHash = this.hashPassword(crypto.randomBytes(32).toString('hex'));
      user = new this.userModel({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash: mockPasswordHash,
        role: 'learner', // Default social signup is a learner
        avatarUrl: avatarUrl || '',
        isVerified: true,
      });
      await user.save();
    }

    const token = this.generateToken(user);
    await this.seedUserOnboarding(user._id.toString());
    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async updateProfile(userId: string, updateData: any): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User profile not found.');
    }

    if (updateData.name !== undefined) user.name = updateData.name.trim();
    if (updateData.email !== undefined) {
      const emailLower = updateData.email.toLowerCase().trim();
      if (emailLower !== user.email) {
        const existing = await this.userModel.findOne({ email: emailLower });
        if (existing) {
          throw new BadRequestException('A user with this email address already exists.');
        }
        user.email = emailLower;
      }
    }
    if (updateData.role !== undefined) user.role = updateData.role;
    if (updateData.avatarUrl !== undefined) user.avatarUrl = updateData.avatarUrl;
    if (updateData.username !== undefined) user.username = updateData.username.trim();
    if (updateData.phone !== undefined) user.phone = updateData.phone.trim();
    if (updateData.bio !== undefined) user.bio = updateData.bio;
    if (updateData.theme !== undefined) user.theme = updateData.theme;
    if (updateData.locale !== undefined) user.locale = updateData.locale;

    const saved = await user.save();
    return {
      id: saved._id.toString(),
      email: saved.email,
      name: saved.name,
      role: saved.role,
      avatarUrl: saved.avatarUrl,
      username: saved.username,
      phone: saved.phone,
      bio: saved.bio,
      theme: saved.theme,
      locale: saved.locale,
    };
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async seedUserOnboarding(userId: string): Promise<void> {
    try {
      const notificationModel = this.userModel.db.model('Notification');
      const messageModel = this.userModel.db.model('Message');

      const userObjectId = new Types.ObjectId(userId);
      const count = await notificationModel.countDocuments({ recipient: userObjectId }).exec();
      if (count > 0) return; // Already seeded

      // Find or create the Support Team user
      let supportUser = await this.userModel.findOne({ email: 'support@smartroadmap.dev' }).exec();
      if (!supportUser) {
        supportUser = new this.userModel({
          email: 'support@smartroadmap.dev',
          name: 'SmartRoadmap Support Team',
          passwordHash: 'support_system_account_no_password',
          role: 'admin',
          avatarUrl: '/logo.svg',
          isVerified: true,
          bio: 'AI-Powered SmartRoadmap Platform Guide & Helpdesk',
        });
        await supportUser.save();
      }

      // Seed welcome notification
      const welcomeNotif = new notificationModel({
        recipient: userObjectId,
        titleEn: 'Welcome to SmartRoadmap!',
        titleAr: 'مرحباً بك في SmartRoadmap!',
        contentEn: 'Verify your tech skills, generate adaptive learning roadmaps, and match directly with top hiring teams.',
        contentAr: 'قم بطلب تقييم لمهاراتك، واحصل على خارطة طريق مخصصة للتعلم بالذكاء الاصطناعي، وطابق ملفك مع جهات التوظيف.',
        type: 'general',
        link: '/roadmap',
        read: false,
      });
      await welcomeNotif.save();

      // Seed a second notification about Job Matching
      const jobNotif = new notificationModel({
        recipient: userObjectId,
        titleEn: 'Job Match Alert',
        titleAr: 'تنبيه مطابقة وظيفة',
        contentEn: 'You have a 97% match rating for the Frontend Engineer role at Stripe!',
        contentAr: 'لديك نسبة مطابقة تبلغ ٩٧٪ لوظيفة مهندس واجهات (Frontend Engineer) لدى شركة Stripe!',
        type: 'job_match',
        link: '/hiring',
        read: false,
      });
      await jobNotif.save();

      // Seed welcome chat messages
      const msg1 = new messageModel({
        sender: supportUser._id,
        recipient: userObjectId,
        content: 'Welcome to SmartRoadmap! I am your career pilot. I see you registered your profile successfully. Have you tried uploading your resume to let our AI parser fill in your skills?',
        read: false,
        createdAt: new Date(Date.now() - 600000), // 10 mins ago
      });
      await msg1.save();

      const msg2 = new messageModel({
        sender: userObjectId,
        recipient: supportUser._id,
        content: 'Thanks! I will try that right now.',
        read: true,
        createdAt: new Date(Date.now() - 300000), // 5 mins ago
      });
      await msg2.save();

      const msg3 = new messageModel({
        sender: supportUser._id,
        recipient: userObjectId,
        content: 'Excellent. Once you upload it, you can take a skill assessment to verify your passport, which unlocks direct recruiter interview offers!',
        read: false,
        createdAt: new Date(Date.now() - 6000), // just now
      });
      await msg3.save();
    } catch (e: any) {
      this.logger.error(`Failed to seed onboarding data for user ${userId}: ${e.message}`);
    }
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
