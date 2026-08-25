'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  getMyPortfolio,
  savePortfolio,
  publishPortfolio,
  unpublishPortfolio,
  PortfolioData,
  PortfolioProjectData,
} from '@/lib/portfolio';
import { getGitHubRepos, GitHubRepo } from '@/lib/profileImport';
import { PortfolioRenderer } from '../_components/PortfolioRenderer';

export default function PortfolioBuilderPage() {
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    username: '',
    title: 'Developer Portfolio',
    template: 'developer',
    bio: '',
    about: '',
    isPublished: false,
    socialLinks: {},
    skills: [],
    projects: [],
    experience: [],
    education: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [gitHubRepos, setGitHubRepos] = useState<GitHubRepo[]>([]);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getMyPortfolio();
        if (res.success && res.data) {
          setPortfolio(res.data);
        }
      } catch (err) {
        console.error('Failed to load portfolio data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await savePortfolio(portfolio);
      if (res.success && res.data) {
        setPortfolio(res.data);
        toast.success('Portfolio saved successfully!');
      }
    } catch (err: any) {
      toast.error(`Save failed: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      if (portfolio.isPublished) {
        const res = await unpublishPortfolio();
        if (res.success && res.data) {
          setPortfolio(res.data);
          toast.info('Portfolio unpublished (Private draft)');
        }
      } else {
        const res = await publishPortfolio();
        if (res.success && res.data) {
          setPortfolio(res.data);
          toast.success('Portfolio published! Accessible publicly.');
        }
      }
    } catch (err: any) {
      toast.error(`Publish action failed: ${err?.message || 'Server error'}`);
    }
  };

  const openGitHubImport = async () => {
    try {
      const res = await getGitHubRepos();
      if (res.repos && Array.isArray(res.repos)) {
        setGitHubRepos(res.repos);
        setIsGitHubModalOpen(true);
      }
    } catch {
      toast.error('Connect your GitHub account in Profile Settings to import repositories.');
    }
  };

  const importSelectedRepo = (repo: GitHubRepo) => {
    const newProj: PortfolioProjectData = {
      name: repo.name,
      description: repo.description || `GitHub repository: ${repo.name}`,
      technologies: repo.language ? [repo.language] : repo.topics || [],
      githubUrl: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language || undefined,
    };

    setPortfolio((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));
    toast.success(`Imported project "${repo.name}"!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 space-y-3">
        <span className="loading loading-spinner loading-md text-primary"></span>
        <p className="text-xs text-base-content/60 font-mono">Loading Portfolio Builder...</p>
      </div>
    );
  }

  const publicUrl = `/portfolio/${portfolio.username || 'user'}`;

  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content select-none">
      {/* Top Action Header */}
      <header className="sticky top-0 z-40 bg-base-100/90 backdrop-blur-md border-b border-base-300 py-3 px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            🌐
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-none">Portfolio Studio</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`badge badge-xs font-mono font-bold uppercase ${portfolio.isPublished ? 'badge-success text-white' : 'badge-ghost text-base-content/50'}`}>
                {portfolio.isPublished ? 'Published' : 'Draft (Private)'}
              </span>
              {portfolio.isPublished && (
                <Link href={publicUrl} target="_blank" className="text-[10px] text-primary hover:underline font-mono transition-all duration-300 ease-in-out">
                  {publicUrl} ↗
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePublish}
            className={`btn btn-xs sm:btn-sm rounded-2xl font-bold border-none ${
              portfolio.isPublished
                ? 'bg-warning/20 text-warning hover:bg-warning/30'
                : 'bg-success text-white hover:bg-success/90'
            }`}
          >
            {portfolio.isPublished ? 'Unpublish' : 'Publish Portfolio'}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn bg-primary hover:bg-[#701111] text-white btn-xs sm:btn-sm rounded-2xl border-none font-bold px-4 transition-all duration-300 ease-in-out"
          >
            {isSaving && <span className="loading loading-spinner loading-xs mr-1"></span>}
            Save Portfolio
          </button>
        </div>
      </header>

      {/* Main Split Interface */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 items-stretch">
        {/* LEFT COLUMN: FORM CONTROLS */}
        <section className="col-span-1 lg:col-span-6 flex flex-col bg-base-200 border border-base-300 rounded-2xl p-5 space-y-6 overflow-y-auto max-h-[85vh]">
          {/* General Details */}
          <div className="space-y-4 bg-base-100 p-4 rounded-xl border border-base-300">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-base-content">
              General Portfolio Info
            </h3>

            <div className="form-control">
              <label className="label text-[10px] font-bold uppercase text-base-content/50">Portfolio Title</label>
              <input
                type="text"
                value={portfolio.title}
                onChange={(e) => setPortfolio({ ...portfolio, title: e.target.value })}
                className="input input-bordered input-sm bg-base-200 font-bold text-xs"
                placeholder="John Doe - Full Stack Developer Portfolio"
              />
            </div>

            <div className="form-control">
              <label className="label text-[10px] font-bold uppercase text-base-content/50">Bio Headline</label>
              <textarea
                value={portfolio.bio}
                onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
                className="textarea textarea-bordered textarea-xs bg-base-200 font-semibold h-16 resize-none"
                placeholder="Passionate engineer building web applications with React, Next.js & NestJS."
              />
            </div>
          </div>

          {/* Template Chooser */}
          <div className="space-y-3 bg-base-100 p-4 rounded-xl border border-base-300">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-base-content">
              Choose Template
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { id: 'developer', name: 'Developer', desc: 'Dark tech hero & repo grid' },
                { id: 'modern', name: 'Modern', desc: 'Sleek gradient & showcase' },
                { id: 'minimal', name: 'Minimal', desc: 'Clean typography layout' },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setPortfolio({ ...portfolio, template: tpl.id as any })}
                  className={`p-3 rounded-xl border transition-all text-xs font-extrabold ${
                    portfolio.template === tpl.id
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-base-200 border-base-300 text-base-content/70 hover:border-base-400'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Projects & GitHub Import */}
          <div className="space-y-4 bg-base-100 p-4 rounded-xl border border-base-300">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-base-content">
                Projects ({portfolio.projects?.length || 0})
              </h3>
              <button
                type="button"
                onClick={openGitHubImport}
                className="btn btn-xs btn-outline border-primary text-primary hover:bg-primary/10 rounded-2xl font-bold transition-all duration-300 ease-in-out"
              >
                💻 Import GitHub Repos
              </button>
            </div>

            <div className="space-y-3">
              {portfolio.projects && portfolio.projects.map((proj, i) => (
                <div key={i} className="bg-base-200 border border-base-300 p-3 rounded-xl space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...portfolio.projects];
                      updated.splice(i, 1);
                      setPortfolio({ ...portfolio, projects: updated });
                    }}
                    className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost text-error"
                  >
                    ×
                  </button>
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) => {
                      const updated = [...portfolio.projects];
                      updated[i].name = e.target.value;
                      setPortfolio({ ...portfolio, projects: updated });
                    }}
                    className="input input-bordered input-xs bg-base-100 font-extrabold w-full"
                    placeholder="Project Name"
                  />
                  <textarea
                    value={proj.description || ''}
                    onChange={(e) => {
                      const updated = [...portfolio.projects];
                      updated[i].description = e.target.value;
                      setPortfolio({ ...portfolio, projects: updated });
                    }}
                    className="textarea textarea-bordered textarea-xs bg-base-100 font-medium w-full h-14"
                    placeholder="Project description..."
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: LIVE RENDERED PREVIEW SHEET */}
        <section className="col-span-1 lg:col-span-6 flex flex-col bg-base-300 border border-base-300 rounded-2xl p-4 overflow-hidden max-h-[85vh] shadow-inner">
          <div className="w-full flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">
              Live Responsive Preview ({portfolio.template})
            </span>
          </div>

          <div className="flex-grow w-full bg-slate-950 rounded-xl overflow-y-auto border border-base-300">
            <PortfolioRenderer portfolio={portfolio} />
          </div>
        </section>
      </div>

      {/* GitHub Repo Selector Modal */}
      {isGitHubModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="card w-full max-w-md bg-base-200 border border-base-300 text-base-content p-6 rounded-2xl shadow-2xl relative text-start">
            <button
              onClick={() => setIsGitHubModalOpen(false)}
              className="absolute top-3 right-3 btn btn-circle btn-xs btn-ghost"
            >
              ×
            </button>
            <h3 className="font-extrabold text-sm mb-3">Import Repositories to Portfolio</h3>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {gitHubRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-3 bg-base-100 border border-base-300 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-extrabold block">{repo.name}</span>
                    <span className="text-[10px] text-base-content/50 font-mono">⭐ {repo.stargazers_count || 0}</span>
                  </div>
                  <button
                    onClick={() => importSelectedRepo(repo)}
                    className="btn btn-xs bg-primary text-white border-none rounded font-bold"
                  >
                    + Import
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
