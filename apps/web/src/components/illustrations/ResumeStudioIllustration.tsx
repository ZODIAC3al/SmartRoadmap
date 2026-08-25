"use client";

import React from "react";

interface ResumeStudioIllustrationProps {
  className?: string;
  atsScore?: number;
  roleTitle?: string;
}

export default function ResumeStudioIllustration({
  className = "",
  atsScore = 96,
  roleTitle = "Software Engineer",
}: ResumeStudioIllustrationProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background ambient glow */}
      <div className="absolute w-72 h-72 bg-gradient-to-tr from-[#8E1616]/15 via-amber-500/15 to-[#8E1616]/15 rounded-full blur-2xl animate-pulse" />

      {/* Main Resume Sheet Visual */}
      <div className="relative w-72 sm:w-80 bg-base-100 rounded-2xl border-2 border-base-300 shadow-2xl p-5 overflow-hidden text-start">
        {/* ATS Laser Scanner Line */}
        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8E1616] to-transparent shadow-[0_0_12px_#8E1616] animate-scan-beam pointer-events-none z-20" />

        {/* Header Simulation */}
        <div className="flex items-center gap-3 pb-3 border-b border-base-300">
          <div className="w-10 h-10 rounded-xl bg-[#8E1616]/15 text-[#8E1616] flex items-center justify-center font-bold text-lg">
            📄
          </div>
          <div>
            <div className="h-3 w-28 bg-base-300 dark:bg-stone-200 rounded-full mb-1" />
            <div className="text-[10px] font-mono font-bold text-[#8E1616]">
              {roleTitle}
            </div>
          </div>
          <div className="ml-auto px-2 py-0.5 rounded-xl bg-[#8E1616]/15 border border-[#8E1616]/30 text-[#701111] dark:text-[#B32424] font-mono text-[10px] font-black">
            ATS {atsScore}%
          </div>
        </div>

        {/* Body Lines & Badges */}
        <div className="space-y-3 pt-3">
          {/* Summary line */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-stone-300 dark:bg-stone-700 rounded-full" />
            <div className="h-2 w-4/5 bg-stone-300 dark:bg-stone-700 rounded-full" />
          </div>

          {/* Skill Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["React", "TypeScript", "NestJS", "Tailwind", "Docker"].map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full bg-[#8E1616]/10 text-[#8E1616] border border-[#8E1616]/25 text-[9px] font-bold"
              >
                ✓ {skill}
              </span>
            ))}
          </div>

          {/* Project Box Simulation */}
          <div className="p-2.5 rounded-xl bg-base-200 border border-base-300 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-base-content">Key Verified Project</span>
              <span className="text-[9px] font-mono text-[#701111] font-bold">100% Score</span>
            </div>
            <div className="h-1.5 w-full bg-stone-300 dark:bg-stone-700 rounded-full" />
            <div className="h-1.5 w-3/4 bg-stone-300 dark:bg-stone-700 rounded-full" />
          </div>
        </div>

        {/* Floating Verification Stamp */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-2xl bg-gradient-to-r from-[#8E1616] to-[#701111] text-white text-[9px] font-black shadow-md flex items-center gap-1 animate-pin-float">
          <span>★ Verified</span>
        </div>
      </div>
    </div>
  );
}
