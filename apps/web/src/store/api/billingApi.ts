import { baseApi } from './baseApi';

export interface SubscriptionData {
  subscription: {
    plan: 'starter' | 'growth' | 'scale';
    status: 'active' | 'past_due' | 'canceled';
    usage: {
      jobPostsActive: number;
      messagesSentThisPeriod: number;
      boostsUsedThisPeriod: number;
    };
  };
  limits: {
    tier: string;
    name: string;
    jobPostLimit: number;
    messagesIncluded: number;
    seatsIncluded?: number;
    features: Record<string, boolean | number>;
  };
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMySubscription: builder.query<SubscriptionData, void>({
      query: () => '/billing/subscription',
      providesTags: ['Subscription'],
      keepUnusedDataFor: 60,
    }),
    createCheckoutSession: builder.mutation<{ url: string }, { plan: string }>({
      query: (body) => ({
        url: '/billing/checkout-session',
        method: 'POST',
        body,
      }),
    }),
    createPortalSession: builder.mutation<{ url: string }, void>({
      query: () => ({
        url: '/billing/portal-session',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetMySubscriptionQuery,
  useCreateCheckoutSessionMutation,
  useCreatePortalSessionMutation,
} = billingApi;
