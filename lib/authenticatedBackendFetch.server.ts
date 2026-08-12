import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from './backendFetch.server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  AuthTokens,
  setAuthCookies,
  clearAuthCookies,
} from './serverCookies';

export interface AuthenticatedFetchResult {
  status: number;
  body: unknown;
  refreshedTokens?: AuthTokens;
  shouldClearCookies?: boolean;
}

export async function authenticatedBackendFetch(
  path: string,
  init: RequestInit = {},
): Promise<AuthenticatedFetchResult> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  const attempt = (token: string | undefined) =>
    backendFetch(path, {
      ...init,
      headers: {
        ...init.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  const first = await attempt(accessToken);

  if (first.status !== 401) {
    return first;
  }

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return { ...first, shouldClearCookies: true };
  }

  const refreshResult = await backendFetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (refreshResult.status !== 200) {
    return { ...first, shouldClearCookies: true };
  }

  const refreshedTokens = refreshResult.body as AuthTokens;
  const retried = await attempt(refreshedTokens.accessToken);

  return { ...retried, refreshedTokens };
}

export function applyAuthenticatedFetchCookies(
  response: NextResponse,
  result: AuthenticatedFetchResult,
): void {
  if (result.refreshedTokens) {
    setAuthCookies(response, result.refreshedTokens);
  } else if (result.shouldClearCookies) {
    clearAuthCookies(response);
  }
}
