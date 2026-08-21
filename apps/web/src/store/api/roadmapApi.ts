import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';

export interface RoadmapNodeItem {
  id: string;
  topicId: string;
  title: string;
  level: number;
  prerequisites: string[];
  status: 'locked' | 'available' | 'in_progress' | 'mastered' | 'remedial';
  failPercentage?: number;
}

const roadmapNodesAdapter = createEntityAdapter<RoadmapNodeItem, string>({
  selectId: (node: RoadmapNodeItem) => node.id,
  sortComparer: (a, b) => a.level - b.level,
});

export const roadmapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoadmap: builder.query<EntityState<RoadmapNodeItem, string>, { learnerId?: string }>({
      query: ({ learnerId } = {}) => `/roadmap${learnerId ? `?learnerId=${learnerId}` : ''}`,
      transformResponse: (response: RoadmapNodeItem[]) =>
        roadmapNodesAdapter.setAll(roadmapNodesAdapter.getInitialState(), response),
      providesTags: (result) =>
        result
          ? [
              ...result.ids.map((id) => ({ type: 'RoadmapTrack' as const, id })),
              { type: 'RoadmapTrack', id: 'LIST' },
            ]
          : [{ type: 'RoadmapTrack', id: 'LIST' }],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useGetRoadmapQuery } = roadmapApi;
export const { selectAll: selectAllRoadmapNodes, selectById: selectRoadmapNodeById } =
  roadmapNodesAdapter.getSelectors();
