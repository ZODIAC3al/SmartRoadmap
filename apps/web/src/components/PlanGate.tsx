'use client';

import React from 'react';
import Link from 'next/link';

export type PlanTier = 'starter' | 'growth' | 'scale';

const PLAN_RANK: Record<PlanTier, number> = {
  starter: 1,
  growth: 2,
  scale: 3,
};

interface PlanGateProps {
  currentPlan?: PlanTier;
  requiredPlan: PlanTier;
  children: React.ReactNode;
  fallbackText?: string;
}

export function PlanGate({
  currentPlan = 'starter',
  requiredPlan,
  children,
  fallbackText,
}: PlanGateProps) {
  const currentRank = PLAN_RANK[currentPlan] || 1;
  const requiredRank = PLAN_RANK[requiredPlan] || 1;

  if (currentRank >= requiredRank) {
    return <>{children}</>;
  }

  return (
    <div className="relative group overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 transition-all">
      {/* Blurred preview of children */}
      <div className="filter blur-sm select-none pointer-events-none opacity-40">
        {children}
      </div>

      {/* Upgrade Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-300/80 backdrop-blur-xs p-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          ⚡ {requiredPlan.toUpperCase()} PLAN REQUIRED
        </div>
        <p className="text-xs text-base-content/80 mb-3 max-w-xs">
          {fallbackText || `Upgrade to ${requiredPlan.toUpperCase()} to unlock this feature.`}
        </p>
        <Link
          href="/company/billing"
          className="btn btn-xs btn-warning font-medium shadow-md hover:scale-105 transition-transform"
        >
          Upgrade Plan
        </Link>
      </div>
    </div>
  );
}
