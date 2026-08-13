import { NextResponse } from 'next/server';
import { setAuthCookies } from './serverCookies';

interface BackendAuthPayload {
  user: unknown;
  accessToken: string;
  refreshToken: string;
}

export function authSuccessResponse(payload: BackendAuthPayload): NextResponse {
  const response = NextResponse.json({ user: payload.user });
  setAuthCookies(response, {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  });
  return response;
}
