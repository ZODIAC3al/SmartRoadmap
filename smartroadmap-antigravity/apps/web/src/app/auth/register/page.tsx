"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, storeSession } from "@/lib/api";
import { motion } from "framer-motion";
import { useApp } from "@/components/AppContext";
import {
  GraduationCap,
  Briefcase,
  User,
  Mail,
  Lock,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  AlertTriangle,
  Code,
  Globe,
  Key,
} from "lucide-react";


const localDict = {
  title: {
    en: "Sign Up to SmartRoadmap",
    ar: "إنشاء حساب في خارطة الطريق"
  },
  subtitle: {
    en: "Create your account to start mapping your curriculum.",
    ar: "أنشئ حسابك للبدء في تخطيط مسارك التعليمي."
  },
  registerAs: {
    en: "I want to register as",
    ar: "أريد التسجيل كـ"
  },
  learner: {
    en: "Learner",
    ar: "طالب علم"
  },
  recruiter: {
    en: "Recruiter",
    ar: "مسؤول توظيف"
  },
  fullName: {
    en: "Full Name",
    ar: "الاسم الكامل"
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
  continue: {
    en: "Continue to Onboarding",
    ar: "المتابعة لإعداد الحساب"
  },
  hasAccount: {
    en: "Already have an account?",
    ar: "لديك حساب بالفعل؟"
  },
  signIn: {
    en: "Sign in",
    ar: "تسجيل الدخول"
  },
  targetGoal: {
    en: "Target Career Goal",
    ar: "هدف الوظيفة المستهدفة"
  },
  education: {
    en: "Highest Level of Education",
    ar: "أعلى مستوى تعليمي"
  },
  companyName: {
    en: "Company Name",
    ar: "اسم الشركة"
  },
  industry: {
    en: "Industry Focus",
    ar: "مجال الصناعة"
  },
  website: {
    en: "Website URL",
    ar: "رابط الموقع الإلكتروني"
  },
  back: {
    en: "Back",
    ar: "رجوع"
  },
  register: {
    en: "Register",
    ar: "إنشاء الحساب"
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

export default function RegisterPage() {
  const { locale, toggleLocale } = useApp();
  const tLocal = (key: keyof typeof localDict) => {
    const loc = locale as "en" | "ar";
    return localDict[key][loc] || localDict[key]["en"];
  };
  const isRtl = locale === "ar";

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
    <div className={`min-h-screen -mt-24 bg-base-100 flex flex-col md:grid md:grid-cols-12 overflow-hidden select-none relative ${isRtl ? 'rtl' : 'ltr'}`}>

      {/* Top link bar floating at top left */}
      <div className={`absolute top-6 z-20 flex items-center gap-1.5 text-xs text-base-content/40 font-semibold ${isRtl ? 'right-6 md:right-12' : 'left-6 md:left-12'}`}>
        <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
        <span>{tLocal('hasAccount')}</span>
        <Link href="/auth/login" className="text-indigo-600 font-bold hover:underline">
          {tLocal('signIn')}
        </Link>
      </div>

      {/* LEFT FORM BLOCK */}
      <motion.div
        initial={{ opacity: 0, x: isRtl ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="col-span-12 md:col-span-5 flex flex-col justify-between px-8 sm:px-16 md:px-12 lg:px-20 py-10 min-h-screen bg-base-100 relative z-10 pt-24"
      >
        {/* Form panel */}
        <div className="max-w-md w-full mx-auto space-y-6 my-auto">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider font-mono text-indigo-600 text-start">
            <span>{locale === 'en' ? `Step ${step} of 2` : `الخطوة ${step} من 2`}</span>
            <span>•</span>
            <span className="text-base-content/40">
              {step === 1
                ? (locale === 'en' ? "Credentials Configuration" : "إعداد الحساب")
                : (locale === 'en' ? "Onboard Profile" : "الملف الشخصي")}
            </span>
          </div>

          <div className="space-y-1 text-start">
            <h1 className="text-4xl font-extrabold text-base-content tracking-tight">
              {tLocal('register')}
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

          {/* STEP 1: CREDENTIALS */}
          {step === 1 && (
            <div className="space-y-4 text-start">
              <div className="form-control">
                <label className="label text-xs font-extrabold text-base-content/60 mb-1">
                  {tLocal('registerAs')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("learner")}
                    className={`btn text-xs font-extrabold rounded-full h-11 border flex items-center justify-center gap-1.5 ${role === "learner"
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 border-none animate-none"
                      : "bg-transparent text-base-content border-base-300 hover:bg-base-200"
                      }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>{tLocal('learner')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("company")}
                    className={`btn text-xs font-extrabold rounded-full h-11 border flex items-center justify-center gap-1.5 ${role === "company"
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 border-none animate-none"
                      : "bg-transparent text-base-content border-base-300 hover:bg-base-200"
                      }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>{tLocal('recruiter')}</span>
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label text-xs font-extrabold text-base-content/60 mb-1">{tLocal('fullName')}</label>
                <div className="relative">
                  <User className={`w-4 h-4 text-base-content/40 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                  <input
                    type="text"
                    placeholder="Daniel Ahmadi"
                    className={`input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-11 text-sm ${isRtl ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  {name.length > 2 && (
                    <CheckCircle2 className={`text-emerald-500 absolute top-1/2 -translate-y-1/2 w-4 h-4 ${isRtl ? 'left-3.5' : 'right-3.5'}`} />
                  )}
                </div>
              </div>

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
                <label className="label text-xs font-extrabold text-base-content/60 mb-1">{tLocal('password')}</label>
                <div className="relative">
                  <Lock className={`w-4 h-4 text-base-content/40 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-11 text-sm ${isRtl ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {/* password strength ticks mimicking mockup */}
                <div className="flex gap-1.5 mt-2.5">
                  <div className={`h-1 flex-1 rounded-full ${password.length >= 6 ? "bg-emerald-500" : "bg-base-300"}`} />
                  <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? "bg-emerald-500" : "bg-base-300"}`} />
                  <div className={`h-1 flex-1 rounded-full ${password.length >= 10 ? "bg-emerald-500" : "bg-base-300"}`} />
                  <span className="text-[9px] font-bold text-base-content/45 uppercase ml-2 leading-none">
                    {password.length < 6 ? (locale === 'en' ? "Weak" : "ضعيف") : password.length < 9 ? (locale === 'en' ? "Good" : "جيد") : (locale === 'en' ? "Strong" : "قوي")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="btn bg-indigo-600 hover:bg-indigo-700 border-none btn-block rounded-full text-white font-extrabold text-xs shadow-lg shadow-indigo-500/10 mt-6 h-11 flex items-center justify-center gap-2"
              >
                <span>{tLocal('continue')}</span>
                <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

          {/* STEP 2: PROFILE ONBOARDING */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4 text-start">
              {role === "learner" ? (
                <>
                  <div className="form-control">
                    <label className="label text-xs font-extrabold text-base-content/60 mb-1">
                      {tLocal('targetGoal')}
                    </label>
                    <select
                      className={`select select-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl text-sm focus:border-indigo-600 h-11 ${isRtl ? 'text-right' : 'text-left'}`}
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
                    <label className="label text-xs font-extrabold text-base-content/60 mb-1">
                      {tLocal('education')}
                    </label>
                    <select
                      className={`select select-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl text-sm focus:border-indigo-600 h-11 ${isRtl ? 'text-right' : 'text-left'}`}
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
                    <label className="label text-xs font-extrabold text-base-content/60 mb-1">
                      {tLocal('companyName')}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Osome Systems Ltd"
                      className={`input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl text-sm focus:border-indigo-600 h-11 ${isRtl ? 'text-right' : 'text-left'}`}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label text-xs font-extrabold text-base-content/60 mb-1">
                      {tLocal('industry')}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fintech / Logistics"
                      className={`input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl text-sm focus:border-indigo-600 h-11 ${isRtl ? 'text-right' : 'text-left'}`}
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label text-xs font-extrabold text-base-content/60 mb-1">
                      {tLocal('website')}
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      className={`input input-bordered w-full bg-transparent border-base-300 text-base-content rounded-xl text-sm focus:border-indigo-600 h-11 ${isRtl ? 'text-right' : 'text-left'}`}
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
                  className="btn btn-outline border-base-300 hover:bg-base-200 flex-1 rounded-full h-11 text-base-content/70 text-xs font-bold"
                >
                  {isRtl ? 'رجوع ←' : '← Back'}
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 border-none flex-1 rounded-full text-white h-11 text-xs font-extrabold shadow-lg shadow-indigo-500/10"
                  disabled={loading}
                >
                  {loading && <span className="loading loading-spinner loading-xs mr-1" />}
                  {tLocal('register')}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-base-content/60 pt-4 font-semibold">
            {tLocal('hasAccount')}{" "}
            <Link href="/auth/login" className="text-indigo-600 font-extrabold hover:underline">
              {tLocal('signIn')}
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

      {/* RIGHT SIDE PANEL: CURVED INDIGO BLUE PANEL WITH FLOATING ELEMENTS */}
      <div className="col-span-12 md:col-span-7 hidden md:flex flex-col justify-between bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 text-white p-16 relative overflow-hidden">
        {/* Curving separation overlay */}
        <div className="absolute top-0 bottom-0 left-0 w-24 h-full pointer-events-none -ml-px z-10">
          <svg className="w-full h-full text-base-100 fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 C60 20, 20 80, 0 100 Z" />
          </svg>
        </div>

        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        {/* Floating Widgets container */}
        <div className="relative w-full h-full flex flex-col justify-center items-center z-10 max-w-lg mx-auto">
          {/* Animated Blob */}
          <div className="absolute w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse" />

          {/* Widget 1: Sparkline Chart Box */}
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
