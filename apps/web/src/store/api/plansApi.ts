import { baseApi } from './baseApi';

export interface PlanItem {
  id: string;
  name: string;
  audience: 'learner' | 'company';
  priceMonthly: number;
  currency: string;
  features: string[];
  aiToolsIncluded: string[];
  isMostPopular?: boolean;
}

export const plansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query<PlanItem[], 'learner' | 'company' | void>({
      query: (audience) => `/plans${audience ? `?audience=${audience}` : ''}`,
      providesTags: ['Plan'],
      keepUnusedDataFor: 300, // 5 minutes
    }),
  }),
});

export const { useGetPlansQuery } = plansApi;
