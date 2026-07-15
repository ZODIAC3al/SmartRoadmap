"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import { fetchMe, logout } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const { locale } = useApp();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Statistics
  const [stats] = useState({
    totalUsers: 1420,
    totalLearners: 1180,
    totalCompanies: 240,
    activeRoadmaps: 980,
    quizzesPassed: 3120,
    openaiCosts: "$42.18",
    tokensUsed: "1,420,500",
  });

  // Daily signup data for custom SVG Area chart (7 days)
  const signupData = [
    { day: "Mon", count: 45 },
    { day: "Tue", count: 52 },
    { day: "Wed", count: 49 },
    { day: "Thu", count: 68 },
    { day: "Fri", count: 75 },
    { day: "Sat", count: 60 },
    { day: "Sun", count: 85 },
  ];

  // Quiz performance data for custom SVG Bar chart
  const quizPassRates = [
    { topic: "React Arch", rate: 92 },
    { topic: "TypeScript", rate: 89 },
    { topic: "Tailwind CSS", rate: 95 },
    { topic: "Node.js Core", rate: 84 },
    { topic: "Docker Engines", rate: 78 },
  ];

  useEffect(() => {
    // Identity now comes from the server (/auth/me), not from a JSON blob the
    // user can hand-edit in localStorage. The API enforces the role again
    // on every request via RolesGuard, so this is UX, not the security boundary.
    (async () => {
      const me = await fetchMe();
      setUser(me);
      setLoading(false);
    })();
  }, []);

  const handleSimulateAdmin = () => {
    // The fake client-side session ('demo-token') is gone: a role can only ever
    // come from a JWT the server issued, and the API re-checks it on every call.
    toast.info("Please sign in with an authorized account.");
    window.location.href = "/auth/login";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col min-h-[85vh] items-center justify-center p-8 text-center bg-base-100">
        <div className="max-w-md bg-base-200 border border-base-300 p-8 rounded-2xl shadow-sm space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            🛡️
          </div>
          <div className="space-y-2">
            <h2 className="text-display-md font-extrabold text-base-content leading-tight">
              Admin Gate Restriction
            </h2>
            <p className="text-xs text-base-content/50">
              Only master system operations and platform controllers are
              authorized to access the system metrics index.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSimulateAdmin}
              className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl font-semibold h-12 w-full transition-all duration-200"
            >
              Simulate Administrator Login (Demo)
            </button>
            <Link
              href="/auth/login"
              className="btn btn-outline border-base-300 text-base-content hover:bg-base-100 rounded-xl h-12 w-full"
            >
              Sign In with Admin Credentials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content pb-10 px-4 sm:px-6 lg:px-8 text-start font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Admin Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm">
          <div>
            <span className="text-[10px] text-base-content/40 font-mono font-bold uppercase tracking-wider block">
              Operational Command Console
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              SmartRoadmap Admin Suite
            </h1>
            <p className="text-xs text-base-content/50 mt-0.5">
              Control candidate database roles, edit learning modules, and audit
              system logs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/admin/users"
              className="btn btn-xs sm:btn-sm btn-outline border-base-300 text-base-content hover:bg-base-100 rounded-xl"
            >
              👥 Manage Users
            </Link>
            <Link
              href="/admin/content"
              className="btn btn-xs sm:btn-sm btn-outline border-base-300 text-base-content hover:bg-base-100 rounded-xl"
            >
              📚 Learning Content
            </Link>
            <button
              onClick={() => {
                logout();
                setUser(null);
                toast.info("Logged out from admin panel.");
              }}
              className="btn btn-xs sm:btn-sm btn-ghost text-red-500 rounded-xl hover:bg-red-50"
            >
              Logout Admin
            </button>
          </div>
        </div>

        {/* Analytics counts grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-xs">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              Total Users
            </span>
            <span className="text-3xl font-black font-mono text-base-content block mt-1">
              {stats.totalUsers}
            </span>
            <span className="text-[9px] text-base-content/40 block font-mono">
              {stats.totalLearners} Candidates • {stats.totalCompanies}{" "}
              Companies
            </span>
          </div>

          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-xs">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              Active Roadmaps
            </span>
            <span className="text-3xl font-black font-mono text-[#059669] block mt-1">
              {stats.activeRoadmaps}
            </span>
            <span className="text-[9px] text-base-content/40 block font-mono">
              Generations successful
            </span>
          </div>

          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-xs">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              Verified badges
            </span>
            <span className="text-3xl font-black font-mono text-[#10B981] block mt-1">
              {stats.quizzesPassed} Passed
            </span>
            <span className="text-[9px] text-base-content/40 block font-mono">
              Quiz sessions tracked
            </span>
          </div>

          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-xs">
            <span className="text-[9px] uppercase font-bold text-base-content/40 tracking-wider block font-mono">
              AI Token Costs
            </span>
            <span className="text-3xl font-black font-mono text-base-content block mt-1">
              {stats.openaiCosts}
            </span>
            <span className="text-[9px] text-base-content/40 block font-mono">
              {stats.tokensUsed} API Tokens
            </span>
          </div>
        </div>

        {/* Charts Split Area */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Chart 1: Daily Signup Area Chart */}
          <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <h3 className="font-extrabold text-xs text-base-content uppercase tracking-wider font-mono">
                Daily Signup Analytics
              </h3>
              <span className="text-[9px] bg-[#10B981]/15 text-[#059669] px-2 py-0.5 rounded-full font-bold font-mono">
                WEEKLY INDEX
              </span>
            </div>

            {/* Custom Responsive SVG area plot */}
            <div className="relative h-44 w-full pt-4">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 500 150"
                preserveAspectRatio="none"
              >
                {/* Horizontal grid guide lines */}
                <line
                  x1="0"
                  y1="30"
                  x2="500"
                  y2="30"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="opacity-[0.08]"
                />
                <line
                  x1="0"
                  y1="80"
                  x2="500"
                  y2="80"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="opacity-[0.08]"
                />
                <line
                  x1="0"
                  y1="130"
                  x2="500"
                  y2="130"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="opacity-[0.08]"
                />

                {/* Fill Area gradient path */}
                <path
                  d="M 0 130 L 70 110 L 140 100 L 210 105 L 280 75 L 350 65 L 420 85 L 500 50 L 500 130 Z"
                  fill="url(#signupGradient)"
                  className="opacity-45"
                />

                {/* Outline stroke path */}
                <path
                  d="M 0 130 L 70 110 L 140 100 L 210 105 L 280 75 L 350 65 L 420 85 L 500 50"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data points dots */}
                <circle cx="70" cy="110" r="3.5" fill="#10B981" />
                <circle cx="140" cy="100" r="3.5" fill="#10B981" />
                <circle cx="210" cy="105" r="3.5" fill="#10B981" />
                <circle cx="280" cy="75" r="3.5" fill="#10B981" />
                <circle cx="350" cy="65" r="3.5" fill="#10B981" />
                <circle cx="420" cy="85" r="3.5" fill="#10B981" />
                <circle cx="500" cy="50" r="3.5" fill="#10B981" />

                {/* Gradient Definition */}
                <defs>
                  <linearGradient
                    id="signupGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Labels Row */}
              <div className="flex justify-between text-[9px] font-mono text-base-content/40 mt-4 px-2">
                {signupData.map((d, i) => (
                  <span key={i}>
                    {d.day} ({d.count})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Quiz Completion rates bar chart */}
          <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <h3 className="font-extrabold text-xs text-base-content uppercase tracking-wider font-mono">
                Module Quiz Pass Rates
              </h3>
              <span className="text-[9px] bg-[#10B981]/15 text-[#059669] px-2 py-0.5 rounded-full font-bold font-mono">
                BENCHMARK
              </span>
            </div>

            {/* Custom Responsive SVG bar plot */}
            <div className="h-44 w-full pt-4 flex flex-col justify-between">
              {quizPassRates.map((quiz, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-base-content/70">
                    <span>{quiz.topic}</span>
                    <span className="font-mono text-[#059669] font-bold">
                      {quiz.rate}% Pass
                    </span>
                  </div>
                  <div className="w-full bg-base-100 border border-base-300 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-full"
                      style={{ width: `${quiz.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
