import { baseApi } from './baseApi';

export interface QuizQuestionItem {
  id: string;
  prompt: string;
  options: string[];
}

export interface QuizSessionResponse {
  sessionId: string;
  topicId: string;
  questions: QuizQuestionItem[];
}

export interface QuizAttemptResponse {
  sessionId: string;
  score: number;
  passed: boolean;
  failPercentage: number;
  remedialNodesInserted?: string[];
}

export const quizApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQuizSession: builder.query<QuizSessionResponse, { topicId: string }>({
      query: ({ topicId }) => `/quizzes/session?topicId=${topicId}`,
      providesTags: (result, error, { topicId }) => [{ type: 'QuizSession', id: topicId }],
      keepUnusedDataFor: 30, // 30 seconds single-use session cache
    }),
    submitAttempt: builder.mutation<QuizAttemptResponse, { sessionId: string; answers: Record<string, number> }>({
      query: (body) => ({
        url: '/quizzes/attempt',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RoadmapTrack', 'QuizSession', 'Certificate', 'Gamification'],
    }),
  }),
});

export const { useGetQuizSessionQuery, useSubmitAttemptMutation } = quizApi;
