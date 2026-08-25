'use client';

import React, { useMemo } from 'react';
import { useGetThreadsQuery } from '@/store/api/messagesApi';
import { selectAllThreads } from '@/store/api/messagesApi';

import { getCachedUser } from '@/lib/api';

export function UnreadMessageBadge() {
  const user = getCachedUser();
  
  const { data: threadsData } = useGetThreadsQuery(undefined, {
    // Keep it synced with the same interval as the inbox
    pollingInterval: 8000,
    skip: !user,
  });

  const threads = useMemo(
    () => (threadsData ? selectAllThreads(threadsData) : []),
    [threadsData],
  );

  const totalUnread = useMemo(
    () => threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0),
    [threads],
  );

  if (totalUnread === 0) return null;

  return (
    <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
      {totalUnread > 99 ? '99+' : totalUnread}
    </span>
  );
}
