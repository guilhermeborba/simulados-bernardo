import type { NextResponse } from 'next/server';
import type { AuthenticatedFetchResult } from './authenticatedBackendClient.server';
import { setAuthCookies, clearAuthCookies } from './serverCookies';

export function applyAuthenticatedFetchCookies(
  response: NextResponse,
  result: AuthenticatedFetchResult,
): void {
  if (result.shouldClearCookies || result.sessionIsInvalidated?.()) {
    clearAuthCookies(response);
  } else if (result.refreshedTokens) {
    setAuthCookies(response, result.refreshedTokens);
  }
}
