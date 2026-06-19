'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'learner' | 'company'>('learner');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Learner Onboard Extra Details
  const [targetGoal, setTargetGoal] = useState('Frontend Engineer');
  const [education, setEducation] = useState('Computer Science Degree');

  // Company Onboard Extra Details
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('SaaS / Software');
  const [website, setWebsite] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!name || !email || !password) {
        setErrorMsg('Please populate all credential fields.');
        return;
      }
      setErrorMsg('');
      setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const regRes = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.message || 'Registration failed.');
      }

      if (role === 'learner') {
        localStorage.setItem('learner_onboarding', JSON.stringify({ targetGoal, education }));
      } else {
        await fetch('http://localhost:3000/hiring/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Mock Initial Position',
            company: companyName || name,
            location: 'Remote',
            country: 'US',
            requiredSkills: ['JavaScript', 'React'],
            remote: true,
            description: `Initial listing for ${companyName || name}.`
          })
        });
      }

      localStorage.setItem('smart_token', regData.token);
      localStorage.setItem('smart_user', JSON.stringify(regData.user));

      if (role === 'learner') {
        router.push('/onboarding');
      } else {
        router.push('/company');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during account generation.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:grid md:grid-cols-12">
      
      {/* LEFT COLUMN: REGISTRATION WIZARD */}
      <div className="col-span-6 flex flex-col justify-center px-6 sm:px-16 md:px-20 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          {/* Logo Header */}
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#0f67fd]">
            <div className="w-8 h-8 rounded-lg bg-[#0f67fd] flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-gray-900">dotwork</span>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider font-mono text-[#0f67fd]">
            <span>Step {step} of 2</span>
            <span>•</span>
            <span className="text-gray-400">{step === 1 ? 'Credentials Configuration' : 'Onboard Profile'}</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Create your Account</h2>
            <p className="text-xs text-gray-500 mt-2">Join pre-vetted recruiter paths and generate adaptive roadmaps.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-100">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* STEP 1: CREDENTIALS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label text-caption font-mono uppercase text-gray-400 font-bold p-0 mb-1.5">I want to register as</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('learner')}
                    className={`btn text-xs font-semibold rounded-xl h-11 border ${role === 'learner' ? 'bg-[#0f67fd] text-white hover:bg-[#0d59db] border-none' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    🎓 Learner
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('company')}
                    className={`btn text-xs font-semibold rounded-xl h-11 border ${role === 'company' ? 'bg-[#0f67fd] text-white hover:bg-[#0d59db] border-none' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    💼 Recruiter
                  </button>
                </div>
              </div>

              <div className="form-control">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="input input-bordered w-full pl-10 bg-white border-gray-200 text-gray-800 rounded-xl placeholder-gray-400 text-sm focus:border-[#0f67fd] focus:ring-1 focus:ring-[#0f67fd] h-12"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="input input-bordered w-full pl-10 bg-white border-gray-200 text-gray-800 rounded-xl placeholder-gray-400 text-sm focus:border-[#0f67fd] focus:ring-1 focus:ring-[#0f67fd] h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="Password"
                    className="input input-bordered w-full pl-10 bg-white border-gray-200 text-gray-800 rounded-xl placeholder-gray-400 text-sm focus:border-[#0f67fd] focus:ring-1 focus:ring-[#0f67fd] h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="btn bg-[#0f67fd] hover:bg-[#0d59db] border-none btn-block rounded-xl text-white font-semibold text-sm shadow-md mt-6 h-12"
              >
                Continue to Onboarding →
              </button>
            </div>
          )}

          {/* STEP 2: PROFILE DETAILS */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
              {role === 'learner' ? (
                <>
                  <div className="form-control">
                    <label className="label text-caption font-mono uppercase text-gray-400 font-bold p-0 mb-1.5">Target Career Goal</label>
                    <select
                      className="select select-bordered w-full bg-white border-gray-200 text-gray-800 rounded-xl text-sm focus:border-[#0f67fd] h-12"
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
                    <label className="label text-caption font-mono uppercase text-gray-400 font-bold p-0 mb-1.5">Highest Level of Education</label>
                    <select
                      className="select select-bordered w-full bg-white border-gray-200 text-gray-800 rounded-xl text-sm focus:border-[#0f67fd] h-12"
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
                    <label className="label text-caption font-mono uppercase text-gray-400 font-bold p-0 mb-1.5">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Osome Systems Ltd"
                      className="input input-bordered w-full bg-white border-gray-200 text-gray-800 rounded-xl placeholder-gray-400 text-sm focus:border-[#0f67fd] h-12"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label text-caption font-mono uppercase text-gray-400 font-bold p-0 mb-1.5">Industry Focus</label>
                    <input
                      type="text"
                      placeholder="e.g. Fintech / Logistics"
                      className="input input-bordered w-full bg-white border-gray-200 text-gray-800 rounded-xl placeholder-gray-400 text-sm focus:border-[#0f67fd] h-12"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label text-caption font-mono uppercase text-gray-400 font-bold p-0 mb-1.5">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      className="input input-bordered w-full bg-white border-gray-200 text-gray-800 rounded-xl placeholder-gray-400 text-sm focus:border-[#0f67fd] h-12"
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
                  className="btn btn-outline border-gray-200 hover:bg-gray-50 flex-1 rounded-xl h-12 text-gray-700"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn bg-[#0f67fd] hover:bg-[#0d59db] border-none flex-1 rounded-xl text-white h-12 text-sm shadow-md"
                  disabled={loading}
                >
                  {loading && <span className="loading loading-spinner loading-sm" />}
                  Register
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#0f67fd] font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: SHOWCASE BLUE PANEL */}
      <div className="col-span-6 hidden md:flex flex-col justify-center items-center bg-[#0f67fd] text-white p-12 relative">
        <div className="max-w-md text-center space-y-8 flex flex-col items-center">
          
          {/* SVG Connected Graphic */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center font-bold font-mono">
                DW
              </div>
            </div>
            
            <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-black font-bold">
              🎓
            </div>
            <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-black font-bold">
              ⚡
            </div>
            <div className="absolute top-12 right-0 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-black font-bold">
              💼
            </div>

            <svg className="absolute inset-0 w-full h-full text-white/20 pointer-events-none" viewBox="0 0 100 100">
              <line x1="25" y1="25" x2="50" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="4" />
              <line x1="25" y1="75" x2="50" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="4" />
              <line x1="75" y1="35" x2="50" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="4" />
            </svg>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Verify your credentials.</h3>
            <p className="text-xs text-white/80 max-w-sm mx-auto leading-relaxed">
              Build your customized learning timeline milestones, clear assessments, and document verified scores to stand out.
            </p>
          </div>

          <div className="flex gap-2 justify-center mt-6">
            <span className="w-2.5 h-2.5 rounded-full bg-white/35"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/35"></span>
          </div>
        </div>
      </div>

    </div>
  );
}
