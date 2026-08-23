'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/lib/use-subscription';
import { UsageBar } from './UsageBar';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'candidate' | 'company';
  text: string;
  time: string;
}

interface MessageThreadProps {
  candidateName: string;
  messages: Message[];
  onSendMessage: (text: string) => void;
}

export function MessageThread({
  candidateName,
  messages,
  onSendMessage,
}: MessageThreadProps) {
  const { plan, usage, limits } = useSubscription();
  const [inputText, setInputText] = useState('');

  const isStarter = plan === 'starter';
  const isQuotaExhausted =
    limits.messagesIncluded !== -1 &&
    usage.messagesSentThisPeriod >= limits.messagesIncluded;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStarter || isQuotaExhausted) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-base-200/40">
      {/* Header */}
      <div className="pb-3 border-b border-base-300 flex justify-between items-center bg-base-100 p-3 rounded-xl">
        <h3 className="font-bold text-sm text-base-content">
          {candidateName}
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold">
          Active Thread
        </span>
      </div>

      {/* Message Chat List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 my-2">
        {messages.map((m) => {
          const isMe = m.sender === 'company';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? 'bg-primary text-primary-content rounded-br-none'
                    : 'bg-base-100 border border-base-300 text-base-content rounded-bl-none shadow-xs'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] font-mono text-base-content/50 mt-1 px-1">
                {m.time}
              </span>
            </div>
          );
        })}
      </div>

      {/* Composer Section */}
      <div className="pt-3 border-t border-base-300 bg-base-100 p-3 rounded-xl flex flex-col gap-2">
        {isStarter ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center flex flex-col items-center gap-1.5">
            <p className="text-xs font-semibold text-amber-500">
              ⚡ Candidate Messaging is locked on Starter
            </p>
            <Link
              href="/company/billing"
              className="btn btn-xs btn-warning font-medium shadow-xs"
            >
              Upgrade to Growth Plan to Message Candidates
            </Link>
          </div>
        ) : (
          <>
            <UsageBar
              label="Monthly Messages Quota"
              current={usage.messagesSentThisPeriod}
              limit={limits.messagesIncluded}
            />
            <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder={
                  isQuotaExhausted
                    ? 'Monthly message quota exhausted...'
                    : 'Type your message...'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isQuotaExhausted}
                className="input input-sm input-bordered flex-1 text-xs"
              />
              <button
                type="submit"
                disabled={isQuotaExhausted || !inputText.trim()}
                className="btn btn-sm btn-primary text-xs"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
