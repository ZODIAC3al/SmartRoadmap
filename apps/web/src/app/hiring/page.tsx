"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppContext";
import { toast } from "react-toastify";
import { apiFetch, getCachedUser, hasSession } from "@/lib/api";
import {
  ScoredJob,
  JobApplication,
  ApplicationStatus,
  fetchMatchedJobs,
  fetchMyApplications,
  upsertApplication,
} from "@/lib/hiringApi";

const PIPELINE_STAGES: { key: string; label: string; icon: string; color: string }[] = [
  { key: "Applied", label: "Applied", icon: "🚀", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { key: "Interviewing", label: "Interviewing", icon: "🎙️", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { key: "Accepted", label: "Accepted", icon: "🎉", color: "bg-green-500/10 text-green-600 border-green-500/30" },
  { key: "Rejected", label: "Rejected", icon: "❌", color: "bg-red-500/10 text-red-500 border-red-500/20" },
];

function normalizeStatusKey(s?: string): string {
  if (!s) return "Applied";
  const lower = s.toLowerCase();
  if (lower === "applied" || lower === "interested") return "Applied";
  if (lower === "interview" || lower === "interviewing" || lower === "under_review") return "Interviewing";
  if (lower === "accepted" || lower === "offer" || lower === "hired") return "Accepted";
  if (lower === "rejected") return "Rejected";
  return "Applied";
}

export default function HiringPage() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<"jobs" | "applications">("jobs");

  // Data states
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [userCvs, setUserCvs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScoredJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Apply modal states
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState<string>("");
  const [applying, setApplying] = useState(false);

  // Application detail modal
  const [viewingApp, setViewingApp] = useState<JobApplication | null>(null);

  // Filter & Search states (NO match score slider!)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWorkType, setFilterWorkType] = useState<string>("all");
  const [filterJobType, setFilterJobType] = useState<string>("all");
  const [filterExperience, setFilterExperience] = useState<string>("all");
  const [filterMinSalary, setFilterMinSalary] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"match" | "newest" | "salary">("match");

  // Fetch initial data
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
        setLoading(true);

        // 1. Fetch all real matched jobs
        const matched = await fetchMatchedJobs();
        setJobs(matched);
        if (matched[0]) setSelectedJob(matched[0]);

        // 2. Fetch user applications
        const apps = await fetchMyApplications();
        setApplications(apps);

        // 3. Fetch user CVs for applying dropdown
        const cvRes = await apiFetch("/cv/list");
        if (cvRes.ok) {
          const cvData = await cvRes.json();
          const list = cvData.data || cvData || [];
          setUserCvs(list);
          if (list[0]) setSelectedCvId(list[0]._id || list[0].id);
        }
      } catch (err: any) {
        console.error("Failed loading hiring data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Helper to check if user has already applied to a job
  const getAppForJob = (jobId: string): JobApplication | undefined => {
    return applications.find((a) => a.jobId === jobId);
  };

  // Handle Apply button click
  const openApplyModal = (job: ScoredJob) => {
    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  // Submit Application
  const handleConfirmApply = async () => {
    if (!selectedJob) return;

    setApplying(true);
    try {
      const selectedCv = userCvs.find((c) => (c._id || c.id) === selectedCvId);

      const app = await upsertApplication({
        jobId: selectedJob._id,
        jobTitle: selectedJob.title,
        company: selectedJob.company,
        cvId: selectedCvId,
        cvTitle: selectedCv?.title || "My AI Resume",
        matchScore: selectedJob.matchScore,
        status: "Applied",
      });

      setApplications((prev) => [...prev.filter((a) => a.jobId !== selectedJob._id), app]);
      toast.success(`🎉 Application submitted successfully to ${selectedJob.company}! Status: Applied.`);

      if (selectedJob.externalUrl) {
        window.open(selectedJob.externalUrl, "_blank");
      }

      setApplyModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-emerald-500"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-8 text-center bg-base-100">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center text-3xl mb-4">
          💼
        </div>
        <h2 className="text-2xl font-black text-base-content tracking-tight">
          Hiring Match Portal
        </h2>
        <p className="text-sm text-base-content/60 max-w-sm mb-6 mt-1">
          Please log in to explore verified jobs, view Needed Skills, and apply with your Skill Passport.
        </p>
        <Link
          href="/auth/login"
          className="btn bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-bold px-6"
        >
          Sign In to Portal
        </Link>
      </div>
    );
  }

  // Filter & Sort Jobs (ALL jobs shown, no match score slider requirement!)
  const filteredJobs = jobs
    .filter((j) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = j.title.toLowerCase().includes(q);
        const compMatch = j.company.toLowerCase().includes(q);
        const skillMatch = (j.requiredSkills || []).some((s) => s.toLowerCase().includes(q));
        if (!titleMatch && !compMatch && !skillMatch) return false;
      }
      if (filterWorkType !== "all") {
        if (filterWorkType === "remote" && !j.remote && j.workType !== "remote") return false;
        if (filterWorkType === "hybrid" && j.workType !== "hybrid") return false;
        if (filterWorkType === "onsite" && j.workType !== "onsite") return false;
      }
      if (filterJobType !== "all" && j.jobType && j.jobType !== filterJobType) return false;
      if (filterExperience !== "all" && j.experienceLevel && j.experienceLevel !== filterExperience) return false;
      if (filterMinSalary > 0 && (j.salaryMax || j.salaryMin || 0) < filterMinSalary) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "match") return b.matchScore - a.matchScore;
      if (sortBy === "salary") return (b.salaryMax || b.salaryMin || 0) - (a.salaryMax || a.salaryMin || 0);
      if (sortBy === "newest") {
        const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-base-100 text-base-content pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-base-300 pb-5 gap-4">
          <div>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
              Real-Time Verified Hiring
            </span>
            <h1 className="text-3xl font-black tracking-tight text-base-content mt-1">
              Matched Jobs & Applications
            </h1>
            <p className="text-xs text-base-content/60 mt-1">
              Explore open positions, review Needed Skills, and apply with your verified Skill Passport and CV.
            </p>
          </div>

          {/* Tab Controls */}
          <div className="flex items-center gap-2 bg-base-200 p-1.5 rounded-xl border border-base-300 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
                activeTab === "jobs"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              🎯 Available Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
                activeTab === "applications"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              📋 My Applications ({applications.length})
            </button>
          </div>
        </div>

        {/* TAB 1: MATCHED JOBS */}
        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN 1: FILTERS (lg:col-span-3) - NO match score slider! */}
            <aside className="lg:col-span-3 bg-base-200 border border-base-300 rounded-2xl p-5 text-start space-y-5">
              <div className="flex justify-between items-center border-b border-base-300 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-base-content/50">
                  Search & Filters
                </span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterWorkType("all");
                    setFilterJobType("all");
                    setFilterExperience("all");
                    setFilterMinSalary(0);
                    setSortBy("match");
                  }}
                  className="text-xs text-red-500 hover:underline font-semibold"
                >
                  Reset
                </button>
              </div>

              {/* Keyword Search */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block font-mono">
                  Keyword / Title / Skill
                </label>
                <input
                  type="text"
                  placeholder="React, Node.js, Python, Remote..."
                  className="input input-bordered input-sm w-full rounded-xl text-xs bg-base-100"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Sort By */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block font-mono">
                  Sort Jobs By
                </label>
                <select
                  className="select select-bordered select-sm w-full rounded-xl text-xs bg-base-100"
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                >
                  <option value="match">🔥 Best Match Compatibility</option>
                  <option value="newest">🕒 Newest Posted</option>
                  <option value="salary">💰 Highest Salary</option>
                </select>
              </div>

              {/* Work Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block font-mono">
                  Work Environment
                </label>
                <select
                  className="select select-bordered select-sm w-full rounded-xl text-xs bg-base-100"
                  value={filterWorkType}
                  onChange={(e) => setFilterWorkType(e.target.value)}
                >
                  <option value="all">All Environments</option>
                  <option value="remote">🌐 Remote Only</option>
                  <option value="hybrid">🏢 Hybrid</option>
                  <option value="onsite">📍 On-Site</option>
                </select>
              </div>

              {/* Job Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block font-mono">
                  Employment Type
                </label>
                <select
                  className="select select-bordered select-sm w-full rounded-xl text-xs bg-base-100"
                  value={filterJobType}
                  onChange={(e) => setFilterJobType(e.target.value)}
                >
                  <option value="all">All Job Types</option>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              {/* Experience Level */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block font-mono">
                  Experience Level
                </label>
                <select
                  className="select select-bordered select-sm w-full rounded-xl text-xs bg-base-100"
                  value={filterExperience}
                  onChange={(e) => setFilterExperience(e.target.value)}
                >
                  <option value="all">All Experience Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead / Architect</option>
                </select>
              </div>

              {/* Verified Application Badge */}
              <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-emerald-500 block flex items-center gap-1.5">
                  <span>🛡️</span> Verified Skill Passport Included
                </span>
                <p className="text-[10px] text-base-content/70 leading-relaxed">
                  Every application automatically attaches your verified Skill Passport snapshot, completed roadmap milestones, and chosen CV.
                </p>
              </div>
            </aside>

            {/* COLUMN 2: JOB LIST (lg:col-span-5) */}
            <section className="lg:col-span-5 space-y-3.5 text-start">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/50 font-mono">
                  Jobs Available ({filteredJobs.length})
                </span>
                <span className="text-[10px] text-base-content/40 font-mono">
                  Sorted by {sortBy}
                </span>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="border border-base-300 rounded-2xl bg-base-200 p-8 text-center text-base-content/50 text-xs">
                  No jobs found matching your filters. Try clearing your search filters above.
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const isActive = selectedJob?._id === job._id;
                  const userApp = getAppForJob(job._id);
                  const isApplied = !!userApp;

                  return (
                    <div
                      key={job._id}
                      onClick={() => setSelectedJob(job)}
                      className={`border rounded-2xl p-5 cursor-pointer bg-base-200 transition-all duration-200 flex flex-col justify-between gap-4 ${
                        isActive
                          ? "border-emerald-500 ring-2 ring-emerald-500/15 shadow-sm"
                          : "border-base-300 hover:border-emerald-500/50"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-sm text-base-content leading-tight">
                              {job.title}
                            </h3>
                            {isApplied && (
                              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full">
                                ✓ {userApp.status}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-base-content/60 font-semibold mt-1">
                            {job.company} • {job.location} {job.country ? `(${job.country})` : ""}
                          </p>
                        </div>
                        <span
                          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono font-black text-xs shrink-0 border ${
                            job.matchScore >= 80
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : job.matchScore >= 50
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-base-300 text-base-content/60 border-base-300"
                          }`}
                        >
                          <span className="text-[13px]">{job.matchScore}%</span>
                          <span className="text-[8px] font-normal uppercase opacity-70">Match</span>
                        </span>
                      </div>

                      {/* Required skills tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {job.requiredSkills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-base-100 border border-base-300 text-base-content/70 text-[9px] font-mono font-medium px-2 py-0.5 rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 4 && (
                          <span className="text-[9px] font-mono text-base-content/40 px-1 py-0.5">
                            +{job.requiredSkills.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Footer Details */}
                      <div className="flex justify-between items-center text-[10px] text-base-content/50 border-t border-base-300 pt-3 font-mono">
                        <div className="flex items-center gap-3">
                          <span className="capitalize font-semibold text-base-content/80">
                            🏷️ {job.workType || (job.remote ? "Remote" : "On-Site")}
                          </span>
                          {job.salaryMin ? (
                            <span className="font-bold text-emerald-600">
                              💰 ${job.salaryMin.toLocaleString()}{job.salaryMax ? ` - $${job.salaryMax.toLocaleString()}` : ""}
                            </span>
                          ) : null}
                        </div>
                        <span>
                          {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "Recently"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            {/* COLUMN 3: SELECTED JOB DETAILS & NEEDED SKILLS (lg:col-span-4) */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 text-start">
              {selectedJob ? (
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-emerald-500 font-mono font-bold uppercase tracking-wider">
                        JOB DETAILS & FIT
                      </span>
                      <span className="text-[10px] font-mono bg-base-100 border border-base-300 px-2 py-0.5 rounded font-bold">
                        {selectedJob.matchScore}% Match
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-base-content mt-1">
                      {selectedJob.title}
                    </h3>
                    <p className="text-xs text-base-content/60 font-semibold mt-0.5">
                      {selectedJob.company} • {selectedJob.location} {selectedJob.country ? `(${selectedJob.country})` : ""}
                    </p>
                  </div>

                  {/* Why You Match Explanation */}
                  <div className="bg-base-100 border border-base-300 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono block">
                      Compatibility Analysis
                    </span>
                    <p className="text-xs text-base-content/80 leading-relaxed font-medium">
                      {selectedJob.matchScore >= 80
                        ? `Exceptional alignment! Your verified Skill Passport and CV demonstrate strong qualification for ${selectedJob.title} at ${selectedJob.company}.`
                        : selectedJob.matchScore >= 50
                        ? `Solid foundation. You have verified skills for this position. Check the Needed Skills section below.`
                        : `Developing fit. Review the Needed Skills section below to understand role prerequisites.`}
                    </p>
                  </div>

                  {/* ── NEW SECTION: NEEDED SKILLS (Independent, No Roadmap Mutation) ── */}
                  <div className="space-y-3 border-t border-base-300 pt-4">
                    <h4 className="text-xs font-black text-base-content uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>🎯</span> Needed Skills
                    </h4>

                    {/* Needed Skills (Missing) */}
                    {(selectedJob.neededSkills || selectedJob.skillsGap || []).length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider font-mono block">
                          Skills Still Needed for this Role:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedJob.neededSkills || selectedJob.skillsGap || []).map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold bg-red-500/10 text-red-500 border border-red-500/20"
                            >
                              ❌ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-600 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 font-medium">
                        ✓ You meet all required skills for this job!
                      </div>
                    )}

                    {/* Matching Skills (Possessed) */}
                    {(selectedJob.matchingSkills || []).length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider font-mono block">
                          Skills You Have:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedJob.matchingSkills || []).map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Job Description */}
                  <div className="space-y-1.5 border-t border-base-300 pt-4">
                    <span className="text-[10px] text-base-content/50 font-bold uppercase tracking-wider font-mono block">
                      Job Description
                    </span>
                    <p className="text-xs text-base-content/70 leading-relaxed max-h-36 overflow-y-auto pr-1">
                      {selectedJob.description}
                    </p>
                  </div>

                  {/* Action CTAs */}
                  <div className="space-y-2 pt-2">
                    {getAppForJob(selectedJob._id) ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl p-3 text-center text-xs font-bold flex items-center justify-center gap-2">
                        <span>🚀</span> Applied (Status: {getAppForJob(selectedJob._id)?.status})
                      </div>
                    ) : (
                      <button
                        onClick={() => openApplyModal(selectedJob)}
                        className="btn w-full bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-bold text-xs h-11"
                      >
                        Apply with Skill Passport & CV
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-base-300 rounded-2xl bg-base-200 p-6 text-center text-base-content/40 text-xs">
                  Select a job card to view details and Needed Skills.
                </div>
              )}
            </aside>
          </div>
        )}

        {/* TAB 2: MY APPLICATIONS (APPLICATION DASHBOARD) */}
        {activeTab === "applications" && (
          <div className="space-y-6 text-start">
            {/* Pipeline Stage Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PIPELINE_STAGES.map((stage) => {
                const count = applications.filter((a) => normalizeStatusKey(a.status) === stage.key).length;
                return (
                  <div
                    key={stage.key}
                    className={`border rounded-2xl p-4 flex flex-col justify-between ${stage.color}`}
                  >
                    <span className="text-2xl">{stage.icon}</span>
                    <div className="mt-3">
                      <span className="text-2xl font-black block leading-none">{count}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider font-mono opacity-80 block mt-1">
                        {stage.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Applications List */}
            <div className="bg-base-200 border border-base-300 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-base-300 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-base-content">
                    Application Dashboard
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Real-time status of your job applications. Updates made by employers or admins appear here automatically.
                  </p>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="p-8 text-center text-base-content/50 text-xs">
                  No applications tracked yet. Go to <button onClick={() => setActiveTab("jobs")} className="text-emerald-500 font-bold underline">Available Jobs</button> to apply!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full text-xs">
                    <thead>
                      <tr className="border-base-300 text-base-content/60 uppercase font-mono text-[10px]">
                        <th>Company & Role</th>
                        <th>Match %</th>
                        <th>Submitted CV</th>
                        <th>Application Date</th>
                        <th>Current Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => {
                        const normalizedKey = normalizeStatusKey(app.status);
                        const stage = PIPELINE_STAGES.find((s) => s.key === normalizedKey) || PIPELINE_STAGES[0];

                        return (
                          <tr key={app._id} className="border-base-300 hover:bg-base-100/50">
                            <td>
                              <div>
                                <span className="font-extrabold text-sm text-base-content block">
                                  {app.jobTitle}
                                </span>
                                <span className="text-xs text-base-content/60 font-medium">
                                  {app.company}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {app.matchScore}%
                              </span>
                            </td>
                            <td>
                              <span className="text-xs text-base-content/70">
                                📄 {app.cvTitle || "Verified Resume"}
                              </span>
                            </td>
                            <td>
                              <span className="text-xs text-base-content/60 font-mono">
                                {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : new Date(app.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td>
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold font-mono ${stage.color}`}>
                                <span>{stage.icon}</span>
                                <span>{app.status}</span>
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => setViewingApp(app)}
                                className="btn btn-xs btn-outline border-base-300 rounded-lg text-[10px] font-bold"
                              >
                                View Details
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
          </div>
        )}
      </div>

      {/* APPLY CONFIRMATION MODAL */}
      {applyModalOpen && selectedJob && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl bg-base-200 border border-base-300 text-start space-y-5 max-w-md">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
                <span>🚀</span> Apply to {selectedJob.company}
              </h3>
              <button onClick={() => setApplyModalOpen(false)} className="btn btn-xs btn-circle btn-ghost">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-base-content/50 font-mono block">Role</span>
                <span className="font-extrabold text-sm text-base-content">{selectedJob.title}</span>
              </div>

              {/* CV Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-base-content/70 block">
                  Select Application Resume (CV):
                </label>
                {userCvs.length > 0 ? (
                  <select
                    className="select select-bordered select-sm w-full rounded-xl text-xs bg-base-100"
                    value={selectedCvId}
                    onChange={(e) => setSelectedCvId(e.target.value)}
                  >
                    {userCvs.map((cv) => (
                      <option key={cv._id || cv.id} value={cv._id || cv.id}>
                        📄 {cv.title || "My AI Resume"} (Last updated: {new Date(cv.updatedAt || Date.now()).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    No saved CV found. Your profile data will be automatically compiled into a verified resume snapshot upon submission.
                  </div>
                )}
              </div>

              {/* Transmitted Bundles Check */}
              <div className="bg-base-100 border border-base-300 p-3.5 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-emerald-500 block text-[11px] uppercase tracking-wider font-mono">
                  Transmitted Credentials Bundle
                </span>
                <ul className="space-y-1 text-base-content/70 text-[11px]">
                  <li className="flex items-center gap-1.5">✓ Verified Skill Passport Credentials</li>
                  <li className="flex items-center gap-1.5">✓ Completed Roadmap Milestones & Quiz Stats</li>
                  <li className="flex items-center gap-1.5">✓ Verified Resume ({selectedCvId ? "Selected CV" : "Auto-Compiled"})</li>
                  <li className="flex items-center gap-1.5">✓ Initial Status: Applied</li>
                </ul>
              </div>
            </div>

            <div className="modal-action gap-2 pt-2">
              <button
                onClick={() => setApplyModalOpen(false)}
                className="btn btn-ghost btn-sm rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApply}
                disabled={applying}
                className="btn bg-emerald-500 hover:bg-emerald-600 text-white border-none btn-sm rounded-xl font-bold text-xs px-6"
              >
                {applying ? "Submitting..." : "Confirm & Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATION DETAILS MODAL */}
      {viewingApp && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl bg-base-200 border border-base-300 text-start space-y-5 max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-base-300 pb-4">
              <div>
                <span className="text-[10px] text-emerald-500 font-mono font-bold uppercase tracking-wider">
                  APPLICATION RECORD
                </span>
                <h3 className="font-black text-lg text-base-content mt-0.5">
                  {viewingApp.jobTitle}
                </h3>
                <p className="text-xs text-base-content/60">
                  {viewingApp.company} • Submitted on {viewingApp.appliedAt ? new Date(viewingApp.appliedAt).toLocaleDateString() : new Date(viewingApp.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setViewingApp(null)} className="btn btn-xs btn-circle btn-ghost">
                ✕
              </button>
            </div>

            {/* Current Status Banner */}
            <div className="bg-base-100 border border-base-300 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-base-content/50 font-bold uppercase font-mono block">
                  Current Pipeline Status
                </span>
                <span className="font-extrabold text-base text-base-content">
                  {viewingApp.status}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-mono ${
                PIPELINE_STAGES.find((s) => s.key === normalizeStatusKey(viewingApp.status))?.color || "bg-base-300"
              }`}>
                <span>{PIPELINE_STAGES.find((s) => s.key === normalizeStatusKey(viewingApp.status))?.icon || "📋"}</span>
                <span>{viewingApp.status}</span>
              </span>
            </div>

            {/* Status History Timeline */}
            {viewingApp.statusHistory && viewingApp.statusHistory.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-base-content/50 font-bold uppercase font-mono block">
                  Status History
                </span>
                <div className="bg-base-100 border border-base-300 rounded-xl p-3.5 space-y-2 text-xs">
                  {viewingApp.statusHistory.map((h, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-base-200 last:border-0 pb-1.5 last:pb-0">
                      <div>
                        <span className="font-bold text-base-content">{h.status}</span>
                        {h.notes && <p className="text-[10px] text-base-content/60">{h.notes}</p>}
                      </div>
                      <span className="text-[10px] text-base-content/40 font-mono">
                        {new Date(h.changedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submitted CV Snapshot */}
            {viewingApp.cvSnapshot && (
              <div className="space-y-2">
                <span className="text-[10px] text-base-content/50 font-bold uppercase font-mono block">
                  Submitted Resume Snapshot
                </span>
                <div className="bg-base-100 border border-base-300 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-base-content">{viewingApp.cvSnapshot.title || "Resume"}</span>
                    <span className="text-[10px] font-mono text-emerald-500">Verified at Application</span>
                  </div>
                  {viewingApp.cvSnapshot.summary && (
                    <p className="text-xs text-base-content/70 italic bg-base-200 p-2.5 rounded-lg">
                      &quot;{viewingApp.cvSnapshot.summary}&quot;
                    </p>
                  )}
                  {viewingApp.cvSnapshot.skills && (
                    <div>
                      <span className="text-[10px] font-bold text-base-content/50 uppercase font-mono block mb-1">Skills Included:</span>
                      <div className="flex flex-wrap gap-1">
                        {viewingApp.cvSnapshot.skills.map((s: string, i: number) => (
                          <span key={i} className="badge badge-xs badge-neutral text-[9px] font-mono">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submitted Skill Passport Snapshot */}
            {viewingApp.passportSnapshot && (
              <div className="space-y-2">
                <span className="text-[10px] text-base-content/50 font-bold uppercase font-mono block">
                  Transmitted Skill Passport Snapshot
                </span>
                <div className="bg-base-100 border border-base-300 rounded-xl p-4 text-xs space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-base-200 p-2.5 rounded-lg">
                      <span className="text-[9px] uppercase font-mono text-base-content/50 block">Target Role</span>
                      <span className="font-bold text-xs">{viewingApp.passportSnapshot.targetRole || "Software Developer"}</span>
                    </div>
                    <div className="bg-base-200 p-2.5 rounded-lg">
                      <span className="text-[9px] uppercase font-mono text-base-content/50 block">Milestones Verified</span>
                      <span className="font-bold text-xs">{viewingApp.passportSnapshot.roadmap?.completedMilestones || 0} completed</span>
                    </div>
                    <div className="bg-base-200 p-2.5 rounded-lg">
                      <span className="text-[9px] uppercase font-mono text-base-content/50 block">Avg Quiz Score</span>
                      <span className="font-bold text-xs text-emerald-500">{viewingApp.passportSnapshot.quizPerformance?.averageScore || "100"}%</span>
                    </div>
                  </div>

                  {viewingApp.passportSnapshot.verifiedSkills && viewingApp.passportSnapshot.verifiedSkills.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-base-content/50 uppercase font-mono block mb-1">Verified Skills in Passport:</span>
                      <div className="flex flex-wrap gap-1">
                        {viewingApp.passportSnapshot.verifiedSkills.map((s: string, i: number) => (
                          <span key={i} className="badge badge-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-mono">✓ {s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="modal-action">
              <button onClick={() => setViewingApp(null)} className="btn btn-sm btn-ghost rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
