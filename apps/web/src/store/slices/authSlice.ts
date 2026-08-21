import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  user: any | null;
  role: 'learner' | 'company' | 'admin' | null;
  isAuthenticated: boolean;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  token: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: any; token?: string; role?: AuthState['role'] }>,
    ) => {
      state.user = action.payload.user;
      state.role = action.payload.role || action.payload.user?.role || 'learner';
      state.isAuthenticated = true;
      if (action.payload.token) {
        state.token = action.payload.token;
      }
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.token = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
