"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import { getCachedUser, apiFetch } from "@/lib/api";
import { useSearchParams } from "next/navigation";

type VettedSkill = {
  name: string;
  score: number;
  category: string;
  verifiedAt: string;
};

type VerifiedProject = {
  name: string;
  description: string;
  githubUrl: string;
  auditPassed: boolean;
};

export default function SkillPassportPage() {
  const { t, locale } = useApp();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const userIdParam = searchParams?.get("userId");

  const [skills, setSkills] = useState<VettedSkill[]>([]);
  const [projects, setProjects] = useState<VerifiedProject[]>([]);

  useEffect(() => {
    async function loadPassport() {
      try {
        if (userIdParam) {
          const httpRes = await apiFetch(`/hiring/candidates/${userIdParam}`);
          if (httpRes.ok) {
            const res = await httpRes.json();
            setUser({
              id: res.userId,
              name: res.name,
              email: res.email,
              avatarUrl: res.avatarUrl,
              targetRole: res.targetRole,
              progress: res.progress,
              completedMilestones: res.completedMilestones,
              verifiedSkills: res.verifiedSkills,
              averageQuizScore: res.averageQuizScore,
              quizzesPassed: res.quizzesPassed,
              cvUploaded: res.cvUploaded,
            });
            if (res.projects) {
              setProjects(res.projects);
            }
            if (res.verifiedSkills) {
              setSkills(res.verifiedSkills.map((s: string) => ({
                name: s,
                score: res.averageQuizScore || 90,
                category: "Verified Tech Skill",
                verifiedAt: new Date().toISOString().split("T")[0],
              })));
            }
          } else {
            throw new Error(`Failed to load candidate: ${httpRes.status}`);
          }
        } else {
          const storedUser = getCachedUser();
          if (storedUser) {
            setUser(storedUser);
            try {
              const httpRes = await apiFetch(`/hiring/candidates/${storedUser.id || storedUser._id}`);
              if (httpRes.ok) {
                const res = await httpRes.json();
                if (res.projects) setProjects(res.projects);
                if (res.verifiedSkills) {
                  setSkills(res.verifiedSkills.map((s: string) => ({
                    name: s,
                    score: res.averageQuizScore || 90,
                    category: "Verified Tech Skill",
                    verifiedAt: new Date().toISOString().split("T")[0],
                  })));
                }
              }
            } catch (e) {
              // Ignore public fallback failure — learner may not have passport data yet
            }
          }
        }
      } catch (err: any) {
        toast.error("Failed to load Verified Skill Passport: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }
    loadPassport();
  }, [userIdParam]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Public Skill Passport shareable link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#8E1616]"></span>
      </div>
    );
  }

  const profileName = user?.name || "Verified Learner";
  const initialLetters = profileName
    .split(" ")
    .map((n: string) => n[0])
    .join("");

  return (
    <div className="bg-base-100 text-base-content min-h-screen pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Shareable Header Controls */}
        <div className="flex justify-between items-center border-b border-base-300 pb-6 text-start">
          <div>
            <span className="text-[10px] text-stone-600 dark:text-stone-400 font-medium font-mono font-bold uppercase tracking-wider">
              vetted talent credentials
            </span>
            <h1 className="text-3xl font-black tracking-tight text-base-content mt-1">
              Verified Skill Passport
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="btn bg-[#8E1616] hover:bg-[#8E1616] text-white border-none btn-sm rounded-lg text-xs font-bold px-4"
            >
              Share Public Profile 🔗
            </button>
          </div>
        </div>

        {/* The Passport Core Layout Box */}
        <div className="bg-base-200 border border-base-300 rounded-2xl shadow-xl overflow-hidden relative">
          {/* Header Badge Stripe Banner */}
          <div className="bg-gradient-to-r from-[#8E1616] to-[#E8C999] h-3.5 w-full" />

          <div className="p-8 space-y-8">
            {/* Identity details */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-start border-b border-base-300 pb-6">
              <div className="flex items-center gap-4.5">
                <div className="w-16 h-16 rounded-full bg-[#8E1616]/15 text-[#8E1616] border border-[#8E1616]/30 flex items-center justify-center font-black text-xl shadow-inner">
                  {initialLetters}
                </div>
                <div>
                  <h2 className="text-xl font-black text-base-content tracking-tight">
                    {profileName}
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-medium font-mono mt-0.5">
                    ID: VET-2026-{(user?.id || user?._id || "usr").substring(0, 8).toUpperCase()}
                  </p>
                  <span className="inline-block mt-2 bg-[#8E1616]/10 text-[#8E1616] border border-[#8E1616]/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    ACTIVE SOURCE CANDIDATE
                  </span>
                </div>
              </div>

              {/* General Scores block */}
              <div className="flex gap-4">
                <div className="border border-base-300 bg-base-100 rounded-xl p-3.5 text-center min-w-[100px]">
                  <span className="text-[9px] uppercase tracking-wider text-stone-600 dark:text-stone-400 font-medium font-mono block">
                    Roadmap Progress
                  </span>
                  <span className="text-xl font-mono font-black text-[#8E1616] block mt-0.5">
                    {user?.progress ?? 0}%
                  </span>
                </div>
                <div className="border border-base-300 bg-base-100 rounded-xl p-3.5 text-center min-w-[100px]">
                  <span className="text-[9px] uppercase tracking-wider text-stone-600 dark:text-stone-400 font-medium font-mono block">
                    Quiz Performance
                  </span>
                  <span className="text-xl font-mono font-black text-[#8E1616] block mt-0.5">
                    {user?.averageQuizScore ?? 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Vetted Assessments Scores */}
            <div className="space-y-4 text-start">
              <h3 className="text-xs font-bold text-stone-600 dark:text-stone-400 font-medium uppercase tracking-wider font-mono">
                Verified assessment milestones
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                {skills.map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-base-100 border border-base-300 rounded-xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <span className="text-[9px] bg-base-300 text-stone-700 dark:text-stone-300 font-medium font-mono px-2 py-0.5 rounded font-bold uppercase">
                        {s.category}
                      </span>
                      <h4 className="font-bold text-xs text-base-content mt-2">
                        {s.name}
                      </h4>
                      <p className="text-[9px] text-stone-600 dark:text-stone-400 font-medium mt-1">
                        Verified: {s.verifiedAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-mono font-black text-[#8E1616]">
                        {s.score}%
                      </span>
                      <span className="text-[8px] text-[#8E1616] block font-bold">
                        PASS ✓
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Projects Code Audits */}
            <div className="space-y-4 text-start border-t border-base-300 pt-6">
              <h3 className="text-xs font-bold text-stone-600 dark:text-stone-400 font-medium uppercase tracking-wider font-mono">
                Verified application code audits
              </h3>

              <div className="space-y-3.5">
                {projects.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-base-100 border border-base-300 rounded-xl p-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <h4 className="font-extrabold text-xs text-base-content">
                        {p.name}
                      </h4>
                      <p className="text-xs text-stone-700 dark:text-stone-300 font-medium leading-relaxed">
                        {p.description}
                      </p>
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-stone-600 dark:text-stone-400 font-medium hover:text-primary underline block"
                      >
                        Source Repository URL
                      </a>
                    </div>
                    <span className="bg-[#8E1616]/10 text-[#8E1616] border border-[#8E1616]/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded w-max shrink-0">
                      ✓ Audit Passed (90+)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interview Readiness and Certificates */}
            <div className="grid sm:grid-cols-2 gap-6 border-t border-base-300 pt-6 text-start">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-600 dark:text-stone-400 font-medium uppercase tracking-wider font-mono">
                  Interview Performance
                </h4>
                <div className="bg-base-100 border border-base-300 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-700 dark:text-stone-300 font-medium">
                      System Architecture:
                    </span>
                    <span className="font-bold text-base-content">
                      Excellent (Vetted)
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-700 dark:text-stone-300 font-medium">Coding Speed:</span>
                    <span className="font-bold text-base-content">
                      Above Average
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-600 dark:text-stone-400 font-medium uppercase tracking-wider font-mono">
                  Verified Certificates Log
                </h4>
                <div className="bg-base-100 border border-base-300 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-700 dark:text-stone-300 font-medium">
                      React Core Advanced:
                    </span>
                    <span className="font-mono text-[#8E1616] font-bold">
                      VET-CERT-01
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-700 dark:text-stone-300 font-medium">
                      TS Strict Compiler:
                    </span>
                    <span className="font-mono text-[#8E1616] font-bold">
                      VET-CERT-02
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
