"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, storeSession } from "@/lib/api";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      storeSession(data);
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiFetch("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken: credential }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Google authentication failed");

      storeSession(data);
      router.push(data.user?.role === "company" ? "/company" : "/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      const google = (window as any).google;
      if (!google) return;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) =>
          handleGoogleCredential(response.credential),
      });
      google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

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
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-base-content tracking-tight">
              Welcome to SmartRoadmap
            </h1>
            <p className="text-sm text-base-content/60">
              Sign in to manage and optimize your adaptive learning path.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control">
              <label className="label text-xs font-bold text-base-content/70 mb-1">Email / Username</label>
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
              <div className="flex justify-between items-center mb-1">
                <label className="label text-xs font-bold text-base-content/70 p-0">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl focus:border-indigo-650 focus:ring-1 focus:ring-indigo-650 h-11 text-sm pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content/70"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-base-content/50 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs rounded border-base-300 checkbox-primary"
                />
                <span className="text-base-content/50">Remember me</span>
              </label>
              <a
                href="#"
                className="font-bold text-indigo-600 hover:underline"
                onClick={() => alert("Verification email reset simulation triggered.")}
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="btn bg-indigo-650 hover:bg-indigo-700 border-none btn-block rounded-xl text-white font-bold text-sm shadow-md mt-6 h-11"
              disabled={loading}
            >
              {loading && <span className="loading loading-spinner loading-sm mr-2" />}
              LOGIN
            </button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <div className="flex flex-col items-center pt-2">
              <div className="relative flex py-2 items-center w-full">
                <div className="flex-grow border-t border-base-200"></div>
                <span className="flex-shrink mx-4 text-[10px] text-base-content/40 font-bold uppercase tracking-wider">
                  or OAuth
                </span>
                <div className="flex-grow border-t border-base-200"></div>
              </div>
              <div ref={googleButtonRef} className="mt-2" />
            </div>
          )}

          <p className="text-center text-xs text-base-content/60 pt-4">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-indigo-600 font-extrabold hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 text-xs text-slate-400 font-medium pt-8">
          <a href="#" className="hover:underline">FAQ</a>
          <span>|</span>
          <a href="#" className="hover:underline">Features</a>
          <span>|</span>
          <a href="#" className="hover:underline">Support</a>
        </div>
      </div>

      {/* RIGHT SIDE PANEL: BEAUTIFUL CURVED BLUE VECTOR PANEL */}
      <div className="col-span-12 md:col-span-7 hidden md:flex flex-col justify-between bg-indigo-600 text-white p-16 relative overflow-hidden">
        {/* Curving separation SVG absolute overlay */}
        <svg
          className="absolute top-0 bottom-0 left-0 w-24 h-full text-white fill-current pointer-events-none -ml-px"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path d="M100 0 C30 30, 0 60, 100 100 Z" />
        </svg>

        <div className="max-w-md space-y-6 pt-10 pl-12 relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight">About SmartRoadmap</h2>
          <p className="text-indigo-100 leading-relaxed text-sm">
            Everything you need to advance your career. Build diagnostic roadmaps, pass adaptive tests, and lock pre-vetted career profiles mapped to recruiter pipelines.
          </p>
          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <span className="bg-white/20 p-1.5 rounded-lg">🚀</span>
              <div>
                <h4 className="font-bold text-sm">AI-Generated Curriculum</h4>
                <p className="text-xs text-indigo-100">Custom timelines based on target career roles.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-white/20 p-1.5 rounded-lg">🎯</span>
              <div>
                <h4 className="font-bold text-sm">Adaptive Quizzes</h4>
                <p className="text-xs text-indigo-100">Verify skills via difficulty-scaling assessment engines.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SVG ILLUSTRATED FARMLAND & BIRDS GRAPHIC MATCHING MOCKUP */}
        <div className="w-full h-64 relative mt-auto z-10 select-none">
          <svg className="absolute bottom-0 right-0 w-full h-full text-indigo-500 fill-current opacity-90" viewBox="0 0 500 200" preserveAspectRatio="none">
            {/* Hills */}
            <path d="M0 160 Q150 110 300 150 T500 120 L500 200 L0 200 Z" fill="#4f46e5" />
            <path d="M0 180 Q100 150 250 180 T500 160 L500 200 L0 200 Z" fill="#4338ca" />
            
            {/* Cute vector chickens/birds mimicking mockup */}
            {/* Chick 1 */}
            <g transform="translate(120, 130)" fill="#fbbf24">
              <circle cx="10" cy="10" r="10" />
              <circle cx="16" cy="6" r="6" />
              <polygon points="21,5 24,7 21,9" fill="#f59e0b" />
              <polygon points="12,18 10,24 8,24" stroke="#f59e0b" strokeWidth="2" />
              <polygon points="16,18 14,24 12,24" stroke="#f59e0b" strokeWidth="2" />
            </g>
            {/* Chick 2 */}
            <g transform="translate(240, 150)" fill="#fef08a">
              <circle cx="10" cy="10" r="8" />
              <circle cx="15" cy="7" r="5" />
              <polygon points="19,6 22,8 19,10" fill="#f59e0b" />
              <polygon points="11,17 9,22 7,22" stroke="#f59e0b" strokeWidth="1.5" />
            </g>
            {/* Barn */}
            <g transform="translate(380, 110)">
              <rect x="0" y="20" width="50" height="40" fill="#ef4444" rx="4" />
              <polygon points="-5,20 25,0 55,20" fill="#991b1b" />
              <rect x="15" y="35" width="20" height="25" fill="#fee2e2" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
