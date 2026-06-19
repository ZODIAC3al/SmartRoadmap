'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useApp } from '@/components/AppContext';

type ResourceEntry = {
  id: string;
  title: string;
  type: 'video' | 'article' | 'project';
  language: 'en' | 'ar';
  moduleTopic: string;
  url: string;
};

export default function AdminContentPage() {
  const { locale } = useApp();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'video' | 'article' | 'project'>('article');
  const [newLang, setNewLang] = useState<'en' | 'ar'>('en');
  const [newTopic, setNewTopic] = useState('React Framework Architecture');
  const [newUrl, setNewUrl] = useState('');

  // Initial mockup resources list matching Qdrant schema
  const [resources, setResources] = useState<ResourceEntry[]>([
    { id: '1', title: 'Comprehensive React rendering guide', type: 'article', language: 'en', moduleTopic: 'React Framework Architecture', url: 'https://react.dev/reference/react' },
    { id: '2', title: 'Advanced React State Patterns video', type: 'video', language: 'en', moduleTopic: 'React Framework Architecture', url: 'https://youtube.com/react-patterns' },
    { id: '3', title: 'Strict Type Compilation manual', type: 'article', language: 'en', moduleTopic: 'TypeScript Strict Mode Interfaces', url: 'https://typescriptlang.org/docs/handbook/2/everyday-types.html' },
    { id: '4', title: 'NestJS Event Gateway boilerplate', type: 'project', language: 'en', moduleTopic: 'NestJS WebSockets', url: 'https://github.com/nestjs/gateway-boilerplate' },
    { id: '5', title: 'Docker containerization guidelines', type: 'article', language: 'en', moduleTopic: 'Docker Containerization', url: 'https://docs.docker.com' },
    { id: '6', title: 'شرح أساسيات رياكت للمبتدئين فيديو', type: 'video', language: 'ar', moduleTopic: 'React Framework Architecture', url: 'https://youtube.com/react-arabic-intro' }
  ]);

  const modulePresets = [
    'React Framework Architecture',
    'TypeScript Strict Mode Interfaces',
    'Tailwind Design System Tokens',
    'NestJS WebSockets',
    'Docker Containerization',
    'MongoDB Indexes'
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('smart_user');
    const storedToken = localStorage.getItem('smart_token');

    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setAdminUser(parsed);
    } catch (e) {
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSimulateAdmin = () => {
    const adminSession = {
      id: 'demo-admin-id',
      name: 'SmartRoadmap SysAdmin',
      email: 'admin@smartroadmap.io',
      role: 'admin'
    };
    localStorage.setItem('smart_user', JSON.stringify(adminSession));
    localStorage.setItem('smart_token', 'demo-token');
    setAdminUser(adminSession);
    toast.success('Admin Session Simulator Enabled!');
  };

  const handleDeleteResource = (id: string, title: string) => {
    if (confirm(`Are you sure you want to permanently delete: ${title}?`)) {
      setResources(prev => prev.filter(r => r.id !== id));
      toast.error(`Deleted resource: ${title}`);
    }
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.error('Please enter all required fields');
      return;
    }

    const newRes: ResourceEntry = {
      id: (resources.length + 1).toString(),
      title: newTitle,
      type: newType,
      language: newLang,
      moduleTopic: newTopic,
      url: newUrl
    };

    setResources([...resources, newRes]);
    setShowAddModal(false);
    setNewTitle('');
    setNewUrl('');
    toast.success(`Successfully index updated! "${newRes.title}" is now mapped to Qdrant semantic indexes.`);
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = 
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.moduleTopic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = 
      typeFilter === 'all' || 
      res.type === typeFilter;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
      </div>
    );
  }

  if (!adminUser || adminUser.role !== 'admin') {
    return (
      <div className="flex flex-col min-h-[85vh] items-center justify-center p-8 text-center bg-base-100">
        <div className="max-w-md bg-base-200 border border-base-300 p-8 rounded-2xl shadow-sm space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            🛡️
          </div>
          <div className="space-y-2">
            <h2 className="text-display-md font-extrabold text-base-content leading-tight">Admin Gate Restriction</h2>
            <p className="text-xs text-base-content/50">
              Only master system operations and platform controllers are authorized to access the content index.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSimulateAdmin}
              className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl font-semibold h-12 w-full"
            >
              Simulate Administrator Login (Demo)
            </button>
            <Link href="/auth/login" className="btn btn-outline border-base-300 text-base-content hover:bg-base-100 rounded-xl h-12 w-full">
              Sign In with Admin Credentials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content pb-8 px-4 sm:px-8 text-start font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb nav */}
        <div className="flex justify-between items-center">
          <Link href="/admin" className="text-caption text-primary hover:underline font-mono">
            ← BACK TO COMMAND
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none btn-xs rounded-lg font-bold px-4"
          >
            + Add New Guide
          </button>
        </div>

        {/* Title */}
        <div className="border-b border-base-300 pb-5">
          <h1 className="text-3xl font-black tracking-tight text-base-content">Learning resource database</h1>
          <p className="text-xs text-base-content/50 mt-1">Configure external video guides, articles, and syllabus projects mapped to dynamic nodes.</p>
        </div>

        {/* Searching & Filter toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="flex-grow max-w-md">
            <input
              type="text"
              placeholder="Search resource title or module topic name..."
              className="input input-bordered w-full rounded-xl bg-base-200 border-base-300 text-xs h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select
              className="select select-bordered rounded-xl bg-base-200 border-base-300 text-xs h-10 min-h-0 focus:border-[#10B981]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Material Types</option>
              <option value="article">Articles & Manuals</option>
              <option value="video">Video Walkthroughs</option>
              <option value="project">Project Repositories</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        <div className="border border-base-300 bg-base-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table w-full text-xs text-start">
              <thead>
                <tr className="border-b border-base-300 bg-base-300">
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono">Resource Title</th>
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono text-center">Material Type</th>
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono text-center">Language</th>
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono">Target Syllabus Node</th>
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-base-content/40 italic">
                      No material records matched your active query.
                    </td>
                  </tr>
                ) : (
                  filteredResources.map((res) => (
                    <tr key={res.id} className="border-b border-base-300/60 hover:bg-base-100/35 transition-colors">
                      
                      {/* Title & Link */}
                      <td className="py-3 px-4 max-w-xs truncate">
                        <div>
                          <a href={res.url} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline text-xs block truncate">
                            {res.title}
                          </a>
                          <span className="text-[9px] text-base-content/40 font-mono block truncate mt-0.5">{res.url}</span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`badge font-bold font-mono text-[9px] py-2 px-2.5 rounded-full ${
                          res.type === 'video' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                          res.type === 'project' ? 'bg-purple-100 text-purple-600 border-purple-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {res.type.toUpperCase()}
                        </span>
                      </td>

                      {/* Language */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-base-content/60">
                        {res.language.toUpperCase()}
                      </td>

                      {/* Module Topic Target */}
                      <td className="py-3 px-4 text-base-content/75 font-semibold">
                        {res.moduleTopic}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-end">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleDeleteResource(res.id, res.title)}
                            className="btn btn-error btn-outline btn-xs rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1. ADD RESOURCE MODAL */}
        {showAddModal && (
          <div className="modal modal-open">
            <div className="modal-box rounded-2xl bg-white border border-gray-200 p-6 text-start space-y-4">
              <h3 className="font-extrabold text-lg text-gray-900">Index Syllabus Material</h3>
              
              <form onSubmit={handleAddResource} className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 font-mono">Resource Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced WebSockets tutorial guides"
                    className="input input-bordered w-full rounded-xl bg-gray-50 border-gray-200 text-xs h-10 text-gray-800"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                {/* URL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 font-mono">Resource Link (URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/websocket-guide"
                    className="input input-bordered w-full rounded-xl bg-gray-50 border-gray-200 text-xs h-10 text-gray-800"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>

                {/* Split grid for type & lang */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 font-mono">Type</label>
                    <select
                      className="select select-bordered w-full rounded-xl bg-gray-50 border-gray-200 text-xs h-10 min-h-0 text-gray-800"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                    >
                      <option value="article">ARTICLE</option>
                      <option value="video">VIDEO</option>
                      <option value="project">PROJECT</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 font-mono">Language</label>
                    <select
                      className="select select-bordered w-full rounded-xl bg-gray-50 border-gray-200 text-xs h-10 min-h-0 text-gray-800"
                      value={newLang}
                      onChange={(e) => setNewLang(e.target.value as any)}
                    >
                      <option value="en">ENGLISH</option>
                      <option value="ar">ARABIC</option>
                    </select>
                  </div>
                </div>

                {/* Module Topic Presets */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 font-mono">Mapped Roadmap Node</label>
                  <select
                    className="select select-bordered w-full rounded-xl bg-gray-50 border-gray-200 text-xs h-10 min-h-0 text-gray-800"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                  >
                    {modulePresets.map((t, i) => (
                      <option key={i} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-150">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-outline border-gray-200 text-xs h-9 min-h-0 rounded-lg px-4"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn bg-[#10B981] hover:bg-[#059669] border-none text-white text-xs h-9 min-h-0 rounded-lg px-4"
                  >
                    Index Material
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
