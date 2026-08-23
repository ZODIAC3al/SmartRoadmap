"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  BookOpen,
  Code2,
  FolderGit2,
  FileCheck2,
  Trophy,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  X,
} from "lucide-react";

export interface JourneyMilestone {
  id: string;
  step: number;
  label: string; // 1-2 words compact label
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "completed" | "current" | "locked";
  route: string;
  actionText: string;
  details: {
    overview: string;
    skills: string[];
    benchmark: string;
  };
  // Position in SVG viewBox (0 - 1000 width, 0 - 460 height)
  cx: number;
  cy: number;
  pillPosition: "top" | "bottom";
  color: "gold" | "crimson" | "accent";
}

const DEFAULT_MILESTONES: JourneyMilestone[] = [
  {
    id: "assess",
    step: 1,
    label: "Assess",
    title: "Discover & Assess",
    subtitle: "Calibrate skill baseline and audit career readiness gaps",
    badge: "01 · Baseline",
    icon: Compass,
    status: "completed",
    route: "/onboarding",
    actionText: "Take Diagnostic",
    details: {
      overview:
        "Complete adaptive diagnostic assessments to map out current strengths and identify knowledge gaps.",
      skills: ["Skill Diagnostic", "Anti-Cheat Audit", "Gap Analysis"],
      benchmark: "88% Initial Readiness Score",
    },
    cx: 200,
    cy: 380,
    pillPosition: "top",
    color: "gold",
  },
  {
    id: "learn",
    step: 2,
    label: "Learn",
    title: "Core Foundation",
    subtitle: "Master fundamental syntax, architecture, and design patterns",
    badge: "02 · Learning",
    icon: BookOpen,
    status: "completed",
    route: "/roadmap",
    actionText: "Open Curriculum",
    details: {
      overview:
        "Progress through structured AI-generated DAG nodes targeting only topics needed for your target role.",
      skills: ["TypeScript Strict", "Component Architecture", "Design Systems"],
      benchmark: "12 of 14 Nodes Mastered",
    },
    cx: 370,
    cy: 300,
    pillPosition: "bottom",
    color: "gold",
  },
  {
    id: "skills",
    step: 3,
    label: "Skills",
    title: "Develop Skills",
    subtitle: "Deepen specialized engineering concepts and practical toolsets",
    badge: "03 · Skills",
    icon: Code2,
    status: "current",
    route: "/practice",
    actionText: "Practice Skills",
    details: {
      overview:
        "Execute hands-on coding challenges and verify mastery with real-time feedback and telemetry checks.",
      skills: ["State Management", "Performance Profiling", "Security Best Practices"],
      benchmark: "In Progress (78% Complete)",
    },
    cx: 550,
    cy: 250,
    pillPosition: "top",
    color: "crimson",
  },
  {
    id: "build",
    step: 4,
    label: "Build",
    title: "Build Projects",
    subtitle: "Turn theoretical knowledge into audited real-world repositories",
    badge: "04 · Projects",
    icon: FolderGit2,
    status: "locked",
    route: "/portfolio",
    actionText: "View Projects",
    details: {
      overview:
        "Build enterprise-grade capstone projects with automated GitHub CI/CD code audits and peer verification.",
      skills: ["Fullstack Application", "E2E Testing Suite", "Cloud Deployment"],
      benchmark: "2 Verified Projects Required",
    },
    cx: 710,
    cy: 170,
    pillPosition: "bottom",
    color: "crimson",
  },
  {
    id: "ready",
    step: 5,
    label: "Job Ready",
    title: "Become Job Ready",
    subtitle: "Generate verified ATS CV and log mock interview performance",
    badge: "05 · Readiness",
    icon: FileCheck2,
    status: "locked",
    route: "/cv",
    actionText: "Build Verified CV",
    details: {
      overview:
        "Package verified skill badges and project audit scores directly into an interactive recruiter-ready CV.",
      skills: ["ATS Optimization", "Technical Mock Session", "Passport Index"],
      benchmark: "94/100 Candidate Index",
    },
    cx: 840,
    cy: 120,
    pillPosition: "top",
    color: "crimson",
  },
  {
    id: "goal",
    step: 6,
    label: "Career Goal",
    title: "Land Dream Career",
    subtitle: "Match directly with top tech guilds and hiring recruiters",
    badge: "06 · Goal",
    icon: Trophy,
    status: "locked",
    route: "/hiring",
    actionText: "Explore Matches",
    details: {
      overview:
        "Direct recruiter matching pipeline based on verified proof scores, cutting screening cycles to zero.",
      skills: ["Verified Candidate Pool", "Direct Guild Invites", "Offer Negotiation"],
      benchmark: "98% Recruiter Match Rate",
    },
    cx: 935,
    cy: 65,
    pillPosition: "bottom",
    color: "gold",
  },
];

interface AnimatedRoadmapVisualProps {
  activeRole?: string;
  score?: number;
  onRoleChange?: (role: string) => void;
  standalone?: boolean;
}

export default function AnimatedRoadmapVisual({
  activeRole = "Frontend Engineer",
  score = 82,
  onRoleChange,
  standalone = false,
}: AnimatedRoadmapVisualProps) {
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<JourneyMilestone | null>(null);
  const [currentRole, setCurrentRole] = useState(activeRole);

  const rolesList = [
    "Frontend Engineer",
    "Fullstack Developer",
    "AI & Data Engineer",
    "Backend Architect",
    "DevOps Cloud Engineer",
  ];

  const handleRoleSelect = (role: string) => {
    setCurrentRole(role);
    if (onRoleChange) onRoleChange(role);
  };

  const completedCount = DEFAULT_MILESTONES.filter((m) => m.status === "completed").length;
  const progressPercent = Math.round((completedCount / DEFAULT_MILESTONES.length) * 100);

  return (
    <div className="relative w-full bg-transparent p-0 transition-all duration-300">
      {/* Top Header Bar — naturally integrated on page without container box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 select-none">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8E1616] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8E1616]" />
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8E1616] dark:text-[#E8C999]">
            Interactive Career Journey
          </span>
        </div>

        {/* Role Selector & Progress Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-base-200/60 border border-stone-300 dark:border-white/15 rounded-full px-3.5 py-1.5 shadow-sm">
            <span className="text-[11px] font-mono font-bold text-stone-700 dark:text-stone-300">
              Progress:
            </span>
            <div className="w-16 bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#8E1616] h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-xs font-black text-[#8E1616] dark:text-[#E8C999]">
              {progressPercent}%
            </span>
          </div>

          <div className="dropdown dropdown-end">
            <label
              tabIndex={0}
              className="btn btn-xs sm:btn-sm bg-[#8E1616] hover:bg-[#701111] text-white border-none rounded-full font-bold text-xs capitalize gap-1.5 px-4 shadow-sm"
            >
              <span>Target:</span>
              <span className="underline font-black">{currentRole}</span>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-2xl bg-white dark:bg-[#1E1E1E] border border-stone-200 dark:border-white/15 rounded-2xl w-56 text-xs z-50 mt-1 font-semibold"
            >
              {rolesList.map((r) => (
                <li key={r}>
                  <button
                    onClick={() => handleRoleSelect(r)}
                    className={`py-2 rounded-xl text-start ${
                      r === currentRole
                        ? "bg-[#8E1616] text-white font-bold"
                        : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200"
                    }`}
                  >
                    {r === currentRole ? "✓ " : ""} {r}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Desktop & Tablet Winding Road Canvas (SVG Road + Character + Compact Pills) */}
      <div className="relative hidden md:block w-full h-[420px] lg:h-[460px] select-none">
        <svg
          viewBox="0 0 1000 460"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dark Charcoal Road Gradient */}
            <linearGradient id="srRoadGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22252A" />
              <stop offset="50%" stopColor="#2A2D34" />
              <stop offset="100%" stopColor="#1B1D22" />
            </linearGradient>

            {/* Glowing road curb line */}
            <linearGradient id="srRoadCurb" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8E1616" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#E8C999" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8E1616" stopOpacity="0.9" />
            </linearGradient>

            {/* Gold Pin Gradient */}
            <linearGradient id="srGoldPin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F5DCB7" />
              <stop offset="100%" stopColor="#C99B5B" />
            </linearGradient>

            {/* Crimson Pin Gradient */}
            <linearGradient id="srCrimsonPin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B32424" />
              <stop offset="100%" stopColor="#701111" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="srGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Road Outer Base Bed Shadow */}
          <path
            d="M 40 405 C 220 405, 260 315, 420 295 C 580 275, 630 185, 770 155 C 860 135, 890 85, 935 65"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="80"
            strokeLinecap="round"
            fill="none"
          />

          {/* Main Asphalt Road Body */}
          <path
            d="M 40 405 C 220 405, 260 315, 420 295 C 580 275, 630 185, 770 155 C 860 135, 890 85, 935 65"
            stroke="url(#srRoadGradient)"
            strokeWidth="68"
            strokeLinecap="round"
            fill="none"
          />

          {/* Road Curb Edge Borders */}
          <path
            d="M 40 405 C 220 405, 260 315, 420 295 C 580 275, 630 185, 770 155 C 860 135, 890 85, 935 65"
            stroke="url(#srRoadCurb)"
            strokeWidth="71"
            strokeLinecap="round"
            fill="none"
            opacity="0.45"
          />

          {/* Animated Center Dashed Lane Stripe */}
          <path
            d="M 40 405 C 220 405, 260 315, 420 295 C 580 275, 630 185, 770 155 C 860 135, 890 85, 935 65"
            stroke="#E8C999"
            strokeWidth="3.5"
            className="animate-road-dash"
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
          />

          {/* Milestone Connectors & Location Pins */}
          {DEFAULT_MILESTONES.map((m) => {
            const isHovered = activeHover === m.id;
            const isCompleted = m.status === "completed";
            const isCurrent = m.status === "current";

            return (
              <g
                key={m.id}
                className="cursor-pointer transition-all duration-300"
                onClick={() => setSelectedMilestone(m)}
                onMouseEnter={() => setActiveHover(m.id)}
                onMouseLeave={() => setActiveHover(null)}
              >
                {/* Glow ring */}
                {(isHovered || isCurrent) && (
                  <circle
                    cx={m.cx}
                    cy={m.cy}
                    r={isHovered ? 24 : 20}
                    fill={m.color === "crimson" ? "url(#srCrimsonPin)" : "url(#srGoldPin)"}
                    filter="url(#srGlow)"
                    opacity="0.65"
                  />
                )}

                {/* Outer Pin */}
                <circle
                  cx={m.cx}
                  cy={m.cy}
                  r={isHovered ? 15 : 13}
                  fill={isCompleted ? "#8E1616" : isCurrent ? "#C99B5B" : "#22252A"}
                  stroke={isCompleted ? "#FFFFFF" : "#E8C999"}
                  strokeWidth="2.5"
                />

                {/* Inner Dot */}
                <circle
                  cx={m.cx}
                  cy={m.cy}
                  r={isHovered ? 5 : 4}
                  fill={isCompleted ? "#FFFFFF" : isCurrent ? "#FAF3EA" : "#8E1616"}
                />

                {/* Vertical stem connector to floating pill */}
                <line
                  x1={m.cx}
                  y1={m.pillPosition === "top" ? m.cy - 14 : m.cy + 14}
                  x2={m.cx}
                  y2={m.pillPosition === "top" ? m.cy - 30 : m.cy + 30}
                  stroke="#8E1616"
                  strokeWidth="2.5"
                  strokeDasharray="2 2"
                  opacity="0.75"
                />
              </g>
            );
          })}
        </svg>

        {/* ─── Compact Milestone Pills / Chips (High Contrast in Light & Dark Mode) ─── */}
        {DEFAULT_MILESTONES.map((m) => {
          const isHovered = activeHover === m.id;
          const isCurrent = m.status === "current";
          const isCompleted = m.status === "completed";

          const leftPercent = (m.cx / 1000) * 100;
          const topPercent = m.pillPosition === "top" ? ((m.cy - 64) / 460) * 100 : ((m.cy + 32) / 460) * 100;

          return (
            <div
              key={m.id}
              onClick={() => setSelectedMilestone(m)}
              onMouseEnter={() => setActiveHover(m.id)}
              onMouseLeave={() => setActiveHover(null)}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: "translate(-50%, 0)",
              }}
              className={`absolute cursor-pointer transition-all duration-200 ${
                isHovered ? "scale-110 z-30" : "z-20"
              }`}
            >
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-md border transition-all ${
                  isCurrent
                    ? "bg-[#8E1616] text-white border-[#8E1616] ring-2 ring-[#8E1616]/40"
                    : isCompleted
                    ? "bg-white dark:bg-[#1E1E1E] text-stone-900 dark:text-stone-100 border-[#8E1616]/60 hover:border-[#8E1616]"
                    : "bg-white/95 dark:bg-[#1A1A1A]/95 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-[#8E1616]/50"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8E1616] dark:text-[#E8C999]" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                )}
                <span className="tracking-tight">{m.label}</span>
              </div>
            </div>
          );
        })}

        {/* ─── Destination Trophy (Top Right at End of Road) ─── */}
        <div
          onClick={() => setSelectedMilestone(DEFAULT_MILESTONES[5])}
          onMouseEnter={() => setActiveHover("goal")}
          onMouseLeave={() => setActiveHover(null)}
          className={`absolute right-[0%] top-[-8px] cursor-pointer transition-all duration-200 ${
            activeHover === "goal" ? "scale-110 z-30" : "z-20"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1E1E1E] border-2 border-[#E8C999] shadow-lg text-xs font-black text-stone-900 dark:text-stone-100">
            <div className="w-6 h-6 rounded-full bg-[#E8C999]/40 text-[#8E1616] dark:text-[#E8C999] flex items-center justify-center animate-trophy-glow">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <span>Career Goal</span>
          </div>
        </div>

        {/* ─── Illustrated Walking Traveler Figure on Road (Bold High Contrast Outline in Light & Dark) ─── */}
        <div
          className="absolute left-[70px] bottom-[20px] pointer-events-none animate-character-walk"
          style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" }}
        >
          <svg
            viewBox="0 0 100 130"
            className="w-16 h-20 sm:w-20 sm:h-24 overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head */}
            <circle cx="50" cy="22" r="11" fill="#F5CBA7" stroke="#111827" strokeWidth="2" />
            {/* Hair */}
            <path d="M 40 18 Q 50 10 60 18 Q 58 12 50 12 Z" fill="#111827" />
            {/* Jacket in Brand Crimson with bold outline */}
            <path
              d="M 36 34 L 64 34 L 67 72 L 33 72 Z"
              fill="#8E1616"
              stroke="#111827"
              strokeWidth="2"
            />
            {/* Backpack on Shoulder */}
            <rect
              x="25"
              y="38"
              width="12"
              height="26"
              rx="4"
              fill="#2B2D42"
              stroke="#111827"
              strokeWidth="2"
            />
            {/* Pants / Legs */}
            <path d="M 38 72 L 35 108 L 45 108 L 47 72 Z" fill="#1F2937" stroke="#111827" strokeWidth="2" />
            <path d="M 53 72 L 55 108 L 65 108 L 62 72 Z" fill="#1F2937" stroke="#111827" strokeWidth="2" />
            {/* Shoes */}
            <ellipse cx="40" cy="110" rx="7" ry="3.5" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
            <ellipse cx="60" cy="110" rx="7" ry="3.5" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
            {/* Pointing Arm Towards Next Milestone */}
            <path
              d="M 60 40 L 80 26 L 86 28"
              stroke="#8E1616"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 60 40 L 80 26 L 86 28"
              stroke="#111827"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="87" cy="28" r="3.5" fill="#F5CBA7" stroke="#111827" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* Mobile Vertical Road / Journey Flow (Lightweight, No Heavy Container) */}
      <div className="md:hidden space-y-2.5 pt-2 select-none">
        {DEFAULT_MILESTONES.map((m) => {
          const IconComponent = m.icon;
          const isCompleted = m.status === "completed";
          const isCurrent = m.status === "current";

          return (
            <div
              key={m.id}
              onClick={() => setSelectedMilestone(m)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isCurrent
                  ? "bg-[#8E1616] text-white border-[#8E1616] shadow-md"
                  : isCompleted
                  ? "bg-white dark:bg-[#1C1C1C] border-[#8E1616]/40 text-stone-900 dark:text-stone-100 shadow-sm"
                  : "bg-white/90 dark:bg-[#161616] border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isCurrent
                      ? "bg-white text-[#8E1616]"
                      : isCompleted
                      ? "bg-[#8E1616] text-white"
                      : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs block">
                    {m.label} · {m.title}
                  </span>
                </div>
              </div>
              <div>
                {isCompleted && (
                  <span className="text-[10px] text-[#8E1616] dark:text-[#E8C999] font-bold">
                    ✓ Done
                  </span>
                )}
                {isCurrent && (
                  <span className="badge badge-xs bg-white text-[#8E1616] font-bold">
                    Current
                  </span>
                )}
                {m.status === "locked" && (
                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Milestone Detail Popover Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1A1A1A] border-2 border-[#E8C999] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-start space-y-4 text-stone-900 dark:text-stone-100">
            <button
              onClick={() => setSelectedMilestone(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-stone-700 dark:text-stone-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#8E1616] text-white flex items-center justify-center shadow-md">
                <selectedMilestone.icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold text-[#8E1616] dark:text-[#E8C999] uppercase">
                  {selectedMilestone.badge}
                </span>
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  {selectedMilestone.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              {selectedMilestone.details.overview}
            </p>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-stone-500 dark:text-stone-400">
                Key Topics / Focus:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedMilestone.details.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="badge bg-[#8E1616]/10 text-[#8E1616] dark:text-[#E8C999] border-[#8E1616]/20 text-[10px] font-bold py-1.5 px-2 rounded-lg"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-stone-800 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-stone-700 dark:text-stone-300">Benchmark Status</span>
              <span className="font-mono font-black text-[#8E1616] dark:text-[#E8C999]">
                {selectedMilestone.details.benchmark}
              </span>
            </div>

            <div className="flex gap-2.5 pt-1">
              <Link
                href={selectedMilestone.route}
                className="btn flex-1 bg-[#8E1616] hover:bg-[#701111] text-white border-none rounded-xl font-bold text-xs h-10 shadow-md shadow-[#8E1616]/20"
                onClick={() => setSelectedMilestone(null)}
              >
                {selectedMilestone.actionText} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
              <button
                onClick={() => setSelectedMilestone(null)}
                className="btn btn-ghost border border-stone-300 dark:border-stone-700 rounded-xl text-xs h-10 px-4 text-stone-800 dark:text-stone-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
