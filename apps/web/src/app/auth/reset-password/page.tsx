'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { apiFetch } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('The two passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'This link is invalid or has expired.');

      // Resetting the password revokes every existing session server-side,
      // so the only way forward is a fresh login.
      toast.success('Password updated. Please sign in.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Invalid reset link</h1>
        <p className="text-sm text-base-content/60">
          This link is missing its token. Request a new one.
        </p>
        <Link href="/auth/forgot-password" className="btn btn-primary btn-sm rounded-xl">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
        <p className="text-xs text-base-content/60">
          You&apos;ll be signed out of every device once it&apos;s changed.
        </p>
      </div>

      <label className="form-control w-full">
        <span className="label-text text-xs font-semibold">New password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters, with a number"
          className="input input-bordered w-full rounded-xl"
          required
        />
      </label>

      <label className="form-control w-full">
        <span className="label-text text-xs font-semibold">Confirm password</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input input-bordered w-full rounded-xl"
          required
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-full rounded-xl"
      >
        {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Update password'}
      </button>

      <p className="text-center text-xs text-base-content/50">
        <Link href="/auth/login" className="font-semibold hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <Suspense fallback={<span className="loading loading-spinner loading-lg" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
