import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export class PredictSalaryDto {
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @IsString()
  @IsOptional()
  location?: string;

  /** ISO-3166-1 alpha-2 from the country selector — overrides location for
   *  country/currency resolution. Never stored. */
  @IsString()
  @IsOptional()
  country?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  educationLevel?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsString()
  @IsOptional()
  industry?: string;
}

export class UpdateCareerProfileDto {
  @IsString()
  @IsOptional()
  currentRole?: string;

  @IsString()
  @IsOptional()
  targetRole?: string;

  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  educationLevel?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsString()
  @IsOptional()
  industry?: string;
}

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface SalaryGrowthPoint {
  year: number;
  averageSalary: number;
}

export interface SkillGapAnalysis {
  missingSkills: string[];
  recommendations: string[];
}

/**
 * Explicit data-quality states — replaces the old "Fallback" catch-all.
 *
 * LIVE_DATA          Adzuna returned ≥5 salary-bearing listings for this
 *                    country + job title. Values are real market figures.
 * AI_ESTIMATE        Adzuna unavailable/unsupported for this country (e.g.
 *                    Egypt, UAE, Saudi Arabia) or returned < threshold.
 *                    Gemini generated context-aware estimates in the correct
 *                    local currency. Clearly labelled as approximate.
 * INSUFFICIENT_DATA  Both Adzuna and AI returned data but sample size is too
 *                    small to be statistically meaningful (< 5 records).
 * NO_DATA            No salary data available from any configured source for
 *                    this country + role combination. Salary fields are null.
 * API_ERROR          A network or authentication error occurred while fetching.
 *                    Salary fields are null. Stale cached data may be shown
 *                    separately if available.
 */
export type SalaryDataStatus =
  | 'LIVE_DATA'
  | 'AI_ESTIMATE'
  | 'INSUFFICIENT_DATA'
  | 'NO_DATA'
  | 'API_ERROR';

/** Whether salary figures are annual or monthly. Always 'annual' for Adzuna. */
export type SalaryPeriod = 'annual' | 'monthly';

/**
 * Unified salary insights response.
 *
 * When dataStatus is NO_DATA or API_ERROR the salary fields (minSalary,
 * avgSalary, maxSalary) are null.  The frontend must not render salary cards
 * in those states — it must show the appropriate status message instead.
 *
 * salaryMetricLabel: what the "average" figure actually represents.
 *   'average'  arithmetic mean of salary_min+salary_max across listings
 *   'median'   median value returned by a salary-distribution endpoint
 *   'estimate' AI-generated — not a statistical measure
 *
 * confidenceScore: calculated from real data-quality signals:
 *   100 listings → 100  |  50 → ~80  |  10 → ~40  |  <5 → 0–10
 *   AI_ESTIMATE always 35.  NO_DATA / API_ERROR always 0.
 */
export interface SalaryInsightsResponse {
  /** Role queried — read from the user's stored career profile. */
  jobTitle: string;

  /** Explicit data-quality state — never use salary values when NO_DATA or API_ERROR. */
  dataStatus: SalaryDataStatus;

  /** null when dataStatus is NO_DATA or API_ERROR */
  minSalary: number | null;
  /** null when dataStatus is NO_DATA or API_ERROR */
  avgSalary: number | null;
  /** null when dataStatus is NO_DATA or API_ERROR */
  maxSalary: number | null;

  /** What the centre figure actually is */
  salaryMetricLabel: 'average' | 'median' | 'estimate';

  /** Native currency of the selected country — never converted */
  currency: string;

  /** Always 'annual' for Adzuna data; 'monthly' if a monthly source is used */
  salaryPeriod: SalaryPeriod;

  marketDemand: 'High' | 'Moderate' | 'Low' | null;
  trendingSkills: string[];
  salaryGrowthTrends: SalaryGrowthPoint[];
  skillGapAnalysis: SkillGapAnalysis | null;

  /** Plain-English expectation sentence. Empty string when NO_DATA or API_ERROR. */
  salaryRecommendation: string;

  /** Human-readable source label shown in the UI */
  sourceLabel: string;

  /** 0–100 calculated from real data quality signals */
  confidenceScore: number;

  /** Number of Adzuna listings that had salary data — 0 for AI/no-data */
  jobsAnalyzed: number;

  /** ISO timestamp — present when served from the 24h cache */
  cachedAt?: string;

  /** @deprecated use dataStatus instead — kept for backwards compat during migration */
  dataSource: 'Adzuna' | 'AI Estimate' | 'Fallback';
}
