import type { PlanTier } from '../../schemas/subscription.schema';
import { AiFeatureKey } from '../../schemas/ai-usage-ledger.schema';

export type ModelTier = 'low_cost' | 'standard' | 'premium' | 'voice_audio';

export interface AiFeaturePolicy {
  creditCost: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  allowedModelTiers: ModelTier[];
  recommendedPlan?: PlanTier;
}

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  seatsIncluded: number;
  jobPostLimit: number; // -1 = unlimited
  messagesIncluded: number; // per billing cycle
  boostsIncluded: number; // per billing cycle
  aiCreditsIncluded: number; // per billing cycle
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
  allowedAiFeatures: AiFeatureKey[];
  allowedModelTiers: ModelTier[];
}

export const AI_FEATURE_POLICIES: Record<AiFeatureKey, AiFeaturePolicy> = {
  AI_ROADMAP: {
    creditCost: 15,
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    allowedModelTiers: ['low_cost', 'standard', 'premium'],
    recommendedPlan: 'learner_pro',
  },
  AI_REMEDIAL_CONTENT: {
    creditCost: 10,
    maxInputTokens: 3000,
    maxOutputTokens: 1500,
    allowedModelTiers: ['low_cost', 'standard', 'premium'],
    recommendedPlan: 'learner_pro',
  },
  AI_QUIZ_GENERATION: {
    creditCost: 5,
    maxInputTokens: 2000,
    maxOutputTokens: 1000,
    allowedModelTiers: ['low_cost', 'standard', 'premium'],
    recommendedPlan: 'learner_pro',
  },
  AI_CHEATSHEET: {
    creditCost: 3,
    maxInputTokens: 2000,
    maxOutputTokens: 1000,
    allowedModelTiers: ['low_cost', 'standard', 'premium'],
    recommendedPlan: 'learner_pro',
  },
  AI_AUDIO_SUMMARY: {
    creditCost: 5,
    maxInputTokens: 3000,
    maxOutputTokens: 1000,
    allowedModelTiers: ['standard', 'premium', 'voice_audio'],
    recommendedPlan: 'learner_pro',
  },
  AI_AUDIO_NARRATION: {
    creditCost: 5,
    maxInputTokens: 3000,
    maxOutputTokens: 1000,
    allowedModelTiers: ['voice_audio'],
    recommendedPlan: 'learner_pro',
  },
  AI_CAREER_ANALYSIS: {
    creditCost: 10,
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    allowedModelTiers: ['standard', 'premium'],
    recommendedPlan: 'learner_pro',
  },
  AI_INTERVIEW: {
    creditCost: 10,
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    allowedModelTiers: ['standard', 'premium'],
    recommendedPlan: 'learner_pro',
  },
  AI_VOICE_AGENT: {
    creditCost: 10,
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    allowedModelTiers: ['voice_audio', 'premium'],
    recommendedPlan: 'learner_pro',
  },
  AI_CANDIDATE_MATCH: {
    creditCost: 5,
    maxInputTokens: 3000,
    maxOutputTokens: 1000,
    allowedModelTiers: ['standard', 'premium'],
    recommendedPlan: 'growth',
  },
  AI_CANDIDATE_RANKING: {
    creditCost: 5,
    maxInputTokens: 4000,
    maxOutputTokens: 1500,
    allowedModelTiers: ['standard', 'premium'],
    recommendedPlan: 'growth',
  },
  AI_CV_ANALYSIS: {
    creditCost: 5,
    maxInputTokens: 3000,
    maxOutputTokens: 1000,
    allowedModelTiers: ['standard', 'premium'],
    recommendedPlan: 'learner_pro',
  },
  AI_SKILL_GAP: {
    creditCost: 10,
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    allowedModelTiers: ['premium'],
    recommendedPlan: 'scale',
  },
  AI_RECRUITMENT_ASSISTANT: {
    creditCost: 5,
    maxInputTokens: 3000,
    maxOutputTokens: 1500,
    allowedModelTiers: ['standard', 'premium'],
    recommendedPlan: 'growth',
  },
  AI_COMPANY_INSIGHTS: {
    creditCost: 10,
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    allowedModelTiers: ['premium'],
    recommendedPlan: 'scale',
  },
  AI_EXECUTIVE_BI: {
    creditCost: 0, // Admin system feature
    maxInputTokens: 5000,
    maxOutputTokens: 2000,
    allowedModelTiers: ['premium'],
  },
};

export const PLAN_CONFIG: Record<PlanTier, PlanDefinition> = {
  learner_free: {
    tier: 'learner_free',
    name: 'Learner Free',
    priceMonthly: 0,
    seatsIncluded: 1,
    jobPostLimit: 0,
    messagesIncluded: 0,
    boostsIncluded: 0,
    aiCreditsIncluded: 50,
    features: {
      skillMatchScore: false,
      skillGapAnalytics: false,
      verifiedEvidenceFilter: false,
      savedSearchLimit: 0,
      inPlatformMessaging: false,
      pipelineKanbanFull: false,
      analyticsExport: false,
      directoryFeatured: false,
    },
    allowedAiFeatures: [
      'AI_ROADMAP',
      'AI_REMEDIAL_CONTENT',
      'AI_QUIZ_GENERATION',
      'AI_CHEATSHEET',
      'AI_AUDIO_SUMMARY',
      'AI_CV_ANALYSIS',
    ],
    allowedModelTiers: ['low_cost'],
  },
  learner_pro: {
    tier: 'learner_pro',
    name: 'Learner Pro',
    priceMonthly: 15,
    seatsIncluded: 1,
    jobPostLimit: 0,
    messagesIncluded: 0,
    boostsIncluded: 0,
    aiCreditsIncluded: 500,
    features: {
      skillMatchScore: false,
      skillGapAnalytics: false,
      verifiedEvidenceFilter: false,
      savedSearchLimit: 0,
      inPlatformMessaging: false,
      pipelineKanbanFull: false,
      analyticsExport: true,
      directoryFeatured: false,
    },
    allowedAiFeatures: [
      'AI_ROADMAP',
      'AI_REMEDIAL_CONTENT',
      'AI_QUIZ_GENERATION',
      'AI_CHEATSHEET',
      'AI_AUDIO_SUMMARY',
      'AI_AUDIO_NARRATION',
      'AI_CAREER_ANALYSIS',
      'AI_INTERVIEW',
      'AI_VOICE_AGENT',
      'AI_CV_ANALYSIS',
    ],
    allowedModelTiers: ['low_cost', 'standard', 'premium', 'voice_audio'],
  },
  starter: {
    tier: 'starter',
    name: 'Starter',
    priceMonthly: 0,
    seatsIncluded: 1,
    jobPostLimit: 1,
    messagesIncluded: 0,
    boostsIncluded: 0,
    aiCreditsIncluded: 50,
    features: {
      skillMatchScore: false,
      skillGapAnalytics: false,
      verifiedEvidenceFilter: false,
      savedSearchLimit: 0,
      inPlatformMessaging: false,
      pipelineKanbanFull: false,
      analyticsExport: false,
      directoryFeatured: false,
    },
    allowedAiFeatures: ['AI_CANDIDATE_MATCH', 'AI_CV_ANALYSIS'],
    allowedModelTiers: ['low_cost'],
  },
  growth: {
    tier: 'growth',
    name: 'Growth',
    priceMonthly: 49,
    seatsIncluded: 3,
    jobPostLimit: 5,
    messagesIncluded: 50,
    boostsIncluded: 0,
    aiCreditsIncluded: 1000,
    features: {
      skillMatchScore: true,
      skillGapAnalytics: false,
      verifiedEvidenceFilter: true,
      savedSearchLimit: 1,
      inPlatformMessaging: true,
      pipelineKanbanFull: true,
      analyticsExport: false,
      directoryFeatured: false,
    },
    allowedAiFeatures: [
      'AI_CANDIDATE_MATCH',
      'AI_CANDIDATE_RANKING',
      'AI_CV_ANALYSIS',
      'AI_RECRUITMENT_ASSISTANT',
    ],
    allowedModelTiers: ['low_cost', 'standard'],
  },
  scale: {
    tier: 'scale',
    name: 'Scale',
    priceMonthly: 199,
    seatsIncluded: 10,
    jobPostLimit: -1,
    messagesIncluded: -1,
    boostsIncluded: 2,
    aiCreditsIncluded: 5000,
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
    allowedAiFeatures: [
      'AI_CANDIDATE_MATCH',
      'AI_CANDIDATE_RANKING',
      'AI_CV_ANALYSIS',
      'AI_SKILL_GAP',
      'AI_RECRUITMENT_ASSISTANT',
      'AI_COMPANY_INSIGHTS',
    ],
    allowedModelTiers: ['low_cost', 'standard', 'premium'],
  },
};

export const PLAN_RANK: Record<PlanTier, number> = {
  learner_free: 1,
  starter: 1,
  learner_pro: 2,
  growth: 2,
  scale: 3,
};
