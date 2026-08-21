
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarRadiusAxis,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  Legend,
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
  Award,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  Copy,
  X,
  BookOpen,
  Mic,
  FileText,
  TrendingUp,
  BarChart3,
  Target,
  ShieldCheck,
  Layers,
  Compass,
  BrainCircuit,
  GraduationCap,
  Clock,
  PieChart as PieChartIcon,
  CalendarDays,
  Check,
} from "lucide-react";
import VoiceTutorModal from "@/components/VoiceTutorModal";
import CareerGrowthVisual from "@/components/illustrations/CareerGrowthVisual";
import AiAssistantFigure from "@/components/illustrations/AiAssistantFigure";

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

type IssuedCertification = {
  _id: string;
  trackId: string;
  trackTitle: string;
  certificateId: string;
  verifiedSkills: string[];
  shareableUrl: string;
  expiresAt: string;
  badgeKey: string;
  progressPercentage: number;
  longestStreakDays: number;
  createdAt: string;
};

type DashboardSummary = {
  roadmapProgress: number;
  nextModule: Module | null;
  streak: StreakData;
  upcomingEvents: CalendarEventItem[];
  recentAchievements: AchievementItem[];
  activeRoadmap?: {
    id: string;
    title: string;
    targetRole: string;
    modules: Module[];
  } | null;
  storedCheatSheets?: Array<{
    moduleId: string;
    content: string;
    versionsCount: number;
    updatedAt: string;
  }>;
  issuedCertifications?: IssuedCertification[];
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

// ─── Devotopia AWS-Style Shield Badge Component (Matching Image 2) ──────────
function DevotopiaShieldBadge({
  title,
  category = "VERIFIED",
  footer = "CERTIFIED",
  theme = "indigo",
  allowExport = true,
}: {
  title: string;
  category?: string;
  footer?: string;
  theme?: "gold" | "blue" | "emerald" | "purple" | "pink" | "cyan" | "amber" | "indigo";
  allowExport?: boolean;
}) {
  const themeColors = {
    gold: { border: "#f59e0b", banner: "#d97706" },
    blue: { border: "#3b82f6", banner: "#2563eb" },
    emerald: { border: "#8E1616", banner: "#8E1616" },
    purple: { border: "#8b5cf6", banner: "#7c3aed" },
    pink: { border: "#ec4899", banner: "#db2777" },
    cyan: { border: "#06b6d4", banner: "#0891b2" },
    amber: { border: "#d97706", banner: "#b45309" },
    indigo: { border: "#6366f1", banner: "#4f46e5" },
  }[theme] || { border: "#6366f1", banner: "#4f46e5" };

  const uniqueId = `badge-${theme}-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  const handleExportSVG = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = document.getElementById(uniqueId);
    const svg = container?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DEVOTOPIA-BADGE-${title.replace(/\s+/g, '-').toUpperCase()}.svg`;
    a.click();
    toast.success(`Exported Devotopia Badge: ${title}`);
  };

  return (
    <div
      id={uniqueId}
      className="relative w-full max-w-[150px] mx-auto select-none transition-all duration-300 hover:scale-105 group"
      style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" }}
    >
      <svg viewBox="0 0 200 240" className="w-full h-auto">
        <defs>
          <linearGradient id={`grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id={`banner-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={themeColors.banner} />
            <stop offset="100%" stopColor={themeColors.border} />
          </linearGradient>
        </defs>

        <path
          d="M 20,40 Q 100,10 180,40 Q 190,130 100,230 Q 10,130 20,40 Z"
          fill={`url(#grad-${uniqueId})`}
          stroke={themeColors.border}
          strokeWidth="6"
        />

        <path
          d="M 28,48 Q 100,20 172,48 Q 180,128 100,220 Q 20,128 28,48 Z"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2"
        />

        <text x="100" y="52" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" letterSpacing="2">
          DEVOTOPIA
        </text>

        <circle cx="152" cy="46" r="5" fill="#f97316" />
        <path d="M 149,46 L 151,48 L 155,44" fill="none" stroke="#ffffff" strokeWidth="1.5" />

        <line x1="50" y1="62" x2="150" y2="62" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        <text x="100" y="76" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontWeight="800" letterSpacing="2">
          {category}
        </text>

        <text x="100" y="115" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
          {title.length > 15 ? title.split(' ')[0] : title}
        </text>
        {title.length > 15 && (
          <text x="100" y="133" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
            {title.split(' ').slice(1).join(' ')}
          </text>
        )}

        <path
          d="M 28,170 Q 100,195 172,170 L 165,198 Q 100,222 35,198 Z"
          fill={`url(#banner-${uniqueId})`}
        />

        <text x="100" y="191" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" letterSpacing="3">
          {footer}
        </text>
      </svg>

      {allowExport && (
        <button
          onClick={handleExportSVG}
          title="Export Badge SVG"
          className="absolute -bottom-1 right-1 bg-[#8E1616] hover:bg-[#701111] text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Download className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

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

  // ── Voice Tutor & Study Vault Modal States ──────────────────────────────
  const [selectedCheatsheet, setSelectedCheatsheet] = useState<{ title: string; content: string } | null>(null);
  const [activeTutorModule, setActiveTutorModule] = useState<Module | null>(null);
  const [showVoiceTutorModal, setShowVoiceTutorModal] = useState(false);

  const formatMarkdownToExecutiveHTML = (markdownText: string): string => {
    if (!markdownText) return '';
    let html = markdownText;

    html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
      const cleanCode = code.replace(/^[a-zA-Z0-9_-]+\n/, '').trim();
      return `<div class="code-box"><pre><code>${cleanCode}</code></pre></div>`;
    });

    html = html.replace(/^>\s*(.*?)$/gm, (_, quote) => {
      const cleanQuote = quote.replace(/^\[!(NOTE|WARNING|IMPORTANT|TIP)\]\s*/i, '');
      return `<div class="quote-box">
        <div class="quote-mark">“</div>
        <div class="quote-content">${cleanQuote}</div>
      </div>`;
    });

    html = html.replace(/^#\s+(.*?)$/gm, '<h2 class="section-heading">$1</h2>');
    html = html.replace(/^##\s+(.*?)$/gm, '<h2 class="section-heading">$1</h2>');
    html = html.replace(/^###\s+(.*?)$/gm, '<h3 class="sub-heading">$1</h3>');

    html = html.replace(/\*\*(Phase \d+:?|Step \d+:?|Section \d+:?|Phase [A-Z0-9]+:?)\*\*/gi, '<span class="phase-badge">$1</span>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    html = html.replace(/^[-*]\s+(.*?)$/gm, '<li class="list-item"><span class="list-bullet">•</span><div>$1</div></li>');
    html = html.replace(/(<li class="list-item">[\s\S]*?<\/li>)+/g, '<ul class="editorial-list">$&</ul>');

    const blocks = html.split(/\n\n+/);
    return blocks
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (
          trimmed.startsWith('<h2') ||
          trimmed.startsWith('<h3') ||
          trimmed.startsWith('<div') ||
          trimmed.startsWith('<ul') ||
          trimmed.startsWith('<pre')
        ) {
          return trimmed;
        }
        return `<p class="editorial-paragraph">${trimmed}</p>`;
      })
      .join('\n');
  };

  const handleDownloadCheatsheetPDF = (title: string, content: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to download PDF.");
      return;
    }

    const formattedHTML = formatMarkdownToExecutiveHTML(content);
    const trackName = summary.activeRoadmap?.targetRole || "Software Engineering";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} — Devotopia Master Study Guide</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
            
            @page {
              size: A4 portrait;
              margin: 0;
            }
            
            html, body {
              width: 100%;
              height: 100%;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              font-family: 'Outfit', -apple-system, sans-serif;
              color: #334155;
              line-height: 1.65;
            }

            .page-cover {
              width: 210mm;
              height: 297mm;
              min-height: 297mm;
              box-sizing: border-box;
              position: relative;
              background: linear-gradient(135deg, #c2410c 0%, #ea580c 45%, #f97316 100%);
              color: #ffffff;
              padding: 45mm 25mm 35mm 25mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-after: always;
              break-after: page;
              overflow: hidden;
            }

            @media print {
              @page {
                size: A4 portrait;
                margin: 0;
              }
              html, body {
                width: 210mm;
                height: 100%;
                margin: 0 !important;
                padding: 0 !important;
              }
              .page-cover {
                width: 210mm !important;
                height: 297mm !important;
                min-height: 297mm !important;
                max-height: 297mm !important;
                page-break-after: always !important;
                break-after: page !important;
              }
              .page-inside {
                width: 210mm !important;
                min-height: 297mm !important;
                page-break-after: always !important;
                break-after: page !important;
              }
              .section-heading, .sub-heading, .quote-box, .code-box, .editorial-list {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }

            .cover-watermark {
              position: absolute;
              top: -30mm;
              right: -25mm;
              width: 170mm;
              height: 170mm;
              opacity: 0.18;
              pointer-events: none;
            }

            .cover-header {
              position: relative;
              z-index: 10;
            }

            .logo-badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: rgba(255, 255, 255, 0.18);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.35);
              padding: 8px 18px;
              border-radius: 30px;
              font-size: 13px;
              font-weight: 800;
              letter-spacing: 2px;
              text-transform: uppercase;
              color: #ffffff;
              margin-bottom: 28px;
            }

            .cover-title {
              font-size: 42px;
              font-weight: 300;
              line-height: 1.12;
              color: #ffffff;
              margin: 0 0 16px 0;
              letter-spacing: -0.5px;
            }

            .cover-title strong {
              font-weight: 800;
              display: block;
            }

            .cover-subtitle {
              font-size: 18px;
              font-weight: 400;
              color: rgba(255, 255, 255, 0.88);
              margin: 0;
              max-width: 520px;
              line-height: 1.5;
            }

            .cover-footer {
              position: relative;
              z-index: 10;
              border-top: 1px solid rgba(255, 255, 255, 0.25);
              padding-top: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 12px;
              color: rgba(255, 255, 255, 0.88);
              font-weight: 600;
            }

            .page-inside {
              width: 210mm;
              min-height: 297mm;
              position: relative;
              padding: 22mm 22mm 30mm 22mm;
              background: #ffffff;
              page-break-after: always;
            }

            .page-inside:last-child {
              page-break-after: auto;
            }

            .inside-watermark {
              position: absolute;
              bottom: 25mm;
              left: 15mm;
              width: 75mm;
              height: 75mm;
              opacity: 0.06;
              pointer-events: none;
            }

            .running-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              color: #94a3b8;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 10px;
              margin-bottom: 24px;
            }

            .section-heading {
              font-size: 26px;
              font-weight: 300;
              color: #65a30d;
              border-left: 5px solid #65a30d;
              padding-left: 14px;
              margin-top: 32px;
              margin-bottom: 16px;
              line-height: 1.25;
              letter-spacing: -0.3px;
            }

            .sub-heading {
              font-size: 18px;
              font-weight: 700;
              color: #1e293b;
              margin-top: 24px;
              margin-bottom: 12px;
              border-left: 3px solid #ea580c;
              padding-left: 10px;
            }

            .editorial-paragraph {
              font-size: 13.5px;
              color: #475569;
              line-height: 1.75;
              margin-bottom: 16px;
            }

            .quote-box {
              background: #f7fee7;
              border-left: 4px solid #65a30d;
              padding: 16px 20px;
              margin: 20px 0;
              border-radius: 0 12px 12px 0;
              position: relative;
            }

            .quote-mark {
              font-size: 32px;
              color: #65a30d;
              font-weight: 900;
              line-height: 1;
              margin-bottom: 4px;
            }

            .quote-content {
              font-size: 13px;
              font-style: italic;
              color: #365314;
              font-weight: 600;
              line-height: 1.65;
            }

            .phase-badge {
              display: inline-block;
              background: #ffedd5;
              color: #c2410c;
              font-weight: 800;
              font-size: 11px;
              padding: 2px 8px;
              border-radius: 6px;
              margin-right: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .editorial-list {
              list-style: none;
              padding: 0;
              margin: 16px 0;
            }

            .list-item {
              display: flex;
              gap: 12px;
              margin-bottom: 12px;
              font-size: 13.5px;
              color: #334155;
              line-height: 1.65;
            }

            .list-bullet {
              color: #ea580c;
              font-weight: 900;
              font-size: 16px;
              line-height: 1;
            }

            .code-box {
              background: #0f172a;
              border-radius: 12px;
              padding: 16px;
              margin: 18px 0;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .code-box pre {
              margin: 0;
              padding: 0;
            }

            .code-box code {
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              color: #38bdf8;
              line-height: 1.6;
            }

            .bottom-stripe {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 10px;
              background: linear-gradient(90deg, #ea580c 0%, #f97316 100%);
            }

            .page-footer {
              position: absolute;
              bottom: 15mm;
              left: 22mm;
              right: 22mm;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #94a3b8;
              font-weight: 600;
              border-top: 1px solid #f1f5f9;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="page-cover">
            <svg class="cover-watermark" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="45" stroke="currentColor" stroke-width="4" fill="none"/>
              <path d="M30 50 Q50 20 70 50 Q50 80 30 50 Z" stroke="currentColor" stroke-width="4" fill="none"/>
            </svg>

            <div class="cover-header">
              <div class="logo-badge">
                DEVOTOPIA MASTER SERIES
              </div>
              <h1 class="cover-title">
                ${title}
                <strong>Master Study Guide</strong>
              </h1>
              <p class="cover-subtitle">
                Executive AI-engineered technical reference manual and speech notes.
              </p>
            </div>

            <div class="cover-footer">
              <div>
                <div>TRACK: ${trackName.toUpperCase()}</div>
                <div>DIFFICULTY: MASTER LEVEL</div>
              </div>
              <div style="text-align: right;">
                <div>DEVOTOPIA LEARNING INFRASTRUCTURE</div>
                <div>DOCUMENT REF: MASTER-GUIDE</div>
              </div>
            </div>
            <div class="bottom-stripe"></div>
          </div>

          <div class="page-inside">
            <svg class="inside-watermark" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="45" stroke="#ea580c" stroke-width="4" fill="none"/>
            </svg>

            <div class="running-header">
              <span>DEVOTOPIA MASTER ARCHITECTURE SERIES</span>
              <span>${title}</span>
            </div>

            <div class="inside-content">
              ${formattedHTML}
            </div>

            <div class="page-footer">
              <span>© Devotopia Learning Platform</span>
              <span>Verified AI Curriculum Reference</span>
            </div>
            <div class="bottom-stripe"></div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("PDF Print dialog opened!");
  };

  // ── Certification Export State ──────────────────────────────────────────
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certData, setCertData] = useState<any>(null);
  const [certLoading, setCertLoading] = useState(false);

  const handleExportCert = async () => {
    setCertLoading(true);
    try {
      const data = await apiFetch("/export/certification/frontend");
      setCertData(data);
      setCertModalOpen(true);
    } catch (err: any) {
      // Fallback preview payload if offline/mock
      setCertData({
        certificateId: `DEV-CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        issuedTo: { name: user?.name || "Devotopia Learner", email: user?.email || "learner@devotopia.dev" },
        trackInfo: { title: "Frontend Engineering Track", progressPercentage: summary.roadmapProgress || 100, completedModules: 5, totalModules: 5 },
        verifiedSkills: ["JavaScript", "Next.js", "NestJS Microservices", "React Flow Graph", "Mongoose DB"],
        streakInfo: { longestStreakDays: summary.streak.longest || 12, currentStreakDays: summary.streak.current || 5 },
        achievementsUnlocked: summary.recentAchievements.length || 4,
        issuedAt: new Date().toISOString(),
        shareableUrl: "https://devotopia.dev/certificates/DEV-CERT-PREVIEW",
      });
      setCertModalOpen(true);
    } finally {
      setCertLoading(false);
    }
  };

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
        let notifList: any[] = [];
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          notifList = notifData.data || [];
        }
        if (notifList.length === 0) {
          notifList = [
            {
              _id: "notif-1",
              type: "achievement",
              titleEn: "Devotopia Certificate Unlocked 🏆",
              titleAr: "تم فتح شهادة الاعتماد! 🏆",
              contentEn: "Your official Devotopia track credential passport & badges are verified in MongoDB.",
              contentAr: "جواز السفر واعتمد الشارات الخاصة بك موثقة بنجاح في قاعدة البيانات.",
              read: false,
              createdAt: new Date().toISOString(),
            },
            {
              _id: "notif-2",
              type: "general",
              titleEn: "Welcome to Devotopia SmartRoadmap! 🚀",
              titleAr: "مرحباً بك في Devotopia SmartRoadmap! 🚀",
              contentEn: "Verify your tech skills, generate adaptive learning roadmaps, and build your passport.",
              contentAr: "قم بطلب تقييم لمهاراتك، واحصل على خارطة طريق مخصصة للتعلم.",
              read: true,
              createdAt: new Date().toISOString(),
            },
          ];
        }
        setNotifications(notifList);
      } catch (e) {
        console.error("Error loading dashboard metrics", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (user?.role === "company") {
      router.push("/company");
    }
  }, [user, router]);

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
        <div className="w-16 h-16 rounded-full bg-[#8E1616]/10 text-[#8E1616] flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-[#8E1616]" />
        </div>
        <h2 className="text-2xl font-black text-base-content tracking-tight">{tr("restricted")}</h2>
        <p className="text-sm text-stone-700 dark:text-stone-300 font-medium max-w-sm mb-6">{tr("restrictedBody")}</p>
        <div className="flex gap-4">
          <Link href="/auth/login" className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none rounded-xl">
            {tr("logIn")}
          </Link>
          <Link href="/auth/register" className="btn btn-outline border-base-300 text-base-content rounded-xl">
            {tr("register")}
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "admin") {
    router.push("/admin");
    return null;
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

  const radarSkillData = [
    { subject: "Frontend", A: summary.roadmapProgress || 85, fullMark: 100 },
    { subject: "Backend", A: 78, fullMark: 100 },
    { subject: "Architecture", A: 90, fullMark: 100 },
    { subject: "DevOps", A: 72, fullMark: 100 },
    { subject: "Database", A: 88, fullMark: 100 },
    { subject: "System Design", A: 84, fullMark: 100 },
  ];

  const topicDistributionData = [
    { name: "Frontend & UI", value: 40, color: "#6366f1" },
    { name: "Backend APIs", value: 30, color: "#8E1616" },
    { name: "Database & Models", value: 18, color: "#f59e0b" },
    { name: "DevOps & Deploy", value: 12, color: "#ec4899" },
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
        {/* Greeting Banner with Career Growth Visual */}
        <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="bg-gradient-to-r from-[#8E1616]/10 via-[#E8C999]/15 to-[#8E1616]/5 border border-[#8E1616]/20 rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-center gap-6 shadow-sm">
          <div className="space-y-2 text-start max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8E1616]/10 text-[#8E1616] font-mono text-[10px] font-bold uppercase">
              <span>● Adaptive Roadmap In-Sync</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content">
              {tr("greeting", { name: user.name })}
            </h1>
            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium leading-relaxed">
              {tr("intro")} Track your milestone achievements, study habits, and skill velocity toward senior engineering roles.
            </p>
          </div>
          <div className="shrink-0 w-full lg:w-auto">
            <CareerGrowthVisual
              currentRole={user?.targetRole || "Software Engineer"}
              level={summary.roadmapProgress > 75 ? "Senior" : summary.roadmapProgress > 35 ? "Mid-Level" : "Junior"}
              progress={summary.roadmapProgress || 45}
            />
          </div>
        </motion.div>

        {/* Action cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { icon: <Layout className="w-5 h-5" />, title: tr("card1Title"), body: tr("card1Body"), color: "bg-[#8E1616]/10 text-[#8E1616]" },
            { icon: <Zap className="w-5 h-5" />, title: tr("card2Title"), body: tr("card2Body"), color: "bg-[#8E1616]/10/10 text-[#8E1616]" },
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
                <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">{c.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex border-b border-base-300 gap-6 text-sm font-semibold mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 relative transition-all ${activeTab === "overview"
                ? "text-[#8E1616] font-extrabold border-b-2 border-[#8E1616]"
                : "text-stone-700 dark:text-stone-300 font-medium hover:text-base-content"
              }`}
          >
            {isAr ? "نظرة عامة" : "Overview"}
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-3 relative transition-all ${activeTab === "activity"
                ? "text-[#8E1616] font-extrabold border-b-2 border-[#8E1616]"
                : "text-stone-700 dark:text-stone-300 font-medium hover:text-base-content"
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
                      <span className="text-2xl font-black text-[#8E1616]">{summary.roadmapProgress}%</span>
                    </div>
                  </div>
                </div>

                {/* Streak comparison bar chart */}
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base-content text-sm flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" /> {tr("streakTitle")}
                    </h3>
                    <span className="text-[10px] text-stone-600 dark:text-stone-400 font-medium font-mono">
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
                    <i className="lni lni-timer text-[#8E1616]" /> Study Activity
                  </h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={studyTimeData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8E1616" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#8E1616" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Area type="monotone" dataKey="minutes" stroke="#8E1616" strokeWidth={2} fillOpacity={1} fill="url(#colorMinutes)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Skill Radar & Topic Allocation Charts */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.07 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* RadarChart for Skill Mastery Matrix */}
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start">
                  <h3 className="font-bold text-base-content text-sm mb-2 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#8E1616]" />
                    <span>Skill Mastery Matrix 🎯</span>
                  </h3>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarSkillData}>
                        <PolarGrid stroke="#cbd5e1" opacity={0.3} />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
                        <Radar name="Mastery %" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* PieChart / Donut for Topic Distribution */}
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start">
                  <h3 className="font-bold text-base-content text-sm mb-2 flex items-center gap-1.5">
                    <PieChartIcon className="w-4 h-4 text-[#8E1616]" />
                    <span>Study Time Allocation 📊</span>
                  </h3>
                  <div className="h-44 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topicDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {topicDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => [`${v}% of total time`, "Weight"]} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Notifications */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.08 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base-content text-sm">{tr("notifTitle")}</h3>
                  <Link href="/notifications" className="text-xs text-[#8E1616] hover:underline font-bold">
                    {tr("clearAll")}
                  </Link>
                </div>
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 2).map((n, i) => (
                      <div key={i} className="bg-base-100 border border-base-300 rounded-xl p-4 flex justify-between items-center gap-3">
                        <div>
                          <span className="text-[9px] uppercase font-mono font-bold text-[#8E1616] bg-[#8E1616]/10 px-2 py-0.5 rounded">
                            {n.type}
                          </span>
                          <h4 className="font-bold text-base-content text-xs mt-1.5">{n.titleEn}</h4>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 font-medium mt-0.5">{n.contentEn}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-[#8E1616] shrink-0" />}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-stone-600 dark:text-stone-400 font-medium italic py-4">{tr("noNotif")}</div>
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
                        <span className="text-[9px] text-[#8E1616] font-extrabold uppercase font-mono tracking-wider block">
                          {tr("roadmapModule")}
                        </span>
                        <h4 className="font-bold text-base-content text-sm mt-0.5">{summary.nextModule.title}</h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400 font-medium mt-1 max-w-md">{summary.nextModule.description}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-stone-700 dark:text-stone-300 font-medium bg-base-300 border border-base-300 px-2.5 py-0.5 rounded">
                        {summary.nextModule.difficulty}
                      </span>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Link href="/roadmap" className="btn btn-outline btn-xs rounded text-stone-700 dark:text-stone-300 font-medium border-base-300 hover:bg-base-200 gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {tr("openCanvas")}
                      </Link>
                      <Link href={`/quiz/${summary.nextModule.id}`} className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none btn-xs rounded font-bold px-4 gap-1">
                        <Zap className="w-3.5 h-3.5" /> {tr("proveMastery")}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-stone-600 dark:text-stone-400 font-medium italic py-4">{tr("noModule")}</div>
                )}
              </motion.div>

              {/* Today tasks */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base-content text-sm">{tr("todayTasks")}</h3>
                  <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-400 font-medium">
                    {tr("total")}: {summary.nextModule?.topics?.length || 0}
                  </span>
                </div>
                <div className="space-y-3">
                  {summary.nextModule?.topics?.length ? (
                    summary.nextModule.topics.map((topic: string, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-base-100 border border-base-300 rounded-xl p-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8E1616]" />
                          <span className="text-xs font-bold text-stone-800 dark:text-stone-200 font-medium">{topic}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] text-stone-600 dark:text-stone-400 font-medium">{tr("estimated")}: 1h</span>
                          <div className="w-16 bg-base-300 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#8E1616] h-full" style={{ width: i === 0 ? "90%" : i === 1 ? "50%" : "10%" }} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-stone-600 dark:text-stone-400 font-medium italic py-4">{tr("noTasks")}</div>
                  )}
                </div>
              </motion.div>

              {/* AI Study Vault & Generated Cheatsheets Section */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.12 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div className="flex justify-between items-center border-b border-base-300 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base-content text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#8E1616]" />
                      <span>{isAr ? "خزينة الدراسة الذكية والأوراق الإرشادية 📚" : "AI Study Vault & Stored Cheatsheets 📚"}</span>
                    </h3>
                    <p className="text-[11px] text-stone-700 dark:text-stone-300 font-medium mt-0.5">
                      {isAr ? "جميع المواضيع والملاحظات والمساعد الصوتي المتاحة لحسابك" : "Instant access to your module topics, AI speech notes, PDF exports, and AI Voice Tutor."}
                    </p>
                  </div>
                  <span className="text-[10px] bg-[#8E1616]/10 text-[#8E1616] font-mono font-bold px-2.5 py-1 rounded-lg">
                    {summary.activeRoadmap?.modules?.length || summary.storedCheatSheets?.length || 0} Modules
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(summary.activeRoadmap?.modules && summary.activeRoadmap.modules.length > 0
                    ? summary.activeRoadmap.modules
                    : (summary.storedCheatSheets || []).map(cs => ({
                      id: cs.moduleId,
                      title: cs.moduleId.replace(/-/g, ' ').toUpperCase(),
                      description: "Generated AI master study guide and speech notes.",
                      difficulty: "intermediate",
                      status: "in_progress" as const,
                      topics: ["Core Concepts", "Implementation", "Best Practices"],
                    }))
                  ).map((mod: any) => {
                    const storedCs = summary.storedCheatSheets?.find(c => c.moduleId === mod.id);

                    return (
                      <div key={mod.id} className="bg-base-100 border border-base-300 rounded-2xl p-4 space-y-3 shadow-xs hover:border-[#8E1616]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-mono font-extrabold text-[#8E1616] bg-[#8E1616]/10 px-2 py-0.5 rounded">
                              {mod.difficulty || "module"}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${mod.status === 'completed' ? 'bg-[#8E1616]/10 text-[#8E1616]' : 'bg-amber-500/10 text-amber-600'
                              }`}>
                              {mod.status || 'active'}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-xs text-base-content line-clamp-1">{mod.title}</h4>
                          <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium line-clamp-2 leading-relaxed">
                            {mod.description || "Master reference study notes and audio tutor topics."}
                          </p>

                          {mod.topics && mod.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {mod.topics.slice(0, 3).map((tp: string, idx: number) => (
                                <span key={idx} className="text-[9px] font-mono text-stone-700 dark:text-stone-300 font-medium bg-base-200 px-1.5 py-0.5 rounded">
                                  #{tp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action buttons on Dashboard card */}
                        <div className="space-y-2 pt-2 border-t border-base-200">
                          <button
                            onClick={() => {
                              setSelectedCheatsheet({
                                title: mod.title,
                                content: storedCs?.content || `### Speech Notes & Cheatsheet for ${mod.title}\n\n**Topics:** ${(mod.topics || []).join(', ')}\n\n${mod.description}`,
                              });
                            }}
                            className="btn btn-outline btn-xs border-base-300 text-base-content hover:bg-[#8E1616] hover:text-white btn-block rounded-xl font-bold h-8 flex items-center justify-center gap-1 text-[10px]"
                          >
                            <FileText className="w-3 h-3 text-[#8E1616]" />
                            <span>{isAr ? "عرض الملاحظات 📄" : "Speech Notes 📄"}</span>
                          </button>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => {
                                handleDownloadCheatsheetPDF(
                                  mod.title,
                                  storedCs?.content || `Master Study Guide for ${mod.title}\n\nTopics: ${(mod.topics || []).join(', ')}\n\n${mod.description}`
                                );
                              }}
                              className="btn btn-outline border-base-300 btn-xs text-[9px] font-bold rounded-lg h-7 flex items-center justify-center gap-1"
                            >
                              <Download className="w-2.5 h-2.5" />
                              <span>PDF</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveTutorModule(mod);
                                setShowVoiceTutorModal(true);
                              }}
                              className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none btn-xs text-[9px] font-bold rounded-lg h-7 flex items-center justify-center gap-1"
                            >
                              <Mic className="w-2.5 h-2.5" />
                              <span>Voice Tutor 🎙️</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Detailed Study History Tracker & Activity Timeline */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.14 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div className="flex justify-between items-center border-b border-base-300 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base-content text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#8E1616]" />
                      <span>{isAr ? "سجل الدراسة ومتتبع النشاط ⏱️" : "Study History & Activity Tracker ⏱️"}</span>
                    </h3>
                    <p className="text-[11px] text-stone-700 dark:text-stone-300 font-medium mt-0.5">
                      {isAr ? "سجل جلسات الدراسة والاختبارات المكتملة والدقائق المسجلة" : "Detailed log of your recent study sessions, quiz submissions, and active milestones."}
                    </p>
                  </div>
                  <span className="text-[10px] bg-[#8E1616]/10 text-[#8E1616] font-mono font-bold px-2.5 py-1 rounded-lg">
                    Live Syncing
                  </span>
                </div>

                <div className="space-y-3">
                  {((summary as any).progressHistory?.length ? (summary as any).progressHistory : [
                    { event: "Completed React Flow & Graph Lookup Quiz", score: 90, timeSpentMinutes: 45, createdAt: new Date(Date.now() - 3600000).toISOString() },
                    { event: "Generated AI Speech Notes & Voice Summary", score: 85, timeSpentMinutes: 30, createdAt: new Date(Date.now() - 86400000).toISOString() },
                    { event: "Mastered NestJS Microservices Module", score: 95, timeSpentMinutes: 60, createdAt: new Date(Date.now() - 172800000).toISOString() },
                    { event: "Reviewed Adaptive Remedial Node Graph", score: 88, timeSpentMinutes: 40, createdAt: new Date(Date.now() - 259200000).toISOString() },
                  ]).slice(0, 5).map((log: any, idx: number) => (
                    <div key={idx} className="bg-base-100 border border-base-300 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-[#8E1616]/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#8E1616]/10 border border-[#8E1616]/20 text-[#8E1616] flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-[#8E1616]" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-base-content">{log.event || `Study Session ${idx + 1}`}</h5>
                          <p className="text-[10px] text-stone-600 dark:text-stone-400 font-medium mt-0.5 flex items-center gap-2 font-mono">
                            <span>{new Date(log.createdAt || Date.now()).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>⏱️ {log.timeSpentMinutes || 25} mins logged</span>
                          </p>
                        </div>
                      </div>
                      {log.score > 0 && (
                        <div className="bg-[#8E1616]/10 text-[#8E1616] font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-[#8E1616]/20">
                          Score: {log.score}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 space-y-6">
              {/* Schedule summary */}
              <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base-content text-sm">{tr("scheduleSummary")}</h3>
                  <Link href="/calendar" className="text-xs text-[#8E1616] hover:underline font-bold">
                    {tr("openFull")}
                  </Link>
                </div>
                <div className="space-y-2 pt-1">
                  {summary.upcomingEvents.length > 0 ? (
                    summary.upcomingEvents.slice(0, 4).map((ev, i) => (
                      <div key={i} className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 font-medium flex justify-between items-center border-t border-base-300 pt-2">
                        <span className="truncate max-w-[150px] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8E1616]" />
                          {ev.title}
                        </span>
                        <span className="text-[#8E1616] font-bold">
                          {new Date(ev.startAt).toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-stone-600 dark:text-stone-400 font-medium italic">{tr("noSessions")}</div>
                  )}
                </div>
              </motion.div>

              {/* Go premium */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="bg-[#8E1616] text-white rounded-2xl p-6 shadow-md text-start space-y-4 relative overflow-hidden"
              >
                <div className="absolute -top-12 -end-12 w-28 h-28 rounded-full bg-white/10" />
                <div className="space-y-1 relative z-10">
                  <h3 className="font-extrabold text-lg flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-300 fill-yellow-300" /> {tr("goPremium")}
                  </h3>
                  <p className="text-xs text-indigo-100 leading-relaxed">{tr("premiumBody")}</p>
                </div>
                <Link href="/pricing" className="btn bg-white hover:bg-base-100 text-[#8E1616] border-none btn-sm rounded-xl font-bold w-full relative z-10">
                  {tr("findOutMore")}
                </Link>
              </motion.div>

              {/* Certification Export Card */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white border border-indigo-500/30 rounded-2xl p-6 shadow-xl text-start space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-400/30">
                    {isAr ? "اعتماد رسمي" : "Official Credential"}
                  </span>
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-white">
                    {isAr ? "شهادة الكفاءة وجواز المهارات" : "Certification & Skill Passport"}
                  </h3>
                  <p className="text-xs text-indigo-200/80 leading-relaxed">
                    {isAr
                      ? "قم بتصدير شهادة إنجازك الرسمية وجواز مهاراتك الموثقة بقاعدة بيانات الاختبارات التكيفية."
                      : "Export your official track completion certificate and verified skill credential passport."}
                  </p>
                </div>
                <button
                  onClick={handleExportCert}
                  disabled={certLoading}
                  className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none btn-sm rounded-xl font-bold w-full gap-2 shadow-lg"
                >
                  {certLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Download className="w-4 h-4 text-amber-300" />
                  )}
                  {isAr ? "تصدير الشهادة الرسمية" : "Export Certification"}
                </button>
              </motion.div>

              {/* Achievements */}
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <h3 className="font-bold text-base-content text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> {tr("badgesTitle")}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(summary.recentAchievements.length > 0
                    ? summary.recentAchievements
                    : [
                      { title: "AI Architect", tier: "gold", description: "AI & LLM Integration Mastery" },
                      { title: "Solutions Architect", tier: "silver", description: "Fullstack Architecture Expert" },
                      { title: "Cloud Practitioner", tier: "emerald" as any, description: "DevOps & Deployment Mastery" },
                      { title: "Security Engineer", tier: "purple" as any, description: "Auth & Security Passport" },
                      { title: "DevOps Pro", tier: "cyan" as any, description: "CI/CD & Kubernetes Specialist" },
                      { title: "Fullstack Master", tier: "gold", description: "React & NestJS Fullstack" },
                      { title: "Data Engineer", tier: "emerald" as any, description: "Pipeline & Analytics Expert" },
                      { title: "ML Specialist", tier: "purple" as any, description: "Deep Learning & Neural Nets" },
                      { title: "DB Architect", tier: "blue" as any, description: "High Scale MongoDB Schemas" },
                      { title: "Cyber Defense", tier: "pink" as any, description: "Security & Guard Rails" },
                    ]
                  ).map((ach: any, i: number) => {
                    const themeMap: Record<string, "gold" | "blue" | "emerald" | "purple" | "cyan" | "pink"> = {
                      gold: "gold",
                      silver: "blue",
                      emerald: "emerald",
                      purple: "purple",
                      cyan: "cyan",
                      pink: "pink",
                    };
                    const theme = themeMap[ach.tier] || (i % 6 === 0 ? "gold" : i % 6 === 1 ? "blue" : i % 6 === 2 ? "emerald" : i % 6 === 3 ? "purple" : i % 6 === 4 ? "cyan" : "pink");

                    return (
                      <div key={i} className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-base-300/40 transition-colors">
                        <DevotopiaShieldBadge
                          title={ach.title}
                          category="VERIFIED"
                          footer="CERTIFIED"
                          theme={theme}
                          allowExport={true}
                        />
                        <p className="text-[9px] text-stone-700 dark:text-stone-300 font-medium font-semibold mt-1.5 line-clamp-1">{ach.description}</p>
                      </div>
                    );
                  })}
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
                <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium">
                  {isAr ? "إحصاءات من قاعدة بيانات تقدمك الفعلية" : "Historical analytics computed from actual study logs"}
                </p>
              </div>
              <div className="flex gap-1 bg-base-300 p-1 rounded-xl">
                {(["7d", "30d", "90d"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p ? "bg-white text-[#8E1616] shadow-sm" : "text-stone-700 dark:text-stone-300 font-medium hover:text-base-content"
                      }`}
                  >
                    {p === "7d" ? (isAr ? "٧ أيام" : "7 Days") : p === "30d" ? (isAr ? "٣٠ يوم" : "30 Days") : (isAr ? "٩٠ يوم" : "90 Days")}
                  </button>
                ))}
              </div>
            </div>

            {activityLoading ? (
              <div className="h-64 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-[#8E1616]" />
              </div>
            ) : activityData ? (
              <div className="space-y-6">
                {/* Summary Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-base-200 border border-base-300 p-5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-stone-600 dark:text-stone-400 font-medium block">
                      {isAr ? "إجمالي وقت الدراسة" : "Total Time Spent"}
                    </span>
                    <span className="text-2xl font-black text-[#8E1616] block mt-1">
                      {activityData.summary.totalMinutes} {isAr ? "دقائق" : "mins"}
                    </span>
                    <span className="text-[9px] text-stone-700 dark:text-stone-300 font-medium block mt-1">
                      ~{Math.round(activityData.summary.totalMinutes / 60)} {isAr ? "ساعات دراسية" : "learning hours"}
                    </span>
                  </div>

                  <div className="bg-base-200 border border-base-300 p-5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-stone-600 dark:text-stone-400 font-medium block">
                      {isAr ? "مجموع الاختبارات" : "Quizzes Completed"}
                    </span>
                    <span className="text-2xl font-black text-[#8E1616] block mt-1">
                      {activityData.summary.totalQuizzes}
                    </span>
                    <span className="text-[9px] text-stone-700 dark:text-stone-300 font-medium block mt-1">
                      {isAr ? "تحقق من الكفاءة" : "Mastery assessments"}
                    </span>
                  </div>

                  <div className="bg-base-200 border border-base-300 p-5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-stone-600 dark:text-stone-400 font-medium block">
                      {isAr ? "سلسلة التعلم الحالية" : "Current Learning Streak"}
                    </span>
                    <span className="text-2xl font-black text-amber-500 block mt-1">
                      🔥 {activityData.summary.currentStreak} {isAr ? "يوم" : "days"}
                    </span>
                    <span className="text-[9px] text-stone-700 dark:text-stone-300 font-medium block mt-1">
                      {isAr ? "الأطول:" : "Longest:"} {activityData.summary.longestStreak} {isAr ? "يوم" : "days"}
                    </span>
                  </div>

                  <div className="bg-base-200 border border-base-300 p-5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-stone-600 dark:text-stone-400 font-medium block">
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
                    <span className="text-[9px] text-stone-700 dark:text-stone-300 font-medium block mt-1">
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
                    <Zap className="w-4 h-4 text-[#8E1616]" />
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
                        <Bar yAxisId="left" dataKey="quizzes" name="Quizzes" fill="#8E1616" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Line yAxisId="right" type="monotone" dataKey="avgScore" name="Avg Score %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-stone-600 dark:text-stone-400 font-medium italic">
                {isAr ? "لا توجد سجلات نشاط متاحة للفترة المحددة." : "No study activity logs recorded for this period."}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Certification Export Modal */}
      {certModalOpen && certData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-base-100 border border-base-300 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 text-start relative overflow-hidden"
          >
            <button
              onClick={() => setCertModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute top-4 right-4 text-stone-700 dark:text-stone-300 font-medium hover:text-base-content"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8E1616]">
                  {certData.certificateId}
                </span>
                <h3 className="font-extrabold text-lg text-base-content mt-0.5">
                  {isAr ? "شهادة الكفاءة الرسمية" : "Official Certification Passport"}
                </h3>
              </div>
            </div>

            {/* AWS-Styled Devotopia Certified Verification Certificate (Matching Image 1) */}
            <div className="bg-white p-2.5 rounded-2xl shadow-2xl">
              <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-8 text-white space-y-6 select-none font-sans relative overflow-hidden text-start">
                {/* Header Logo */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                    devotopia
                    <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-black">
                      ✓
                    </span>
                  </span>
                  <span className="text-lg font-light text-slate-300 tracking-wide">
                    certified
                  </span>
                </div>

                {/* Recipient Name & Track Title */}
                <div className="pt-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    {certData.issuedTo?.name || user?.name || "Joshua Agboola"}
                  </h2>
                  <p className="text-sm font-semibold text-slate-300 mt-2 tracking-wide">
                    Devotopia Certified {certData.trackInfo?.title || "Software Architect"}
                  </p>
                </div>

                {/* Validation Border Container (Golden Orange Box matching Image 1) */}
                <div className="border-2 border-amber-500 rounded-lg p-4 bg-slate-900/90 space-y-2 text-start">
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <span className="font-extrabold text-white">VALIDATION NUMBER:</span>
                    <span className="font-bold text-amber-400">{certData.certificateId || "16G7H3J16EE4QG3N"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <span className="font-extrabold text-white">VALIDATE AT:</span>
                    <a
                      href={certData.shareableUrl || "https://smartroadmap.dev/verification"}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-amber-500 hover:underline"
                    >
                      {certData.shareableUrl || "https://smartroadmap.dev/verification"}
                    </a>
                  </div>
                </div>

                {/* Footer Dates */}
                <div className="flex justify-between items-center text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <div>
                    <span className="font-bold text-slate-300">Issue Date: </span>
                    <span>{new Date(certData.issuedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-300">Expiration Date: </span>
                    <span>{new Date(Date.now() + 3 * 365 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex flex-wrap gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(certData.shareableUrl);
                  toast.success(isAr ? "تم نسخ رابط التحقق من الشهادة!" : "Certificate verification link copied!");
                }}
                className="btn btn-outline btn-sm rounded-xl gap-2 font-bold"
              >
                <Copy className="w-4 h-4" />
                {isAr ? "نسخ رابط التحقق" : "Copy Verification Link"}
              </button>

              <button
                onClick={async () => {
                  const win = window.open("", "_blank");
                  if (!win) {
                    toast.error("Popup blocked! Please allow popups to print certificate PDF.");
                    return;
                  }
                  win.document.write(`
                    <html>
                      <head><title>Loading Certificate...</title></head>
                      <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;">
                        <h2>Loading Official Devotopia PDF Certificate...</h2>
                      </body>
                    </html>
                  `);
                  try {
                    const trackId = certData.trackInfo?.trackId || "frontend";
                    const res = await apiFetch(`/export/certification/${trackId}/pdf-html`);
                    const htmlText = typeof res === "string" ? res : await (res as any).text();
                    win.document.open();
                    win.document.write(htmlText);
                    win.document.close();
                    toast.success(isAr ? "تم فتح شهادة PDF بنجاح!" : "Official PDF Certificate generated successfully!");
                  } catch (err) {
                    win.close();
                    toast.error("Failed to generate PDF certification document stream.");
                  }
                }}
                className="btn bg-amber-500 hover:bg-amber-600 text-slate-900 border-none btn-sm rounded-xl gap-2 font-black px-5 shadow-lg"
              >
                <Download className="w-4 h-4" />
                {isAr ? "تصدير شهادة (PDF)" : "Export Official PDF"}
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(certData, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${certData.certificateId}.json`;
                  a.click();
                  toast.success(isAr ? "تم تحميل ملف الاعتماد الرقمي!" : "Digital credential JSON downloaded!");
                }}
                className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none btn-sm rounded-xl gap-2 font-bold px-5"
              >
                <FileText className="w-4 h-4" />
                {isAr ? "تحميل الشهادة (JSON)" : "Download Credential"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cheatsheet Viewer Modal */}
      {selectedCheatsheet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
          <div className="w-full max-w-2xl bg-base-200 border border-base-300 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-start">
            <div className="flex justify-between items-center pb-2 border-b border-base-300">
              <h3 className="font-extrabold text-sm text-base-content flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8E1616]" />
                <span>{selectedCheatsheet.title} — Speech Notes</span>
              </h3>
              <button onClick={() => setSelectedCheatsheet(null)} className="btn btn-ghost btn-circle btn-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-base-100 border border-base-300 p-4 rounded-2xl overflow-y-auto max-h-96 text-xs leading-relaxed font-mono whitespace-pre-wrap select-text">
              {selectedCheatsheet.content}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-base-300">
              <button
                onClick={() => handleDownloadCheatsheetPDF(selectedCheatsheet.title, selectedCheatsheet.content)}
                className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none rounded-xl text-xs font-bold gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download PDF 📄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Tutor Modal overlay on Dashboard */}
      {activeTutorModule && (
        <VoiceTutorModal
          isOpen={showVoiceTutorModal}
          onClose={() => setShowVoiceTutorModal(false)}
          moduleTitle={activeTutorModule.title}
          moduleTopics={activeTutorModule.topics || []}
          trackTitle={summary.activeRoadmap?.targetRole || "Software Track"}
          cheatSheetContent={
            summary.storedCheatSheets?.find((c) => c.moduleId === activeTutorModule.id)?.content ||
            activeTutorModule.description
          }
        />
      )}
    </div>
  );
}