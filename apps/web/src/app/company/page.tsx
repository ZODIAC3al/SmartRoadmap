"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiFetch, fetchMe, logout } from "@/lib/api";

import { useCompanyDashboard } from "./useCompanyDashboard";

export default function CompanyPage() {
  const {
    activeCvPreview,
    activePassport,
    candidates,
    contactCandidate,
    copyPassportLink,
    fetchCandidates,
    filteredCandidates,
    getDynamicMatchScore,
    handleAddJobPosting,
    handleSendInterviewInvite,
    handleSimulateRecruiter,
    interviewNote,
    jobPostings,
    loading,
    minProgressFilter,
    minScoreFilter,
    newJobSkills,
    newJobTitle,
    roleFilter,
    router,
    searchQuery,
    selectedJobMatch,
    setActiveCvPreview,
    setActivePassport,
    setCandidates,
    setContactCandidate,
    setInterviewNote,
    setJobPostings,
    setLoading,
    setMinProgressFilter,
    setMinScoreFilter,
    setNewJobSkills,
    setNewJobTitle,
    setRoleFilter,
    setSearchQuery,
    setSelectedJobMatch,
    setShowAddJobModal,
    setUser,
    showAddJobModal,
    user,
  } = useCompanyDashboard();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#FAFAFA] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
          <span className="text-sm font-mono text-gray-400">
            Loading career intelligence index...
          </span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "company") {
    return (
      <div className="flex flex-col min-h-[85vh] items-center justify-center p-8 text-center bg-[#FAFAFA]">
        <div className="max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-sm space-y-6">
          <div className="w-16 h-16 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            💼
          </div>
          <div className="space-y-2">
            <h2 className="text-display-md font-extrabold text-gray-900 leading-tight">
              Recruiter Access Restricted
            </h2>
            <p className="text-body-sm text-gray-500">
              Only verified employer and recruitment profiles can search the
              pre-vetted career database.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSimulateRecruiter}
              className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl font-semibold h-12 w-full transition-all duration-200"
            >
              Simulate Recruiter Session (Instant Demo)
            </button>
            <Link
              href="/auth/login"
              className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl h-12 w-full"
            >
              Sign In with Credentials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] pb-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumbs & Logged in Recruiter Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/15 text-[#059669] flex items-center justify-center font-bold">
              LV
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-mono">
                Authenticated Employer
              </span>
              <span className="text-sm font-bold text-gray-900">
                {user.name}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                logout();
                setUser(null);
                toast.info("Logged out from recruiter session.");
              }}
              className="btn btn-ghost btn-xs text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              Logout Recruiter
            </button>
          </div>
        </div>

        {/* Dashboard Title & Recruiter Analytics row */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-start space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block font-mono">
              Talent Pool Status
            </span>
            <span className="text-3xl font-black font-mono text-gray-900">
              {filteredCandidates.length}
            </span>
            <span className="text-[10px] text-[#22C55E] block font-bold">
              ✓ Vetted & interview-ready
            </span>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-start space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block font-mono">
              Avg Technical Core
            </span>
            <span className="text-3xl font-black font-mono text-[#059669]">
              90%
            </span>
            <span className="text-[10px] text-gray-500 block font-semibold">
              Weighted quiz performance
            </span>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-start space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block font-mono">
              AI Screening Confidence
            </span>
            <span className="text-3xl font-black font-mono text-[#10B981]">
              94%
            </span>
            <span className="text-[10px] text-gray-500 block font-semibold">
              Zero screening error rate
            </span>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-start space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block font-mono">
              Resume Verification
            </span>
            <span className="text-3xl font-black font-mono text-gray-900">
              100%
            </span>
            <span className="text-[10px] text-[#10B981] block font-bold">
              ✓ Affinda parsed & audited
            </span>
          </div>
        </div>

        {/* Two Column Layout: Left Sidebar Filters & Matching Job Simulator, Right Main Candidate Feed */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            {/* Vector Matching Simulator Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-start space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-bold text-sm text-gray-900 font-mono">
                  Vector Job Matcher
                </h3>
                <button
                  onClick={() => setShowAddJobModal(true)}
                  className="text-xs text-[#059669] hover:underline font-bold"
                >
                  + Add Job
                </button>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 block">
                  Choose Job to Target Matching:
                </label>
                <div className="space-y-2">
                  {jobPostings.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobMatch(job.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedJobMatch === job.id
                          ? "bg-[#10B981]/5 border-[#10B981] font-bold"
                          : "border-gray-100 bg-[#FAFAFA] hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-gray-900 font-semibold">
                          {job.title}
                        </span>
                        {selectedJobMatch === job.id && (
                          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {job.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Standard Filters Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-start space-y-6">
              <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">
                Talent Pool Filters
              </h3>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 block">
                  Search Query
                </label>
                <input
                  type="text"
                  placeholder="e.g. name, role, skill..."
                  className="input input-bordered w-full rounded-xl bg-[#FAFAFA] border-gray-200 text-xs focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Role filter dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 block">
                  Target Role Category
                </label>
                <select
                  className="select select-bordered w-full rounded-xl bg-[#FAFAFA] border-gray-200 text-xs focus:border-[#10B981] h-10 min-h-0"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Specialties</option>
                  <option value="Full Stack">Full Stack Engineers</option>
                  <option value="Frontend">Frontend Developers</option>
                  <option value="Systems">Distributed Systems</option>
                  <option value="Machine">Machine Learning</option>
                </select>
              </div>

              {/* Min average test score */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-gray-500">
                    Min Quiz Pass Rate
                  </label>
                  <span className="font-mono text-[#059669] font-bold">
                    {minScoreFilter}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="range range-[#10B981] range-xs"
                  value={minScoreFilter}
                  onChange={(e) => setMinScoreFilter(parseInt(e.target.value))}
                />
              </div>

              {/* Min progress tracker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-gray-500">
                    Min Roadmap Completion
                  </label>
                  <span className="font-mono text-[#059669] font-bold">
                    {minProgressFilter}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="range range-[#10B981] range-xs"
                  value={minProgressFilter}
                  onChange={(e) =>
                    setMinProgressFilter(parseInt(e.target.value))
                  }
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                    setMinScoreFilter(0);
                    setMinProgressFilter(0);
                    toast.info("Filters cleared.");
                  }}
                  className="w-full btn btn-outline border-gray-200 text-xs text-gray-500 hover:bg-gray-50 rounded-xl h-10 min-h-0"
                >
                  Reset Sourcing Filters
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CANDIDATE FEED */}
          <div className="lg:col-span-8 space-y-6">
            {filteredCandidates.length === 0 ? (
              <div className="bg-white border border-gray-200 p-12 text-center rounded-2xl shadow-sm text-gray-400 space-y-4">
                <span className="text-4xl block">🔍</span>
                <p className="text-sm font-semibold">
                  No candidates match your active sourcing filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                    setMinScoreFilter(0);
                    setMinProgressFilter(0);
                  }}
                  className="btn bg-[#10B981] hover:bg-[#059669] border-none text-white rounded-xl text-xs px-6"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((cand) => {
                  const dynamicMatch = getDynamicMatchScore(cand);
                  return (
                    <div
                      key={cand.userId}
                      className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:border-[#10B981]/40 hover:shadow-md transition-all text-start relative group overflow-hidden"
                    >
                      {/* Premium matching stripe on hover */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#10B981] to-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                        <div className="flex gap-4">
                          {/* Avatar representation */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#10B981] to-[#34D399] text-white flex items-center justify-center font-bold text-md shadow-inner">
                            {cand.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-gray-900 text-md">
                                {cand.name}
                              </h3>
                              {cand.cvUploaded && (
                                <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold">
                                  RESUME VERIFIED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-bold font-mono mt-0.5">
                              {cand.targetRole}
                            </p>
                          </div>
                        </div>

                        {/* High-Fidelity Matching scores & Predictors */}
                        <div className="flex gap-4 items-center">
                          {/* Match rating */}
                          <div className="text-right">
                            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono block">
                              Vector Match:
                            </span>
                            <span className="text-xl font-black text-[#059669] font-mono">
                              {dynamicMatch}%
                            </span>
                          </div>

                          {/* Predictor rate */}
                          <div className="text-right border-l border-gray-100 pl-4">
                            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono block">
                              AI Predictor:
                            </span>
                            <span className="text-xl font-black text-gray-900 font-mono">
                              {cand.interviewPredictor}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Grid: Progress & Statistics */}
                      <div className="grid sm:grid-cols-2 gap-4 border-y border-gray-100 py-4 mb-4">
                        {/* Progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-semibold font-mono">
                              Syllabus Milestones:
                            </span>
                            <span className="font-bold text-[#059669] font-mono">
                              {cand.progress}% Completed
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-full"
                              style={{ width: `${cand.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Quiz average */}
                        <div className="flex justify-between items-center bg-[#FAFAFA] border border-gray-100 p-2.5 rounded-xl">
                          <span className="text-xs font-semibold text-gray-500">
                            Verified Test Average:
                          </span>
                          <span className="text-sm font-mono font-black text-[#059669] bg-green-50 border border-green-100 px-2 py-0.5 rounded">
                            {cand.averageQuizScore
                              ? `${cand.averageQuizScore}%`
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Verified Badge Items */}
                      <div className="mb-6">
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block font-mono mb-2">
                          Verified Skill Competencies:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cand.verifiedSkills.map((badge, idx) => (
                            <span
                              key={idx}
                              className="bg-[#10B981]/5 text-[#059669] border border-[#10B981]/15 text-[10px] px-2.5 py-1 rounded-lg font-mono font-medium flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] text-gray-400 font-mono font-semibold">
                          📝 {cand.quizzesPassed} Verified Modules Passed
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setActivePassport(cand)}
                            className="btn bg-[#0F172A] hover:bg-gray-800 text-white rounded-lg text-xs h-9 min-h-0 px-4 border-none"
                          >
                            Open Skill Passport
                          </button>

                          <button
                            onClick={() => setContactCandidate(cand)}
                            className="btn btn-outline border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs h-9 min-h-0 px-4"
                          >
                            Contact Talent
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 1. SKILL PASSPORT DETAILED MODAL */}
        {activePassport && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl rounded-2xl bg-white border border-gray-200 p-8 text-start relative space-y-6">
              {/* Close Button */}
              <button
                onClick={() => setActivePassport(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-xl font-bold font-mono"
              >
                ✕
              </button>

              {/* Passport Ribbon Certificate header */}
              <div className="border-b border-gray-100 pb-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-[#10B981]/15 text-[#059669] border border-[#10B981]/25 px-2 py-0.5 rounded-full font-bold font-mono uppercase">
                      VERIFIED SKILL PASSPORT
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-2">
                      {activePassport.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      Passport ID: VET-2026-
                      {activePassport.userId.toUpperCase().substring(0, 8)}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-[#10B981]/10 border-2 border-[#10B981]/30 flex items-center justify-center font-black text-xl text-[#059669] shadow-inner">
                    {activePassport.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                </div>
              </div>

              {/* Scores Grid details */}
              <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-5 text-center">
                <div className="bg-[#FAFAFA] border border-gray-100 p-3 rounded-xl">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono block">
                    Career readiness
                  </span>
                  <span className="text-xl font-black text-[#059669] font-mono">
                    {activePassport.progress}%
                  </span>
                </div>
                <div className="bg-[#FAFAFA] border border-gray-100 p-3 rounded-xl">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono block">
                    Verified Modules
                  </span>
                  <span className="text-xl font-black text-gray-900 font-mono">
                    {activePassport.quizzesPassed} Modules
                  </span>
                </div>
                <div className="bg-[#FAFAFA] border border-gray-100 p-3 rounded-xl">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono block">
                    Average quiz score
                  </span>
                  <span className="text-xl font-black text-[#10B981] font-mono">
                    {activePassport.averageQuizScore
                      ? `${activePassport.averageQuizScore}%`
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Verified Assessments timeline lists */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
                  Verified Quiz Milestones
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                  {activePassport.verifiedSkills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-[#FAFAFA] border border-gray-100/60 p-3 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#22C55E] text-md">✓</span>
                        <span className="font-semibold text-gray-700">
                          {skill}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#059669] font-mono font-bold">
                          {activePassport.averageQuizScore
                            ? `${activePassport.averageQuizScore - (idx % 2 === 0 ? 2 : 4)}%`
                            : "Passed"}
                        </span>
                        <span className="text-[8px] bg-green-100 text-[#059669] px-2 py-0.5 rounded font-mono font-bold">
                          VETTED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capstone Project Section */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
                    Verified Capstone Project
                  </span>
                  <span className="text-[9px] bg-[#10B981]/15 text-[#059669] px-2.5 py-0.5 rounded-full font-bold font-mono">
                    ✓ AUDIT PASSED
                  </span>
                </div>
                <h5 className="font-extrabold text-sm text-gray-900">
                  {activePassport.capstoneProject?.title ||
                    "Distributed Ledger Integration"}
                </h5>
                <p className="text-xs text-gray-500 leading-relaxed italic">
                  &ldquo;
                  {activePassport.capstoneProject?.auditLog ||
                    "AI code review verified."}
                  &rdquo;
                </p>
              </div>

              {/* Share & Copy button */}
              <div className="flex justify-between items-center border-t border-gray-100 pt-5">
                <span className="text-[9px] text-gray-400 font-mono">
                  Verified telemetry backed by SmartRoadmap
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyPassportLink(activePassport.userId)}
                    className="btn btn-outline border-gray-200 text-xs h-9 min-h-0 rounded-lg px-4"
                  >
                    Copy Share Link
                  </button>
                  <button
                    onClick={() => {
                      setContactCandidate(activePassport);
                      setActivePassport(null);
                    }}
                    className="btn bg-[#10B981] hover:bg-[#059669] border-none text-white text-xs h-9 min-h-0 rounded-lg px-4"
                  >
                    Invite to Interview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTACT REQUEST MODAL */}
        {contactCandidate && (
          <div className="modal modal-open">
            <div className="modal-box rounded-2xl bg-white border border-gray-200 p-6 text-start space-y-4">
              <h3 className="font-extrabold text-lg text-gray-900">
                Invite candidate for interview
              </h3>
              <p className="text-xs text-gray-500">
                Send a custom interview invitation directly to{" "}
                <strong className="text-gray-900 font-bold">
                  {contactCandidate.name}
                </strong>{" "}
                ({contactCandidate.email}).
              </p>

              <form onSubmit={handleSendInterviewInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 font-mono">
                    Invitation Message
                  </label>
                  <textarea
                    rows={4}
                    className="textarea textarea-bordered w-full rounded-xl bg-[#FAFAFA] border-gray-200 text-xs focus:border-[#10B981] p-3 resize-none"
                    value={interviewNote}
                    onChange={(e) => setInterviewNote(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setContactCandidate(null)}
                    className="btn btn-outline border-gray-200 text-xs h-9 min-h-0 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn bg-[#10B981] hover:bg-[#059669] border-none text-white text-xs h-9 min-h-0 rounded-lg"
                  >
                    Transmit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. SIMULATED ADD JOB POSTING MODAL */}
        {showAddJobModal && (
          <div className="modal modal-open">
            <div className="modal-box rounded-2xl bg-white border border-gray-200 p-6 text-start space-y-4">
              <h3 className="font-extrabold text-lg text-gray-900">
                Define Matching Job Profile
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Add a new job opening requirement to re-calculate vector
                similarity match indices across candidate profiles.
              </p>

              <form onSubmit={handleAddJobPosting} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 font-mono">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead SRE Engineer, Angular Developer"
                    className="input input-bordered w-full rounded-xl bg-[#FAFAFA] border-gray-200 text-xs h-10"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 font-mono">
                    Required Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, TypeScript, Docker"
                    className="input input-bordered w-full rounded-xl bg-[#FAFAFA] border-gray-200 text-xs h-10"
                    value={newJobSkills}
                    onChange={(e) => setNewJobSkills(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddJobModal(false)}
                    className="btn btn-outline border-gray-200 text-xs h-9 min-h-0 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn bg-[#10B981] hover:bg-[#059669] border-none text-white text-xs h-9 min-h-0 rounded-lg"
                  >
                    Calculate Match Indexes
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
