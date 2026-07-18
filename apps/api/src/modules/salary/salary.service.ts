import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LLMService } from '../../ai/llm.service';
import { LearnerProfile } from '../../schemas/learner-profile.schema';
import { AdzunaService, COUNTRY_MAP } from './adzuna.service';
import { SalaryCacheService } from './salary-cache.service';
import {
  PredictSalaryDto,
  UpdateCareerProfileDto,
  SalaryInsightsResponse,
} from './dto/salary.dto';

@Injectable()
export class SalaryService {
  private readonly logger = new Logger(SalaryService.name);

  constructor(
    private readonly adzuna: AdzunaService,
    private readonly cache: SalaryCacheService,
    private readonly llm: LLMService,
    @InjectModel(LearnerProfile.name)
    private readonly profileModel: Model<LearnerProfile>,
  ) {}

  // ─── Profile CRUD ──────────────────────────────────────────────────────────

  async getCareerProfile(userId: string): Promise<LearnerProfile> {
    this.logger.log(`Fetching career profile for user ${userId}`);
    const uId = new Types.ObjectId(userId);
    let profile = await this.profileModel.findOne({ userId: uId });
    if (!profile) {
      this.logger.log(`No career profile found — creating empty profile for ${userId}`);
      profile = await this.profileModel.create({
        userId: uId,
        skills: [],
        certifications: [],
        experienceYears: 0,
      });
    }
    return profile;
  }

  /**
   * Update the user's career profile and immediately invalidate their cached
   * salary insights so the next GET reflects the new profile.
   */
  async updateCareerProfile(
    userId: string,
    dto: UpdateCareerProfileDto,
  ): Promise<LearnerProfile> {
    this.logger.log(`Updating career profile for user ${userId}`);
    const uId = new Types.ObjectId(userId);
    const profile = await this.profileModel.findOneAndUpdate(
      { userId: uId },
      { $set: dto },
      { new: true, upsert: true },
    );
    // Invalidate cache — the new profile will produce different salary data
    this.cache.invalidate(userId);
    return profile!;
  }

  // ─── Salary Insights (primary entry point) ─────────────────────────────────

  /**
   * Return salary insights for the authenticated user, automatically pulling
   * their full profile (role, experience, location, skills, education,
   * certifications, industry) to drive the query.
   *
   * @param countryCode  Optional ISO-3166-1 alpha-2 country code from the UI
   *                     country selector (e.g. "eg", "sa", "ae", "us").
   *                     When supplied it overrides the location string for
   *                     country/currency resolution while the rest of the
   *                     profile is still used automatically.
   *
   * Resolution order:
   *   1. In-memory 24h cache (keyed by userId + profile fingerprint + country)
   *   2. Adzuna live API  → dataSource: "Adzuna"
   *   3. Gemini AI        → dataSource: "AI Estimate"
   *   4. Deterministic formula → dataSource: "Fallback"
   */
  async getSalaryInsights(userId: string, countryCode?: string): Promise<SalaryInsightsResponse> {
    const profile = await this.getCareerProfile(userId);

    const jobTitle = profile.currentRole || profile.targetRole || 'Software Engineer';
    const experienceYears = profile.experienceYears ?? 0;
    const location = profile.location || 'Global';
    const skills = profile.skills?.length ? profile.skills : ['JavaScript'];
    const educationLevel = profile.educationLevel || 'Self-taught / Degree equivalent';
    const certifications = profile.certifications?.length ? profile.certifications : [];
    const industry = profile.industry || 'Technology';

    const dto: PredictSalaryDto = {
      jobTitle,
      experienceYears,
      location,
      skills,
      educationLevel,
      certifications,
      industry,
      country: countryCode,
    };

    // Cache key includes the selected country so switching countries produces
    // a fresh fetch rather than reusing a result from a different market.
    const profileHash = this.cache.buildProfileHash({ ...profile, _countryOverride: countryCode } as any);
    const cached = this.cache.get<SalaryInsightsResponse>(userId, profileHash);
    if (cached) {
      return { ...cached, cachedAt: new Date(Date.now()).toISOString() };
    }

    const result = await this.predictSalaryRange(dto);
    this.cache.set(userId, profileHash, result);
    return result;
  }

  // ─── Core prediction — Adzuna → AI → Fallback ─────────────────────────────

  async predictSalaryRange(dto: PredictSalaryDto): Promise<SalaryInsightsResponse> {
    const jobTitle = dto.jobTitle || 'Software Engineer';
    const location = dto.location || 'Global';
    const countryCode = dto.country;

    // Resolve display country so the AI fallback uses the correct currency/context
    const displayCountry = countryCode
      ? (COUNTRY_MAP[countryCode.toLowerCase()] ?? this.adzuna.resolveCountryFromLocation(location))
      : this.adzuna.resolveCountryFromLocation(location);

    this.logger.log(
      `Salary prediction: "${jobTitle}" in "${location}" | country: ${displayCountry.code} (${displayCountry.currency})`,
    );

    // ── 1. Try Adzuna (real market data) ─────────────────────────────────
    const adzunaData = await this.adzuna.fetchSalaryData({
      jobTitle,
      location,
      experienceYears: dto.experienceYears,
      skills: dto.skills,
      countryCode: displayCountry.code,
    });

    if (adzunaData) {
      this.logger.log(
        `Adzuna: ${adzunaData.jobsAnalyzed} jobs analysed, confidence ${adzunaData.confidenceScore}%`,
      );

      const skillGapAnalysis = await this.buildSkillGapAnalysis(dto, adzunaData.trendingSkills);

      const growthTrends =
        adzunaData.salaryGrowthTrends.length >= 3
          ? adzunaData.salaryGrowthTrends
          : await this.buildGrowthTrendsFromAI(
              jobTitle,
              displayCountry.label,
              displayCountry.currency,
              adzunaData.avgSalary,
            );

      return {
        minSalary: adzunaData.minSalary,
        avgSalary: adzunaData.avgSalary,
        maxSalary: adzunaData.maxSalary,
        currency: adzunaData.currency,
        marketDemand: adzunaData.marketDemand,
        trendingSkills: adzunaData.trendingSkills,
        salaryGrowthTrends: growthTrends,
        skillGapAnalysis,
        dataSource: 'Adzuna',
        confidenceScore: adzunaData.confidenceScore,
        jobsAnalyzed: adzunaData.jobsAnalyzed,
      };
    }

    this.logger.warn(
      `Adzuna insufficient — falling back to AI estimate for "${jobTitle}" in ${displayCountry.label}`,
    );

    // ── 2. Try Gemini AI estimate — with explicit country + currency ──────
    const aiResult = await this.runAIEstimate(dto, displayCountry.label, displayCountry.currency);
    if (aiResult) {
      return { ...aiResult, dataSource: 'AI Estimate', confidenceScore: 40, jobsAnalyzed: 0 };
    }

    this.logger.warn(`AI estimate also failed — using deterministic fallback`);

    // ── 3. Deterministic fallback — honour selected currency ─────────────
    return {
      ...this.getDeterministicFallback(dto, displayCountry.currency),
      dataSource: 'Fallback',
      confidenceScore: 10,
      jobsAnalyzed: 0,
    };
  }

  // ─── Historical salary ─────────────────────────────────────────────────────

  async getHistoricalSalary(userId: string) {
    const profile = await this.getCareerProfile(userId);
    const jobTitle = profile.currentRole || profile.targetRole || 'Software Engineer';
    const location = profile.location || 'Global';

    this.logger.log(`Historical salary: "${jobTitle}" in "${location}"`);

    // Attempt Adzuna history first
    const adzunaData = await this.adzuna.fetchSalaryData({ jobTitle, location });
    if (adzunaData && adzunaData.salaryGrowthTrends.length >= 3) {
      return {
        trends: adzunaData.salaryGrowthTrends,
        dataSource: 'Adzuna',
        currency: adzunaData.currency,
      };
    }

    const displayCountry = this.adzuna.resolveCountryFromLocation(location);
    // Fall back to AI with correct country context
    const trends = await this.buildGrowthTrendsFromAI(
      jobTitle,
      displayCountry.label,
      displayCountry.currency,
    );
    return { trends, dataSource: 'AI Estimate', currency: displayCountry.currency };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async runAIEstimate(
    dto: PredictSalaryDto,
    countryLabel: string,
    currency: string,
  ): Promise<Omit<SalaryInsightsResponse, 'dataSource' | 'confidenceScore' | 'jobsAnalyzed'> | null> {
    const prompt =
      `You are an HR analytics expert. Estimate the annual salary range for the following profile.\n` +
      `IMPORTANT: Return all salary figures in ${currency} (the local currency of ${countryLabel}).\n\n` +
      `Profile:\n` +
      `- Job Title: ${dto.jobTitle}\n` +
      `- Years of Experience: ${dto.experienceYears}\n` +
      `- Country / Market: ${countryLabel}\n` +
      `- Location: ${dto.location}\n` +
      `- Skills: ${dto.skills?.join(', ')}\n` +
      `- Education: ${dto.educationLevel}\n` +
      `- Certifications: ${dto.certifications?.join(', ')}\n` +
      `- Industry: ${dto.industry}\n\n` +
      `Output only valid JSON (no markdown, no extra text):\n` +
      `{\n` +
      `  "minSalary": <number, annual ${currency}>,\n` +
      `  "avgSalary": <number, annual ${currency}>,\n` +
      `  "maxSalary": <number, annual ${currency}>,\n` +
      `  "currency": "${currency}",\n` +
      `  "marketDemand": "<High | Moderate | Low>",\n` +
      `  "trendingSkills": ["skill1", "skill2", "skill3"],\n` +
      `  "salaryGrowthTrends": [\n` +
      `     { "year": 2022, "averageSalary": <number, ${currency}> },\n` +
      `     { "year": 2023, "averageSalary": <number, ${currency}> },\n` +
      `     { "year": 2024, "averageSalary": <number, ${currency}> },\n` +
      `     { "year": 2025, "averageSalary": <number, ${currency}> },\n` +
      `     { "year": 2026, "averageSalary": <number, ${currency}> }\n` +
      `  ],\n` +
      `  "skillGapAnalysis": {\n` +
      `     "missingSkills": ["skill1"],\n` +
      `     "recommendations": ["rec1"]\n` +
      `  }\n` +
      `}`;

    try {
      const result = await this.llm.complete(prompt, {
        json: true,
        system: `You are an HR analytics expert specialising in the ${countryLabel} job market.`,
      });
      if (!result) return null;

      const p = JSON.parse(result);
      return {
        minSalary: Number(p.minSalary) || 0,
        avgSalary: Number(p.avgSalary) || 0,
        maxSalary: Number(p.maxSalary) || 0,
        currency: p.currency || currency,
        marketDemand: p.marketDemand || 'Moderate',
        trendingSkills: Array.isArray(p.trendingSkills) ? p.trendingSkills : [],
        salaryGrowthTrends: Array.isArray(p.salaryGrowthTrends) ? p.salaryGrowthTrends : [],
        skillGapAnalysis: p.skillGapAnalysis ?? { missingSkills: [], recommendations: [] },
      };
    } catch (err: any) {
      this.logger.error(`AI salary estimate failed: ${err.message}`);
      return null;
    }
  }

  /** Ask the LLM for a skill-gap analysis enriched with Adzuna's trending skills */
  private async buildSkillGapAnalysis(
    dto: PredictSalaryDto,
    trendingSkills: string[],
  ): Promise<{ missingSkills: string[]; recommendations: string[] }> {
    const userSkills = dto.skills ?? [];
    const missing = trendingSkills.filter(
      (s) => !userSkills.some((u) => u.toLowerCase() === s.toLowerCase()),
    );

    if (missing.length === 0) {
      return { missingSkills: [], recommendations: ['Your skill set is well-aligned with current market demand.'] };
    }

    const prompt =
      `A ${dto.jobTitle} with ${dto.experienceYears} years experience in ${dto.location} ` +
      `has these skills: ${userSkills.join(', ')}.\n` +
      `The market is trending towards: ${trendingSkills.join(', ')}.\n` +
      `Identify the top missing skills and give 2 concise, actionable recommendations.\n` +
      `Return only JSON: { "missingSkills": [...], "recommendations": [...] }`;

    try {
      const result = await this.llm.complete(prompt, {
        json: true,
        system: 'You are an HR analytics expert.',
      });
      if (result) {
        const p = JSON.parse(result);
        return {
          missingSkills: Array.isArray(p.missingSkills) ? p.missingSkills : missing,
          recommendations: Array.isArray(p.recommendations) ? p.recommendations : [],
        };
      }
    } catch {
      // silent — return structural fallback
    }

    return {
      missingSkills: missing.slice(0, 3),
      recommendations: [
        `Consider adding ${missing[0]} to your skill set to align with market demand.`,
        'Contribute to open-source projects to demonstrate practical proficiency.',
      ],
    };
  }

  /** Build 5-year salary growth trend via AI, anchored to a known average */
  private async buildGrowthTrendsFromAI(
    jobTitle: string,
    countryLabel: string,
    currency: string,
    anchorAvg?: number,
  ): Promise<{ year: number; averageSalary: number }[]> {
    const anchor = anchorAvg ?? 0;
    const prompt =
      `Provide a 5-year salary trend (2022–2026) for "${jobTitle}" in ${countryLabel}.\n` +
      `Return all values in ${currency}.\n` +
      (anchor > 0 ? `The current average is approximately ${anchor} ${currency}.\n` : '') +
      `Return only JSON: { "trends": [{ "year": 2022, "averageSalary": <number> }, ...] }`;

    try {
      const result = await this.llm.complete(prompt, {
        json: true,
        system: `You are a global talent strategist specialising in the ${countryLabel} job market.`,
      });
      if (result) {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed.trends) && parsed.trends.length > 0) {
          return parsed.trends;
        }
      }
    } catch {
      // fall through to deterministic
    }

    const base = anchor || 60000;
    return [
      { year: 2022, averageSalary: Math.round(base * 0.85) },
      { year: 2023, averageSalary: Math.round(base * 0.90) },
      { year: 2024, averageSalary: Math.round(base * 0.95) },
      { year: 2025, averageSalary: Math.round(base) },
      { year: 2026, averageSalary: Math.round(base * 1.05) },
    ];
  }

  private getDeterministicFallback(
    dto: PredictSalaryDto,
    currency: string = 'USD',
  ): Omit<SalaryInsightsResponse, 'dataSource' | 'confidenceScore' | 'jobsAnalyzed'> {
    /**
     * Annual salary baselines by currency — sourced from public market surveys.
     * These represent a mid-level (3–5 yrs) Software Engineer in each market.
     * They intentionally differ from one another so every country shows
     * realistic, distinct values rather than a currency-labelled USD number.
     *
     * Ranges used:
     *   EGP  110,000 – 250,000  (Egyptian pound, ~2,200 – 5,100 USD)
     *   SAR   90,000 – 200,000  (Saudi riyal,   ~24,000 – 53,000 USD)
     *   AED  120,000 – 280,000  (UAE dirham,    ~32,700 – 76,200 USD)
     *   USD   80,000 – 160,000  (US dollar)
     *   GBP   45,000 –  90,000  (British pound)
     *   CAD   70,000 – 130,000  (Canadian dollar)
     *   AUD   80,000 – 140,000  (Australian dollar)
     *   EUR   50,000 –  95,000  (Euro — DE/FR/NL)
     *   INR  800,000 – 2,000,000 (Indian rupee)
     *   SGD   72,000 – 140,000  (Singapore dollar)
     */
    const BASE: Record<string, number> = {
      EGP: 160_000,
      SAR: 130_000,
      AED: 180_000,
      USD:  110_000,
      GBP:   62_000,
      CAD:   95_000,
      AUD:  105_000,
      EUR:   68_000,
      INR: 1_200_000,
      SGD:  100_000,
    };

    const base = (BASE[currency] ?? 110_000) + (dto.experienceYears ?? 0) * (BASE[currency] ?? 110_000) * 0.08;

    return {
      minSalary: Math.round(base * 0.75),
      avgSalary: Math.round(base),
      maxSalary: Math.round(base * 1.35),
      currency,
      marketDemand: (dto.experienceYears ?? 0) > 3 ? 'High' : 'Moderate',
      trendingSkills: ['Cloud Architecture', 'TypeScript', 'AI Engineering'],
      salaryGrowthTrends: [
        { year: 2022, averageSalary: Math.round(base * 0.82) },
        { year: 2023, averageSalary: Math.round(base * 0.88) },
        { year: 2024, averageSalary: Math.round(base * 0.94) },
        { year: 2025, averageSalary: Math.round(base) },
        { year: 2026, averageSalary: Math.round(base * 1.07) },
      ],
      skillGapAnalysis: {
        missingSkills: ['System Design', 'CI/CD Automation'],
        recommendations: [
          'Earn a professional cloud certificate to unlock higher salary tiers.',
          'Contribute to production-grade repositories to demonstrate system-level proficiency.',
        ],
      },
    };
  }
}
