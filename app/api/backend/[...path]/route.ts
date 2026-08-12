import { NextRequest, NextResponse } from 'next/server';
import {
  authenticatedBackendFetch,
  applyAuthenticatedFetchCookies,
} from '@/lib/authenticatedBackendFetch.server';

async function handle(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = `/${params.path.join('/')}`;
  const search = request.nextUrl.search;
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.text() : undefined;

  const result = await authenticatedBackendFetch(`${path}${search}`, {
    method: request.method,
    body,
  });

  const response = NextResponse.json(result.body, { status: result.status });
  applyAuthenticatedFetchCookies(response, result);
  return response;
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
