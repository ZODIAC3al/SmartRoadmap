import { createListenerMiddleware } from '@reduxjs/toolkit';
import { setTheme } from './slices/uiSlice';

export const themeListenerMiddleware = createListenerMiddleware();

themeListenerMiddleware.startListening({
  actionCreator: setTheme,
  effect: (action) => {
    const newTheme = action.payload;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smartroadmap_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      } catch (err) {
        console.error('Failed to persist theme to localStorage:', err);
      }
    }
  },
});
