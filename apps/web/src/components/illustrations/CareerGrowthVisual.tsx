"use client";

import React from "react";

interface CareerGrowthVisualProps {
  className?: string;
  currentRole?: string;
  targetRole?: string;
  level?: string;
  progress?: number;
}

export default function CareerGrowthVisual({
  className = "",
  currentRole = "Junior Engineer",
  targetRole = "Senior Architect",
  level = "Level 3: Specialist",
  progress = 68,
}: CareerGrowthVisualProps) {
  const steps = [
    { title: "Foundation", status: "completed", icon: "🌱" },
    { title: "Core Skills", status: "completed", icon: "⚡" },
    { title: "Architecture", status: "current", icon: "🏛️" },
    { title: "Mastery", status: "upcoming", icon: "👑" },
  ];

  return (
    <div className={`relative bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start select-none ${className}`}>
      {/* Header Info */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#8E1616] uppercase tracking-wider block">
            Career Progression Journey
          </span>
          <h3 className="text-base font-black text-base-content mt-0.5">
            {currentRole} → <span className="text-[#8E1616]">{targetRole}</span>
          </h3>
        </div>
        <div className="px-3 py-1 rounded-full bg-[#8E1616]/10 border border-[#8E1616]/20 text-[#8E1616] text-xs font-black">
          {level}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-6">
        <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
          <span>Overall Competency Mastery</span>
          <span className="text-[#8E1616] font-mono font-extrabold">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-base-300 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#8E1616] via-[#B32424] to-[#E8C999] rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Career Milestones Grid */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border text-center transition-all ${
              step.status === "completed"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : step.status === "current"
                ? "bg-[#8E1616]/10 border-[#8E1616] text-[#8E1616] shadow-sm animate-pulse"
                : "bg-base-100 border-base-300 text-stone-600 dark:text-stone-400 opacity-60"
            }`}
          >
            <div className="text-xl mb-1">{step.icon}</div>
            <div className="text-[11px] font-black leading-tight text-base-content">{step.title}</div>
            <div className="text-[9px] font-mono uppercase font-bold mt-1 text-stone-600 dark:text-stone-400">
              {step.status === "completed" ? "Verified" : step.status === "current" ? "In Progress" : "Locked"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
