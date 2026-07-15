"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiFetch, getCachedUser, hasSession } from "@/lib/api";

type Module = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  status: "locked" | "in_progress" | "completed" | "failed";
  topics?: string[];
};

type StreakData = {
  current: number;
  longest: number;
  freezesAvailable: number;
};

type CalendarEventItem = {
  _id: string;
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  completed: boolean;
};

type AchievementItem = {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  unlockedAt: string;
};

type DashboardSummary = {
  roadmapProgress: number;
  nextModule: Module | null;
  streak: StreakData;
  upcomingEvents: CalendarEventItem[];
  recentAchievements: AchievementItem[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>({
    roadmapProgress: 0,
    nextModule: null,
    streak: { current: 0, longest: 0, freezesAvailable: 2 },
    upcomingEvents: [],
    recentAchievements: [],
  });

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = getCachedUser();
    const storedToken = hasSession();

    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }

    setUser(storedUser);

    async function loadData() {
      try {
        const [sumRes, notifRes] = await Promise.all([
          apiFetch("/dashboard/summary"),
          apiFetch("/notifications"),
        ]);

        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData.data);
        }
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.data || []);
        }
      } catch (e) {
        console.error("Error loading dashboard metrics");
      } finally {
        setLoading(false);
      }
    }

    loadData();
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
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          Please log in to view your career readiness dashboard, passport, and recommended matches.
        </p>
        <div className="flex gap-4">
          <Link href="/auth/login" className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl">
            Log In
          </Link>
          <Link href="/auth/register" className="btn btn-outline border-slate-300 text-slate-700 rounded-xl">
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

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen pb-12 pt-6 px-4 sm:px-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Greeting Header */}
        <div className="space-y-2 text-start">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Hi, {user.name}! What are your plans for today?
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            This platform is designed to revolutionize the way you organize, access, and verify your adaptive roadmaps and skills passports.
          </p>
        </div>

        {/* Dynamic Action Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-300">
            <span className="bg-indigo-50 text-indigo-600 p-3 rounded-xl text-2xl">📋</span>
            <div className="space-y-1 text-start">
              <h3 className="font-bold text-slate-800 text-sm">Stay organized</h3>
              <p className="text-xs text-slate-400">Maintain a clear roadmap structure for your learning timeline modules.</p>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-300">
            <span className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-2xl">⚡</span>
            <div className="space-y-1 text-start">
              <h3 className="font-bold text-slate-800 text-sm">Sync your notes</h3>
              <p className="text-xs text-slate-400">Access generated reference cheatsheets and audio summaries anytime.</p>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-300">
            <span className="bg-purple-50 text-purple-600 p-3 rounded-xl text-2xl">👥</span>
            <div className="space-y-1 text-start">
              <h3 className="font-bold text-slate-800 text-sm">Collaborate & share</h3>
              <p className="text-xs text-slate-400">Share your verified competency credentials and score reports directly with companies.</p>
            </div>
          </div>
        </div>

        {/* Dashboard Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT WIDGETS COLUMN */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Widget 1: Notifications */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                <Link href="/notifications" className="text-xs text-indigo-600 hover:underline font-bold">Clear all</Link>
              </div>

              <div className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.slice(0, 2).map((n, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center gap-3">
                      <div>
                        <span className="text-[9px] uppercase font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {n.type}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs mt-1.5">{n.titleEn}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{n.contentEn}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Active</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic py-4">No recent notification alerts.</div>
                )}
              </div>
            </div>

            {/* Widget 2: Assignments */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Current Assignment</h3>
                <span className="text-[10px] bg-amber-50 text-amber-600 font-mono font-bold px-2.5 py-0.5 rounded">
                  IN PROGRESS
                </span>
              </div>

              {summary.nextModule ? (
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-indigo-600 font-extrabold uppercase font-mono tracking-wider block">
                        Roadmap Module
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-0.5">{summary.nextModule.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md">{summary.nextModule.description}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 border border-slate-300 px-2.5 py-0.5 rounded">
                      {summary.nextModule.difficulty}
                    </span>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Link href="/roadmap" className="btn btn-outline btn-xs rounded text-slate-600 border-slate-200 hover:bg-slate-100">
                      Open Canvas
                    </Link>
                    <Link href={`/quiz/${summary.nextModule.id}`} className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none btn-xs rounded font-bold px-4">
                      Prove Mastery ⚡
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic py-4">No active learning module matches. Get started on a roadmap!</div>
              )}
            </div>

            {/* Widget 3: Today's Tasks */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Today tasks</h3>
                <span className="text-xs font-mono font-bold text-slate-400">Total: {summary.nextModule?.topics?.length || 0}</span>
              </div>

              <div className="space-y-3">
                {summary.nextModule && summary.nextModule.topics && summary.nextModule.topics.length > 0 ? (
                  summary.nextModule.topics.map((topic: string, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="text-xs font-bold text-slate-700">{topic}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] text-slate-400">Estimated: 1h</span>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-indigo-600 h-full" style={{ width: i === 0 ? "90%" : i === 1 ? "50%" : "10%" }} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic py-4">No task objectives set for today.</div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT WIDGETS COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Widget 4: May 2021 Calendar widget */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Schedule Summary</h3>
                <Link href="/calendar" className="text-xs text-indigo-600 hover:underline font-bold">Open Full</Link>
              </div>

              {/* Simple inline calendar representation matching mockup */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>July 2026</span>
                  <div className="flex gap-2">
                    <span>‹</span>
                    <span>›</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-slate-400 font-bold font-mono">
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-bold font-mono text-slate-700">
                  <span className="text-slate-300">28</span><span className="text-slate-300">29</span><span className="text-slate-300">30</span><span>1</span><span>2</span><span>3</span><span>4</span>
                  <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span className="bg-indigo-500 text-white rounded-full p-0.5">15</span><span>16</span>
                  <span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {summary.upcomingEvents.length > 0 ? (
                  summary.upcomingEvents.slice(0, 2).map((ev, i) => (
                    <div key={i} className="text-[11px] font-semibold text-slate-500 flex justify-between items-center border-t border-slate-100 pt-2">
                      <span className="truncate max-w-[150px]">{ev.title}</span>
                      <span className="text-indigo-600 font-bold">{new Date(ev.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400 italic">No study sessions scheduled today.</div>
                )}
              </div>
            </div>

            {/* Widget 5: Go Premium callout */}
            <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-md text-start space-y-4 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-white/10" />
              <div className="space-y-1 relative z-10">
                <h3 className="font-extrabold text-lg">Go premium!</h3>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  Gain access to a range of benefits designed to enhance your learning experience. Unlock vector job matches, resume bullet enhancers, and mock execution sandbox.
                </p>
              </div>

              <Link href="/pricing" className="btn bg-white hover:bg-slate-50 text-indigo-600 border-none btn-sm rounded-xl font-bold w-full relative z-10">
                Find out more
              </Link>
            </div>

            {/* Widget 6: Clash Royale Badges Showcase */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Verified Badges</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {summary.recentAchievements.length > 0 ? (
                  summary.recentAchievements.slice(0, 2).map((ach, i) => {
                    const isGold = ach.tier === 'gold';
                    const isSilver = ach.tier === 'silver';
                    return (
                      <div
                        key={i}
                        className={`rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-lg border-2 relative overflow-hidden ${
                          isGold 
                            ? "bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600 border-amber-300 text-white" 
                            : isSilver 
                            ? "bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border-slate-100 text-slate-800" 
                            : "bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 border-amber-600 text-white"
                        }`}
                      >
                        {/* Metallic reflection shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] animate-pulse" />
                        
                        <span className="text-3xl filter drop-shadow">🏆</span>
                        <h4 className="text-[10px] font-black tracking-tight uppercase mt-2">{ach.title}</h4>
                        <p className={`text-[8px] mt-0.5 leading-snug font-semibold ${isGold || ach.tier === 'bronze' ? "text-amber-100" : "text-slate-600"}`}>
                          {ach.description}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-xs text-slate-400 italic text-center py-4">
                    Earn verified badges by scoring over 70% in assessments.
                  </div>
                )}
              </div>
            </div>

            {/* Widget 7: Integrations status */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 text-start space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Platform status</span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Sandbox Sandbox</span>
                <span className="font-mono text-emerald-600 font-bold">Online ✓</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Mongoose Layer</span>
                <span className="font-mono text-emerald-600 font-bold">Connected ✓</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
