import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendFetch.server';

export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => null);
  if (typeof input?.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return NextResponse.json({ message: 'Digite um e-mail válido.' }, { status: 400 });
  }
  try {
    const { body, status } = await backendFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: input.email.trim() }),
      signal: AbortSignal.timeout(20_000),
    });
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'Recuperação de senha temporariamente indisponível. Tente novamente mais tarde.' }, { status: 503 });
  }
}
