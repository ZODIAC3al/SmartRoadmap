"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export type FigurePersona =
  | "developer-coding"
  | "learner-studying"
  | "career-climber"
  | "ai-mentor"
  | "recruiter-interviewing"
  | "celebrating-achiever"
  | "job-seeker";

export interface AnimatedFigureProps {
  persona?: FigurePersona;
  size?: "sm" | "md" | "lg" | "xl";
  speechText?: string;
  badgeText?: string;
  className?: string;
  interactive?: boolean;
}

export default function AnimatedFigure({
  persona = "developer-coding",
  size = "md",
  speechText,
  badgeText,
  className = "",
  interactive = true,
}: AnimatedFigureProps) {
  const shouldReduceMotion = useReducedMotion();

  const sizeDimensions = {
    sm: { width: 120, height: 120, viewBox: "0 0 160 160" },
    md: { width: 180, height: 180, viewBox: "0 0 200 200" },
    lg: { width: 260, height: 260, viewBox: "0 0 260 260" },
    xl: { width: 340, height: 340, viewBox: "0 0 320 320" },
  }[size];

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Optional Speech Bubble */}
      {speechText && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-2 max-w-[200px] text-center bg-base-100 dark:bg-base-300 border border-[#8E1616]/30 dark:border-[#E8C999]/40 text-base-content dark:text-stone-100 text-[11px] font-bold py-1.5 px-3 rounded-2xl shadow-lg relative"
        >
          <span>{speechText}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-base-100 dark:bg-base-300 border-r border-b border-[#8E1616]/30 dark:border-[#E8C999]/40 rotate-45" />
        </motion.div>
      )}

      {/* SVG Character Rendering based on Persona */}
      <div className="relative group">
        {/* Glow halo background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#8E1616]/20 via-[#E8C999]/15 to-transparent rounded-full blur-xl -z-10 group-hover:scale-110 transition-transform duration-500" />

        <svg
          width={sizeDimensions.width}
          height={sizeDimensions.height}
          viewBox={sizeDimensions.viewBox}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`overflow-visible ${interactive ? "transition-transform hover:scale-105 duration-300" : ""}`}
        >
          {/* Persona: DEVELOPER CODING */}
          {persona === "developer-coding" && (
            <g className="developer-figure">
              {/* Desk & Laptop */}
              <ellipse cx="100" cy="175" rx="80" ry="12" fill="#8E1616" fillOpacity="0.12" />
              <rect x="50" y="145" width="100" height="8" rx="4" fill="#374151" className="dark:fill-stone-700" />
              <rect x="70" y="125" width="60" height="22" rx="3" fill="#1F2937" stroke="#8E1616" strokeWidth="2" />
              <rect x="74" y="128" width="52" height="15" rx="2" fill="#0F172A" />
              {/* Code lines on laptop screen */}
              <line x1="78" y1="133" x2="95" y2="133" stroke="#E8C999" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="78" y1="137" x2="115" y2="137" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="82" y1="140" x2="105" y2="140" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" />

              {/* Developer Body */}
              <path d="M70 145 C70 100 130 100 130 145 Z" fill="#8E1616" />
              <path d="M85 108 L100 120 L115 108 Z" fill="#FDE047" fillOpacity="0.2" />

              {/* Head & Hair */}
              <circle cx="100" cy="80" r="22" fill="#FBBF24" />
              <path d="M78 80 C78 55 122 55 122 80 C122 68 114 62 100 62 C86 62 78 68 78 80 Z" fill="#1F2937" />

              {/* Headphones */}
              <path d="M76 80 C76 60 124 60 124 80" stroke="#8E1616" strokeWidth="4" strokeLinecap="round" fill="none" />
              <rect x="72" y="74" width="8" height="14" rx="4" fill="#B32424" />
              <rect x="120" y="74" width="8" height="14" rx="4" fill="#B32424" />

              {/* Face Details */}
              <circle cx="93" cy="80" r="2.5" fill="#1F2937" />
              <circle cx="107" cy="80" r="2.5" fill="#1F2937" />
              <path d="M96 87 Q100 90 104 87" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* Floating Code Icons */}
              <motion.g
                animate={shouldReduceMotion ? {} : { y: [-3, 3, -3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <circle cx="45" cy="85" r="14" fill="#8E1616" fillOpacity="0.15" stroke="#8E1616" strokeWidth="1.5" />
                <text x="45" y="89" textAnchor="middle" fill="#8E1616" fontSize="11" fontWeight="bold" fontFamily="monospace">&lt;/&gt;</text>
              </motion.g>

              <motion.g
                animate={shouldReduceMotion ? {} : { y: [3, -3, 3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <circle cx="155" cy="75" r="14" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="1.5" />
                <text x="155" y="79" textAnchor="middle" fill="#D97706" fontSize="11" fontWeight="bold">⚡</text>
              </motion.g>
            </g>
          )}

          {/* Persona: LEARNER STUDYING */}
          {persona === "learner-studying" && (
            <g className="learner-figure">
              {/* Desk & Open Book */}
              <ellipse cx="100" cy="175" rx="80" ry="12" fill="#8E1616" fillOpacity="0.12" />
              <rect x="55" y="148" width="90" height="6" rx="3" fill="#475569" />
              {/* Open Book */}
              <path d="M75 145 C88 140 98 142 100 148 C102 142 112 140 125 145 L122 135 C110 130 102 132 100 138 C98 132 90 130 78 135 Z" fill="#F8FAFC" stroke="#8E1616" strokeWidth="1.5" />

              {/* Body in Hoodie */}
              <path d="M72 145 C72 105 128 105 128 145 Z" fill="#0284C7" />
              <path d="M85 105 L100 122 L115 105 Z" fill="#E0F2FE" />

              {/* Head with Glasses */}
              <circle cx="100" cy="78" r="22" fill="#FCD34D" />
              {/* Hair */}
              <path d="M80 72 C80 50 120 50 120 72 C120 60 110 54 100 54 C90 54 80 60 80 72 Z" fill="#78350F" />
              {/* Glasses */}
              <circle cx="92" cy="78" r="6" stroke="#1E293B" strokeWidth="2" fill="none" />
              <circle cx="108" cy="78" r="6" stroke="#1E293B" strokeWidth="2" fill="none" />
              <line x1="98" y1="78" x2="102" y2="78" stroke="#1E293B" strokeWidth="2" />
              {/* Smile */}
              <path d="M96 86 Q100 90 104 86" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* Floating Lightbulb / Knowledge */}
              <motion.g
                animate={shouldReduceMotion ? {} : { y: [-4, 4, -4], scale: [1, 1.05, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <circle cx="100" cy="35" r="12" fill="#FEF08A" stroke="#EAB308" strokeWidth="2" />
                <text x="100" y="39" textAnchor="middle" fontSize="12">💡</text>
              </motion.g>
            </g>
          )}

          {/* Persona: CAREER CLIMBER */}
          {persona === "career-climber" && (
            <g className="climber-figure">
              {/* Progression Stairs */}
              <rect x="30" y="150" width="35" height="30" rx="3" fill="#8E1616" fillOpacity="0.2" stroke="#8E1616" strokeWidth="1.5" />
              <rect x="65" y="125" width="35" height="55" rx="3" fill="#8E1616" fillOpacity="0.4" stroke="#8E1616" strokeWidth="1.5" />
              <rect x="100" y="100" width="35" height="80" rx="3" fill="#8E1616" fillOpacity="0.6" stroke="#8E1616" strokeWidth="1.5" />
              <rect x="135" y="75" width="35" height="105" rx="3" fill="#8E1616" stroke="#8E1616" strokeWidth="1.5" />

              {/* Climber Figure on Top Tier */}
              <path d="M120 75 L135 48 L150 75 Z" fill="#1E293B" />
              <circle cx="135" cy="36" r="12" fill="#FCD34D" />
              <circle cx="132" cy="35" r="1.5" fill="#1E293B" />
              <circle cx="138" cy="35" r="1.5" fill="#1E293B" />
              <path d="M133 40 Q135 42 137 40" stroke="#1E293B" strokeWidth="1" fill="none" />

              {/* Raised arm pointing to flag */}
              <line x1="140" y1="52" x2="155" y2="35" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />

              {/* Victory Flag */}
              <line x1="160" y1="20" x2="160" y2="75" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M160 20 L185 30 L160 40 Z" fill="#F59E0B" />
              <text x="170" y="33" fontSize="8" fontWeight="black" fill="#FFFFFF">GOAL</text>

              {/* XP Stars */}
              <motion.g
                animate={shouldReduceMotion ? {} : { rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <circle cx="50" cy="50" r="10" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1" />
                <text x="50" y="54" textAnchor="middle" fontSize="10">⭐</text>
              </motion.g>
            </g>
          )}

          {/* Persona: CELEBRATING ACHIEVER */}
          {persona === "celebrating-achiever" && (
            <g className="achiever-figure">
              {/* Confetti & Trophy */}
              <circle cx="100" cy="100" r="60" fill="#8E1616" fillOpacity="0.08" />
              {/* Golden Trophy */}
              <path d="M80 135 L120 135 L112 155 L125 155 L125 162 L75 162 L75 155 L88 155 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
              <path d="M75 90 C75 125 125 125 125 90 L125 80 L75 80 Z" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />
              {/* Trophy handles */}
              <path d="M75 85 C62 85 62 105 75 105" stroke="#D97706" strokeWidth="3" fill="none" />
              <path d="M125 85 C138 85 138 105 125 105" stroke="#D97706" strokeWidth="3" fill="none" />
              {/* Star on Trophy */}
              <polygon points="100,88 103,96 111,96 105,101 107,109 100,104 93,109 95,101 89,96 97,96" fill="#D97706" />

              {/* Character Peeking behind Trophy */}
              <circle cx="100" cy="55" r="18" fill="#FBBF24" />
              <path d="M85 50 C85 32 115 32 115 50 C115 40 108 36 100 36 C92 36 85 40 85 50 Z" fill="#1E293B" />
              {/* Cheerful Eyes */}
              <path d="M93 54 Q96 50 99 54" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M101 54 Q104 50 107 54" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M96 61 Q100 65 104 61" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />

              {/* Floating Medals */}
              <motion.g
                animate={shouldReduceMotion ? {} : { y: [-4, 4, -4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <circle cx="45" cy="50" r="12" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
                <text x="45" y="54" textAnchor="middle" fontSize="12">🏆</text>
              </motion.g>
              <motion.g
                animate={shouldReduceMotion ? {} : { y: [4, -4, 4] }}
                transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
              >
                <circle cx="155" cy="55" r="12" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5" />
                <text x="155" y="59" textAnchor="middle" fontSize="12">🎖️</text>
              </motion.g>
            </g>
          )}

          {/* Persona: RECRUITER / JOB SEEKER */}
          {(persona === "recruiter-interviewing" || persona === "job-seeker") && (
            <g className="recruiter-figure">
              {/* Meeting Desk */}
              <ellipse cx="100" cy="175" rx="75" ry="12" fill="#8E1616" fillOpacity="0.1" />
              <rect x="50" y="148" width="100" height="6" rx="3" fill="#64748B" />

              {/* Two Avatars in Conversation */}
              {/* Left Person (Recruiter) */}
              <path d="M55 148 C55 118 90 118 90 148 Z" fill="#8E1616" />
              <circle cx="72" cy="98" r="14" fill="#FCD34D" />
              <circle cx="68" cy="97" r="1.5" fill="#1E293B" />
              <circle cx="74" cy="97" r="1.5" fill="#1E293B" />
              <path d="M68 104 Q71 106 74 104" stroke="#1E293B" strokeWidth="1" fill="none" />

              {/* Right Person (Candidate) */}
              <path d="M110 148 C110 118 145 118 145 148 Z" fill="#0D9488" />
              <circle cx="128" cy="98" r="14" fill="#FCD34D" />
              <circle cx="124" cy="97" r="1.5" fill="#1E293B" />
              <circle cx="130" cy="97" r="1.5" fill="#1E293B" />
              <path d="M124 104 Q127 106 130 104" stroke="#1E293B" strokeWidth="1" fill="none" />

              {/* Center Match Score Badge */}
              <motion.g
                animate={shouldReduceMotion ? {} : { scale: [0.98, 1.04, 0.98] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <rect x="82" y="60" width="36" height="22" rx="6" fill="#8E1616" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="100" y="75" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="black" fontFamily="monospace">98%</text>
              </motion.g>

              {/* Handshake Graphic */}
              <text x="100" y="140" textAnchor="middle" fontSize="14">🤝</text>
            </g>
          )}
        </svg>
      </div>

      {/* Optional Status / Badge pill */}
      {badgeText && (
        <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#8E1616]/10 text-[#8E1616] dark:text-[#E8C999] border border-[#8E1616]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8E1616] animate-pulse" />
          {badgeText}
        </span>
      )}
    </div>
  );
}
