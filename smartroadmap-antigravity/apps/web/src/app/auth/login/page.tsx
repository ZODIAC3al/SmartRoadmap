"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, storeSession } from "@/lib/api";
import { motion } from "framer-motion";
import { useApp } from "@/components/AppContext";
import {
  Mail,
  Lock,
  ArrowRight,
  ChevronDown,
  AlertTriangle,
  Code,
  Globe,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

const localDict = {
  title: {
    en: "Sign In to SmartRoadmap",
    ar: "تسجيل الدخول إلى خارطة الطريق"
  },
  subtitle: {
    en: "Access your personalized tech syllabus path.",
    ar: "الوصول إلى مسار المنهج التعليمي المخصص لك."
  },
  email: {
    en: "Email Address",
    ar: "البريد الإلكتروني"
  },
  emailPlaceholder: {
    en: "Enter your email",
    ar: "أدخل بريدك الإلكتروني"
  },
  password: {
    en: "Password",
    ar: "كلمة المرور"
  },
  rememberMe: {
    en: "Remember me",
    ar: "تذكرني"
  },
  forgotPassword: {
    en: "Forgot Password?",
    ar: "هل نسيت كلمة المرور؟"
  },
  signIn: {
    en: "Sign In",
    ar: "تسجيل الدخول"
  },
  orOAuth: {
    en: "or OAuth",
    ar: "أو عبر تسجيل الدخول الموحد"
  },
  noAccount: {
    en: "Don't have an account?",
    ar: "ليس لديك حساب؟"
  },
  signUp: {
    en: "Sign up",
    ar: "إنشاء حساب"
  },
  faq: {
    en: "FAQ",
    ar: "الأسئلة الشائعة"
  },
  support: {
    en: "Support",
    ar: "الدعم الفني"
  }
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const { locale, toggleLocale } = useApp();
  const tLocal = (key: keyof typeof localDict) => {
    const loc = locale as "en" | "ar";
    return localDict[key][loc] || localDict[key]["en"];
  };
  const isRtl = locale === "ar";

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
    <div className={`min-h-screen -mt-24 bg-base-100 flex flex-col md:grid md:grid-cols-12 overflow-hidden select-none relative ${isRtl ? 'rtl' : 'ltr'}`}>

      {/* Top link bar floating at top left */}
      <div className={`absolute top-32 z-20 flex items-center gap-1.5 text-xs text-base-content/40 font-semibold ${isRtl ? 'right-6 md:right-12' : 'left-6 md:left-12'}`}>
        <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
        <span>{locale === 'en' ? 'New here?' : 'جديد هنا؟'}</span>
        <Link href="/auth/register" className="text-indigo-600 font-bold hover:underline">
          {tLocal('signUp')}
        </Link>
      </div>

      {/* LEFT FORM BLOCK */}
      <motion.div
        initial={{ opacity: 0, x: isRtl ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="col-span-12 md:col-span-5 flex flex-col justify-between px-8 sm:px-16 md:px-12 lg:px-20 py-10 min-h-screen bg-base-100 relative z-10 pt-40"
      >
        {/* Form panel */}
        <div className="max-w-md w-full mx-auto space-y-6 mt-10 mb-auto">
          <div className="space-y-1 text-start">
            <h1 className="text-4xl font-extrabold text-base-content tracking-tight">
              {tLocal('signIn')}
            </h1>
            <p className="text-xs text-base-content/50">
              {tLocal('subtitle')}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-error/10 text-error text-xs p-3.5 rounded-xl border border-error/20 font-semibold text-start flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-start">
            <div className="form-control">
              <label className="label text-xs font-extrabold text-base-content/60 mb-1">{tLocal('email')}</label>
              <div className="relative">
                <Mail className={`w-4 h-4 text-base-content/40 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                <input
                  type="email"
                  placeholder={tLocal('emailPlaceholder')}
                  className={`input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-11 text-sm ${isRtl ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {email.includes("@") && (
                  <CheckCircle2 className={`text-emerald-500 absolute top-1/2 -translate-y-1/2 w-4 h-4 ${isRtl ? 'left-3.5' : 'right-3.5'}`} />
                )}
              </div>
            </div>

            <div className="form-control">
              <div className="flex justify-between items-center mb-1">
                <label className="label text-xs font-extrabold text-base-content/60 p-0">{tLocal('password')}</label>
              </div>
              <div className="relative">
                <Lock className={`w-4 h-4 text-base-content/40 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-11 text-sm ${isRtl ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 pr-3.5 flex items-center text-base-content/40 hover:text-base-content/70 ${isRtl ? 'left-0' : 'right-0'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-base-content/50 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs rounded border-base-300 checkbox-primary"
                />
                <span className="text-base-content/50 font-semibold">{tLocal('rememberMe')}</span>
              </label>
              <a
                href="#"
                className="font-bold text-indigo-600 hover:underline"
                onClick={() => alert("Verification email reset simulation triggered.")}
              >
                {tLocal('forgotPassword')}
              </a>
            </div>

            <button
              type="submit"
              className="btn bg-indigo-600 hover:bg-indigo-700 border-none btn-block rounded-full text-white font-extrabold text-xs shadow-lg shadow-indigo-500/10 mt-6 h-11 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <>
                  <span>{tLocal('signIn')}</span>
                  <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <div className="flex flex-col items-center pt-2">
              <div className="relative flex py-2 items-center w-full">
                <div className="flex-grow border-t border-base-300"></div>
                <span className="flex-shrink mx-4 text-[10px] text-base-content/40 font-bold uppercase tracking-wider">
                  {tLocal('orOAuth')}
                </span>
                <div className="flex-grow border-t border-base-300"></div>
              </div>
              <div ref={googleButtonRef} className="mt-2" />
            </div>
          )}

          {/* Social logins */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button className="btn btn-circle btn-outline border-base-300 text-blue-600 hover:bg-blue-50/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button className="btn btn-circle btn-outline border-base-300 text-red-500 hover:bg-red-50/50 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </button>
          </div>

          <p className="text-center text-xs text-base-content/60 pt-4 font-semibold">
            {tLocal('noAccount')}{" "}
            <Link href="/auth/register" className="text-indigo-600 font-extrabold hover:underline">
              {tLocal('signUp')}
            </Link>
          </p>
        </div>

        {/* Language selector & footer */}
        <div className="flex justify-between items-center text-xs text-slate-400 font-semibold pt-8 w-full border-t border-base-200">
          <div
            onClick={toggleLocale}
            className="flex items-center gap-1.5 cursor-pointer text-base-content/60 hover:text-base-content"
          >
            <span className="text-sm">{locale === "en" ? "🇬🇧" : "🇸🇦"}</span>
            <span>{locale === "en" ? "ENG" : "العربية"}</span>
            <ChevronDown className="w-3 h-3 text-base-content/60" />
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">{tLocal('faq')}</a>
            <a href="#" className="hover:underline">{tLocal('support')}</a>
          </div>
        </div>
      </motion.div>

      {/* RIGHT SIDE PANEL: BEAUTIFUL CURVED BLUE VECTOR PANEL WITH FLOATING WIDGETS */}
      <div className="col-span-12 md:col-span-7 hidden md:flex flex-col justify-between bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 text-white p-16 relative overflow-hidden">
        {/* Curving separation SVG absolute overlay mimicking the mockup */}
        <div className="absolute top-0 bottom-0 left-0 w-24 h-full pointer-events-none -ml-px z-10">
          <svg className="w-full h-full text-base-100 fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 C60 20, 20 80, 0 100 Z" />
          </svg>
        </div>

        {/* Decorative background grid paths */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        {/* Floating Widgets container */}
        <div className="relative w-full h-full flex flex-col justify-center items-center z-10 max-w-lg mx-auto">
          {/* Animated Blob Background inside panel */}
          <div className="absolute w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse" />

          {/* Widget 1: Sparkline Chart Box (matches Daniel Ahmadi mockup) */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white text-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 w-64 absolute top-10 left-12 flex flex-col text-start space-y-4 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Activity</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">176,18</h3>
              </div>
              <span className="bg-slate-900 text-white font-extrabold text-xs w-8 h-8 rounded-full flex items-center justify-center">45</span>
            </div>

            {/* Sparkline curve mockup */}
            <svg className="w-full h-12 stroke-indigo-500 fill-none" viewBox="0 0 100 20">
              <path d="M 0 18 Q 15 2 30 15 T 60 4 T 90 12" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* Social Badges floating outside */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 absolute top-20 right-10 shadow-lg flex items-center justify-center text-white text-lg hover:rotate-12 transition-transform cursor-pointer"
          >
            <Code className="w-5 h-5 text-white" />
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="w-12 h-12 rounded-full bg-slate-950 absolute top-56 right-4 shadow-lg flex items-center justify-center text-white text-lg hover:rotate-12 transition-transform cursor-pointer border border-white/20"
          >
            <Globe className="w-5 h-5 text-white" />
          </motion.div>

          {/* Widget 2: Key card "Your data, your rules" */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white text-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 w-72 absolute bottom-12 right-6 flex flex-col text-start space-y-4 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-center gap-3">
              <span className="bg-amber-100 text-amber-600 p-2.5 rounded-2xl text-xl flex items-center justify-center">
                <Key className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Your data, your rules</h4>
                <p className="text-[10px] text-slate-400">Everything is strictly encrypted.</p>
              </div>
            </div>
            {/* Skeletal detail rows */}
            <div className="space-y-2">
              <div className="h-1.5 bg-slate-100 rounded-full w-full" />
              <div className="h-1.5 bg-slate-100 rounded-full w-5/6" />
              <div className="h-1.5 bg-slate-100 rounded-full w-4/6" />
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
