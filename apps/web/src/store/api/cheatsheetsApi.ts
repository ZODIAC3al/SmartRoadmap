import { baseApi } from './baseApi';

export interface CheatsheetResponse {
  id: string;
  nodeId: string;
  title: string;
  summary: string;
  codeSnippets: Array<{ language: string; code: string; explanation: string }>;
  keyTerms: Array<{ term: string; definition: string }>;
  contentVersion: string;
}

export const cheatsheetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCheatsheet: builder.query<CheatsheetResponse, { nodeId: string; version?: string }>({
      query: ({ nodeId, version }) => `/cheatsheets/${nodeId}${version ? `?v=${version}` : ''}`,
      providesTags: (result, error, { nodeId }) => [{ type: 'RoadmapTrack', id: `cheatsheet-${nodeId}` }],
      keepUnusedDataFor: 600, // 10 minutes cache
    }),
  }),
});

export const { useGetCheatsheetQuery } = cheatsheetsApi;
