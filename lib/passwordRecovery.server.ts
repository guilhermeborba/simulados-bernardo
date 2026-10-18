import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from './backendFetch.server';
import { hasSameOrigin } from './requestOrigin.server';

export async function passwordRecoveryResponse(request: NextRequest, path: '/auth/forgot-password' | '/auth/reset-password') {
  const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
  if (!hasSameOrigin(request)) return NextResponse.json({ message: 'Forbidden' }, { status: 403, headers });
  let payload: unknown;
  try {
    const text = await request.text();
    if (text.length > 4096) throw new Error('Invalid request');
    payload = JSON.parse(text);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid request');
  } catch {
    return NextResponse.json({ message: 'Dados de recuperação inválidos.' }, { status: 400, headers });
  }
  try {
    const result = await backendFetch(path, { method: 'POST', body: JSON.stringify(payload) });
    if (result.status >= 500) throw new Error('Recovery unavailable');
    return NextResponse.json(result.body, { status: result.status, headers });
  } catch {
    // Recovery is public: it never rotates, clears, or sets an authenticated session.
    return NextResponse.json({ message: 'Recuperação de senha temporariamente indisponível. Tente novamente.' }, { status: 503, headers });
  }
}
