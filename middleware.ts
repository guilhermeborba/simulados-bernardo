import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/serverCookies';

const PROTECTED_PREFIXES = ['/simulado/', '/historico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasAccessToken = request.cookies.has(ACCESS_TOKEN_COOKIE);

  if (hasAccessToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('returnTo', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/simulado/:path*', '/historico'],
};
