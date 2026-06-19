import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job } from '../../schemas/job.schema';
import { User } from '../../schemas/user.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { QuizSession } from '../../schemas/quiz-session.schema';
import { Cv } from '../../schemas/cv.schema';

@Injectable()
export class HiringService {
  private readonly logger = new Logger(HiringService.name);

  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<Job>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(QuizSession.name) private readonly quizSessionModel: Model<QuizSession>,
    @InjectModel(Cv.name) private readonly cvModel: Model<Cv>,
  ) {
    // Seed some mock jobs on launch if database is empty
    this.seedMockJobs();
  }

  private async seedMockJobs() {
    try {
      const count = await this.jobModel.countDocuments();
      if (count === 0) {
        this.logger.log('Seeding mock job descriptions to database...');
        await this.jobModel.insertMany([
          {
            title: 'Frontend Engineer (React & TypeScript)',
            company: 'Lattice HR',
            location: 'Remote',
            country: 'US',
            requiredSkills: ['HTML/CSS', 'JavaScript', 'React', 'TypeScript', 'Git'],
            salaryMin: 80000,
            salaryMax: 110000,
            remote: true,
            description: 'Join our premium product team to build and design stunning human-resource workflow visualizations. Requires strong experience in React and TypeScript design tokens.'
          },
          {
            title: 'NodeJS Backend Developer',
            company: 'Osome Services',
            location: 'Singapore',
            country: 'SG',
            requiredSkills: ['JavaScript', 'TypeScript', 'Node.js', 'SQL', 'Docker', 'Git'],
            salaryMin: 70000,
            salaryMax: 95000,
            remote: true,
            description: 'Help build scalable accounting microservices, integrate MongoDB, design secure authentication pipelines, and deploy using containerized Docker engines.'
          },
          {
            title: 'Full Stack Engineer',
            company: 'Developia Dev',
            location: 'Cairo',
            country: 'EG',
            requiredSkills: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
            salaryMin: 25000,
            salaryMax: 40000,
            remote: false,
            description: 'We are seeking a generalist software developer to help support client websites. Work across React frontends and Node/Mongoose API layers.'
          },
          {
            title: 'Data & Analytics Engineer',
            company: 'Twilio Segment Inc.',
            location: 'New York',
            country: 'US',
            requiredSkills: ['Python', 'SQL', 'Git', 'Docker'],
            salaryMin: 95000,
            salaryMax: 130000,
            remote: true,
            description: 'Maintain vector database connections (Qdrant), orchestrate ETL data pipelines in Python, and align client event streams dynamically.'
          }
        ]);
      }
    } catch (e) {
      this.logger.error('Failed seeding jobs', e);
    }
  }

  async createJob(jobData: any): Promise<Job> {
    const job = new this.jobModel(jobData);
    return job.save();
  }

  async getJobs(): Promise<Job[]> {
    return this.jobModel.find().sort({ createdAt: -1 });
  }

  async matchJobsForLearner(userId: string): Promise<any[]> {
    this.logger.log(`Matching jobs for learner ID: ${userId}`);

    // 1. Fetch user active roadmap to identify completed modules (verified skills)
    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active'
    });

    const verifiedSkills: string[] = [];
    if (roadmap) {
      roadmap.modules.forEach(mod => {
        if (mod.status === 'completed') {
          // Add module title and topics to verified skills
          verifiedSkills.push(mod.title.toLowerCase());
          mod.topics.forEach(t => verifiedSkills.push(t.toLowerCase()));
        }
      });
    }

    // 2. Fetch all jobs
    const jobs = await this.jobModel.find();
    
    // 3. Score overlap
    const scoredJobs = jobs.map(job => {
      const requirements = job.requiredSkills.map(s => s.toLowerCase());
      if (requirements.length === 0) {
        return { job, matchScore: 100, skillsGap: [] };
      }

      const matching = requirements.filter(req => {
        // Match either exact skills tags or key substrings
        return verifiedSkills.some(v => v.includes(req) || req.includes(v));
      });

      const matchPercent = Math.round((matching.length / requirements.length) * 100);
      const skillsGap = job.requiredSkills.filter(req => {
        return !verifiedSkills.some(v => v.includes(req.toLowerCase()) || req.toLowerCase().includes(v));
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
        skillsGap
      };
    });

    // Sort by match score descending
    return scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
  }

  async getCandidates(): Promise<any[]> {
    this.logger.log('Fetching pre-vetted candidates pipeline for company portal');

    // 1. Fetch all users who are learners
    const learners = await this.userModel.find({ role: 'learner' });
    const candidates: any[] = [];

    for (const learner of learners) {
      // Get learner active roadmap
      const roadmap = await this.roadmapModel.findOne({
        userId: learner._id,
        status: 'active'
      });

      // Get quiz sessions to compute averages
      const quizSessions = await this.quizSessionModel.find({
        userId: learner._id,
        status: 'completed'
      });

      // Get CV if uploaded
      const userCv = await this.cvModel.findOne({ userId: learner._id });

      const completedCount = roadmap ? roadmap.modules.filter(m => m.status === 'completed').length : 0;
      const totalCount = roadmap ? roadmap.modules.length : 0;

      const verifiedSkills: string[] = [];
      if (roadmap) {
        roadmap.modules.forEach(m => {
          if (m.status === 'completed') {
            verifiedSkills.push(m.title);
          }
        });
      }

      let totalQuizScore = 0;
      let passedQuizCount = 0;
      quizSessions.forEach(q => {
        if (q.score !== null && q.score !== undefined) {
          totalQuizScore += q.score;
        }
        if (q.passed) {
          passedQuizCount++;
        }
      });

      const averageScore = quizSessions.length > 0 ? Math.round(totalQuizScore / quizSessions.length) : null;

      candidates.push({
        userId: learner._id.toString(),
        name: learner.name,
        email: learner.email,
        targetRole: roadmap ? roadmap.targetRole : 'Not Defined Yet',
        progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
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
