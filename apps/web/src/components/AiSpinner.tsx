"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export type AiSpinnerVariant = "inline" | "overlay" | "fullscreen";

interface AiSpinnerProps {
  /** Visual variant:
   *  - `inline`     -- tiny spinner + label, used inside buttons
   *  - `overlay`    -- semi-transparent card overlay (position the parent relative)
   *  - `fullscreen` -- full-page blocking overlay during roadmap generation
   */
  variant?: AiSpinnerVariant;
  /** Descriptive label shown next to / below the spinner */
  label?: string;
  /** Optional sub-label for fullscreen variant */
  subLabel?: string;
  className?: string;
}

/**
 * AiSpinner -- the single reusable loading indicator for all AI/Gemini operations.
 *
 * Usage:
 *   // Inside a button (inline)
 *   {isLoading ? <AiSpinner variant="inline" label="Generating..." /> : "Generate"}
 *
 *   // Card overlay (wrap parent in relative)
 *   {isLoading && <AiSpinner variant="overlay" label="Thinking..." />}
 *
 *   // Full page (during track/roadmap generation)
 *   {isLoading && <AiSpinner variant="fullscreen" label="Building your roadmap..." subLabel="This takes 10-20 seconds" />}
 */
export default function AiSpinner({
  variant = "inline",
  label,
  subLabel,
  className = "",
}: AiSpinnerProps) {
  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={label ?? "Loading"}
      >
        <span className="loading loading-spinner loading-xs" />
        {label && <span className="text-current">{label}</span>}
      </span>
    );
  }

  if (variant === "overlay") {
    return (
      <div
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-base-100/80 backdrop-blur-sm ${className}`}
        role="status"
        aria-live="polite"
        aria-label={label ?? "Loading"}
      >
        <div className="relative flex items-center justify-center mb-3">
          <span className="absolute inline-flex h-14 w-14 rounded-full bg-primary/20 animate-ping" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
        </div>
        {label && <p className="text-sm font-bold text-base-content/80">{label}</p>}
        {subLabel && <p className="text-xs text-base-content/50 mt-1">{subLabel}</p>}
      </div>
    );
  }

  // fullscreen
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-100/90 backdrop-blur-md ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <div className="relative flex items-center justify-center mb-6">
        <span className="absolute inline-flex h-24 w-24 rounded-full border-2 border-primary/20 animate-ping" />
        <span className="absolute inline-flex h-20 w-20 rounded-full border border-primary/30 animate-pulse" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/40 shadow-lg shadow-primary/20">
          <Sparkles
            className="w-7 h-7 text-primary"
            style={{ animation: "spin 2s linear infinite" }}
          />
        </div>
      </div>
      <div className="text-center space-y-2 max-w-xs px-4">
        <p className="text-base font-extrabold text-base-content tracking-tight">
          {label ?? "Generating with Gemini AI..."}
        </p>
        {subLabel && (
          <p className="text-sm text-base-content/50 font-medium">{subLabel}</p>
        )}
      </div>
      <div className="mt-8 w-48 h-1 rounded-full bg-base-300 overflow-hidden">
        <div
          className="h-full w-1/3 rounded-full bg-primary"
          style={{ animation: "ai-slide 1.4s ease-in-out infinite" }}
        />
      </div>
      <style>{`
        @keyframes ai-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
