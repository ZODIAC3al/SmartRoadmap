'use client';

import React from 'react';

interface UsageBarProps {
  label: string;
  current: number;
  limit: number; // -1 = unlimited
}

export function UsageBar({ label, current, limit }: UsageBarProps) {
  const isUnlimited = limit === -1;
  const percent = isUnlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));

  let colorClass = 'progress-primary';
  if (percent >= 80 && percent < 100) colorClass = 'progress-warning';
  if (percent >= 100) colorClass = 'progress-error';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-xs font-medium text-base-content/80">
        <span>{label}</span>
        <span className="font-mono text-xs text-base-content">
          {current} {isUnlimited ? '/ ∞ (Unlimited)' : `/ ${limit}`}
        </span>
      </div>
      <progress
        className={`progress ${isUnlimited ? 'progress-success' : colorClass} w-full h-2 rounded-full`}
        value={isUnlimited ? 100 : percent}
        max="100"
      />
    </div>
  );
}
