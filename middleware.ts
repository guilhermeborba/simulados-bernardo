import { NextRequest, NextResponse } from 'next/server';
import { REFRESH_TOKEN_COOKIE } from '@/lib/serverCookies';

// Início and the catalog only make sense signed in: without a session they go straight to Entrar / Criar conta.
const PROTECTED_PATHS = ['/'];
const PROTECTED_PREFIXES = ['/simulados', '/simulado/', '/historico', '/quiz/', '/quizzes', '/colecao', '/progresso', '/acompanhamento'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.includes(pathname) || PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (hasRefreshToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('returnTo', `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/', '/simulados/:path*', '/simulado/:path*', '/historico', '/quiz/:path*', '/quizzes/:path*', '/colecao/:path*', '/progresso/:path*', '/acompanhamento/:path*'],
};
