export type ThemePreference = 'light' | 'dark' | 'auto';

const PREFIX = 'giz:';
const sessionPreferences = new Map<string, unknown>();
export const PREFERENCES_EVENT = 'giz:preferences';

/** Preferences are optional: restricted storage must never prevent studying. */
export function readPreference<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  if (sessionPreferences.has(key)) return sessionPreferences.get(key) as T;
  try {
    const value = window.localStorage.getItem(`${PREFIX}${key}`);
    return value === null ? fallback : JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function writePreference(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    sessionPreferences.delete(key);
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
    return true;
  } catch {
    sessionPreferences.set(key, value);
    return false;
  }
}

export function getTheme(): ThemePreference {
  const value = readPreference<unknown>('theme', 'auto');
  return value === 'light' || value === 'dark' || value === 'auto' ? value : 'auto';
}

export function setTheme(theme: ThemePreference): boolean {
  if (typeof document !== 'undefined') {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.dataset.theme = theme;
  }
  return writePreference('theme', theme);
}

export function getTimerDefault(): boolean {
  const value = readPreference<unknown>('timer', true);
  return typeof value === 'boolean' ? value : true;
}

export function setTimerDefault(enabled: boolean): boolean {
  return writePreference('timer', enabled);
}
