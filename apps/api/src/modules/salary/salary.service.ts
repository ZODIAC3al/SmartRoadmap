import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LLMService } from '../../ai/llm.service';
import { LearnerProfile } from '../../schemas/learner-profile.schema';
import { Job } from '../../schemas/job.schema';
import { AdzunaService, COUNTRY_MAP, CountryEntry } from './adzuna.service';
import { SalaryCacheService } from './salary-cache.service';
import {
  PredictSalaryDto,
  UpdateCareerProfileDto,
  SalaryInsightsResponse,
  SalaryDataStatus,
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
    @InjectModel(Job.name)
    private readonly jobModel: Model<Job>,
  ) {}

  // ─── Profile CRUD ──────────────────────────────────────────────────────────

  async getCareerProfile(userId: string): Promise<LearnerProfile> {
    const uId = new Types.ObjectId(userId);
    let profile = await this.profileModel.findOne({ userId: uId });
    if (!profile) {
      profile = await this.profileModel.create({
        userId: uId,
        skills: [],
        certifications: [],
        experienceYears: 0,
      });
    }
    return profile;
  }

  async updateCareerProfile(
    userId: string,
    dto: UpdateCareerProfileDto,
  ): Promise<LearnerProfile> {
    const uId = new Types.ObjectId(userId);
    const profile = await this.profileModel.findOneAndUpdate(
      { userId: uId },
      { $set: dto },
      { new: true, upsert: true },
    );
    this.cache.invalidate(userId);
    return profile;
  }

  // ─── Primary entry point ───────────────────────────────────────────────────

  async getSalaryInsights(
    userId: string,
    countryCode?: string,
  ): Promise<SalaryInsightsResponse> {
    const profile = await this.getCareerProfile(userId);

    const jobTitle =
      profile.currentRole || profile.targetRole || 'Software Engineer';
    const experienceYears = profile.experienceYears ?? 0;
    const location = profile.location || 'Global';
    const skills = profile.skills?.length ? profile.skills : ['JavaScript'];
    const educationLevel =
      profile.educationLevel || 'Self-taught / Degree equivalent';
    const certifications = profile.certifications?.length
      ? profile.certifications
      : [];
    const industry = profile.industry || 'Technology';

    const targetCountryCode = (countryCode || 'us').toLowerCase();

    const dto: PredictSalaryDto = {
      jobTitle,
      experienceYears,
      location,
      skills,
      educationLevel,
      certifications,
      industry,
      country: targetCountryCode,
    };

    // Cache key explicitly depends on COUNTRY + JOB TITLE
    const cacheKey = this.cache.buildCacheKey(
      userId,
      targetCountryCode,
      jobTitle,
    );
    const profileHash = this.cache.buildProfileHash(
      profile,
      targetCountryCode,
      jobTitle,
    );

    const cached = this.cache.get<SalaryInsightsResponse>(
      cacheKey,
      profileHash,
    );
    if (cached) {
      return { ...cached, cachedAt: new Date().toISOString() };
    }

    const result = await this.predictSalaryRange(dto);

    // Only cache valid data results — NO_DATA and API_ERROR are never cached
    if (result.dataStatus !== 'NO_DATA' && result.dataStatus !== 'API_ERROR') {
      this.cache.set(cacheKey, profileHash, result);
    }

    return result;
  }

  // ─── Core prediction ──────────────────────────────────────────────────────

  async predictSalaryRange(
    dto: PredictSalaryDto,
  ): Promise<SalaryInsightsResponse> {
    const jobTitle = (dto.jobTitle || 'Software Engineer').trim();
    const location = dto.location || 'Global';
    const countryCode = (dto.country || 'us').toLowerCase();

    const displayCountry: CountryEntry =
      COUNTRY_MAP[countryCode] ?? COUNTRY_MAP.us;
    const currency = displayCountry.currency;

    this.logger.log(
      `[Salary Debug] Incoming request: job="${jobTitle}", country="${displayCountry.label}" (${displayCountry.code}), currency="${currency}"`,
    );

    // ── 1. Try Adzuna live data ──────────────────────────────────────────────
    let adzunaData: Awaited<ReturnType<typeof this.adzuna.fetchSalaryData>> =
      null;
    let apiError = false;

    try {
      adzunaData = await this.adzuna.fetchSalaryData({
        jobTitle,
        location,
        experienceYears: dto.experienceYears,
        skills: dto.skills,
        countryCode: displayCountry.code,
      });
    } catch (err: any) {
      apiError = true;
      this.logger.error(`[Salary Debug] Adzuna fetch failed: ${err.message}`);
    }

    if (adzunaData && adzunaData.jobsAnalyzed > 0) {
      // Validate that provider currency matches the target country's native currency
      if (adzunaData.currency.toUpperCase() === currency.toUpperCase()) {
        this.logger.log(
          `[Salary Debug] Adzuna match SUCCESS: ${adzunaData.jobsAnalyzed} listings in ${currency} for ${displayCountry.label}`,
        );

        const skillGapAnalysis = await this.buildSkillGapAnalysis(
          dto,
          adzunaData.trendingSkills,
        );
        const growthTrends =
          adzunaData.salaryGrowthTrends.length >= 3
            ? adzunaData.salaryGrowthTrends
            : await this.buildGrowthTrendsFromAI(
                jobTitle,
                displayCountry.label,
                currency,
                adzunaData.avgSalary,
              );

        const confidence = this.calcAdzunaConfidence(adzunaData.jobsAnalyzed);

        return {
          jobTitle,
          dataStatus:
            adzunaData.jobsAnalyzed >= 10 ? 'LIVE_DATA' : 'INSUFFICIENT_DATA',
          minSalary: adzunaData.minSalary,
          avgSalary: adzunaData.avgSalary,
          maxSalary: adzunaData.maxSalary,
          salaryMetricLabel: 'average',
          currency,
          salaryPeriod: 'annual',
          marketDemand: adzunaData.marketDemand,
          trendingSkills: adzunaData.trendingSkills,
          salaryGrowthTrends: growthTrends,
          skillGapAnalysis,
          salaryRecommendation: this.buildRecommendation({
            jobTitle,
            countryLabel: displayCountry.label,
            currency,
            minSalary: adzunaData.minSalary,
            avgSalary: adzunaData.avgSalary,
            maxSalary: adzunaData.maxSalary,
            experienceYears: dto.experienceYears ?? 0,
            marketDemand: adzunaData.marketDemand,
            jobsAnalyzed: adzunaData.jobsAnalyzed,
          }),
          sourceLabel: `Adzuna · ${adzunaData.jobsAnalyzed} listings`,
          confidenceScore: confidence,
          jobsAnalyzed: adzunaData.jobsAnalyzed,
          dataSource: 'Adzuna',
        };
      } else {
        this.logger.warn(
          `[Salary Debug] Adzuna currency mismatch (${adzunaData.currency} != ${currency}) — rejecting payload`,
        );
      }
    }

    // ── 2. Fall back to AI Market Estimate ───────────────────────────────────
    this.logger.log(
      `[Salary Debug] Adzuna returned no listings for "${jobTitle}" in ${displayCountry.label} — using AI Market Estimate`,
    );

    const aiResult = await this.runAIEstimate(
      dto,
      displayCountry.label,
      currency,
      displayCountry.code,
    );
    if (aiResult) {
      const skillGapAnalysis = await this.buildSkillGapAnalysis(
        dto,
        aiResult.trendingSkills,
      );

      this.logger.log(
        `[Salary Debug] Final AI Result: min=${aiResult.minSalary}, avg=${aiResult.avgSalary}, max=${aiResult.maxSalary} ${aiResult.currency}`,
      );

      return {
        jobTitle,
        dataStatus: 'AI_ESTIMATE',
        minSalary: aiResult.minSalary,
        avgSalary: aiResult.avgSalary,
        maxSalary: aiResult.maxSalary,
        salaryMetricLabel: 'estimate',
        currency: aiResult.currency,
        salaryPeriod: 'annual',
        marketDemand: aiResult.marketDemand,
        trendingSkills: aiResult.trendingSkills,
        salaryGrowthTrends: aiResult.salaryGrowthTrends,
        skillGapAnalysis,
        salaryRecommendation: this.buildRecommendation({
          jobTitle,
          countryLabel: displayCountry.label,
          currency: aiResult.currency,
          minSalary: aiResult.minSalary,
          avgSalary: aiResult.avgSalary,
          maxSalary: aiResult.maxSalary,
          experienceYears: dto.experienceYears ?? 0,
          marketDemand: aiResult.marketDemand,
          jobsAnalyzed: 0,
        }),
        sourceLabel: `AI estimate · ${displayCountry.label} market`,
        confidenceScore: 35,
        jobsAnalyzed: 0,
        dataSource: 'AI Estimate',
      };
    }

    // ── 3. No data fallback ──────────────────────────────────────────────────
    const status: SalaryDataStatus = apiError ? 'API_ERROR' : 'NO_DATA';
    this.logger.warn(
      `[Salary Debug] No salary data for "${jobTitle}" in ${displayCountry.label} (${currency}) — status: ${status}`,
    );

    return {
      jobTitle,
      dataStatus: status,
      minSalary: null,
      avgSalary: null,
      maxSalary: null,
      salaryMetricLabel: 'average',
      currency,
      salaryPeriod: 'annual',
      marketDemand: null,
      trendingSkills: [],
      salaryGrowthTrends: [],
      skillGapAnalysis: null,
      salaryRecommendation: '',
      sourceLabel:
        status === 'API_ERROR'
          ? 'Data temporarily unavailable'
          : `No salary data available for ${displayCountry.label}`,
      confidenceScore: 0,
      jobsAnalyzed: 0,
      dataSource: 'Fallback',
    };
  }

  // ─── Historical salary ─────────────────────────────────────────────────────

  async getHistoricalSalary(userId: string) {
    const profile = await this.getCareerProfile(userId);
    const jobTitle =
      profile.currentRole || profile.targetRole || 'Software Engineer';
    const location = profile.location || 'Global';
    const adzunaData = await this.adzuna.fetchSalaryData({
      jobTitle,
      location,
    });
    if (adzunaData && adzunaData.salaryGrowthTrends.length >= 3) {
      return {
        trends: adzunaData.salaryGrowthTrends,
        dataSource: 'Adzuna',
        currency: adzunaData.currency,
      };
    }
    const displayCountry = this.adzuna.resolveCountryFromLocation(location);
    const trends = await this.buildGrowthTrendsFromAI(
      jobTitle,
      displayCountry.label,
      displayCountry.currency,
    );
    return {
      trends,
      dataSource: 'AI Estimate',
      currency: displayCountry.currency,
    };
  }

  // ─── Gemini Normalization & Analysis ───────────────────────────────────────

  private async analyzeAndNormalizeWithGemini(
    rawListings: Array<{
      title: string;
      min?: number;
      max?: number;
      period?: string;
    }>,
    displayCountry: CountryEntry,
    jobTitle: string,
  ): Promise<{
    minSalary: number;
    avgSalary: number;
    maxSalary: number;
    medianSalary: number;
    salaryMetricLabel: 'average' | 'median';
    salaryPeriod: 'annual' | 'monthly';
    currency: string;
  } | null> {
    if (!rawListings || rawListings.length === 0) {
      return null;
    }

    const mins: number[] = [];
    const maxs: number[] = [];
    const all: number[] = [];

    for (const item of rawListings) {
      const minVal = item.min ?? item.max ?? 0;
      const maxVal = item.max ?? item.min ?? 0;
      if (minVal > 0) {
        mins.push(minVal);
        all.push(minVal);
      }
      if (maxVal > 0) {
        maxs.push(maxVal);
        all.push(maxVal);
      }
    }

    if (all.length === 0) return null;

    const mathMin = Math.round(Math.min(...mins));
    const mathMax = Math.round(Math.max(...maxs));
    const mathAvg = Math.round(all.reduce((a, b) => a + b, 0) / all.length);

    const sorted = [...all].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const mathMedian = Math.round(
      sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2,
    );

    try {
      const rawPrompt =
        `You are a salary data analyst. Normalize and validate these raw job salary listings for "${jobTitle}" in ${displayCountry.label}.\n` +
        `Target Currency: ${displayCountry.currency}\n` +
        `Raw Listings:\n${JSON.stringify(rawListings)}\n\n` +
        `Calculated Baseline Stats:\n` +
        `- Min: ${mathMin}\n- Max: ${mathMax}\n- Avg: ${mathAvg}\n- Median: ${mathMedian}\n\n` +
        `Rules:\n` +
        `1. Output ONLY JSON. All numbers MUST be derived strictly from the provided raw listings.\n` +
        `2. Do NOT invent numbers.\n` +
        `3. Currency MUST strictly equal "${displayCountry.currency}".\n` +
        `JSON format: {"minSalary": number, "avgSalary": number, "maxSalary": number, "medianSalary": number, "currency": "${displayCountry.currency}", "salaryPeriod": "annual", "salaryMetricLabel": "average"}`;

      const aiRes = await this.llm.complete(rawPrompt, { json: true });
      if (aiRes) {
        const parsed = JSON.parse(aiRes);
        const c = String(parsed.currency || '').toUpperCase();
        if (c === displayCountry.currency && Number(parsed.minSalary) > 0) {
          return {
            minSalary: Number(parsed.minSalary),
            avgSalary: Number(parsed.avgSalary),
            maxSalary: Number(parsed.maxSalary),
            medianSalary: Number(parsed.medianSalary || mathMedian),
            salaryMetricLabel:
              parsed.salaryMetricLabel === 'median' ? 'median' : 'average',
            salaryPeriod:
              parsed.salaryPeriod === 'monthly' ? 'monthly' : 'annual',
            currency: displayCountry.currency,
          };
        }
      }
    } catch {
      /* Fallback to verified math baseline */
    }

    return {
      minSalary: mathMin,
      avgSalary: mathAvg,
      maxSalary: mathMax,
      medianSalary: mathMedian,
      salaryMetricLabel: 'average',
      salaryPeriod: 'annual',
      currency: displayCountry.currency,
    };
  }

  private async runAIEstimate(
    dto: PredictSalaryDto,
    countryLabel: string,
    currency: string,
    countryCode: string,
  ): Promise<{
    minSalary: number;
    avgSalary: number;
    maxSalary: number;
    currency: string;
    marketDemand: 'High' | 'Moderate' | 'Low';
    trendingSkills: string[];
    salaryGrowthTrends: { year: number; averageSalary: number }[];
  } | null> {
    const prompt =
      `You are an HR analytics expert. Estimate the ANNUAL salary range for this profile.\n` +
      `CRITICAL: All salary figures MUST be in ${currency} — the native currency of ${countryLabel}.\n` +
      `Do NOT use USD or any other currency unless ${currency} is USD.\n\n` +
      `Profile:\n` +
      `- Job Title: ${dto.jobTitle}\n` +
      `- Years of Experience: ${dto.experienceYears ?? 0}\n` +
      `- Country / Market: ${countryLabel}\n` +
      `- Skills: ${dto.skills?.join(', ') || 'Software Development'}\n\n` +
      `Output ONLY valid JSON (no markdown):\n` +
      `{"minSalary":<annual ${currency}>,"avgSalary":<annual ${currency}>,"maxSalary":<annual ${currency}>,` +
      `"currency":"${currency}","marketDemand":"High","trendingSkills":["TypeScript","Docker","Node.js"],` +
      `"salaryGrowthTrends":[{"year":2022,"averageSalary":<${currency}>},{"year":2023,"averageSalary":<${currency}>},` +
      `{"year":2024,"averageSalary":<${currency}>},{"year":2025,"averageSalary":<${currency}>},{"year":2026,"averageSalary":<${currency}>}]}`;

    try {
      const raw = await this.llm.complete(prompt, {
        json: true,
        system:
          `You are an HR analytics expert specialising in the ${countryLabel} job market. ` +
          `All salary values you output MUST be in ${currency}.`,
      });
      if (raw) {
        const p = JSON.parse(raw);

        const min = Number(p.minSalary);
        const avg = Number(p.avgSalary);
        const max = Number(p.maxSalary);
        const resCurr = String(p.currency || currency).toUpperCase();
        if (
          min > 0 &&
          avg > 0 &&
          max > 0 &&
          resCurr === currency.toUpperCase()
        ) {
          this.logger.log(
            `[Salary Debug] Gemini AI Estimate output: min=${min}, avg=${avg}, max=${max} ${resCurr}`,
          );
          return {
            minSalary: min,
            avgSalary: avg,
            maxSalary: max,
            currency: resCurr,
            marketDemand: p.marketDemand || 'Moderate',
            trendingSkills: Array.isArray(p.trendingSkills)
              ? p.trendingSkills
              : ['TypeScript', 'Node.js', 'Docker'],
            salaryGrowthTrends: Array.isArray(p.salaryGrowthTrends)
              ? p.salaryGrowthTrends
              : [],
          };
        }
      }
    } catch (err: any) {
      this.logger.error(
        `[Salary Debug] AI estimate execution failed: ${err.message}`,
      );
    }

    // Benchmark estimates in native currency for AI_ESTIMATE when LLM is offline/mock
    const benchmarks: Record<
      string,
      { min: number; avg: number; max: number }
    > = {
      gb: { min: 32000, avg: 42000, max: 55000 },
      us: { min: 75000, avg: 95000, max: 120000 },
      fr: { min: 35000, avg: 44000, max: 56000 },
      de: { min: 42000, avg: 52000, max: 68000 },
      eg: { min: 180000, avg: 250000, max: 350000 },
      sa: { min: 120000, avg: 165000, max: 220000 },
      ae: { min: 140000, avg: 190000, max: 250000 },
      ca: { min: 65000, avg: 82000, max: 105000 },
      au: { min: 75000, avg: 95000, max: 120000 },
      nl: { min: 40000, avg: 50000, max: 64000 },
      in: { min: 600000, avg: 950000, max: 1400000 },
      sg: { min: 60000, avg: 78000, max: 100000 },
    };

    const b = benchmarks[countryCode.toLowerCase()] || {
      min: 40000,
      avg: 55000,
      max: 75000,
    };
    this.logger.log(
      `[Salary Debug] AI Market Fallback benchmark used for ${countryLabel}: min=${b.min}, avg=${b.avg}, max=${b.max} ${currency}`,
    );

    return {
      minSalary: b.min,
      avgSalary: b.avg,
      maxSalary: b.max,
      currency,
      marketDemand: 'Moderate',
      trendingSkills: ['TypeScript', 'Node.js', 'Docker', 'React'],
      salaryGrowthTrends: [
        { year: 2022, averageSalary: Math.round(b.avg * 0.88) },
        { year: 2023, averageSalary: Math.round(b.avg * 0.92) },
        { year: 2024, averageSalary: Math.round(b.avg * 0.96) },
        { year: 2025, averageSalary: Math.round(b.avg * 0.98) },
        { year: 2026, averageSalary: b.avg },
      ],
    };
  }

  // ─── Confidence calculation ────────────────────────────────────────────────

  private calcAdzunaConfidence(jobsWithSalary: number): number {
    if (jobsWithSalary >= 100) return 100;
    if (jobsWithSalary >= 50) return 80;
    if (jobsWithSalary >= 20) return 60;
    if (jobsWithSalary >= 10) return 40;
    if (jobsWithSalary >= 5) return 20;
    return 10;
  }

  // ─── Salary recommendation ─────────────────────────────────────────────────

  private buildRecommendation(params: {
    jobTitle: string;
    countryLabel: string;
    currency: string;
    minSalary: number;
    avgSalary: number;
    maxSalary: number;
    experienceYears: number;
    marketDemand: 'High' | 'Moderate' | 'Low';
    jobsAnalyzed: number;
  }): string {
    const fmtCurrency = (n: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: params.currency,
          maximumFractionDigits: 0,
        }).format(n);
      } catch {
        return `${params.currency} ${n.toLocaleString()}`;
      }
    };

    const src =
      params.jobsAnalyzed > 0
        ? `Based on ${params.jobsAnalyzed} live job listings`
        : `Based on an AI market estimate`;

    const range =
      `a ${params.jobTitle} in ${params.countryLabel} can expect ` +
      `${fmtCurrency(params.minSalary)}–${fmtCurrency(params.maxSalary)} per year ` +
      `(average ${fmtCurrency(params.avgSalary)}).`;

    const expAdvice =
      params.experienceYears >= 5
        ? `With ${params.experienceYears} years of experience you are well-positioned to negotiate toward the upper range.`
        : params.experienceYears >= 2
          ? `With ${params.experienceYears} years of experience you are close to the market average — specialised skills will accelerate growth.`
          : `As an early-career professional, demonstrating measurable impact will help you reach the average faster.`;

    const demandAdvice =
      params.marketDemand === 'High'
        ? `Demand is currently high — a strong moment to negotiate.`
        : params.marketDemand === 'Low'
          ? `Demand is softer; broadening your skill set will strengthen your market position.`
          : `Demand is stable in this market.`;

    return `${src}, ${range} ${expAdvice} ${demandAdvice}`;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async buildSkillGapAnalysis(
    dto: PredictSalaryDto,
    trendingSkills: string[],
  ): Promise<{ missingSkills: string[]; recommendations: string[] }> {
    const userSkills = dto.skills ?? [];
    const missing = trendingSkills.filter(
      (s) => !userSkills.some((u) => u.toLowerCase() === s.toLowerCase()),
    );
    if (missing.length === 0) {
      return {
        missingSkills: [],
        recommendations: [
          'Your skill set aligns well with current market demand.',
        ],
      };
    }
    try {
      const raw = await this.llm.complete(
        `${dto.jobTitle} (${dto.experienceYears} yrs) has: ${userSkills.join(', ')}.\n` +
          `Market trending: ${trendingSkills.join(', ')}.\n` +
          `Return JSON: { "missingSkills": [...], "recommendations": ["...","..."] }`,
        { json: true, system: 'You are an HR analytics expert.' },
      );
      if (raw) {
        const p = JSON.parse(raw);
        return {
          missingSkills: Array.isArray(p.missingSkills)
            ? p.missingSkills
            : missing,
          recommendations: Array.isArray(p.recommendations)
            ? p.recommendations
            : [],
        };
      }
    } catch {
      /* silent */
    }
    return {
      missingSkills: missing.slice(0, 3),
      recommendations: [
        `Consider adding ${missing[0]} to align with market demand.`,
      ],
    };
  }

  private async buildGrowthTrendsFromAI(
    jobTitle: string,
    countryLabel: string,
    currency: string,
    anchorAvg?: number,
  ): Promise<{ year: number; averageSalary: number }[]> {
    try {
      const raw = await this.llm.complete(
        `5-year salary trend (2022–2026) for "${jobTitle}" in ${countryLabel}. ` +
          `All values in ${currency}. ` +
          (anchorAvg ? `Current average ~${anchorAvg} ${currency}. ` : '') +
          `Return JSON: { "trends": [{"year":2022,"averageSalary":<number>},...] }`,
        {
          json: true,
          system: `Global talent strategist, ${countryLabel} market.`,
        },
      );
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p.trends) && p.trends.length > 0) return p.trends;
      }
    } catch {
      /* fall through */
    }
    return [];
  }
}
