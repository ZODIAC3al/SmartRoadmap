"use client";

import React from "react";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none opacity-30 dark:opacity-20 transition-opacity duration-1000">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-400/40 to-purple-500/40 blur-[100px] animate-blob" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-emerald-300/40 to-teal-400/40 blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute top-[30%] right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-pink-300/30 to-purple-400/30 blur-[120px] animate-blob animation-delay-4000" />
    </div>
  );
}
