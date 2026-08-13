import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendFetch.server';
import { authSuccessResponse } from '@/lib/authResponse.server';

export async function POST(request: NextRequest) {
  const payload = await request.json();

  const { status, body } = await backendFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (status !== 201) {
    return NextResponse.json(body, { status });
  }

  return authSuccessResponse(
    body as { user: unknown; accessToken: string; refreshToken: string },
  );
}
