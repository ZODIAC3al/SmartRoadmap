import React from "react";

const TEAM = [
  { name: "Mohamed Elsaied", role: "Co-founder, Backend & Architecture" },
  { name: "Ali Maher", role: "Co-founder, AI Integration & Frontend" },
  { name: "Marina George", role: "Product & Hiring Pipeline" },
  { name: "Nada Nasr", role: "Learning Experience Design" },
];

// Simple reusable line-art figure components, original style (not copied from any source)
function PersonAtDesk({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" className={className} fill="none">
      <circle cx="40" cy="28" r="14" stroke="currentColor" strokeWidth="2" />
      <path
        d="M40 42 L40 80 M25 55 L40 65 L55 50 M25 100 L40 80 L55 100"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="60"
        y="60"
        width="40"
        height="26"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="105"
        x2="110"
        y2="105"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function PersonThinking({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} fill="none">
      <circle cx="50" cy="26" r="14" stroke="currentColor" strokeWidth="2" />
      <path
        d="M50 40 L50 75 M35 55 L50 62 L65 52 M35 105 L50 75 L65 105"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M62 18 Q72 14 76 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="80" cy="18" r="2" fill="currentColor" />
      <circle cx="86" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

function HeadWithIdeas({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none">
      <path
        d="M80 130 Q50 130 50 95 Q50 65 80 65 Q110 65 110 95 Q110 130 80 130 Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M65 130 L60 150 M95 130 L100 150"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="20"
        y="20"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="80" cy="20" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M130 15 L140 25 M140 15 L130 25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect
        x="120"
        y="50"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="30" cy="70" r="8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-base-100 text-base-content min-h-screen">
      {/* Header */}
      <section className="max-w-2xl mx-auto px-6 pb-10">
        <p className="text-xs text-gray-400 mb-3">About SmartRoadmap</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          A Story of Mastery and the Future of Hiring
        </h1>
      </section>

      {/* Block 1 */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="text-[#004b49] mb-8">
          <PersonAtDesk className="w-44" />
        </div>
        <p className="text-base text-gray-700 leading-relaxed mb-4">
          Hi there. If you&apos;re reading this, you&apos;re probably like most
          candidates we talk to — spending months sending out resumes shaped to
          fit a keyword filter, hoping someone notices the work underneath.
        </p>
        <p className="text-base text-gray-700 leading-relaxed">
          You&apos;ve probably taken a dozen scattered courses, half-finished a
          dozen more, and still aren&apos;t sure what to study next or whether
          any of it would convince a hiring manager. We built SmartRoadmap to
          answer that question directly.
        </p>
      </section>

      {/* Block 2 */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="text-[#004b49] mb-8">
          <PersonThinking className="w-32" />
        </div>
        <p className="text-base text-gray-700 leading-relaxed mb-4">
          For decades, the path from &ldquo;learning to code&rdquo; to
          &ldquo;getting hired to code&rdquo; ran through a CV — a static
          document built to be skimmed in six seconds, not to prove anything.
        </p>
        <p className="text-base text-gray-700 leading-relaxed">
          Online courses multiplied the options but never closed that gap.
          Certificates piled up. None of them told a recruiter, with any
          confidence, what a candidate could actually do under pressure.
        </p>
      </section>

      {/* Block 3 — the idea */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="text-[#004b49] mb-8">
          <HeadWithIdeas className="w-40" />
        </div>
        <p className="text-base text-gray-700 leading-relaxed mb-4">
          Then large language models made something new possible: a curriculum
          that reshapes itself around one person, in real time, instead of a
          fixed syllabus built for the average learner.
        </p>
        <p className="text-base text-gray-700 leading-relaxed">
          Pair that with adaptive assessments that get harder or easier based on
          how you answer, and for the first time a platform can measure mastery
          directly — not guess at it from a transcript.
        </p>
      </section>

      {/* Block 4 — what we built */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center">
            <div className="text-[#818cf8] mb-3 flex justify-center">
              <svg viewBox="0 0 80 80" className="w-16" fill="none">
                <rect
                  x="15"
                  y="20"
                  width="50"
                  height="35"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="40"
                  cy="37"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="10"
                  y1="62"
                  x2="70"
                  y2="62"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <p className="text-xs font-semibold text-gray-700">
              Adaptive Roadmaps
            </p>
          </div>
          <div className="text-center">
            <div className="text-[#00875a] mb-3 flex justify-center">
              <svg viewBox="0 0 80 80" className="w-16" fill="none">
                <path
                  d="M40 12 L65 25 L65 50 Q65 65 40 70 Q15 65 15 50 L15 25 Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M30 40 L38 48 L52 30"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-xs font-semibold text-gray-700">
              Verified Mastery
            </p>
          </div>
        </div>
        <p className="text-base text-gray-700 leading-relaxed">
          That&apos;s where SmartRoadmap comes in. We built a closed loop:
          diagnose what you actually know, generate the exact path to close the
          gap, prove each step with a quiz, and surface the result directly to
          teams who are hiring for it.
        </p>
      </section>

      {/* Block 5 — for both sides */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="text-[#004b49] mb-8">
          <PersonAtDesk className="w-44" />
        </div>
        <p className="text-base text-gray-700 leading-relaxed mb-4">
          Hopefully you&apos;ve gotten a good sense of why we started
          SmartRoadmap. Breaking away from a hiring process built on
          keyword-matched resumes isn&apos;t an easy task — but we think
          it&apos;s the right one.
        </p>
        <p className="text-base text-gray-700 leading-relaxed">
          If you&apos;re a candidate tired of guessing what to learn next, or a
          hiring manager tired of skimming hundreds of identical CVs, we built
          this for you. See you on the roadmap.
        </p>
      </section>

      {/* Quote */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <blockquote className="text-lg sm:text-xl font-medium text-gray-900 italic leading-snug">
          &ldquo;You don&apos;t need a better resume. You need proof.&rdquo;
        </blockquote>
        <p className="text-sm text-gray-500 mt-3">
          — SmartRoadmap founding principle
        </p>
      </section>

      {/* Join Us */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Join Us</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          SmartRoadmap is built and maintained by a small team based in
          Alexandria, Egypt. We care about clean architecture, real data over
          mock fallbacks, and giving every candidate a fair, measurable shot.
        </p>
      </section>

      {/* Team grid */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Our Team</h2>
        <p className="text-sm text-gray-500 mb-8">
          The people building SmartRoadmap end to end.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {TEAM.map((person) => (
            <div key={person.name} className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#004b49]/10 text-[#004b49] flex items-center justify-center mx-auto mb-3 font-bold text-sm">
                {person.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <p className="text-xs font-semibold text-gray-900">
                {person.name}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                {person.role}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
