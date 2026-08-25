'use client';

import React from 'react';
import { useSubscription } from '@/lib/use-subscription';
import { UsageBar } from '@/components/company/UsageBar';
import { InvoiceTable } from '@/components/company/InvoiceTable';
import { AiUsageDashboard } from '@/components/dashboard/AiUsageDashboard';
import { useGetAiQuotaQuery } from '@/store/api/aiUsageApi';
import {
  useCreateCheckoutSessionMutation,
  useCreatePortalSessionMutation,
} from '@/store/api/billingApi';
import { PlanTier } from '@/components/company/UpgradeModal';

export default function BillingPage() {
  const { plan: currentPlan, usage, limits } = useSubscription();
  const { data: aiQuota } = useGetAiQuotaQuery();
  const [createCheckoutSession, { isLoading: isUpgrading }] = useCreateCheckoutSessionMutation();
  const [createPortalSession] = useCreatePortalSessionMutation();

  const handleUpgrade = async (plan: PlanTier) => {
    try {
      const res = await createCheckoutSession({ plan }).unwrap();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch {
      alert('Checkout error');
    }
  };

  const handlePortal = async () => {
    try {
      const res = await createPortalSession().unwrap();
      if (res?.url) window.location.href = res.url;
    } catch {
      alert('Portal error');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#181B23]">
            Subscription & Billing Management
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage your recruitment subscription plan, check usage quotas, and view invoices.
          </p>
        </div>
        <button
          onClick={handlePortal}
          className="btn btn-sm btn-outline text-xs font-semibold"
        >
          Manage Stripe Portal ↗
        </button>
      </div>

      {/* Monthly AI Quota & Execution Dashboard */}
      <AiUsageDashboard />

      {/* Usage Bar Metrics */}
      <div className="p-6 rounded-2xl bg-base-100 border border-[#E4E7EC] shadow-xs flex flex-col gap-4">
        <h3 className="font-bold text-sm font-heading text-[#181B23]">
          Monthly Resource Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <UsageBar
            label="Active Job Posts"
            current={usage.jobPostsActive}
            limit={limits.jobPostLimit}
          />
          <UsageBar
            label="Recruiter Seats"
            current={1}
            limit={limits.seatsIncluded || 10}
          />
          <UsageBar
            label="In-Platform Messages"
            current={usage.messagesSentThisPeriod}
            limit={limits.messagesIncluded}
          />
          <UsageBar
            label="AI Credits"
            current={aiQuota?.consumedCredits || 0}
            limit={aiQuota?.allocatedCredits || 50}
          />
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starter Plan Card */}
        <div
          className={`p-6 rounded-2xl bg-base-100 border flex flex-col justify-between ${
            currentPlan === 'starter'
              ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20 shadow-md'
              : 'border-[#E4E7EC]'
          }`}
        >
          <div>
            <span className="text-xs uppercase font-bold text-[#6B7280]">Free Starter</span>
            <h2 className="text-3xl font-extrabold font-mono mt-1 text-[#181B23]">
              $0 <span className="text-xs text-[#6B7280] font-normal font-sans">/ mo</span>
            </h2>
            <ul className="mt-4 space-y-2 text-xs text-[#6B7280]">
              <li>✓ 1 Active Job Post</li>
              <li>✓ 1 Recruiter Seat</li>
              <li>✗ Candidate AI Match % (Locked)</li>
              <li>✗ In-Platform Messaging</li>
            </ul>
          </div>
          <div className="mt-6">
            {currentPlan === 'starter' ? (
              <button disabled className="btn btn-sm btn-block btn-neutral text-xs">
                Current Plan
              </button>
            ) : (
              <button className="btn btn-sm btn-block btn-outline text-xs">
                Downgrade
              </button>
            )}
          </div>
        </div>

        {/* Growth Plan Card */}
        <div
          className={`p-6 rounded-2xl bg-base-100 border flex flex-col justify-between ${
            currentPlan === 'growth'
              ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20 shadow-md'
              : 'border-[#D97706]/40 bg-[#D97706]/5'
          }`}
        >
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-bold text-[#D97706]">Growth Plan</span>
              <span className="badge badge-xs badge-warning uppercase font-bold">Popular</span>
            </div>
            <h2 className="text-3xl font-extrabold font-mono mt-1 text-[#181B23]">
              $49 <span className="text-xs text-[#6B7280] font-normal font-sans">/ mo</span>
            </h2>
            <ul className="mt-4 space-y-2 text-xs text-[#181B23]">
              <li>✓ 5 Active Job Posts</li>
              <li>✓ 3 Recruiter Seats</li>
              <li>✓ Unlocked AI Candidate Match %</li>
              <li>✓ 50 Candidate Messages / mo</li>
              <li>✓ Verified Evidence Filter</li>
            </ul>
          </div>
          <div className="mt-6">
            <button
              onClick={() => handleUpgrade('growth')}
              disabled={isUpgrading}
              className="btn btn-sm btn-block btn-warning font-semibold shadow-xs text-xs"
            >
              Upgrade to Growth ($49/mo)
            </button>
          </div>
        </div>

        {/* Scale Plan Card */}
        <div
          className={`p-6 rounded-2xl bg-base-100 border flex flex-col justify-between ${
            currentPlan === 'scale'
              ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20 shadow-md'
              : 'border-primary/40 bg-primary text-primary-content/5'
          }`}
        >
          <div>
            <span className="text-xs uppercase font-bold text-primary">Scale Plan</span>
            <h2 className="text-3xl font-extrabold font-mono mt-1 text-[#181B23]">
              $199 <span className="text-xs text-[#6B7280] font-normal font-sans">/ mo</span>
            </h2>
            <ul className="mt-4 space-y-2 text-xs text-[#181B23]">
              <li>✓ Unlimited Active Job Posts</li>
              <li>✓ 10 Recruiter Seats</li>
              <li>✓ Unlimited Messages</li>
              <li>✓ Aggregate Skill-Gap Analytics</li>
              <li>✓ 2 Free Monthly Job Boosts</li>
            </ul>
          </div>
          <div className="mt-6">
            <button
              onClick={() => handleUpgrade('scale')}
              disabled={isUpgrading}
              className="btn btn-sm btn-block btn-primary bg-[#4F46E5] text-white shadow-xs border-none text-xs"
            >
              Upgrade to Scale ($199/mo)
            </button>
          </div>
        </div>
      </div>

      {/* Invoice History Table */}
      <InvoiceTable />
    </div>
  );
}
