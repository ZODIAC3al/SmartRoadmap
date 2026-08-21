import { PlanTier } from '../../schemas/subscription.schema';

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  seatsIncluded: number;
  jobPostLimit: number; // -1 = unlimited
  messagesIncluded: number; // per billing cycle
  boostsIncluded: number; // per billing cycle
  features: {
    skillMatchScore: boolean;
    skillGapAnalytics: boolean;
    verifiedEvidenceFilter: boolean;
    savedSearchLimit: number; // -1 = unlimited, 0 = none
    inPlatformMessaging: boolean;
    pipelineKanbanFull: boolean;
    analyticsExport: boolean;
    directoryFeatured: boolean;
  };
}

export const PLAN_CONFIG: Record<PlanTier, PlanDefinition> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    priceMonthly: 0,
    seatsIncluded: 1,
    jobPostLimit: 1,
    messagesIncluded: 0,
    boostsIncluded: 0,
    features: {
      skillMatchScore: false, // locked / blurred in UI & stripped in API
      skillGapAnalytics: false,
      verifiedEvidenceFilter: false,
      savedSearchLimit: 0,
      inPlatformMessaging: false,
      pipelineKanbanFull: false, // 3 basic stages
      analyticsExport: false,
      directoryFeatured: false,
    },
  },
  growth: {
    tier: 'growth',
    name: 'Growth',
    priceMonthly: 49,
    seatsIncluded: 3,
    jobPostLimit: 5,
    messagesIncluded: 50,
    boostsIncluded: 0,
    features: {
      skillMatchScore: true,
      skillGapAnalytics: false,
      verifiedEvidenceFilter: true,
      savedSearchLimit: 1,
      inPlatformMessaging: true,
      pipelineKanbanFull: true, // 5 stages
      analyticsExport: false,
      directoryFeatured: false,
    },
  },
  scale: {
    tier: 'scale',
    name: 'Scale',
    priceMonthly: 199,
    seatsIncluded: 10,
    jobPostLimit: -1, // unlimited
    messagesIncluded: -1, // unlimited
    boostsIncluded: 2, // 2 free boosts per month
    features: {
      skillMatchScore: true,
      skillGapAnalytics: true,
      verifiedEvidenceFilter: true,
      savedSearchLimit: -1, // unlimited
      inPlatformMessaging: true,
      pipelineKanbanFull: true,
      analyticsExport: true,
      directoryFeatured: true,
    },
  },
};

export const PLAN_RANK: Record<PlanTier, number> = {
  starter: 1,
  growth: 2,
  scale: 3,
};
