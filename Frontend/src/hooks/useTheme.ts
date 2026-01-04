import { useEffect } from 'react';
import { useNotesStore } from '../stores/notesStore';

export function useTheme() {
  const { theme, setTheme } = useNotesStore();

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (mode: 'light' | 'dark') => {
      root.classList.add('transitioning');

      if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Remove transitioning class after animation
      setTimeout(() => {
        root.classList.remove('transitioning');
      }, 300);
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  return { theme, setTheme };
}
