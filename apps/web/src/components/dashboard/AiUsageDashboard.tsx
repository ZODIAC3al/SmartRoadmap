'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetAiQuotaQuery,
  useGetAiHistoryQuery,
} from '@/store/api/aiUsageApi';
import {
  Zap,
  Sparkles,
  Download,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { getCachedUser, apiFetch } from '@/lib/api';

export const AiUsageDashboard: React.FC = () => {
  const { data: quota, isLoading: quotaLoading } = useGetAiQuotaQuery();
  const { data: history, isLoading: historyLoading } = useGetAiHistoryQuery();
  const router = useRouter();
  const user = typeof window !== 'undefined' ? getCachedUser() : null;
  const isCompany = user?.role === 'company';

  // Pagination state for historical logs (5 items per page on UI)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleGoToPricing = () => {
    if (isCompany) {
      router.push('/pricing?for=company');
    } else {
      router.push('/pricing');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await apiFetch('/export/ai-usage/pdf');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devotopia-ai-usage-statement.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF export failed:', err);
    }
  };

  if (quotaLoading) {
    return (
      <div className="p-6 rounded-2xl bg-base-200 border border-base-300 animate-pulse flex items-center justify-center text-base-content/60 font-medium">
        Loading AI Quota Metrics...
      </div>
    );
  }

  const allocated = quota?.allocatedCredits || 50;
  const consumed = quota?.consumedCredits || 0;
  const reserved = quota?.reservedCredits || 0;
  const remaining = quota?.remainingCredits || 0;
  const percentage = quota?.usagePercentage || 0;
  const thresholdState = quota?.thresholdState || 'normal';
  const isProPlan = allocated >= 500;

  // Compute pagination over historical log list
  const totalItems = history?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = (history || []).slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 text-start">
      {/* Warning Banners based on threshold state */}
      {thresholdState === 'warning_75' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-600 dark:text-amber-300 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              <strong>75% AI Allowance Used:</strong> You have consumed {percentage}% of your monthly AI credits.
            </span>
          </div>
          <button
            onClick={handleGoToPricing}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1 shrink-0 shadow-xs"
          >
            Upgrade Plan <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {thresholdState === 'critical_90' && (
        <div className="p-4 rounded-2xl bg-orange-500/15 border border-orange-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-orange-600 dark:text-orange-200 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 animate-bounce" />
            <span>
              <strong>90% AI Allowance Used:</strong> You are nearing your monthly limit ({remaining} credits remaining).
            </span>
          </div>
          <button
            onClick={handleGoToPricing}
            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition flex items-center gap-1 shrink-0 shadow-xs"
          >
            Upgrade Plan <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {thresholdState === 'exhausted_100' && (
        <div className="p-4 rounded-2xl bg-error/15 border border-error/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-error text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error shrink-0" />
            <span>
              <strong>Monthly AI Allowance Exhausted:</strong> Premium AI features are locked until your next reset or upgrade.
            </span>
          </div>
          <button
            onClick={handleGoToPricing}
            className="px-4 py-2 rounded-xl bg-primary text-primary-content font-bold text-xs shadow-md transition flex items-center gap-1 shrink-0"
          >
            Upgrade to Pro <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Quota Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-base-200 border border-base-300 shadow-sm relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-mono font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 tracking-wider inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" /> AI CREDIT ENGINE
              </span>
              {isProPlan && (
                <span className="text-[10px] uppercase font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 tracking-wider inline-flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> VERIFIED PRO
                </span>
              )}
            </div>
            <h3 className="text-2xl font-extrabold text-base-content tracking-tight">
              Monthly AI Entitlement
            </h3>
            <p className="text-xs sm:text-sm text-base-content/70 font-medium mt-1">
              Atomic four-metric quota engine & server-enforced feature authorization
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl bg-base-100 hover:bg-base-300 text-base-content font-semibold text-xs border border-base-300 transition flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4 text-primary" /> Export PDF Statement
            </button>
            {!isProPlan && (
              <button
                onClick={handleGoToPricing}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-content font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />{" "}
                {isCompany ? "Upgrade Plan (Growth/Scale)" : "Upgrade to Pro ($15/mo)"}
              </button>
            )}
          </div>
        </div>

        {/* Meter Gauge Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-base-300/80">
          <div className="p-4 rounded-2xl bg-base-100 border border-base-300">
            <div className="text-[10px] text-base-content/60 font-extrabold uppercase tracking-wider font-mono">
              Allocated
            </div>
            <div className="text-lg sm:text-2xl font-black text-base-content font-mono mt-1">
              {allocated} credits
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-base-100 border border-base-300">
            <div className="text-[10px] text-base-content/60 font-extrabold uppercase tracking-wider font-mono">
              Consumed
            </div>
            <div className="text-lg sm:text-2xl font-black text-primary font-mono mt-1">
              {consumed} credits
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-base-100 border border-base-300">
            <div className="text-[10px] text-base-content/60 font-extrabold uppercase tracking-wider font-mono">
              Reserved
            </div>
            <div className="text-lg sm:text-2xl font-black text-secondary font-mono mt-1">
              {reserved} credits
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-base-100 border border-base-300">
            <div className="text-[10px] text-base-content/60 font-extrabold uppercase tracking-wider font-mono">
              Remaining
            </div>
            <div className={`text-lg sm:text-2xl font-black font-mono mt-1 ${remaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
              {remaining} credits
            </div>
          </div>
        </div>

        {/* Capacity Utilization Bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-semibold text-base-content/70 mb-2">
            <span>Capacity Utilized ({consumed + reserved} / {allocated} credits)</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full h-3 bg-base-300 rounded-full overflow-hidden p-0.5 border border-base-300/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentage >= 90
                  ? 'bg-error'
                  : percentage >= 75
                  ? 'bg-amber-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Historical Ledger Table with UI Pagination (> 5 items) */}
      <div className="p-6 rounded-3xl bg-base-200 border border-base-300 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-extrabold text-base-content flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-primary" /> Recent AI Execution Activity
          </h4>

          {totalItems > 0 && (
            <div className="text-xs text-base-content/60 font-mono">
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} logs
            </div>
          )}
        </div>

        {historyLoading ? (
          <div className="text-xs text-base-content/60 py-6 text-center">Loading activity ledger...</div>
        ) : !history || history.length === 0 ? (
          <div className="text-xs text-base-content/60 py-8 text-center font-medium">
            No AI requests logged yet for this period.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-base-300 text-base-content/60 uppercase font-mono tracking-wider font-bold">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Feature</th>
                    <th className="py-3 px-3">Model / Provider</th>
                    <th className="py-3 px-3 text-center">Credits</th>
                    <th className="py-3 px-3 text-right">Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-300/60 text-base-content font-medium">
                  {paginatedLogs.map((item) => (
                    <tr key={item._id} className="hover:bg-base-100/50 transition">
                      <td className="py-3 px-3 text-base-content/60">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-bold text-base-content">{item.featureKey}</td>
                      <td className="py-3 px-3 text-base-content/70">
                        {item.provider} ({item.aiModel})
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-primary">
                        {item.creditsConsumed}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-base-content/70">
                        {item.totalTokens.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls (> 5 items) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300/80">
                <span className="text-xs text-base-content/60 font-mono">
                  Page {currentPage} of {totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-base-100 border border-base-300 hover:bg-base-300 text-base-content disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-base-100 border border-base-300 hover:bg-base-300 text-base-content disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
