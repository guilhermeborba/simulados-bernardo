import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendFetch.server';
import { clearAuthCookies } from '@/lib/serverCookies';

export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => null);
  if (typeof input?.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(input.token)) {
    return NextResponse.json({ message: 'Link inválido. Solicite um novo link de recuperação.' }, { status: 400 });
  }
  if (typeof input?.password !== 'string' || input.password.length < 8 || Buffer.byteLength(input.password, 'utf8') > 72) {
    return NextResponse.json({ message: 'Use uma senha com pelo menos 8 caracteres e até 72 bytes.' }, { status: 400 });
  }
  try {
    const { body, status } = await backendFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: input.token, password: input.password }),
      signal: AbortSignal.timeout(20_000),
    });
    const response = NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
    if (status === 200) clearAuthCookies(response);
    return response;
  } catch {
    return NextResponse.json({ message: 'Não foi possível alterar a senha agora. Tente novamente mais tarde.' }, { status: 503 });
  }
}
