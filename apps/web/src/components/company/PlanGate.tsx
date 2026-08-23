'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/lib/use-subscription';
import { UpgradeModal, PlanTier } from './UpgradeModal';
import { Lock } from 'lucide-react';

const PLAN_RANK: Record<PlanTier, number> = {
  starter: 1,
  growth: 2,
  scale: 3,
};

interface PlanGateProps {
  feature?: string;
  requiredPlan: PlanTier;
  children: React.ReactNode;
  fallbackText?: string;
}

export function PlanGate({
  requiredPlan,
  children,
  fallbackText,
}: PlanGateProps) {
  const { plan: currentPlan } = useSubscription();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentRank = PLAN_RANK[currentPlan] || 1;
  const requiredRank = PLAN_RANK[requiredPlan] || 1;

  if (currentRank >= requiredRank) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="relative group overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 cursor-pointer transition-all hover:border-amber-500/60"
        aria-label={`Locked, upgrade to ${requiredPlan.toUpperCase()} plan to access`}
        role="button"
        tabIndex={0}
      >
        {/* Blurred/grayscale copy of children */}
        <div className="filter blur-[4px] grayscale-[70%] select-none pointer-events-none opacity-40 transition-opacity group-hover:opacity-30">
          {children}
        </div>

        {/* Lock Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-300/80 backdrop-blur-xs p-3 text-center transition-all group-hover:bg-base-300/90">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <Lock className="w-3 h-3" />
            <span>{requiredPlan.toUpperCase()} PLAN REQUIRED</span>
          </div>
          <p className="text-xs text-stone-800 dark:text-stone-200 font-medium max-w-xs font-medium">
            {fallbackText || `Upgrade to ${requiredPlan.toUpperCase()} to unlock this feature.`}
          </p>
        </div>
      </div>

      <UpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetPlan={requiredPlan}
      />
    </>
  );
}
