'use client';

import React, { useEffect, useState } from 'react';
import { SharedInbox } from '@/components/messaging/SharedInbox';
import { getCachedUser, hasSession } from '@/lib/api';
import Link from 'next/link';

export default function MessagesPage() {
  const [user, setUser] = useState<{ id?: string; _id?: string; role?: string } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUser(getCachedUser());
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!user || !hasSession()) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center font-sans text-xs">
        <div className="text-center p-8 bg-base-200 border border-base-300 rounded-2xl max-w-sm">
          <h3 className="font-extrabold text-sm mb-2">Access Denied</h3>
          <p className="text-base-content/60 mb-4">
            Please log in to access your messaging inbox.
          </p>
          <Link
            href="/auth/login"
            className="btn bg-primary hover:bg-[#059669] text-white border-none btn-sm rounded-lg"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const userId = (user as any).id ?? (user as any)._id;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6 pb-16 md:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading text-base-content">
            Messages
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            Your conversations — reply to messages from companies and admins.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-600 font-mono">Live · Real-time</span>
        </div>
      </div>

      <SharedInbox currentRole="learner" currentUserId={userId} />
    </div>
  );
}
