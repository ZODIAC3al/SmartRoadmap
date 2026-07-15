'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, storeSession } from '@/lib/api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      storeSession(data);
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real Google Sign-In.
   *
   * The old flow POSTed an arbitrary { email, name } to /auth/google, which let
   * anyone log in as ANY user. Now Google issues a signed ID token in the browser
   * and the backend verifies that signature against Google's public keys.
   */
  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google authentication failed');

      storeSession(data);
      router.push(data.user?.role === 'company' ? '/company' : '/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const google = (window as any).google;
      if (!google) return;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => handleGoogleCredential(response.credential),
      });
      google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: 'continue_with',
      });
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

          {/* Google Identity Services renders its own (signed) button here.
              If NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set, we simply don't offer it. */}
          {GOOGLE_CLIENT_ID ? (
            <div className="flex justify-center">
              <div ref={googleButtonRef} />
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 text-center">
              Google sign-in is not configured on this environment.
            </p>
          )}


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
            Don&apos;t have an account?{' '}
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

    </div>
  );
}
