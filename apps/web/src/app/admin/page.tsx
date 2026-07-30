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

export default function AdminDashboard() {
  const router = useRouter();
  const { locale } = useApp();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Statistics
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalLearners: 0,
    totalCompanies: 0,
    totalMentors: 0,
    totalAdmins: 0,
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

  useEffect(() => {
    void (async () => {
      const me = await fetchMe();
      if (!me || me.role !== "admin") {
        setLoading(false);
        return;
      }
      setUser(me);
      await fetchAnalyticsData();
      setLoading(false);
    })();
  }, [fetchAnalyticsData]);

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
        <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
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
            <p className="text-xs text-base-content/50">
              Only master system operations and platform controllers are
              authorized to access the system metrics index.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSimulateAdmin}
              className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl font-semibold h-12 w-full transition-all duration-200"
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
    <div className={`sr-console min-h-screen text-base-content pb-10 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="sr-shell max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Admin Header Banner */}
        <div className="sr-stage sr-signal flex flex-col md:flex-row justify-between items-start md:items-center gap-5 rounded-3xl p-6 sm:p-8">
          <div>
            <span className="sr-kicker">
              {isRtl ? "لوحة التحكم التشغيلية الكبرى" : "OPERATIONAL COMMAND CONSOLE"}
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              Operations Console
            </h1>
            <p className="text-xs text-base-content/50 mt-0.5">
              {isRtl
                ? "إدارة حسابات المستخدمين، والإشراف على المجتمع، ومراجعة الأداء والإشارات التشغيلية."
                : "Manage access, review community health, audit actions, and turn live platform signals into decisions."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/admin/users"
              className="sr-button btn btn-xs sm:btn-sm"
            >
              {isRtl ? "إدارة الأعضاء وسجلات الأمان" : "Manage users"}
            </Link>
            <Link
              href="/admin/content"
              className="sr-button-secondary btn btn-xs sm:btn-sm"
            >
              {isRtl ? "إشراف ومراقبة المحتوى" : "Moderation queue"}
            </Link>
            <button
              onClick={() => {
                logout();
                setUser(null);
                toast.info("Logged out from admin panel.");
                router.push("/");
              }}
              className="btn btn-xs sm:btn-sm btn-ghost text-red-500 rounded-xl hover:bg-red-50"
            >
              {isRtl ? "تسجيل الخروج" : "Logout Admin"}
            </button>
          </div>
        </div>

        {/* Analytics counts grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sr-card p-5 rounded-2xl">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              {isRtl ? "إجمالي المستخدمين" : "Total Users"}
            </span>
            <span className="text-3xl font-black font-mono text-base-content block mt-1">
              {stats.totalUsers}
            </span>
            <span className="text-[9px] text-base-content/40 block font-mono">
              {stats.totalLearners} {isRtl ? "طالب" : "Candidates"} • {stats.totalMentors} {isRtl ? "موجه" : "Mentors"}
            </span>
          </div>

          <div className="sr-card p-5 rounded-2xl">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              {isRtl ? "نسبة اجتياز الاختبارات" : "Quiz Pass Rate"}
            </span>
            <span className="text-3xl font-black font-mono text-[#059669] block mt-1">
              {stats.quizPassRate}
            </span>
            <span className="text-[9px] text-base-content/40 block font-mono">
              {stats.quizzesPassed} {isRtl ? "ناجحة" : "Passed"} • {stats.quizzesFailed} {isRtl ? "فاشلة" : "Failed"}
            </span>
          </div>

          <div className="sr-card p-5 rounded-2xl">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              {isRtl ? "نشاط المجتمع" : "Community Hub"}
            </span>
            <span className="text-3xl font-black font-mono text-[#10B981] block mt-1">
              {stats.activePosts} Posts
            </span>
            <span className="text-[9px] text-base-content/40 block font-mono">
              {stats.activeComments} {isRtl ? "تعليقات مجتمعية" : "Comments tracked"}
            </span>
          </div>

          <div className="sr-card p-5 rounded-2xl">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              {isRtl ? "جلسات التوجيه" : "Mentorship Sessions"}
            </span>
            <span className="text-3xl font-black font-mono text-base-content block mt-1">
              {stats.totalSessions}
            </span>
            <span className="text-[9px] text-base-content/40 block font-mono">
              {stats.completedSessions} {isRtl ? "مكتملة" : "Completed"} • {stats.pendingSessions} {isRtl ? "معلقة" : "Pending"}
            </span>
          </div>
        </div>

        {/* Operational brief */}
        <div className="sr-panel rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="sr-chip">LIVE BRIEF</span>
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
              className="sr-button btn btn-xs px-3"
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
                <p className="text-base-content/80">{operationalInsights.bottlenecks}</p>
              </div>
              <div className="space-y-1.5 p-4 bg-base-200 border border-base-300 rounded-xl">
                <span className="font-black text-purple-500 block uppercase tracking-wider font-mono text-[9px]">
                  2. MENTORSHIP QUALITY
                </span>
                <p className="text-base-content/80">{operationalInsights.mentorshipStatus}</p>
              </div>
              <div className="space-y-1.5 p-4 bg-base-200 border border-base-300 rounded-xl">
                <span className="font-black text-emerald-500 block uppercase tracking-wider font-mono text-[9px]">
                  3. RECOMMENDATIONS
                </span>
                <p className="text-base-content/80">{operationalInsights.recommendations}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-base-content/40 text-xs">
              {isRtl ? "أنشئ موجزاً مباشراً من بيانات التعلم والتوجيه والإشراف الحالية." : "Generate a live brief from current learning, mentor, and moderation signals."}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="sr-kicker">REPORTING &amp; ANALYTICS</span>
            <h2 className="mt-2 text-xl font-black tracking-tight">Patterns you can act on</h2>
            <p className="mt-1 text-xs text-base-content/50">A focused view of acquisition, learning quality, and platform throughput.</p>
          </div>
          <span className="sr-chip">7 DAY WINDOW</span>
        </div>

        {/* Charts Split Area */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Chart 1: Daily Signup Area Chart */}
          <div className="sr-panel rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <h3 className="font-extrabold text-xs text-base-content uppercase tracking-wider font-mono">
                {isRtl ? "تحليل تسجيلات العضوية اليومية" : "Daily Signup Analytics"}
              </h3>
              <span className="text-[9px] bg-[#10B981]/15 text-[#059669] px-2 py-0.5 rounded-full font-bold font-mono">
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
                <div className="text-center py-12 text-base-content/40 text-xs">{isRtl ? "لا توجد سجلات كافية." : "No signup metrics records."}</div>
              )}

              {/* Labels Row */}
              <div className="flex justify-between text-[9px] font-mono text-base-content/40 mt-4 px-2">
                {signupData.map((d, i) => (
                  <span key={i}>
                    {d.day} ({d.count})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Quiz Completion rates bar chart */}
          <div className="sr-panel rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <h3 className="font-extrabold text-xs text-base-content uppercase tracking-wider font-mono">
                {isRtl ? "نسبة نجاح الطلاب بالمهارات" : "Module Quiz Pass Rates"}
              </h3>
              <span className="text-[9px] bg-[#10B981]/15 text-[#059669] px-2 py-0.5 rounded-full font-bold font-mono">
                BENCHMARK
              </span>
            </div>

            {/* Custom Responsive progress bars list */}
            <div className="h-44 w-full pt-4 flex flex-col justify-between">
              {quizPassRates.length > 0 ? (
                quizPassRates.map((quiz, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-base-content/70">
                      <span>{quiz.topic}</span>
                      <span className="font-mono text-[#059669] font-bold">
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
                <div className="text-center py-12 text-base-content/40 text-xs">{isRtl ? "لا توجد سجلات." : "No metrics records."}</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
