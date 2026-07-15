"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/AppContext";
import { toast } from "react-toastify";
import { apiFetch, getCachedUser, hasSession } from "@/lib/api";

type Module = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  status: "locked" | "in_progress" | "completed" | "failed";
};

type Roadmap = {
  _id: string;
  title: string;
  targetRole: string;
  totalEstimatedHours: number;
  modules: Module[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useApp();
  const [user, setUser] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [mockJob, setMockJob] = useState({
    title: "Frontend Engineer (Vetted)",
    company: "Stripe, Inc.",
    location: "Remote",
    salary: "$120k - $145k",
    matchScore: 97,
    missingSkills: ["CI/CD Pipelines", "Docker Basics"],
    applied: false,
  });

  useEffect(() => {
    const storedUser = getCachedUser();
    const storedToken = hasSession();

    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }

    const parsedUser = storedUser;
    setUser(parsedUser);

    async function loadData() {
      try {
        const roadmapRes = await apiFetch("/roadmap/me");
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json();
          setRoadmap(roadmapData);
        }
      } catch (e) {
        console.error("Error fetching dashboard metrics");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleApplyJob = () => {
    setMockJob((prev) => ({ ...prev, applied: true }));
    toast.success(
      `Successfully applied to ${mockJob.title} at ${mockJob.company}! Your Skill Passport has been shared.`,
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-8 text-center bg-base-100">
        <h2 className="text-2xl font-black text-base-content tracking-tight">
          Access Restricted
        </h2>
        <p className="text-sm text-base-content/65 max-w-sm mb-6">
          Please log in to view your career readiness dashboard, passport, and
          recommended matches.
        </p>
        <div className="flex gap-4">
          <Link
            href="/auth/login"
            className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl"
          >
            Log In
          </Link>
          <Link
            href="/auth/register"
            className="btn btn-outline border-base-300 text-base-content rounded-xl"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "company") {
    router.push("/company");
    return null;
  }

  const modules = roadmap?.modules || [];
  const completedModules = modules.filter((m) => m.status === "completed");
  const inProgressModules = modules.filter((m) => m.status === "in_progress");
  const activeMission =
    inProgressModules[0] || modules.find((m) => m.status === "locked");
  const progressPercent =
    modules.length > 0
      ? Math.round((completedModules.length / modules.length) * 100)
      : 0;

  return (
    <div className="bg-base-100 text-base-content min-h-screen pb-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-base-300 pb-6 text-start">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-base-content">
              Good Morning, {user.name} 👋
            </h1>
            <p className="text-xs text-base-content/60 font-semibold mt-1">
              Target Career Role:{" "}
              <span className="text-base-content font-bold">
                {roadmap?.targetRole || "Not Defined"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="border border-green-200 bg-green-50 rounded-xl px-4 py-2 text-start">
              <span className="text-[10px] text-[#059669] font-bold uppercase tracking-wider block">
                Career Score
              </span>
              <span className="text-xl font-mono font-black text-[#059669]">
                82%
              </span>
            </div>
            <div className="text-xs bg-base-200 border border-base-300 p-2.5 rounded-xl text-base-content/65 font-semibold">
              🏆 Top 10% of candidates this week
            </div>
          </div>
        </div>

        {/* Dashboard Main Visual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Employability Readiness Cards */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main grid of cards: 1. Career Score Details, 2. Skill Passport widget */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Card 1: Career Score breakdown */}
              <div className="card bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm text-base-content uppercase tracking-wider font-mono">
                    1. Career readiness
                  </h3>
                  <p className="text-xs text-base-content/50 mt-1">
                    A unified index representing how close you are to landing a
                    vetted tech role.
                  </p>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-4xl font-black font-mono text-[#059669]">
                    82%
                  </span>
                  <span className="text-xs text-[#22C55E] font-semibold">
                    ↑ 4% this month
                  </span>
                </div>

                {/* Metric list */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex justify-between text-xs border-t border-base-300 pt-2">
                    <span className="text-base-content/50">
                      Roadmap Milestones
                    </span>
                    <span className="font-bold text-base-content">
                      {completedModules.length} / {modules.length} Completed
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-base-content/50">
                      Verified Badges
                    </span>
                    <span className="font-bold text-base-content">
                      {completedModules.length} Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Skill Passport Summary */}
              <div className="card bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-sm text-base-content uppercase tracking-wider font-mono">
                      2. Skill Passport
                    </h3>
                    <span className="text-[9px] bg-green-100 text-[#059669] font-mono px-2 py-0.5 rounded font-bold">
                      VETTED
                    </span>
                  </div>
                  <p className="text-xs text-base-content/50 mt-1">
                    Vetted competency credentials visible directly to hiring
                    companies.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 py-2">
                  {completedModules.length > 0 ? (
                    completedModules.slice(0, 3).map((m, i) => (
                      <span
                        key={i}
                        className="badge bg-[#10B981]/10 text-[#059669] border-[#10B981]/25 text-[10px] px-2 py-2 rounded"
                      >
                        ✓ {m.title}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-base-content/40 italic">
                      No verified milestones yet
                    </span>
                  )}
                </div>

                <Link
                  href="/passport"
                  className="btn btn-outline border-[#10B981] hover:bg-[#10B981] hover:text-white text-[#10B981] btn-sm rounded-lg text-xs font-bold w-full"
                >
                  Open Passport Profile →
                </Link>
              </div>
            </div>

            {/* Current Mission Module Tracker */}
            <div className="card bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-sm text-base-content uppercase tracking-wider font-mono">
                    3. Current learning mission
                  </h3>
                  <p className="text-xs text-base-content/50 mt-1">
                    Complete this topic to unlock the next milestone assessment
                    badge.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-base-content/40">
                  ⏱ 2h Remaining
                </span>
              </div>

              {activeMission ? (
                <div className="bg-base-100 border border-base-300 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary font-mono block">
                        Active Topic
                      </span>
                      <h4 className="font-bold text-xs text-base-content mt-0.5">
                        {activeMission.title}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-base-content bg-base-200 px-2 py-0.5 rounded uppercase border border-base-300">
                      {activeMission.difficulty}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-base-content/40">
                      <span>MISSION METRICS PROGRESS</span>
                      <span className="text-primary">78%</span>
                    </div>
                    <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden border border-base-300">
                      <div
                        className="bg-[#10B981] h-full"
                        style={{ width: "78%" }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <Link
                      href="/roadmap"
                      className="btn btn-outline btn-xs rounded"
                    >
                      Open Roadmap Graph
                    </Link>
                    <Link
                      href={`/quiz/${activeMission.id}`}
                      className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none btn-xs rounded font-bold px-4"
                    >
                      Prove Mastery ⚡
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-base-content/40 italic">
                  No recommended learning module at the moment. Complete
                  onboarding.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Job Matches Feed */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 4: Job Matches */}
            <div className="card bg-base-200 border border-[#10B981]/35 rounded-2xl p-6 shadow-sm text-start space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#10B981] text-white text-[9px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-bl-xl">
                Best Match
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-base-content uppercase tracking-wider font-mono">
                  4. Target Job Match
                </h3>
                <p className="text-xs text-base-content/50 mt-1 font-semibold">
                  Recommended by AI vector matchmaking pipeline.
                </p>
              </div>

              {/* Match Percentage Display */}
              <div className="flex items-center gap-3">
                <span className="w-14 h-14 bg-[#10B981]/15 text-[#059669] rounded-xl flex items-center justify-center font-mono font-black text-lg">
                  {mockJob.matchScore}%
                </span>
                <div>
                  <h4 className="font-black text-xs text-base-content leading-snug">
                    {mockJob.title}
                  </h4>
                  <p className="text-[10px] text-base-content/40 font-semibold">
                    {mockJob.company} • {mockJob.location}
                  </p>
                </div>
              </div>

              {/* Salary & Gaps */}
              <div className="border-y border-base-300 py-3.5 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-base-content/40">
                    Estimated Salary:
                  </span>
                  <span className="font-bold text-base-content">
                    {mockJob.salary}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-base-content/40 block uppercase font-mono">
                    Missing skills gaps:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {mockJob.missingSkills.map((s, i) => (
                      <span
                        key={i}
                        className="bg-red-50 text-red-600 border border-red-100 rounded text-[9px] px-2 py-0.5 font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply / Action Button */}
              <button
                onClick={handleApplyJob}
                disabled={mockJob.applied}
                className={`btn btn-block btn-sm rounded-lg text-xs font-bold text-white border-none ${mockJob.applied ? "bg-gray-400 cursor-not-allowed" : "bg-[#10B981] hover:bg-[#059669]"}`}
              >
                {mockJob.applied
                  ? "✓ Profile Submitted"
                  : "Apply Instantly with Passport"}
              </button>

              <div className="text-center">
                <Link
                  href="/hiring"
                  className="text-xs text-[#059669] hover:underline font-bold"
                >
                  View All Matching Opportunities →
                </Link>
              </div>
            </div>

            {/* Platform metrics info */}
            <div className="border border-base-300 bg-base-200 rounded-2xl p-5 text-start space-y-3.5 shadow-sm">
              <span className="text-xs font-bold text-base-content/40 uppercase tracking-wider font-mono">
                System Integrity Status
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-base-content/50 font-semibold">
                  Verification Node
                </span>
                <span className="font-mono text-[#059669] font-bold">
                  Online ✓
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-base-content/50 font-semibold">
                  Qdrant Vector Server
                </span>
                <span className="font-mono text-[#059669] font-bold">
                  Connected ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
