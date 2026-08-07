"use client";

import React from "react";

// ─── Country catalogue ────────────────────────────────────────────────────────

export interface CountryOption {
  code: string;
  label: string;
  flag: string;
  currency: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "eg", label: "Egypt",        flag: "🇪🇬", currency: "EGP" },
  { code: "sa", label: "Saudi Arabia", flag: "🇸🇦", currency: "SAR" },
  { code: "ae", label: "UAE",          flag: "🇦🇪", currency: "AED" },
  { code: "us", label: "USA",          flag: "🇺🇸", currency: "USD" },
  { code: "gb", label: "UK",           flag: "🇬🇧", currency: "GBP" },
  { code: "ca", label: "Canada",       flag: "🇨🇦", currency: "CAD" },
  { code: "au", label: "Australia",    flag: "🇦🇺", currency: "AUD" },
  { code: "de", label: "Germany",      flag: "🇩🇪", currency: "EUR" },
  { code: "fr", label: "France",       flag: "🇫🇷", currency: "EUR" },
  { code: "nl", label: "Netherlands",  flag: "🇳🇱", currency: "EUR" },
  { code: "in", label: "India",        flag: "🇮🇳", currency: "INR" },
  { code: "sg", label: "Singapore",    flag: "🇸🇬", currency: "SGD" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type SalaryDataStatus =
  | "LIVE_DATA"
  | "AI_ESTIMATE"
  | "INSUFFICIENT_DATA"
  | "NO_DATA"
  | "API_ERROR";

interface SalaryGrowthPoint { year: number; averageSalary: number; }
interface SkillGapAnalysis  { missingSkills: string[]; recommendations: string[]; }

export interface SalaryInsights {
  jobTitle: string;
  dataStatus: SalaryDataStatus;
  minSalary:  number | null;
  avgSalary:  number | null;
  maxSalary:  number | null;
  salaryMetricLabel: "average" | "median" | "estimate";
  currency: string;
  salaryPeriod: "annual" | "monthly";
  marketDemand: "High" | "Moderate" | "Low" | null;
  trendingSkills: string[];
  salaryGrowthTrends: SalaryGrowthPoint[];
  skillGapAnalysis: SkillGapAnalysis | null;
  salaryRecommendation: string;
  sourceLabel: string;
  confidenceScore: number;
  jobsAnalyzed: number;
  cachedAt?: string;
  // legacy — still present from backend
  dataSource: "Adzuna" | "AI Estimate" | "Fallback";
}

interface Props {
  insights: SalaryInsights | null;
  loading: boolean;
  selectedCountry: string;
  onCountryChange: (code: string) => void;
  onRefresh: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency, maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

function shortLabel(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${Math.round(value / 1_000)}k`;
  return String(value);
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<SalaryDataStatus, {
  badge: string; badgeCls: string; icon: string;
  title: string; body: string; showSalary: boolean;
}> = {
  LIVE_DATA: {
    badge: "⚡ Live Data", badgeCls: "bg-success/15 text-success border-success/30",
    icon: "⚡", title: "", body: "", showSalary: true,
  },
  AI_ESTIMATE: {
    badge: "🤖 AI Estimate", badgeCls: "bg-[#7c3aed]/15 text-[#7c3aed] border-[#7c3aed]/30",
    icon: "🤖", title: "", body: "", showSalary: true,
  },
  INSUFFICIENT_DATA: {
    badge: "⚠ Limited Data", badgeCls: "bg-warning/15 text-warning border-warning/30",
    icon: "⚠", title: "Limited salary data", showSalary: true,
    body: "Fewer than 10 salary-bearing listings were found. The range shown is indicative, not statistically reliable.",
  },
  NO_DATA: {
    badge: "— No Data", badgeCls: "bg-base-content/10 text-base-content/50 border-base-content/20",
    icon: "—", showSalary: false,
    title: "No salary data available for this market",
    body: "Neither Adzuna nor our AI provider returned usable salary data for this role and country combination. This may be because the role title is very specific or the market has low listing volume. Try a broader job title or a different country.",
  },
  API_ERROR: {
    badge: "✕ Unavailable", badgeCls: "bg-error/15 text-error border-error/30",
    icon: "✕", showSalary: false,
    title: "Salary data temporarily unavailable",
    body: "There was a problem reaching the salary data provider. This is usually temporary. Please try refreshing in a moment.",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SalaryDataStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono ${cfg.badgeCls}`}>
      {cfg.badge}
    </span>
  );
}

function SalaryRangeBar({ min, avg, max, currency, metricLabel, period }: {
  min: number; avg: number; max: number;
  currency: string; metricLabel: string; period: string;
}) {
  if (!max) return null;
  const minPct = Math.round((min / max) * 100);
  const avgPct = Math.round((avg / max) * 100);
  const periodLabel = period === "monthly" ? "/ month" : "/ year";

  return (
    <div className="space-y-3">
      <div className="relative h-3 bg-base-300 rounded-full overflow-visible">
        <div
          className="absolute top-0 h-3 rounded-full bg-gradient-to-r from-[#7c3aed]/30 via-[#7c3aed]/60 to-[#7c3aed]"
          style={{ left: `${minPct}%`, right: "0%" }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#7c3aed] border-2 border-base-100 shadow-md z-10"
          style={{ left: `${avgPct}%` }}
        />
      </div>
      <div className="grid grid-cols-3 text-center">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-base-content/40 font-mono">Min</p>
          <p className="text-sm font-black text-base-content tabular-nums mt-0.5">{fmt(min, currency)}</p>
          <p className="text-[9px] text-base-content/30 font-mono">{periodLabel}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#7c3aed]/70 font-mono">
            {metricLabel.charAt(0).toUpperCase() + metricLabel.slice(1)}
          </p>
          <p className="text-lg font-black text-[#7c3aed] tabular-nums mt-0.5">{fmt(avg, currency)}</p>
          <p className="text-[9px] text-base-content/30 font-mono">{periodLabel}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-base-content/40 font-mono">Max</p>
          <p className="text-sm font-black text-success tabular-nums mt-0.5">{fmt(max, currency)}</p>
          <p className="text-[9px] text-base-content/30 font-mono">{periodLabel}</p>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBar({ score, jobsAnalyzed }: { score: number; jobsAnalyzed: number }) {
  const color = score >= 70 ? "bg-success" : score >= 40 ? "bg-[#7c3aed]" : score > 0 ? "bg-warning" : "bg-base-300";
  const label = score >= 70 ? "High" : score >= 40 ? "Medium" : score >= 20 ? "Low" : score > 0 ? "Very low" : "None";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-base-300 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-[10px] font-bold text-base-content/60 font-mono w-16 text-right">{score}% · {label}</span>
      </div>
      {jobsAnalyzed > 0 && (
        <p className="text-[10px] text-base-content/40 font-mono">
          Based on {jobsAnalyzed} salary-bearing listings
        </p>
      )}
    </div>
  );
}

function SalaryBarChart({ trends, currency }: { trends: SalaryGrowthPoint[]; currency: string }) {
  if (!trends.length) return null;
  const max = Math.max(...trends.map((t) => t.averageSalary));
  const currentYear = new Date().getFullYear();
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-28 pt-2">
      {trends.map((t) => {
        const h = Math.max(6, Math.round((t.averageSalary / max) * 80));
        const isCurrent = t.year === currentYear;
        return (
          <div key={t.year} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-[9px] text-base-content/50 font-mono leading-none">{shortLabel(t.averageSalary)}</span>
            <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
              <div className={`w-full rounded-t-lg transition-all duration-700 ${isCurrent ? "bg-[#7c3aed]" : "bg-[#7c3aed]/35"}`} style={{ height: h }} />
            </div>
            <span className={`text-[9px] font-bold font-mono ${isCurrent ? "text-[#7c3aed]" : "text-base-content/50"}`}>{t.year}</span>
          </div>
        );
      })}
    </div>
  );
}

function CountrySelector({ selected, onChange, disabled }: {
  selected: string; onChange: (code: string) => void; disabled: boolean;
}) {
  return (
    <div className="bg-base-200 border border-base-300 rounded-2xl px-5 py-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono mb-3">
        Select Country / Market
      </p>
      <div className="flex flex-wrap gap-2">
        {COUNTRY_OPTIONS.map((opt) => {
          const active = selected === opt.code;
          return (
            <button
              key={opt.code} disabled={disabled} onClick={() => onChange(opt.code)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold
                transition-all border select-none
                ${active ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-sm"
                         : "bg-base-100 text-base-content/70 border-base-300 hover:border-[#7c3aed]/50 hover:text-[#7c3aed]"}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-sm leading-none">{opt.flag}</span>
              <span>{opt.label}</span>
              <span className="text-[9px] font-mono opacity-60">{opt.currency}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DataStatusCard({ status, sourceLabel, onRefresh }: {
  status: SalaryDataStatus; sourceLabel: string; onRefresh: () => void;
}) {
  const cfg = STATUS_CFG[status];
  if (!cfg.title) return null;
  const isError = status === "API_ERROR";
  return (
    <div className={`rounded-2xl px-5 py-4 border shadow-sm ${isError ? "bg-error/5 border-error/20" : "bg-warning/5 border-warning/20"}`}>
      <p className={`text-xs font-bold mb-1 ${isError ? "text-error" : "text-warning"}`}>{cfg.title}</p>
      <p className="text-xs text-base-content/70 leading-relaxed">{cfg.body}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-base-content/40 font-mono">{sourceLabel}</span>
        <button onClick={onRefresh}
          className="btn btn-xs btn-ghost border border-base-300 rounded-xl text-[10px] font-bold gap-1.5 hover:text-[#7c3aed]">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry
        </button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-2xl bg-base-300" />
      <div className="h-36 rounded-2xl bg-base-300" />
      <div className="h-16 rounded-2xl bg-base-300" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-28 rounded-2xl bg-base-300" />
        <div className="h-28 rounded-2xl bg-base-300" />
      </div>
      <div className="h-40 rounded-2xl bg-base-300" />
    </div>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#7c3aed]/10 flex items-center justify-center">
        <svg className="w-7 h-7 text-[#7c3aed]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H10.5a1.5 1.5 0 000 3H15" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-bold text-base-content">No salary data yet</p>
        <p className="text-xs text-base-content/50 mt-1 max-w-xs">
          Select a country above, then make sure your career profile has a current role and skills saved.
        </p>
      </div>
      <button onClick={onRefresh}
        className="btn btn-sm bg-[#7c3aed] hover:bg-[#6d28d9] border-none text-white rounded-xl text-xs font-bold px-6">
        Load Insights
      </button>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function SalaryInsightsPanel({
  insights, loading, selectedCountry, onCountryChange, onRefresh,
}: Props) {
  const countryOpt = COUNTRY_OPTIONS.find((o) => o.code === selectedCountry);

  // Currency is ALWAYS taken from the API response, never from the country
  // option.  This is the single source of truth. The country option's currency
  // field is only used as a placeholder in the skeleton while loading.
  const displayCurrency = insights?.currency ?? countryOpt?.currency ?? "USD";

  return (
    <div className="space-y-5">
      <CountrySelector selected={selectedCountry} onChange={onCountryChange} disabled={loading} />

      {loading  && <Skeleton />}
      {!loading && !insights && <EmptyState onRefresh={onRefresh} />}

      {!loading && insights && (() => {
        const {
          jobTitle, dataStatus, minSalary, avgSalary, maxSalary,
          salaryMetricLabel, salaryPeriod, marketDemand, trendingSkills,
          salaryGrowthTrends, skillGapAnalysis, salaryRecommendation,
          sourceLabel, confidenceScore, jobsAnalyzed, cachedAt,
        } = insights;

        const cfg       = STATUS_CFG[dataStatus];
        const showSalary = cfg.showSalary && minSalary != null && avgSalary != null && maxSalary != null;

        const demandCls =
          marketDemand === "High"  ? "bg-success/15 text-success border-success/30"
          : marketDemand === "Low" ? "bg-error/15 text-error border-error/30"
          : "bg-warning/15 text-warning border-warning/30";

        const cachedLabel = cachedAt ? (() => {
          try {
            return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
              Math.round((new Date(cachedAt).getTime() - Date.now()) / 60000), "minute",
            );
          } catch { return null; }
        })() : null;

        const periodLabel = salaryPeriod === "monthly" ? "Monthly" : "Annual";

        return (
          <>
            {/* ── Role + country header ─────────────────────────────────── */}
            <div className="bg-base-200 border border-base-300 rounded-2xl px-5 py-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/40 font-mono">
                    Salary comparison for
                  </p>
                  <p className="text-base font-black text-base-content leading-tight">{jobTitle}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {countryOpt && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-base-content/70">
                        <span className="text-sm">{countryOpt.flag}</span>{countryOpt.label}
                      </span>
                    )}
                    <span className="text-base-content/30 text-[10px]">·</span>
                    <span className="text-[10px] font-bold font-mono text-base-content/50">{displayCurrency}</span>
                    <span className="text-base-content/30 text-[10px]">·</span>
                    <StatusBadge status={dataStatus} />
                    {cachedLabel && (
                      <span className="text-[10px] text-base-content/30 font-mono">· {cachedLabel}</span>
                    )}
                  </div>
                </div>
                <button onClick={onRefresh}
                  className="btn btn-xs btn-ghost border border-base-300 rounded-xl text-[10px] font-bold
                    text-base-content/60 hover:text-[#7c3aed] hover:border-[#7c3aed]/40 gap-1.5 self-start sm:self-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* ── Status message for no-data / error states ─────────────── */}
            <DataStatusCard status={dataStatus} sourceLabel={sourceLabel} onRefresh={onRefresh} />

            {/* ── Salary range — only when we have real numbers ─────────── */}
            {showSalary && (
              <div className="bg-base-200 border border-base-300 rounded-2xl px-5 py-5 shadow-sm space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono">
                  Salary Range · {periodLabel} · {displayCurrency}
                  {dataStatus === "INSUFFICIENT_DATA" && (
                    <span className="ml-2 text-warning normal-case font-normal">· limited sample</span>
                  )}
                </p>
                <SalaryRangeBar
                  min={minSalary!} avg={avgSalary!} max={maxSalary!}
                  currency={displayCurrency}
                  metricLabel={salaryMetricLabel}
                  period={salaryPeriod}
                />
              </div>
            )}

            {/* ── Data confidence ───────────────────────────────────────── */}
            <div className="bg-base-200 border border-base-300 rounded-2xl px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono">
                  Data Confidence
                </p>
                <span className="text-[10px] text-base-content/40 font-mono">{sourceLabel}</span>
              </div>
              <ConfidenceBar score={confidenceScore} jobsAnalyzed={jobsAnalyzed} />
            </div>

            {/* ── Salary expectation — only when we have numbers ────────── */}
            {showSalary && salaryRecommendation && (
              <div className="bg-[#7c3aed]/5 border border-[#7c3aed]/20 rounded-2xl px-5 py-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c3aed]/70 font-mono mb-2">
                  Salary Expectation
                  {dataStatus === "AI_ESTIMATE" && (
                    <span className="ml-2 normal-case font-normal text-[#7c3aed]/50">· AI estimate, not verified market data</span>
                  )}
                </p>
                <p className="text-xs text-base-content/80 leading-relaxed">{salaryRecommendation}</p>
              </div>
            )}

            {/* ── Market demand + trending skills ───────────────────────── */}
            {(marketDemand || trendingSkills.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketDemand && (
                  <div className="bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono mb-3">
                      Market Demand
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${demandCls}`}>
                        {marketDemand}
                      </span>
                      <span className="text-xs text-base-content/60">
                        {marketDemand === "High"  ? "Strong hiring activity — good leverage to negotiate."
                        : marketDemand === "Low"  ? "Softer market — focus on differentiating skills."
                        : "Stable demand in this market."}
                      </span>
                    </div>
                  </div>
                )}
                {trendingSkills.length > 0 && (
                  <div className="bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono mb-3">
                      Trending Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {trendingSkills.map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 rounded-lg text-[11px] font-bold">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Growth chart ──────────────────────────────────────────── */}
            {salaryGrowthTrends.length > 0 && (
              <div className="bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono">
                    Salary Growth Trend
                  </p>
                  <span className="text-[10px] text-base-content/30 font-mono">
                    {salaryGrowthTrends[0]?.year}–{salaryGrowthTrends[salaryGrowthTrends.length - 1]?.year} · {displayCurrency}
                  </span>
                </div>
                <SalaryBarChart trends={salaryGrowthTrends} currency={displayCurrency} />
              </div>
            )}

            {/* ── Skill gap ─────────────────────────────────────────────── */}
            {skillGapAnalysis && (skillGapAnalysis.missingSkills.length > 0 || skillGapAnalysis.recommendations.length > 0) && (
              <div className="bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono mb-4">
                  Skill Gap & Recommendations
                </p>
                <div className="space-y-4">
                  {skillGapAnalysis.missingSkills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-error/80 uppercase font-mono mb-2">Skills to add</p>
                      <div className="flex flex-wrap gap-2">
                        {skillGapAnalysis.missingSkills.map((s) => (
                          <span key={s} className="px-2.5 py-1 bg-error/10 text-error border border-error/20 rounded-lg text-[11px] font-semibold">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {skillGapAnalysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 bg-[#7c3aed]/5 border border-[#7c3aed]/15 rounded-xl">
                      <span className="text-[#7c3aed] text-sm mt-0.5 flex-shrink-0">✦</span>
                      <p className="text-xs text-base-content/80 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Footer ───────────────────────────────────────────────── */}
            <p className="text-[10px] text-base-content/25 text-center font-mono pb-1">
              {sourceLabel}
              {cachedLabel ? ` · ${cachedLabel}` : ""}
            </p>
          </>
        );
      })()}
    </div>
  );
}
