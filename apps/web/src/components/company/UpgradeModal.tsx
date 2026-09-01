'use client';

import React from 'react';
import { useCreateCheckoutSessionMutation } from '@/store/api/billingApi';

export type PlanTier = 'starter' | 'growth' | 'scale';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan?: PlanTier;
}

export function UpgradeModal({
  isOpen,
  onClose,
  targetPlan = 'growth',
}: UpgradeModalProps) {
  const [createCheckoutSession, { isLoading }] = useCreateCheckoutSessionMutation();

  if (!isOpen) return null;

  const handleCheckout = async (plan: PlanTier) => {
    try {
      const res = await createCheckoutSession({ plan }).unwrap();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch {
      alert('Failed to initiate checkout session.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-base-100 border border-base-300 rounded-2xl p-6 max-w-3xl w-full shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs uppercase font-semibold text-primary tracking-wider">
              Upgrade Subscription
            </span>
            <h2 className="text-xl font-bold font-heading text-base-content mt-0.5">
              Unlock Advanced Recruiter Capabilities
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle text-base-content/60"
          >
            ✕
          </button>
        </div>

        {/* 3-Tier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Starter Card */}
          <div className="p-4 rounded-xl border border-base-300 bg-base-200/50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm">Starter</h3>
              <p className="text-xl font-bold font-mono mt-1">$0</p>
              <ul className="mt-3 space-y-1.5 text-xs text-base-content/70">
                <li>• 1 Active Job Post</li>
                <li>• 1 Recruiter Seat</li>
                <li>• Basic Applicant Pipeline</li>
              </ul>
            </div>
            <button disabled className="btn btn-xs btn-neutral w-full mt-4">
              Current Base
            </button>
          </div>

          {/* Growth Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              targetPlan === 'growth'
                ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                : 'border-base-300 bg-base-100'
            }`}
          >
            <div>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-amber-500">Growth</h3>
                <span className="badge badge-xs badge-warning uppercase font-bold">Popular</span>
              </div>
              <p className="text-xl font-bold font-mono mt-1">$49 <span className="text-xs font-normal">/ mo</span></p>
              <ul className="mt-3 space-y-1.5 text-xs text-base-content/80">
                <li>✓ 5 Active Job Posts</li>
                <li>✓ 3 Recruiter Seats</li>
                <li>✓ AI Candidate Match %</li>
                <li>✓ 50 Candidate Messages</li>
                <li>✓ Verified Evidence Filter</li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('growth')}
              disabled={isLoading}
              className="btn btn-xs btn-warning w-full mt-4 font-semibold shadow-xs"
            >
              {isLoading ? 'Loading...' : 'Select Growth ($49)'}
            </button>
          </div>

          {/* Scale Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              targetPlan === 'scale'
                ? 'border-primary bg-primary text-primary-content/10 ring-2 ring-purple-500/30'
                : 'border-base-300 bg-base-100'
            }`}
          >
            <div>
              <h3 className="font-bold text-sm text-primary">Scale</h3>
              <p className="text-xl font-bold font-mono mt-1">$199 <span className="text-xs font-normal">/ mo</span></p>
              <ul className="mt-3 space-y-1.5 text-xs text-base-content/80">
                <li>✓ Unlimited Job Posts</li>
                <li>✓ 10 Recruiter Seats</li>
                <li>✓ Unlimited Messaging</li>
                <li>✓ Aggregate Skill-Gap Reports</li>
                <li>✓ 2 Free Monthly Job Boosts</li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('scale')}
              disabled={isLoading}
              className="btn btn-xs btn-primary w-full mt-4 font-semibold shadow-xs"
            >
              {isLoading ? 'Loading...' : 'Select Scale ($199)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
