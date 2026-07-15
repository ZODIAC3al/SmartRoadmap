"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function Home() {
  // Interactive Skill Gap Analyzer State
  const [roleInput, setRoleInput] = useState("Frontend Developer");
  const [analyzerResult, setAnalyzerResult] = useState({
    score: 42,
    role: "Frontend Developer",
    missingSkills: [
      "TypeScript",
      "Testing (Jest/Cypress)",
      "Docker",
      "CI/CD Pipelines",
    ],
    verifiedSkills: [
      "HTML5 & CSS3",
      "JavaScript (ES6+)",
      "React Core",
      "Tailwind CSS",
    ],
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleInput.trim()) {
      toast.error("Please enter a target role name");
      return;
    }

    // Simulate dynamic role checking
    const roleLower = roleInput.toLowerCase();
    toast.success(`AI Skill Gap Audit completed for ${roleInput}!`);

    if (roleLower.includes("back")) {
      setAnalyzerResult({
        score: 35,
        role: roleInput,
        missingSkills: [
          "Node.js & Express",
          "MongoDB / Mongoose",
          "Redis Caching",
          "Docker & Containerization",
        ],
        verifiedSkills: [
          "Basic SQL",
          "HTTP Protocols",
          "Git / GitHub",
          "System Architecture",
        ],
      });
    } else if (roleLower.includes("full") || roleLower.includes("software")) {
      setAnalyzerResult({
        score: 48,
        role: roleInput,
        missingSkills: [
          "PostgreSQL & Mongoose",
          "Docker & Kubernetes",
          "System Architecture",
          "CI/CD Pipelines",
        ],
        verifiedSkills: [
          "React / Next.js",
          "Node.js Basics",
          "CSS/Tailwind",
          "Authentication (JWT)",
        ],
      });
    } else if (
      roleLower.includes("design") ||
      roleLower.includes("ux") ||
      roleLower.includes("ui")
    ) {
      setAnalyzerResult({
        score: 55,
        role: roleInput,
        missingSkills: [
          "Figma Advanced Layouts",
          "Design Systems (Tokens)",
          "Usability Audits",
          "Mobile UX Patterns",
        ],
        verifiedSkills: [
          "Wireframing",
          "Color Theory",
          "User Interviews",
          "Prototyping",
        ],
      });
    } else {
      setAnalyzerResult({
        score: 30,
        role: roleInput,
        missingSkills: [
          "System Design",
          "Docker & Deployment",
          "Advanced Frameworks",
          "Testing Suites",
        ],
        verifiedSkills: [
          "Logical Programming",
          "Version Control",
          "Basic Database Management",
          "API Integrations",
        ],
      });
    }
  };

  return (
    <div className="bg-base-100 text-base-content min-h-screen font-sans selection:bg-[#10B981] selection:text-white relative overflow-hidden">
      {/* Subtle grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.04] pointer-events-none" />

      {/* SECTION 1 — HERO */}
      <section className="relative pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Texts */}
          <div className="lg:col-span-7 space-y-8 text-start">
            <div className="inline-flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/25 text-[#059669] px-4.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              Verified Talent Ecosystem
            </div>

            <h1 className="text-display-xl tracking-tight leading-[1.02] text-base-content font-extrabold max-w-2xl">
              Land Better Jobs Through{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#34D399]">
                Verified Skills
              </span>
            </h1>

            <p className="text-body-lg text-base-content/75 max-w-xl leading-relaxed">
              AI-powered career assessment, adaptive learning paths, verified
              skill testing, and intelligent job matching. Don&apos;t just learn
              — prove your mastery and connect directly to top hiring managers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/onboarding"
                className="btn bg-[#10B981] hover:bg-[#059669] border-none text-white px-8 rounded-xl font-semibold shadow-md transition-all duration-200"
              >
                Get My Career Score
              </Link>
              <button
                onClick={() =>
                  toast.info(
                    "Watch Demo simulation triggered. Video loads on staging environment.",
                  )
                }
                className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 px-8 rounded-xl font-semibold transition-all"
              >
                Watch Demo
              </button>
            </div>
          </div>

          {/* Right Hero Dashboard Preview */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#34D399] opacity-10 blur-xl pointer-events-none" />

            {/* High-Fidelity Mockup Dashboard Box */}
            <div className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-xl relative z-10 space-y-6">
              <div className="flex justify-between items-center border-b border-base-300 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-400" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-base-content/40 font-mono">
                  passport_preview_v2.json
                </span>
              </div>

              {/* Grid Layout inside Hero Mockup Preview */}
              <div className="grid grid-cols-2 gap-4">
                {/* Career Score */}
                <div className="border border-base-300 bg-base-100 rounded-xl p-4 text-start">
                  <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider block">
                    Career Score
                  </span>
                  <span className="text-3xl font-black font-mono text-[#059669]">
                    82%
                  </span>
                  <span className="text-[9px] text-[#22C55E] block mt-1">
                    ↑ Top 10% of candidates
                  </span>
                </div>

                {/* Match Percentage */}
                <div className="border border-base-300 bg-base-100 rounded-xl p-4 text-start">
                  <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider block">
                    Match Rate
                  </span>
                  <span className="text-3xl font-black font-mono text-[#10B981]">
                    98%
                  </span>
                  <span className="text-[9px] text-base-content/50 block mt-1">
                    Frontend Engineer at Stripe
                  </span>
                </div>
              </div>

              {/* Skill Passport Mini Card */}
              <div className="border border-base-300 rounded-xl p-4 text-start space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-base-content/50">
                    Skill Passport (Vetted)
                  </span>
                  <span className="text-[9px] bg-green-100 text-[#059669] font-mono px-2 py-0.5 rounded-full font-bold">
                    ACTIVE
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge bg-[#10B981]/10 text-[#059669] border-[#10B981]/20 text-[10px] py-2 px-2.5 rounded-md">
                    ✓ React.js (92%)
                  </span>
                  <span className="badge bg-[#10B981]/10 text-[#059669] border-[#10B981]/20 text-[10px] py-2 px-2.5 rounded-md">
                    ✓ Node.js (87%)
                  </span>
                  <span className="badge bg-[#10B981]/10 text-[#059669] border-[#10B981]/20 text-[10px] py-2 px-2.5 rounded-md">
                    ✓ TypeScript (95%)
                  </span>
                </div>
              </div>

              {/* Progress Slider Bar */}
              <div className="space-y-2 text-start">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-base-content/40 font-semibold">
                    Adaptive Roadmap Progress
                  </span>
                  <span className="font-bold text-[#059669]">78% Complete</span>
                </div>
                <div className="w-full bg-base-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-full"
                    style={{ width: "78%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — SKILL GAP ANALYZER */}
      <section className="bg-base-200 border-y border-base-300 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-start space-y-6">
            <h2 className="text-display-md tracking-tight text-base-content font-extrabold">
              Pinpoint and Fix Your Career Skill Gaps
            </h2>
            <p className="text-body-md text-base-content/70 leading-relaxed">
              Input any target career role. Our AI instantly audits the global
              hiring pipeline requirements, matches them against your verified
              profile, and maps out the exact skills you need to land an offer.
            </p>

            {/* Interactive Search Box */}
            <form onSubmit={handleAnalyze} className="space-y-3.5 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Backend Developer, UI Designer..."
                  className="input input-bordered w-full rounded-xl bg-base-100 border-base-300 text-sm focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] h-12"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl h-12 px-6"
                >
                  Audit Gaps
                </button>
              </div>
              <span className="text-[10px] text-base-content/40 block italic">
                Type &quot;Backend&quot;, &quot;Software&quot;, or
                &quot;Design&quot; to check simulator presets.
              </span>
            </form>
          </div>

          <div className="lg:col-span-7">
            {/* Interactive Simulation Dashboard View */}
            <div className="border border-base-300 rounded-2xl p-6 bg-base-100 shadow-sm text-start space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider block font-mono">
                    Job Role Target
                  </span>
                  <span className="text-lg font-black text-base-content">
                    {analyzerResult.role}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider block font-mono">
                    Compatibility score
                  </span>
                  <span className="text-2xl font-black font-mono text-[#059669]">
                    {analyzerResult.score}%
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Verified Skills list */}
                <div className="bg-base-200 border border-base-300 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-[#22C55E] flex items-center gap-1.5">
                    ✓ Verified In Passport
                  </span>
                  <ul className="space-y-2 text-xs text-base-content/75">
                    {analyzerResult.verifiedSkills.map((s, i) => (
                      <li key={i} className="flex gap-2 items-center">
                        <span className="text-[#22C55E]">●</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Skills list */}
                <div className="bg-base-200 border border-base-300 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-[#EF4444] flex items-center gap-1.5">
                    ⚠ Gaps Found (Needs Roadmap)
                  </span>
                  <ul className="space-y-2 text-xs text-base-content/75">
                    {analyzerResult.missingSkills.map((s, i) => (
                      <li key={i} className="flex gap-2 items-center">
                        <span className="text-[#EF4444]">●</span>
                        <span className="font-semibold">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Link
                  href="/onboarding"
                  className="btn btn-outline border-[#10B981] hover:bg-[#10B981] hover:text-white text-[#10B981] btn-sm rounded-lg text-xs"
                >
                  Generate Roadmap to Close Gaps →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-display-lg tracking-tight font-extrabold text-base-content">
            The Path to Verification
          </h2>
          <p className="text-body-md text-base-content/60 mt-3">
            Traditional CVs are based on claims. SmartRoadmap transforms your
            career journey into verified facts.
          </p>
        </div>

        {/* Timeline Grid layout */}
        <div className="grid md:grid-cols-4 gap-8 relative">
          {[
            {
              step: "1",
              title: "Assess",
              desc: "Complete adaptive career diagnostic tests to identify your base knowledge level and skill gaps.",
            },
            {
              step: "2",
              title: "Learn",
              desc: "Follow an AI-tailored dynamic learning syllabus targeting only topics you need to master.",
            },
            {
              step: "3",
              title: "Verify",
              desc: "Take proctored competency assessments and projects to write permanent verified scores to your Passport.",
            },
            {
              step: "4",
              title: "Get Hired",
              desc: "Unlock instant job matching pipelines where recruiters filter by verified, proven skills.",
            },
          ].map((t, idx) => (
            <div
              key={idx}
              className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm relative group hover:border-[#10B981]/50 transition-all text-start"
            >
              <span className="w-10 h-10 rounded-xl bg-[#10B981]/10 text-[#059669] flex items-center justify-center font-mono font-bold text-md mb-4 group-hover:bg-[#10B981] group-hover:text-white transition-colors">
                {t.step}
              </span>
              <h3 className="font-extrabold text-base-content text-lg mb-2">
                {t.title}
              </h3>
              <p className="text-xs text-base-content/60 leading-relaxed">
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — SKILL PASSPORT */}
      <section className="bg-base-200 border-y border-base-300 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative">
            {/* The Skill Passport Core Visual Asset */}
            <div className="border border-base-300 bg-base-100 rounded-2xl shadow-xl p-8 text-start space-y-6">
              <div className="flex justify-between items-start border-b border-base-300 pb-5">
                <div>
                  <h3 className="font-black text-xl text-base-content tracking-tight">
                    SKILL PASSPORT
                  </h3>
                  <p className="text-xs text-base-content/40 font-mono mt-1">
                    ID: VET-2026-X892-AM
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#10B981]/15 text-[#059669] flex items-center justify-center font-bold text-lg border border-[#10B981]/30">
                  AM
                </div>
              </div>

              {/* Grid metrics */}
              <div className="grid grid-cols-3 gap-4 border-b border-base-300 pb-5">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-base-content/40 font-mono block">
                    Career Score
                  </span>
                  <span className="text-2xl font-black text-[#059669] font-mono">
                    82%
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-base-content/40 font-mono block">
                    Vetted badges
                  </span>
                  <span className="text-2xl font-black text-base-content font-mono">
                    14 Passed
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-base-content/40 font-mono block">
                    Hiring Readiness
                  </span>
                  <span className="text-2xl font-black text-[#10B981] font-mono">
                    94/100
                  </span>
                </div>
              </div>

              {/* Verified Skills list */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-base-content/40 uppercase tracking-wider block font-mono">
                  Assessment Scores
                </span>
                <div className="space-y-2.5">
                  {[
                    {
                      skill: "React Framework Architecture",
                      score: 92,
                      status: "VETTED",
                    },
                    {
                      skill: "TypeScript Strict Mode Interfaces",
                      score: 95,
                      status: "VETTED",
                    },
                    {
                      skill: "Tailwind Design System Tokens",
                      score: 89,
                      status: "VETTED",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-base-200 p-3 rounded-lg border border-base-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#22C55E]">✓</span>
                        <span className="text-xs font-semibold">{s.skill}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-[#059669]">
                          {s.score}%
                        </span>
                        <span className="text-[8px] bg-green-100 text-[#059669] font-mono px-1.5 py-0.5 rounded font-bold">
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects & Certifications */}
              <div className="grid grid-cols-2 gap-4 border-t border-base-300 pt-5">
                <div>
                  <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider block font-mono">
                    Verified Project
                  </span>
                  <p className="text-xs font-bold mt-1">
                    Custom NestJS Microservices
                  </p>
                  <span className="text-[9px] text-[#22C55E] block mt-0.5">
                    Code Audit Passed ✓
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider block font-mono">
                    Interview Readiness
                  </span>
                  <p className="text-xs font-bold mt-1">
                    Excellent (System Design)
                  </p>
                  <span className="text-[9px] text-base-content/40 block mt-0.5">
                    Mock session logged ✓
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 text-start space-y-6">
            <h2 className="text-display-md tracking-tight font-extrabold text-base-content">
              Your Verified Skill Passport: The Vetted Candidate Standard
            </h2>
            <p className="text-body-md text-base-content/60 leading-relaxed">
              The Skill Passport is the core visual asset of the SmartRoadmap
              ecosystem. It replaces traditional unverified CVs with real-time
              competency indexes, showing certified assessment scores, verified
              code audits, and hiring readiness parameters.
            </p>
            <p className="text-xs text-base-content/40">
              * Every credential in the passport corresponds to a completed
              module assessment with anti-cheat telemetry validation.
            </p>
            <div className="pt-2">
              <Link
                href="/onboarding"
                className="btn bg-[#10B981] hover:bg-[#059669] border-none text-white px-8 rounded-xl font-semibold"
              >
                Generate My Passport Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — JOB MATCHING */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 text-start space-y-6">
            <h2 className="text-display-md tracking-tight font-extrabold text-base-content">
              98% Semantic Match. AI Matching Pipeline.
            </h2>
            <p className="text-body-md text-base-content/60 leading-relaxed">
              No more random job board postings. Recruiters use our vector
              database search index to find candidates matching their exact
              skill parameters. If you match, the pipeline updates your
              dashboard immediately.
            </p>

            <div className="space-y-4 pt-2">
              {[
                {
                  match: "98%",
                  role: "Senior Frontend Engineer",
                  company: "Stripe, Inc.",
                  type: "Remote (USD)",
                  confidence: "Exceptional Fit",
                },
                {
                  match: "95%",
                  role: "React Framework Engineer",
                  company: "Vercel Platform Corp",
                  type: "Hybrid (USD)",
                  confidence: "High Confidence",
                },
                {
                  match: "89%",
                  role: "Next.js developer",
                  company: "Linear App SAS",
                  type: "Remote (EUR)",
                  confidence: "Compatible Fit",
                },
              ].map((job, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-base-200 border border-base-300 p-4 rounded-xl shadow-sm hover:border-[#10B981]/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 bg-[#10B981]/10 text-[#059669] rounded-xl flex items-center justify-center font-mono font-black text-xs animate-pulse">
                      {job.match}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-xs text-base-content">
                        {job.role}
                      </h4>
                      <p className="text-[10px] text-base-content/50">
                        {job.company} • {job.type}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-[#10B981]/10 text-[#059669] font-mono px-2 py-0.5 rounded-full font-bold">
                    {job.confidence}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="border border-base-300 rounded-2xl bg-base-200 p-6 shadow-sm text-start space-y-4">
              <span className="text-xs font-bold text-base-content/40 uppercase tracking-wider font-mono">
                Recruiter Match Analytics
              </span>

              <div className="bg-base-100 border border-base-300 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">
                    Recruitment Confidence Factor
                  </span>
                  <span className="font-mono text-[#059669] font-extrabold">
                    94% Excellent
                  </span>
                </div>
                <div className="w-full bg-base-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#10B981] h-full"
                    style={{ width: "94%" }}
                  />
                </div>
              </div>

              {/* Skills Gaps identified indicator */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-base-content/50">
                  Close Gaps to Reach 100% Match:
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded text-[10px] font-mono">
                    ❌ GraphQL Federation
                  </span>
                  <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded text-[10px] font-mono">
                    ❌ Advanced WebSockets
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — SUCCESS STORIES */}
      <section className="bg-base-200 border-t border-base-300 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-display-lg tracking-tight font-extrabold text-base-content">
              Proven Career Outcomes
            </h2>
            <p className="text-body-md text-base-content/60">
              See how learners went from scattered tutorials to verified talent
              profiles hired by top tech engineering guilds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-start">
            {[
              {
                name: "Mohamed Elsaied",
                role: "Full Stack Engineer at Stripe",
                quote:
                  "I was tired of sending out resume templates. SmartRoadmap allowed me to prove my actual JavaScript and NestJS microservices skills in real-time. Within weeks, Stripe recruiters reached out.",
                badge: "Learner Archetype",
              },
              {
                name: "Ali Maher",
                role: "UX UI Designer at Lattice",
                quote:
                  "The portfolio audit tool analyzed the missing gaps in my Figma component design system skills. Closed the gaps using the learning timeline, got verified, and got instantly matched.",
                badge: "Career Switcher",
              },
              {
                name: "Marina George",
                role: "Backend Engineer at Duolingo",
                quote:
                  "The adaptive test logs provided the recruiter with documented proof of my database indexing knowledge, cutting screening times to zero. Highly recommend!",
                badge: "Fresh Graduate",
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="border border-base-300 bg-base-100 rounded-2xl p-6 shadow-sm relative flex flex-col justify-between hover:border-[#10B981]/50 transition-all"
              >
                <div>
                  <span className="text-[10px] bg-base-200 text-base-content/70 font-mono px-2 py-0.5 rounded-full font-bold uppercase block w-max mb-4">
                    {s.badge}
                  </span>
                  <p className="text-xs text-base-content/70 leading-relaxed italic mb-6">
                    &ldquo;{s.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t border-base-300 pt-4">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-xs">
                    {s.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-base-content">
                      {s.name}
                    </h4>
                    <p className="text-[10px] text-base-content/50">{s.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — COMPANIES */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-start space-y-6">
            <h2 className="text-display-md tracking-tight font-extrabold text-base-content">
              Recruiter Dashboard: Vetted Sourcing Pipeline
            </h2>
            <p className="text-body-md text-base-content/60 leading-relaxed">
              Tech recruiters no longer sift through generic resume PDFs. Search
              and rank candidates by verified assessment scores, completed
              project validation logs, and matching compatibility percentages.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/register"
                className="btn bg-base-content text-base-100 hover:bg-base-content/90 rounded-xl font-semibold text-xs h-11 border-none px-6"
              >
                Recruit Verified Candidates
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Recruiters Board Visual mock */}
            <div className="border border-base-300 rounded-2xl bg-base-200 p-6 shadow-md text-start space-y-4">
              <span className="text-xs font-bold text-base-content/40 uppercase tracking-wider font-mono">
                Hiring Manager Candidates Board
              </span>

              <div className="space-y-3">
                {[
                  {
                    name: "Mohamed Elsaied",
                    score: "95% Pass",
                    role: "Full Stack Engineer",
                    verified: "12 Assessments",
                    matching: "98% Match",
                  },
                  {
                    name: "Ali Maher",
                    score: "92% Pass",
                    role: "Frontend Engineer",
                    verified: "8 Assessments",
                    matching: "95% Match",
                  },
                ].map((cand, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-base-100 border border-base-300 p-4 rounded-xl"
                  >
                    <div>
                      <h4 className="font-extrabold text-xs text-base-content">
                        {cand.name}
                      </h4>
                      <p className="text-[10px] text-base-content/50">
                        {cand.role} • {cand.verified}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="badge bg-green-100 text-[#059669] font-mono text-[10px] py-2 px-2.5 rounded font-bold">
                        {cand.score}
                      </span>
                      <span className="text-xs font-bold">{cand.matching}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
