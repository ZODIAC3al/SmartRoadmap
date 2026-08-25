import { baseApi } from './baseApi';

export interface QuotaStatusResponse {
  allocatedCredits: number;
  consumedCredits: number;
  reservedCredits: number;
  remainingCredits: number;
  usagePercentage: number;
  periodStart?: string;
  periodEnd?: string;
  thresholdState: 'normal' | 'warning_75' | 'critical_90' | 'exhausted_100';
}

export interface AiUsageLedgerItem {
  _id: string;
  requestId: string;
  reservationId: string;
  userId: string;
  companyId?: string;
  role: string;
  plan: string;
  featureKey: string;
  provider: string;
  aiModel: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  creditsConsumed: number;
  status: 'success' | 'fallback' | 'failed';
  timestamp: string;
}

export const aiUsageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAiQuota: builder.query<QuotaStatusResponse, void>({
      query: () => '/billing/ai-quota',
      providesTags: ['AiQuota', 'Subscription'],
    }),
    getAiHistory: builder.query<AiUsageLedgerItem[], void>({
      query: () => '/billing/ai-history',
      providesTags: ['AiHistory'],
    }),
    createCheckoutSession: builder.mutation<{ url: string }, { plan: string }>({
      query: (body) => ({
        url: '/billing/checkout-session',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription', 'AiQuota'],
    }),
  }),
});

export const {
  useGetAiQuotaQuery,
  useGetAiHistoryQuery,
  useCreateCheckoutSessionMutation,
} = aiUsageApi;
