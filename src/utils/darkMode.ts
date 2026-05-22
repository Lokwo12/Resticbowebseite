/**
 * Dark mode utilities — class-based strategy (adds/removes `dark` on <html>).
 * Dark mode has been disabled per user request, forcing light mode across the site.
 */

export function initDarkMode(): void {
  try {
    // Always force light mode
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } catch {
    // localStorage may be unavailable
  }
}

export function toggleDarkMode(): boolean {
  // Always enforce light mode
  document.documentElement.classList.remove('dark');
  try {
    localStorage.setItem('theme', 'light');
  } catch { /* noop */ }
  return false;
}

export function getIsDark(): boolean {
  return false;
}
