import { useEffect, useState } from 'react';
import { useNotesStore } from '../stores/categoryStore';

export function useTheme() {
  const { theme, setTheme } = useNotesStore();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;

    // const applyTheme = (mode: 'light' | 'dark') => {
    //   root.classList.add('transitioning');

    //   if (mode === 'dark') {
    //     root.classList.add('dark');
    //   } else {
    //     root.classList.remove('dark');
    //   }

    //   // Remove transitioning class after animation
    //   setTimeout(() => {
    //     root.classList.remove('transitioning'); 
    //   }, 300);
    // };

    const applyTheme = (mode: 'light' | 'dark') => {
      setResolvedTheme(mode);

      root.classList.add('transitioning');
      root.classList.toggle('dark', mode === 'dark');

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

  return { theme, resolvedTheme, setTheme };
}
