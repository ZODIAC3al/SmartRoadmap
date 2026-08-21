import { createListenerMiddleware } from '@reduxjs/toolkit';
import { setTheme, setLocale } from './slices/uiSlice';

export const themeListenerMiddleware = createListenerMiddleware();

themeListenerMiddleware.startListening({
  actionCreator: setTheme,
  effect: (action) => {
    const newTheme = action.payload;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smart_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      } catch (err) {
        console.error('Failed to persist theme to localStorage:', err);
      }
    }
  },
});

themeListenerMiddleware.startListening({
  actionCreator: setLocale,
  effect: (action) => {
    const newLocale = action.payload;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smart_locale', newLocale);
        document.documentElement.setAttribute('lang', newLocale);
        document.documentElement.setAttribute('dir', newLocale === 'ar' ? 'rtl' : 'ltr');
      } catch (err) {
        console.error('Failed to persist locale to localStorage:', err);
      }
    }
  },
});
