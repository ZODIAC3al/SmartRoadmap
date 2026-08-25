"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface AchievementCelebrationVisualProps {
  title?: string;
  badgeName?: string;
  tier?: "bronze" | "silver" | "gold" | "diamond";
  xpEarned?: number;
  className?: string;
}

export default function AchievementCelebrationVisual({
  title = "Milestone Mastered!",
  badgeName = "Full-Stack Architect Certified",
  tier = "gold",
  xpEarned = 250,
  className = "",
}: AchievementCelebrationVisualProps) {
  const shouldReduceMotion = useReducedMotion();

  const tierColors = {
    bronze: { bg: "from-amber-700/20 to-amber-900/10", border: "border-amber-700/40", text: "text-amber-700 dark:text-amber-400", badge: "🥉 Bronze" },
    silver: { bg: "from-slate-400/20 to-slate-600/10", border: "border-slate-400/40", text: "text-base-content/70 dark:text-slate-300", badge: "🥈 Silver" },
    gold: { bg: "from-amber-400/20 to-yellow-600/10", border: "border-yellow-500/40", text: "text-amber-600 dark:text-amber-300", badge: "🥇 Gold" },
    diamond: { bg: "from-cyan-400/20 to-blue-600/10", border: "border-cyan-400/40", text: "text-cyan-600 dark:text-cyan-300", badge: "💎 Diamond" },
  }[tier];

  return (
    <div
      className={`bg-base-100 dark:bg-base-300 border border-base-300 dark:border-base-300 rounded-3xl p-6 sm:p-8 shadow-xl text-center flex flex-col items-center justify-center relative overflow-hidden select-none max-w-sm w-full ${className}`}
    >
      {/* Background celebration glow */}
      <div className={`absolute inset-0 bg-gradient-to-b ${tierColors.bg} opacity-50 pointer-events-none`} />

      {/* Floating trophy / badge with burst animation */}
      <div className="relative mb-4">
        <motion.div
          animate={shouldReduceMotion ? {} : { scale: [1, 1.06, 1], y: [-3, 3, -3] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#8E1616]/20 via-[#E8C999]/30 to-[#8E1616]/10 border-2 border-[#8E1616]/30 flex items-center justify-center text-4xl shadow-lg relative"
        >
          <span>🏆</span>
          <span className="absolute -top-2 -right-2 text-base">✨</span>
          <span className="absolute -bottom-1 -left-2 text-sm">⭐</span>
        </motion.div>
      </div>

      <div className="space-y-1 relative z-10">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${tierColors.text} bg-base-200 border ${tierColors.border}`}>
          {tierColors.badge} Tier
        </span>
        <h4 className="font-black text-base sm:text-lg text-base-content tracking-tight mt-1">
          {title}
        </h4>
        <p className="text-xs text-base-content/70 dark:text-stone-300 font-medium">
          {badgeName}
        </p>
      </div>

      {/* XP Points earned pill */}
      <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#8E1616]/10 text-[#8E1616] dark:text-[#E8C999] border border-[#8E1616]/25 font-mono text-xs font-bold shadow-sm relative z-10">
        <span>⚡ +{xpEarned} Skill XP Credited</span>
      </div>
    </div>
  );
}
