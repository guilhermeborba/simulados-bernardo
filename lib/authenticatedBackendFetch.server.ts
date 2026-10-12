import { cookies } from 'next/headers';
import { backendFetch } from './backendFetch.server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './serverCookies';
import { createAuthenticatedBackendClient } from './authenticatedBackendClient.server';

export type { AuthenticatedFetchResult } from './authenticatedBackendClient.server';
export { applyAuthenticatedFetchCookies } from './authenticatedFetchCookies.server';

// Next can load route modules separately; share one coordinator per process.
const processState = globalThis as typeof globalThis & {
  simuladosAuthBackendClient?: ReturnType<typeof createAuthenticatedBackendClient>;
};
const client = (processState.simuladosAuthBackendClient ??=
  createAuthenticatedBackendClient(backendFetch));

export async function authenticatedBackendFetch(
  path: string,
  init: RequestInit = {},
) {
  const cookieStore = cookies();
  return client.fetch(path, init, {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  });
}

export async function logoutBackendSession(refreshToken?: string) {
  return client.logout(refreshToken);
}
