import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logoutBackendSession } from '@/lib/authenticatedBackendFetch.server';
import { clearAuthCookies, REFRESH_TOKEN_COOKIE } from '@/lib/serverCookies';

export async function POST() {
  const refreshToken = cookies().get(REFRESH_TOKEN_COOKIE)?.value;
  const result = await logoutBackendSession(refreshToken);
  const response = NextResponse.json(result.body, { status: result.status });
  clearAuthCookies(response);
  return response;
}
