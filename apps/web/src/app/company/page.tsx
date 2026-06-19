'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Candidate = {
  userId: string;
  name: string;
  email: string;
  targetRole: string;
  progress: number;
  completedMilestones: number;
  verifiedSkills: string[];
  averageQuizScore: number | null;
  quizzesPassed: number;
  cvUploaded: boolean;
};

export default function CompanyPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('smart_user');
    const storedToken = localStorage.getItem('smart_token');

    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    async function fetchCandidates() {
      try {
        const res = await fetch('http://localhost:3000/hiring/candidates');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCandidates(data);
      } catch (e) {
        console.error('Failed fetching candidates list');
      } finally {
        setLoading(false);
      }
    }
    fetchCandidates();
  }, []);

  const handleContact = (candidateName: string) => {
    setContactSuccess(candidateName);
  };

  const filteredCandidates = candidates.filter(cand => {
    const matchesName = cand.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = cand.targetRole.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = cand.verifiedSkills.some(skill => 
      skill.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesName || matchesRole || matchesSkill;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user || user.role !== 'company') {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-8 text-center bg-base-100">
        <h2 className="text-display-md mb-2 font-bold text-base-content">Access Restricted</h2>
        <p className="text-body-sm text-base-content/60 max-w-sm mb-6">
          You must log in with a Recruiter/Company Profile to view pre-vetted candidates.
        </p>
        <Link href="/auth/login" className="btn btn-primary rounded-xl text-white">
          Sign In as Recruiter
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Summary */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-base-300 pb-8">
          <div>
            <div className="text-caption text-primary font-mono font-bold tracking-wider mb-1 uppercase">Pre-Vetted Talent Board</div>
            <h1 className="text-display-lg font-black tracking-tight leading-none text-base-content">
              SmartRoadmap Vetted Candidates
            </h1>
            <p className="text-body-sm text-base-content/60 mt-2">
              Browse software candidates whose skill portfolios are backed by quiz test scores and course milestones.
            </p>
          </div>
        </div>

        {/* Search & Filter tools */}
        <div className="mb-8 max-w-md">
          <div className="form-control">
            <input
              type="text"
              placeholder="Search by candidate name, target role, or verified skill..."
              className="input input-bordered w-full rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Candidates Listing */}
        {filteredCandidates.length === 0 ? (
          <div className="card bg-base-200 border border-base-300 p-8 text-center text-base-content/60 rounded-2xl">
            No candidates matched your search criteria.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredCandidates.map((cand) => (
              <div key={cand.userId} className="card bg-base-200 border border-base-300 hover:border-primary/40 hover:shadow-sm transition-all rounded-2xl">
                <div className="card-body p-6">
                  {/* Candidate Header */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-base-content">{cand.name}</h2>
                      <p className="text-xs text-base-content/60 font-mono mt-0.5">{cand.targetRole}</p>
                    </div>
                    {cand.averageQuizScore !== null && (
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] uppercase tracking-wider text-base-content/40 font-mono font-bold">Quiz Average:</span>
                        <div className="badge badge-success text-white font-bold text-xs mt-0.5 px-2.5 py-3">
                          {cand.averageQuizScore}% Pass
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress milestones */}
                  <div className="mb-4">
                    <div className="flex justify-between items-baseline text-xs mb-1.5 font-mono">
                      <span className="text-base-content/50">Roadmap Progress:</span>
                      <span className="font-bold text-primary">{cand.progress}% ({cand.completedMilestones} completed)</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${cand.progress}%` }}></div>
                    </div>
                  </div>

                  {/* Verified Skills tags */}
                  <div className="mb-6 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-base-content/40 font-mono me-1.5">Verified:</span>
                    {cand.verifiedSkills.length > 0 ? (
                      cand.verifiedSkills.map((skill, idx) => (
                        <span key={idx} className="badge bg-secondary/15 border-secondary/25 font-mono text-[10px] text-secondary rounded-full px-2.5 py-2">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-base-content/50 italic">No milestones verified yet</span>
                    )}
                  </div>

                  {/* Call-to-actions */}
                  <div className="border-t border-base-300 pt-4 flex gap-3 justify-between items-center mt-auto">
                    <span className="text-caption text-base-content/50 font-mono">
                      🎒 {cand.quizzesPassed} Verified Assessments
                    </span>
                    <div className="flex gap-2">
                      <Link
                        href={`/cv`}
                        className={`btn btn-outline btn-xs rounded-lg ${cand.cvUploaded ? 'btn-primary' : 'btn-disabled border-base-300'}`}
                      >
                        Preview CV
                      </Link>
                      <button
                        onClick={() => handleContact(cand.name)}
                        className="btn btn-primary btn-xs rounded-lg text-white"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recruiter contact confirmation modal */}
      {contactSuccess && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl bg-base-200 border border-base-300 text-center">
            <div className="w-16 h-16 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✉️
            </div>
            <h3 className="font-bold text-xl text-primary font-bold">Contact Request Transmitted!</h3>
            <p className="py-4 text-body-sm text-base-content/85">
              A contact invitation has been sent directly to <strong className="text-secondary font-bold">{contactSuccess}</strong>.
            </p>
            <p className="text-xs text-base-content/50 leading-relaxed italic">
              Once they accept your request, their email and contact coordinates will unlock.
            </p>
            <div className="modal-action justify-center mt-6">
              <button onClick={() => setContactSuccess(null)} className="btn btn-primary btn-sm rounded-xl text-white px-8">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
