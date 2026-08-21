import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LLMService } from '../../ai/llm.service';
import { LearnerProfile } from '../../schemas/learner-profile.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { QuizSession } from '../../schemas/quiz-session.schema';
import { InterviewSession } from '../../schemas/interview-session.schema';
import { Job } from '../../schemas/job.schema';
import {
  UserRecommendation,
  UserRecommendationDocument,
  RecommendationCategory,
  RecommendationStatus,
} from '../../schemas/recommendation.schema';

export interface RecommendationResponse {
  summary: string;
  aiInsight: string;
  items: UserRecommendation[];
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectModel(UserRecommendation.name)
    private readonly recModel: Model<UserRecommendationDocument>,
    @InjectModel(LearnerProfile.name)
    private readonly profileModel: Model<LearnerProfile>,
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(QuizSession.name)
    private readonly quizModel: Model<QuizSession>,
    @InjectModel(InterviewSession.name)
    private readonly interviewModel: Model<InterviewSession>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<Job>,
    private readonly llmService: LLMService,
  ) {}

  /**
   * Main recommendation retriever. Checks cached DB items; if empty or forced refresh, runs engine.
   */
  async getRecommendations(
    userId: string,
    forceRefresh = false,
  ): Promise<RecommendationResponse> {
    const uId = new Types.ObjectId(userId);

    if (!forceRefresh) {
      const existing = await this.recModel
        .find({ userId: uId, status: { $ne: RecommendationStatus.Dismissed } })
        .sort({ matchScore: -1 })
        .exec();

      if (existing.length > 0) {
        const aiInsight =
          existing[0]?.aiInsight || 'Tailored based on your latest activity.';
        return {
          summary: `Showing ${existing.length} recommendations matched to your learning path.`,
          aiInsight,
          items: existing,
        };
      }
    }

    return this.generateFreshRecommendations(userId);
  }

  /**
   * Synthesizes user signals across 5 domains: profile, roadmaps, quizzes, interviews, and jobs.
   */
  async generateFreshRecommendations(
    userId: string,
  ): Promise<RecommendationResponse> {
    const uId = new Types.ObjectId(userId);
    this.logger.log(`Generating fresh AI recommendations for user ${userId}`);

    // 1. Gather learner signals
    const profile = await this.profileModel.findOne({ userId: uId }).exec();
    const roadmaps = await this.roadmapModel
      .find({ userId: uId, status: 'active' })
      .exec();
    const quizzes = await this.quizModel.find({ userId: uId }).limit(20).exec();
    const interviews = await this.interviewModel
      .find({ userId })
      .limit(10)
      .exec();

    // Signal extraction
    const targetRole = profile?.targetRole || 'Full Stack Developer';
    const userSkills = profile?.skills || ['JavaScript', 'HTML/CSS'];
    const experienceYears = profile?.experienceYears || 1;
    const location = profile?.location || 'Global';

    // Completed & in-progress topics from roadmaps
    const completedTopics: string[] = [];
    const inProgressTopics: string[] = [];
    roadmaps.forEach((rm) => {
      rm.modules.forEach((mod) => {
        if (mod.status === 'completed') {
          completedTopics.push(...mod.topics);
        } else if (mod.status === 'in_progress') {
          inProgressTopics.push(...mod.topics);
        }
      });
    });

    // Identified weak points from quizzes
    const weakTopics: string[] = [];
    quizzes.forEach((q) => {
      if (q.score !== undefined && q.score < 70) {
        weakTopics.push(q.moduleId);
      }
    });

    // 2. Fetch real database jobs matching user role/country if available
    const matchedDbJobs = await this.jobModel
      .find({
        $or: [
          { title: { $regex: targetRole, $options: 'i' } },
          { requiredSkills: { $in: userSkills } },
        ],
      })
      .limit(3)
      .exec();

    // 3. Ask Gemini to generate structured recommendations across categories
    const prompt = `
Generate highly targeted recommendations for a tech learner.
Target Role: "${targetRole}"
Experience: ${experienceYears} years
Location: ${location}
Known Skills: ${userSkills.join(', ') || 'General Programming'}
In-Progress Topics: ${inProgressTopics.join(', ') || 'Software Fundamentals'}
Weak Quiz Topics: ${weakTopics.join(', ') || 'None identified'}

Return ONLY a JSON object with this exact shape:
{
  "aiInsight": "2-3 sentences summarizing their top growth opportunity and next steps",
  "recommendations": [
    {
      "category": "course | project | article | certification | job",
      "title": "Clear concise title",
      "description": "2-3 sentence overview of what they will learn/build",
      "tags": ["Skill1", "Skill2"],
      "matchScore": 95,
      "reason": "Why recommended (e.g. Fills gap in React Hooks from quiz results)",
      "url": "https://example.com/resource",
      "difficulty": "beginner | intermediate | advanced",
      "estimatedTime": "4 hours | 2 weeks | etc."
    }
  ]
}
Generate 2 courses, 2 projects, 2 articles, 2 certifications, and 2 jobs. Ensure matchScore is between 75 and 99.
`;

    let aiInsight = `Custom learning path created for ${targetRole}. Focus on strengthening weak areas and building portfolio projects.`;
    let generatedItems: Partial<UserRecommendation>[] = [];

    const llmRes = await this.llmService.complete(prompt, { json: true });
    if (llmRes) {
      try {
        const parsed = JSON.parse(llmRes);
        if (parsed.aiInsight) aiInsight = parsed.aiInsight;
        if (Array.isArray(parsed.recommendations)) {
          generatedItems = parsed.recommendations;
        }
      } catch (err: any) {
        this.logger.warn(
          `Failed to parse Gemini recommendation output: ${err.message}`,
        );
      }
    }

    // Heuristic fallbacks if AI is offline/mock
    if (generatedItems.length === 0) {
      generatedItems = this.getFallbackRecommendations(targetRole, userSkills);
    }

    // Merge matched real DB jobs into recommendations
    matchedDbJobs.forEach((job) => {
      generatedItems.push({
        category: RecommendationCategory.Job,
        title: `${job.title} at ${job.company}`,
        description: `Direct match for your profile in ${job.location}. Requirements: ${job.requiredSkills.join(', ')}`,
        tags: job.requiredSkills,
        matchScore: 92,
        reason: `Matched your location (${job.location}) and target role (${targetRole}).`,
        url: `/hiring?jobId=${job._id}`,
        difficulty: 'intermediate',
        estimatedTime: 'Full-time',
      });
    });

    // 4. Overwrite previous active recommendations for this user
    await this.recModel
      .deleteMany({ userId: uId, status: RecommendationStatus.Active })
      .exec();

    const docsToInsert = generatedItems.map((item) => ({
      userId: uId,
      category: item.category as RecommendationCategory,
      title: item.title || `Mastering ${targetRole}`,
      description: item.description || `Practical guide for ${targetRole}.`,
      tags: item.tags || userSkills,
      matchScore: Math.min(100, Math.max(70, item.matchScore || 88)),
      reason: item.reason || `Aligned with your ${targetRole} roadmap.`,
      url: item.url || '#',
      difficulty: item.difficulty || 'intermediate',
      estimatedTime: item.estimatedTime || 'Self-paced',
      status: RecommendationStatus.Active,
      aiInsight,
    }));

    const saved = await this.recModel.insertMany(docsToInsert);

    return {
      summary: `Successfully generated ${saved.length} AI-powered recommendations.`,
      aiInsight,
      items: saved as any,
    };
  }

  /**
   * Handle user action (save, complete, dismiss)
   */
  async updateStatus(
    userId: string,
    recId: string,
    status: RecommendationStatus,
  ): Promise<UserRecommendation | null> {
    return this.recModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(recId), userId: new Types.ObjectId(userId) },
        { status },
        { new: true },
      )
      .exec();
  }

  private getFallbackRecommendations(
    targetRole: string,
    skills: string[],
  ): Partial<UserRecommendation>[] {
    const mainSkill = skills[0] || 'Modern Architecture';
    return [
      {
        category: RecommendationCategory.Course,
        title: `Advanced ${targetRole} Masterclass`,
        description: `Comprehensive deep dive into core industry patterns and real-world architectures.`,
        tags: [mainSkill, 'System Design'],
        matchScore: 94,
        reason: `Fills critical requirements for Senior ${targetRole} positions.`,
        url: 'https://coursera.org',
        difficulty: 'intermediate',
        estimatedTime: '12 hours',
      },
      {
        category: RecommendationCategory.Project,
        title: `Build a Production-Ready ${targetRole} SaaS Application`,
        description: `Hands-on portfolio project covering full deployment, database optimization, and secure API endpoints.`,
        tags: [mainSkill, 'FullStack', 'CI/CD'],
        matchScore: 96,
        reason: `Ideal project for demonstrating proficiency in ${targetRole}.`,
        url: '/roadmap',
        difficulty: 'advanced',
        estimatedTime: '3 weeks',
      },
      {
        category: RecommendationCategory.Article,
        title: `10 Performance Anti-Patterns in ${mainSkill}`,
        description: `Expert guide analyzing memory leaks, unoptimized queries, and scalability bottlenecks.`,
        tags: [mainSkill, 'Performance'],
        matchScore: 89,
        reason: `Based on your recent learning progress in ${mainSkill}.`,
        url: 'https://dev.to',
        difficulty: 'intermediate',
        estimatedTime: '15 min read',
      },
      {
        category: RecommendationCategory.Certification,
        title: `Certified Professional ${targetRole} Specialist`,
        description: `Industry-recognized certification credential validating software architecture and technical mastery.`,
        tags: ['Certification', targetRole],
        matchScore: 91,
        reason: `Boosts resume visibility by 40% for ${targetRole} applications.`,
        url: 'https://aws.amazon.com/certification/',
        difficulty: 'advanced',
        estimatedTime: 'Exam Ready',
      },
      {
        category: RecommendationCategory.Job,
        title: `Remote ${targetRole} (Global / Hybrid)`,
        description: `High-growth technology team seeking a ${targetRole} skilled in ${mainSkill}.`,
        tags: [mainSkill, 'Remote'],
        matchScore: 93,
        reason: `Matches your current skill matrix and career goals.`,
        url: '/hiring',
        difficulty: 'intermediate',
        estimatedTime: 'Full-time',
      },
    ];
  }
}
