import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationsState {
  unreadCount: number;
}

const initialState: NotificationsState = {
  unreadCount: 0,
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },
    resetUnread: (state) => {
      state.unreadCount = 0;
    },
  },
});

export const { setUnreadCount, incrementUnread, resetUnread } = notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;
