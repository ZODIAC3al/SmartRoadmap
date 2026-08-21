import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Portfolio } from '../../schemas/portfolio.schema';
import { User } from '../../schemas/user.schema';
import { LearnerProfile } from '../../schemas/learner-profile.schema';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    @InjectModel(Portfolio.name)
    private readonly portfolioModel: Model<Portfolio>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(LearnerProfile.name)
    private readonly learnerProfileModel: Model<LearnerProfile>,
  ) {}

  async getMyPortfolio(userId: string): Promise<Portfolio> {
    const userObjId = new Types.ObjectId(userId);
    let portfolio = await this.portfolioModel.findOne({ userId: userObjId });

    if (!portfolio) {
      const user = await this.userModel.findById(userId);
      const username =
        user?.username ||
        user?.email?.split('@')[0] ||
        `user_${userId.slice(-6)}`;
      const userAny = user as any;

      portfolio = new this.portfolioModel({
        userId: userObjId,
        username: username.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        title: user?.name ? `${user.name} Portfolio` : 'Developer Portfolio',
        bio:
          user?.bio ||
          'Passionate software engineer building web applications.',
        about: user?.bio || '',
        template: 'developer',
        isPublished: false,
        skills: userAny?.skills || [
          'JavaScript',
          'TypeScript',
          'React',
          'Node.js',
        ],
        socialLinks: {
          email: user?.email,
          github: userAny?.githubUsername
            ? `https://github.com/${userAny.githubUsername}`
            : undefined,
          linkedin: userAny?.linkedinUrl,
        },
      });
      await portfolio.save();
    }

    return portfolio;
  }

  async savePortfolio(userId: string, data: any): Promise<Portfolio> {
    this.logger.log(`Saving portfolio for user ${userId}`);
    const portfolio = await this.getMyPortfolio(userId);

    if (data.title !== undefined) portfolio.title = data.title;
    if (data.template !== undefined) portfolio.template = data.template;
    if (data.bio !== undefined) portfolio.bio = data.bio;
    if (data.about !== undefined) portfolio.about = data.about;
    if (data.socialLinks !== undefined)
      portfolio.socialLinks = data.socialLinks;
    if (data.skills !== undefined) portfolio.skills = data.skills;
    if (data.projects !== undefined) portfolio.projects = data.projects;
    if (data.experience !== undefined) portfolio.experience = data.experience;
    if (data.education !== undefined) portfolio.education = data.education;
    if (data.customSections !== undefined)
      portfolio.customSections = data.customSections;
    if (data.isPublished !== undefined)
      portfolio.isPublished = data.isPublished;

    return portfolio.save();
  }

  async setPublishStatus(
    userId: string,
    isPublished: boolean,
  ): Promise<Portfolio> {
    const portfolio = await this.getMyPortfolio(userId);
    portfolio.isPublished = isPublished;
    return portfolio.save();
  }

  async getPublicPortfolio(username: string): Promise<Portfolio> {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const portfolio = await this.portfolioModel.findOne({
      username: cleanUsername,
      isPublished: true,
    });

    if (!portfolio) {
      throw new NotFoundException(
        `Public portfolio for user "${username}" was not found or is private.`,
      );
    }

    return portfolio;
  }
}
