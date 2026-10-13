import { NextRequest, NextResponse } from 'next/server';
import {
  authenticatedBackendFetch,
  applyAuthenticatedFetchCookies,
} from '@/lib/authenticatedBackendFetch.server';
import { isQuizMediaPath } from '@/lib/quizMedia';
import { hasSameOrigin } from '@/lib/requestOrigin.server';

const ALLOWED_PREFIXES = ['disciplines', 'simulations', 'attempts', 'me'];

async function handle(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = `/${params.path.join('/')}`;
  const quizRoute = (request.method === 'GET' && path === '/quizzes/available')
    || (request.method === 'POST' && /^\/quizzes\/[A-Za-z0-9_-]+\/attempts$/.test(path));
  const oversightRoute = request.method === 'GET' && (/^\/students\/[A-Za-z0-9_-]+\/learning-progress$/.test(path) || /^\/reports\/student\/[A-Za-z0-9_-]+\/(summary|by-discipline)$/.test(path));
  if ((path === '/me/oversight-students' && request.method !== 'GET') || (!ALLOWED_PREFIXES.includes(params.path[0]) && !quizRoute && !oversightRoute)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if ((request.method === 'PATCH' && path === '/me/avatar') || (request.method === 'POST' && path === '/me/review-attempts')) {
    if (!hasSameOrigin(request)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
  }

  const media = isQuizMediaPath(path);
  if (params.path.includes('media') && (!media || request.method !== 'GET' || request.nextUrl.search)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  const search = request.nextUrl.search;
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.text() : undefined;

  const result = await authenticatedBackendFetch(`${path}${search}`, {
    method: request.method,
    body,
    ...(media && request.headers.has('range') ? { headers: { Range: request.headers.get('range')! } } : {}),
  });

  const response = result.binary
    ? new NextResponse(new Uint8Array(result.binary).buffer, { status: result.status, headers: result.mediaHeaders })
    : NextResponse.json(result.body, { status: result.status, headers: media ? result.mediaHeaders : undefined });
  if (media) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Content-Security-Policy', "default-src 'none'; sandbox");
    if (result.binary) response.headers.set('Content-Disposition', `inline; filename="quiz-${path.endsWith('/image') ? 'image.svg' : 'audio.wav'}"`);
  }
  if (oversightRoute || path === '/me/oversight-students') response.headers.set('Cache-Control', 'private, no-store');
  applyAuthenticatedFetchCookies(response, result);
  return response;
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
