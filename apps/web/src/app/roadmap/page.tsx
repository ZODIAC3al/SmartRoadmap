'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';

type Module = {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  topics: string[];
  prerequisites: string[];
  status: 'locked' | 'in_progress' | 'completed' | 'failed';
  positionX?: number;
  positionY?: number;
};

type Roadmap = {
  _id: string;
  title: string;
  targetRole: string;
  totalEstimatedHours: number;
  modules: Module[];
};

export default function RoadmapPage() {
  const { t, locale } = useApp();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [userId, setUserId] = useState('654321098765432109876543'); // Default fallback test ID

  useEffect(() => {
    const storedUser = localStorage.getItem('smart_user');
    let activeUserId = '654321098765432109876543';
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.id) {
          activeUserId = u.id;
          setUserId(u.id);
        }
      } catch (e) { }
    }

    async function fetchRoadmap() {
      try {
        const response = await fetch(`http://localhost:3000/roadmap/user/${activeUserId}`);
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();
        setRoadmap(data);

        // Default select the first active/in-progress module
        const activeMod = data.modules.find((m: Module) => m.status === 'in_progress') || data.modules[0];
        if (activeMod) setSelectedModule(activeMod);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchRoadmap();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'badge badge-success';
      case 'in_progress': return 'badge badge-warning animate-pulse';
      case 'failed': return 'badge badge-error';
      default: return 'badge badge-ghost border-base-300';
    }
  };

  const translateStatus = (status: string) => {
    if (locale === 'ar') {
      switch (status) {
        case 'completed': return 'مكتمل';
        case 'in_progress': return 'قيد الدراسة';
        case 'failed': return 'غير مجتاز';
        default: return 'مغلق';
      }
    }
    return status;
  };

  const translateDifficulty = (diff: string) => {
    if (locale === 'ar') {
      switch (diff) {
        case 'beginner': return 'مبتدئ';
        case 'intermediate': return 'متوسط';
        case 'advanced': return 'متقدم';
        default: return diff;
      }
    }
    return diff;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="flex flex-col min-h-screen bg-base-100 items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold mb-2 text-base-content">
          {locale === 'en' ? 'No Active Roadmap Found' : 'لم يتم العثور على خارطة طريق نشطة'}
        </h2>
        <p className="text-base-content/70 max-w-sm mb-6">
          {locale === 'en' 
            ? 'Start by defining your target role and generating a personalized adaptive path.' 
            : 'ابدأ بتحديد دورك الوظيفي المستهدف وإنشاء مسار تعليمي تفاعلي ومخصص.'}
        </p>
        <Link href="/onboarding" className="btn btn-primary">
          {locale === 'en' ? 'Generate Roadmap Now' : 'أنشئ خارطة الطريق الآن'}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content">
      {/* Top Banner */}
      <header className="bg-base-200 border-b border-base-300 py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-caption text-primary font-mono mb-1 uppercase">{t('road.target_role')}</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{roadmap.targetRole}</h1>
            <p className="text-xs sm:text-sm text-base-content/60 mt-1">
              {t('road.title_label')} {roadmap.title} • {roadmap.totalEstimatedHours} {t('road.hours')}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/onboarding" className="btn btn-outline btn-sm">
              {t('road.regenerate')}
            </Link>
            <Link href="/pricing" className="btn btn-primary btn-sm text-white">
              {t('road.upgrade')}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Roadmap Workspace */}
      <main className="flex-grow max-w-6xl mx-auto w-full p-4 sm:p-8 grid md:grid-cols-3 gap-8">

        {/* Modules Timeline Node List */}
        <section className="md:col-span-2 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-4 font-mono">
            {t('road.milestones')}
          </h2>

          <div className="relative border-s border-base-300 ms-4 space-y-8 pb-8">
            {roadmap.modules.map((module, index) => {
              const active = selectedModule?.id === module.id;
              return (
                <div key={module.id} className="relative ps-8 group">
                  {/* Outer circle status ring indicator */}
                  <span className={`absolute -start-3.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 ${module.status === 'completed'
                      ? 'bg-success/10 border-success text-success'
                      : module.status === 'in_progress'
                        ? 'bg-warning/10 border-warning text-warning animate-pulse'
                        : 'bg-base-300 border-base-300 text-base-content/40'
                    } font-mono text-xs font-bold`}>
                    {index + 1}
                  </span>

                  {/* Node Card */}
                  <div
                    onClick={() => setSelectedModule(module)}
                    className={`card bg-base-200 border cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${active ? 'border-primary border-2 shadow-sm bg-base-200/50' : 'border-base-300'
                      }`}
                  >
                    <div className="card-body p-5">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-bold text-sm sm:text-md leading-snug group-hover:text-primary transition-colors">
                          {module.title}
                        </h3>
                        <span className={getStatusBadgeClass(module.status)}>
                          {translateStatus(module.status)}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/70 mt-2 line-clamp-2">{module.description}</p>

                      <div className="flex gap-4 mt-4 text-caption text-base-content/50 font-mono">
                        <span>⏱ {module.estimatedHours} {t('road.hours')}</span>
                        <span>📶 {translateDifficulty(module.difficulty)}</span>
                        {module.prerequisites.length > 0 && (
                          <span>🔗 {locale === 'en' ? 'Prerequisites:' : 'المتطلبات:'} {module.prerequisites.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Selected Module Details Drawer/Panel */}
        <aside className="md:col-span-1">
          {selectedModule ? (
            <div className="card bg-base-200 border border-base-300 shadow-sm sticky top-8">
              <div className="card-body p-6">
                <div className="badge badge-outline badge-primary font-mono text-caption mb-3 uppercase">
                  {translateDifficulty(selectedModule.difficulty)} {locale === 'en' ? 'Milestone' : 'مرحلة'}
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-base-content mb-4">{selectedModule.title}</h3>

                <p className="text-xs sm:text-sm text-base-content/80 mb-6 leading-relaxed">
                  {selectedModule.description}
                </p>

                {/* Topics List */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold tracking-wider uppercase text-base-content/50 mb-3 font-mono">
                    {t('road.syllabus')}
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    {selectedModule.topics.map((topic, i) => (
                      <li key={i} className="flex gap-2 items-center">
                        <span className="text-primary text-xs">◆</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Simulated resources */}
                <div className="mb-8 border-t border-base-300 pt-6">
                  <h4 className="text-xs font-bold tracking-wider uppercase text-base-content/50 mb-3 font-mono">
                    {t('road.resources')}
                  </h4>
                  <div className="space-y-2">
                    <a
                      href={`https://example.com/resources/${selectedModule.id}-articles`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card bg-base-100 border border-base-300 p-3 hover:border-primary transition-colors flex flex-row items-center justify-between text-xs sm:text-sm"
                    >
                      <span>📚 {t('road.study_guide')}</span>
                      <span className="text-primary text-xs">→</span>
                    </a>
                    <a
                      href={`https://example.com/resources/${selectedModule.id}-videos`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card bg-base-100 border border-base-300 p-3 hover:border-primary transition-colors flex flex-row items-center justify-between text-xs sm:text-sm"
                    >
                      <span>🎥 {t('road.video_tutorial')}</span>
                      <span className="text-primary text-xs">→</span>
                    </a>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="card-actions">
                  {selectedModule.status === 'locked' ? (
                    <button disabled className="btn btn-block btn-neutral">
                      {t('road.locked')}
                    </button>
                  ) : (
                    <Link
                      href={`/quiz/${selectedModule.id}`}
                      className="btn btn-block btn-primary text-white"
                    >
                      {t('road.prove_skill')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-base-200 border border-base-300 p-6 text-center text-base-content/50">
              {locale === 'en' 
                ? 'Select a milestone card to view topics and resources.' 
                : 'حدد بطاقة مرحلة تعليمية لعرض الموضوعات ومصادر المذاكرة المخصصة.'}
            </div>
          )}
        </aside>

      </main>
    </div>
  );
}
