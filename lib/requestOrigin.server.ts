import type { NextRequest } from 'next/server';

/** Match the public origin received by Next, including a trusted proxy protocol. */
export function hasSameOrigin(request: NextRequest): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const forwardedProtocol = request.headers.get('x-forwarded-proto');
  const protocol = forwardedProtocol === 'https' || forwardedProtocol === 'http' ? `${forwardedProtocol}:` : request.nextUrl.protocol;
  const host = request.headers.get('host') ?? request.nextUrl.host;
  try { return new URL(origin).origin === new URL(`${protocol}//${host}`).origin; }
  catch { return false; }
}
