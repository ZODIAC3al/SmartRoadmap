import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  isSidebarOpen: boolean;
  activeModal: string | null;
  theme: 'smartlight' | 'smartdark';
  selectedRoleTab: 'learner' | 'company';
  isConnected: boolean;
}

const initialState: UiState = {
  isSidebarOpen: true,
  activeModal: null,
  theme: 'smartlight',
  selectedRoleTab: 'learner',
  isConnected: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setActiveModal: (state, action: PayloadAction<string | null>) => {
      state.activeModal = action.payload;
    },
    setTheme: (state, action: PayloadAction<'smartlight' | 'smartdark'>) => {
      state.theme = action.payload;
    },
    setSelectedRoleTab: (state, action: PayloadAction<'learner' | 'company'>) => {
      state.selectedRoleTab = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
  },
});

export const { toggleSidebar, setActiveModal, setTheme, setSelectedRoleTab, setConnected } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
