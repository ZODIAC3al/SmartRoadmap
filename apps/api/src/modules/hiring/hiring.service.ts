import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job } from '../../schemas/job.schema';
import { JobApplication } from '../../schemas/job-application.schema';
import { User } from '../../schemas/user.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { QuizSession } from '../../schemas/quiz-session.schema';
import { Cv } from '../../schemas/cv.schema';
import { RAGService, JOBS_COLLECTION } from '../../ai/rag.service';
import { EmbeddingService } from '../../ai/embedding.service';
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/hiring.dto';

@Injectable()
export class HiringService implements OnModuleInit {
  private readonly logger = new Logger(HiringService.name);

  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<Job>,
    @InjectModel(JobApplication.name) private readonly applicationModel: Model<JobApplication>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(QuizSession.name)
    private readonly quizSessionModel: Model<QuizSession>,
    @InjectModel(Cv.name) private readonly cvModel: Model<Cv>,
    private readonly config: ConfigService,
    private readonly ragService: RAGService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Seeding moved out of the constructor into the lifecycle hook (a constructor
   * must never fire un-awaited DB writes), and disabled in production so fake
   * job listings never reach real users.
   */
  async onModuleInit(): Promise<void> {
    const allowSeed =
      this.config.get('SEED_DEMO_CONTENT') === 'true' ||
      this.config.get('NODE_ENV') !== 'production';
    if (allowSeed) await this.seedMockJobs();
  }

  private async seedMockJobs() {
    try {
      const count = await this.jobModel.countDocuments();
      if (count === 0) {
        this.logger.log('Seeding mock job descriptions to database...');
        const saved = await this.jobModel.insertMany([
          {
            title: 'Frontend Engineer (React & TypeScript)',
            company: 'Lattice HR',
            location: 'Remote',
            country: 'US',
            requiredSkills: ['HTML/CSS', 'JavaScript', 'React', 'TypeScript', 'Git'],
            technologies: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
            salaryMin: 80000,
            salaryMax: 110000,
            remote: true,
            workType: 'remote',
            jobType: 'full-time',
            experienceLevel: 'mid',
            description:
              'Join our premium product team to build and design stunning human-resource workflow visualizations. Requires strong experience in React and TypeScript design tokens.',
            postedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          },
          {
            title: 'NodeJS Backend Developer',
            company: 'Osome Services',
            location: 'Singapore',
            country: 'SG',
            requiredSkills: ['JavaScript', 'TypeScript', 'Node.js', 'SQL', 'Docker', 'Git'],
            technologies: ['NestJS', 'MongoDB', 'Docker', 'PostgreSQL'],
            salaryMin: 70000,
            salaryMax: 95000,
            remote: true,
            workType: 'hybrid',
            jobType: 'full-time',
            experienceLevel: 'mid',
            description:
              'Help build scalable accounting microservices, integrate MongoDB, design secure authentication pipelines, and deploy using containerized Docker engines.',
            postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            title: 'Full Stack Engineer',
            company: 'Developia Dev',
            location: 'Cairo',
            country: 'EG',
            requiredSkills: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
            technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
            salaryMin: 25000,
            salaryMax: 40000,
            remote: false,
            workType: 'onsite',
            jobType: 'full-time',
            experienceLevel: 'entry',
            description:
              'We are seeking a generalist software developer to help support client websites. Work across React frontends and Node/Mongoose API layers.',
            postedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
          },
          {
            title: 'Data & Analytics Engineer',
            company: 'Twilio Segment Inc.',
            location: 'New York',
            country: 'US',
            requiredSkills: ['Python', 'SQL', 'Git', 'Docker'],
            technologies: ['Python', 'Qdrant', 'PostgreSQL', 'Apache Kafka'],
            salaryMin: 95000,
            salaryMax: 130000,
            remote: true,
            workType: 'remote',
            jobType: 'full-time',
            experienceLevel: 'senior',
            description:
              'Maintain vector database connections (Qdrant), orchestrate ETL data pipelines in Python, and align client event streams dynamically.',
            postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Next.js Product Engineer',
            company: 'Linear App SAS',
            location: 'Paris',
            country: 'FR',
            requiredSkills: ['React', 'TypeScript', 'Next.js', 'CSS'],
            technologies: ['Next.js', 'TypeScript', 'GraphQL', 'Linear SDK'],
            salaryMin: 90000,
            salaryMax: 120000,
            remote: false,
            workType: 'hybrid',
            jobType: 'full-time',
            experienceLevel: 'mid',
            description:
              'Join our client interface team to build fast keyboard-driven features. Focus on design tokens alignment and clean, type-safe API consumption.',
            postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'React Prototyping Engineer',
            company: 'Vercel, Inc.',
            location: 'Remote',
            country: 'US',
            requiredSkills: ['React', 'Next.js', 'JavaScript', 'Docker'],
            technologies: ['Next.js', 'Vercel Edge', 'React Server Components'],
            salaryMin: 110000,
            salaryMax: 135000,
            remote: true,
            workType: 'remote',
            jobType: 'full-time',
            experienceLevel: 'senior',
            description:
              'Seeking a developer focused on rendering pipeline optimization and edge-computing templates. Docker configuration experience is nice to have.',
            postedAt: new Date(Date.now() - 30 * 60 * 1000),
          },
        ]);
        for (const job of saved) {
          await this.indexJob(job);
        }
      }
    } catch (e) {
      this.logger.error('Failed seeding jobs', e);
    }
  }

  async indexJob(job: Job): Promise<void> {
    try {
      await this.ragService.upsert(JOBS_COLLECTION, [{
        id: job._id.toString(),
        text: `${job.title} at ${job.company}. Skills: ${job.requiredSkills.join(', ')}. ${job.description}`,
        payload: {
          jobId: job._id.toString(),
          title: job.title,
          company: job.company,
          location: job.location,
          country: job.country,
          requiredSkills: job.requiredSkills,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          remote: job.remote,
          description: job.description
        }
      }]);
    } catch (err: any) {
      this.logger.error(`Failed to index job ${job._id} dynamically: ${err.message}`);
    }
  }

  async createJob(jobData: any): Promise<Job> {
    const job = new this.jobModel(jobData);
    const saved = await job.save();
    await this.indexJob(saved);
    return saved;
  }

  async getJobs(): Promise<Job[]> {
    return this.jobModel.find().sort({ createdAt: -1 });
  }

  async matchJobsForLearner(userId: string): Promise<any[]> {
    this.logger.log(`Matching jobs for learner ID: ${userId}`);

    // 1. Fetch user active roadmap to identify completed modules (verified skills)
    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    const verifiedSkills: string[] = [];
    if (roadmap) {
      roadmap.modules.forEach((mod) => {
        if (mod.status === 'completed') {
          // Add module title and topics to verified skills
          verifiedSkills.push(mod.title.toLowerCase());
          mod.topics.forEach((t) => verifiedSkills.push(t.toLowerCase()));
        }
      });
    }

    // 2. Fetch all jobs
    const jobs = await this.jobModel.find();

    // 3. Score overlap
    const scoredJobs = jobs.map((job) => {
      const requirements = job.requiredSkills.map((s) => s.toLowerCase());
      if (requirements.length === 0) {
        return { job, matchScore: 100, skillsGap: [] };
      }

      const matching = requirements.filter((req) => {
        // Match either exact skills tags or key substrings
        return verifiedSkills.some((v) => v.includes(req) || req.includes(v));
      });

      const matchPercent = Math.round(
        (matching.length / requirements.length) * 100,
      );
      const skillsGap = job.requiredSkills.filter((req) => {
        return !verifiedSkills.some(
          (v) => v.includes(req.toLowerCase()) || req.toLowerCase().includes(v),
        );
      });

      return {
        _id: job._id.toString(),
        title: job.title,
        company: job.company,
        location: job.location,
        country: job.country,
        requiredSkills: job.requiredSkills,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        remote: job.remote,
        description: job.description,
        matchScore: matchPercent,
        skillsGap,
      };
    });

    // Sort by match score descending
    return scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
  }

  async matchJobsSemantic(userId: string, limit = 5): Promise<any[]> {
    this.logger.log(`Matching jobs semantically for user ID: ${userId}`);

    if (!this.ragService.client) {
      this.logger.warn('Qdrant client not available. Falling back to keyword overlap matching.');
      return this.matchJobsForLearner(userId);
    }

    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    const verifiedSkills: string[] = [];
    if (roadmap) {
      roadmap.modules.forEach((mod) => {
        if (mod.status === 'completed') {
          verifiedSkills.push(mod.title.toLowerCase());
          mod.topics.forEach((t) => verifiedSkills.push(t.toLowerCase()));
        }
      });
    }

    const cv = await this.cvModel.findOne({ userId: new Types.ObjectId(userId) });

    const skillsPool = Array.from(new Set([
      ...verifiedSkills,
      ...(cv?.skills || []).map((s: string) => s.toLowerCase()),
    ]));

    const profileSummary = cv?.personal?.summary || '';
    const experienceSummary = (cv?.experience || []).map((e: any) => `${e.role} at ${e.company}: ${e.description}`).join('; ');

    const profileText = `Learner Profile:
    Target Career: ${roadmap?.targetRole || 'Software Development'}
    Skills: ${skillsPool.join(', ')}
    Summary: ${profileSummary}
    Experience: ${experienceSummary}`;

    try {
      const vector = await this.embeddingService.embed(profileText);
      const results = await this.ragService.client.search(JOBS_COLLECTION, {
        vector,
        limit,
        with_payload: true,
      });

      const matchedJobs = results.map((hit) => {
        const payload = hit.payload as any;
        const requirements = (payload.requiredSkills || []).map((s: string) => s.toLowerCase());

        const matching = requirements.filter((req: string) =>
          skillsPool.some((s: string) => s.includes(req) || req.includes(s))
        );

        const missingSkills = (payload.requiredSkills || []).filter((req: string) =>
          !skillsPool.some((s: string) => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))
        );

        return {
          _id: payload.jobId,
          title: payload.title,
          company: payload.company,
          location: payload.location,
          country: payload.country,
          requiredSkills: payload.requiredSkills,
          salaryMin: payload.salaryMin,
          salaryMax: payload.salaryMax,
          remote: payload.remote,
          description: payload.description,
          matchScore: Math.round((hit.score ?? 0) * 100),
          matchingSkills: matching,
          skillsGap: missingSkills,
        };
      });

      return matchedJobs.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error: any) {
      this.logger.error(`Semantic job search query failed: ${error.message}. Falling back to keyword match.`);
      return this.matchJobsForLearner(userId);
    }
  }

  /**
   * Gap analysis → roadmap.
   *
   * "You're a 78% match for this job; you're missing Docker and CI" is only useful
   * if the learner can act on it. This folds the missing skills straight into their
   * active roadmap as new modules.
   */
  async closeSkillGap(userId: string, jobId: string): Promise<any> {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException(`Job not found: ${jobId}`);

    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    if (!roadmap) {
      throw new NotFoundException(
        'You need an active roadmap before closing a skill gap.',
      );
    }

    const verified = new Set<string>();
    roadmap.modules.forEach((mod) => {
      if (mod.status === 'completed') {
        verified.add(mod.title.toLowerCase());
        mod.topics.forEach((t) => verified.add(t.toLowerCase()));
      }
    });

    const gap = job.requiredSkills.filter((skill) => {
      const s = skill.toLowerCase();
      const alreadyKnown = [...verified].some(
        (v) => v.includes(s) || s.includes(v),
      );
      const alreadyPlanned = roadmap.modules.some(
        (m) =>
          m.title.toLowerCase() === s ||
          m.topics.some((t) => t.toLowerCase() === s),
      );
      return !alreadyKnown && !alreadyPlanned;
    });

    if (gap.length === 0) {
      return {
        success: true,
        added: [],
        message:
          'No gap left — your roadmap already covers everything this job asks for.',
      };
    }

    let x = 300;
    gap.forEach((skill) => {
      roadmap.modules.push({
        id: `gap-${skill.toLowerCase().replace(/\s+/g, '-')}`,
        title: skill,
        description: `Added to close the skill gap for "${job.title}" at ${job.company}.`,
        difficulty: 'intermediate',
        estimatedHours: 8,
        topics: [skill],
        prerequisites: [],
        status: 'in_progress',
        positionX: x,
        positionY: 340,
      } as any);
      x += 200;
    });

    roadmap.markModified('modules');
    await roadmap.save();

    this.logger.log(
      `Added ${gap.length} gap module(s) for user ${userId} (job ${jobId})`,
    );
    return {
      success: true,
      added: gap,
      jobTitle: job.title,
      message: `Added ${gap.length} module(s) to your roadmap.`,
    };
  }

  // ── Application Pipeline Methods ────────────────────────────────────────────

  async getApplicationsForUser(userId: string): Promise<JobApplication[]> {
    return this.applicationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getApplicationByJobId(userId: string, jobId: string): Promise<JobApplication | null> {
    return this.applicationModel.findOne({
      userId: new Types.ObjectId(userId),
      jobId,
    }).exec();
  }

  async upsertApplication(
    userId: string,
    dto: CreateApplicationDto,
  ): Promise<JobApplication> {
    const existing = await this.applicationModel.findOne({
      userId: new Types.ObjectId(userId),
      jobId: dto.jobId,
    });

    if (existing) {
      // If moving from interested → applied, set appliedAt
      if (dto.status === 'applied' && existing.status === 'interested') {
        existing.appliedAt = new Date();
      }
      // Allow status upgrade but block downgrade of applied to interested
      if (existing.status === 'applied' && dto.status === 'interested') {
        throw new ConflictException('Cannot revert status from applied to interested.');
      }
      Object.assign(existing, {
        status: dto.status || existing.status,
        cvId: dto.cvId || existing.cvId,
        cvTitle: dto.cvTitle || existing.cvTitle,
        matchScore: dto.matchScore ?? existing.matchScore,
        notes: dto.notes ?? existing.notes,
      });
      return existing.save();
    }

    const app = new this.applicationModel({
      userId: new Types.ObjectId(userId),
      jobId: dto.jobId,
      jobTitle: dto.jobTitle,
      company: dto.company,
      cvId: dto.cvId,
      cvTitle: dto.cvTitle,
      matchScore: dto.matchScore ?? 0,
      status: dto.status || 'interested',
      notes: dto.notes,
      appliedAt: dto.status === 'applied' ? new Date() : undefined,
    });
    return app.save();
  }

  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<JobApplication> {
    const app = await this.applicationModel.findOne({
      _id: applicationId,
      userId: new Types.ObjectId(userId),
    });
    if (!app) throw new NotFoundException('Application not found.');

    app.status = dto.status;
    if (dto.notes !== undefined) app.notes = dto.notes;
    if (dto.status === 'applied' && !app.appliedAt) app.appliedAt = new Date();
    return app.save();
  }

  // ────────────────────────────────────────────────────────────────────────────

  async getCandidates(): Promise<any[]> {
    this.logger.log(
      'Fetching pre-vetted candidates pipeline for company portal',
    );

    // 1. Fetch all users who are learners
    const learners = await this.userModel.find({ role: 'learner' });
    const candidates: any[] = [];

    for (const learner of learners) {
      // Get learner active roadmap
      const roadmap = await this.roadmapModel.findOne({
        userId: learner._id,
        status: 'active',
      });

      // Get quiz sessions to compute averages
      const quizSessions = await this.quizSessionModel.find({
        userId: learner._id,
        status: 'completed',
      });

      // Get CV if uploaded
      const userCv = await this.cvModel.findOne({ userId: learner._id });

      const completedCount = roadmap
        ? roadmap.modules.filter((m) => m.status === 'completed').length
        : 0;
      const totalCount = roadmap ? roadmap.modules.length : 0;

      const verifiedSkills: string[] = [];
      if (roadmap) {
        roadmap.modules.forEach((m) => {
          if (m.status === 'completed') {
            verifiedSkills.push(m.title);
          }
        });
      }

      let totalQuizScore = 0;
      let passedQuizCount = 0;
      quizSessions.forEach((q) => {
        if (q.score !== null && q.score !== undefined) {
          totalQuizScore += q.score;
        }
        if (q.passed) {
          passedQuizCount++;
        }
      });

      const averageScore =
        quizSessions.length > 0
          ? Math.round(totalQuizScore / quizSessions.length)
          : null;

      candidates.push({
        userId: learner._id.toString(),
        name: learner.name,
        email: learner.email,
        targetRole: roadmap ? roadmap.targetRole : 'Not Defined Yet',
        progress:
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        completedMilestones: completedCount,
        verifiedSkills,
        averageQuizScore: averageScore,
        quizzesPassed: passedQuizCount,
        cvUploaded: !!userCv,
      });
    }

    return candidates;
  }
}
