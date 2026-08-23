"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface RoadmapNodeItem {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "locked";
  xp?: number;
}

export interface LearningJourneyVisualProps {
  nodes?: RoadmapNodeItem[];
  trackName?: string;
  completionRate?: number;
  className?: string;
}

export default function LearningJourneyVisual({
  nodes = [
    { id: "1", title: "Core Fundamentals", status: "completed", xp: 100 },
    { id: "2", title: "API Architecture", status: "completed", xp: 150 },
    { id: "3", title: "Microservices & Auth", status: "in_progress", xp: 250 },
    { id: "4", title: "Cloud Deployment", status: "locked", xp: 300 },
  ],
  trackName = "Full Stack Engineer Path",
  completionRate = 65,
  className = "",
}: LearningJourneyVisualProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`bg-base-100 dark:bg-stone-900 border border-base-300 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 select-none max-w-xl w-full ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b border-base-200 dark:border-stone-800 pb-4">
        <div>
          <span className="text-[9px] uppercase font-mono font-bold text-[#8E1616] dark:text-[#E8C999] tracking-wider block">
            ● Adaptive Roadmap Graph
          </span>
          <h4 className="font-extrabold text-base text-base-content mt-0.5">
            {trackName}
          </h4>
        </div>
        <div className="text-right">
          <span className="badge bg-[#8E1616] text-white font-mono font-bold text-xs py-2 px-3">
            {completionRate}% Mastered
          </span>
        </div>
      </div>

      {/* Connected Milestone Nodes Visualizer */}
      <div className="relative py-2">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {nodes.map((node, index) => {
            const isCompleted = node.status === "completed";
            const isInProgress = node.status === "in_progress";
            const isLocked = node.status === "locked";

            return (
              <div
                key={node.id}
                className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${
                  isInProgress
                    ? "bg-[#8E1616]/10 border-[#8E1616] ring-2 ring-[#8E1616]/20 shadow-md"
                    : isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-base-200/50 dark:bg-stone-800/40 border-base-300 dark:border-stone-800 opacity-60"
                }`}
              >
                {/* Node icon */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm mb-2 shadow-sm ${
                    isInProgress
                      ? "bg-[#8E1616] text-white"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-base-300 dark:bg-stone-700 text-stone-500"
                  }`}
                >
                  {isCompleted ? "✓" : isInProgress ? "⚡" : "🔒"}
                </div>

                <span className="font-extrabold text-xs text-base-content leading-tight line-clamp-1">
                  {node.title}
                </span>

                <span
                  className={`text-[9px] font-mono font-bold mt-1 uppercase ${
                    isInProgress
                      ? "text-[#8E1616] dark:text-[#E8C999]"
                      : isCompleted
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-stone-500"
                  }`}
                >
                  {isCompleted ? "Passed" : isInProgress ? "In Progress" : "Locked"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
