'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { toast } from 'react-toastify';

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
  const [userId, setUserId] = useState('654321098765432109876543');

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

        // Select the active/in-progress module by default
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

  const handleTriggerQuiz = (mid: string) => {
    toast.info('Starting adaptive assessment quiz session...');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-green-150 text-[#059669] border border-green-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded">VERIFIED ✓</span>;
      case 'in_progress':
        return <span className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 text-[10px] font-mono font-bold px-2 py-0.5 rounded animate-pulse">ACTIVE ⚡</span>;
      case 'failed':
        return <span className="bg-red-50 text-red-500 border border-red-100 text-[10px] font-mono font-bold px-2 py-0.5 rounded">RETRY ↺</span>;
      default:
        return <span className="bg-base-300 text-base-content/40 border border-base-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded">LOCKED 🔒</span>;
    }
  };

  const getSkillImpact = (title: string) => {
    // Generate a premium simulated skill impact metric
    if (title.toLowerCase().includes('react') || title.toLowerCase().includes('frontend')) {
      return '+15% React Engineering, +8% Architecture';
    }
    if (title.toLowerCase().includes('typescript') || title.toLowerCase().includes('javascript')) {
      return '+20% Type Safety, +12% Programming Logic';
    }
    if (title.toLowerCase().includes('docker') || title.toLowerCase().includes('deployment')) {
      return '+25% Containerization, +10% Cloud Infrastructure';
    }
    if (title.toLowerCase().includes('nest') || title.toLowerCase().includes('backend')) {
      return '+18% API Integration, +15% System Design';
    }
    return '+10% Analytical Diagnosis, +8% Competency';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="flex flex-col min-h-screen bg-base-100 items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-black mb-2 text-base-content tracking-tight">No Active Career Roadmap Found</h2>
        <p className="text-sm text-base-content/50 max-w-sm mb-6">
          Start by defining your target role and completing the assessment wizard.
        </p>
        <Link href="/onboarding" className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl">
          Generate Adaptive Roadmap
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col">
      {/* Top Professional Header */}
      <header className="bg-base-200 border-b border-base-300 py-6 px-4 sm:px-8 text-start">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono">Dynamic syllabus flow</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">{roadmap.targetRole} Roadmap</h1>
            <p className="text-xs text-base-content/50 mt-1 font-semibold">
              Prerequisite DAG • {roadmap.totalEstimatedHours} hours of targeted learning nodes
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/onboarding" className="btn btn-outline border-base-300 text-base-content btn-sm rounded-lg text-xs">
              Re-diagnose & Build
            </Link>
            <Link href="/pricing" className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none btn-sm rounded-lg text-xs font-bold">
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace split */}
      <main className="flex-grow max-w-6xl mx-auto w-full p-4 sm:p-8 grid lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Node Graph Map (Linear Style) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-base-content/40 font-mono">Learning milestones graph</span>
            <span className="text-xs text-base-content/50 font-semibold">Click node to reveal study guides</span>
          </div>

          {/* Interactive node visual stack */}
          <div className="relative border-s-2 border-base-300 ms-6 space-y-8 pb-8 text-start">
            {roadmap.modules.map((module, index) => {
              const active = selectedModule?.id === module.id;
              
              // Define premium node visual styling states
              let cardBorderClass = 'border-base-300 bg-base-200 hover:border-primary/50';
              let circleBg = 'bg-base-200 text-base-content/30 border-base-300';
              
              if (module.status === 'completed') {
                cardBorderClass = 'border-[#10B981]/40 bg-base-200 hover:border-[#10B981]';
                circleBg = 'bg-green-50 text-[#059669] border-[#10B981]';
              } else if (module.status === 'in_progress') {
                cardBorderClass = 'border-[#10B981] bg-base-200 ring-2 ring-[#10B981]/15';
                circleBg = 'bg-[#10B981] text-white border-[#10B981]';
              } else if (module.status === 'failed') {
                cardBorderClass = 'border-red-200 bg-base-200 hover:border-red-300';
                circleBg = 'bg-red-50 text-red-500 border-red-300';
              } else {
                // Locked / Recommended
                const nextInProg = roadmap.modules.find(m => m.status === 'in_progress');
                const isRecommended = nextInProg ? false : index === 0;
                
                if (isRecommended) {
                  cardBorderClass = 'border-dashed border-[#10B981] bg-base-200 hover:bg-base-100';
                  circleBg = 'bg-base-200 text-[#10B981] border-[#10B981]';
                } else {
                  cardBorderClass = 'border-base-300 bg-base-200 opacity-60 cursor-not-allowed';
                  circleBg = 'bg-base-200 text-base-content/20 border-base-300';
                }
              }

              return (
                <div key={module.id} className="relative ps-8 group">
                  {/* Connect circle bullet index */}
                  <span className={`absolute -start-3.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 ${circleBg} font-mono text-[10px] font-black z-10`}>
                    {index + 1}
                  </span>

                  {/* Vetted Node Card Wrapper */}
                  <div
                    onClick={() => {
                      if (module.status !== 'locked' || index === 0) {
                        setSelectedModule(module);
                      } else {
                        toast.warn('This learning node is locked. Please complete prior prerequisites first.');
                      }
                    }}
                    className={`card border rounded-xl cursor-pointer transition-all duration-200 p-5 ${cardBorderClass} ${active ? 'ring-2 ring-[#10B981]/30 shadow-sm' : 'shadow-xs'}`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-extrabold text-xs text-base-content group-hover:text-[#059669] transition-colors leading-tight">
                          {module.title}
                        </h3>
                        <p className="text-[10px] text-base-content/40 font-semibold mt-1">
                          Estimated Hours: <span className="font-bold text-base-content/65">{module.estimatedHours}h</span> • Difficulty: <span className="font-bold uppercase text-base-content/65">{module.difficulty}</span>
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {getStatusBadge(module.status)}
                      </div>
                    </div>

                    {/* Skill Impact Badge */}
                    <div className="border-t border-base-300 mt-4.5 pt-3.5 flex justify-between items-center text-[10px]">
                      <span className="text-base-content/40 font-semibold uppercase tracking-wider font-mono">Skill Impact</span>
                      <span className="font-bold text-[#059669]">{getSkillImpact(module.title)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN: Module details drawer panel */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24">
          {selectedModule ? (
            <div className="card bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm text-start space-y-6">
              <div>
                <span className="text-[10px] text-base-content/40 font-mono font-bold uppercase tracking-wider">Milestone detail panel</span>
                <h3 className="text-lg font-black text-base-content mt-1">{selectedModule.title}</h3>
                <p className="text-xs text-base-content/60 mt-2 leading-relaxed">{selectedModule.description}</p>
              </div>

              {/* Topics stack */}
              <div className="space-y-2">
                <span className="text-[10px] text-base-content/40 font-mono font-bold uppercase tracking-wider block">Syllabus Topics</span>
                <ul className="space-y-1.5 text-xs text-base-content/75">
                  {selectedModule.topics.map((t, idx) => (
                    <li key={idx} className="flex gap-2 items-center">
                      <span className="text-[#10B981] font-bold">◆</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resource List */}
              <div className="border-t border-base-300 pt-4.5 space-y-2">
                <span className="text-[10px] text-base-content/40 font-mono font-bold uppercase tracking-wider block">Vetted Study Guides</span>
                <div className="space-y-2">
                  <a href={`https://example.com/resources/${selectedModule.id}-guide`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-base-100 border border-base-300 rounded-lg text-xs hover:border-[#10B981] transition-colors">
                    <span>📚 Comprehensive Study Guide (RAG)</span>
                    <span className="text-[#10B981] font-bold">→</span>
                  </a>
                  <a href={`https://example.com/resources/${selectedModule.id}-videos`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-base-100 border border-base-300 rounded-lg text-xs hover:border-[#10B981] transition-colors">
                    <span>🎥 Video Walkthrough Tutorials</span>
                    <span className="text-[#10B981] font-bold">→</span>
                  </a>
                </div>
              </div>

              {/* Test action trigger button */}
              <div className="pt-2">
                <Link
                  href={`/quiz/${selectedModule.id}`}
                  onClick={() => handleTriggerQuiz(selectedModule.id)}
                  className="btn btn-block bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl font-bold text-xs h-11"
                >
                  Prove Competency & Verify Skill ⚡
                </Link>
              </div>
            </div>
          ) : (
            <div className="border border-base-300 rounded-2xl bg-base-200 p-6 text-center text-base-content/40 text-xs">
              Select a learning module node to inspect vetted resources.
            </div>
          )}
        </aside>

      </main>
    </div>
  );
}
