import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { TrackCertification } from '../../schemas/track-certification.schema';
import { Certificate } from '../../schemas/certificate.schema';
import { Project } from '../../schemas/project.schema';
import { CompanyProfile } from '../../schemas/company-profile.schema';
import { SavedSearch } from '../../schemas/saved-search.schema';
import { Subscription } from '../../schemas/subscription.schema';
import { RAGService, JOBS_COLLECTION } from '../../ai/rag.service';
import { EmbeddingService } from '../../ai/embedding.service';
import { AiGatewayService } from '../../ai/gateway/ai-gateway.service';
import type { JwtUser } from '../../common/decorators/current-user.decorator';
import { AppCacheService } from '../../common/cache/app-cache.service';
import {
  ApplicationStatus,
  CreateApplicationDto,
  CreateJobDto,
  UpdateApplicationStatusDto,
} from './dto/hiring.dto';

@Injectable()
export class HiringService implements OnModuleInit {
  private readonly logger = new Logger(HiringService.name);

  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<Job>,
    @InjectModel(JobApplication.name)
    private readonly applicationModel: Model<JobApplication>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(QuizSession.name)
    private readonly quizSessionModel: Model<QuizSession>,
    @InjectModel(Cv.name) private readonly cvModel: Model<Cv>,
    @InjectModel(TrackCertification.name)
    private readonly trackCertModel: Model<TrackCertification>,
    @InjectModel(Certificate.name)
    private readonly certModel: Model<Certificate>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(CompanyProfile.name)
    private readonly companyProfileModel: Model<CompanyProfile>,
    @InjectModel(SavedSearch.name)
    private readonly savedSearchModel: Model<SavedSearch>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
    private readonly config: ConfigService,
    private readonly ragService: RAGService,
    private readonly embeddingService: EmbeddingService,
    private readonly cache: AppCacheService,
    private readonly aiGateway: AiGatewayService,
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
            requiredSkills: [
              'HTML/CSS',
              'JavaScript',
              'React',
              'TypeScript',
              'Git',
            ],
            technologies: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
            salaryMin: 80000,
            salaryMax: 110000,
            remote: true,
            description:
              'Join our premium product team to build and design stunning human-resource workflow visualizations. Requires strong experience in React and TypeScript design tokens.',
          },
          {
            title: 'NodeJS Backend Developer',
            company: 'Osome Services',
            location: 'Singapore',
            country: 'SG',
            requiredSkills: [
              'JavaScript',
              'TypeScript',
              'Node.js',
              'SQL',
              'Docker',
              'Git',
            ],
            technologies: ['NestJS', 'MongoDB', 'Docker', 'PostgreSQL'],
            salaryMin: 70000,
            salaryMax: 95000,
            remote: true,
            description:
              'Help build scalable accounting microservices, integrate MongoDB, design secure authentication pipelines, and deploy using containerized Docker engines.',
          },
          {
            title: 'Full Stack Engineer',
            company: 'Developia Dev',
            location: 'Cairo',
            country: 'EG',
            requiredSkills: [
              'HTML/CSS',
              'JavaScript',
              'React',
              'Node.js',
              'SQL',
              'Git',
            ],
            technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
            salaryMin: 25000,
            salaryMax: 40000,
            remote: false,
            description:
              'We are seeking a generalist software developer to help support client websites. Work across React frontends and Node/Mongoose API layers.',
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
            description:
              'Maintain vector database connections (Qdrant), orchestrate ETL data pipelines in Python, and align client event streams dynamically.',
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
      await this.ragService.upsert(JOBS_COLLECTION, [
        {
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
            description: job.description,
          },
        },
      ]);
    } catch (err: any) {
      this.logger.error(
        `Failed to index job ${job._id} dynamically: ${err.message}`,
      );
    }
  }

  async createJob(user: JwtUser, jobData: CreateJobDto): Promise<Job> {
    let companyName = jobData.company;
    let companyId: Types.ObjectId | undefined;

    if (user?.sub) {
      const companyProfile = await this.companyProfileModel.findOne({
        userId: new Types.ObjectId(user.sub),
      });
      if (companyProfile) {
        companyId = companyProfile.userId;
        if (!companyName) companyName = companyProfile.companyName;
      }
    }

    const job = new this.jobModel({
      ...jobData,
      company: companyName || jobData.company || 'Tech Employer',
      createdBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
      companyId:
        companyId || (user?.sub ? new Types.ObjectId(user.sub) : undefined),
      postedAt: new Date(),
    });

    const saved = await job.save();
    await this.indexJob(saved);
    return saved;
  }

  async getJobs(filters?: any): Promise<Job[]> {
    const query: any = {};
    if (filters?.search) {
      const s = String(filters.search).trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { company: { $regex: s, $options: 'i' } },
        { requiredSkills: { $regex: s, $options: 'i' } },
        { technologies: { $regex: s, $options: 'i' } },
      ];
    }
    if (filters?.workType && filters.workType !== 'all') {
      query.workType = filters.workType;
    }
    if (filters?.jobType && filters.jobType !== 'all') {
      query.jobType = filters.jobType;
    }
    if (filters?.experienceLevel && filters.experienceLevel !== 'all') {
      query.experienceLevel = filters.experienceLevel;
    }
    return this.jobModel
      .find(query)
      .sort({ postedAt: -1, createdAt: -1 })
      .exec();
  }

  async getJobById(jobId: string): Promise<Job> {
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) throw new NotFoundException(`Job #${jobId} not found.`);
    return job;
  }

  async getMyJobs(userId: string): Promise<Job[]> {
    const userObjId = new Types.ObjectId(userId);
    return this.jobModel
      .find({
        $or: [{ createdBy: userObjId }, { companyId: userObjId }],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async deleteJob(user: JwtUser, jobId: string): Promise<{ success: boolean }> {
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) throw new NotFoundException('Job not found.');

    if (
      user.role !== 'admin' &&
      job.createdBy?.toString() !== user.sub &&
      job.companyId?.toString() !== user.sub
    ) {
      throw new ForbiddenException('You can only delete jobs you have posted.');
    }

    await this.jobModel.findByIdAndDelete(jobId).exec();
    return { success: true };
  }

  private normalizeSkill(s: string): string {
    return (s || '').toLowerCase().trim().replace(/[-_/]/g, ' ');
  }

  private async collectLearnerSkillsPool(userId: string): Promise<{
    skills: string[];
    verifiedSkills: string[];
    roadmap: any;
    quizSessions: any[];
    trackCertifications: any[];
    verifiedCertificates: any[];
    projects: any[];
    cv: any;
    user: any;
  }> {
    const userObjId = new Types.ObjectId(userId);
    const [
      user,
      roadmap,
      quizSessions,
      trackCertifications,
      verifiedCertificates,
      projects,
      cv,
    ] = await Promise.all([
      this.userModel.findById(userObjId).lean().exec(),
      this.roadmapModel
        .findOne({ userId: userObjId, status: 'active' })
        .lean()
        .exec(),
      this.quizSessionModel
        .find({ userId: userObjId, status: 'completed' })
        .lean()
        .exec(),
      this.trackCertModel.find({ userId: userObjId }).lean().exec(),
      this.certModel
        .find({ userId: userObjId, status: 'Verified' })
        .lean()
        .exec(),
      this.projectModel.find({ userId: userObjId }).lean().exec(),
      this.cvModel
        .findOne({ userId: userObjId })
        .sort({ updatedAt: -1 })
        .lean()
        .exec(),
    ]);

    const verifiedSkillsSet = new Set<string>();

    // 1. From completed roadmap modules and their topics
    if (roadmap?.modules) {
      for (const mod of roadmap.modules) {
        if (mod.status === 'completed') {
          if (mod.title) verifiedSkillsSet.add(mod.title);
          if (Array.isArray(mod.topics)) {
            mod.topics.forEach((t: string) => verifiedSkillsSet.add(t));
          }
        }
      }
    }

    // 2. From track certifications
    if (trackCertifications?.length) {
      for (const cert of trackCertifications) {
        if (cert.trackTitle) verifiedSkillsSet.add(cert.trackTitle);
        if (Array.isArray(cert.verifiedSkills)) {
          cert.verifiedSkills.forEach((s: string) => verifiedSkillsSet.add(s));
        }
      }
    }

    // 3. From verified certificates
    if (verifiedCertificates?.length) {
      for (const cert of verifiedCertificates) {
        if (cert.title) verifiedSkillsSet.add(cert.title);
      }
    }

    // 4. From portfolio projects
    if (projects?.length) {
      for (const proj of projects) {
        if (Array.isArray(proj.technologies)) {
          proj.technologies.forEach((tech: string) =>
            verifiedSkillsSet.add(tech),
          );
        }
      }
    }

    // All skills (including unverified CV skills)
    const allSkillsSet = new Set<string>(verifiedSkillsSet);
    if (Array.isArray(cv?.skills)) {
      cv.skills.forEach((s: string) => allSkillsSet.add(s));
    }

    return {
      skills: Array.from(allSkillsSet),
      verifiedSkills: Array.from(verifiedSkillsSet),
      roadmap,
      quizSessions: quizSessions || [],
      trackCertifications: trackCertifications || [],
      verifiedCertificates: verifiedCertificates || [],
      projects: projects || [],
      cv,
      user,
    };
  }

  async matchJobsForLearner(userId: string): Promise<any[]> {
    const cacheKey = `match:jobs:${userId}`;
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(
        `[Cache Hit] Serving cached job match scores for user ${userId}`,
      );
      return cached;
    }

    this.logger.log(`Computing job match scores for learner ID: ${userId}`);

    const { skills } = await this.collectLearnerSkillsPool(userId);
    const normalizedUserSkills = skills.map((s) => this.normalizeSkill(s));

    const jobs = await this.jobModel
      .find()
      .sort({ postedAt: -1, createdAt: -1 })
      .lean()
      .exec();

    const scoredJobs = jobs.map((job) => {
      const required = Array.isArray(job.requiredSkills)
        ? job.requiredSkills
        : [];
      if (required.length === 0) {
        return {
          _id: job._id.toString(),
          title: job.title,
          company: job.company,
          location: job.location,
          country: job.country,
          requiredSkills: required,
          technologies: job.technologies || [],
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          remote: job.remote,
          workType: job.workType,
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          description: job.description,
          externalUrl: job.externalUrl,
          postedAt: job.postedAt || (job as any).createdAt,
          matchScore: 100,
          matchingSkills: [],
          neededSkills: [],
          skillsGap: [],
        };
      }

      const matchingSkills: string[] = [];
      const neededSkills: string[] = [];

      for (const req of required) {
        const normReq = this.normalizeSkill(req);
        const hasSkill = normalizedUserSkills.some(
          (u) => u.includes(normReq) || normReq.includes(u),
        );
        if (hasSkill) {
          matchingSkills.push(req);
        } else {
          neededSkills.push(req);
        }
      }

      const matchPercent = Math.round(
        (matchingSkills.length / required.length) * 100,
      );

      return {
        _id: job._id.toString(),
        title: job.title,
        company: job.company,
        location: job.location,
        country: job.country,
        requiredSkills: required,
        technologies: job.technologies || [],
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        remote: job.remote,
        workType: job.workType,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        description: job.description,
        externalUrl: job.externalUrl,
        postedAt: job.postedAt || (job as any).createdAt,
        matchScore: matchPercent,
        matchingSkills,
        neededSkills,
        skillsGap: neededSkills,
      };
    });

    this.cache.set(cacheKey, scoredJobs, 180); // 3 minutes TTL
    return scoredJobs;
  }

  async matchJobsSemantic(userId: string, limit = 50): Promise<any[]> {
    // Return all matched jobs for the learner without filtering out low-score jobs
    return this.matchJobsForLearner(userId);
  }

  /**
   * Needed skills analysis for a job without mutating the user's Roadmap.
   */
  async closeSkillGap(userId: string, jobId: string): Promise<any> {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException(`Job not found: ${jobId}`);

    const { skills } = await this.collectLearnerSkillsPool(userId);
    const normalizedUserSkills = skills.map((s) => this.normalizeSkill(s));

    const neededSkills = (job.requiredSkills || []).filter((req) => {
      const normReq = this.normalizeSkill(req);
      return !normalizedUserSkills.some(
        (u) => u.includes(normReq) || normReq.includes(u),
      );
    });

    return {
      success: true,
      neededSkills,
      matchingSkills: (job.requiredSkills || []).filter(
        (req) => !neededSkills.includes(req),
      ),
      jobTitle: job.title,
      company: job.company,
      message:
        neededSkills.length > 0
          ? `Identified ${neededSkills.length} needed skills for ${job.title}.`
          : 'You already possess all required skills for this position!',
    };
  }

  async getCandidates(): Promise<any[]> {
    this.logger.log(
      'Fetching pre-vetted candidates pipeline for company portal',
    );

    const learners = await this.userModel
      .find({ role: 'learner' })
      .lean()
      .exec();
    const candidates: any[] = [];

    for (const learner of learners) {
      const learnerId = learner._id.toString();
      const pool = await this.collectLearnerSkillsPool(learnerId);

      const completedCount = pool.roadmap?.modules
        ? pool.roadmap.modules.filter((m: any) => m.status === 'completed')
            .length
        : 0;
      const totalCount = pool.roadmap?.modules?.length || 0;

      let totalQuizScore = 0;
      let passedQuizCount = 0;
      pool.quizSessions.forEach((q) => {
        if (q.score !== null && q.score !== undefined)
          totalQuizScore += q.score;
        if (q.passed) passedQuizCount++;
      });

      const averageScore =
        pool.quizSessions.length > 0
          ? Math.round(totalQuizScore / pool.quizSessions.length)
          : null;

      candidates.push({
        userId: learnerId,
        name: learner.name,
        email: learner.email,
        avatarUrl: learner.avatarUrl,
        targetRole: pool.roadmap?.targetRole || 'Software Professional',
        progress:
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        completedMilestones: completedCount,
        verifiedSkills: pool.verifiedSkills,
        averageQuizScore: averageScore,
        quizzesPassed: passedQuizCount,
        cvUploaded: !!pool.cv,
        certificationsCount:
          pool.trackCertifications.length + pool.verifiedCertificates.length,
        projectsCount: pool.projects.length,
      });
    }

    return candidates;
  }

  private normalizeApplicationStatus(status?: string): ApplicationStatus {
    if (!status) return 'Applied';
    const lower = status.toLowerCase().trim();
    if (lower === 'applied' || lower === 'interested') return 'Applied';
    if (
      lower === 'interview' ||
      lower === 'interviewing' ||
      lower === 'under_review'
    )
      return 'Interviewing';
    if (lower === 'accepted' || lower === 'offer' || lower === 'hired')
      return 'Accepted';
    if (lower === 'rejected') return 'Rejected';
    return 'Applied';
  }

  async upsertApplication(
    userId: string,
    dto: CreateApplicationDto,
  ): Promise<JobApplication> {
    const userObjId = new Types.ObjectId(userId);
    const job = await this.jobModel.findById(dto.jobId).exec();
    if (!job) throw new NotFoundException(`Job #${dto.jobId} not found.`);

    const existing = await this.applicationModel
      .findOne({
        userId: userObjId,
        jobId: dto.jobId,
      })
      .exec();

    // If application already submitted, avoid duplicates
    if (existing) {
      return existing;
    }

    // 1. Compile full CV snapshot
    let cvRecord: any = null;
    if (dto.cvId && Types.ObjectId.isValid(dto.cvId)) {
      cvRecord = await this.cvModel
        .findOne({ _id: new Types.ObjectId(dto.cvId), userId: userObjId })
        .lean()
        .exec();
    }
    if (!cvRecord) {
      cvRecord = await this.cvModel
        .findOne({ userId: userObjId })
        .sort({ updatedAt: -1 })
        .lean()
        .exec();
    }

    const cvSnapshot =
      dto.cvSnapshot ||
      (cvRecord
        ? {
            title: cvRecord.title || 'Career Resume',
            personal: cvRecord.personal,
            experience: cvRecord.experience || [],
            education: cvRecord.education || [],
            skills: cvRecord.skills || [],
            projects: cvRecord.projects || [],
            certifications: cvRecord.certifications || [],
            languages: cvRecord.languages || [],
            summary: cvRecord.personal?.summary || '',
            updatedAt: cvRecord.updatedAt,
          }
        : null);

    // 2. Compile comprehensive Skill Passport snapshot
    const learnerPool = await this.collectLearnerSkillsPool(userId);
    const completedCount = learnerPool.roadmap?.modules
      ? learnerPool.roadmap.modules.filter((m: any) => m.status === 'completed')
          .length
      : 0;
    const totalCount = learnerPool.roadmap?.modules?.length || 0;

    let totalQuizScore = 0;
    let passedCount = 0;
    learnerPool.quizSessions.forEach((q) => {
      if (q.score !== null && q.score !== undefined) totalQuizScore += q.score;
      if (q.passed) passedCount++;
    });

    const passportSnapshot = dto.passportSnapshot || {
      name: learnerPool.user?.name || 'Applicant',
      email: learnerPool.user?.email || '',
      avatarUrl: learnerPool.user?.avatarUrl,
      targetRole: learnerPool.roadmap?.targetRole || 'Software Engineer',
      verifiedSkills: learnerPool.verifiedSkills,
      allSkills: learnerPool.skills,
      roadmap: {
        title: learnerPool.roadmap?.title,
        targetRole: learnerPool.roadmap?.targetRole,
        totalModules: totalCount,
        completedMilestones: completedCount,
        progressPercentage:
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      },
      quizPerformance: {
        totalQuizzes: learnerPool.quizSessions.length,
        quizzesPassed: passedCount,
        averageScore:
          learnerPool.quizSessions.length > 0
            ? Math.round(totalQuizScore / learnerPool.quizSessions.length)
            : null,
      },
      verifiedCertifications: learnerPool.trackCertifications
        .map((c) => ({
          trackTitle: c.trackTitle,
          certificateId: c.certificateId,
          issuedAt: c.createdAt,
          verifiedSkills: c.verifiedSkills,
        }))
        .concat(
          learnerPool.verifiedCertificates.map((vc) => ({
            trackTitle: vc.title,
            certificateId: vc.credentialId || vc._id?.toString(),
            issuedAt: vc.createdAt,
            verifiedSkills: [],
          })),
        ),
      projects: learnerPool.projects.map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies || [],
        githubUrl: p.githubUrl,
        demoLink: p.demoLink,
        source: p.source,
      })),
      capturedAt: new Date(),
    };

    // Calculate real match score
    const normUserSkills = learnerPool.skills.map((s) =>
      this.normalizeSkill(s),
    );
    const reqs = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
    const matching = reqs.filter((r) =>
      normUserSkills.some(
        (u) =>
          u.includes(this.normalizeSkill(r)) ||
          this.normalizeSkill(r).includes(u),
      ),
    );
    const calculatedMatch =
      reqs.length > 0 ? Math.round((matching.length / reqs.length) * 100) : 100;

    const initialStatus: ApplicationStatus = 'Applied';

    const newApp = new this.applicationModel({
      userId: userObjId,
      jobId: job._id.toString(),
      jobTitle: job.title,
      company: job.company,
      companyId: job.createdBy || job.companyId,
      cvId: cvRecord?._id?.toString() || dto.cvId,
      cvTitle: cvRecord?.title || dto.cvTitle || 'Verified Resume',
      cvSnapshot,
      passportSnapshot,
      matchScore: dto.matchScore ?? calculatedMatch,
      status: initialStatus,
      notes: dto.notes,
      appliedAt: new Date(),
      statusHistory: [
        {
          status: initialStatus,
          changedBy:
            learnerPool.user?.name || learnerPool.user?.email || 'Applicant',
          changedAt: new Date(),
          notes:
            dto.notes ||
            'Application submitted with verified Skill Passport and CV.',
        },
      ],
    });

    return newApp.save();
  }

  async getApplicationsForUser(userId: string): Promise<JobApplication[]> {
    return this.applicationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1, updatedAt: -1 })
      .exec();
  }

  async getApplicationByJobId(
    userId: string,
    jobId: string,
  ): Promise<JobApplication | null> {
    return this.applicationModel
      .findOne({
        userId: new Types.ObjectId(userId),
        jobId,
      })
      .exec();
  }

  async getApplicationById(
    user: JwtUser,
    applicationId: string,
  ): Promise<JobApplication> {
    const app = await this.applicationModel
      .findById(applicationId)
      .populate('userId', 'name email avatarUrl role')
      .exec();
    if (!app) throw new NotFoundException('Application not found.');

    const isApplicant =
      app.userId?.toString() === user.sub ||
      (app.userId as any)?._id?.toString() === user.sub;
    const isAdmin = user.role === 'admin';
    const isEmployer = user.role === 'company';

    if (!isApplicant && !isAdmin && !isEmployer) {
      throw new ForbiddenException(
        'You do not have access to view this application.',
      );
    }

    return app;
  }

  async getApplicationsForCompany(
    user: JwtUser,
    jobId?: string,
  ): Promise<JobApplication[]> {
    if (user.role === 'admin') {
      const query: any = {};
      if (jobId) query.jobId = jobId;
      return this.applicationModel
        .find(query)
        .sort({ createdAt: -1 })
        .populate('userId', 'name email avatarUrl')
        .exec();
    }

    if (user.role !== 'company') {
      throw new ForbiddenException(
        'Only company or admin profiles can access received applications.',
      );
    }

    const companyUserObjId = new Types.ObjectId(user.sub);
    const companyProfile = await this.companyProfileModel
      .findOne({ userId: companyUserObjId })
      .lean()
      .exec();
    const companyJobs = await this.jobModel
      .find({
        $or: [{ createdBy: companyUserObjId }, { companyId: companyUserObjId }],
      })
      .lean()
      .exec();

    const jobIds = companyJobs.map((j) => j._id.toString());
    const companyName = companyProfile?.companyName;

    const orClauses: any[] = [
      { companyId: companyUserObjId },
      { jobId: { $in: jobIds } },
    ];
    if (companyName) {
      orClauses.push({
        company: { $regex: new RegExp(`^${companyName}$`, 'i') },
      });
    }

    const query: any = { $or: orClauses };
    if (jobId) {
      query.jobId = jobId;
    }

    return this.applicationModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email avatarUrl')
      .exec();
  }

  async updateApplicationStatus(
    user: JwtUser,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<JobApplication> {
    const app = await this.applicationModel.findById(applicationId).exec();
    if (!app) throw new NotFoundException('Application not found.');

    // ── STRICT AUTHORIZATION: Only Job Owner or Admin can update status! ──
    const isAdmin = user.role === 'admin';
    const isCompany = user.role === 'company';

    if (!isAdmin && !isCompany) {
      throw new ForbiddenException(
        'You are not authorized to update application statuses. Only the hiring company or an admin can make status changes.',
      );
    }

    if (isCompany && !isAdmin) {
      const isOwner =
        app.companyId?.toString() === user.sub ||
        (await this.jobModel.exists({
          _id: app.jobId,
          createdBy: new Types.ObjectId(user.sub),
        }));

      if (!isOwner) {
        const companyProfile = await this.companyProfileModel
          .findOne({ userId: new Types.ObjectId(user.sub) })
          .lean()
          .exec();
        const matchesName =
          companyProfile?.companyName &&
          app.company.toLowerCase() ===
            companyProfile.companyName.toLowerCase();
        if (!matchesName) {
          throw new ForbiddenException(
            'You can only update applications for jobs posted by your organization.',
          );
        }
      }
    }

    const targetStatus = this.normalizeApplicationStatus(dto.status);

    app.status = targetStatus;
    if (dto.notes !== undefined) app.notes = dto.notes;

    if (!app.statusHistory) app.statusHistory = [];
    app.statusHistory.push({
      status: targetStatus,
      changedBy: user.email || user.role,
      changedAt: new Date(),
      notes: dto.notes || `Status updated to ${targetStatus}`,
    });

    return app.save();
  }

  // ── Saved Searches & Analytics ─────────────────────────────────────────────

  async createSavedSearch(user: JwtUser, dto: any): Promise<SavedSearch> {
    const userObjId = new Types.ObjectId(user.sub);
    const company = await this.companyProfileModel.findOne({ userId: userObjId });
    const companyId = company ? company._id : userObjId;

    return this.savedSearchModel.create({
      companyId,
      createdBy: userObjId,
      name: dto.name || 'Saved Candidate Search',
      filters: dto.filters || {},
      alertsEnabled: dto.alertsEnabled ?? false,
      lastRunAt: new Date(),
    });
  }

  async getSavedSearches(user: JwtUser): Promise<SavedSearch[]> {
    const userObjId = new Types.ObjectId(user.sub);
    return this.savedSearchModel.find({ createdBy: userObjId }).sort({ createdAt: -1 });
  }

  async getSkillGapAnalytics(jobId: string): Promise<any> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('Invalid Job ID');
    }

    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    const applications = await this.applicationModel.find({ jobId });
    const skillsGapCount: Record<string, number> = {};

    for (const app of applications) {
      if (app.passportSnapshot?.skills) {
        const candidateSkills = (app.passportSnapshot.skills as string[]).map((s) => s.toLowerCase());
        for (const reqSkill of job.requiredSkills || []) {
          if (!candidateSkills.includes(reqSkill.toLowerCase())) {
            skillsGapCount[reqSkill] = (skillsGapCount[reqSkill] || 0) + 1;
          }
        }
      }
    }

    const aiAnalysis = await this.aiGateway.run({
      task: 'gap_analysis',
      input: { requiredSkills: job.requiredSkills, skillsGapCount },
    });

    return {
      jobId,
      jobTitle: job.title,
      totalApplicants: applications.length,
      skillsGapCount,
      aiSummary: aiAnalysis.result,
    };
  }

  async evaluateCandidateWithAi(candidateSkills: string[], requiredSkills?: string[]): Promise<any> {
    const reqs = requiredSkills && requiredSkills.length > 0
      ? requiredSkills
      : ['React', 'TypeScript', 'Node.js', 'NestJS', 'Docker'];

    const aiResult = await this.aiGateway.run({
      task: 'skill_match',
      input: { candidateSkills, requiredSkills: reqs },
    });

    return aiResult;
  }
}
