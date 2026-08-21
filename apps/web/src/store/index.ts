import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import { authReducer } from './slices/authSlice';
import { uiReducer } from './slices/uiSlice';
import { notificationsReducer } from './slices/notificationsSlice';
import { socketMiddleware } from './socket/socketMiddleware';
import { themeListenerMiddleware } from './themeListenerMiddleware';

export const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authReducer,
      ui: uiReducer,
      notifications: notificationsReducer,
    },
    middleware: (getDefault) =>
      getDefault({
        serializableCheck: {
          ignoredActions: ['socket/connect', 'socket/disconnect'],
        },
      }).concat(
        baseApi.middleware,
        socketMiddleware,
        themeListenerMiddleware.middleware,
      ),
    devTools: process.env.NODE_ENV !== 'production',
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
