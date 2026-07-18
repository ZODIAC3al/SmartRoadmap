import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsIn,
  Min,
  Max,
} from 'class-validator';

// ─── Request DTOs ────────────────────────────────────────────────────────────

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

  /**
   * ISO-3166-1 alpha-2 country code selected by the user (e.g. "eg", "sa", "ae", "us").
   * When present, takes precedence over the location string for country/currency
   * resolution.  Never stored — only used for this prediction request.
   */
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

// ─── Response shapes (for documentation / type safety) ───────────────────────

export interface SalaryGrowthPoint {
  year: number;
  averageSalary: number;
}

export interface SkillGapAnalysis {
  missingSkills: string[];
  recommendations: string[];
}

/**
 * Unified salary insights response.
 *
 * `dataSource`:
 *   - "Adzuna"      → live data from the Adzuna Jobs API
 *   - "AI Estimate" → Gemini LLM estimate (Adzuna returned insufficient data)
 *   - "Fallback"    → deterministic formula (both AI and Adzuna unavailable)
 *
 * `confidenceScore`: 0–100. Higher means more real job listings were used.
 * `jobsAnalyzed`: Number of live job listings that contributed to the salary range.
 */
export interface SalaryInsightsResponse {
  minSalary: number;
  avgSalary: number;
  maxSalary: number;
  currency: string;
  marketDemand: 'High' | 'Moderate' | 'Low';
  trendingSkills: string[];
  salaryGrowthTrends: SalaryGrowthPoint[];
  skillGapAnalysis: SkillGapAnalysis;
  dataSource: 'Adzuna' | 'AI Estimate' | 'Fallback';
  confidenceScore: number;
  jobsAnalyzed: number;
  cachedAt?: string; // ISO timestamp — present when served from cache
}
