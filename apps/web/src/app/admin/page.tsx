"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import {
  apiJson,
  fetchMe,
  getErrorMessage,
  logout,
  type SessionUser,
} from "@/lib/api";

interface Stats {
  totalUsers: number;
  totalLearners: number;
  totalCompanies: number;
  totalMentors: number;
  totalAdmins: number;
  pendingCompanies: number;
  acceptedCompanies: number;
  rejectedCompanies: number;
  pendingCertificates: number;
  acceptedCertificates: number;
  rejectedCertificates: number;
  quizzesPassed: number;
  quizzesFailed: number;
  quizPassRate: string;
  activePosts: number;
  activeComments: number;
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
}

interface SignupDay {
  day: string;
  count: number;
}

interface QuizRate {
  topic: string;
  rate: number;
}

interface OperationalInsights {
  bottlenecks: string;
  mentorshipStatus: string;
  recommendations: string;
}

interface AnalyticsResponse {
  stats: Stats;
  signupData: SignupDay[];
  quizPassRates: QuizRate[];
}

interface CompanyRecord {
  _id: string;
  name: string;
  email: string;
  companyStatus: "pending" | "accepted" | "rejected" | "blocked";
  companyRejectionReason?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { locale } = useApp();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "companies" | "analytics">("overview");

  // Live Statistics
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalLearners: 0,
    totalCompanies: 0,
    totalMentors: 0,
    totalAdmins: 0,
    pendingCompanies: 0,
    acceptedCompanies: 0,
    rejectedCompanies: 0,
    pendingCertificates: 0,
    acceptedCertificates: 0,
    rejectedCertificates: 0,
    quizzesPassed: 0,
    quizzesFailed: 0,
    quizPassRate: "0%",
    activePosts: 0,
    activeComments: 0,
    totalSessions: 0,
    completedSessions: 0,
    pendingSessions: 0,
  });

  const [signupData, setSignupData] = useState<SignupDay[]>([]);
  const [quizPassRates, setQuizPassRates] = useState<QuizRate[]>([]);
  
  // Operational brief
  const [operationalInsights, setOperationalInsights] = useState<OperationalInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Companies management
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [companiesFilter, setCompaniesFilter] = useState<"all" | "pending" | "accepted" | "rejected" | "blocked">("all");
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [rejectingCompanyId, setRejectingCompanyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const data = await apiJson<AnalyticsResponse>("/admin/analytics");
      setStats(data.stats);
      setSignupData(data.signupData);
      setQuizPassRates(data.quizPassRates);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load system metrics."));
    }
  }, []);

  const fetchCompanies = useCallback(async (filterStatus = companiesFilter) => {
    setLoadingCompanies(true);
    try {
      const statusParam = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const data = await apiJson<CompanyRecord[]>(`/admin/companies${statusParam}`);
      setCompanies(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load companies."));
    } finally {
      setLoadingCompanies(false);
    }
  }, [companiesFilter]);

  useEffect(() => {
    void (async () => {
      const me = await fetchMe();
      if (!me || me.role !== "admin") {
        setLoading(false);
        return;
      }
      setUser(me);
      await fetchAnalyticsData();
      if (activeTab === "companies") {
        await fetchCompanies();
      }
      setLoading(false);
    })();
  }, [fetchAnalyticsData, fetchCompanies, activeTab]);

  const handleCompanyAction = async (id: string, action: "accept" | "reject" | "block") => {
    try {
      const body = action === "reject" || action === "block" ? { reason: rejectReason } : undefined;
      await apiJson(`/admin/companies/${id}/${action}`, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      });
      toast.success(`Company account ${action}ed successfully`);
      setRejectingCompanyId(null);
      setRejectReason("");
      await fetchCompanies(companiesFilter);
      await fetchAnalyticsData(); // Refresh overview numbers
    } catch (error) {
      toast.error(getErrorMessage(error, `Failed to ${action} company`));
    }
  };

  const fetchOperationalInsights = async () => {
    setLoadingInsights(true);
    try {
      const data = await apiJson<OperationalInsights>("/admin/analytics/insights");
      setOperationalInsights(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to compile the operational brief."));
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSimulateAdmin = () => {
    toast.info("Please sign in with an authorized account.");
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#8E1616]"></span>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col min-h-[85vh] items-center justify-center p-8 text-center bg-base-100">
        <div className="max-w-md bg-base-200 border border-base-300 p-8 rounded-2xl shadow-sm space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            🛡️
          </div>
          <div className="space-y-2">
            <h2 className="text-display-md font-extrabold text-base-content leading-tight">
              Admin Gate Restriction
            </h2>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
              Only master system operations and platform controllers are
              authorized to access the system metrics index.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSimulateAdmin}
              className="btn bg-[#8E1616] hover:bg-[#8E1616] text-white border-none rounded-xl font-semibold h-12 w-full transition-all duration-200"
            >
              Simulate Administrator Login (Demo)
            </button>
            <Link
              href="/auth/login"
              className="btn btn-outline border-base-300 text-base-content hover:bg-base-100 rounded-xl h-12 w-full"
            >
              Sign In with Admin Credentials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRtl = locale === "ar";

  // Calculate SVG Area coordinates dynamically based on signup counts
  const maxCount = signupData.length > 0 ? Math.max(...signupData.map((d) => d.count), 1) : 1;
  const svgPoints = signupData
    .map((d, index) => {
      const x = (index / 6) * 500;
      const y = 130 - (d.count / maxCount) * 100;
      return `${x} ${y}`;
    })
    .join(" L ");

  const fillPoints = signupData.length > 0
    ? `M 0 130 L ${svgPoints} L 500 130 Z`
    : "M 0 130 Z";

  return (
    <div className={`min-h-screen bg-base-100 text-base-content pb-12 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Admin Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm">
          <div>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
              {isRtl ? "مدير النظام" : "PLATFORM ADMINISTRATOR"}
            </span>
            <h1 className="text-xl font-extrabold text-base-content mt-1">
              Admin Dashboard
            </h1>
            <p className="text-sm text-base-content/60 mt-0.5">
              {isRtl
                ? "إدارة حسابات المستخدمين، والإشراف على المجتمع، ومراجعة الأداء والإشارات التشغيلية."
                : "Manage access, review community health, audit actions, and turn live platform signals into decisions."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-300 rounded-xl"
            >
              {isRtl ? "المستخدمين" : "Users"}
            </Link>
            <Link
              href="/admin/certificates"
              className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-300 rounded-xl"
            >
              {isRtl ? "الشهادات" : "Certificates"}
            </Link>
            <button
              onClick={() => {
                logout();
                setUser(null);
                toast.info("Logged out from admin panel.");
                router.push("/");
              }}
              className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-xl"
            >
              {isRtl ? "تسجيل الخروج" : "Logout Admin"}
            </button>
          </div>
        </div>

        {/* --- TABS BANDS --- */}
        <div className="flex border-b border-base-300">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-[#10B981] text-[#10B981]"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            Platform Overview
          </button>
          <button
            onClick={() => setActiveTab("companies")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "companies"
                ? "border-[#10B981] text-[#10B981]"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            Company Approvals
            {stats.pendingCompanies > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.pendingCompanies}
              </span>
            )}
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Analytics counts grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-sm">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              {isRtl ? "إجمالي المستخدمين" : "Total Users"}
            </span>
            <span className="text-3xl font-black font-mono text-base-content block mt-1">
              {stats.totalUsers}
            </span>
            <span className="text-[9px] text-stone-600 dark:text-stone-400 font-medium block font-mono">
              {stats.totalLearners} {isRtl ? "طالب" : "Candidates"} • {stats.totalMentors} {isRtl ? "موجه" : "Mentors"}
            </span>
          </div>

          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-sm">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              {isRtl ? "نسبة اجتياز الاختبارات" : "Quiz Pass Rate"}
            </span>
            <span className="text-3xl font-black font-mono text-[#8E1616] block mt-1">
              {stats.quizPassRate}
            </span>
            <span className="text-[9px] text-stone-600 dark:text-stone-400 font-medium block font-mono">
              {stats.quizzesPassed} {isRtl ? "ناجحة" : "Passed"} • {stats.quizzesFailed} {isRtl ? "فاشلة" : "Failed"}
            </span>
          </div>

          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-sm">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              {isRtl ? "نشاط المجتمع" : "Community Hub"}
            </span>
            <span className="text-3xl font-black font-mono text-[#8E1616] block mt-1">
              {stats.activePosts} Posts
            </span>
            <span className="text-[9px] text-stone-600 dark:text-stone-400 font-medium block font-mono">
              {stats.activeComments} {isRtl ? "تعليقات مجتمعية" : "Comments tracked"}
            </span>
          </div>

          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-sm">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              {isRtl ? "جلسات التوجيه" : "Mentorship Sessions"}
            </span>
            <span className="text-3xl font-black font-mono text-base-content block mt-1">
              {stats.totalSessions}
            </span>
            <span className="text-[9px] text-stone-600 dark:text-stone-400 font-medium block font-mono">
              {stats.completedSessions} {isRtl ? "مكتملة" : "Completed"} • {stats.pendingSessions} {isRtl ? "معلقة" : "Pending"}
            </span>
          </div>
        </div>

        {/* Operational brief */}
        <div className="bg-base-200 border border-base-300 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold font-mono">LIVE BRIEF</span>
              <div>
                <h3 className="font-extrabold text-sm text-base-content">
                  {isRtl ? "إشارات الأداء والعقبات التشغيلية" : "Operational Signals & Bottlenecks"}
                </h3>
                <span className="text-[8px] text-indigo-500 font-bold uppercase font-mono block mt-0.5">
                  DATABASE-BACKED PERFORMANCE BRIEF
                </span>
              </div>
            </div>
            <button
              onClick={fetchOperationalInsights}
              disabled={loadingInsights}
              className="btn btn-sm bg-indigo-500 hover:bg-indigo-600 text-white border-none rounded-xl font-bold px-3"
            >
              {loadingInsights ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                isRtl ? "⚡ تشغيل التحليل" : "Generate brief"
              )}
            </button>
          </div>

          {operationalInsights ? (
            <div className="grid md:grid-cols-3 gap-6 text-xs leading-relaxed">
              <div className="space-y-1.5 p-4 bg-base-200 border border-base-300 rounded-xl">
                <span className="font-black text-indigo-500 block uppercase tracking-wider font-mono text-[9px]">
                  1. LEARNING BOTTLENECKS
                </span>
                <p className="text-stone-800 dark:text-stone-200 font-medium">{operationalInsights.bottlenecks}</p>
              </div>
              <div className="space-y-1.5 p-4 bg-base-200 border border-base-300 rounded-xl">
                <span className="font-black text-purple-500 block uppercase tracking-wider font-mono text-[9px]">
                  2. MENTORSHIP QUALITY
                </span>
                <p className="text-stone-800 dark:text-stone-200 font-medium">{operationalInsights.mentorshipStatus}</p>
              </div>
              <div className="space-y-1.5 p-4 bg-base-200 border border-base-300 rounded-xl">
                <span className="font-black text-[#8E1616] block uppercase tracking-wider font-mono text-[9px]">
                  3. RECOMMENDATIONS
                </span>
                <p className="text-stone-800 dark:text-stone-200 font-medium">{operationalInsights.recommendations}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-stone-600 dark:text-stone-400 font-medium text-xs">
              {isRtl ? "أنشئ موجزاً مباشراً من بيانات التعلم والتوجيه والإشراف الحالية." : "Generate a live brief from current learning, mentor, and moderation signals."}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono bg-emerald-500/10 px-2 py-0.5 rounded">REPORTING &amp; ANALYTICS</span>
            <h2 className="mt-2 text-xl font-black tracking-tight">Patterns you can act on</h2>
            <p className="mt-1 text-xs text-stone-700 dark:text-stone-300 font-medium">A focused view of acquisition, learning quality, and platform throughput.</p>
          </div>
          <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold font-mono">7 DAY WINDOW</span>
        </div>

        {/* Charts Split Area */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Chart 1: Daily Signup Area Chart */}
          <div className="bg-base-200 border border-base-300 shadow-sm rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <h3 className="font-extrabold text-xs text-base-content uppercase tracking-wider font-mono">
                {isRtl ? "تحليل تسجيلات العضوية اليومية" : "Daily Signup Analytics"}
              </h3>
              <span className="text-[9px] bg-[#8E1616]/15 text-[#8E1616] px-2 py-0.5 rounded-full font-bold font-mono">
                WEEKLY INDEX
              </span>
            </div>

            {/* Custom Responsive SVG area plot */}
            <div className="relative h-44 w-full pt-4">
              {signupData.length > 0 ? (
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                >
                  <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" strokeWidth="0.5" className="opacity-[0.08]" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="currentColor" strokeWidth="0.5" className="opacity-[0.08]" />
                  <line x1="0" y1="130" x2="500" y2="130" stroke="currentColor" strokeWidth="0.5" className="opacity-[0.08]" />

                  {/* Fill Area gradient path */}
                  <path d={fillPoints} fill="url(#signupGradient)" className="opacity-45" />

                  {/* Outline stroke path */}
                  <path d={`M 0 130 L ${svgPoints}`} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Data points dots */}
                  {signupData.map((d, index) => {
                    const cx = (index / 6) * 500;
                    const cy = 130 - (d.count / maxCount) * 100;
                    return <circle key={index} cx={cx} cy={cy} r="3.5" fill="#22d3ee" />;
                  })}

                  <defs>
                    <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                <div className="text-center py-12 text-stone-600 dark:text-stone-400 font-medium text-xs">{isRtl ? "لا توجد سجلات كافية." : "No signup metrics records."}</div>
              )}

              {/* Labels Row */}
              <div className="flex justify-between text-[9px] font-mono text-stone-600 dark:text-stone-400 font-medium mt-4 px-2">
                {signupData.map((d, i) => (
                  <span key={i}>
                    {d.day} ({d.count})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Quiz Completion rates bar chart */}
          <div className="bg-base-200 border border-base-300 shadow-sm rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <h3 className="font-extrabold text-xs text-base-content uppercase tracking-wider font-mono">
                {isRtl ? "نسبة نجاح الطلاب بالمهارات" : "Module Quiz Pass Rates"}
              </h3>
              <span className="text-[9px] bg-[#8E1616]/15 text-[#8E1616] px-2 py-0.5 rounded-full font-bold font-mono">
                BENCHMARK
              </span>
            </div>

            {/* Custom Responsive progress bars list */}
            <div className="h-44 w-full pt-4 flex flex-col justify-between">
              {quizPassRates.length > 0 ? (
                quizPassRates.map((quiz, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-stone-700 dark:text-stone-300 font-medium">
                      <span>{quiz.topic}</span>
                      <span className="font-mono text-[#8E1616] font-bold">
                        {quiz.rate}% Pass
                      </span>
                    </div>
                    <div className="w-full bg-base-100 border border-base-300 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                        style={{ width: `${quiz.rate}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-stone-600 dark:text-stone-400 font-medium text-xs">{isRtl ? "لا توجد سجلات." : "No metrics records."}</div>
              )}
            </div>
          </div>

        </div>
      </div>
    )}

        {activeTab === "companies" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black tracking-tight">Company Registrations</h2>
                <p className="text-sm text-base-content/60">Review and approve employer accounts.</p>
              </div>
              <div className="flex gap-2 bg-base-200 p-1 rounded-lg">
                {(["all", "pending", "accepted", "rejected", "blocked"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setCompaniesFilter(filter);
                      void fetchCompanies(filter);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      companiesFilter === filter
                        ? "bg-base-100 shadow-sm text-base-content"
                        : "text-base-content/60 hover:text-base-content"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-base-200 border border-base-300 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-base-300/50 text-base-content/70">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Company</th>
                    <th className="px-6 py-4 font-semibold">Registered</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-300">
                  {loadingCompanies ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-base-content/50">
                        <span className="loading loading-spinner text-[#10B981]"></span>
                      </td>
                    </tr>
                  ) : companies.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-base-content/50">
                        No company accounts found.
                      </td>
                    </tr>
                  ) : (
                    companies.map((company) => (
                      <tr key={company._id} className="hover:bg-base-300/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold">{company.name}</div>
                          <div className="text-xs text-base-content/60">{company.email}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-base-content/70">
                          {new Date(company.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              company.companyStatus === "accepted"
                                ? "bg-emerald-100 text-emerald-700"
                                : company.companyStatus === "rejected"
                                ? "bg-red-100 text-red-700"
                                : company.companyStatus === "blocked"
                                ? "bg-slate-200 text-slate-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {company.companyStatus === "pending" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            )}
                            {company.companyStatus}
                          </span>
                          {company.companyRejectionReason && (
                            <div className="text-[10px] text-red-500 mt-1 max-w-[200px] truncate" title={company.companyRejectionReason}>
                              {company.companyRejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {(company.companyStatus === "pending" || company.companyStatus === "accepted" || company.companyStatus === "rejected") && (
                            <div className="flex justify-end gap-2">
                              {rejectingCompanyId === company._id ? (
                                <div className="flex flex-col gap-2 min-w-[200px]">
                                  <input
                                    type="text"
                                    placeholder="Reason for rejection..."
                                    className="input input-xs input-bordered w-full"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                  />
                                  <div className="flex gap-1 justify-end">
                                    <button
                                      onClick={() => {
                                        setRejectingCompanyId(null);
                                        setRejectReason("");
                                      }}
                                      className="btn btn-xs btn-ghost text-base-content/60"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleCompanyAction(company._id, "reject")}
                                      disabled={!rejectReason.trim()}
                                      className="btn btn-xs bg-red-500 hover:bg-red-600 text-white border-none"
                                    >
                                      Confirm Reject
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setRejectingCompanyId(company._id)}
                                    className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleCompanyAction(company._id, "accept")}
                                    className="btn btn-xs bg-[#10B981] hover:bg-[#059669] text-white border-none"
                                  >
                                    Accept
                                  </button>
                                  {company.companyStatus !== "pending" && (
                                    <button
                                      onClick={() => handleCompanyAction(company._id, "block")}
                                      className="btn btn-xs bg-slate-700 hover:bg-slate-800 text-white border-none"
                                    >
                                      Block
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
