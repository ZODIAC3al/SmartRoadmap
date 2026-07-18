import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

const ADZUNA_MIN_JOBS = 5;
const ADZUNA_BASE = 'https://api.adzuna.com/v1/api';

// ─── Country catalogue ────────────────────────────────────────────────────────

export interface CountryEntry {
  code: string;       // ISO-3166-1 alpha-2
  label: string;
  currency: string;   // ISO-4217
  /**
   * Adzuna endpoint country code.
   * null  = Adzuna does not support this country.
   *         fetchSalaryData() returns null immediately so the caller
   *         goes straight to the AI fallback with the correct local currency.
   */
  adzunaCode: string | null;
}

/**
 * Countries the app supports.
 *
 * Rule: if adzunaCode is null, we NEVER call Adzuna at all — we rely
 * entirely on the Gemini AI fallback to generate authentic local-market
 * salary figures in the correct currency.  No cross-country salary
 * conversion is ever performed.
 */
export const COUNTRY_MAP: Record<string, CountryEntry> = {
  // ── Middle East / Africa — not on Adzuna, AI handles them ────────────────
  eg: { code: 'eg', label: 'Egypt',        currency: 'EGP', adzunaCode: null },
  sa: { code: 'sa', label: 'Saudi Arabia', currency: 'SAR', adzunaCode: null },
  ae: { code: 'ae', label: 'UAE',          currency: 'AED', adzunaCode: null },
  // ── Adzuna-native: salaries returned as-is in their own currency ─────────
  us: { code: 'us', label: 'USA',          currency: 'USD', adzunaCode: 'us' },
  gb: { code: 'gb', label: 'UK',           currency: 'GBP', adzunaCode: 'gb' },
  ca: { code: 'ca', label: 'Canada',       currency: 'CAD', adzunaCode: 'ca' },
  au: { code: 'au', label: 'Australia',    currency: 'AUD', adzunaCode: 'au' },
  de: { code: 'de', label: 'Germany',      currency: 'EUR', adzunaCode: 'de' },
  fr: { code: 'fr', label: 'France',       currency: 'EUR', adzunaCode: 'fr' },
  nl: { code: 'nl', label: 'Netherlands',  currency: 'EUR', adzunaCode: 'nl' },
  in: { code: 'in', label: 'India',        currency: 'INR', adzunaCode: 'in' },
  sg: { code: 'sg', label: 'Singapore',    currency: 'SGD', adzunaCode: 'sg' },
};

// ─── Result interface ─────────────────────────────────────────────────────────

export interface AdzunaSalaryResult {
  minSalary: number;
  avgSalary: number;
  maxSalary: number;
  currency: string;
  jobsAnalyzed: number;
  confidenceScore: number;
  marketDemand: 'High' | 'Moderate' | 'Low';
  trendingSkills: string[];
  salaryGrowthTrends: { year: number; averageSalary: number }[];
  country: string;
}

interface AdzunaJobListingResponse {
  count: number;
  results: {
    salary_min?: number;
    salary_max?: number;
    title?: string;
  }[];
}

interface AdzunaHistoryResponse {
  month: Record<string, number>;
}

/**
 * Wrapper around the Adzuna Jobs API.
 *
 * Design principle: salaries are NEVER converted between currencies.
 * - Adzuna-native countries (US, GB, CA, AU, DE, FR, NL, IN, SG):
 *     call the country's own endpoint, return figures verbatim in that
 *     country's currency.
 * - Non-native countries (EG, SA, AE, …):
 *     return null immediately — SalaryService falls back to Gemini AI
 *     which generates authentic local-market estimates in the correct
 *     currency without any numeric conversion.
 */
@Injectable()
export class AdzunaService {
  private readonly logger = new Logger(AdzunaService.name);
  private readonly client: AxiosInstance;
  private readonly appId: string;
  private readonly appKey: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.appId = config.get<string>('ADZUNA_APP_ID', '');
    this.appKey = config.get<string>('ADZUNA_APP_KEY', '');
    this.enabled = Boolean(this.appId && this.appKey);
    this.client = axios.create({ baseURL: ADZUNA_BASE, timeout: 10_000 });
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Derive a CountryEntry from a free-text location string. */
  resolveCountryFromLocation(location: string): CountryEntry {
    const l = (location || '').toLowerCase();
    if (l.includes('egypt') || l.includes('cairo') || l.includes('alexandria') || l.includes('giza')) return COUNTRY_MAP.eg;
    if (l.includes('saudi') || l.includes('riyadh') || l.includes('jeddah') || l.includes('ksa'))    return COUNTRY_MAP.sa;
    if (l.includes('uae') || l.includes('dubai') || l.includes('abu dhabi') || l.includes('emirates')) return COUNTRY_MAP.ae;
    if (l.includes('uk') || l.includes('united kingdom') || l.includes('britain') || l.includes('london') || l.includes('england')) return COUNTRY_MAP.gb;
    if (l.includes('canada') || l.includes('toronto') || l.includes('vancouver'))                    return COUNTRY_MAP.ca;
    if (l.includes('australia') || l.includes('sydney') || l.includes('melbourne'))                  return COUNTRY_MAP.au;
    if (l.includes('germany') || l.includes('berlin') || l.includes('munich'))                       return COUNTRY_MAP.de;
    if (l.includes('france') || l.includes('paris'))                                                 return COUNTRY_MAP.fr;
    if (l.includes('india') || l.includes('bangalore') || l.includes('mumbai') || l.includes('delhi')) return COUNTRY_MAP.in;
    if (l.includes('netherlands') || l.includes('amsterdam'))                                        return COUNTRY_MAP.nl;
    if (l.includes('singapore'))                                                                     return COUNTRY_MAP.sg;
    return COUNTRY_MAP.us;
  }

  /**
   * Fetch salary data from Adzuna for the selected country.
   *
   * Returns null when:
   *  - Adzuna keys are not configured
   *  - The selected country is not supported by Adzuna (adzunaCode === null)
   *  - Fewer than ADZUNA_MIN_JOBS salary-bearing listings are returned
   *
   * In all null cases SalaryService delegates to the Gemini AI fallback
   * which produces authentic market figures in the correct local currency.
   */
  async fetchSalaryData(params: {
    jobTitle: string;
    location: string;
    experienceYears?: number;
    skills?: string[];
    countryCode?: string;
  }): Promise<AdzunaSalaryResult | null> {
    if (!this.enabled) {
      this.logger.warn('Adzuna not configured — skipping');
      return null;
    }

    // Resolve the target country
    const country: CountryEntry =
      params.countryCode && COUNTRY_MAP[params.countryCode.toLowerCase()]
        ? COUNTRY_MAP[params.countryCode.toLowerCase()]
        : this.resolveCountryFromLocation(params.location);

    // Non-native country — go straight to AI, no Adzuna call
    if (!country.adzunaCode) {
      this.logger.log(
        `Country "${country.label}" is not on Adzuna — delegating to AI fallback`,
      );
      return null;
    }

    const apiCode = country.adzunaCode;
    const what    = params.jobTitle.trim();

    this.logger.log(`Adzuna: "${what}" | ${country.label} (${country.currency}) | endpoint /${apiCode}/`);

    try {
      // ── Fetch job listings ─────────────────────────────────────────────
      const searchResp = await this.client.get<AdzunaJobListingResponse>(
        `/jobs/${apiCode}/search/1`,
        {
          params: {
            app_id: this.appId,
            app_key: this.appKey,
            what,
            where: params.location !== 'Global' ? params.location : undefined,
            results_per_page: 50,
            salary_include_unknown: 0,
            full_time: 1,
            content_type: 'application/json',
          },
        },
      );

      const jobs       = searchResp.data?.results ?? [];
      const totalCount = searchResp.data?.count   ?? 0;

      if (jobs.length < ADZUNA_MIN_JOBS) {
        this.logger.warn(`Adzuna: only ${jobs.length} listings for "${what}" in ${country.label}`);
        return null;
      }

      const salaryJobs = jobs.filter(
        (j) => (j.salary_min ?? 0) > 0 || (j.salary_max ?? 0) > 0,
      );

      if (salaryJobs.length < ADZUNA_MIN_JOBS) {
        this.logger.warn(`Adzuna: only ${salaryJobs.length} listings have salary data`);
        return null;
      }

      // Salaries are in the country's own currency — use them verbatim
      const mins = salaryJobs.map((j) => j.salary_min ?? j.salary_max ?? 0).filter(Boolean);
      const maxs = salaryJobs.map((j) => j.salary_max ?? j.salary_min ?? 0).filter(Boolean);
      const all  = [...mins, ...maxs];

      const minSalary = Math.round(Math.min(...mins));
      const maxSalary = Math.round(Math.max(...maxs));
      const avgSalary = Math.round(all.reduce((a, b) => a + b, 0) / all.length);

      // ── Historical trend (same endpoint country, same currency) ────────
      const salaryGrowthTrends = await this.fetchSalaryHistory(apiCode, what);

      // ── Trending skills from job titles ────────────────────────────────
      const trendingSkills = this.extractTrendingSkills(
        jobs.map((j) => j.title ?? ''),
        params.skills ?? [],
      );

      const confidenceScore = Math.min(100, Math.round((salaryJobs.length / 50) * 100));
      const marketDemand    = this.deriveMarketDemand(totalCount);

      return {
        minSalary,
        avgSalary,
        maxSalary,
        currency: country.currency, // always the country's own currency, never converted
        jobsAnalyzed: salaryJobs.length,
        confidenceScore,
        marketDemand,
        trendingSkills,
        salaryGrowthTrends,
        country: country.code,
      };
    } catch (err: any) {
      this.logger.error(`Adzuna API error: ${err.message}`);
      return null;
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async fetchSalaryHistory(
    apiCode: string,
    what: string,
  ): Promise<{ year: number; averageSalary: number }[]> {
    try {
      const resp = await this.client.get<AdzunaHistoryResponse>(
        `/jobs/${apiCode}/history`,
        {
          params: {
            app_id: this.appId,
            app_key: this.appKey,
            what,
            content_type: 'application/json',
          },
        },
      );

      const monthly = resp.data?.month ?? {};
      const yearMap: Record<number, number[]> = {};

      for (const [key, val] of Object.entries(monthly)) {
        if (!val) continue;
        const year = parseInt(key.slice(0, 4), 10);
        if (!yearMap[year]) yearMap[year] = [];
        yearMap[year].push(val);
      }

      const currentYear = new Date().getFullYear();
      const result: { year: number; averageSalary: number }[] = [];

      for (let y = currentYear - 4; y <= currentYear; y++) {
        const vals = yearMap[y];
        if (vals?.length) {
          result.push({
            year: y,
            averageSalary: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
          });
        }
      }

      return result.length >= 3 ? result : [];
    } catch {
      return [];
    }
  }

  private extractTrendingSkills(titles: string[], userSkills: string[]): string[] {
    const keywords = [
      'react','vue','angular','node','python','typescript','javascript','java',
      'kotlin','swift','go','rust','c#','.net','php','ruby','docker','kubernetes',
      'aws','azure','gcp','terraform','ansible','postgresql','mongodb','redis',
      'elasticsearch','graphql','rest','machine learning','ai','data science',
      'devops','ci/cd','agile','microservices','serverless','security','linux',
    ];

    const freq: Record<string, number> = {};
    const text = titles.join(' ').toLowerCase();

    for (const kw of keywords) {
      const n = (text.match(new RegExp(kw, 'g')) ?? []).length;
      if (n > 0) freq[kw] = n;
    }
    for (const skill of userSkills) {
      const s = skill.toLowerCase();
      if (text.includes(s)) freq[s] = (freq[s] ?? 0) + 2;
    }

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([kw]) => kw.charAt(0).toUpperCase() + kw.slice(1));
  }

  private deriveMarketDemand(totalJobs: number): 'High' | 'Moderate' | 'Low' {
    if (totalJobs >= 500) return 'High';
    if (totalJobs >= 100) return 'Moderate';
    return 'Low';
  }
}
