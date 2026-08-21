import { baseApi } from './baseApi';

export interface CompanyOverviewResponse {
  companyId?: string;
  name?: string;
  slug?: string;
  website?: string;
  industry?: string;
  size?: string;
  about?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  metrics: {
    totalApplicants: number;
    availableStaff: number;
    avgMatchScore: number;
    activeJobs: number;
  };
  barTrend: Array<{ month: string; applied: number; interviewed: number }>;
  roleDistribution?: Array<{ name: string; value: number; color: string }>;
  genderDistribution?: Array<{ name: string; value: number; color: string }>;
  divisionStats: Array<{ name: string; count: number; icon: string }>;
}

export const companyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyOverview: builder.query<CompanyOverviewResponse, void>({
      query: () => '/company/overview',
      providesTags: ['Company'],
    }),
    getCompanyBySlug: builder.query<any, string>({
      query: (slug) => `/companies/${slug}`,
      providesTags: ['Company'],
    }),
    getCompanyById: builder.query<any, string>({
      query: (id) => `/company/${id}`,
      providesTags: ['Company'],
    }),
    updateCompanyProfile: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/company/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Company'],
    }),
    uploadCompanyLogo: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/company/${id}/logo`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Company'],
    }),
    uploadCompanyCover: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/company/${id}/cover`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Company'],
    }),
  }),
});

export const {
  useGetCompanyOverviewQuery,
  useGetCompanyBySlugQuery,
  useGetCompanyByIdQuery,
  useUpdateCompanyProfileMutation,
  useUploadCompanyLogoMutation,
  useUploadCompanyCoverMutation,
} = companyApi;
