"use client";

import React from "react";

interface AiAssistantFigureProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  speechText?: string;
  statusText?: string;
  isThinking?: boolean;
}

export default function AiAssistantFigure({
  size = "md",
  className = "",
  speechText = "Ready to build your career path!",
  statusText = "AI Engine Active",
  isThinking = false,
}: AiAssistantFigureProps) {
  const sizeMap = {
    sm: "w-24 h-24",
    md: "w-36 h-36",
    lg: "w-48 h-48",
    xl: "w-64 h-64",
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble */}
      {speechText && (
        <div className="mb-3 px-3.5 py-1.5 rounded-2xl bg-base-100/95 backdrop-blur-md border border-[#8E1616]/30 shadow-lg text-xs font-bold text-base-content flex items-center gap-2 animate-bounce-subtle">
          <span className="w-2 h-2 rounded-full bg-[#8E1616] animate-ping" />
          <span>{speechText}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-base-100 border-r border-b border-[#8E1616]/30 transform rotate-45" />
        </div>
      )}

      {/* SVG Animated Figure */}
      <div className={`relative ${sizeMap[size]}`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#8E1616]/20 via-[#E8C999]/30 to-amber-500/20 rounded-full blur-xl animate-pulse" />

        <svg
          viewBox="0 0 200 200"
          className="w-full h-full relative z-10 filter drop-shadow-md animate-pin-float"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Ring / Halo */}
          <circle
            cx="100"
            cy="100"
            r="86"
            stroke="url(#haloGradient)"
            strokeWidth="3"
            strokeDasharray="8 6"
            className="animate-spin-slow origin-center opacity-75"
          />

          {/* Robot Body / Chassis */}
          <rect
            x="60"
            y="110"
            width="80"
            height="65"
            rx="24"
            fill="url(#bodyGradient)"
            stroke="#8E1616"
            strokeWidth="3"
          />

          {/* Chest Core Power Reactor */}
          <circle cx="100" cy="142" r="14" fill="#8E1616" className={isThinking ? "animate-ping" : "animate-pulse"} />
          <circle cx="100" cy="142" r="8" fill="#E8C999" />
          <circle cx="100" cy="142" r="4" fill="#FFFFFF" />

          {/* Arms */}
          <rect x="36" y="122" width="18" height="36" rx="9" fill="url(#limbGradient)" stroke="#8E1616" strokeWidth="2.5" className="animate-character-walk origin-top" />
          <rect x="146" y="122" width="18" height="36" rx="9" fill="url(#limbGradient)" stroke="#8E1616" strokeWidth="2.5" className="animate-character-walk origin-top" />

          {/* Robot Head */}
          <rect
            x="50"
            y="42"
            width="100"
            height="70"
            rx="30"
            fill="url(#headGradient)"
            stroke="#8E1616"
            strokeWidth="3.5"
          />

          {/* Antenna */}
          <line x1="100" y1="42" x2="100" y2="24" stroke="#8E1616" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="20" r="7" fill="#8E1616" className="animate-ping" />
          <circle cx="100" cy="20" r="5" fill="#E8C999" />

          {/* Visor Screen */}
          <rect
            x="64"
            y="56"
            width="72"
            height="42"
            rx="16"
            fill="#121212"
            stroke="#2E2822"
            strokeWidth="2"
          />

          {/* Expressive Visor Eyes */}
          <ellipse cx="84" cy="77" rx="8" ry="9" fill="#E8C999" className="animate-pulse" />
          <circle cx="86" cy="75" r="3" fill="#FFFFFF" />
          <ellipse cx="116" cy="77" rx="8" ry="9" fill="#E8C999" className="animate-pulse" />
          <circle cx="118" cy="75" r="3" fill="#FFFFFF" />

          {/* Friendly Rosy Cheeks */}
          <circle cx="74" cy="88" r="4" fill="#8E1616" opacity="0.6" />
          <circle cx="126" cy="88" r="4" fill="#8E1616" opacity="0.6" />

          {/* Gradients */}
          <defs>
            <linearGradient id="bodyGradient" x1="60" y1="110" x2="140" y2="175" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FAF3EA" />
              <stop offset="1" stopColor="#E8C999" />
            </linearGradient>
            <linearGradient id="headGradient" x1="50" y1="42" x2="150" y2="112" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#FAF3EA" />
            </linearGradient>
            <linearGradient id="limbGradient" x1="36" y1="122" x2="54" y2="158" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FAF3EA" />
              <stop offset="1" stopColor="#D6B480" />
            </linearGradient>
            <linearGradient id="haloGradient" x1="14" y1="14" x2="186" y2="186" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8E1616" />
              <stop offset="0.5" stopColor="#E8C999" />
              <stop offset="1" stopColor="#8E1616" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Status Pill */}
      {statusText && (
        <div className="mt-2.5 px-3 py-1 rounded-full bg-base-200 border border-base-300 text-[10px] font-mono font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {statusText}
        </div>
      )}
    </div>
  );
}
