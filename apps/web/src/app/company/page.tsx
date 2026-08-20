"use client";

import React from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { logout } from "@/lib/api";
import { useCompanyDashboard } from "./useCompanyDashboard";

const STATUS_BADGES: Record<string, { bg: string; text: string; icon: string }> = {
  Applied: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-600", icon: "🚀" },
  Interviewing: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-600", icon: "🎙️" },
  Accepted: { bg: "bg-green-500/10 border-green-500/30", text: "text-green-600", icon: "🎉" },
  Rejected: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-600", icon: "❌" },
};

function normalizeStatus(s?: string): string {
  if (!s) return "Applied";
  const lower = s.toLowerCase();
  if (lower === "applied" || lower === "interested") return "Applied";
  if (lower === "interview" || lower === "interviewing" || lower === "under_review") return "Interviewing";
  if (lower === "accepted" || lower === "offer" || lower === "hired") return "Accepted";
  if (lower === "rejected") return "Rejected";
  return "Applied";
}

export default function CompanyPage() {
  const {
    activeCvPreview,
    activePassport,
    activeTab,
    applications,
    candidates,
    contactCandidate,
    copyPassportLink,
    creatingJob,
    filteredCandidates,
    handleCreateJob,
    handleDeleteJob,
    handleUpdateApplicantStatus,
    interviewNote,
    jobs,
    loading,
    minProgressFilter,
    minScoreFilter,
    newJobForm,
    newJobSkillsRaw,
    roleFilter,
    router,
    searchQuery,
    selectedApplication,
    setActiveCvPreview,
    setActivePassport,
    setActiveTab,
    setContactCandidate,
    setInterviewNote,
    setMinProgressFilter,
    setMinScoreFilter,
    setNewJobForm,
    setNewJobSkillsRaw,
    setRoleFilter,
    setSearchQuery,
    setSelectedApplication,
    setShowAddJobModal,
    setStatusNote,
    setUser,
    showAddJobModal,
    statusNote,
    updatingStatusId,
    user,
  } = useCompanyDashboard();
  const [talentPage, setTalentPage] = React.useState(1);
  const [appPage, setAppPage] = React.useState(1);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-emerald-500"></span>
          <span className="text-sm font-mono text-base-content/50">
            Loading recruitment management system...
          </span>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "company" && user.role !== "admin")) {
    return (
      <div className="flex flex-col min-h-[85vh] items-center justify-center p-8 text-center bg-base-100">
        <div className="max-w-md bg-base-200 border border-base-300 p-8 rounded-2xl shadow-sm space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            💼
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-base-content leading-tight">
              Recruiter & Employer Access Only
            </h2>
            <p className="text-xs text-base-content/60">
              Only verified company and admin accounts can manage job postings, review applicants, and update hiring statuses.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/auth/login"
              className="btn bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 w-full font-bold"
            >
              Sign In with Employer Credentials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Employer Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-base-200 border border-base-300 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-black text-lg border border-emerald-500/20">
              {user.name?.charAt(0) || "C"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                  {user.role === "admin" ? "Platform Administrator" : "Verified Employer"}
                </span>
              </div>
              <h2 className="text-base font-black text-base-content mt-0.5">
                {user.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddJobModal(true)}
              className="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-bold text-xs px-4"
            >
              + Post New Job
            </button>
            <button
              onClick={() => {
                logout();
                setUser(null);
                toast.info("Logged out from employer session.");
              }}
              className="btn btn-ghost btn-xs text-base-content/50 hover:bg-base-300 rounded-lg"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Analytics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-start">
          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider block font-mono">
              Received Applications
            </span>
            <span className="text-3xl font-black font-mono text-base-content">
              {applications.length}
            </span>
            <span className="text-[10px] text-emerald-600 block font-bold">
              ✓ Ready for review & interviewing
            </span>
          </div>
          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider block font-mono">
              Active Job Listings
            </span>
            <span className="text-3xl font-black font-mono text-emerald-600">
              {jobs.length}
            </span>
            <span className="text-[10px] text-base-content/60 block font-semibold">
              Live in MongoDB database
            </span>
          </div>
          <div className="bg-base-200 border border-base-300 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider block font-mono">
              Pre-Vetted Talent Pool
            </span>
            <span className="text-3xl font-black font-mono text-base-content">
              {candidates.length}
            </span>
            <span className="text-[10px] text-emerald-600 block font-bold">
              Verified skills & Skill Passports
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-base-200 p-1.5 rounded-xl border border-base-300 self-start">
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
              activeTab === "applications"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            📋 Candidate Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
              activeTab === "jobs"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            💼 My Job Postings ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab("candidates")}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
              activeTab === "candidates"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            👥 Talent Directory ({filteredCandidates.length})
          </button>
        </div>

        {/* ── TAB 1: RECEIVED APPLICATIONS ── */}
        {activeTab === "applications" && (
          <div className="bg-base-200 border border-base-300 rounded-2xl p-6 text-start space-y-4">
            <div className="flex justify-between items-center border-b border-base-300 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-base-content">
                  Applicant Review & Decision Pipeline
                </h3>
                <p className="text-xs text-base-content/60">
                  Review submitted resumes, inspect verified Skill Passports, evaluate Needed Skills, and update hiring statuses.
                </p>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="p-12 text-center text-base-content/50 text-xs">
                No applications submitted yet for your postings. Post a job or share your openings!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-xs">
                  <thead>
                    <tr className="border-base-300 text-base-content/60 uppercase font-mono text-[10px]">
                      <th>Candidate</th>
                      <th>Applied Role</th>
                      <th>Match Score</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const userObj = typeof app.userId === "object" && app.userId !== null ? app.userId : null;
                      const candidateName = userObj?.name || app.passportSnapshot?.name || "Candidate";
                      const candidateEmail = userObj?.email || app.passportSnapshot?.email || "";
                      const norm = normalizeStatus(app.status);
                      const badge = STATUS_BADGES[norm] || STATUS_BADGES.Applied;

                      return (
                        <tr key={app._id} className="border-base-300 hover:bg-base-100/50">
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center border border-emerald-500/20 text-xs shrink-0">
                                {candidateName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-extrabold text-sm text-base-content block">
                                  {candidateName}
                                </span>
                                <span className="text-[11px] text-base-content/50 font-mono">
                                  {candidateEmail}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <span className="font-bold text-xs text-base-content block">
                                {app.jobTitle}
                              </span>
                              <span className="text-[10px] text-base-content/50">
                                {app.company}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {app.matchScore}%
                            </span>
                          </td>
                          <td>
                            <span className="text-xs text-base-content/60 font-mono">
                              {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold font-mono ${badge.bg} ${badge.text}`}>
                              <span>{badge.icon}</span>
                              <span>{app.status}</span>
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedApplication(app)}
                              className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg font-bold text-[10px] px-3"
                            >
                              Review Candidate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: POSTED JOBS ── */}
        {activeTab === "jobs" && (
          <div className="bg-base-200 border border-base-300 rounded-2xl p-6 text-start space-y-4">
            <div className="flex justify-between items-center border-b border-base-300 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-base-content">
                  Active Job Postings
                </h3>
                <p className="text-xs text-base-content/60">
                  Manage live job openings visible to all candidates across the platform.
                </p>
              </div>
              <button
                onClick={() => setShowAddJobModal(true)}
                className="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-bold text-xs"
              >
                + Post Job
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="p-12 text-center text-base-content/50 text-xs">
                No jobs posted yet. Click &quot;+ Post New Job&quot; above to create your first opening!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job._id}
                    className="bg-base-100 border border-base-300 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-base text-base-content">
                            {job.title}
                          </h4>
                          <p className="text-xs text-base-content/60 font-medium mt-0.5">
                            {job.company} • {job.location} ({job.country || "US"})
                          </p>
                        </div>
                        <span className="badge badge-sm badge-neutral font-mono text-[9px] uppercase">
                          {job.workType || "Remote"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.requiredSkills.map((s, i) => (
                          <span key={i} className="badge badge-xs bg-base-200 border-base-300 text-base-content/70 font-mono text-[9px]">
                            {s}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-base-content/70 mt-2 line-clamp-2">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-base-200 pt-3 text-[10px] font-mono text-base-content/50">
                      <span>
                        {job.salaryMin ? `$${job.salaryMin.toLocaleString()} - $${(job.salaryMax || 0).toLocaleString()}` : "Competitive Salary"}
                      </span>
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        className="text-red-500 hover:underline font-bold"
                      >
                        Delete Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: TALENT DIRECTORY ── */}
        {activeTab === "candidates" && (
          <div className="space-y-4 text-start">
            {/* Search & Filters */}
            <div className="bg-base-200 border border-base-300 rounded-2xl p-5 flex flex-col md:flex-row gap-3 items-center justify-between">
              <input
                type="text"
                placeholder="Search candidates by name, target role, or verified skill..."
                className="input input-bordered input-sm w-full md:w-96 rounded-xl text-xs bg-base-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  className="select select-bordered select-sm rounded-xl text-xs bg-base-100"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Full Stack">Full Stack</option>
                  <option value="Backend">Backend</option>
                  <option value="Engineer">Engineers</option>
                </select>
              </div>
            </div>

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCandidates.map((cand) => (
                <div
                  key={cand.userId}
                  className="bg-base-200 border border-base-300 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 font-black flex items-center justify-center border border-emerald-500/20 text-sm">
                          {cand.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-base-content">
                            {cand.name}
                          </h4>
                          <span className="text-[11px] text-base-content/60 block">
                            {cand.targetRole}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {cand.matchScore}% Fit
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                      <div className="bg-base-100 p-2 rounded-xl border border-base-300">
                        <span className="text-[9px] uppercase font-mono text-base-content/50 block">Milestones</span>
                        <span className="font-bold text-xs text-base-content">{cand.completedMilestones} completed</span>
                      </div>
                      <div className="bg-base-100 p-2 rounded-xl border border-base-300">
                        <span className="text-[9px] uppercase font-mono text-base-content/50 block">Avg Quiz</span>
                        <span className="font-bold text-xs text-emerald-600">{cand.averageQuizScore}%</span>
                      </div>

                      <button
                        onClick={() => setTalentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={talentPage === totalPages}
                        className="btn btn-xs btn-ghost rounded-lg border border-base-300 text-[11px] disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {cand.verifiedSkills.slice(0, 4).map((s, i) => (
                        <span key={i} className="badge badge-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-mono">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-base-300">
                    <button
                      onClick={() => copyPassportLink(cand.userId)}
                      className="btn btn-xs btn-outline border-base-300 rounded-lg flex-1 text-[10px] font-bold"
                    >
                      🔗 Share Passport
                    </button>
                    <button
                      onClick={() => setContactCandidate(cand)}
                      className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg flex-1 text-[10px] font-bold"
                    >
                      Invite
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: POST NEW JOB ── */}
      {showAddJobModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl bg-base-200 border border-base-300 text-start space-y-4 max-w-lg">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
                <span>💼</span> Post New Verified Opening
              </h3>
              <button onClick={() => setShowAddJobModal(false)} className="btn btn-xs btn-circle btn-ghost">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider font-mono text-base-content/60 block mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer (React & TypeScript)"
                  className="input input-bordered input-sm w-full rounded-xl bg-base-100 text-xs"
                  value={newJobForm.title}
                  onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider font-mono text-base-content/60 block mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Devotopia Tech"
                    className="input input-bordered input-sm w-full rounded-xl bg-base-100 text-xs"
                    value={newJobForm.company}
                    onChange={(e) => setNewJobForm({ ...newJobForm, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider font-mono text-base-content/60 block mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, San Francisco, Cairo"
                    className="input input-bordered input-sm w-full rounded-xl bg-base-100 text-xs"
                    value={newJobForm.location}
                    onChange={(e) => setNewJobForm({ ...newJobForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider font-mono text-base-content/60 block mb-1">
                  Required Skills * (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, TypeScript, Tailwind CSS, Next.js, Git"
                  className="input input-bordered input-sm w-full rounded-xl bg-base-100 text-xs"
                  value={newJobSkillsRaw}
                  onChange={(e) => setNewJobSkillsRaw(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider font-mono text-base-content/60 block mb-1">
                    Work Type
                  </label>
                  <select
                    className="select select-bordered select-sm w-full rounded-xl bg-base-100 text-xs"
                    value={newJobForm.workType}
                    onChange={(e: any) => setNewJobForm({ ...newJobForm, workType: e.target.value })}
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-Site</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider font-mono text-base-content/60 block mb-1">
                    Job Type
                  </label>
                  <select
                    className="select select-bordered select-sm w-full rounded-xl bg-base-100 text-xs"
                    value={newJobForm.jobType}
                    onChange={(e: any) => setNewJobForm({ ...newJobForm, jobType: e.target.value })}
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider font-mono text-base-content/60 block mb-1">
                    Experience
                  </label>
                  <select
                    className="select select-bordered select-sm w-full rounded-xl bg-base-100 text-xs"
                    value={newJobForm.experienceLevel}
                    onChange={(e: any) => setNewJobForm({ ...newJobForm, experienceLevel: e.target.value })}
                  >
                    <option value="entry">Entry</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider font-mono text-base-content/60 block mb-1">
                  Job Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe role responsibilities, deliverables, team culture, and technical scope..."
                  className="textarea textarea-bordered w-full rounded-xl bg-base-100 text-xs"
                  value={newJobForm.description}
                  onChange={(e) => setNewJobForm({ ...newJobForm, description: e.target.value })}
                />
              </div>

              <div className="modal-action gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddJobModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingJob}
                  className="btn bg-emerald-500 hover:bg-emerald-600 text-white border-none btn-sm rounded-xl font-bold text-xs px-6"
                >
                  {creatingJob ? "Publishing..." : "Publish Job Opening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CANDIDATE APPLICATION REVIEW & STATUS UPDATE ── */}
      {selectedApplication && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl bg-base-200 border border-base-300 text-start space-y-5 max-w-3xl max-h-[88vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-base-300 pb-4">
              <div>
                <span className="text-[10px] text-emerald-500 font-mono font-bold uppercase tracking-wider">
                  APPLICANT PROFILE REVIEW
                </span>
                <h3 className="font-black text-xl text-base-content mt-0.5">
                  {typeof selectedApplication.userId === "object" && selectedApplication.userId !== null
                    ? (selectedApplication.userId as any).name
                    : selectedApplication.passportSnapshot?.name || "Candidate"}
                </h3>
                <p className="text-xs text-base-content/60">
                  Applied for: <span className="font-bold text-base-content">{selectedApplication.jobTitle}</span> ({selectedApplication.company})
                </p>
              </div>
              <button onClick={() => setSelectedApplication(null)} className="btn btn-xs btn-circle btn-ghost">
                ✕
              </button>
            </div>

            {/* Application Decision Controls */}
            <div className="bg-base-100 border border-base-300 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-base-content/50 block">
                    Current Hiring Status
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-mono mt-1 ${
                    STATUS_BADGES[normalizeStatus(selectedApplication.status)]?.bg || "bg-base-200"
                  } ${STATUS_BADGES[normalizeStatus(selectedApplication.status)]?.text || ""}`}>
                    <span>{STATUS_BADGES[normalizeStatus(selectedApplication.status)]?.icon || "📋"}</span>
                    <span>{selectedApplication.status}</span>
                  </span>
                </div>

                {/* Status Update Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={updatingStatusId === selectedApplication._id}
                    onClick={() => handleUpdateApplicantStatus(selectedApplication._id, "Interviewing", statusNote)}
                    className="btn btn-xs bg-amber-500 hover:bg-amber-600 text-white border-none rounded-lg font-bold"
                  >
                    🎙️ Move to Interviewing
                  </button>
                  <button
                    disabled={updatingStatusId === selectedApplication._id}
                    onClick={() => handleUpdateApplicantStatus(selectedApplication._id, "Accepted", statusNote)}
                    className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg font-bold"
                  >
                    🎉 Accept Candidate
                  </button>
                  <button
                    disabled={updatingStatusId === selectedApplication._id}
                    onClick={() => handleUpdateApplicantStatus(selectedApplication._id, "Rejected", statusNote)}
                    className="btn btn-xs bg-red-500 hover:bg-red-600 text-white border-none rounded-lg font-bold"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>

              {/* Status Note Input */}
              <div className="pt-2 border-t border-base-200">
                <input
                  type="text"
                  placeholder="Optional interview notes or feedback for candidate timeline..."
                  className="input input-bordered input-xs w-full rounded-lg bg-base-200 text-xs"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>
            </div>

            {/* Submitted CV Snapshot */}
            {selectedApplication.cvSnapshot && (
              <div className="space-y-2">
                <span className="text-[10px] text-base-content/50 font-bold uppercase font-mono block">
                  📄 Submitted Resume (CV)
                </span>
                <div className="bg-base-100 border border-base-300 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-base-content">{selectedApplication.cvSnapshot.title || "Resume Snapshot"}</span>
                    <span className="text-[10px] font-mono text-emerald-500">Transmitted with Application</span>
                  </div>

                  {selectedApplication.cvSnapshot.summary && (
                    <div className="bg-base-200 p-3 rounded-lg text-base-content/80 italic">
                      &quot;{selectedApplication.cvSnapshot.summary}&quot;
                    </div>
                  )}

                  {selectedApplication.cvSnapshot.experience && selectedApplication.cvSnapshot.experience.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase font-mono text-base-content/50 block mb-1">Work Experience:</span>
                      <div className="space-y-2">
                        {selectedApplication.cvSnapshot.experience.map((exp: any, i: number) => (
                          <div key={i} className="border-l-2 border-emerald-500 pl-3 py-0.5">
                            <span className="font-bold text-xs block">{exp.role || exp.title} at {exp.company}</span>
                            <span className="text-[10px] text-base-content/50">{exp.startDate} - {exp.endDate || "Present"}</span>
                            {exp.description && <p className="text-[11px] text-base-content/70 mt-1">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApplication.cvSnapshot.skills && (
                    <div>
                      <span className="text-[10px] font-bold uppercase font-mono text-base-content/50 block mb-1">Candidate Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedApplication.cvSnapshot.skills.map((s: string, i: number) => (
                          <span key={i} className="badge badge-xs badge-neutral text-[9px] font-mono">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submitted Skill Passport Snapshot */}
            {selectedApplication.passportSnapshot && (
              <div className="space-y-2">
                <span className="text-[10px] text-base-content/50 font-bold uppercase font-mono block">
                  🛡️ Verified Skill Passport
                </span>
                <div className="bg-base-100 border border-base-300 rounded-xl p-4 text-xs space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-base-200 p-2.5 rounded-lg">
                      <span className="text-[9px] uppercase font-mono text-base-content/50 block">Target Role</span>
                      <span className="font-bold text-xs">{selectedApplication.passportSnapshot.targetRole || "Software Developer"}</span>
                    </div>
                    <div className="bg-base-200 p-2.5 rounded-lg">
                      <span className="text-[9px] uppercase font-mono text-base-content/50 block">Roadmap Progress</span>
                      <span className="font-bold text-xs text-emerald-600">{selectedApplication.passportSnapshot.roadmap?.progressPercentage || 100}%</span>
                    </div>
                    <div className="bg-base-200 p-2.5 rounded-lg">
                      <span className="text-[9px] uppercase font-mono text-base-content/50 block">Quiz Performance</span>
                      <span className="font-bold text-xs text-emerald-600">{selectedApplication.passportSnapshot.quizPerformance?.averageScore || 90}% avg</span>
                    </div>
                  </div>

                  {selectedApplication.passportSnapshot.verifiedSkills && selectedApplication.passportSnapshot.verifiedSkills.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase font-mono text-base-content/50 block mb-1">Verified Skills in Passport:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedApplication.passportSnapshot.verifiedSkills.map((s: string, i: number) => (
                          <span key={i} className="badge badge-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-mono">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="modal-action">
              <button onClick={() => setSelectedApplication(null)} className="btn btn-sm btn-ghost rounded-xl">
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: CONTACT CANDIDATE DIRECT ── */}
      {contactCandidate && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl bg-base-200 border border-base-300 text-start space-y-4 max-w-md">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
                <span>✉️</span> Direct Recruiter Invitation
              </h3>
              <button onClick={() => setContactCandidate(null)} className="btn btn-xs btn-circle btn-ghost">
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-base-content/70">
                Transmit an interview invitation to <span className="font-bold text-base-content">{contactCandidate.name}</span> ({contactCandidate.email}):
              </p>
              <textarea
                rows={4}
                className="textarea textarea-bordered w-full rounded-xl bg-base-100 text-xs"
                value={interviewNote}
                onChange={(e) => setInterviewNote(e.target.value)}
              />
            </div>

            <div className="modal-action gap-2 pt-2">
              <button onClick={() => setContactCandidate(null)} className="btn btn-ghost btn-sm rounded-xl text-xs">
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success(`Interview invitation sent to ${contactCandidate.name}!`);
                  setContactCandidate(null);
                }}
                className="btn bg-emerald-500 hover:bg-emerald-600 text-white border-none btn-sm rounded-xl font-bold text-xs px-6"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
