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
  updateApplicationStatus,
  closeSkillGap,
} from "@/lib/hiringApi";

const PIPELINE_STAGES: { key: ApplicationStatus; label: string; icon: string; color: string }[] = [
  { key: "interested", label: "Interested", icon: "⭐", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { key: "applied", label: "Applied", icon: "🚀", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { key: "under_review", label: "Under Review", icon: "👀", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { key: "interview", label: "Interview", icon: "🎙️", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { key: "offer", label: "Offer", icon: "🎉", color: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
  { key: "hired", label: "Hired", icon: "🏆", color: "bg-green-500/10 text-green-600 border-green-500/30" },
  { key: "rejected", label: "Not Moving Forward", icon: "❌", color: "bg-red-500/10 text-red-500 border-red-500/20" },
];

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
  const [addingSkills, setAddingSkills] = useState<string[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWorkType, setFilterWorkType] = useState<string>("all");
  const [filterJobType, setFilterJobType] = useState<string>("all");
  const [filterExperience, setFilterExperience] = useState<string>("all");
  const [filterMatchScore, setFilterMatchScore] = useState<number>(50);
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

        // Fetch matched jobs
        const matched = await fetchMatchedJobs();
        setJobs(matched);
        if (matched[0]) setSelectedJob(matched[0]);

        // Fetch user applications
        const apps = await fetchMyApplications();
        setApplications(apps);

        // Fetch user CVs for applying dropdown
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

  // Helper to check if user has already applied or expressed interest in a job
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
      // If job has external application URL, handle external redirect
      if (selectedJob.externalUrl) {
        // Record as applied in DB first
        const app = await upsertApplication({
          jobId: selectedJob._id,
          jobTitle: selectedJob.title,
          company: selectedJob.company,
          cvId: selectedCvId,
          cvTitle: userCvs.find((c) => (c._id || c.id) === selectedCvId)?.title || "AI CV",
          matchScore: selectedJob.matchScore,
          status: "applied",
          notes: "Applied via external link",
        });
        setApplications((prev) => [...prev.filter((a) => a.jobId !== selectedJob._id), app]);
        window.open(selectedJob.externalUrl, "_blank");
        toast.success(`Redirected to external application for ${selectedJob.company}! Application tracked.`);
      } else {
        // Internal application
        const selectedCv = userCvs.find((c) => (c._id || c.id) === selectedCvId);
        const app = await upsertApplication({
          jobId: selectedJob._id,
          jobTitle: selectedJob.title,
          company: selectedJob.company,
          cvId: selectedCvId,
          cvTitle: selectedCv?.title || "My AI Generated Resume",
          matchScore: selectedJob.matchScore,
          status: "applied",
        });

        setApplications((prev) => [...prev.filter((a) => a.jobId !== selectedJob._id), app]);
        toast.success(`🎉 Application submitted successfully to ${selectedJob.company}!`);
      }
      setApplyModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  // Toggle interest status for a job
  const handleToggleInterest = async (job: ScoredJob) => {
    const existing = getAppForJob(job._id);
    if (existing?.status === "applied") {
      toast.info("Already applied to this job!");
      return;
    }

    try {
      const newStatus: ApplicationStatus = existing?.status === "interested" ? "interested" : "interested";
      const app = await upsertApplication({
        jobId: job._id,
        jobTitle: job.title,
        company: job.company,
        matchScore: job.matchScore,
        status: newStatus,
      });

      setApplications((prev) => [...prev.filter((a) => a.jobId !== job._id), app]);
      toast.success(existing ? "Updated pipeline status!" : "Added to Interested pipeline stage!");
    } catch (err: any) {
      toast.error(err.message || "Could not save status.");
    }
  };

  // Close skill gap
  const handleCloseGap = async (jobId: string) => {
    setAddingSkills((prev) => [...prev, jobId]);
    try {
      const res = await closeSkillGap(jobId);
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, skillsGap: [] } : j))
      );
      if (selectedJob?._id === jobId) {
        setSelectedJob((prev) => (prev ? { ...prev, skillsGap: [] } : null));
      }
      toast.success(res.added?.length ? `Added ${res.added.length} gap module(s) to your roadmap!` : res.message);
    } catch (err: any) {
      toast.error(err.message || "Could not update roadmap.");
    } finally {
      setAddingSkills((prev) => prev.filter((id) => id !== jobId));
    }
  };

  // Update application status from tracking tab
  const handleUpdateAppStatus = async (appId: string, status: ApplicationStatus) => {
    try {
      const updated = await updateApplicationStatus(appId, status);
      setApplications((prev) => prev.map((a) => (a._id === appId ? updated : a)));
      toast.success(`Pipeline status updated to ${status.replace("_", " ")}.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
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
          Please log in to access AI-powered job matching, automatic CV application, and pipeline tracking.
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

  // Filter & Sort Jobs
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
      if (j.matchScore < filterMatchScore) return false;
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
              Verified Learner Recruitment
            </span>
            <h1 className="text-3xl font-black tracking-tight text-base-content mt-1">
              Hiring Match Pipeline
            </h1>
            <p className="text-xs text-base-content/60 mt-1">
              Explore AI-matched opportunities based on your active roadmap, Skill Passport, and verified test credentials.
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
              🎯 Matched Jobs ({jobs.length})
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
            {/* COLUMN 1: FILTERS (lg:col-span-3) */}
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
                    setFilterMatchScore(50);
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
                  placeholder="React, TypeScript, Remote..."
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
                  <option value="match">🔥 Best Match Score</option>
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
                  <option value="all">All Workplaces</option>
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
                </select>
              </div>

              {/* Match Score Threshold Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-base-content/50 uppercase font-mono">
                  <span>Min Match Score</span>
                  <span className="text-emerald-500 font-black">{filterMatchScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  className="range range-xs range-primary accent-emerald-500"
                  value={filterMatchScore}
                  onChange={(e) => setFilterMatchScore(Number(e.target.value))}
                />
              </div>

              {/* Candidate Info Badge */}
              <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-emerald-500 block flex items-center gap-1.5">
                  <span>🛡️</span> Verified SmartRoadmap Candidate
                </span>
                <p className="text-[10px] text-base-content/70 leading-relaxed">
                  Your applications automatically bundle your completed roadmap milestones, quiz scores, and AI-optimized CV.
                </p>
              </div>
            </aside>

            {/* COLUMN 2: JOB LIST (lg:col-span-5) */}
            <section className="lg:col-span-5 space-y-3.5 text-start">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/50 font-mono">
                  Opportunities ({filteredJobs.length})
                </span>
                <span className="text-[10px] text-base-content/40 font-mono">
                  Sorted by {sortBy}
                </span>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="border border-base-300 rounded-2xl bg-base-200 p-8 text-center text-base-content/50 text-xs">
                  No matching jobs found with current filter parameters. Try lowering the match threshold or resetting filters.
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const isActive = selectedJob?._id === job._id;
                  const userApp = getAppForJob(job._id);
                  const isApplied = userApp?.status === "applied";

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
                                ✓ Applied
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-base-content/60 font-semibold mt-1">
                            {job.company} • {job.location}
                          </p>
                        </div>
                        <span
                          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono font-black text-xs shrink-0 border ${
                            job.matchScore >= 80
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : job.matchScore >= 60
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

            {/* COLUMN 3: SELECTED JOB DETAILS & AI MATCH BREAKDOWN (lg:col-span-4) */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 text-start">
              {selectedJob ? (
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-emerald-500 font-mono font-bold uppercase tracking-wider">
                        AI MATCH ANALYSIS
                      </span>
                      <span className="text-[10px] font-mono bg-base-100 border border-base-300 px-2 py-0.5 rounded font-bold">
                        {selectedJob.matchScore}% Compatibility
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-base-content mt-1">
                      {selectedJob.title}
                    </h3>
                    <p className="text-xs text-base-content/60 font-semibold mt-0.5">
                      {selectedJob.company} • {selectedJob.location} ({selectedJob.country})
                    </p>
                  </div>

                  {/* Why You Match Explanation */}
                  <div className="bg-base-100 border border-base-300 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono block">
                      Why You Match
                    </span>
                    <p className="text-xs text-base-content/80 leading-relaxed font-medium">
                      {selectedJob.matchScore >= 80
                        ? `Exceptional match! Your verified skills align strongly with ${selectedJob.company}'s requirements for ${selectedJob.title}.`
                        : selectedJob.matchScore >= 60
                        ? `Good alignment. You possess core skills for this role. Inject missing skill modules to reach 90%+ match.`
                        : `Developing match. Some prerequisites are missing from your active profile.`}
                    </p>
                  </div>

                  {/* Skills Breakdown */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-base-content/50 font-bold uppercase tracking-wider font-mono block">
                      Required Skills & Gaps
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.requiredSkills.map((skill, idx) => {
                        const isGap = (selectedJob.skillsGap || []).includes(skill);
                        return (
                          <span
                            key={idx}
                            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold border ${
                              isGap
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            }`}
                          >
                            {isGap ? "❌" : "✓"} {skill}
                          </span>
                        );
                      })}
                    </div>

                    {selectedJob.skillsGap && selectedJob.skillsGap.length > 0 && (
                      <button
                        onClick={() => handleCloseGap(selectedJob._id)}
                        disabled={addingSkills.includes(selectedJob._id)}
                        className="btn btn-outline border-red-500/30 text-red-500 hover:bg-red-500/10 btn-xs rounded-lg font-bold w-full mt-2"
                      >
                        {addingSkills.includes(selectedJob._id)
                          ? "Injecting Modules..."
                          : "⚡ Inject Missing Skills into Roadmap"}
                      </button>
                    )}
                  </div>

                  {/* Description snippet */}
                  <div className="space-y-1.5 border-t border-base-300 pt-4">
                    <span className="text-[10px] text-base-content/50 font-bold uppercase tracking-wider font-mono block">
                      Job Description
                    </span>
                    <p className="text-xs text-base-content/70 leading-relaxed max-h-40 overflow-y-auto pr-1">
                      {selectedJob.description}
                    </p>
                  </div>

                  {/* Action CTAs */}
                  <div className="space-y-2 pt-2">
                    {getAppForJob(selectedJob._id)?.status === "applied" ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl p-3 text-center text-xs font-bold flex items-center justify-center gap-2">
                        <span>🚀</span> Applied & Tracked in Pipeline
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openApplyModal(selectedJob)}
                          className="btn flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-bold text-xs h-11"
                        >
                          Apply with Skill Passport
                        </button>
                        <button
                          onClick={() => handleToggleInterest(selectedJob)}
                          title="Save as Interested"
                          className="btn bg-base-100 border border-base-300 hover:border-emerald-500 text-base-content rounded-xl h-11 px-3"
                        >
                          ⭐
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-base-300 rounded-2xl bg-base-200 p-6 text-center text-base-content/40 text-xs">
                  Select a job card to view match breakdown and application actions.
                </div>
              )}
            </aside>
          </div>
        )}

        {/* TAB 2: MY APPLICATIONS (PIPELINE TRACKING) */}
        {activeTab === "applications" && (
          <div className="space-y-6 text-start">
            {/* Pipeline Stage Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {PIPELINE_STAGES.map((stage) => {
                const count = applications.filter((a) => a.status === stage.key).length;
                return (
                  <div
                    key={stage.key}
                    className={`border rounded-2xl p-3.5 flex flex-col justify-between ${stage.color}`}
                  >
                    <span className="text-xl">{stage.icon}</span>
                    <div className="mt-2">
                      <span className="text-xl font-black block leading-none">{count}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono opacity-80 block mt-1">
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
                    Application Tracking Pipeline
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Track recruitment status across all companies. Changes persist automatically in your database.
                  </p>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="p-8 text-center text-base-content/50 text-xs">
                  No applications tracked yet. Go to <button onClick={() => setActiveTab("jobs")} className="text-emerald-500 font-bold underline">Matched Jobs</button> to apply!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full text-xs">
                    <thead>
                      <tr className="border-base-300 text-base-content/60 uppercase font-mono text-[10px]">
                        <th>Company & Role</th>
                        <th>Match %</th>
                        <th>CV Used</th>
                        <th>Applied Date</th>
                        <th>Pipeline Status</th>
                        <th>Update Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => {
                        const stage = PIPELINE_STAGES.find((s) => s.key === app.status) || PIPELINE_STAGES[0];

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
                                📄 {app.cvTitle || "AI Resume"}
                              </span>
                            </td>
                            <td>
                              <span className="text-xs text-base-content/60 font-mono">
                                {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "Not Yet"}
                              </span>
                            </td>
                            <td>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold font-mono ${stage.color}`}>
                                <span>{stage.icon}</span>
                                <span>{stage.label}</span>
                              </span>
                            </td>
                            <td>
                              <select
                                className="select select-bordered select-xs rounded-lg text-xs bg-base-100"
                                value={app.status}
                                onChange={(e: any) => handleUpdateAppStatus(app._id, e.target.value)}
                              >
                                {PIPELINE_STAGES.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    {s.icon} {s.label}
                                  </option>
                                ))}
                              </select>
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
                    No saved CV found. Your profile data will be automatically compiled into an AI resume upon submission.
                  </div>
                )}
              </div>

              {/* Transmitted Bundles Check */}
              <div className="bg-base-100 border border-base-300 p-3.5 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-emerald-500 block text-[11px] uppercase tracking-wider font-mono">
                  Transmitted Credentials Bundle
                </span>
                <ul className="space-y-1 text-base-content/70 text-[11px]">
                  <li className="flex items-center gap-1.5">✓ Verified Roadmap Milestones</li>
                  <li className="flex items-center gap-1.5">✓ Verified Skill Passport Credentials</li>
                  <li className="flex items-center gap-1.5">✓ Selected Resume ({selectedCvId ? "AI CV" : "Auto-Compiled"})</li>
                  <li className="flex items-center gap-1.5">✓ Match Score: {selectedJob.matchScore}%</li>
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
    </div>
  );
}
