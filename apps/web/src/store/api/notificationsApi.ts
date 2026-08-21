import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  data?: Record<string, any>;
}

const notificationsAdapter = createEntityAdapter<NotificationItem, string>({
  selectId: (notif: NotificationItem) => notif.id,
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<EntityState<NotificationItem, string>, void>({
      query: () => '/notifications',
      transformResponse: (response: NotificationItem[]) =>
        notificationsAdapter.setAll(notificationsAdapter.getInitialState(), response),
      providesTags: (result) =>
        result
          ? [
              ...result.ids.map((id) => ({ type: 'Notification' as const, id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),
    markAsRead: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Notification', id }],
    }),
    markAllRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
  }),
});

export const { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllReadMutation } = notificationsApi;
export const { selectAll: selectAllNotifications, selectById: selectNotificationById } = notificationsAdapter.getSelectors();
