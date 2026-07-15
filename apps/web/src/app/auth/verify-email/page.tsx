'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

function VerifyEmail() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('This verification link is missing its token.');
      return;
    }

    (async () => {
      try {
        const res = await apiFetch('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'This link is invalid or has expired.');
        setState('ok');
      } catch (err: any) {
        setState('error');
        setMessage(err.message);
      }
    })();
  }, [token]);

  if (state === 'pending') {
    return <span className="loading loading-spinner loading-lg" />;
  }

  return (
    <div className="text-center space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">
        {state === 'ok' ? 'Email verified 🎉' : 'Verification failed'}
      </h1>
      <p className="text-sm text-base-content/60">
        {state === 'ok'
          ? 'Your account is now fully activated.'
          : message}
      </p>
      <Link
        href={state === 'ok' ? '/dashboard' : '/auth/login'}
        className="btn btn-primary btn-sm rounded-xl"
      >
        {state === 'ok' ? 'Go to dashboard' : 'Back to sign in'}
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <Suspense fallback={<span className="loading loading-spinner loading-lg" />}>
        <VerifyEmail />
      </Suspense>
    </div>
  );
}
