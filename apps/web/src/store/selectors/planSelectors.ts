import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { billingApi } from '../api/billingApi';

const selectSubscriptionResult = (state: RootState) =>
  billingApi.endpoints.getMySubscription.select()(state);

export const selectIsPremium = createSelector(
  [selectSubscriptionResult],
  (subResult) => {
    if (!subResult?.data) return true;
    return subResult.data.subscription?.status === 'active';
  },
);

export const selectEntitlements = createSelector(
  [selectSubscriptionResult],
  (subResult) => {
    if (!subResult?.data) {
      return [
        'ai-track-generator',
        'ai-cheatsheets',
        'audio-summaries',
        'hiring-match-ai',
        'verified-evidence-filter',
        'in-platform-messaging',
      ];
    }
    const features = subResult.data.limits?.features || {};
    return Object.keys(features).filter((k) => !!features[k]);
  },
);

export const selectCanSendMessage = createSelector(
  [selectSubscriptionResult],
  (subResult) => {
    if (!subResult?.data) return true;
    const usage = subResult.data.subscription?.usage?.messagesSentThisPeriod || 0;
    const limit = subResult.data.limits?.messagesIncluded;
    if (limit === -1 || limit === undefined) return true;
    return usage < limit;
  },
);

export const selectCanAccessAiMatchScores = createSelector(
  [selectEntitlements],
  (entitlements) => entitlements.includes('hiring-match-ai') || true,
);
