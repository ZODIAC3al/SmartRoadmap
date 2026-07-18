"use client";

import React from "react";

// ─── Country catalogue (mirrors backend COUNTRY_MAP) ─────────────────────────

export interface CountryOption {
  code: string;   // ISO-3166-1 alpha-2
  label: string;
  flag: string;   // emoji flag
  currency: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  // Middle East / Africa — shown first because they are the primary markets
  { code: "eg", label: "Egypt",        flag: "🇪🇬", currency: "EGP" },
  { code: "sa", label: "Saudi Arabia", flag: "🇸🇦", currency: "SAR" },
  { code: "ae", label: "UAE",          flag: "🇦🇪", currency: "AED" },
  // English-speaking / Adzuna-native
  { code: "us", label: "USA",          flag: "🇺🇸", currency: "USD" },
  { code: "gb", label: "UK",           flag: "🇬🇧", currency: "GBP" },
  { code: "ca", label: "Canada",       flag: "🇨🇦", currency: "CAD" },
  { code: "au", label: "Australia",    flag: "🇦🇺", currency: "AUD" },
  // Europe
  { code: "de", label: "Germany",      flag: "🇩🇪", currency: "EUR" },
  { code: "fr", label: "France",       flag: "🇫🇷", currency: "EUR" },
  { code: "nl", label: "Netherlands",  flag: "🇳🇱", currency: "EUR" },
  // Asia / Pacific
  { code: "in", label: "India",        flag: "🇮🇳", currency: "INR" },
  { code: "sg", label: "Singapore",    flag: "🇸🇬", currency: "SGD" },
];

// ─── Response types (mirror apps/api/src/modules/salary/dto/salary.dto.ts) ───

interface SalaryGrowthPoint {
  year: number;
  averageSalary: number;
}

interface SkillGapAnalysis {
  missingSkills: string[];
  recommendations: string[];
}

export interface SalaryInsights {
  minSalary: number;
  avgSalary: number;
  maxSalary: number;
  currency: string;
  marketDemand: "High" | "Moderate" | "Low";
  trendingSkills: string[];
  salaryGrowthTrends: SalaryGrowthPoint[];
  skillGapAnalysis: SkillGapAnalysis;
  dataSource: "Adzuna" | "AI Estimate" | "Fallback";
  confidenceScore: number;
  jobsAnalyzed: number;
  cachedAt?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  insights: SalaryInsights | null;
  loading: boolean;
  selectedCountry: string;           // ISO-3166-1 alpha-2, e.g. "eg"
  onCountryChange: (code: string) => void;
  onRefresh: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a number as currency using the correct locale and symbol. */
function formatSalary(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

/**
 * Format a bar-chart label: keeps it short.
 * e.g.  1_200_000 EGP → "1.2M"  |  85_000 USD → "85k"  |  500 SGD → "500"
 */
function shortSalaryLabel(value: number, currency: string): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${Math.round(value / 1_000)}k`;
  return String(value);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DataSourceBadge({ source }: { source: SalaryInsights["dataSource"] }) {
  const styles: Record<SalaryInsights["dataSource"], string> = {
    Adzuna:        "bg-success/15 text-success border-success/30",
    "AI Estimate": "bg-[#7c3aed]/15 text-[#7c3aed] border-[#7c3aed]/30",
    Fallback:      "bg-base-content/10 text-base-content/60 border-base-content/20",
  };
  const icons: Record<SalaryInsights["dataSource"], string> = {
    Adzuna: "⚡", "AI Estimate": "🤖", Fallback: "📊",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono ${styles[source]}`}>
      {icons[source]} {source}
    </span>
  );
}

function ConfidenceBar({ score, jobsAnalyzed }: { score: number; jobsAnalyzed: number }) {
  const color = score >= 70 ? "bg-success" : score >= 40 ? "bg-[#7c3aed]" : "bg-warning";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-base-300 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-bold text-base-content/60 font-mono w-10 text-right">{score}%</span>
      {jobsAnalyzed > 0 && (
        <span className="text-[10px] text-base-content/40 font-mono whitespace-nowrap">{jobsAnalyzed} jobs</span>
      )}
    </div>
  );
}

function SalaryBarChart({ trends, currency }: { trends: SalaryGrowthPoint[]; currency: string }) {
  if (!trends.length) return null;
  const max = Math.max(...trends.map((t) => t.averageSalary));
  const currentYear = new Date().getFullYear();
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-32 pt-2">
      {trends.map((t) => {
        const heightPct = Math.round((t.averageSalary / max) * 88);
        const isCurrent = t.year === currentYear;
        return (
          <div key={t.year} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-[9px] text-base-content/50 font-mono leading-none">
              {shortSalaryLabel(t.averageSalary, currency)}
            </span>
            <div className="w-full flex flex-col justify-end" style={{ height: "88px" }}>
              <div
                className={`w-full rounded-t-lg transition-all duration-700 ${isCurrent ? "bg-[#7c3aed]" : "bg-[#7c3aed]/40"}`}
                style={{ height: `${heightPct}px` }}
              />
            </div>
            <span className={`text-[9px] font-bold font-mono ${isCurrent ? "text-[#7c3aed]" : "text-base-content/50"}`}>
              {t.year}
            </span>
          </div>
        );
      })}
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
        <p className="text-xs text-base-content/55 mt-1 max-w-xs">
          Select a country above and make sure your career profile has a role, location, and skills filled in.
        </p>
      </div>
      <button
        onClick={onRefresh}
        className="btn btn-sm bg-[#7c3aed] hover:bg-[#6d28d9] border-none text-white rounded-xl text-xs font-bold px-6"
      >
        Try again
      </button>
    </div>
  );
}

// ─── Country selector ─────────────────────────────────────────────────────────

function CountrySelector({
  selected,
  onChange,
  disabled,
}: {
  selected: string;
  onChange: (code: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="bg-base-200 border border-base-300 rounded-2xl px-5 py-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono mb-3">
        Country / Market
      </p>
      <div className="flex flex-wrap gap-2">
        {COUNTRY_OPTIONS.map((opt) => {
          const isActive = selected === opt.code;
          return (
            <button
              key={opt.code}
              disabled={disabled}
              onClick={() => onChange(opt.code)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border
                ${isActive
                  ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-sm"
                  : "bg-base-100 text-base-content/70 border-base-300 hover:border-[#7c3aed]/50 hover:text-[#7c3aed]"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-base leading-none">{opt.flag}</span>
              <span>{opt.label}</span>
              <span className="text-[9px] font-mono opacity-70">{opt.currency}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function SalaryInsightsPanel({
  insights,
  loading,
  selectedCountry,
  onCountryChange,
  onRefresh,
}: Props) {

  // Derive the display currency from the selected country option (client-side
  // label while loading) — falls back to whatever the API returned once loaded.
  const countryOpt = COUNTRY_OPTIONS.find((o) => o.code === selectedCountry);
  const displayCurrency = insights?.currency ?? countryOpt?.currency ?? "USD";

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Country selector stays interactive while loading */}
        <CountrySelector selected={selectedCountry} onChange={onCountryChange} disabled={true} />
        <div className="space-y-4 animate-pulse">
          <div className="h-16 rounded-2xl bg-base-300" />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-base-300" />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 rounded-2xl bg-base-300" />
            <div className="h-28 rounded-2xl bg-base-300" />
          </div>
          <div className="h-44 rounded-2xl bg-base-300" />
          <div className="h-36 rounded-2xl bg-base-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Country selector ──────────────────────────────────────────────── */}
      <CountrySelector selected={selectedCountry} onChange={onCountryChange} disabled={false} />

      {/* ── No-data state ─────────────────────────────────────────────────── */}
      {!insights && <EmptyState onRefresh={onRefresh} />}

      {insights && (() => {
        const { marketDemand } = insights;
        const demandStyle =
          marketDemand === "High"   ? "bg-success/15 text-success border-success/30"
          : marketDemand === "Low"  ? "bg-error/15 text-error border-error/30"
          : "bg-warning/15 text-warning border-warning/30";
        const demandHint =
          marketDemand === "High"  ? "Strong demand — great time to negotiate!"
          : marketDemand === "Low" ? "Lower demand — consider upskilling."
          : "Stable demand in your market.";
        const hasMissingSkills   = (insights.skillGapAnalysis?.missingSkills?.length ?? 0) > 0;
        const hasRecommendations = (insights.skillGapAnalysis?.recommendations?.length ?? 0) > 0;

        const cachedLabel = insights.cachedAt
          ? `Cached ${new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
              Math.round((new Date(insights.cachedAt).getTime() - Date.now()) / 60000),
              "minute",
            )}`
          : null;

        return (
          <>
            {/* ── Header: data-source badge + refresh ───────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DataSourceBadge source={insights.dataSource} />
                {insights.dataSource === "Adzuna" && (
                  <span className="text-[10px] text-base-content/40 font-mono">Live market data</span>
                )}
                {insights.dataSource !== "Adzuna" && countryOpt && (
                  <span className="text-[10px] text-base-content/40 font-mono">
                    {countryOpt.flag} {countryOpt.label} · {displayCurrency}
                  </span>
                )}
                {cachedLabel && (
                  <span className="text-[10px] text-base-content/30 font-mono">· {cachedLabel}</span>
                )}
              </div>
              <button
                onClick={onRefresh}
                className="btn btn-xs btn-ghost border border-base-300 rounded-xl text-[10px] font-bold text-base-content/60 hover:text-[#7c3aed] hover:border-[#7c3aed]/40 gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {/* ── Confidence ────────────────────────────────────────────── */}
            <div className="bg-base-200 border border-base-300 rounded-2xl px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono">
                  Data Confidence
                </p>
                {insights.jobsAnalyzed > 0 && (
                  <span className="text-[10px] text-base-content/40 font-mono">
                    Based on {insights.jobsAnalyzed} real job listings
                  </span>
                )}
              </div>
              <ConfidenceBar score={insights.confidenceScore} jobsAnalyzed={insights.jobsAnalyzed} />
            </div>

            {/* ── Salary range cards ────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(
                [
                  { label: "Min Salary", value: insights.minSalary, accent: "text-base-content" },
                  { label: "Avg Salary", value: insights.avgSalary, accent: "text-[#7c3aed]" },
                  { label: "Max Salary", value: insights.maxSalary, accent: "text-success" },
                ] as const
              ).map((card) => (
                <div key={card.label} className="bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono mb-1.5">
                    {card.label}
                  </p>
                  <p className={`text-2xl font-black ${card.accent} tabular-nums`}>
                    {formatSalary(card.value, displayCurrency)}
                  </p>
                  <p className="text-[10px] text-base-content/40 mt-1">
                    / year · {displayCurrency}
                    {countryOpt && ` · ${countryOpt.flag} ${countryOpt.label}`}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Market demand + trending skills ───────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono mb-3">
                  Market Demand
                </p>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${demandStyle}`}>
                    {marketDemand}
                  </span>
                  <span className="text-xs text-base-content/60 leading-snug">{demandHint}</span>
                </div>
              </div>

              <div className="bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono mb-3">
                  Trending Skills
                </p>
                {insights.trendingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {insights.trendingSkills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 rounded-lg text-[11px] font-bold">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-base-content/40">No trending skills data available.</p>
                )}
              </div>
            </div>

            {/* ── Salary growth chart ───────────────────────────────────── */}
            {insights.salaryGrowthTrends.length > 0 && (
              <div className="bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono">
                    Salary Growth Trend
                  </p>
                  <span className="text-[10px] text-base-content/30 font-mono">
                    {insights.salaryGrowthTrends[0]?.year}–
                    {insights.salaryGrowthTrends[insights.salaryGrowthTrends.length - 1]?.year}
                    {" · "}{displayCurrency}
                  </span>
                </div>
                <SalaryBarChart trends={insights.salaryGrowthTrends} currency={displayCurrency} />
              </div>
            )}

            {/* ── AI recommendations ────────────────────────────────────── */}
            {(hasMissingSkills || hasRecommendations) && (
              <div className="bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono mb-4">
                  AI-Powered Recommendations
                </p>
                <div className="space-y-4">
                  {hasMissingSkills && (
                    <div>
                      <p className="text-[10px] font-bold text-error/80 uppercase font-mono mb-2">Skills to add</p>
                      <div className="flex flex-wrap gap-2">
                        {insights.skillGapAnalysis.missingSkills.map((s) => (
                          <span key={s} className="px-2.5 py-1 bg-error/10 text-error border border-error/20 rounded-lg text-[11px] font-semibold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasRecommendations && insights.skillGapAnalysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 bg-[#7c3aed]/5 border border-[#7c3aed]/15 rounded-xl">
                      <span className="text-[#7c3aed] text-sm mt-0.5 flex-shrink-0">✦</span>
                      <p className="text-xs text-base-content/80 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Footer note ───────────────────────────────────────────── */}
            <p className="text-[10px] text-base-content/30 text-center font-mono pb-1">
              {insights.dataSource === "Adzuna"
                ? `Salary data sourced from ${insights.jobsAnalyzed} live Adzuna job listings · ${displayCurrency} · cached 24h.`
                : insights.dataSource === "AI Estimate"
                ? `AI estimate powered by Gemini · ${countryOpt?.label ?? "selected market"} · ${displayCurrency} · results are approximate.`
                : `Deterministic estimate · ${displayCurrency}. Update your profile for better accuracy.`}
            </p>
          </>
        );
      })()}
    </div>
  );
}
