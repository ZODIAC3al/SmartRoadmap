import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';

export interface JobPostingItem {
  id: string;
  _id?: string;
  title: string;
  company?: string;
  location: string;
  country?: string;
  salaryMin: number;
  salaryMax: number;
  workType?: string;
  jobType?: string;
  experienceLevel?: string;
  requiredSkills?: string[];
  technologies?: string[];
  description?: string;
  status: 'draft' | 'published' | 'closed';
  applicantCount: number;
  createdAt: string;
}

const jobsAdapter = createEntityAdapter<JobPostingItem, string>({
  selectId: (job: JobPostingItem) => job.id,
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<EntityState<JobPostingItem, string>, void>({
      query: () => '/hiring/jobs',
      transformResponse: (response: JobPostingItem[]) =>
        jobsAdapter.setAll(jobsAdapter.getInitialState(), response),
      providesTags: (result) =>
        result
          ? [
              ...result.ids.map((id) => ({ type: 'Job' as const, id })),
              { type: 'Job', id: 'LIST' },
            ]
          : [{ type: 'Job', id: 'LIST' }],
    }),
    getMyJobs: builder.query<EntityState<JobPostingItem, string>, void>({
      query: () => '/hiring/jobs/my',
      transformResponse: (response: JobPostingItem[]) =>
        jobsAdapter.setAll(jobsAdapter.getInitialState(), response),
      providesTags: (result) =>
        result
          ? [
              ...result.ids.map((id) => ({ type: 'Job' as const, id })),
              { type: 'Job', id: 'MY_LIST' },
            ]
          : [{ type: 'Job', id: 'MY_LIST' }],
    }),
    createJob: builder.mutation<JobPostingItem, Partial<JobPostingItem>>({
      query: (body) => ({
        url: '/hiring/jobs',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, { type: 'Job', id: 'MY_LIST' }],
    }),
    updateJobStatus: builder.mutation<JobPostingItem, { id: string; status: JobPostingItem['status'] }>({
      query: ({ id, status }) => ({
        url: `/hiring/jobs/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Job', id }],
    }),
    getMatchedJobs: builder.query<any[], void>({
      query: () => '/hiring/jobs/matches',
      providesTags: [{ type: 'Job', id: 'MATCHES' }],
    }),
    getMyApplications: builder.query<any[], void>({
      query: () => '/hiring/applications',
      providesTags: [{ type: 'Job', id: 'APPLICATIONS' }],
    }),
    applyJob: builder.mutation<any, { jobId: string; cvId?: string; coverLetter?: string }>({
      query: (body) => ({
        url: '/hiring/applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Job', id: 'APPLICATIONS' }],
    }),
    deleteJob: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/hiring/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, { type: 'Job', id: 'MY_LIST' }],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetMyJobsQuery,
  useCreateJobMutation,
  useUpdateJobStatusMutation,
  useGetMatchedJobsQuery,
  useGetMyApplicationsQuery,
  useApplyJobMutation,
  useDeleteJobMutation,
} = jobsApi;
export const { selectAll: selectAllJobs, selectById: selectJobById } = jobsAdapter.getSelectors();
