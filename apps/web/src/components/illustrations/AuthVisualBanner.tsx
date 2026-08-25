"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface AuthVisualBannerProps {
  mode?: "login" | "register" | "forgot";
  className?: string;
}

export default function AuthVisualBanner({
  mode = "login",
  className = "",
}: AuthVisualBannerProps) {
  const shouldReduceMotion = useReducedMotion();

  const title =
    mode === "register"
      ? "Launch Your Adaptive Career Journey"
      : mode === "forgot"
      ? "Recover Access to Your Career Graph"
      : "Welcome Back to Devotopia";

  const desc =
    mode === "register"
      ? "Join thousands of developers mastering targeted milestones, passing verified code assessments, and landing top-tier tech roles."
      : "Continue your personalized learning path, calibrate missing skills, and unlock real-time hiring readiness.";

  return (
    <div
      className={`relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#8E1616] via-[#B32424] to-[#3B0707] text-white p-8 sm:p-12 flex flex-col justify-between shadow-2xl min-h-[480px] select-none ${className}`}
    >
      {/* Decorative background grid and glowing orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#E8C999]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Pill */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-base-100/10 backdrop-blur-md border border-white/20 text-[#E8C999] font-mono text-[10px] font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#E8C999] animate-pulse" />
          Devotopia Ecosystem
        </div>
      </div>

      {/* Center Animated Character & Roadmap Graph Asset */}
      <div className="relative z-10 my-8 flex items-center justify-center">
        <div className="relative">
          {/* Central AI / Career Node */}
          <motion.div
            animate={shouldReduceMotion ? {} : { scale: [1, 1.05, 1], y: [-4, 4, -4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 rounded-3xl bg-base-100/10 backdrop-blur-xl border-2 border-white/30 flex flex-col items-center justify-center shadow-2xl relative"
          >
            <span className="text-4xl">🚀</span>
            <span className="text-[10px] font-mono font-bold mt-1 text-[#E8C999]">
              {mode === "register" ? "NEXT-GEN DEV" : "SKILL IN-SYNC"}
            </span>
          </motion.div>

          {/* Orbiting Milestone Badges */}
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [-3, 3, -3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 -left-8 px-3 py-1.5 rounded-xl bg-base-100/15 backdrop-blur-md border border-white/20 text-[10px] font-bold shadow-lg flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>Adaptive AI Roadmap</span>
          </motion.div>

          <motion.div
            animate={shouldReduceMotion ? {} : { y: [3, -3, 3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute -bottom-4 -right-8 px-3 py-1.5 rounded-xl bg-base-100/15 backdrop-blur-md border border-white/20 text-[10px] font-bold shadow-lg flex items-center gap-1.5"
          >
            <span>🏆</span>
            <span>Verified ATS Credentials</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom Text Description */}
      <div className="relative z-10 space-y-2">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-md">
          {desc}
        </p>
      </div>
    </div>
  );
}
