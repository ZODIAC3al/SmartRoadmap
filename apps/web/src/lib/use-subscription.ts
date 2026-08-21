'use client';

import { useGetMySubscriptionQuery } from '@/store/api/billingApi';
import { PlanTier } from '@/components/company/UpgradeModal';
import { useAppSelector } from '@/store/hooks';

export function useSubscription() {
  const token = useAppSelector((state) => state.auth?.token) || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const isAuthenticated = !!token;

  const { data, isLoading, error, refetch } = useGetMySubscriptionQuery(undefined, { skip: !isAuthenticated });

  const plan: PlanTier = (data?.subscription?.plan as PlanTier) || 'scale';
  const usage = data?.subscription?.usage || {
    jobPostsActive: 2,
    messagesSentThisPeriod: 4,
    boostsUsedThisPeriod: 0,
  };

  const limits = data?.limits || {
    tier: 'scale' as PlanTier,
    name: 'Scale (Pro)',
    priceMonthly: 199,
    seatsIncluded: 10,
    jobPostLimit: -1,
    messagesIncluded: -1,
    boostsIncluded: 2,
    features: {
      skillMatchScore: true,
      skillGapAnalytics: true,
      verifiedEvidenceFilter: true,
      savedSearchLimit: -1,
      inPlatformMessaging: true,
      pipelineKanbanFull: true,
      analyticsExport: true,
      directoryFeatured: true,
    },
  };

  return {
    data,
    plan,
    usage,
    limits,
    isLoading,
    error: error ? 'Failed to load subscription status.' : null,
    refreshSubscription: refetch,
  };
}
