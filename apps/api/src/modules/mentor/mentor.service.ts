import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MentorProfile } from '../../schemas/mentor-profile.schema';
import { MentorshipSession } from '../../schemas/mentorship-session.schema';
import { MentorRating } from '../../schemas/mentor-rating.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { Cv } from '../../schemas/cv.schema';
import { User } from '../../schemas/user.schema';
import {
  CreateMentorProfileDto,
  BookSessionDto,
  UpdateSessionStatusDto,
  RateMentorDto,
} from './dto/mentor.dto';
import { LLMService } from '../../ai/llm.service';

@Injectable()
export class MentorService {
  private readonly logger = new Logger(MentorService.name);

  constructor(
    @InjectModel(MentorProfile.name)
    private readonly profileModel: Model<MentorProfile>,
    @InjectModel(MentorshipSession.name)
    private readonly sessionModel: Model<MentorshipSession>,
    @InjectModel(MentorRating.name)
    private readonly ratingModel: Model<MentorRating>,
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(Cv.name)
    private readonly cvModel: Model<Cv>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly llmService: LLMService,
  ) {}

  // ───────────────────────────── Profiles ─────────────────────────────

  async upsertProfile(
    dto: CreateMentorProfileDto,
    userId: string,
  ): Promise<MentorProfile> {
    this.logger.log(`Upserting mentor profile for user ${userId}`);

    // Update user role to 'mentor' if not already
    await this.userModel.findByIdAndUpdate(userId, { role: 'mentor' });

    let profile = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (profile) {
      Object.assign(profile, dto);
    } else {
      profile = new this.profileModel({
        ...dto,
        userId: new Types.ObjectId(userId),
      });
    }

    return profile.save();
  }

  async findProfiles(search?: string): Promise<any[]> {
    const filter: any = {};
    if (search) {
      filter.$or = [
        { expertise: new RegExp(search, 'i') },
        { industry: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') },
      ];
    }

    const profiles = await this.profileModel
      .find(filter)
      .populate('userId', 'name email avatarUrl bio')
      .exec();

    // Clean up null user profiles (in case of DB deletion)
    return profiles.filter((p) => p.userId);
  }

  async getProfile(userId: string): Promise<MentorProfile> {
    const profile = await this.profileModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'name email avatarUrl bio');
    if (!profile) {
      throw new NotFoundException(`Mentor profile not found`);
    }
    return profile;
  }

  async recommendMentors(userId: string): Promise<any[]> {
    // 1. Gather learner skills & goals
    let learnerTarget = '';
    const learnerSkills: string[] = [];

    const activeRoadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    if (activeRoadmap) {
      learnerTarget = activeRoadmap.targetRole || '';
      activeRoadmap.modules.forEach((mod) => {
        learnerSkills.push(mod.title);
        learnerSkills.push(...mod.topics);
      });
    }

    const cv = await this.cvModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (cv && cv.skills) {
      learnerSkills.push(...cv.skills);
    }

    // Load all available mentor profiles
    const mentors = await this.findProfiles();
    if (mentors.length === 0) return [];

    // 2. Try LLM Matching first
    const prompt = `
      You are an AI career matchmaking assistant. Your task is to recommend the best mentors from a catalog to a learner.
      Learner Target Role: "${learnerTarget}"
      Learner Current Skills: ${learnerSkills.join(', ') || 'None'}
      
      Mentors Catalog:
      ${mentors
        .map(
          (m) => `
        - Mentor ID: ${m.userId._id}
          Name: ${m.userId.name}
          Bio: ${m.bio}
          Expertise: ${m.expertise.join(', ')}
          Industry: ${m.industry}
          Experience: ${m.experienceYears} years
      `,
        )
        .join('\n')}
      
      Respond with ONLY a JSON object of structure:
      {
        "recommendations": [
          {
            "mentorId": "string",
            "matchReason": "1 sentence explanation of why this mentor fits their skills/goals",
            "score": number (1-100 rating matching relevance)
          }
        ]
      }
    `;

    try {
      const llmResult = await this.llmService.complete(prompt, { json: true });
      if (llmResult) {
        const parsed = JSON.parse(llmResult);
        if (parsed && Array.isArray(parsed.recommendations)) {
          // Map LLM recommendations back to the mentor profiles
          return parsed.recommendations
            .map((rec: any) => {
              const mentor = mentors.find(
                (m) => m.userId._id.toString() === rec.mentorId,
              );
              if (!mentor) return null;
              return {
                ...mentor.toObject(),
                matchReason: rec.matchReason,
                matchScore: rec.score,
              };
            })
            .filter(Boolean)
            .sort((a: any, b: any) => b.matchScore - a.matchScore);
        }
      }
    } catch (e) {
      this.logger.error(
        `LLM mentor recommendation failed, falling back to query index: ${e}`,
      );
    }

    // 3. Fallback database keywords matching
    const cleanSkills = learnerSkills.map((s) => s.toLowerCase());
    return mentors
      .map((mentor) => {
        let matchCount = 0;
        mentor.expertise.forEach((exp: string) => {
          if (
            cleanSkills.some(
              (s) =>
                exp.toLowerCase().includes(s) || s.includes(exp.toLowerCase()),
            )
          ) {
            matchCount += 1;
          }
        });

        if (
          learnerTarget &&
          mentor.expertise.some((exp: string) =>
            exp.toLowerCase().includes(learnerTarget.toLowerCase()),
          )
        ) {
          matchCount += 5;
        }

        const score = Math.min(100, 40 + matchCount * 12);
        return {
          ...mentor.toObject(),
          matchReason: `Expertise in ${mentor.expertise.slice(0, 3).join(', ')} matches your skill development paths.`,
          matchScore: score,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  // ───────────────────────────── Sessions ─────────────────────────────

  async bookSession(
    dto: BookSessionDto,
    learnerId: string,
  ): Promise<MentorshipSession> {
    const mentor = await this.profileModel.findOne({
      userId: new Types.ObjectId(dto.mentorId),
    });
    if (!mentor) {
      throw new NotFoundException(`Mentor profile not found`);
    }

    // Simple availability check
    const scheduledDate = new Date(dto.scheduledAt);
    const dayOfWeek = scheduledDate.getDay(); // 0 = Sunday, 1 = Monday
    const hour = scheduledDate.getHours();
    const min = scheduledDate.getMinutes();
    const bookingTimeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

    // Verify if mentor has slot matching the weekday
    const isAvailable = mentor.availability.some((slot) => {
      if (slot.dayOfWeek !== dayOfWeek) return false;
      return bookingTimeStr >= slot.startTime && bookingTimeStr <= slot.endTime;
    });

    if (!isAvailable) {
      throw new BadRequestException(
        'Selected time slot does not match mentor availability schedule.',
      );
    }

    // Check conflict
    const conflict = await this.sessionModel.findOne({
      mentorId: new Types.ObjectId(dto.mentorId),
      scheduledAt: scheduledDate,
      status: { $in: ['pending', 'accepted'] },
    });
    if (conflict) {
      throw new ConflictException(
        'Mentor has another confirmed or pending session at this slot.',
      );
    }

    const session = new this.sessionModel({
      ...dto,
      mentorId: new Types.ObjectId(dto.mentorId),
      learnerId: new Types.ObjectId(learnerId),
      status: 'pending',
    });

    return session.save();
  }

  async findSessions(
    userId: string,
    role: string,
  ): Promise<MentorshipSession[]> {
    const query: any = {};
    if (role === 'mentor') {
      query.mentorId = new Types.ObjectId(userId);
    } else {
      query.learnerId = new Types.ObjectId(userId);
    }

    return this.sessionModel
      .find(query)
      .populate('mentorId', 'name email avatarUrl')
      .populate('learnerId', 'name email avatarUrl')
      .sort({ scheduledAt: -1 })
      .exec();
  }

  async updateSessionStatus(
    id: string,
    dto: UpdateSessionStatusDto,
    userId: string,
  ): Promise<MentorshipSession> {
    const session = await this.sessionModel.findById(id);
    if (!session) {
      throw new NotFoundException(`Session not found`);
    }

    // Verify ownership
    const isMentor = session.mentorId.toString() === userId;
    const isLearner = session.learnerId.toString() === userId;
    if (!isMentor && !isLearner) {
      throw new BadRequestException('Unauthorized to modify this session');
    }

    // Implement status lifecycle constraints
    if (dto.status === 'accepted' || dto.status === 'rejected') {
      if (!isMentor)
        throw new BadRequestException(
          'Only mentors can accept/reject bookings',
        );
      if (session.status !== 'pending')
        throw new BadRequestException(
          'Can only accept/reject pending sessions',
        );
    }

    if (dto.status === 'completed') {
      if (!isMentor)
        throw new BadRequestException(
          'Only mentors can mark sessions as completed',
        );
      if (session.status !== 'accepted')
        throw new BadRequestException('Can only complete accepted sessions');
      session.feedback = dto.feedback;
    }

    if (dto.status === 'cancelled') {
      if (session.status === 'completed' || session.status === 'rejected') {
        throw new BadRequestException('Cannot cancel finalised sessions');
      }
    }

    session.status = dto.status;
    return session.save();
  }

  // ───────────────────────────── Ratings ─────────────────────────────

  async rateMentor(
    sessionId: string,
    dto: RateMentorDto,
    learnerId: string,
  ): Promise<MentorRating> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Mentorship session not found`);
    }
    if (session.learnerId.toString() !== learnerId) {
      throw new BadRequestException(
        'Only the booking learner can review this session',
      );
    }
    if (session.status !== 'completed') {
      throw new BadRequestException('Can only rate completed sessions');
    }

    const existingRating = await this.ratingModel.findOne({
      sessionId: new Types.ObjectId(sessionId),
    });
    if (existingRating) {
      throw new BadRequestException('This session has already been rated');
    }

    const overallRating =
      (dto.quality + dto.helpfulness + dto.expertise + dto.communication) / 4;

    const rating = new this.ratingModel({
      review: dto.review,
      aspects: {
        quality: dto.quality,
        helpfulness: dto.helpfulness,
        expertise: dto.expertise,
        communication: dto.communication,
      },
      mentorId: session.mentorId,
      learnerId: new Types.ObjectId(learnerId),
      sessionId: new Types.ObjectId(sessionId),
      rating: overallRating,
    });

    await rating.save();

    // Recalculate average rating for mentor
    const allRatings = await this.ratingModel.find({
      mentorId: session.mentorId,
    });
    const count = allRatings.length;
    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / count;

    await this.profileModel.updateOne(
      { userId: session.mentorId },
      { rating: parseFloat(avg.toFixed(2)), ratingCount: count },
    );

    return rating;
  }
}
