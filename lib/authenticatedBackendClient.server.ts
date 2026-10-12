import { createHash } from 'node:crypto';
import type { BackendResponse } from './backendFetch.server';
import type { AuthTokens } from './serverCookies';

export interface AuthenticatedFetchResult extends BackendResponse {
  refreshedTokens?: AuthTokens;
  shouldClearCookies?: boolean;
  sessionIsInvalidated?: () => boolean;
}

type BackendFetcher = (
  path: string,
  init?: RequestInit,
) => Promise<BackendResponse>;

type RefreshOutcome =
  | { kind: 'success'; tokens: AuthTokens }
  | { kind: 'invalid'; response: BackendResponse }
  | { kind: 'unavailable'; response: BackendResponse };

interface RefreshEntry {
  promise?: Promise<RefreshOutcome>;
  expiresAt: number;
  invalidated: boolean;
  successorKey?: string;
}

interface ClientOptions {
  refreshCacheTtlMs?: number;
  maxRefreshEntries?: number;
  now?: () => number;
}

const unavailable = (): BackendResponse => ({
  status: 503,
  body: { message: 'Serviço temporariamente indisponível. Tente novamente.' },
});

const invalidSession = (): AuthenticatedFetchResult => ({
  status: 401,
  body: { message: 'Sessão encerrada. Entre novamente.' },
  shouldClearCookies: true,
});

function tokenKey(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function readTokens(body: unknown): AuthTokens | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Partial<AuthTokens>;
  if (
    typeof value.accessToken !== 'string' ||
    !value.accessToken.trim() ||
    typeof value.refreshToken !== 'string' ||
    !value.refreshToken.trim()
  ) {
    return null;
  }
  return { accessToken: value.accessToken, refreshToken: value.refreshToken };
}

/**
 * The coordinator belongs to one BFF process. A short success window covers
 * requests that still carry the previous cookie after rotation. Database
 * transactions enforce token consumption/revocation across BFF instances.
 */
export function createAuthenticatedBackendClient(
  fetchBackend: BackendFetcher,
  {
    refreshCacheTtlMs = 15_000,
    maxRefreshEntries = 1_000,
    now = Date.now,
  }: ClientOptions = {},
) {
  const entries = new Map<string, RefreshEntry>();
  const activeRequests = new Map<string, number>();

  function pruneExpired() {
    const time = now();
    for (const [key, entry] of Array.from(entries)) {
      if (entry.expiresAt <= time && !activeRequests.has(key)) entries.delete(key);
    }
  }

  async function refresh(refreshToken: string) {
    pruneExpired();
    const key = tokenKey(refreshToken);
    let entry = entries.get(key);

    if (!entry) {
      if (entries.size >= maxRefreshEntries) {
        return {
          outcome: { kind: 'unavailable', response: unavailable() } as RefreshOutcome,
          isInvalidated: () => false,
        };
      }
      entry = { expiresAt: Infinity, invalidated: false };
      entries.set(key, entry);
    }

    const currentEntry = entry;
    const isInvalidated = () =>
      currentEntry.invalidated || entries.get(key)?.invalidated === true;

    if (isInvalidated()) {
      return {
        outcome: { kind: 'invalid', response: invalidSession() } as RefreshOutcome,
        isInvalidated,
      };
    }

    if (!currentEntry.promise) {
      currentEntry.promise = (async (): Promise<RefreshOutcome> => {
        let outcome: RefreshOutcome;
        try {
          const response = await fetchBackend('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
          if (response.status === 200) {
            const tokens = readTokens(response.body);
            outcome = tokens
              ? { kind: 'success', tokens }
              : {
                  kind: 'unavailable',
                  response: {
                    status: 502,
                    body: { message: 'Resposta inválida ao renovar a sessão.' },
                  },
                };
          } else if (response.status === 401 || response.status === 403) {
            outcome = { kind: 'invalid', response };
          } else {
            outcome = {
              kind: 'unavailable',
              response:
                response.status >= 400 && response.status <= 599
                  ? response
                  : {
                      status: 502,
                      body: { message: 'Não foi possível renovar a sessão.' },
                    },
            };
          }
        } catch {
          outcome = { kind: 'unavailable', response: unavailable() };
        }

        if (outcome.kind === 'success') {
          currentEntry.successorKey = tokenKey(outcome.tokens.refreshToken);
          currentEntry.expiresAt = now() + refreshCacheTtlMs;
        } else if (currentEntry.invalidated) {
          currentEntry.expiresAt = now() + refreshCacheTtlMs;
        } else if (entries.get(key) === currentEntry) {
          // Transient failures must be retryable and cannot erase credentials.
          entries.delete(key);
        }
        return outcome;
      })();
    }

    return { outcome: await currentEntry.promise, isInvalidated };
  }

  function invalidateSession(refreshToken: string) {
    pruneExpired();
    const key = tokenKey(refreshToken);
    const affected = new Set([key]);
    let changed = true;

    // Invalidate retained predecessors as well as a known rotated successor.
    while (changed) {
      changed = false;
      for (const [entryKey, entry] of Array.from(entries)) {
        if (
          affected.has(entryKey) ||
          (entry.successorKey && affected.has(entry.successorKey))
        ) {
          entry.invalidated = true;
          if (!affected.has(entryKey)) {
            affected.add(entryKey);
            changed = true;
          }
          if (entry.successorKey && !affected.has(entry.successorKey)) {
            affected.add(entry.successorKey);
            changed = true;
          }
        }
      }
    }

    // A request with old cookies may still be waiting for its first 401.
    for (const affectedKey of Array.from(affected)) {
      if (!entries.has(affectedKey) && entries.size < maxRefreshEntries) {
        entries.set(affectedKey, {
          expiresAt: now() + refreshCacheTtlMs,
          invalidated: true,
        });
      }
    }
  }

  async function fetchWithTokens(
    path: string,
    init: RequestInit = {},
    tokens: { accessToken?: string; refreshToken?: string } = {},
  ): Promise<AuthenticatedFetchResult> {
    const attempt = async (accessToken: string | undefined) => {
      const headers = new Headers(init.headers);
      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
      else headers.delete('Authorization');

      try {
        return await fetchBackend(path, { ...init, headers });
      } catch {
        return unavailable();
      }
    };

    const first = await attempt(tokens.accessToken);
    if (first.status !== 401) return first;
    if (!tokens.refreshToken) return { ...first, shouldClearCookies: true };

    const { outcome, isInvalidated } = await refresh(tokens.refreshToken);
    if (isInvalidated()) return invalidSession();
    if (outcome.kind === 'invalid') return { ...first, shouldClearCookies: true };
    if (outcome.kind === 'unavailable') return outcome.response;

    const retried = await attempt(outcome.tokens.accessToken);
    if (isInvalidated()) return invalidSession();
    if (retried.status === 401) return { ...retried, shouldClearCookies: true };

    return {
      ...retried,
      refreshedTokens: outcome.tokens,
      sessionIsInvalidated: isInvalidated,
    };
  }

  async function authenticatedFetch(
    path: string,
    init: RequestInit = {},
    tokens: { accessToken?: string; refreshToken?: string } = {},
  ): Promise<AuthenticatedFetchResult> {
    // Register before the first API call: even a slow initial 401 must share
    // a refresh that completed while that request was still in flight.
    pruneExpired();
    const key = tokens.refreshToken ? tokenKey(tokens.refreshToken) : undefined;
    if (key) activeRequests.set(key, (activeRequests.get(key) ?? 0) + 1);
    try {
      return await fetchWithTokens(path, init, tokens);
    } finally {
      if (key) {
        const remaining = (activeRequests.get(key) ?? 1) - 1;
        if (remaining) activeRequests.set(key, remaining);
        else activeRequests.delete(key);
      }
      pruneExpired();
    }
  }

  async function logout(refreshToken?: string): Promise<BackendResponse> {
    if (!refreshToken) return { status: 200, body: { success: true } };
    invalidateSession(refreshToken);
    try {
      return await fetchBackend('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      return unavailable();
    }
  }

  return { fetch: authenticatedFetch, logout };
}
