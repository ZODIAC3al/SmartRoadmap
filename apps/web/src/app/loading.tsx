import React from "react";

export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4">
      {/* Devotopia sleek pulse loader */}
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E1251B] to-[#FF5A4E] animate-pulse flex items-center justify-center shadow-xl shadow-red-600/30">
          <div className="w-5 h-5 rounded-full bg-white/20 animate-ping" />
        </div>
      </div>
      <div className="flex items-center gap-2 font-mono text-xs text-base-content/60 font-semibold tracking-wider uppercase">
        <span className="loading loading-spinner loading-xs text-primary"></span>
        <span>Loading...</span>
      </div>
    </div>
  );
}
