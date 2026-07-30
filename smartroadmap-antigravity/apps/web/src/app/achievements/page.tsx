"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, getToken } from "@/lib/api";
import { Trophy, Star, Shield, Lock, CheckCircle2, Zap } from "lucide-react";

interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  unlocked: boolean;
  unlockedAt: string | null;
}

interface Progress {
  total: number;
  unlocked: number;
  percentage: number;
}

const TIER_STYLES = {
  gold: {
    ring: "ring-2 ring-yellow-400/60",
    bg: "bg-gradient-to-br from-yellow-900/30 to-amber-900/20",
    badge: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    glow: "shadow-yellow-500/20 shadow-lg",
    label: "Gold",
  },
  silver: {
    ring: "ring-2 ring-slate-300/50",
    bg: "bg-gradient-to-br from-slate-700/30 to-slate-600/20",
    badge: "bg-slate-400/20 text-slate-300 border border-slate-400/30",
    glow: "shadow-slate-400/20 shadow-lg",
    label: "Silver",
  },
  bronze: {
    ring: "ring-2 ring-amber-700/50",
    bg: "bg-gradient-to-br from-amber-900/30 to-orange-900/20",
    badge: "bg-amber-700/20 text-amber-400 border border-amber-700/30",
    glow: "shadow-amber-700/20 shadow-lg",
    label: "Bronze",
  },
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [tierFilter, setTierFilter] = useState<"all" | "bronze" | "silver" | "gold">("all");
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  // i18n dict
  const isRtl = typeof window !== "undefined" && document.documentElement.lang === "ar";
  const dict = {
    title: { en: "Achievements", ar: "الإنجازات" },
    subtitle: { en: "Track your milestones and unlock rewards as you learn.", ar: "تتبع إنجازاتك واكسب المكافآت خلال رحلتك التعليمية." },
    unlocked: { en: "Unlocked", ar: "مفتوح" },
    locked: { en: "Locked", ar: "مقفل" },
    all: { en: "All", ar: "الكل" },
    progress: { en: "Your Progress", ar: "تقدمك" },
    of: { en: "of", ar: "من" },
  };
  const tr = (key: keyof typeof dict) => isRtl ? dict[key].ar : dict[key].en;

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    (async () => {
      try {
        const [achRes, progRes] = await Promise.all([
          apiFetch("/achievements"),
          apiFetch("/achievements/progress"),
        ]);
        const achData = await achRes.json();
        const progData = await progRes.json();

        if (achData.success) {
          const list: Achievement[] = achData.data;
          // Detect newly unlocked vs last render
          const newlyUnlocked = list
            .filter((a) => a.unlocked && !prevUnlockedRef.current.has(a.key))
            .map((a) => a.key);
          if (newlyUnlocked.length > 0) setNewUnlocks(newlyUnlocked);
          prevUnlockedRef.current = new Set(list.filter((a) => a.unlocked).map((a) => a.key));
          setAchievements(list);
        }
        if (progData.success) setProgress(progData.data);
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = achievements.filter((a) => {
    const statusOk = filter === "all" || (filter === "unlocked" ? a.unlocked : !a.unlocked);
    const tierOk = tierFilter === "all" || a.tier === tierFilter;
    return statusOk && tierOk;
  });

  const gold = achievements.filter((a) => a.tier === "gold");
  const silver = achievements.filter((a) => a.tier === "silver");
  const bronze = achievements.filter((a) => a.tier === "bronze");

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 pb-20">
      {/* New unlock flash toasts */}
      <AnimatePresence>
        {newUnlocks.map((key) => {
          const ach = achievements.find((a) => a.key === key);
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: -60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-20 right-4 z-50 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/40 rounded-2xl p-4 flex items-center gap-3 shadow-2xl backdrop-blur-sm max-w-xs"
              onAnimationComplete={() =>
                setTimeout(() => setNewUnlocks((prev) => prev.filter((k) => k !== key)), 3000)
              }
            >
              <span className="text-3xl">{ach?.icon ?? "🏆"}</span>
              <div>
                <p className="text-xs font-black text-yellow-300 uppercase tracking-wider">Achievement Unlocked!</p>
                <p className="text-sm font-bold text-base-content">{ach?.title}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-300">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-base-content flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                {tr("title")}
              </h1>
              <p className="text-xs text-base-content/50 mt-0.5">{tr("subtitle")}</p>
            </div>

            {progress && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-base-content/50">{tr("progress")}</p>
                  <p className="text-sm font-black text-base-content">
                    {progress.unlocked} {tr("of")} {progress.total}
                  </p>
                </div>
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" strokeWidth="5" className="stroke-base-300 fill-none" />
                    <circle
                      cx="28" cy="28" r="22" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress.percentage / 100)}`}
                      strokeLinecap="round"
                      className="stroke-yellow-400 fill-none transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-yellow-400">
                    {progress.percentage}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tier quick stats */}
          <div className="flex gap-3 mt-4">
            {[
              { label: "Gold", count: gold.filter((a) => a.unlocked).length, total: gold.length, color: "text-yellow-400" },
              { label: "Silver", count: silver.filter((a) => a.unlocked).length, total: silver.length, color: "text-slate-300" },
              { label: "Bronze", count: bronze.filter((a) => a.unlocked).length, total: bronze.length, color: "text-amber-500" },
            ].map((tier) => (
              <div key={tier.label} className="flex items-center gap-1.5 bg-base-200 rounded-xl px-3 py-1.5">
                <Star className={`w-3.5 h-3.5 ${tier.color}`} />
                <span className={`text-xs font-bold ${tier.color}`}>{tier.label}</span>
                <span className="text-xs text-base-content/40">{tier.count}/{tier.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(["all", "unlocked", "locked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === f
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 text-base-content/60 hover:bg-base-300"
              }`}
            >
              {f === "all" ? tr("all") : f === "unlocked" ? tr("unlocked") : tr("locked")}
            </button>
          ))}
          <div className="w-px bg-base-300 self-stretch" />
          {(["all", "gold", "silver", "bronze"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                tierFilter === t
                  ? t === "gold" ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40"
                  : t === "silver" ? "bg-slate-400/20 text-slate-300 ring-1 ring-slate-400/40"
                  : t === "bronze" ? "bg-amber-700/20 text-amber-400 ring-1 ring-amber-700/40"
                  : "bg-primary text-primary-content"
                  : "bg-base-200 text-base-content/60 hover:bg-base-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Achievement grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-base-content/40">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No achievements in this category yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ach, i) => {
              const tier = TIER_STYLES[ach.tier];
              return (
                <motion.div
                  key={ach.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={`relative rounded-2xl p-4 border border-base-300 transition-all duration-300 ${
                    ach.unlocked
                      ? `${tier.bg} ${tier.ring} ${tier.glow}`
                      : "bg-base-200/50 opacity-60 grayscale"
                  }`}
                >
                  {/* Tier badge */}
                  <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${tier.badge}`}>
                    {tier.label}
                  </div>

                  {/* Icon */}
                  <div className={`text-3xl mb-3 ${ach.unlocked ? "" : "filter grayscale"}`}>
                    {ach.icon}
                  </div>

                  <h3 className="font-bold text-sm text-base-content mb-1">{ach.title}</h3>
                  <p className="text-xs text-base-content/50 leading-relaxed">{ach.description}</p>

                  {/* Status */}
                  <div className="mt-3 flex items-center gap-1.5">
                    {ach.unlocked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          {ach.unlockedAt
                            ? `Unlocked ${new Date(ach.unlockedAt).toLocaleDateString()}`
                            : "Unlocked"}
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-base-content/30" />
                        <span className="text-[10px] text-base-content/30 font-semibold">Locked</span>
                      </>
                    )}
                  </div>

                  {/* Shimmer on newly unlocked */}
                  {newUnlocks.includes(ach.key) && (
                    <motion.div
                      initial={{ opacity: 0.8, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.1 }}
                      transition={{ duration: 1.5 }}
                      className="absolute inset-0 rounded-2xl bg-yellow-400/20 pointer-events-none"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
