import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendFetch.server';
import { authSuccessResponse } from '@/lib/authResponse.server';

export async function POST(request: NextRequest) {
  const credentials = await request.json();

  const { status, body } = await backendFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (status !== 200) {
    return NextResponse.json(body, { status });
  }

  return authSuccessResponse(
    body as { user: unknown; accessToken: string; refreshToken: string },
  );
}
