import { baseApi } from './baseApi';

export interface AudioSummaryResponse {
  id: string;
  nodeId: string;
  title: string;
  audioUrl: string;
  durationSeconds: number;
  contentVersion: string;
}

export const audioApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAudioSummary: builder.query<AudioSummaryResponse, { nodeId: string }>({
      query: ({ nodeId }) => `/audio-summaries/${nodeId}`,
      providesTags: (result, error, { nodeId }) => [{ type: 'RoadmapTrack', id: `audio-${nodeId}` }],
      keepUnusedDataFor: 600, // 10 minutes cache
    }),
  }),
});

export const { useGetAudioSummaryQuery } = audioApi;
