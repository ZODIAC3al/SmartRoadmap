'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';

type Module = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  status: 'locked' | 'in_progress' | 'completed' | 'failed';
};

type Roadmap = {
  _id: string;
  title: string;
  targetRole: string;
  totalEstimatedHours: number;
  modules: Module[];
};

function SidebarIcon({ name }: { name: string }) {
  const common = 'w-5 h-5';
  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 11l9-8 9 8M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'folder':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7a1 1 0 011-1h5l2 2h9a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'doc':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12h6M9 16h6" strokeLinecap="round" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19V9M11 19V4M18 19v-6" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useApp();
  const [user, setUser] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobMatchesCount, setJobMatchesCount] = useState(0);

  const SIDEBAR_ITEMS = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: 'home' },
    { href: '/roadmap', label: t('nav.roadmap'), icon: 'folder' },
    { href: '/cv', label: t('nav.cv'), icon: 'doc' },
    { href: '/hiring', label: t('nav.jobsMatch'), icon: 'chart' },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('smart_user');
    const storedToken = localStorage.getItem('smart_token');

    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    async function loadData() {
      try {
        const roadmapRes = await fetch(`http://localhost:3000/roadmap/user/${parsedUser.id}`);
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json();
          setRoadmap(roadmapData);
        }

        const jobsRes = await fetch(`http://localhost:3000/hiring/jobs/matches/${parsedUser.id}`);
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobMatchesCount(jobsData.length);
        }
      } catch (e) {
        console.error('Error fetching dashboard metrics');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-8 text-center bg-base-100">
        <h2 className="text-2xl font-bold mb-2 text-base-content">Welcome to SmartRoadmap</h2>
        <p className="text-sm text-base-content/60 max-w-sm mb-6">
          Log in to see your roadmap progress, charts, and job matches in one place.
        </p>
        <div className="flex gap-4">
          <Link href="/auth/login" className="btn btn-primary rounded-xl">
            Log In
          </Link>
          <Link href="/auth/register" className="btn btn-outline border-primary text-primary rounded-xl">
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === 'company') {
    router.push('/company');
    return null;
  }

  const modules = roadmap?.modules || [];
  const completedModules = modules.filter((m) => m.status === 'completed');
  const inProgressModules = modules.filter((m) => m.status === 'in_progress');
  const nextRecommendedModule = inProgressModules[0] || modules.find((m) => m.status === 'locked');
  const progressPercent = modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0;

  // Build a simple weekly progress shape from completed module count
  const weeklyPoints = Array.from({ length: 7 }, (_, i) => {
    const ratio = modules.length > 0 ? Math.min(1, (i + 1) / 7) : 0;
    return Math.round(completedModules.length * ratio);
  });
  const maxPoint = Math.max(1, ...weeklyPoints);

  return (
    <div className="min-h-screen bg-base-100 flex">
      {/* Sidebar - theme and layout responsive */}
      <aside className="hidden lg:flex flex-col w-20 bg-gradient-to-b from-primary to-neutral py-6 items-center gap-8 sticky top-0 h-screen">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15 8L22 9L17 14L18 21L12 17L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" />
          </svg>
        </div>
        <nav className="flex flex-col gap-6 text-white/60">
          {SIDEBAR_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white transition-colors" title={item.label}>
              <SidebarIcon name={item.icon} />
            </Link>
          ))}
        </nav>
        <div className="mt-auto w-9 h-9 rounded-full bg-base-100 text-primary flex items-center justify-center font-bold text-xs">
          {user.name?.slice(0, 2).toUpperCase()}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-base-content mb-6">{t('nav.dashboard')}</h1>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Welcome card */}
          <div className="lg:col-span-2 bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-base-content mb-1">
                {t('dash.welcome')}, {user.name}!
              </h2>
              <p className="text-xs text-base-content/65 leading-relaxed max-w-xs">
                {t('dash.target_role')}: <strong className="text-base-content">{roadmap?.targetRole || t('dash.not_generated')}</strong>
                <br />
                {completedModules.length} {t('dash.milestones_status')} {modules.length}
              </p>
              <Link href="/roadmap" className="btn btn-sm btn-primary rounded-lg mt-4">
                {t('dash.open_curriculum')}
              </Link>
            </div>
            <div className="hidden sm:block text-primary/20">
              <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="50" cy="35" r="14" />
                <path d="M30 90 Q50 70 70 90" strokeLinecap="round" />
                <rect x="38" y="50" width="24" height="30" rx="4" />
              </svg>
            </div>
          </div>

          {/* Progress tile */}
          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 shadow-sm text-white flex flex-col justify-between">
            <span className="text-xs font-medium text-white/80">{t('dash.this_month')}</span>
            <span className="text-3xl font-bold mt-2">{progressPercent}%</span>
            <span className="text-xs text-white/70 mt-1">{t('dash.roadmap_complete')}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mt-5">
          {/* Line chart card */}
          <div className="lg:col-span-2 bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs text-base-content/50">{t('dash.milestones_completed')}</p>
                <p className="text-xl font-bold text-base-content">{completedModules.length}</p>
              </div>
              <span className="text-xs text-base-content/40">{t('dash.last_7_weeks')}</span>
            </div>
            <svg viewBox="0 0 280 80" className="w-full h-20" preserveAspectRatio="none">
              <polyline
                points={weeklyPoints
                  .map((p, i) => `${(i / 6) * 280},${80 - (p / maxPoint) * 70}`)
                  .join(' ')}
                fill="none"
                stroke="currentColor"
                className="text-secondary"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-primary rounded-2xl p-5 text-white flex flex-col justify-between">
              <span className="text-2xl">📘</span>
              <span className="text-lg font-bold mt-2">{modules.length}</span>
              <span className="text-[11px] text-white/70">{t('dash.total_modules')}</span>
            </div>
            <div className="bg-accent rounded-2xl p-5 text-white flex flex-col justify-between">
              <span className="text-2xl">💼</span>
              <span className="text-lg font-bold mt-2">{jobMatchesCount}</span>
              <span className="text-[11px] text-white/70">{t('dash.job_matches')}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mt-5">
          {/* Statistics bars */}
          <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-bold text-base-content mb-4">{t('dash.module_status')}</p>
            <div className="space-y-3">
              {[
                { label: t('dash.status_completed'), count: completedModules.length, color: 'bg-success' },
                { label: t('dash.status_in_progress'), count: inProgressModules.length, color: 'bg-primary' },
                { label: t('dash.status_locked'), count: modules.filter((m) => m.status === 'locked').length, color: 'bg-base-300' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs text-base-content/50 mb-1">
                    <span>{row.label}</span>
                    <span>{row.count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-base-100 overflow-hidden">
                    <div
                      className={`h-full ${row.color}`}
                      style={{ width: `${modules.length > 0 ? (row.count / modules.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status ring */}
          <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
            <div
              className="radial-progress text-primary"
              style={{ '--value': progressPercent, '--size': '6rem', '--thickness': '8px' } as React.CSSProperties}
              role="progressbar"
            >
              <span className="text-base font-bold text-base-content">{progressPercent}%</span>
            </div>
            <p className="text-xs text-base-content/50 mt-3">{t('dash.overall_completion')}</p>
          </div>

          {/* Next milestone / upcoming */}
          <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-bold text-base-content mb-4">{t('dash.next_rec')}</p>
            {nextRecommendedModule ? (
              <>
                <p className="text-sm font-semibold text-base-content mb-1 line-clamp-1">{nextRecommendedModule.title}</p>
                <p className="text-xs text-base-content/50 mb-4 line-clamp-2">{nextRecommendedModule.description}</p>
                <Link
                  href={nextRecommendedModule.status === 'in_progress' ? `/quiz/${nextRecommendedModule.id}` : '/roadmap'}
                  className="btn btn-sm btn-primary rounded-lg w-full"
                >
                  {nextRecommendedModule.status === 'in_progress' ? t('dash.take_quiz') : t('dash.view_roadmap')}
                </Link>
              </>
            ) : (
              <p className="text-xs text-base-content/40 italic">No active modules yet. Start onboarding to build your roadmap.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}