
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldAlert, ArrowRight, X, Check, BadgeCheck } from 'lucide-react';
import { useCreateCheckoutSessionMutation } from '@/store/api/aiUsageApi';

export interface QuotaExceededEventDetail {
  feature?: string;
  message?: string;
  currentPlan?: string;
  recommendedPlan?: string;
  usage?: number;
  limit?: number;
  remaining?: number;
}

export const QuotaExceededModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<QuotaExceededEventDetail | null>(null);
  const [createCheckout, { isLoading }] = useCreateCheckoutSessionMutation();
  const router = useRouter();

  useEffect(() => {
    const handleQuotaExceeded = (event: CustomEvent<QuotaExceededEventDetail>) => {
      setDetails(event.detail || {});
      setIsOpen(true);
    };

    window.addEventListener('ai-quota-exceeded' as any, handleQuotaExceeded);
    return () => {
      window.removeEventListener('ai-quota-exceeded' as any, handleQuotaExceeded);
    };
  }, []);

  if (!isOpen) return null;

  const targetPlan = details?.recommendedPlan || 'learner_pro';
  const planTitle = targetPlan === 'learner_pro' ? 'Learner Pro ($15/mo)' : 'Growth Tier ($49/mo)';
  const creditGrant = targetPlan === 'learner_pro' ? '500 AI Credits/mo' : '1,000 AI Credits/mo';

  const handleUpgradeNow = () => {
    setIsOpen(false);
    router.push('/pricing');
  };

  const handleGoToPricing = () => {
    setIsOpen(false);
    router.push('/pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden bg-base-200 border border-base-300 rounded-3xl shadow-2xl p-6 sm:p-8 text-start">
        {/* Glow Accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 p-2 text-base-content/60 hover:text-base-content bg-base-100 hover:bg-base-300 rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error/15 border border-error/30 text-error text-xs font-bold uppercase tracking-wider mb-4 font-mono">
          <ShieldAlert className="w-3.5 h-3.5" /> AI Limit Reached
        </div>

        {/* Modal Title & Description */}
        <h2 className="text-2xl font-extrabold text-base-content tracking-tight leading-tight">
          Unlock Unlimited Potential
        </h2>
        <p className="text-xs sm:text-sm text-base-content/70 mt-2 leading-relaxed font-medium">
          {details?.message ||
            'You have reached your monthly AI credit allowance for this feature. Upgrade your plan to instantly unlock more credits, verified badges, and premium AI models.'}
        </p>

        {/* Plan Upgrade Comparison Card */}
        <div className="mt-6 p-5 rounded-2xl bg-base-100 border border-base-300 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-primary font-mono">
                Recommended Upgrade
              </div>
              <div className="text-lg font-black text-base-content mt-0.5">{planTitle}</div>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-bold text-xs">
              +10x Credits
            </span>
          </div>

          <ul className="mt-4 space-y-2 text-xs text-base-content/80 font-medium">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong className="text-base-content">{creditGrant}</strong> (10x free tier)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Verified Pro Candidate Badge & Icon</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>AI Voice Mock Interview & Audio Summary Narration</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>RAG-Backed Master Study Guides & PDF Export Statement</span>
            </li>
          </ul>
        </div>

        {/* CTA Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleUpgradeNow}
            disabled={isLoading}
            className="flex-1 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-content font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              'Processing Checkout...'
            ) : (
              <>
                Upgrade Plan Now <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
          <button
            onClick={handleGoToPricing}
            className="px-4 py-3 rounded-xl bg-base-100 hover:bg-base-300 text-base-content font-semibold text-xs border border-base-300 transition flex items-center justify-center gap-1.5"
          >
            Explore Pricing <ArrowRight className="w-4 h-4 text-base-content/60" />
          </button>
        </div>
      </div>
    </div>
  );
};
