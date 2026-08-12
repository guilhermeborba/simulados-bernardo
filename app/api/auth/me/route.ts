import { NextResponse } from 'next/server';
import {
  authenticatedBackendFetch,
  applyAuthenticatedFetchCookies,
} from '@/lib/authenticatedBackendFetch.server';

export async function GET() {
  const result = await authenticatedBackendFetch('/auth/me');
  const response = NextResponse.json(result.body, { status: result.status });
  applyAuthenticatedFetchCookies(response, result);
  return response;
}
