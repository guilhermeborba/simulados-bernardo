const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3333';

export interface BackendResponse {
  status: number;
  body: unknown;
}

export async function backendFetch(
  path: string,
  init: RequestInit = {},
): Promise<BackendResponse> {
  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return { status: response.status, body };
}
