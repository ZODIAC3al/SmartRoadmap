"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, storeSession } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"learner" | "company">("learner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Learner Onboard Extra Details
  const [targetGoal, setTargetGoal] = useState("Frontend Engineer");
  const [education, setEducation] = useState("Computer Science Degree");

  // Company Onboard Extra Details
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("SaaS / Software");
  const [website, setWebsite] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleNext = () => {
    if (step === 1) {
      if (!name || !email || !password) {
        setErrorMsg("Please populate all credential fields.");
        return;
      }
      setErrorMsg("");
      setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const regRes = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, role }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.message || "Registration failed.");
      }

      if (role === "learner") {
        localStorage.setItem(
          "learner_onboarding",
          JSON.stringify({ targetGoal, education }),
        );
      }

      storeSession(regData);

      if (role === "learner") {
        router.push("/onboarding");
      } else {
        router.push("/company");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during account generation.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col md:grid md:grid-cols-12 overflow-hidden select-none">
      {/* LEFT FORM BLOCK */}
      <div className="col-span-12 md:col-span-5 flex flex-col justify-between px-8 sm:px-16 md:px-12 lg:px-20 py-10 min-h-screen bg-base-100 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-emerald-600">
          <svg className="w-8 h-8 text-emerald-500 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 2.76 1.12 5.26 2.93 7.07L12 11.12l7.07 7.95C20.88 17.26 22 14.76 22 12c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
          <span className="text-base-content font-extrabold tracking-wide">SmartRoadmap</span>
        </div>

        {/* Form panel */}
        <div className="max-w-md w-full mx-auto space-y-6 my-auto pt-6">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider font-mono text-indigo-650">
            <span>Step {step} of 2</span>
            <span>•</span>
            <span className="text-base-content/40">
              {step === 1 ? "Credentials Configuration" : "Onboard Profile"}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-base-content tracking-tight">
              Create your Account
            </h1>
            <p className="text-sm text-base-content/60">
              Join pre-vetted recruiter paths and generate adaptive roadmaps.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* STEP 1: CREDENTIALS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label text-xs font-bold text-base-content/70 mb-1">
                  I want to register as
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("learner")}
                    className={`btn text-xs font-bold rounded-xl h-11 border ${
                      role === "learner"
                        ? "bg-indigo-650 text-white hover:bg-indigo-700 border-none animate-none"
                        : "bg-transparent text-base-content border-base-300 hover:bg-base-200"
                    }`}
                  >
                    🎓 Learner
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("company")}
                    className={`btn text-xs font-bold rounded-xl h-11 border ${
                      role === "company"
                        ? "bg-indigo-650 text-white hover:bg-indigo-700 border-none animate-none"
                        : "bg-transparent text-base-content border-base-300 hover:bg-base-200"
                    }`}
                  >
                    💼 Recruiter
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold text-base-content/70 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl focus:border-indigo-650 focus:ring-1 focus:ring-indigo-650 h-11 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold text-base-content/70 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl focus:border-indigo-650 focus:ring-1 focus:ring-indigo-650 h-11 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold text-base-content/70 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Create password"
                  className="input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl focus:border-indigo-650 focus:ring-1 focus:ring-indigo-650 h-11 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="btn bg-indigo-650 hover:bg-indigo-700 border-none btn-block rounded-xl text-white font-bold text-sm shadow-md mt-6 h-11"
              >
                Continue to Onboarding →
              </button>
            </div>
          )}

          {/* STEP 2: PROFILE ONBOARDING */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
              {role === "learner" ? (
                <>
                  <div className="form-control">
                    <label className="label text-xs font-bold text-base-content/70 mb-1">
                      Target Career Goal
                    </label>
                    <select
                      className="select select-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl text-sm focus:border-indigo-650 h-11"
                      value={targetGoal}
                      onChange={(e) => setTargetGoal(e.target.value)}
                    >
                      <option>Frontend Engineer</option>
                      <option>Backend Developer</option>
                      <option>Data Scientist</option>
                      <option>DevOps Engineer</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label text-xs font-bold text-base-content/70 mb-1">
                      Highest Level of Education
                    </label>
                    <select
                      className="select select-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl text-sm focus:border-indigo-655 h-11"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                    >
                      <option>Computer Science Degree</option>
                      <option>Bootcamp/Self-Taught</option>
                      <option>Non-Tech Graduate</option>
                      <option>High School Student</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-control">
                    <label className="label text-xs font-bold text-base-content/70 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Osome Systems Ltd"
                      className="input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl text-sm focus:border-indigo-650 h-11"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label text-xs font-bold text-base-content/70 mb-1">
                      Industry Focus
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fintech / Logistics"
                      className="input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl text-sm focus:border-indigo-650 h-11"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label text-xs font-bold text-base-content/70 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      className="input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl text-sm focus:border-indigo-650 h-11"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-outline border-base-300 hover:bg-base-200 flex-1 rounded-xl h-11 text-base-content/70 text-xs"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-650 hover:bg-indigo-700 border-none flex-1 rounded-xl text-white h-11 text-sm shadow-md"
                  disabled={loading}
                >
                  {loading && <span className="loading loading-spinner loading-sm mr-2" />}
                  Register
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-base-content/60 pt-4">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-indigo-655 font-extrabold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 text-xs text-base-content/40 font-medium pt-8">
          <a href="#" className="hover:underline">FAQ</a>
          <span>|</span>
          <a href="#" className="hover:underline">Features</a>
          <span>|</span>
          <a href="#" className="hover:underline">Support</a>
        </div>
      </div>

      {/* RIGHT SIDE PANEL */}
      <div className="col-span-12 md:col-span-7 hidden md:flex flex-col justify-between bg-indigo-600 text-white p-16 relative overflow-hidden">
        <svg
          className="absolute top-0 bottom-0 left-0 w-24 h-full text-white fill-current pointer-events-none -ml-px"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path d="M100 0 C30 30, 0 60, 100 100 Z" />
        </svg>

        <div className="max-w-md space-y-6 pt-10 pl-12 relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight">Join SmartRoadmap Today</h2>
          <p className="text-indigo-100 leading-relaxed text-sm">
            Ready to prove your capabilities? Log in, configure your availability scheduling, and pass verified badges designed to showcase your talent to leading companies.
          </p>
        </div>

        {/* Front SVG graphics */}
        <div className="w-full h-64 relative mt-auto z-10 select-none">
          <svg className="absolute bottom-0 right-0 w-full h-full text-indigo-500 fill-current opacity-90" viewBox="0 0 500 200" preserveAspectRatio="none">
            <path d="M0 160 Q150 110 300 150 T500 120 L500 200 L0 200 Z" fill="#4f46e5" />
            <path d="M0 180 Q100 150 250 180 T500 160 L500 200 L0 200 Z" fill="#4338ca" />
            <g transform="translate(120, 130)" fill="#fbbf24">
              <circle cx="10" cy="10" r="10" />
              <circle cx="16" cy="6" r="6" />
              <polygon points="21,5 24,7 21,9" fill="#f59e0b" />
              <polygon points="12,18 10,24 8,24" stroke="#f59e0b" strokeWidth="2" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
