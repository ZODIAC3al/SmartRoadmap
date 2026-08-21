import { Middleware, createAction } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { baseApi } from '../api/baseApi';
import { incrementUnread } from '../slices/notificationsSlice';
import { setConnected } from '../slices/uiSlice';

export const connectSocket = createAction<{ token?: string }>('socket/connect');
export const disconnectSocket = createAction('socket/disconnect');

let socket: Socket | null = null;

export const socketMiddleware: Middleware = (store) => (next) => (action: any) => {
  const dispatch: any = store.dispatch;

  if (connectSocket.match(action)) {
    if (!socket) {
      const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
      const socketUrl = baseUrl.includes('/ws/events') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/ws/events`;
      socket = io(socketUrl, {
        auth: { token: action.payload?.token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        dispatch(setConnected(true));
      });

      socket.on('disconnect', () => {
        dispatch(setConnected(false));
      });

      socket.on('subscription:updated', () => {
        dispatch((baseApi.util.invalidateTags as any)(['Subscription', 'Company']));
      });

      socket.on('message:new', (data: any) => {
        if (data?.threadId) {
          dispatch(
            (baseApi.util.updateQueryData as any)(
              'getThreadMessages',
              { threadId: data.threadId },
              (draft: any) => {
                if (Array.isArray(draft)) {
                  draft.push(data.message);
                }
              },
            ),
          );
        }
        dispatch((baseApi.util.invalidateTags as any)([{ type: 'MessageThread' }]));
      });

      socket.on('notification:new', () => {
        dispatch(incrementUnread());
        dispatch((baseApi.util.invalidateTags as any)([{ type: 'Notification' }]));
      });

      // Standing Admin Notification batch update (in place update, avoiding duplicates)
      socket.on('certificate:awaiting-verification', (data: any) => {
        dispatch(incrementUnread());
        dispatch((baseApi.util.invalidateTags as any)([{ type: 'Notification' }]));
      });
    }
  }

  if (disconnectSocket.match(action)) {
    if (socket) {
      socket.disconnect();
      socket = null;
      dispatch(setConnected(false));
    }
  }

  return next(action);
};
