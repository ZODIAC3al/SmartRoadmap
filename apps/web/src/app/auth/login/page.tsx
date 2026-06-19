'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('smart_token', data.token);
      localStorage.setItem('smart_user', JSON.stringify(data.user));

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMockLogin = async (mockEmail: string, mockName: string, role: string) => {
    setLoading(true);
    setShowGoogleModal(false);
    try {
      const res = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mockEmail, name: mockName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google Auth failed');
      }

      const userPayload = { ...data.user, role };
      localStorage.setItem('smart_token', data.token);
      localStorage.setItem('smart_user', JSON.stringify(userPayload));

      if (role === 'company') {
        router.push('/company');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:grid md:grid-cols-12">
      
      {/* LEFT COLUMN: AUTH FORM */}
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

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Log in to your Account</h2>
            <p className="text-xs text-gray-500 mt-2">Welcome back! Select method to log in:</p>
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowGoogleModal(true)}
              className="btn btn-outline border-gray-200 hover:bg-gray-50 text-gray-700 bg-white text-xs font-semibold rounded-xl h-11 flex items-center justify-center gap-2 hover:border-gray-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02.75 12 .75c-4.66 0-8.62 2.68-10.51 6.59l3.75 2.91C6.12 7.37 8.82 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.52z" />
                <path fill="#FBBC05" d="M5.24 14.65c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.49 7.16C.54 9.12 0 11.31 0 12.64s.54 3.52 1.49 5.48l3.75-2.91C4.86 16.22 4.72 15.45 5.24 14.65z" />
                <path fill="#34A853" d="M12 23.25c3.24 0 5.97-1.08 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.96 1.09-3.18 0-5.88-2.33-6.84-5.48l-3.75 2.91C3.38 20.57 7.34 23.25 12 23.25z" />
              </svg>
              Google
            </button>
            <button
              onClick={() => alert('Simulated Facebook Login triggered.')}
              className="btn btn-outline border-gray-200 hover:bg-gray-50 text-gray-700 bg-white text-xs font-semibold rounded-xl h-11 flex items-center justify-center gap-2 hover:border-gray-300"
            >
              <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          {/* Separator */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-medium uppercase font-mono tracking-wider">or continue with email</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-100">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="Email"
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="input input-bordered w-full pl-10 pr-10 bg-white border-gray-200 text-gray-800 rounded-xl placeholder-gray-400 text-sm focus:border-[#0f67fd] focus:ring-1 focus:ring-[#0f67fd] h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-primary rounded-md" />
                <span>Remember me</span>
              </label>
              <a href="#" className="font-semibold text-[#0f67fd] hover:underline" onClick={() => alert('Verification email reset simulation triggered.')}>
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="btn bg-[#0f67fd] hover:bg-[#0d59db] border-none btn-block rounded-xl text-white font-semibold text-sm shadow-md mt-6 h-12"
              disabled={loading}
            >
              {loading && <span className="loading loading-spinner loading-sm" />}
              Log in
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-[#0f67fd] font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: SHOWCASE BLUE PANEL */}
      <div className="col-span-6 hidden md:flex flex-col justify-center items-center bg-[#0f67fd] text-white p-12 relative">
        <div className="max-w-md text-center space-y-8 flex flex-col items-center">
          
          {/* Linked Application Connected SVG Graphics */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Center target circle representing dotwork */}
            <div className="absolute w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center font-bold font-mono">
                DW
              </div>
            </div>
            
            {/* Surrounding Connected Circles mimicking mockup */}
            <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-black font-bold">
              💬
            </div>
            <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-black font-bold">
              G
            </div>
            <div className="absolute top-12 right-0 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-black font-bold">
              📊
            </div>

            {/* Connecting lines */}
            <svg className="absolute inset-0 w-full h-full text-white/20 pointer-events-none" viewBox="0 0 100 100">
              <line x1="25" y1="25" x2="50" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="4" />
              <line x1="25" y1="75" x2="50" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="4" />
              <line x1="75" y1="35" x2="50" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="4" />
            </svg>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Connect with every application.</h3>
            <p className="text-xs text-white/80 max-w-sm mx-auto leading-relaxed">
              Everything you need in an easily customizable dashboard. Verified credentials, skills gap matching, and recruiter pipelines.
            </p>
          </div>

          {/* Slider indicator dots */}
          <div className="flex gap-2 justify-center mt-6">
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/35"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/35"></span>
          </div>
        </div>
      </div>

      {/* Google Simulated Modal Selector */}
      {showGoogleModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl bg-base-200 border border-base-300">
            <h3 className="font-bold text-lg text-primary flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.52z" />
              </svg>
              Google Sign-In Selector
            </h3>
            <p className="py-4 text-xs text-base-content/75 leading-relaxed">
              We have configured a simulated Google verification interface so that you can verify both user archetypes instantly without GCP credential bindings.
            </p>

            <div className="space-y-3 mt-2">
              <button
                onClick={() => handleGoogleMockLogin('mohamed.elsaied@gmail.com', 'Mohamed Elsaied', 'learner')}
                className="btn btn-block justify-start text-left bg-base-100 hover:bg-base-300 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder"><div className="bg-success text-success-content rounded-full w-8 font-bold">ME</div></div>
                  <div>
                    <div className="font-bold text-xs">Mohamed Elsaied (Learner)</div>
                    <div className="text-[10px] text-base-content/50">mohamed.elsaied@gmail.com</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleGoogleMockLogin('ali.maher@gmail.com', 'Ali Maher', 'learner')}
                className="btn btn-block justify-start text-left bg-base-100 hover:bg-base-300 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder"><div className="bg-info text-info-content rounded-full w-8 font-bold">AM</div></div>
                  <div>
                    <div className="font-bold text-xs">Ali Maher (Learner)</div>
                    <div className="text-[10px] text-base-content/50">ali.maher@gmail.com</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleGoogleMockLogin('recruiter@lattice.com', 'Lattice Recruiter', 'company')}
                className="btn btn-block justify-start text-left bg-base-100 hover:bg-base-300 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder"><div className="bg-warning text-warning-content rounded-full w-8 font-bold">LR</div></div>
                  <div>
                    <div className="font-bold text-xs">Lattice Recruiter (Company)</div>
                    <div className="text-[10px] text-base-content/50">recruiter@lattice.com</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowGoogleModal(false)} className="btn btn-outline btn-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
