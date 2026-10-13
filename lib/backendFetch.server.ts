import { isQuizMediaPath } from './quizMedia';

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3333';

export interface BackendResponse {
  status: number;
  body: unknown;
  binary?: Uint8Array;
  mediaHeaders?: Record<string, string>;
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

  if (isQuizMediaPath(path)) {
    const mediaHeaders: Record<string, string> = {};
    const contentRange = response.headers.get('content-range');
    if (response.status === 416 && contentRange && /^bytes \*\/\d+$/.test(contentRange)) {
      const total = Number(contentRange.split('/')[1]);
      if (Number.isSafeInteger(total) && total > 0) mediaHeaders['Content-Range'] = contentRange;
    }
    if (response.status === 200 || response.status === 206) {
      const expectedType = path.endsWith('/image') ? 'image/svg+xml' : 'audio/wav';
      const contentType = response.headers.get('content-type')?.split(';')[0].trim();
      const length = Number(response.headers.get('content-length'));
      if (contentType !== expectedType || !Number.isSafeInteger(length) || length <= 0 || length > 8 * 1024 * 1024) {
        await response.body?.cancel();
        return { status: 502, body: { message: 'Mídia temporariamente indisponível.' } };
      }
      if (response.status === 206) {
        const range = contentRange?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
        const [start, end, total] = range ? range.slice(1).map(Number) : [];
        if (!range || ![start, end, total].every(Number.isSafeInteger) || start > end || end >= total || end - start + 1 !== length) {
          await response.body?.cancel();
          return { status: 502, body: { message: 'Mídia temporariamente indisponível.' } };
        }
        mediaHeaders['Content-Range'] = contentRange!;
      }
      const binary = await readMediaBytes(response, length);
      if (!binary) {
        return { status: 502, body: { message: 'Mídia temporariamente indisponível.' } };
      }
      return {
        status: response.status, body: null, binary,
        mediaHeaders: {
          ...mediaHeaders, 'Content-Type': expectedType,
          'Content-Length': String(binary.byteLength), 'Accept-Ranges': 'bytes',
        },
      };
    }
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    return { status: response.status, body, mediaHeaders };
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return { status: response.status, body };
}


async function readMediaBytes(response: Response, length: number): Promise<Uint8Array | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const bytes = new Uint8Array(length);
  let position = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) return position === length ? bytes : null;
    if (position + value.byteLength > length) {
      await reader.cancel();
      return null;
    }
    bytes.set(value, position);
    position += value.byteLength;
  }
}
