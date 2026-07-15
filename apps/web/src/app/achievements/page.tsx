"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch, getCachedUser, hasSession } from "@/lib/api";

type AchievementDef = {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
};

type UnlockedAchievement = {
  achievementKey: string;
  unlockedAt: string;
};

export default function AchievementsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [definitions, setDefinitions] = useState<AchievementDef[]>([]);
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    const storedUser = getCachedUser();
    const token = hasSession();
    if (!storedUser || !token) {
      setLoading(false);
      return;
    }
    setUser(storedUser);

    async function loadAchievements() {
      try {
        // Fetch all definitions
        const defRes = await apiFetch("/dashboard/summary"); // fallback source or direct list if available
        let defs: AchievementDef[] = [
          { key: "first_roadmap", title: "First Step", description: "Generate your first learning roadmap timeline.", icon: "🗺️", tier: "bronze" },
          { key: "first_quiz_pass", title: "Mastery Proved", description: "Score over 70% in any module quiz assessment.", icon: "⚡", tier: "silver" },
          { key: "fizzbuzz_pass", title: "FizzBuzz Solver", description: "Submit a correct solution to the FizzBuzz challenge.", icon: "🍺", tier: "gold" },
          { key: "streak_5", title: "Streak Master", description: "Maintain a 5-day quiz completion streak.", icon: "🔥", tier: "gold" },
        ];

        setDefinitions(defs);

        if (defRes.ok) {
          const summary = await defRes.json();
          const recent = summary.data?.recentAchievements || [];
          setUnlocked(recent.map((r: any) => ({ achievementKey: r.key, unlockedAt: r.unlockedAt })));
        }
      } catch (e) {
        console.error("Failed to load achievements list");
      } finally {
        setLoading(false);
      }
    }
    loadAchievements();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-indigo-600"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-8 text-center bg-slate-50">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">Please log in to view your achievements and verified badges.</p>
        <Link href="/auth/login" className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen pb-12 pt-6 px-4 sm:px-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-1 text-start">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Verify your progress</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Achievements & Trophy Room</h1>
          <p className="text-sm text-slate-400 max-w-md">
            Earn verified badges by completing roadmaps, passing adaptive quizzes, and solving sandboxed coding challenges.
          </p>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {definitions.map((def) => {
            const isUnlocked = unlocked.some((u) => u.achievementKey === def.key);
            const isGold = def.tier === "gold";
            const isSilver = def.tier === "silver";

            return (
              <div
                key={def.key}
                className={`card bg-white border rounded-2xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 ${
                  isUnlocked
                    ? "border-slate-100 shadow-md hover:shadow-lg"
                    : "border-slate-200 opacity-60 bg-slate-100/50"
                }`}
              >
                {/* Shiny reflex overlay for unlocked */}
                {isUnlocked && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 skew-y-12 animate-pulse pointer-events-none" />
                )}

                {/* Badge Shield Graphic */}
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md border-2 relative ${
                    isUnlocked
                      ? isGold
                        ? "bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-600 border-amber-300 text-white"
                        : isSilver
                        ? "bg-gradient-to-b from-slate-200 via-slate-350 to-slate-400 border-slate-250 text-slate-800"
                        : "bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 border-amber-600 text-white"
                      : "bg-slate-300 border-slate-400 text-slate-500"
                  }`}
                >
                  {isUnlocked ? def.icon : "🔒"}
                </div>

                <div className="space-y-1 mt-4">
                  <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{def.title}</h3>
                  <p className="text-[11px] text-slate-400 px-2 leading-relaxed">{def.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 w-full">
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded ${
                    isUnlocked
                      ? isGold
                        ? "bg-amber-100 text-amber-600"
                        : "bg-indigo-50 text-indigo-650"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {isUnlocked ? "UNLOCKED" : "LOCKED"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back Link */}
        <div className="pt-4">
          <Link href="/dashboard" className="text-xs text-indigo-600 font-bold hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
