/**
 * Dark mode utilities — class-based strategy (adds/removes `dark` on <html>).
 * Preference is persisted in localStorage under the key "theme".
 */

export function initDarkMode(): void {
  try {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch {
    // localStorage may be unavailable (private mode, SSR, etc.)
  }
}

export function toggleDarkMode(): boolean {
  const isDark = document.documentElement.classList.toggle('dark');
  try {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  } catch { /* noop */ }
  return isDark;
}

export function getIsDark(): boolean {
  return document.documentElement.classList.contains('dark');
}
