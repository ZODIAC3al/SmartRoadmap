"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { useApp } from "@/components/AppContext";
import { apiFetch, getCachedUser, hasSession } from "@/lib/api";
import {
  Lock,
  Layout,
  Zap,
  Users,
  Flame,
  Activity,
  Timer,
  Calendar,
  Trophy,
  Medal,
  Star,
  MapPin,
  Crown,
} from "lucide-react";

// ─── Types (unchanged contract with backend) ───────────────────────────────
type Module = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  status: "locked" | "in_progress" | "completed" | "failed";
  topics?: string[];
};

type StreakData = { current: number; longest: number; freezesAvailable: number };

type CalendarEventItem = {
  _id: string;
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  completed: boolean;
};

type AchievementItem = {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  unlockedAt: string;
};

type DashboardSummary = {
  roadmapProgress: number;
  nextModule: Module | null;
  streak: StreakData;
  upcomingEvents: CalendarEventItem[];
  recentAchievements: AchievementItem[];
};

// ─── Copy dictionary ────────────────────────────────────────────────────────
const dict = {
  greeting: { en: "Hi, {name}! What are your plans for today?", ar: "أهلاً {name}! ما هي خططك اليوم؟" },
  intro: {
    en: "This platform is designed to revolutionize the way you organize, access, and verify your adaptive roadmaps and skills passports.",
    ar: "صُممت هذه المنصة لتغيّر طريقة تنظيمك ووصولك والتحقق من خرائط طريقك التكيفية وجوازات مهاراتك.",
  },
  card1Title: { en: "Stay organized", ar: "ابقَ منظماً" },
  card1Body: { en: "Maintain a clear roadmap structure for your learning timeline modules.", ar: "حافظ على بنية واضحة لخارطة طريق وحدات تعلمك." },
  card2Title: { en: "Sync your notes", ar: "زامن ملاحظاتك" },
  card2Body: { en: "Access generated reference cheatsheets and audio summaries anytime.", ar: "اطّلع على أوراق المراجع والملخصات الصوتية في أي وقت." },
  card3Title: { en: "Collaborate & share", ar: "تعاون وشارك" },
  card3Body: { en: "Share your verified competency credentials and score reports directly with companies.", ar: "شارك شهادات كفاءتك الموثّقة وتقارير نتائجك مباشرة مع الشركات." },
  progressTitle: { en: "Roadmap Progress", ar: "تقدّم خارطة الطريق" },
  streakTitle: { en: "Learning Streak", ar: "سلسلة التعلم" },
  current: { en: "Current", ar: "الحالية" },
  longest: { en: "Longest", ar: "الأطول" },
  freezesLeft: { en: "freezes left", ar: "تجميدات متبقية" },
  days: { en: "days", ar: "يوم" },
  notifTitle: { en: "Notifications", ar: "الإشعارات" },
  clearAll: { en: "View all", ar: "عرض الكل" },
  noNotif: { en: "No recent notification alerts.", ar: "لا توجد تنبيهات حديثة." },
  assignmentTitle: { en: "Current Assignment", ar: "المهمة الحالية" },
  inProgress: { en: "IN PROGRESS", ar: "قيد التقدم" },
  roadmapModule: { en: "Roadmap Module", ar: "وحدة خارطة الطريق" },
  openCanvas: { en: "Open Canvas", ar: "فتح اللوحة" },
  proveMastery: { en: "Prove Mastery", ar: "أثبت الإتقان" },
  noModule: { en: "No active learning module matches. Get started on a roadmap!", ar: "لا توجد وحدة تعلم نشطة. ابدأ بخارطة طريق!" },
  todayTasks: { en: "Today tasks", ar: "مهام اليوم" },
  total: { en: "Total", ar: "الإجمالي" },
  estimated: { en: "Estimated", ar: "تقدير" },
  noTasks: { en: "No task objectives set for today.", ar: "لا توجد مهام محددة لهذا اليوم." },
  scheduleSummary: { en: "Schedule Summary", ar: "ملخص الجدول" },
  openFull: { en: "Open Full", ar: "فتح الكل" },
  noSessions: { en: "No study sessions scheduled today.", ar: "لا توجد جلسات دراسية مجدولة اليوم." },
  goPremium: { en: "Go premium!", ar: "ترقّ للمميز!" },
  premiumBody: {
    en: "Gain access to a range of benefits designed to enhance your learning experience. Unlock vector job matches, resume bullet enhancers, and mock execution sandbox.",
    ar: "احصل على مجموعة مزايا لتحسين تجربتك التعليمية. افتح مطابقات وظيفية ذكية، ومحسّن سيرة ذاتية، وبيئة تنفيذ تجريبية.",
  },
  findOutMore: { en: "Find out more", ar: "اعرف المزيد" },
  badgesTitle: { en: "Verified Badges", ar: "الشارات الموثّقة" },
  noBadges: { en: "Earn verified badges by scoring over 70% in assessments.", ar: "احصل على شارات موثّقة بتحقيق أكثر من 70% في التقييمات." },
  restricted: { en: "Access Restricted", ar: "الوصول مقيّد" },
  restrictedBody: {
    en: "Please log in to view your career readiness dashboard, passport, and recommended matches.",
    ar: "يرجى تسجيل الدخول لعرض لوحة تحكم جاهزيتك المهنية وجواز مهاراتك ومطابقاتك الموصى بها.",
  },
  logIn: { en: "Log In", ar: "تسجيل الدخول" },
  register: { en: "Register", ar: "إنشاء حساب" },
};
type DictKey = keyof typeof dict;

export default function DashboardPage() {
  const router = useRouter();
  const { locale } = useApp();
  const isAr = locale === "ar";
  const tr = (key: DictKey, vars?: Record<string, string>) => {
    let str = dict[key][isAr ? "ar" : "en"];
    if (vars) Object.entries(vars).forEach(([k, v]) => (str = str.replace(`{${k}}`, v)));
    return str;
  };
  const prefersReducedMotion = useReducedMotion();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>({
    roadmapProgress: 0,
    nextModule: null,
    streak: { current: 0, longest: 0, freezesAvailable: 0 },
    upcomingEvents: [],
    recentAchievements: [],
  });
  const [notifications, setNotifications] = useState<any[]>([]);

  // ── Activity Tab States ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [activityData, setActivityData] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam === "activity") {
        setActiveTab("activity");
      }
    }
  }, []);

  useEffect(() => {
    const token = hasSession();
    if (!token || activeTab !== "activity") return;

    async function loadActivity() {
      setActivityLoading(true);
      try {
        const res = await apiFetch(`/dashboard/activity?period=${period}`);
        if (res.ok) {
          const body = await res.json();
          setActivityData(body.data);
        }
      } catch (err) {
        console.error("Failed to load activity metrics", err);
      } finally {
        setActivityLoading(false);
      }
    }
    loadActivity();
  }, [activeTab, period]);


  useEffect(() => {
    const storedUser = getCachedUser();
    const storedToken = hasSession();
    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }
    setUser(storedUser);

    async function loadData() {
      try {
        const [sumRes, notifRes] = await Promise.all([
          apiFetch("/dashboard/summary"),
          apiFetch("/notifications"),
        ]);
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData.data);
        }
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.data || []);
        }
      } catch (e) {
        console.error("Error loading dashboard metrics");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ── Skeleton loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-base-100 min-h-screen pb-12 pt-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-3">
            <div className="skeleton h-9 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="skeleton h-40 rounded-2xl" />
              <div className="skeleton h-56 rounded-2xl" />
              <div className="skeleton h-48 rounded-2xl" />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="skeleton h-64 rounded-2xl" />
              <div className="skeleton h-40 rounded-2xl" />
              <div className="skeleton h-40 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-8 text-center bg-base-100">
        <div className="w-16 h-16 rounded-full bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-black text-base-content tracking-tight">{tr("restricted")}</h2>
        <p className="text-sm text-base-content/50 max-w-sm mb-6">{tr("restrictedBody")}</p>
        <div className="flex gap-4">
          <Link href="/auth/login" className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl">
            {tr("logIn")}
          </Link>
          <Link href="/auth/register" className="btn btn-outline border-base-300 text-base-content rounded-xl">
            {tr("register")}
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "company") {
    router.push("/company");
    return null;
  }

  const progressData = [{ name: "progress", value: summary.roadmapProgress, fill: "#6366f1" }];
  const streakData = [
    { name: tr("current"), value: summary.streak.current },
    { name: tr("longest"), value: summary.streak.longest },
  ];

  const quizHistoryData = (summary as any).quizHistory?.length
    ? (summary as any).quizHistory.map((q: any, i: number) => ({
        index: i + 1,
        score: q.score,
        name: `Quiz ${i + 1}`,
      }))
    : [
        { name: "Quiz 1", score: 65 },
        { name: "Quiz 2", score: 70 },
        { name: "Quiz 3", score: 85 },
        { name: "Quiz 4", score: 75 },
        { name: "Quiz 5", score: 90 },
      ];

  const studyTimeData = (summary as any).progressHistory?.length
    ? (summary as any).progressHistory.map((p: any, i: number) => ({
        index: i + 1,
        minutes: p.timeSpentMinutes || 10,
        name: `Session ${i + 1}`,
      }))
    : [
        { name: "Mon", minutes: 20 },
        { name: "Tue", minutes: 45 },
        { name: "Wed", minutes: 30 },
        { name: "Thu", minutes: 60 },
        { name: "Fri", minutes: 40 },
        { name: "Sat", minutes: 75 },
        { name: "Sun", minutes: 50 },
      ];

  const fadeUp = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.08 } },
  };
  const item = {
    hidden: prefersReducedMotion ? {} : { opacity: 0, y: 14 },
    show: prefersReducedMotion ? {} : { opacity: 1, y: 0 },
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="bg-base-100 text-base-content min-h-screen pb-12 pt-6 px-4 sm:px-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Greeting */}
        <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="space-y-2 text-start">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content">
            {tr("greeting", { name: user.name })}
          </h1>
          <p className="text-sm text-base-content/45 max-w-xl">{tr("intro")}</p>
        </motion.div>

        {/* Action cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { icon: <Layout className="w-5 h-5" />, title: tr("card1Title"), body: tr("card1Body"), color: "bg-indigo-600/10 text-indigo-600" },
            { icon: <Zap className="w-5 h-5" />, title: tr("card2Title"), body: tr("card2Body"), color: "bg-emerald-600/10 text-emerald-600" },
            { icon: <Users className="w-5 h-5" />, title: tr("card3Title"), body: tr("card3Body"), color: "bg-purple-600/10 text-purple-600" },
          ].map((c, i) => (
            <motion.div
              key={i}
              variants={item}
              className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-300"
            >
              <span className={`p-3 rounded-xl ${c.color}`}>
                {c.icon}
              </span>
              <div className="space-y-1 text-start">
                <h3 className="font-bold text-base-content text-sm">{c.title}</h3>
                <p className="text-xs text-base-content/45">{c.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex border-b border-base-300 gap-6 text-sm font-semibold mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 relative transition-all ${
              activeTab === "overview"
                ? "text-indigo-600 font-extrabold border-b-2 border-indigo-600"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            {isAr ? "نظرة عامة" : "Overview"}
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-3 relative transition-all ${
              activeTab === "activity"
                ? "text-indigo-600 font-extrabold border-b-2 border-indigo-600"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            {isAr ? "نشاط الدراسة" : "Study Activity"} 📊
          </button>
        </div>

        {activeTab === "overview" ? (
          /* Main grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-6">
              {/* Progress + Streak charts (Recharts, real data only) */}
              <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Roadmap progress radial */}
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start">
                  <h3 className="font-bold text-base-content text-sm mb-2">{tr("progressTitle")}</h3>
                  <div className="relative h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={14}
                        data={progressData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar background dataKey="value" cornerRadius={12} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-indigo-600">{summary.roadmapProgress}%</span>
                    </div>
                  </div>
                </div>

                {/* Streak comparison bar chart */}
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base-content text-sm flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" /> {tr("streakTitle")}
                    </h3>
                    <span className="text-[10px] text-base-content/40 font-mono">
                      {summary.streak.freezesAvailable} {tr("freezesLeft")}
                    </span>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={streakData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          formatter={(v: any) => [`${v} ${tr("days")}`, ""]}
                          contentStyle={{ borderRadius: 12, fontSize: 12 }}
                        />
                        <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Assessment & Study Time Charts */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* LineChart for Quiz Performance */}
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start">
                  <h3 className="font-bold text-base-content text-sm mb-4 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-500" /> Assessment History
                  </h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={quizHistoryData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 6 }} dot={{ strokeWidth: 2, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AreaChart for Study Time Trend */}
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start">
                  <h3 className="font-bold text-base-content text-sm mb-4 flex items-center gap-1.5">
                    <i className="lni lni-timer text-emerald-500" /> Study Activity
                  </h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={studyTimeData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Area type="monotone" dataKey="minutes" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMinutes)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Notifications */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.08 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base-content text-sm">{tr("notifTitle")}</h3>
                  <Link href="/notifications" className="text-xs text-indigo-600 hover:underline font-bold">
                    {tr("clearAll")}
                  </Link>
                </div>
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 2).map((n, i) => (
                      <div key={i} className="bg-base-100 border border-base-300 rounded-xl p-4 flex justify-between items-center gap-3">
                        <div>
                          <span className="text-[9px] uppercase font-mono font-bold text-indigo-600 bg-indigo-600/10 px-2 py-0.5 rounded">
                            {n.type}
                          </span>
                          <h4 className="font-bold text-base-content text-xs mt-1.5">{n.titleEn}</h4>
                          <p className="text-[11px] text-base-content/45 mt-0.5">{n.contentEn}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-base-content/40 italic py-4">{tr("noNotif")}</div>
                  )}
                </div>
              </motion.div>

              {/* Current assignment */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base-content text-sm">{tr("assignmentTitle")}</h3>
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 font-mono font-bold px-2.5 py-0.5 rounded">
                    {tr("inProgress")}
                  </span>
                </div>

                {summary.nextModule ? (
                  <div className="border border-base-300 rounded-xl p-4 bg-base-100 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] text-indigo-600 font-extrabold uppercase font-mono tracking-wider block">
                          {tr("roadmapModule")}
                        </span>
                        <h4 className="font-bold text-base-content text-sm mt-0.5">{summary.nextModule.title}</h4>
                        <p className="text-xs text-base-content/45 mt-1 max-w-md">{summary.nextModule.description}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-base-content/60 bg-base-300 border border-base-300 px-2.5 py-0.5 rounded">
                        {summary.nextModule.difficulty}
                      </span>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Link href="/roadmap" className="btn btn-outline btn-xs rounded text-base-content/70 border-base-300 hover:bg-base-200 gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {tr("openCanvas")}
                      </Link>
                      <Link href={`/quiz/${summary.nextModule.id}`} className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none btn-xs rounded font-bold px-4 gap-1">
                        <Zap className="w-3.5 h-3.5" /> {tr("proveMastery")}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-base-content/40 italic py-4">{tr("noModule")}</div>
                )}
              </motion.div>

              {/* Today tasks */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base-content text-sm">{tr("todayTasks")}</h3>
                  <span className="text-xs font-mono font-bold text-base-content/40">
                    {tr("total")}: {summary.nextModule?.topics?.length || 0}
                  </span>
                </div>
                <div className="space-y-3">
                  {summary.nextModule?.topics?.length ? (
                    summary.nextModule.topics.map((topic: string, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-base-100 border border-base-300 rounded-xl p-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          <span className="text-xs font-bold text-base-content/80">{topic}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] text-base-content/40">{tr("estimated")}: 1h</span>
                          <div className="w-16 bg-base-300 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-full" style={{ width: i === 0 ? "90%" : i === 1 ? "50%" : "10%" }} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-base-content/40 italic py-4">{tr("noTasks")}</div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 space-y-6">
              {/* Schedule summary */}
              <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base-content text-sm">{tr("scheduleSummary")}</h3>
                  <Link href="/calendar" className="text-xs text-indigo-600 hover:underline font-bold">
                    {tr("openFull")}
                  </Link>
                </div>
                <div className="space-y-2 pt-1">
                  {summary.upcomingEvents.length > 0 ? (
                    summary.upcomingEvents.slice(0, 4).map((ev, i) => (
                      <div key={i} className="text-[11px] font-semibold text-base-content/60 flex justify-between items-center border-t border-base-300 pt-2">
                        <span className="truncate max-w-[150px] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          {ev.title}
                        </span>
                        <span className="text-indigo-600 font-bold">
                          {new Date(ev.startAt).toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-base-content/40 italic">{tr("noSessions")}</div>
                  )}
                </div>
              </motion.div>

              {/* Go premium */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="bg-indigo-600 text-white rounded-2xl p-6 shadow-md text-start space-y-4 relative overflow-hidden"
              >
                <div className="absolute -top-12 -end-12 w-28 h-28 rounded-full bg-white/10" />
                <div className="space-y-1 relative z-10">
                  <h3 className="font-extrabold text-lg flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-300 fill-yellow-300" /> {tr("goPremium")}
                  </h3>
                  <p className="text-xs text-indigo-100 leading-relaxed">{tr("premiumBody")}</p>
                </div>
                <Link href="/pricing" className="btn bg-white hover:bg-base-100 text-indigo-600 border-none btn-sm rounded-xl font-bold w-full relative z-10">
                  {tr("findOutMore")}
                </Link>
              </motion.div>

              {/* Achievements */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <h3 className="font-bold text-base-content text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> {tr("badgesTitle")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {summary.recentAchievements.length > 0 ? (
                    summary.recentAchievements.slice(0, 4).map((ach, i) => {
                      const isGold = ach.tier === "gold";
                      const isSilver = ach.tier === "silver";
                      return (
                        <motion.div
                          key={i}
                          whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                          className={`rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-lg border-2 relative overflow-hidden ${isGold
                            ? "bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600 border-amber-300 text-white"
                            : isSilver
                              ? "bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border-slate-100 text-slate-800"
                              : "bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 border-amber-600 text-white"
                            }`}
                        >
                          {isGold ? (
                            <Trophy className="w-6 h-6 text-white" />
                          ) : isSilver ? (
                            <Medal className="w-6 h-6 text-slate-800" />
                          ) : (
                            <Star className="w-6 h-6 text-white fill-white" />
                          )}
                          <h4 className="text-[10px] font-black tracking-tight uppercase mt-2">{ach.title}</h4>
                          <p className={`text-[8px] mt-0.5 leading-snug font-semibold ${isGold || ach.tier === "bronze" ? "text-amber-100" : "text-slate-600"}`}>
                            {ach.description}
                          </p>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-xs text-base-content/40 italic text-center py-4">{tr("noBadges")}</div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Activity Analytics Dashboard Tab */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-start"
          >
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-base-200 border border-base-300 p-4 rounded-2xl">
              <div>
                <h3 className="font-extrabold text-sm text-base-content">
                  {isAr ? "تحليلات النشاط التفصيلية" : "Detailed Activity Analytics"}
                </h3>
                <p className="text-[10px] text-base-content/50">
                  {isAr ? "إحصاءات من قاعدة بيانات تقدمك الفعلية" : "Historical analytics computed from actual study logs"}
                </p>
              </div>
              <div className="flex gap-1 bg-base-300 p-1 rounded-xl">
                {(["7d", "30d", "90d"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      period === p ? "bg-white text-indigo-600 shadow-sm" : "text-base-content/60 hover:text-base-content"
                    }`}
                  >
                    {p === "7d" ? (isAr ? "٧ أيام" : "7 Days") : p === "30d" ? (isAr ? "٣٠ يوم" : "30 Days") : (isAr ? "٩٠ يوم" : "90 Days")}
                  </button>
                ))}
              </div>
            </div>

            {activityLoading ? (
              <div className="h-64 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-indigo-600" />
              </div>
            ) : activityData ? (
              <div className="space-y-6">
                {/* Summary Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-base-200 border border-base-300 p-5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-base-content/40 block">
                      {isAr ? "إجمالي وقت الدراسة" : "Total Time Spent"}
                    </span>
                    <span className="text-2xl font-black text-indigo-600 block mt-1">
                      {activityData.summary.totalMinutes} {isAr ? "دقائق" : "mins"}
                    </span>
                    <span className="text-[9px] text-base-content/50 block mt-1">
                      ~{Math.round(activityData.summary.totalMinutes / 60)} {isAr ? "ساعات دراسية" : "learning hours"}
                    </span>
                  </div>

                  <div className="bg-base-200 border border-base-300 p-5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-base-content/40 block">
                      {isAr ? "مجموع الاختبارات" : "Quizzes Completed"}
                    </span>
                    <span className="text-2xl font-black text-emerald-500 block mt-1">
                      {activityData.summary.totalQuizzes}
                    </span>
                    <span className="text-[9px] text-base-content/50 block mt-1">
                      {isAr ? "تحقق من الكفاءة" : "Mastery assessments"}
                    </span>
                  </div>

                  <div className="bg-base-200 border border-base-300 p-5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-base-content/40 block">
                      {isAr ? "سلسلة التعلم الحالية" : "Current Learning Streak"}
                    </span>
                    <span className="text-2xl font-black text-amber-500 block mt-1">
                      🔥 {activityData.summary.currentStreak} {isAr ? "يوم" : "days"}
                    </span>
                    <span className="text-[9px] text-base-content/50 block mt-1">
                      {isAr ? "الأطول:" : "Longest:"} {activityData.summary.longestStreak} {isAr ? "يوم" : "days"}
                    </span>
                  </div>

                  <div className="bg-base-200 border border-base-300 p-5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-base-content/40 block">
                      {isAr ? "معدل الأيام النشطة" : "Active Days Ratio"}
                    </span>
                    <span className="text-2xl font-black text-purple-600 block mt-1">
                      {Math.round(
                        (activityData.days.filter((d: any) => d.minutesStudied > 0 || d.quizzes > 0).length /
                          activityData.days.length) *
                          100
                      )}
                      %
                    </span>
                    <span className="text-[9px] text-base-content/50 block mt-1">
                      {activityData.days.filter((d: any) => d.minutesStudied > 0 || d.quizzes > 0).length}{" "}
                      {isAr ? "أيام نشطة" : "active days logged"}
                    </span>
                  </div>
                </div>

                {/* AreaChart: Study Minutes */}
                <div className="bg-base-200 border border-base-300 p-6 rounded-2xl">
                  <h4 className="font-extrabold text-sm text-base-content mb-4 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-indigo-500" />
                    {isAr ? "وقت الدراسة اليومي بالدقائق" : "Daily Study Time Trend"}
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="activityMinutesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="date" tickFormatter={(str) => str.slice(5)} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, fontSize: 12, background: "rgba(15, 23, 42, 0.9)", border: "none", color: "#fff" }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area type="monotone" dataKey="minutesStudied" name="Minutes" stroke="#4f46e5" strokeWidth={2.5} fill="url(#activityMinutesGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* BarChart: Quizzes Taken & Average Score */}
                <div className="bg-base-200 border border-base-300 p-6 rounded-2xl">
                  <h4 className="font-extrabold text-sm text-base-content mb-4 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    {isAr ? "الاختبارات المنجزة ومتوسط النتائج" : "Quizzes Completed & Average Score"}
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="date" tickFormatter={(str) => str.slice(5)} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} label={{ value: "Quizzes", angle: -90, position: "insideLeft", fontSize: 10 }} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "Avg Score %", angle: 90, position: "insideRight", fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, background: "rgba(15, 23, 42, 0.9)", border: "none", color: "#fff" }} />
                        <Bar yAxisId="left" dataKey="quizzes" name="Quizzes" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Line yAxisId="right" type="monotone" dataKey="avgScore" name="Avg Score %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-base-content/40 italic">
                {isAr ? "لا توجد سجلات نشاط متاحة للفترة المحددة." : "No study activity logs recorded for this period."}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}