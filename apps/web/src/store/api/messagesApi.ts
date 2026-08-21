import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';

export interface MessageThreadItem {
  id: string;
  context: 'hiring' | 'support';
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  otherParticipant?: any;
}

export interface MessageItem {
  _id: string;
  threadId: string;
  senderId: string;
  body: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  createdAt: string;
  read: boolean;
  clientNonce?: string;
}

export interface MessagingUser {
  id: string;
  name: string;
  email: string;
  role: 'learner' | 'company' | 'admin';
  avatarUrl?: string;
}

const threadsAdapter = createEntityAdapter<MessageThreadItem, string>({
  selectId: (thread: MessageThreadItem) => thread.id,
  sortComparer: (a, b) => {
    // Pinned support thread first
    if (a.context === 'support' && b.context !== 'support') return -1;
    if (a.context !== 'support' && b.context === 'support') return 1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  },
});

export const messagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getThreads: builder.query<EntityState<MessageThreadItem, string>, void>({
      query: () => '/messaging/threads',
      transformResponse: (response: MessageThreadItem[]) =>
        threadsAdapter.setAll(threadsAdapter.getInitialState(), response),
      providesTags: (result) =>
        result
          ? [
              ...result.ids.map((id) => ({ type: 'MessageThread' as const, id })),
              { type: 'MessageThread', id: 'LIST' },
            ]
          : [{ type: 'MessageThread', id: 'LIST' }],
    }),
    getThreadMessages: builder.query<MessageItem[], { threadId: string; before?: string }>({
      query: ({ threadId, before }) =>
        `/messaging/threads/${threadId}/messages${before ? `?before=${before}` : ''}`,
      providesTags: (result, error, { threadId }) => [{ type: 'Message', id: threadId }],
    }),
    sendMessage: builder.mutation<MessageItem, { threadId: string; body: string; attachmentUrl?: string; attachmentName?: string; attachmentType?: string; attachmentSize?: number; clientNonce?: string }>({
      query: (body) => ({
        url: '/messaging/messages',
        method: 'POST',
        body,
      }),
      async onQueryStarted({ threadId, body, clientNonce }, { dispatch, queryFulfilled }) {
        const tempId = clientNonce || `temp-${Date.now()}`;
        const patchResult = dispatch(
          (baseApi.util.updateQueryData as any)(
            'getThreadMessages',
            { threadId },
            (draft: MessageItem[]) => {
              if (Array.isArray(draft)) {
                draft.push({
                  _id: tempId,
                  threadId,
                  senderId: 'me',
                  body,
                  createdAt: new Date().toISOString(),
                  read: true,
                  clientNonce,
                });
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
      invalidatesTags: (result, error, { threadId }) => [
        { type: 'Message', id: threadId },
        { type: 'MessageThread', id: threadId },
      ],
    }),
    markThreadRead: builder.mutation<{ success: boolean }, string>({
      query: (threadId) => ({
        url: `/messaging/threads/${threadId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _err, threadId) => [
        { type: 'MessageThread', id: threadId },
        { type: 'MessageThread', id: 'LIST' },
      ],
    }),
    uploadAttachment: builder.mutation<{ url: string; name: string; type: string; size: number }, FormData>({
      query: (formData) => ({
        url: '/messaging/upload-attachment',
        method: 'POST',
        body: formData,
      }),
    }),
    searchMessagingUsers: builder.query<MessagingUser[], { q: string; role?: string }>({
      query: ({ q, role }) =>
        `/messaging/users/search?q=${encodeURIComponent(q)}${role ? `&role=${role}` : ''}`,
    }),
  }),
});

export const {
  useGetThreadsQuery,
  useGetThreadMessagesQuery,
  useSendMessageMutation,
  useMarkThreadReadMutation,
  useUploadAttachmentMutation,
  useSearchMessagingUsersQuery,
} = messagesApi;
export const { selectAll: selectAllThreads, selectById: selectThreadById } = threadsAdapter.getSelectors();
