"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface SkillGapScannerVisualProps {
  isScanning?: boolean;
  targetRole?: string;
  matchScore?: number;
  verifiedCount?: number;
  missingCount?: number;
  className?: string;
}

export default function SkillGapScannerVisual({
  isScanning = false,
  targetRole = "Full Stack Engineer",
  matchScore = 84,
  verifiedCount = 9,
  missingCount = 3,
  className = "",
}: SkillGapScannerVisualProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`bg-base-100 dark:bg-base-300 border border-base-300 dark:border-base-300 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden select-none max-w-md w-full ${className}`}
    >
      {/* Scanning light ray if isScanning */}
      {isScanning && (
        <motion.div
          animate={{ y: ["-100%", "200%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#8E1616]/20 to-transparent pointer-events-none z-10"
        />
      )}

      {/* Top Header info */}
      <div className="flex justify-between items-start border-b border-base-200 dark:border-base-300 pb-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-[#8E1616]/10 text-[#8E1616] dark:text-[#E8C999] border border-[#8E1616]/20">
            <span className={`w-1.5 h-1.5 rounded-full bg-[#8E1616] ${isScanning ? "animate-ping" : ""}`} />
            {isScanning ? "AI Calibrating Pipeline..." : "Diagnostic Verified"}
          </div>
          <h4 className="font-extrabold text-sm sm:text-base text-base-content mt-1">
            {targetRole}
          </h4>
        </div>

        <div className="text-right">
          <span className="text-[9px] uppercase font-mono font-bold text-base-content/70 dark:text-stone-400 block">
            Role Readiness
          </span>
          <span className="text-2xl font-black font-mono text-[#8E1616] dark:text-[#E8C999]">
            {matchScore}%
          </span>
        </div>
      </div>

      {/* Interactive Telemetry Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-2xl bg-[#8E1616]/10 border border-[#8E1616]/20 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#8E1616]/20 text-[#701111] dark:text-[#B32424] flex items-center justify-center font-bold text-sm">
            ✓
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono font-bold text-[#500A0A] dark:text-[#B32424] block">
              Verified Skills
            </span>
            <span className="text-sm font-extrabold text-base-content dark:text-stone-100">
              {verifiedCount} Skills
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
            ⚡
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono font-bold text-amber-700 dark:text-amber-400 block">
              Skill Gaps
            </span>
            <span className="text-sm font-extrabold text-base-content dark:text-stone-100">
              {missingCount} to Bridge
            </span>
          </div>
        </div>
      </div>

      {/* Animated Radar Pulse Visual Asset */}
      <div className="relative h-28 bg-base-200/50 dark:bg-base-300/40 rounded-2xl border border-base-300 dark:border-base-300 flex items-center justify-center overflow-hidden">
        {/* Concentric Radar Rings */}
        <div className="absolute w-24 h-24 rounded-full border border-[#8E1616]/20" />
        <div className="absolute w-44 h-44 rounded-full border border-[#8E1616]/10" />
        <div className="absolute w-64 h-64 rounded-full border border-[#8E1616]/5" />

        {/* Sweeping radar hand */}
        <motion.div
          animate={shouldReduceMotion ? {} : { rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute w-28 h-28 origin-center rounded-full bg-gradient-to-tr from-transparent via-[#8E1616]/15 to-transparent pointer-events-none"
        />

        {/* Core AI Figure Icon */}
        <div className="relative z-10 w-10 h-10 rounded-2xl bg-[#8E1616] text-white flex items-center justify-center font-bold shadow-lg shadow-[#8E1616]/30">
          <span>🎯</span>
        </div>
      </div>
    </div>
  );
}
