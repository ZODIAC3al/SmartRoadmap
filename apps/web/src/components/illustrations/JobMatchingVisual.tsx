"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "interviewing"
  | "accepted"
  | "rejected";

export interface JobMatchingVisualProps {
  roleTitle?: string;
  companyName?: string;
  matchPercent?: number;
  status?: ApplicationStatus;
  className?: string;
}

export default function JobMatchingVisual({
  roleTitle = "Senior Frontend Engineer",
  companyName = "Stripe, Inc.",
  matchPercent = 98,
  status = "interviewing",
  className = "",
}: JobMatchingVisualProps) {
  const shouldReduceMotion = useReducedMotion();

  const stages = [
    { id: "applied", label: "Applied", icon: "📝" },
    { id: "under_review", label: "Screening", icon: "🔍" },
    { id: "interviewing", label: "Interview", icon: "🎙️" },
    { id: "accepted", label: "Offer", icon: "🎉" },
  ];

  const getStageIndex = (s: ApplicationStatus) => {
    switch (s) {
      case "applied":
        return 0;
      case "under_review":
        return 1;
      case "interviewing":
        return 2;
      case "accepted":
        return 3;
      default:
        return 1;
    }
  };

  const activeIndex = getStageIndex(status);

  return (
    <div
      className={`bg-base-100 dark:bg-base-300 border border-base-300 dark:border-base-300 rounded-3xl p-6 shadow-xl space-y-5 select-none max-w-md w-full ${className}`}
    >
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8E1616] to-[#B32424] text-white flex items-center justify-center font-black text-lg shadow-md">
            {companyName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-base-content leading-tight">
              {roleTitle}
            </h4>
            <p className="text-xs text-base-content/70 dark:text-stone-300 font-medium">
              {companyName}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="badge bg-[#8E1616]/10 text-[#8E1616] dark:text-[#E8C999] border border-[#8E1616]/20 font-mono font-bold text-xs py-2 px-2.5">
            ⚡ {matchPercent}% Match
          </span>
        </div>
      </div>

      {/* Visual Pipeline Stepper */}
      <div className="pt-2">
        <div className="grid grid-cols-4 gap-2 relative">
          {/* Connecting line */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-base-300 dark:bg-base-300 -z-0" />
          <div
            className="absolute top-4 left-4 h-1 bg-[#8E1616] transition-all duration-500 -z-0"
            style={{ width: `${(activeIndex / (stages.length - 1)) * 85}%` }}
          />

          {stages.map((stg, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={stg.id} className="flex flex-col items-center text-center space-y-1.5 relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                    isCurrent
                      ? "bg-[#8E1616] text-white ring-4 ring-[#8E1616]/20"
                      : isCompleted
                      ? "bg-[#701111] text-white"
                      : "bg-base-200 dark:bg-base-300 text-base-content/70"
                  }`}
                >
                  {isCompleted ? "✓" : stg.icon}
                </div>
                <span
                  className={`text-[9px] font-mono font-bold uppercase ${
                    isCurrent
                      ? "text-[#8E1616] dark:text-[#E8C999]"
                      : isCompleted
                      ? "text-base-content dark:text-stone-200"
                      : "text-base-content/70"
                  }`}
                >
                  {stg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status description banner */}
      <div className="bg-base-200/70 dark:bg-base-300/60 p-3 rounded-2xl border border-base-300 dark:border-base-300 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8E1616] animate-pulse" />
          <span className="font-semibold text-base-content dark:text-stone-200">
            {status === "interviewing"
              ? "Technical Interview Scheduled"
              : status === "accepted"
              ? "Official Offer Extended"
              : "Application In Review"}
          </span>
        </div>
        <span className="text-[10px] font-mono text-base-content/70 dark:text-stone-400 font-bold">
          Verified Match ✓
        </span>
      </div>
    </div>
  );
}
