'use client';

import React from 'react';
import { SharedInbox } from '@/components/messaging/SharedInbox';
import { getCachedUser } from '@/lib/api';

export default function AdminMessagesPage() {
  const user = getCachedUser();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-base-content">
          Admin Support Central Inbox
        </h1>
        <p className="text-xs text-base-content/60 mt-1">
          Unified support threads across Learners and Company recruiters.
        </p>
      </div>

      <SharedInbox currentRole="admin" currentUserId={user?.id} />
    </div>
  );
}
