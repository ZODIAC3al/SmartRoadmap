"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export type EmptyStateType =
  | "no-roadmaps"
  | "no-cvs"
  | "no-projects"
  | "no-achievements"
  | "no-discussions"
  | "no-applications"
  | "no-notifications"
  | "no-search-results";

export interface EmptyStateIllustrationProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyStateIllustration({
  type,
  title,
  description,
  actionText,
  onAction,
  className = "",
}: EmptyStateIllustrationProps) {
  const shouldReduceMotion = useReducedMotion();

  const defaultMeta: Record<
    EmptyStateType,
    { title: string; desc: string; icon: string }
  > = {
    "no-roadmaps": {
      title: "No Learning Roadmaps Yet",
      desc: "Embark on an adaptive tech track calibrated by AI to match your exact career destination.",
      icon: "🗺️",
    },
    "no-cvs": {
      title: "No Resumes Created Yet",
      desc: "Assemble your roadmap milestones, GitHub repositories, and verified skills into an ATS-ready CV in seconds.",
      icon: "📄",
    },
    "no-projects": {
      title: "No Key Projects Added",
      desc: "Import your repositories directly from GitHub or build custom portfolio project cards with verified code audits.",
      icon: "💻",
    },
    "no-achievements": {
      title: "No Badges or Certifications Unlocked",
      desc: "Complete module checkpoints, maintain daily learning streaks, and pass anti-cheat exams to earn verifiable credentials.",
      icon: "🏆",
    },
    "no-discussions": {
      title: "No Discussions Started Here",
      desc: "Be the first to spark a conversation, share field notes, or ask for code review in this community space.",
      icon: "💬",
    },
    "no-applications": {
      title: "No Active Job Matches Found",
      desc: "As you complete roadmap topics and verify skills, our semantic matching engine will queue compatible role openings.",
      icon: "💼",
    },
    "no-notifications": {
      title: "All Caught Up!",
      desc: "You have no unread notifications or assignment deadlines at this moment.",
      icon: "🔔",
    },
    "no-search-results": {
      title: "No Matching Records Found",
      desc: "Try adjusting your search terms, role filters, or clearing active query parameters.",
      icon: "🔍",
    },
  };

  const currentMeta = {
    title: title || defaultMeta[type]?.title,
    desc: description || defaultMeta[type]?.desc,
    icon: defaultMeta[type]?.icon,
  };

  return (
    <div
      className={`bg-base-100 dark:bg-base-200/60 border-2 border-dashed border-base-300 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 shadow-sm select-none ${className}`}
    >
      {/* SVG Illustration Container */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#8E1616]/10 to-[#E8C999]/20 border border-[#8E1616]/20 flex items-center justify-center text-4xl shadow-inner relative group">
          <motion.span
            animate={shouldReduceMotion ? {} : { scale: [1, 1.08, 1], y: [-2, 2, -2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {currentMeta.icon}
          </motion.span>

          {/* Floating particle sparkles */}
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#8E1616] animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#F59E0B]" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h4 className="font-extrabold text-base sm:text-lg text-base-content tracking-tight">
          {currentMeta.title}
        </h4>
        <p className="text-xs text-stone-700 dark:text-stone-300 font-medium leading-relaxed">
          {currentMeta.desc}
        </p>
      </div>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn bg-[#8E1616] hover:bg-[#701111] text-white btn-sm rounded-xl font-bold border-none shadow px-6 mt-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
