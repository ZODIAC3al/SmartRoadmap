"use client";

import React from "react";

interface CommunityCollabVisualProps {
  className?: string;
  memberCount?: number;
  activeMatches?: number;
}

export default function CommunityCollabVisual({
  className = "",
  memberCount = 1420,
  activeMatches = 38,
}: CommunityCollabVisualProps) {
  return (
    <div className={`relative bg-gradient-to-br from-base-200 to-base-100 border border-base-300 rounded-3xl p-6 shadow-md text-start select-none overflow-hidden ${className}`}>
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#8E1616_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-md">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E1616]/10 text-[#8E1616] text-[10px] font-mono font-black uppercase">
            <span>● Verified Developer Network</span>
          </div>
          <h3 className="text-xl font-black text-base-content tracking-tight">
            Connect with High-Growth Engineering Teams
          </h3>
          <p className="text-xs text-base-content/70 dark:text-stone-300 font-medium leading-relaxed">
            Collaborate on open-source repositories, solve peer code reviews, and get directly matched with hiring managers looking for verified skill scores.
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex sm:flex-col gap-3 shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-base-100 border border-base-300 shadow-sm text-center">
            <span className="text-2xl font-black font-mono text-[#8E1616]">
              {memberCount.toLocaleString()}+
            </span>
            <span className="block text-[10px] font-bold text-base-content/70 dark:text-stone-400 mt-0.5">
              Verified Engineers
            </span>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-base-100 border border-base-300 shadow-sm text-center">
            <span className="text-2xl font-black font-mono text-[#701111] dark:text-[#B32424]">
              {activeMatches}
            </span>
            <span className="block text-[10px] font-bold text-base-content/70 dark:text-stone-400 mt-0.5">
              Active Job Matches
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
