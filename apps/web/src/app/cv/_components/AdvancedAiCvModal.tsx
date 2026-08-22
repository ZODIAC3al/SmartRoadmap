"use client";

import React, { useState } from "react";
import { SparklesIcon, CloseIcon } from "./icons";
import AiAssistantFigure from "@/components/illustrations/AiAssistantFigure";

interface AdvancedAiCvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: {
    targetRole: string;
    jobDescription: string;
    sections: string[];
  }) => Promise<void>;
  isGenerating: boolean;
  initialRole?: string;
}

const PRESET_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "AI / ML Engineer",
  "Data Analyst",
  "UI/UX Designer",
  "DevOps Engineer",
  "Mobile App Developer",
];

const AVAILABLE_SECTIONS = [
  { id: "summary", label: "Professional Summary", desc: "Tailored 2-4 sentence narrative matching role requirements" },
  { id: "skills", label: "Categorized Skills", desc: "Technical, Languages, Frameworks, Databases, Tools & Soft Skills" },
  { id: "experience", label: "Work Experience", desc: "Action-oriented bullets with metrics and outcomes" },
  { id: "projects", label: "Selected Projects", desc: "Role-relevant GitHub & demo projects with tech stack" },
  { id: "education", label: "Education & Academics", desc: "Degree, institution, and field of study" },
  { id: "courses", label: "Courses & Training", desc: "Completed training programs and online certifications" },
  { id: "certifications", label: "Verified Certifications", desc: "Devotopia Track credentials & verified certificates" },
  { id: "achievements", label: "Achievements & Badges", desc: "Platform milestones, badges, and competition honors" },
  { id: "languages", label: "Languages", desc: "Language proficiency levels" },
  { id: "links", label: "Professional Links", desc: "LinkedIn, GitHub, Portfolio & website URLs" },
];

export function AdvancedAiCvModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  initialRole = "Frontend Developer",
}: AdvancedAiCvModalProps) {
  const [targetRole, setTargetRole] = useState(initialRole);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "courses",
    "certifications",
    "achievements",
    "languages",
    "links",
  ]);

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleStartGeneration = async () => {
    await onGenerate({
      targetRole: targetRole || "Software Engineer",
      jobDescription,
      sections: selectedSections,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-base-100 border border-base-300 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 text-start animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-base-200 via-base-100 to-base-200 border-b border-base-300 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8E1616]/15 text-[#8E1616] flex items-center justify-center font-bold text-xl">
              ✨
            </div>
            <div>
              <h2 className="text-lg font-black text-base-content">
                Advanced AI CV Generator
              </h2>
              <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                Tailor a comprehensive, ATS-ready resume from your verified profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="btn btn-ghost btn-sm btn-circle text-stone-500 hover:text-base-content"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Step 1: Target Role Selection */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#8E1616] flex items-center gap-1.5">
              <span>1. Target Role & Industry Focus</span>
            </label>

            {/* Quick-Select Pills */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    targetRole === role
                      ? "bg-[#8E1616] text-white shadow-sm"
                      : "bg-base-200 text-stone-800 dark:text-stone-200 border border-base-300 hover:border-[#8E1616]/40"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Or enter custom role (e.g. Cloud Security Architect)"
              className="input input-bordered w-full rounded-xl bg-base-200 border-base-300 text-sm font-semibold focus:border-[#8E1616]"
            />
          </div>

          {/* Step 2: Optional Job Description for ATS Optimization */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#8E1616]">
                2. Job Description (Optional for ATS keyword alignment)
              </label>
              <span className="text-[10px] text-stone-600 dark:text-stone-400 font-medium">
                Paste recruiter posting
              </span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description or key requirements here to optimize ATS score and match keywords..."
              className="textarea textarea-bordered w-full rounded-xl bg-base-200 border-base-300 text-xs font-mono h-20 leading-relaxed focus:border-[#8E1616]"
            />
          </div>

          {/* Step 3: Choose Sections to Include */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#8E1616]">
                3. Select Sections to Populate
              </label>
              <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300">
                {selectedSections.length} of {AVAILABLE_SECTIONS.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_SECTIONS.map((sec) => {
                const isSelected = selectedSections.includes(sec.id);
                return (
                  <div
                    key={sec.id}
                    onClick={() => toggleSection(sec.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? "bg-[#8E1616]/5 border-[#8E1616]/40 text-base-content"
                        : "bg-base-200/50 border-base-300 opacity-60 text-stone-600 dark:text-stone-400 hover:opacity-90"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="checkbox checkbox-xs checkbox-primary mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-black leading-tight text-base-content">{sec.label}</p>
                      <p className="text-[10px] text-stone-600 dark:text-stone-400 font-medium leading-normal">{sec.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anti-Hallucination Assurance */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
            <span className="text-emerald-600 text-lg">🛡️</span>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
              <strong>Truthful Data Integrity:</strong> The AI extracts strictly from your verified profile, projects, GitHub repositories, and certifications. No fabricated roles or fake credentials.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-base-200 border-t border-base-300 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="btn btn-outline border-base-300 btn-sm rounded-xl font-bold text-base-content"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartGeneration}
            disabled={isGenerating || !targetRole.trim() || selectedSections.length === 0}
            className="btn bg-gradient-to-r from-[#8E1616] via-[#B32424] to-[#8E1616] text-white hover:from-[#701111] hover:to-[#701111] btn-sm px-6 rounded-xl font-black border-none shadow-md flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                <span>Engineering ATS Resume...</span>
              </>
            ) : (
              <>
                <SparklesIcon />
                <span>Generate Tailored CV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
