'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function PlanUsageBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
      <div className="flex items-center gap-2.5">
        <span className="text-base">⚡</span>
        <div>
          <span className="font-bold text-amber-500 uppercase tracking-wider">
            Starter Plan Limitations
          </span>
          <p className="text-base-content/80 mt-0.5">
            AI candidate match scores, candidate messaging, and skill-gap analytics are locked on Starter.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/company/billing"
          className="btn btn-xs btn-warning font-medium shadow-xs"
        >
          See Subscription Plans
        </Link>
        <button
          onClick={() => setIsDismissed(true)}
          className="btn btn-xs btn-ghost btn-circle text-base-content/50"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
