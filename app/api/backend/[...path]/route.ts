import { NextRequest, NextResponse } from 'next/server';
import {
  authenticatedBackendFetch,
  applyAuthenticatedFetchCookies,
} from '@/lib/authenticatedBackendFetch.server';

const ALLOWED_PREFIXES = ['disciplines', 'simulations', 'attempts', 'me'];

async function handle(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  if (!ALLOWED_PREFIXES.includes(params.path[0])) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

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
