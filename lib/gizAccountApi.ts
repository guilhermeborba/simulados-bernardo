export class AccountApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'AccountApiError';
  }
}

async function accountFetch<T>(url: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AccountApiError(
      typeof data?.message === 'string' ? data.message : 'Não foi possível completar o pedido. Tente de novo.',
      response.status,
    );
  }
  return data as T;
}

export function requestPasswordRecovery(email: string) {
  return accountFetch<{ message: string }>('/api/auth/forgot-password', { email });
}

export function resetPassword(token: string, password: string) {
  return accountFetch<{ success: true }>('/api/auth/reset-password', { token, password });
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  earnedAt: string | null;
}

export function getAchievements() {
  return accountFetch<{
    achievements: Achievement[];
    stats: { completedQuizzes: number; topics: number; completedMissions: number; totalXp: number };
  }>('/api/backend/me/achievements');
}

/** Keep invitation redirects local, including when supplied in a query string. */
export function safeReturnTo(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u001f\u007f]/.test(value) ? value : null;
}

/**
 * Leaves the sign-in or sign-up screen with a full page load. While signed out, the router prefetched
 * protected routes such as "/" (the logo's link) and cached the middleware's redirect to /login; a client
 * navigation right after the cookies arrive would replay that redirect, while a new page starts clean.
 */
export function goAfterSignIn(destination: string) {
  window.location.assign(safeReturnTo(destination) ?? '/');
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

export function passwordError(password: string): string | undefined {
  if (password.length < 8) return 'Use pelo menos 8 caracteres.';
  if (new TextEncoder().encode(password).length > 72) return 'Use uma senha com até 72 bytes (menos símbolos ou letras).';
  return undefined;
}
