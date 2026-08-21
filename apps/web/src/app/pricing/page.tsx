"use client";

import React from "react";

type FeatureRow = {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  scale: boolean | string;
  enterprise: boolean | string;
};

type FeatureSection = {
  title: string;
  rows: FeatureRow[];
};

// Learner Feature Comparison Table Sections
const FEATURE_SECTIONS = (t: (k: string) => string): FeatureSection[] => [
  {
    title: t("comp.learning"),
    rows: [
      {
        label: "Daily roadmap generations",
        free: "1",
        pro: "No limit",
        scale: "No limit",
        enterprise: "No limit",
      },
      {
        label: "AI dependency graph builder",
        free: true,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Adaptive difficulty pacing",
        free: true,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Custom skill targets",
        free: false,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "RAG-backed study guides",
        free: false,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Team learning paths",
        free: false,
        pro: false,
        scale: true,
        enterprise: true,
      },
      {
        label: "Roadmap history retention",
        free: "1 day",
        pro: "30 days",
        scale: "1 year",
        enterprise: "Flexible",
      },
    ],
  },
  {
    title: t("comp.assess"),
    rows: [
      {
        label: "Adaptive quizzes",
        free: true,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Verified skill badges",
        free: true,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Custom question banks",
        free: false,
        pro: false,
        scale: true,
        enterprise: true,
      },
      {
        label: "Proctored sessions",
        free: false,
        pro: false,
        scale: "With Add-on",
        enterprise: true,
      },
      {
        label: "Remedial node insertions",
        free: true,
        pro: true,
        scale: true,
        enterprise: true,
      },
    ],
  },
  {
    title: t("comp.hiring"),
    rows: [
      {
        label: "Candidate profile visibility",
        free: "Public link",
        pro: "Passport link",
        scale: "Search Index",
        enterprise: "Search Index",
      },
      {
        label: "Recruiter search discoverability",
        free: false,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Vector skill matching",
        free: false,
        pro: false,
        scale: true,
        enterprise: true,
      },
      {
        label: "Direct candidate contact",
        free: false,
        pro: false,
        scale: true,
        enterprise: true,
      },
    ],
  },
  {
    title: t("comp.security"),
    rows: [
      {
        label: "SOC2 Type II compliant host",
        free: true,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "SSO / SAML authentication",
        free: false,
        pro: false,
        scale: false,
        enterprise: true,
      },
      {
        label: "Role-based access controls",
        free: false,
        pro: false,
        scale: true,
        enterprise: true,
      },
      {
        label: "Custom data retention SLA",
        free: false,
        pro: false,
        scale: false,
        enterprise: true,
      },
    ],
  },
  {
    title: t("comp.support"),
    rows: [
      {
        label: "Community forum & Discord",
        free: true,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Email support turnaround",
        free: "48 hours",
        pro: "24 hours",
        scale: "4 hours",
        enterprise: "1 hour SLA",
      },
      {
        label: "Dedicated success manager",
        free: false,
        pro: false,
        scale: false,
        enterprise: true,
      },
    ],
  },
];

// Role-Specific Company Feature Comparison Table Sections
const COMPANY_FEATURE_SECTIONS = (t: (k: string) => string): FeatureSection[] => [
  {
    title: t("comp.hiring") || "Hiring & Candidate Sourcing Tools",
    rows: [
      {
        label: "Active Job Postings Limit",
        free: "1 job",
        pro: "5 jobs",
        scale: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        label: "Recruiter Seats Included",
        free: "1 seat",
        pro: "3 seats",
        scale: "10 seats",
        enterprise: "Unlimited",
      },
      {
        label: "AI Candidate Match Scores",
        free: false,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Direct Candidate Messaging",
        free: false,
        pro: "50 msgs/mo",
        scale: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        label: "Verified Evidence Filter",
        free: false,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Aggregate Skill Gap Analytics",
        free: false,
        pro: false,
        scale: true,
        enterprise: true,
      },
      {
        label: "Verified Partner Badge",
        free: false,
        pro: false,
        scale: true,
        enterprise: true,
      },
    ],
  },
  {
    title: t("comp.security") || "Security, Integrations & SLA",
    rows: [
      {
        label: "SOC2 Type II Compliant Hosting",
        free: true,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Custom ATS System Integrations",
        free: false,
        pro: false,
        scale: false,
        enterprise: true,
      },
      {
        label: "Role-Based Access Controls",
        free: true,
        pro: true,
        scale: true,
        enterprise: true,
      },
      {
        label: "Dedicated Recruiter Account Manager",
        free: false,
        pro: false,
        scale: false,
        enterprise: true,
      },
    ],
  },
  {
    title: t("comp.support") || "Recruiter Support & Exam Services",
    rows: [
      {
        label: "Email Support Turnaround",
        free: "48 hours",
        pro: "12 hours",
        scale: "2 hours",
        enterprise: "30 min SLA",
      },
      {
        label: "Proctored Skill Exam Packs",
        free: false,
        pro: "With Add-on",
        scale: "With Add-on",
        enterprise: true,
      },
      {
        label: "Custom Question Bank Builder",
        free: false,
        pro: false,
        scale: true,
        enterprise: true,
      },
    ],
  },
];

const FAQS = [
  {
    q: {
      en: "What happens after my 1-day history retention expires on the Free plan?",
      ar: "ماذا يحدث بعد انتهاء فترة حفظ السجلات لمدة يوم واحد في الباقة المجانية؟",
    },
    a: {
      en: "Your active node progress and mastery percentages remain saved on your profile forever. Only detailed historical attempt logs and generated study materials older than 24 hours are cleared.",
      ar: "تظل جميع النقاط المكتملة ونسب التقدم محفوظة في ملفك الشخصي للأبد. يتم فقط مسح سجلات المحاولات التفصيلية والأدلة الدراسية التي مر عليها أكثر من ٢٤ ساعة.",
    },
  },
  {
    q: {
      en: "Can I upgrade or downgrade my tier at any time?",
      ar: "هل يمكنني ترقية الباقة أو تخفيضها في أي وقت؟",
    },
    a: {
      en: "Yes. Upgrades take effect immediately with pro-rated billing. Downgrades take effect at the start of your next monthly billing cycle.",
      ar: "نعم. تسري الترقية فوراً مع محاسبة نسبية حسب الأيام المتبقية. بينما يسري تخفيض الباقة مع بداية الدورة الشهرية القادمة.",
    },
  },
  {
    q: {
      en: "How does the pre-vetted recruiter candidate index work?",
      ar: "كيف تعمل ميزة البحث في قائمة الكوادر المؤهلة مسبقاً للشركات؟",
    },
    a: {
      en: "Candidates who score 80%+ on verified topic tracks can opt-in to feature their profile in the Recruiter Index. Recruiters on the Scale plan search candidates by vector semantic similarity across verified skills.",
      ar: "المرشحون الحاصلون على ٨٠٪ فأكثر في التقاطيع المعتمدة يمكنهم تفعيل ميزة الظهور للشركات. وتستطيع الشركات في باقة Scale البحث والتصفية باستخدام الذكاء الاصطناعي.",
    },
  },
  {
    q: {
      en: "What are proctored assessment sessions?",
      ar: "ما هي جلسات التقييم المراقبة؟",
    },
    a: {
      en: "Proctored sessions add identity verification, screen recording, and tab-switch monitoring to assessment quizzes, providing hiring managers with audit-proof verification scores.",
      ar: "تضيف الجلسات المراقبة التحقق من الهوية وتسجيل الشاشة ومراقبة التنقل بين المتصفحات لمنح مسؤولي التوظيف درجات تقييم موثوقة تماماً.",
    },
  },
  {
    q: {
      en: "Is there a discount for annual billing?",
      ar: "هل يوجد خصم عند الاشتراك السنوي؟",
    },
    a: {
      en: "Yes! Choosing annual billing gives you 2 months free across all paid plans (equivalent to a 17% discount).",
      ar: "نعم! اختيار الدفع السنوي يمنحك شهرين مجاناً في كل الباقات المدفوعة (خصم يعادل ١٧٪).",
    },
  },
];

const TESTIMONIALS = [
  {
    quote: {
      en: "SmartRoadmap cut our technical screening cycle from 3 weeks to 4 days. The verified badges mean candidates actually know what they claim.",
      ar: "قللت خارطة الطريق الذكية دورة التقييم الفني لدينا من ٣ أسابيع إلى ٤ أيام. الشارات المعتمدة تعني أن المرشحين يمتلكون المهارات الفعلية.",
    },
    name: "Sarah Jenkins",
    role: { en: "Head of Engineering, FinTech", ar: "مديرة الهندسة بشركة FinTech" },
  },
  {
    quote: {
      en: "The adaptive quizzes identified my gaps in distributed systems within 20 minutes. The RAG study guides helped me land my Senior Role.",
      ar: "كشفت الاختبارات التكيفية فجواتي في الأنظمة الموزعة خلال 20 دقيقة. وأدلة RAG ساعدتني للحصول على وظيفتي الحالية.",
    },
    name: "Omar Farooq",
    role: { en: "Senior DevOps Engineer", ar: "مهندس DevOps أول" },
  },
  {
    quote: {
      en: "The quizzes adjust to how you answer. It feels like a real technical interview, not a static test.",
      ar: "تتكيف الاختبارات وفقاً لإجاباتك السابقة. تشعر وكأنها مقابلة عمل فنية حقيقية مع مهندس خبير، وليست مجرد اختبار جامد.",
    },
    name: "Karim Adel",
    role: { en: "Backend Candidate", ar: "مرشح تطوير خلفي" },
  },
];

const LOGOS = [
  "ANTHROPIC",
  "ROBINHOOD",
  "LOOM",
  "DUOLINGO",
  "DISCORD",
  "GUSTO",
  "NOTION",
  "FIGMA",
];

import { usePricing } from "./usePricing";

export default function PricingPage() {
  const {
    audience,
    setAudience,
    captureSimulatedPayment,
    handleCancelUpgrade,
    handleInitiateUpgrade,
    handleSimulateLogin,
    isProcessingCheckout,
    locale,
    openFaq,
    paypalOrder,
    selectedPlan,
    setIsProcessingCheckout,
    setOpenFaq,
    setPaypalOrder,
    setSelectedPlan,
    setShowSimulatedModal,
    setSimulatedCard,
    setUser,
    showSimulatedModal,
    simulatedCard,
    tLocal,
    translateFeatureVal,
    triggerPayPalCheckout,
    user,
  } = usePricing();

  const isCompanyUser = user?.role === "company";
  const isLearnerUser = user?.role === "learner";

  const currentFeatureSections =
    audience === "company"
      ? COMPANY_FEATURE_SECTIONS(tLocal)
      : FEATURE_SECTIONS(tLocal);

  return (
    <div className="bg-base-100 text-base-content min-h-screen font-sans selection:bg-[#8E1616] selection:text-white">
      {/* Header */}
      <section className="pb-8 px-4 text-center max-w-3xl mx-auto space-y-4 pt-6">
        <span className="inline-flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/25 text-[#059669] px-4 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold">
          Transparent Subscriptions
        </span>
        <h1 className="text-display-lg tracking-tight font-extrabold text-base-content leading-none">
          {audience === "company"
            ? locale === "ar"
              ? "أسعار باقات التوظيف والشركات"
              : "Recruiter & Company Sourcing Tiers"
            : tLocal("pricing.title")}
        </h1>
        <p className="text-body-md text-base-content/70 max-w-xl mx-auto">
          {audience === "company"
            ? locale === "ar"
              ? "استقطب أفضل الكوادر البرمجية المعتمدة، واستفد من تقييمات الذكاء الاصطناعي وشارة الشريك المعتمد."
              : "Source verified engineering candidates, unlock AI match scores, and get featured as a Verified Partner."
            : tLocal("pricing.subtitle")}
        </p>

        {/* Intelligent Role Switcher: Rendered for Guests (!user) only */}
        {!user ? (
          <div className="inline-flex p-1 bg-base-200 border border-base-300 rounded-2xl shadow-inner mt-4">
            <button
              onClick={() => setAudience("learner")}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                audience === "learner"
                  ? "bg-primary text-primary-content shadow-xs"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              {locale === "ar" ? "للباحثين والطلاب (Learners)" : "For Learners"}
            </button>
            <button
              onClick={() => setAudience("company")}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                audience === "company"
                  ? "bg-primary text-primary-content shadow-xs"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              {locale === "ar" ? "للشركات والتوظيف (Companies)" : "For Companies"}
            </button>
          </div>
        ) : (
          /* Role Lock Badge for Logged-In Users */
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-mono uppercase tracking-wider mt-2">
            {isCompanyUser
              ? locale === "ar"
                ? "🏢 باقات الشركات والتوظيف المخصصة لـ Company"
                : "🏢 Exclusive Recruiter & Company Plans"
              : locale === "ar"
              ? "🚀 باقات التعلم والنمو المخصصة لـ Learner"
              : "🚀 Exclusive Learner & Student Plans"}
          </div>
        )}
      </section>

      {/* Pricing Cards Grid */}
      <section className="px-4 pb-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {audience === "company" ? (
            /* Company Audience Tiers */
            <>
              {/* Company Free */}
              <div className="border border-base-300 bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-primary/30 transition-all text-start">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">
                      {tLocal("company_starter.title")}
                    </h3>
                    <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                      {tLocal("company_starter.desc")}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                    <span className="text-4xl font-black font-mono text-base-content">
                      {tLocal("company_starter.price")}
                    </span>
                    <span className="text-base-content/50 text-xs font-mono">
                      {tLocal("company_starter.period")}
                    </span>
                  </div>
                  <ul className="space-y-3 text-xs text-base-content/85">
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_starter.f1")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_starter.f2")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_starter.f3")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_starter.f4")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_starter.f5")}
                    </li>
                  </ul>
                </div>
                <button className="w-full btn btn-outline border-base-300 text-base-content/40 hover:bg-transparent rounded-xl btn-sm mt-8 h-10 min-h-0 cursor-not-allowed">
                  {tLocal("company_starter.cta")}
                </button>
              </div>

              {/* Company Growth (Popular) */}
              <div className="border-2 border-primary bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-md relative text-start">
                <div className="absolute top-0 right-0 bg-primary text-primary-content text-[9px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-bl-xl">
                  Recruiter Pick
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">
                      {tLocal("company_growth.title")}
                    </h3>
                    <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                      {tLocal("company_growth.desc")}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                    <span className="text-4xl font-black font-mono text-primary">
                      {tLocal("company_growth.price")}
                    </span>
                    <span className="text-base-content/50 text-xs font-mono">
                      {tLocal("company_growth.period")}
                    </span>
                  </div>
                  <ul className="space-y-3 text-xs text-base-content/85">
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_growth.f1")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_growth.f2")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_growth.f3")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_growth.f4")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_growth.f5")}
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleInitiateUpgrade("pro")}
                  className="w-full btn bg-primary hover:bg-primary/80 border-none text-primary-content rounded-xl btn-sm mt-8 h-10 min-h-0 font-bold"
                >
                  {tLocal("company_growth.cta")}
                </button>
              </div>

              {/* Company Scale */}
              <div className="border border-base-300 bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-primary/30 transition-all text-start">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">
                      {tLocal("company_scale.title")}
                    </h3>
                    <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                      {tLocal("company_scale.desc")}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                    <span className="text-4xl font-black font-mono text-base-content">
                      {tLocal("company_scale.price")}
                    </span>
                    <span className="text-base-content/50 text-xs font-mono">
                      {tLocal("company_scale.period")}
                    </span>
                  </div>
                  <ul className="space-y-3 text-xs text-base-content/85">
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_scale.f1")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_scale.f2")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_scale.f3")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_scale.f4")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_scale.f5")}
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleInitiateUpgrade("scale")}
                  className="w-full btn btn-outline border-base-300 text-base-content hover:bg-base-300 rounded-xl btn-sm mt-8 h-10 min-h-0 font-bold"
                >
                  {tLocal("company_scale.cta")}
                </button>
              </div>

              {/* Company Enterprise */}
              <div className="border border-base-300 bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-primary/30 transition-all text-start">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">
                      {tLocal("company_ent.title")}
                    </h3>
                    <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                      {tLocal("company_ent.desc")}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                    <span className="text-4xl font-black text-base-content">
                      {tLocal("company_ent.price")}
                    </span>
                  </div>
                  <ul className="space-y-3 text-xs text-base-content/85">
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_ent.f1")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_ent.f2")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_ent.f3")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("company_ent.f4")}
                    </li>
                  </ul>
                </div>
                <button className="w-full btn bg-neutral hover:bg-neutral/80 text-neutral-content border-none rounded-xl btn-sm mt-8 h-10 min-h-0 font-bold">
                  {tLocal("company_ent.cta")}
                </button>
              </div>
            </>
          ) : (
            /* Learner Audience Tiers */
            <>
              {/* Free Tier */}
              <div className="border border-base-300 bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-[#10B981]/30 transition-all text-start">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">
                      {tLocal("free.title")}
                    </h3>
                    <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                      {tLocal("free.desc")}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                    <span className="text-4xl font-black font-mono text-base-content">
                      {tLocal("free.price")}
                    </span>
                    <span className="text-base-content/50 text-xs font-mono">
                      {tLocal("free.period")}
                    </span>
                  </div>
                  <ul className="space-y-3 text-xs text-base-content/85">
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("free.f1")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("free.f2")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("free.f3")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("free.f4")}
                    </li>
                    <li className="flex gap-2 text-base-content/30">
                      <span>–</span>
                      {tLocal("free.f5")}
                    </li>
                  </ul>
                </div>
                <button className="w-full btn btn-outline border-base-300 text-base-content/40 hover:bg-transparent rounded-xl btn-sm mt-8 h-10 min-h-0 cursor-not-allowed">
                  {tLocal("free.cta")}
                </button>
              </div>

              {/* Pro Tier */}
              <div className="border-2 border-[#10B981] bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-md relative text-start">
                <div className="absolute top-0 right-0 bg-[#10B981] text-white text-[9px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-bl-xl">
                  Learner Pick
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">
                      {tLocal("pro.title")}
                    </h3>
                    <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                      {tLocal("pro.desc")}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                    <span className="text-4xl font-black font-mono text-[#059669]">
                      {tLocal("pro.price")}
                    </span>
                    <span className="text-base-content/50 text-xs font-mono">
                      {tLocal("pro.period")}
                    </span>
                  </div>
                  <ul className="space-y-3 text-xs text-base-content/85">
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("free.f1")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("pro.f1")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("pro.f2")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("pro.f3")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("pro.f4")}
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleInitiateUpgrade("pro")}
                  className="w-full btn bg-[#10B981] hover:bg-[#059669] border-none text-white rounded-xl btn-sm mt-8 h-10 min-h-0 font-bold"
                >
                  {tLocal("pro.cta")}
                </button>
              </div>

              {/* Scale Tier */}
              <div className="border border-base-300 bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-[#10B981]/30 transition-all text-start">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">
                      {tLocal("scale.title")}
                    </h3>
                    <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                      {tLocal("scale.desc")}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                    <span className="text-4xl font-black font-mono text-base-content">
                      {tLocal("scale.price")}
                    </span>
                    <span className="text-base-content/50 text-xs font-mono">
                      {tLocal("scale.period")}
                    </span>
                  </div>
                  <ul className="space-y-3 text-xs text-base-content/85">
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("scale.f1")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("scale.f2")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("scale.f3")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("scale.f4")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("free.f5")}
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleInitiateUpgrade("scale")}
                  className="w-full btn btn-outline border-base-300 text-base-content hover:bg-base-300 rounded-xl btn-sm mt-8 h-10 min-h-0 font-bold"
                >
                  {tLocal("scale.cta")}
                </button>
              </div>

              {/* Enterprise Tier */}
              <div className="border border-base-300 bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-[#10B981]/30 transition-all text-start">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">
                      {tLocal("ent.title")}
                    </h3>
                    <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                      {tLocal("ent.desc")}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                    <span className="text-4xl font-black text-base-content">
                      {tLocal("ent.price")}
                    </span>
                  </div>
                  <ul className="space-y-3 text-xs text-base-content/85">
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("ent.f1")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("ent.f2")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("ent.f3")}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#059669]">✓</span>
                      {tLocal("ent.f4")}
                    </li>
                  </ul>
                </div>
                <button className="w-full btn bg-neutral hover:bg-neutral/80 text-neutral-content border-none rounded-xl btn-sm mt-8 h-10 min-h-0 font-bold">
                  {tLocal("ent.cta")}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Role-Specific Feature Comparative Tables */}
      <section className="px-4 pb-20 max-w-5xl mx-auto">
        <div className="space-y-12">
          {currentFeatureSections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h2 className="text-md font-bold text-base-content text-start">
                {section.title}
              </h2>
              <div className="border border-base-300 rounded-2xl overflow-hidden bg-base-200 shadow-sm">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-base-300 bg-base-100">
                      <th className="text-start font-bold text-stone-700 dark:text-stone-300 font-medium py-3 px-4 uppercase tracking-wider font-mono">
                        Parameters
                      </th>
                      {audience === "company"
                        ? ["Free", "Growth", "Scale", "Enterprise"].map((t) => (
                            <th
                              key={t}
                              className="text-center font-bold text-base-content/60 py-3 px-4 w-24 uppercase tracking-wider font-mono"
                            >
                              {t}
                            </th>
                          ))
                        : ["Free", "Pro", "Scale", "Enterprise"].map((t) => (
                            <th
                              key={t}
                              className="text-center font-bold text-base-content/60 py-3 px-4 w-24 uppercase tracking-wider font-mono"
                            >
                              {t}
                            </th>
                          ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, i) => (
                      <tr
                        key={row.label}
                        className={
                          i !== section.rows.length - 1
                            ? "border-b border-base-300"
                            : ""
                        }
                      >
                        <td className="text-start text-base-content/90 py-3 px-4 font-semibold">
                          {row.label}
                        </td>
                        <td className="text-center py-3 px-4">
                          {translateFeatureVal(row.free)}
                        </td>
                        <td className="text-center py-3 px-4">
                          {translateFeatureVal(row.pro)}
                        </td>
                        <td className="text-center py-3 px-4">
                          {translateFeatureVal(row.scale)}
                        </td>
                        <td className="text-center py-3 px-4">
                          {translateFeatureVal(row.enterprise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="px-4 pb-20 max-w-5xl mx-auto">
        <div className="border border-[#10B981]/30 bg-[#10B981]/5 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-start">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#059669]">
              {tLocal("addons.title")}
            </span>
            <h3 className="text-base font-extrabold text-base-content">
              {tLocal("addons.box_title")}
            </h3>
            <p className="text-xs text-base-content/70 leading-relaxed">
              {tLocal("addons.box_desc")}
            </p>
          </div>
          <button className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl btn-sm h-10 px-6 shrink-0 font-bold">
            {tLocal("addons.btn")}
          </button>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="px-4 pb-20 max-w-4xl mx-auto">
        <h2 className="text-xl font-extrabold text-center text-base-content mb-8 font-heading">
          {tLocal("faq.title")}
        </h2>
        <div className="space-y-3 text-start">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-base-300 rounded-2xl overflow-hidden bg-base-200 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-start font-semibold text-xs text-base-content flex justify-between items-center gap-4"
                >
                  <span>{faq.q[locale as "en" | "ar"] || faq.q.en}</span>
                  <span className="text-base-content/50 font-mono text-base leading-none">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-base-content/70 border-t border-base-300/50 pt-3 leading-relaxed">
                    {faq.a[locale as "en" | "ar"] || faq.a.en}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="border border-base-300 bg-base-200 rounded-2xl p-6 flex flex-col justify-between space-y-4"
            >
              <p className="text-xs italic text-base-content/80 leading-relaxed">
                &quot;{t.quote[locale as "en" | "ar"] || t.quote.en}&quot;
              </p>
              <div>
                <h4 className="text-xs font-bold text-base-content">{t.name}</h4>
                <p className="text-[10px] text-base-content/50 font-mono">
                  {t.role[locale as "en" | "ar"] || t.role.en}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Logos Strip */}
      <section className="px-4 pb-20 max-w-5xl mx-auto text-center border-t border-base-300 pt-12">
        <p className="text-[10px] font-mono uppercase tracking-widest text-base-content/40 mb-6 font-bold">
          Trusted by engineers & teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all text-xs font-mono font-black text-base-content">
          {LOGOS.map((logo) => (
            <span key={logo} className="tracking-widest">
              {logo}
            </span>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="px-4 pb-24 max-w-5xl mx-auto">
        <div className="border border-base-300 bg-base-200 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-md relative overflow-hidden">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-extrabold text-base-content font-heading tracking-tight">
              {tLocal("cta.title")}
            </h2>
            <p className="text-xs text-base-content/70">
              {tLocal("cta.desc")}
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/auth/signup")}
            className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-8 font-bold text-xs"
          >
            {tLocal("cta.btn")}
          </button>
        </div>
      </section>

      {/* Upgrade Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-base-100 border border-base-300 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl text-start">
            <div className="flex justify-between items-center border-b border-base-300 pb-4">
              <div>
                <h3 className="font-extrabold text-base font-heading text-base-content">
                  Upgrade to {selectedPlan === "pro" ? "Premium Pro" : "Recruiter Scale"}
                </h3>
                <p className="text-xs text-base-content/60">
                  {selectedPlan === "pro" ? "$19.99 / month" : "$99.99 / month"}
                </p>
              </div>
              <button
                onClick={handleCancelUpgrade}
                className="text-base-content/50 hover:text-base-content font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={triggerPayPalCheckout}
                disabled={isProcessingCheckout}
                className="w-full btn bg-[#0070BA] hover:bg-[#003087] text-white border-none rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {isProcessingCheckout ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Pay securely with PayPal"
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-base-300" />
                <span className="flex-shrink mx-4 text-[10px] font-mono uppercase text-base-content/40">
                  Or Simulate Card
                </span>
                <div className="flex-grow border-t border-base-300" />
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Card Number"
                  value={simulatedCard.number}
                  onChange={(e) =>
                    setSimulatedCard({ ...simulatedCard, number: e.target.value })
                  }
                  className="input input-sm w-full bg-base-200 border-base-300 text-xs font-mono"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={simulatedCard.expiry}
                    onChange={(e) =>
                      setSimulatedCard({ ...simulatedCard, expiry: e.target.value })
                    }
                    className="input input-sm w-full bg-base-200 border-base-300 text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={simulatedCard.cvv}
                    onChange={(e) =>
                      setSimulatedCard({ ...simulatedCard, cvv: e.target.value })
                    }
                    className="input input-sm w-full bg-base-200 border-base-300 text-xs font-mono"
                  />
                </div>
                <button
                  onClick={captureSimulatedPayment}
                  disabled={isProcessingCheckout}
                  className="w-full btn btn-outline border-base-300 text-base-content hover:bg-base-200 rounded-xl btn-sm font-bold mt-2"
                >
                  Simulate Payment Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
