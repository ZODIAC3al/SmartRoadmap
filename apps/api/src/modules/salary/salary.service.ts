// apps/api/src/modules/salary/salary.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LLMService } from '../../ai/llm.service';
import { LearnerProfile } from '../../schemas/learner-profile.schema';
import { PredictSalaryDto, UpdateCareerProfileDto } from './dto/salary.dto';

@Injectable()
export class SalaryService {
  private readonly logger = new Logger(SalaryService.name);

  constructor(
    private readonly llm: LLMService,
    @InjectModel(LearnerProfile.name) private readonly profileModel: Model<LearnerProfile>,
  ) {}

  /** Fetch or initialize user's career profile */
  async getCareerProfile(userId: string): Promise<LearnerProfile> {
    this.logger.log(`Fetching career profile for user ${userId}`);
    const uId = new Types.ObjectId(userId);
    let profile = await this.profileModel.findOne({ userId: uId });
    if (!profile) {
      this.logger.log(`Career profile not found, initializing empty profile for ${userId}`);
      profile = await this.profileModel.create({
        userId: uId,
        skills: [],
        certifications: [],
        experienceYears: 0,
      });
    }
    return profile;
  }

  /** Update user's career profile */
  async updateCareerProfile(userId: string, dto: UpdateCareerProfileDto): Promise<LearnerProfile> {
    this.logger.log(`Updating career profile for user ${userId}`);
    const uId = new Types.ObjectId(userId);
    let profile = await this.profileModel.findOneAndUpdate(
      { userId: uId },
      { $set: dto },
      { new: true, upsert: true }
    );
    return profile;
  }

  /** Get salary insights based on current profile */
  async getSalaryInsights(userId: string) {
    const profile = await this.getCareerProfile(userId);
    
    // Fallback default details if profile is entirely empty
    const jobTitle = profile.currentRole || profile.targetRole || 'Software Engineer';
    const experienceYears = profile.experienceYears ?? 0;
    const location = profile.location || 'Global';
    const skills = profile.skills?.length > 0 ? profile.skills : ['JavaScript'];
    const educationLevel = profile.educationLevel || 'Self-taught / Degree equivalent';
    const certifications = profile.certifications?.length > 0 ? profile.certifications : ['None'];
    const industry = profile.industry || 'Technology';

    return this.predictSalaryRange({
      jobTitle,
      experienceYears,
      location,
      skills,
      educationLevel,
      certifications,
      industry,
    });
  }

  /** Secure salary predictor core using Gemini LLM */
  async predictSalaryRange(dto: PredictSalaryDto) {
    this.logger.log(`Predicting salary for role: ${dto.jobTitle}, Location: ${dto.location}`);

    const prompt = `Analyze market data to estimate the salary range for the following profile:\n` +
      `- Job Title: ${dto.jobTitle}\n` +
      `- Years of Experience: ${dto.experienceYears}\n` +
      `- Location: ${dto.location}\n` +
      `- Skills: ${dto.skills?.join(', ')}\n` +
      `- Education: ${dto.educationLevel}\n` +
      `- Certifications: ${dto.certifications?.join(', ')}\n` +
      `- Industry: ${dto.industry}\n\n` +
      `Generate a structured JSON report with the exact fields. Output only valid JSON:\n` +
      `{\n` +
      `  "minSalary": <number, yearly USD equivalent>,\n` +
      `  "avgSalary": <number, yearly USD equivalent>,\n` +
      `  "maxSalary": <number, yearly USD equivalent>,\n` +
      `  "currency": "USD",\n` +
      `  "marketDemand": "<High | Moderate | Low>",\n` +
      `  "trendingSkills": ["skill1", "skill2", "skill3"],\n` +
      `  "salaryGrowthTrends": [\n` +
      `     { "year": 2022, "averageSalary": <number> },\n` +
      `     { "year": 2023, "averageSalary": <number> },\n` +
      `     { "year": 2024, "averageSalary": <number> },\n` +
      `     { "year": 2025, "averageSalary": <number> },\n` +
      `     { "year": 2026, "averageSalary": <number> }\n` +
      `  ],\n` +
      `  "skillGapAnalysis": {\n` +
      `     "missingSkills": ["missingSkill1", "missingSkill2"],\n` +
      `     "recommendations": ["recommendation1", "recommendation2"]\n` +
      `  }\n` +
      `}`;

    try {
      const result = await this.llm.complete(prompt, { json: true, system: 'You are an HR analytics expert.' });
      if (result) {
        const parsed = JSON.parse(result);
        return {
          minSalary: Number(parsed.minSalary) || 40000,
          avgSalary: Number(parsed.avgSalary) || 60000,
          maxSalary: Number(parsed.maxSalary) || 80000,
          currency: parsed.currency || 'USD',
          marketDemand: parsed.marketDemand || 'Moderate',
          trendingSkills: Array.isArray(parsed.trendingSkills) ? parsed.trendingSkills : [],
          salaryGrowthTrends: Array.isArray(parsed.salaryGrowthTrends) ? parsed.salaryGrowthTrends : [],
          skillGapAnalysis: parsed.skillGapAnalysis || { missingSkills: [], recommendations: [] },
        };
      }
    } catch (err: any) {
      this.logger.error(`Salary prediction LLM failed: ${err.message}`);
    }

    // High fidelity fallback representation
    return this.getDeterministicFallback(dto);
  }

  /** Return historical salary analytics */
  async getHistoricalSalary(userId: string) {
    const profile = await this.getCareerProfile(userId);
    const jobTitle = profile.currentRole || profile.targetRole || 'Software Engineer';
    const location = profile.location || 'Global';
    
    this.logger.log(`Fetching historical analytics for ${jobTitle} in ${location}`);
    
    const prompt = `Provide the salary analytics trend for the last 5 years for "${jobTitle}" in "${location}".\n` +
      `Return JSON format:\n` +
      `{\n` +
      `  "trends": [\n` +
      `     { "year": 2022, "averageSalary": <number> },\n` +
      `     { "year": 2023, "averageSalary": <number> },\n` +
      `     { "year": 2024, "averageSalary": <number> },\n` +
      `     { "year": 2025, "averageSalary": <number> },\n` +
      `     { "year": 2026, "averageSalary": <number> }\n` +
      `  ]\n` +
      `}`;

    try {
      const result = await this.llm.complete(prompt, { json: true, system: 'You are a global talent strategist.' });
      if (result) {
        return JSON.parse(result);
      }
    } catch (e: any) {
      this.logger.error(`Historical analytics request failed: ${e.message}`);
    }

    return {
      trends: [
        { year: 2022, averageSalary: 55000 },
        { year: 2023, averageSalary: 58000 },
        { year: 2024, averageSalary: 62000 },
        { year: 2025, averageSalary: 66000 },
        { year: 2026, averageSalary: 70000 },
      ]
    };
  }

  private getDeterministicFallback(dto: PredictSalaryDto) {
    const expBonus = (dto.experienceYears || 0) * 8000;
    const base = 50000 + expBonus;
    return {
      minSalary: base * 0.8,
      avgSalary: base,
      maxSalary: base * 1.3,
      currency: 'USD',
      marketDemand: (dto.experienceYears || 0) > 3 ? 'High' : 'Moderate',
      trendingSkills: ['Cloud Architecture', 'TypeScript', 'AI Engineering'],
      salaryGrowthTrends: [
        { year: 2022, averageSalary: base * 0.85 },
        { year: 2023, averageSalary: base * 0.9 },
        { year: 2024, averageSalary: base * 0.95 },
        { year: 2025, averageSalary: base },
        { year: 2026, averageSalary: base * 1.05 },
      ],
      skillGapAnalysis: {
        missingSkills: ['System Design', 'CI/CD Automation'],
        recommendations: [
          'Earn a professional cloud certificate to unlock higher tiers.',
          'Contribute to production-grade repositories to demonstrate system level proficiency.'
        ]
      }
    };
  }
}
