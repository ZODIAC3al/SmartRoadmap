import { baseApi } from './baseApi';

export interface StreaksResponse {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  activityHistory: Array<{ date: string; count: number }>;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
}

export const gamificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStreaks: builder.query<StreaksResponse, void>({
      query: () => '/gamification/streaks',
      providesTags: ['Gamification'],
    }),
    getAchievements: builder.query<AchievementItem[], void>({
      query: () => '/gamification/achievements',
      providesTags: ['Gamification'],
    }),
  }),
});

export const { useGetStreaksQuery, useGetAchievementsQuery } = gamificationApi;
