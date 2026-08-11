"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiFetch, hasSession } from "@/lib/api";
import {
  Sparkles,
  ArrowRight,
  Code2,
  CheckCircle2,
  AlertCircle,
  Play,
  Star,
  Clock,
  BookOpen,
  Layers,
  Terminal,
  ShieldCheck,
  Compass,
  Cpu,
  Globe,
  Database,
  Search,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  // Interactive Skill Gap Analyzer State
  const [targetRole, setTargetRole] = useState("Fullstack Architect");
  const [activeTab, setActiveTab] = useState("All Paths");
  const [activeRoadmap, setActiveRoadmap] = useState<any>(null);

  // Skill Audit result state
  const [auditResult, setAuditResult] = useState({
    score: 84,
    role: "Fullstack Architect",
    verifiedSkills: [
      "TypeScript Strict Mode",
      "React 18 & Server Components",
      "NestJS Microservices",
      "Redis Caching & PubSub",
      "REST & GraphQL Federation",
    ],
    missingSkills: [
      "Distributed Event Sourcing (Kafka)",
      "Qdrant Vector Database & Embeddings",
      "Kubernetes Multi-Cluster Deployments",
    ],
  });

  useEffect(() => {
    if (hasSession()) {
      (async () => {
        try {
          const res = await apiFetch("/roadmap/me");
          if (res.ok) {
            const data = await res.json();
            setActiveRoadmap(data);
          }
        } catch (err) {
          console.error("Failed to load active user roadmap", err);
        }
      })();
    }
  }, []);

  const handleRoleChange = (role: string) => {
    setTargetRole(role);
    if (role === "Frontend Architect") {
      setAuditResult({
        score: 88,
        role: "Frontend Architect",
        verifiedSkills: [
          "React 18 & Next.js 14 App Router",
          "TypeScript Strict Generics",
          "Design Systems & Token Architecture",
          "Web Vitals & Performance Profiling",
        ],
        missingSkills: [
          "Micro-Frontends & Module Federation",
          "End-to-End Playwright Automation",
          "WebAssembly (Wasm) Integration",
        ],
      });
    } else if (role === "Backend & Distributed Systems") {
      setAuditResult({
        score: 82,
        role: "Backend & Distributed Systems",
        verifiedSkills: [
          "NestJS Modular Architecture",
          "MongoDB Sharding & Aggregations",
          "Redis In-Memory Caching",
          "JWT & RBAC Security Protocols",
        ],
        missingSkills: [
          "High-Throughput RabbitMQ/BullMQ",
          "Vector Database (Qdrant) Embeddings",
          "Docker Multi-Stage Optimization",
        ],
      });
    } else if (role === "AI & Vector Systems Engineer") {
      setAuditResult({
        score: 76,
        role: "AI & Vector Systems Engineer",
        verifiedSkills: [
          "Python & TypeScript AI SDKs",
          "OpenAI & Gemini API Integration",
          "RAG Pipeline Architecture",
          "Prompt Engineering & Structured Outputs",
        ],
        missingSkills: [
          "Qdrant Hybrid Vector Search",
          "Voice Agents (AssemblyAI / WebSockets)",
          "Local LLM Fine-Tuning & Quantization",
        ],
      });
    } else {
      setAuditResult({
        score: 84,
        role: "Fullstack Architect",
        verifiedSkills: [
          "TypeScript Strict Mode",
          "React 18 & Server Components",
          "NestJS Microservices",
          "Redis Caching & PubSub",
          "REST & GraphQL Federation",
        ],
        missingSkills: [
          "Distributed Event Sourcing (Kafka)",
          "Qdrant Vector Database & Embeddings",
          "Kubernetes Multi-Cluster Deployments",
        ],
      });
    }
  };

  // Learning Paths dataset (Frontend Masters style)
  const LEARNING_PATHS = [
    {
      id: "fullstack",
      category: "Fullstack",
      title: "Fullstack Engineering & Distributed Systems",
      level: "Advanced",
      duration: "42 Hours",
      coursesCount: 12,
      topics: ["React 18", "Next.js", "NestJS", "MongoDB", "Redis", "Docker"],
      instructor: "Mohamed Elsaied",
      instructorRole: "Staff Software Engineer",
      gradient: "from-[#E1251B] to-[#FA5D29]",
      featured: true,
    },
    {
      id: "frontend",
      category: "Frontend",
      title: "Modern Frontend Architecture & Design Systems",
      level: "Intermediate to Advanced",
      duration: "34 Hours",
      coursesCount: 9,
      topics: ["TypeScript", "Next.js 14", "Tailwind CSS", "State Machines", "Web Vitals"],
      instructor: "Sarah Jenkins",
      instructorRole: "Frontend Lead at Stripe",
      gradient: "from-[#FF4538] to-[#FF8C38]",
      featured: false,
    },
    {
      id: "backend",
      category: "Backend",
      title: "Enterprise Backend Microservices & MongoDB",
      level: "Advanced",
      duration: "38 Hours",
      coursesCount: 11,
      topics: ["NestJS", "Mongoose", "Aggregation Pipeline", "BullMQ", "Auth & RBAC"],
      instructor: "David Miller",
      instructorRole: "Principal Architect",
      gradient: "from-[#E1251B] to-[#991B1B]",
      featured: false,
    },
    {
      id: "ai",
      category: "AI & Vectors",
      title: "Applied AI Engineering & Vector Databases",
      level: "Cutting-Edge",
      duration: "28 Hours",
      coursesCount: 8,
      topics: ["Qdrant", "RAG Systems", "Voice Agents", "LLM Tool Calling", "Gemini 2.5"],
      instructor: "Dr. Elena Rostova",
      instructorRole: "AI Research Fellow",
      gradient: "from-[#FA5D29] to-[#F59E0B]",
      featured: true,
    },
    {
      id: "devops",
      category: "DevOps & Cloud",
      title: "Cloud Native DevOps, Docker & CI/CD Pipelines",
      level: "Intermediate",
      duration: "26 Hours",
      coursesCount: 7,
      topics: ["Docker", "Kubernetes", "GitHub Actions", "Nginx", "Monitoring"],
      instructor: "Alexandre Vance",
      instructorRole: "Infrastructure Lead",
      gradient: "from-[#E1251B] to-[#C81E15]",
      featured: false,
    },
    {
      id: "algorithms",
      category: "Practice",
      title: "Algorithmic Problem Solving & System Design",
      level: "All Levels",
      duration: "30 Hours",
      coursesCount: 10,
      topics: ["Data Structures", "Dynamic Programming", "System Design", "Scalability"],
      instructor: "Marcus Vance",
      instructorRole: "Senior Engineer at Google",
      gradient: "from-[#FF4538] to-[#E1251B]",
      featured: false,
    },
  ];

  const filteredPaths =
    activeTab === "All Paths"
      ? LEARNING_PATHS
      : LEARNING_PATHS.filter((p) => p.category === activeTab);

  return (
    <div className="bg-base-100 text-base-content min-h-screen font-sans selection:bg-[#E1251B] selection:text-white relative overflow-hidden">
      {/* Ambient Red Glows in Frontend Masters style */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-[#E1251B]/15 via-[#FA5D29]/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 right-0 w-[500px] h-[500px] bg-[#E1251B]/8 blur-[120px] pointer-events-none -z-10" />

      {/* Grid line pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: HERO (FRONTEND MASTERS HIGH-IMPACT STYLE)
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-6 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-7 text-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-base-200 border border-base-300 text-xs font-mono font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#E1251B] animate-pulse" />
              <span className="text-[#FF7B72]">THE PREMIER ENGINEERING ROADMAP PLATFORM</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-base-content">
              Advance Your Engineering Career with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E1251B] via-[#FF5A4E] to-[#FA5D29]">
                Deep Technical Mastery
              </span>
            </h1>

            <p className="text-base sm:text-lg text-base-content/80 max-w-2xl leading-relaxed">
              Step beyond basic tutorials. Follow in-depth, adaptive learning paths, solve real-world system architecture challenges, prove verified skills, and connect directly to top hiring engineering teams.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
              <Link
                href="/roadmap"
                className="btn fem-btn-primary h-13 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/25"
              >
                <span>Explore Learning Paths</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/onboarding"
                className="btn fem-btn-secondary h-13 px-7 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Terminal className="w-4 h-4 text-[#FF5A4E]" />
                <span>Audit Technical Skills</span>
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-base-300">
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-base-content">40+</div>
                <div className="text-xs text-base-content/60 font-medium">Curated Tracks</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-[#E1251B]">98%</div>
                <div className="text-xs text-base-content/60 font-medium">Recruiter Match Rate</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-base-content">100%</div>
                <div className="text-xs text-base-content/60 font-medium">Verified Code Audits</div>
              </div>
            </div>
          </div>

          {/* Right Featured Masterclass Card (Frontend Masters Look) */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-[#E1251B] to-[#FA5D29] opacity-25 blur-2xl pointer-events-none" />

            <div className="fem-card p-6 shadow-2xl space-y-5 text-start relative z-10 border border-base-300">
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-base-300 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E1251B]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-base-content/75">
                    FEATURED MASTERCLASS
                  </span>
                </div>
                <span className="fem-chip fem-chip-red text-[11px]">
                  ADVANCED
                </span>
              </div>

              {/* Course Title & Rating */}
              <div>
                <h3 className="text-xl font-extrabold text-base-content leading-snug">
                  Fullstack Distributed Systems & Microservices Architecture
                </h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-base-content/60 font-mono">
                  <div className="flex text-amber-400">
                    {"★★★★★"}
                  </div>
                  <span>4.98 (1,420 ratings)</span>
                </div>
              </div>

              {/* Instructor Pill */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/80 border border-base-300">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E1251B] to-[#FF5A4E] text-white flex items-center justify-center font-bold text-sm shadow-md">
                  ME
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-base-content truncate">Mohamed Elsaied</div>
                  <div className="text-[11px] text-base-content/60 truncate">Staff Engineer & Platform Architect</div>
                </div>
              </div>

              {/* Key Syllabus Accordion Items */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-base-200/60 border border-base-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#E1251B] font-mono font-bold">01</span>
                    <span className="text-base-content/90 font-semibold">Modular NestJS & Async Queues</span>
                  </div>
                  <span className="text-[10px] font-mono text-base-content/50">45 mins</span>
                </div>
                <div className="p-2.5 rounded-lg bg-base-200/60 border border-base-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#E1251B] font-mono font-bold">02</span>
                    <span className="text-base-content/90 font-semibold">MongoDB Sharding & Aggregation Mastery</span>
                  </div>
                  <span className="text-[10px] font-mono text-base-content/50">1 hr 15 mins</span>
                </div>
                <div className="p-2.5 rounded-lg bg-base-200/60 border border-base-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#E1251B] font-mono font-bold">03</span>
                    <span className="text-base-content/90 font-semibold">Vector Embeddings with Qdrant</span>
                  </div>
                  <span className="text-[10px] font-mono text-base-content/50">55 mins</span>
                </div>
              </div>

              {/* Progress / CTA */}
              <div className="pt-2">
                <Link
                  href="/roadmap"
                  className="btn fem-btn-primary w-full h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Learning This Track</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: POPULAR LEARNING PATHS & TRACKS (FRONTEND MASTERS STYLE)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-base-300">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 text-start">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#FF7B72] uppercase tracking-wider mb-2">
              <span>⚡</span> STRUCTURED CURRICULUM
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
              Curated Engineering Learning Paths
            </h2>
            <p className="text-base-content/70 text-sm mt-2 max-w-xl">
              Follow comprehensive roadmaps designed by industry staff engineers. Master entire tech stacks from foundations to advanced production patterns.
            </p>
          </div>

          {/* Track Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {["All Paths", "Frontend", "Backend", "Fullstack", "AI & Vectors"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab
                    ? "bg-[#E1251B] text-white shadow-md shadow-red-600/30"
                    : "bg-base-200 text-base-content/70 hover:text-base-content hover:bg-base-300 border border-base-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-start">
          {filteredPaths.map((path) => (
            <div
              key={path.id}
              className="fem-card p-6 flex flex-col justify-between group hover:border-[#E1251B]/50 transition-all duration-300"
            >
              <div>
                {/* Header meta */}
                <div className="flex justify-between items-start gap-2 mb-4">
                  <span className="fem-chip fem-chip-red text-[10px]">
                    {path.category.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-base-content/60 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#E1251B]" />
                    {path.duration}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-base-content group-hover:text-[#E1251B] transition-colors leading-snug mb-3">
                  {path.title}
                </h3>

                {/* Topics chips */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {path.topics.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-base-200 text-base-content/80 border border-base-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom footer: instructor + CTA */}
              <div className="border-t border-base-300 pt-4 mt-2 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-base-content">{path.instructor}</div>
                  <div className="text-[10px] text-base-content/60 font-mono">{path.instructorRole}</div>
                </div>
                <Link
                  href="/roadmap"
                  className="w-9 h-9 rounded-lg bg-base-200 group-hover:bg-[#E1251B] text-base-content/70 group-hover:text-white flex items-center justify-center transition-colors border border-base-300 group-hover:border-[#E1251B]"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: INTERACTIVE TERMINAL & SKILL GAP AUDIT
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-base-300">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-5 text-start space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#FF7B72] uppercase tracking-wider">
              <span>🛠️</span> LIVE SKILL AUDITING
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
              Audit Gaps & Build Your Career Roadmap
            </h2>

            <p className="text-base-content/80 text-sm leading-relaxed">
              Select your target engineering archetype. Our system evaluates real job market competency benchmarks, pinpoints exact missing skills, and inserts targeted remedial syllabus nodes.
            </p>

            {/* Quick role selectors */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-base-content/60 font-bold block">
                Select Target Archetype:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Fullstack Architect",
                  "Frontend Architect",
                  "Backend & Distributed Systems",
                  "AI & Vector Systems Engineer",
                ].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`p-3 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between border ${
                      targetRole === role
                        ? "bg-[#E1251B]/15 border-[#E1251B] text-base-content"
                        : "bg-base-200 border-base-300 text-base-content/70 hover:text-base-content hover:bg-base-300"
                    }`}
                  >
                    <span>{role}</span>
                    {targetRole === role && (
                      <CheckCircle2 className="w-4 h-4 text-[#E1251B]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Link
                href="/onboarding"
                className="btn fem-btn-primary px-6 rounded-xl font-bold text-xs h-11 inline-flex items-center gap-2"
              >
                <span>Launch Full Custom Career Audit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right: Frontend Masters Styled Code Terminal Simulator */}
          <div className="lg:col-span-7">
            <div className="fem-terminal p-6 space-y-5 text-start border border-base-300">
              {/* Terminal Window Header */}
              <div className="flex items-center justify-between border-b border-[#202533] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                  <span className="text-xs font-mono text-slate-400 ml-2">
                    devotopia-audit-engine ~ v2.4
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#00D2FF]">
                  NODE_ENV=production
                </span>
              </div>

              {/* Terminal Output Body */}
              <div className="font-mono text-xs space-y-4">
                <div className="text-slate-400 flex items-center gap-2">
                  <span className="text-[#E1251B] font-bold">➜</span>
                  <span>smartroadmap audit --role=&quot;{auditResult.role}&quot;</span>
                </div>

                <div className="p-4 rounded-lg bg-[#090B0E] border border-[#1E222D] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-bold">COMPATIBILITY SCORE:</span>
                    <span className="text-[#E1251B] font-black text-sm">{auditResult.score}% READY</span>
                  </div>

                  {/* Verified Skills */}
                  <div>
                    <div className="text-[11px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>VERIFIED IN PASSPORT ({auditResult.verifiedSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {auditResult.verifiedSkills.map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                        >
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <div className="text-[11px] font-bold text-[#FF7B72] mb-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>IDENTIFIED SYLLABUS GAPS ({auditResult.missingSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {auditResult.missingSkills.map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-red-950/40 text-[#FF7B72] border border-red-800/40"
                        >
                          ⚠ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-slate-400 text-[11px]">
                  <span className="text-emerald-400">✔</span> Generated 4 adaptive remedial roadmap modules to achieve 100% hiring readiness.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: LEARN FROM WORLD-CLASS INSTRUCTORS & MENTORS
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-base-300">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#FF7B72] uppercase tracking-wider">
            <span>🎓</span> INDUSTRY EXPERTS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
            Learn from Staff Engineers & Tech Leaders
          </h2>
          <p className="text-base-content/60 text-sm">
            Our curriculum and mentoring guilds are led by engineers actively shipping production code at leading technology companies.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 text-start">
          {[
            {
              name: "Mohamed Elsaied",
              role: "Staff Platform Engineer",
              company: "Devotopia Core Team",
              topics: "NestJS, Microservices, MongoDB",
              initials: "ME",
              gradient: "from-[#E1251B] to-[#FF4538]",
            },
            {
              name: "Sarah Jenkins",
              role: "Lead Frontend Architect",
              company: "Stripe",
              topics: "React 18, Design Systems",
              initials: "SJ",
              gradient: "from-[#FF4538] to-[#FA5D29]",
            },
            {
              name: "Marcus Vance",
              role: "Principal Systems Engineer",
              company: "Google Cloud",
              topics: "Distributed Systems, Go, K8s",
              initials: "MV",
              gradient: "from-[#FA5D29] to-[#F59E0B]",
            },
            {
              name: "Dr. Elena Rostova",
              role: "AI & Vector Search Fellow",
              company: "Qdrant AI Guild",
              topics: "RAG, Vector DB, LLMs",
              initials: "ER",
              gradient: "from-[#E1251B] to-[#991B1B]",
            },
          ].map((inst, idx) => (
            <div
              key={idx}
              className="fem-card p-6 space-y-4 hover:border-[#E1251B]/40 transition-all text-start border border-base-300"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${inst.gradient} text-white flex items-center justify-center font-bold text-sm shadow-md`}
                >
                  {inst.initials}
                </div>
                <div className="truncate">
                  <h4 className="font-extrabold text-sm text-base-content truncate">{inst.name}</h4>
                  <p className="text-[11px] text-[#FF7B72] font-mono truncate">{inst.company}</p>
                </div>
              </div>

              <div className="text-xs text-base-content/80 font-medium">
                {inst.role}
              </div>

              <div className="pt-2 border-t border-base-300 text-[11px] text-base-content/60 font-mono">
                Focus: {inst.topics}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: VERIFIED SKILL PASSPORT & DIRECT HIRING GATEWAY
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-base-300">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Passport Visual */}
          <div className="lg:col-span-6 relative">
            <div className="fem-card p-7 space-y-6 text-start border border-base-300">
              <div className="flex justify-between items-start border-b border-base-300 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-[#E1251B] font-bold tracking-widest uppercase block">
                    DEVOTOPIA VERIFIED CREDENTIAL
                  </span>
                  <h3 className="text-xl font-black text-base-content tracking-tight mt-0.5">
                    TECHNICAL SKILL PASSPORT
                  </h3>
                </div>
                <span className="fem-chip fem-chip-red text-[10px]">
                  VERIFIED PASS
                </span>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-3 gap-4 border-b border-base-300 pb-5 font-mono">
                <div>
                  <span className="text-[10px] text-base-content/60 block uppercase">Career Score</span>
                  <span className="text-2xl font-black text-[#E1251B]">94%</span>
                </div>
                <div>
                  <span className="text-[10px] text-base-content/60 block uppercase">Vetted Badges</span>
                  <span className="text-2xl font-black text-base-content">18 Total</span>
                </div>
                <div>
                  <span className="text-[10px] text-base-content/60 block uppercase">Match Factor</span>
                  <span className="text-2xl font-black text-emerald-500">98/100</span>
                </div>
              </div>

              {/* Assessment list */}
              <div className="space-y-2 text-xs">
                {[
                  { name: "React 18 & Server Components", score: "96%", status: "PASSED" },
                  { name: "NestJS Microservices Architecture", score: "92%", status: "PASSED" },
                  { name: "MongoDB Aggregation Pipeline", score: "95%", status: "PASSED" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-base-200/60 border border-base-300 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-semibold text-base-content/90">{item.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#E1251B]">{item.score}</span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-base-content/60 font-mono pt-2">
                🔒 Cryptographically signed with anti-cheat telemetry validation.
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-6 text-start space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#FF7B72] uppercase tracking-wider">
              <span>🎯</span> THE VETTED STANDARD
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
              Replace Resume Claims with Verified Proof
            </h2>

            <p className="text-base-content/80 text-sm leading-relaxed">
              Traditional tech hiring is broken with unverified claims and slow screening rounds. SmartRoadmap empowers you to prove your code mastery through proctored diagnostic testing and live project assessments.
            </p>

            <ul className="space-y-3 text-xs text-base-content/80">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#E1251B]/20 text-[#E1251B] flex items-center justify-center font-bold text-xs">✓</span>
                <span>Direct semantic search indexing into top tech recruiter pipelines.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#E1251B]/20 text-[#E1251B] flex items-center justify-center font-bold text-xs">✓</span>
                <span>Verified technical certificate exportable to LinkedIn and GitHub.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#E1251B]/20 text-[#E1251B] flex items-center justify-center font-bold text-xs">✓</span>
                <span>AI-powered mock interview practice with live voice feedback.</span>
              </li>
            </ul>

            <div>
              <Link
                href="/onboarding"
                className="btn fem-btn-primary px-7 rounded-xl font-bold text-xs h-11"
              >
                Generate My Skill Passport
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: CALL TO ACTION BANNER (FRONTEND MASTERS RED GLOW)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl p-10 sm:p-14 bg-gradient-to-br from-base-200 via-base-200 to-base-300 border border-base-300 text-center overflow-hidden shadow-2xl">
          {/* Flame radiant glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#E1251B]/25 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E1251B]/20 border border-[#E1251B]/40 text-[#FF7B72] text-xs font-mono font-bold">
              🔥 START YOUR TRANSFORMATION TODAY
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-base-content tracking-tight leading-tight">
              Ready to Master Modern Software Engineering?
            </h2>

            <p className="text-base-content/80 text-sm sm:text-base leading-relaxed">
              Join thousands of software engineers learning with structured, deep-dive curriculum tracks and verified skill benchmarks.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                href="/auth/register"
                className="btn fem-btn-primary h-13 px-9 rounded-xl font-bold text-sm shadow-xl shadow-red-600/30"
              >
                Get Started for Free
              </Link>
              <Link
                href="/pricing"
                className="btn fem-btn-secondary h-13 px-8 rounded-xl font-bold text-sm"
              >
                View Plans & Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
