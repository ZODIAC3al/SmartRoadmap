'use client';

import React from 'react';

export interface ThreadItem {
  id: string;
  candidateName: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface ThreadListProps {
  threads: ThreadItem[];
  activeThreadId: string;
  onSelectThread: (thread: ThreadItem) => void;
}

export function ThreadList({
  threads,
  activeThreadId,
  onSelectThread,
}: ThreadListProps) {
  return (
    <div className="w-full md:w-80 border-r border-base-300 p-3 flex flex-col gap-2 bg-base-100">
      <input
        type="text"
        placeholder="Search conversations..."
        className="input input-sm input-bordered w-full mb-1 text-xs"
      />
      <div className="flex flex-col gap-1 overflow-y-auto flex-1">
        {threads.map((t) => {
          const isActive = t.id === activeThreadId;
          return (
            <button
              key={t.id}
              onClick={() => onSelectThread(t)}
              className={`p-3 rounded-xl text-left transition-all flex flex-col gap-1 ${
                isActive
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-base-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-base-content">
                    {t.candidateName}
                  </span>
                  {t.unread > 0 && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-[10px] font-mono text-base-content/50">
                  {t.time}
                </span>
              </div>
              <p className="text-xs text-base-content/70 line-clamp-1">{t.lastMessage}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
