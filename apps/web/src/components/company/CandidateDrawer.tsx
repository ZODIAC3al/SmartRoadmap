'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CandidateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: {
    id: string;
    name: string;
    matchScore: number;
    stage: string;
    verifiedSkillsCount: number;
    rating?: number;
    email?: string;
  };
}

export function CandidateDrawer({
  isOpen,
  onClose,
  candidate,
}: CandidateDrawerProps) {
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState([
    { id: '1', author: 'Recruiter', text: 'Strong React and NestJS background.', time: '2 hours ago' },
  ]);

  if (!isOpen || !candidate) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNotes((prev) => [
      ...prev,
      { id: Date.now().toString(), author: 'You', text: noteText.trim(), time: 'Just now' },
    ]);
    setNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-base-100 border-l border-base-300 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto text-base-content">
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-base-300">
              <div>
                <h2 className="text-lg font-bold text-base-content">
                  {candidate.name}
                </h2>
                <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                  Stage: <strong className="uppercase text-primary font-mono">{candidate.stage}</strong>
                </span>
              </div>
              <button
                onClick={onClose}
                className="btn btn-sm btn-ghost btn-circle text-stone-700 dark:text-stone-300 font-medium"
              >
                ✕
              </button>
            </div>

            {/* Candidate Highlights */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-base-200/60 border border-base-300 text-xs">
              <div>
                <span className="text-stone-700 dark:text-stone-300 font-medium">AI Match Score</span>
                <p className="font-mono font-bold text-success text-base">
                  {candidate.matchScore}%
                </p>
              </div>
              <div>
                <span className="text-stone-700 dark:text-stone-300 font-medium">Verified Skills</span>
                <p className="font-mono font-bold text-base-content text-base">
                  {candidate.verifiedSkillsCount} Certs
                </p>
              </div>
            </div>

            {/* Direct Messaging Action */}
            <Link
              href={`/company/messages?candidate=${candidate.id}`}
              className="btn btn-sm btn-primary shadow-xs w-full flex items-center justify-center gap-2"
            >
              💬 Send Direct Message
            </Link>

            {/* Internal Notes Thread */}
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-base-content">
                Recruiter Notes
              </h3>

              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-lg bg-base-200/60 border border-base-300 text-xs flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center text-[10px] text-stone-700 dark:text-stone-300 font-medium">
                      <span className="font-semibold text-base-content">{n.author}</span>
                      <span>{n.time}</span>
                    </div>
                    <p className="text-base-content">{n.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Add internal note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="input input-sm input-bordered flex-1 text-xs"
                />
                <button type="submit" className="btn btn-sm btn-outline text-xs">
                  Add Note
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
