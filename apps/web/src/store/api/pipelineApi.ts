import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';

export interface CandidatePipelineItem {
  id: string;
  _id?: string;
  userId?: any;
  jobId: string;
  jobTitle?: string;
  company?: string;
  candidateName: string;
  candidateAvatar?: string;
  matchScore: number;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | string;
  status?: string;
  cvSnapshot?: any;
  passportSnapshot?: any;
  appliedAt: string;
  createdAt?: string;
}

const pipelineAdapter = createEntityAdapter<CandidatePipelineItem, string>({
  selectId: (item: CandidatePipelineItem) => item.id,
  sortComparer: (a, b) => b.matchScore - a.matchScore,
});

export const pipelineApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCandidates: builder.query<EntityState<CandidatePipelineItem, string>, { jobId?: string }>({
      query: ({ jobId } = {}) =>
        jobId ? `/hiring/applications/company?jobId=${jobId}` : `/hiring/candidates`,
      transformResponse: (response: any[]) => {
        const mapped: CandidatePipelineItem[] = (response || []).map((item: any) => ({
          ...item,
          id: item.id || item._id || item.userId || `cand-${Math.random()}`,
          jobId: item.jobId || '',
          candidateName: item.candidateName || item.userId?.name || item.name || 'Verified Talent',
          candidateAvatar: item.avatarUrl || item.candidateAvatar || item.userId?.avatarUrl,
          matchScore: item.matchScore || item.progress || 88,
          stage: item.stage || item.status || 'applied',
          appliedAt: item.appliedAt || item.createdAt || new Date().toISOString(),
        }));
        return pipelineAdapter.setAll(pipelineAdapter.getInitialState(), mapped);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.ids.map((id) => ({ type: 'CandidatePipeline' as const, id })),
              { type: 'CandidatePipeline', id: 'LIST' },
            ]
          : [{ type: 'CandidatePipeline', id: 'LIST' }],
    }),
    updateStage: builder.mutation<
      CandidatePipelineItem,
      { id: string; stage: CandidatePipelineItem['stage'] }
    >({
      query: ({ id, stage }) => ({
        url: `/hiring/applications/${id}/status`,
        method: 'PATCH',
        body: { status: stage, stage },
      }),
      async onQueryStarted({ id, stage }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          (baseApi.util.updateQueryData as any)(
            'getCandidates',
            {},
            (draft: EntityState<CandidatePipelineItem, string>) => {
              if (draft?.entities[id]) {
                draft.entities[id]!.stage = stage;
              }
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'CandidatePipeline', id }],
    }),
    evaluateCandidateAi: builder.mutation<
      { result: { score: number; reason: string }; provider: string; model: string },
      { candidateSkills: string[]; requiredSkills?: string[] }
    >({
      query: (body) => ({
        url: '/hiring/candidates/evaluate-ai',
        method: 'POST',
        body,
      }),
    }),
    getCompanyApplications: builder.query<
      EntityState<CandidatePipelineItem, string>,
      void
    >({
      query: () => `/hiring/applications/company`,
      transformResponse: (response: any[]) => {
        const mapped: CandidatePipelineItem[] = (response || []).map((item: any) => ({
          ...item,
          id: item.id || item._id || `app-${Math.random()}`,
          jobId: item.jobId || '',
          jobTitle: item.jobTitle || '',
          company: item.company || '',
          candidateName: item.candidateName || item.userId?.name || item.name || 'Applicant',
          candidateAvatar: item.avatarUrl || item.candidateAvatar || item.userId?.avatarUrl,
          matchScore: item.matchScore || 0,
          stage: item.stage || item.status || 'applied',
          appliedAt: item.appliedAt || item.createdAt || new Date().toISOString(),
        }));
        return pipelineAdapter.setAll(pipelineAdapter.getInitialState(), mapped);
      },
      providesTags: [{ type: 'CandidatePipeline', id: 'COMPANY_LIST' }],
    }),
  }),
});

export const {
  useGetCandidatesQuery,
  useGetCompanyApplicationsQuery,
  useUpdateStageMutation,
  useEvaluateCandidateAiMutation,
} = pipelineApi;
export const { selectAll: selectAllCandidates, selectById: selectCandidateById } = pipelineAdapter.getSelectors();
