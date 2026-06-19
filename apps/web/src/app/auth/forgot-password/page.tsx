'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    // Simulate API delay for Resend email dispatch
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success('Simulation: Password reset link dispatched via Resend!');
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center p-4 selection:bg-[#10B981] selection:text-white relative overflow-hidden">
      {/* Subtle grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-md bg-base-200 border border-base-300 p-8 rounded-2xl shadow-xl space-y-6 relative z-10 text-start">
        
        {/* Header logo & title */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center bg-base-content text-base-100 rounded-full w-10 h-10 shadow-sm mb-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
              <path d="M4 12c3-1.5 9-1.5 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>
          <h2 className="text-2xl font-black tracking-tight text-base-content leading-none">
            Reset Password
          </h2>
          <p className="text-xs text-base-content/50">
            Enter your email coordinates to receive a reset token.
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="form-control space-y-1">
              <label className="text-[10px] font-bold uppercase text-base-content/50 font-mono">Email Address</label>
              <input
                type="email"
                required
                placeholder="recruiter@lattice.com"
                className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl h-11 text-xs font-semibold flex items-center justify-center gap-2"
            >
              {isSubmitting && <span className="loading loading-spinner loading-xs" />}
              Send Password Reset Link
            </button>
          </form>
        ) : (
          <div className="bg-[#10B981]/5 border border-[#10B981]/25 p-4 rounded-xl space-y-3 text-center">
            <div className="w-12 h-12 bg-[#10B981]/15 text-[#059669] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="font-extrabold text-sm text-[#059669]">Reset Link Dispatched</h3>
            <p className="text-[11px] text-base-content/60 leading-relaxed">
              We simulated sending a reset email to <strong className="text-base-content font-bold">{email}</strong>. Check your spam or local logs!
            </p>
            <button 
              onClick={() => setIsSuccess(false)} 
              className="text-[10px] text-primary hover:underline font-mono block mx-auto pt-1"
            >
              Retry different email
            </button>
          </div>
        )}

        <div className="border-t border-base-300 pt-4 flex justify-between text-xs font-semibold">
          <Link href="/auth/login" className="text-gray-400 hover:text-base-content transition-colors">
            Back to Login
          </Link>
          <Link href="/auth/register" className="text-primary hover:underline">
            Register Account
          </Link>
        </div>

      </div>
    </div>
  );
}
