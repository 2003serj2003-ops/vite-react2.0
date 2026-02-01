/**
 * Sellix Theme System
 * Управление светлой и тёмной темой
 */

export type Theme = 'light' | 'dark';

const THEME_KEY = 'sellix_theme';

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return (stored === 'dark' || stored === 'light') ? stored : 'light';
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  setStoredTheme(theme);
}

export function toggleTheme(): Theme {
  const current = getStoredTheme();
  const next: Theme = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}

export function initTheme(): Theme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}
