const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3333';

export interface BackendResponse {
  status: number;
  body: unknown;
}

export async function backendFetch(
  path: string,
  init: RequestInit = {},
): Promise<BackendResponse> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return { status: response.status, body };
}
