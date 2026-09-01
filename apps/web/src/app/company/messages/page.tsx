'use client';

import React from 'react';
import { SharedInbox } from '@/components/messaging/SharedInbox';
import { getCachedUser } from '@/lib/api';

export default function CompanyMessagesPage() {
  const user = getCachedUser();

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading text-base-content">
            Candidate Inbox
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            Real-time direct messaging with pipeline candidates and platform support. All threads are persisted in MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#8E1616]/10 border border-[#8E1616]/20">
          <span className="w-2 h-2 rounded-full bg-[#8E1616] animate-pulse" />
          <span className="text-[11px] font-bold text-[#701111] font-mono">Live · Real-time</span>
        </div>
      </div>

      <SharedInbox currentRole="company" currentUserId={user?.id || user?._id} />
    </div>
  );
}
