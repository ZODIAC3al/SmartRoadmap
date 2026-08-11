import React from "react";

export default function MockInterviewLoading() {
  return (
    <div className="min-h-[70vh] p-6 max-w-4xl mx-auto flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-[#E1251B] animate-pulse flex items-center justify-center shadow-xl shadow-orange-500/25">
        <span className="text-white text-lg font-black">🎙️</span>
      </div>
      <div className="flex items-center gap-2 font-mono text-xs text-base-content/60 font-semibold tracking-wider uppercase">
        <span className="loading loading-spinner loading-xs text-primary"></span>
        <span>Initializing AI Interview Assistant...</span>
      </div>
    </div>
  );
}
