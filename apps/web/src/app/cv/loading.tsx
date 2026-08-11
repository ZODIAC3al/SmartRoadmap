import React from "react";

export default function CvLoading() {
  return (
    <div className="min-h-screen bg-base-100 p-6 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse flex items-center justify-center shadow-xl shadow-blue-500/25">
        <span className="text-white text-lg font-mono font-black">CV</span>
      </div>
      <div className="flex items-center gap-2 font-mono text-xs text-base-content/60 font-semibold tracking-wider uppercase">
        <span className="loading loading-spinner loading-xs text-primary"></span>
        <span>Loading CV Builder...</span>
      </div>
    </div>
  );
}
