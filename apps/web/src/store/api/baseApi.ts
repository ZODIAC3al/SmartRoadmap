import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { logout, setCredentials } from '../slices/authSlice';
import { getToken, fetchMe, clearSession, hasSession } from '@/lib/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = getToken() || state.auth?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  // If session cookie exists but in-memory access token is null (e.g. reload),
  // proactively refresh session first so the very first call has the authorization header.
  if (hasSession() && !getToken()) {
    const me = await fetchMe();
    const freshToken = getToken();
    if (me && freshToken) {
      api.dispatch(setCredentials({ user: me, token: freshToken }));
    }
  }

  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    // Try silently fetching current session token
    const me = await fetchMe();
    const freshToken = getToken();
    if (me && freshToken) {
      api.dispatch(setCredentials({ user: me, token: freshToken }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
      clearSession();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Plan',
    'Subscription',
    'MessageThread',
    'Message',
    'Company',
    'RoadmapTrack',
    'Notification',
    'Certificate',
    'Job',
    'CandidatePipeline',
    'QuizSession',
    'Gamification',
    'AiQuota',
    'AiHistory',
  ],
  endpoints: () => ({}),
});
