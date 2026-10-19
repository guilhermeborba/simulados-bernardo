import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextResponse } from 'next/server';
import { backendFetch } from '../lib/backendFetch.server';
import { ApiError, ApiRequestError, cancelPendingSessionRequests, confirmQuizAnswer, getSimulationAttempt, quizMediaUrl, startAttempt } from '../lib/apiClient';
import { createAuthenticatedBackendClient } from '../lib/authenticatedBackendClient.server';
import { applyAuthenticatedFetchCookies } from '../lib/authenticatedFetchCookies.server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  AuthTokens,
} from '../lib/serverCookies';

type BackendResult = { status: number; body: unknown };
type BackendFetch = (path: string, init?: RequestInit) => Promise<BackendResult>;

const unauthorized: BackendResult = {
  status: 401,
  body: { message: 'Expired access token' },
};

const oldA = { accessToken: 'access-old-a', refreshToken: 'refresh-old-a' };
const oldB = { accessToken: 'access-old-b', refreshToken: 'refresh-old-b' };
const newA = { accessToken: 'access-new-a', refreshToken: 'refresh-new-a' };
const newB = { accessToken: 'access-new-b', refreshToken: 'refresh-new-b' };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function authorization(init?: RequestInit) {
  return new Headers(init?.headers).get('Authorization');
}

function refreshToken(init?: RequestInit) {
  return (JSON.parse(String(init?.body)) as { refreshToken: string }).refreshToken;
}

function authenticatedResult(init?: RequestInit): BackendResult {
  return { status: 200, body: { authorization: authorization(init) } };
}

function assertCookies(response: NextResponse, tokens: AuthTokens) {
  const access = response.cookies.get(ACCESS_TOKEN_COOKIE);
  const refresh = response.cookies.get(REFRESH_TOKEN_COOKIE);
  assert.equal(access?.value, tokens.accessToken);
  assert.equal(refresh?.value, tokens.refreshToken);
  assert.equal(access?.httpOnly, true);
  assert.equal(refresh?.httpOnly, true);
  assert.equal(access?.sameSite, 'lax');
  assert.equal(refresh?.sameSite, 'lax');
  assert.equal(access?.path, '/');
  assert.equal(refresh?.path, '/');
}

function assertCleared(response: NextResponse) {
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) {
    assert.equal(response.cookies.get(name)?.value, '');
    assert.equal(response.cookies.get(name)?.maxAge, 0);
  }
}

test('concurrent users receive only their own refreshed credentials, even in reverse completion order', { timeout: 5000 }, async () => {
  const refreshA = deferred<BackendResult>();
  const refreshB = deferred<BackendResult>();
  const startedA = deferred<void>();
  const startedB = deferred<void>();
  const refreshed: string[] = [];
  const fetchBackend: BackendFetch = async (path, init) => {
    if (path === '/auth/refresh') {
      const token = refreshToken(init);
      refreshed.push(token);
      if (token === oldA.refreshToken) {
        startedA.resolve();
        return refreshA.promise;
      }
      assert.equal(token, oldB.refreshToken);
      startedB.resolve();
      return refreshB.promise;
    }
    if ([`Bearer ${oldA.accessToken}`, `Bearer ${oldB.accessToken}`].includes(authorization(init) ?? '')) {
      return unauthorized;
    }
    return authenticatedResult(init);
  };
  const client = createAuthenticatedBackendClient(fetchBackend);
  const requestA = client.fetch('/auth/me', {}, oldA);
  const requestB = client.fetch('/auth/me', {}, oldB);
  await Promise.all([startedA.promise, startedB.promise]);

  refreshB.resolve({ status: 200, body: newB });
  const resultB = await requestB;
  refreshA.resolve({ status: 200, body: newA });
  const resultA = await requestA;

  assert.deepEqual(refreshed.sort(), [oldA.refreshToken, oldB.refreshToken].sort());
  assert.deepEqual(resultA.body, { authorization: `Bearer ${newA.accessToken}` });
  assert.deepEqual(resultB.body, { authorization: `Bearer ${newB.accessToken}` });
  const responseA = NextResponse.json(resultA.body);
  const responseB = NextResponse.json(resultB.body);
  applyAuthenticatedFetchCookies(responseA, resultA);
  applyAuthenticatedFetchCookies(responseB, resultB);
  assertCookies(responseA, newA);
  assertCookies(responseB, newB);
});

test('simultaneous requests from one session share one renewal', { timeout: 5000 }, async () => {
  const renewal = deferred<BackendResult>();
  const renewalStarted = deferred<void>();
  const bothInitialRequests = deferred<void>();
  let initialRequests = 0;
  let renewals = 0;
  const client = createAuthenticatedBackendClient(async (path, init) => {
    if (path === '/auth/refresh') {
      renewals += 1;
      renewalStarted.resolve();
      return renewal.promise;
    }
    if (authorization(init) === `Bearer ${oldA.accessToken}`) {
      initialRequests += 1;
      if (initialRequests === 2) bothInitialRequests.resolve();
      return unauthorized;
    }
    return authenticatedResult(init);
  });

  const one = client.fetch('/me/attempts', {}, oldA);
  const two = client.fetch('/me/pontuacao', {}, oldA);
  await Promise.all([renewalStarted.promise, bothInitialRequests.promise]);
  renewal.resolve({ status: 200, body: newA });
  const results = await Promise.all([one, two]);

  assert.equal(renewals, 1);
  for (const result of results) {
    assert.equal(result.status, 200);
    assert.deepEqual(result.refreshedTokens, newA);
  }
});

test('a late 401 carrying old cookies reuses the completed renewal', { timeout: 5000 }, async () => {
  const slowInitial = deferred<BackendResult>();
  const slowStarted = deferred<void>();
  let renewals = 0;
  const client = createAuthenticatedBackendClient(async (path, init) => {
    if (path === '/auth/refresh') {
      renewals += 1;
      return { status: 200, body: newA };
    }
    if (authorization(init) === `Bearer ${oldA.accessToken}`) {
      if (path === '/slow') {
        slowStarted.resolve();
        return slowInitial.promise;
      }
      return unauthorized;
    }
    return authenticatedResult(init);
  });

  const slow = client.fetch('/slow', {}, oldA);
  await slowStarted.promise;
  const fast = await client.fetch('/fast', {}, oldA);
  assert.equal(fast.status, 200);
  slowInitial.resolve(unauthorized);
  const late = await slow;

  assert.equal(renewals, 1);
  assert.equal(late.status, 200);
  assert.deepEqual(late.refreshedTokens, newA);
  assert.notEqual(late.shouldClearCookies, true);
  const response = NextResponse.json(late.body);
  applyAuthenticatedFetchCookies(response, late);
  assertCookies(response, newA);
});

test('temporary renewal failures preserve cookies and allow a subsequent retry', { timeout: 5000 }, async (context) => {
  const cases: Array<{ name: string; result?: BackendResult; throws?: boolean; status?: number }> = [
    { name: 'rate limit', result: { status: 429, body: { message: 'Rate limited' } } },
    { name: 'backend unavailable', result: { status: 503, body: { message: 'Unavailable' } } },
    { name: 'network failure', throws: true, status: 503 },
    { name: 'missing tokens in success body', result: { status: 200, body: { user: { id: 'a' } } }, status: 502 },
    { name: 'empty token in success body', result: { status: 200, body: { accessToken: '', refreshToken: newA.refreshToken } }, status: 502 },
  ];
  for (const scenario of cases) {
    await context.test(scenario.name, async () => {
      let renewals = 0;
      const client = createAuthenticatedBackendClient(async (path, init) => {
        if (path === '/auth/refresh') {
          renewals += 1;
          if (renewals === 1) {
            if (scenario.throws) throw new Error('Network unavailable');
            return scenario.result!;
          }
          return { status: 200, body: newA };
        }
        return authorization(init) === `Bearer ${oldA.accessToken}`
          ? unauthorized
          : authenticatedResult(init);
      });

      const failed = await client.fetch('/auth/me', {}, oldA);
      assert.notEqual(failed.status, 200);
      assert.notEqual(failed.status, 401);
      if (scenario.status) assert.equal(failed.status, scenario.status);
      assert.notEqual(failed.shouldClearCookies, true);
      const response = NextResponse.json(failed.body, { status: failed.status });
      applyAuthenticatedFetchCookies(response, failed);
      assert.equal(response.cookies.get(ACCESS_TOKEN_COOKIE), undefined);
      assert.equal(response.cookies.get(REFRESH_TOKEN_COOKIE), undefined);

      const recovered = await client.fetch('/auth/me', {}, oldA);
      assert.equal(recovered.status, 200);
      assert.deepEqual(recovered.refreshedTokens, newA);
      assert.equal(renewals, 2);
    });
  }
});

test('revoked credentials clear only their own session', { timeout: 5000 }, async (context) => {
  for (const status of [401, 403]) {
    await context.test(`refresh status ${status}`, async () => {
      const client = createAuthenticatedBackendClient(async (path, init) => {
        if (path === '/auth/refresh') {
          return refreshToken(init) === oldA.refreshToken
            ? { status, body: { message: 'Invalid refresh token' } }
            : { status: 200, body: newB };
        }
        return authorization(init) === `Bearer ${newB.accessToken}`
          ? authenticatedResult(init)
          : unauthorized;
      });

      const resultA = await client.fetch('/auth/me', {}, oldA);
      assert.equal(resultA.shouldClearCookies, true);
      const responseA = NextResponse.json(resultA.body);
      applyAuthenticatedFetchCookies(responseA, resultA);
      assertCleared(responseA);
      const resultB = await client.fetch('/auth/me', {}, oldB);
      assert.equal(resultB.status, 200);
      const responseB = NextResponse.json(resultB.body);
      applyAuthenticatedFetchCookies(responseB, resultB);
      assertCookies(responseB, newB);
    });
  }
});

test('logout while a renewal is pending prevents that response from restoring cookies', { timeout: 5000 }, async () => {
  const renewal = deferred<BackendResult>();
  const renewalStarted = deferred<void>();
  const logoutStarted = deferred<void>();
  const logoutBackend = deferred<BackendResult>();
  const client = createAuthenticatedBackendClient(async (path, init) => {
    if (path === '/auth/refresh') {
      renewalStarted.resolve();
      return renewal.promise;
    }
    if (path === '/auth/logout') {
      logoutStarted.resolve();
      return logoutBackend.promise;
    }
    return authorization(init) === `Bearer ${oldA.accessToken}`
      ? unauthorized
      : authenticatedResult(init);
  });

  const pending = client.fetch('/auth/me', {}, oldA);
  await renewalStarted.promise;
  const loggingOut = client.logout(oldA.refreshToken);
  renewal.resolve({ status: 200, body: newA });
  const result = await pending;
  const response = NextResponse.json(result.body, { status: result.status });
  applyAuthenticatedFetchCookies(response, result);
  assertCleared(response);
  await logoutStarted.promise;
  logoutBackend.resolve({ status: 200, body: { success: true } });
  assert.equal((await loggingOut).status, 200);
});

test('logout while the authenticated retry is pending prevents cookie restoration', { timeout: 5000 }, async () => {
  const retried = deferred<BackendResult>();
  const retryStarted = deferred<void>();
  const client = createAuthenticatedBackendClient(async (path, init) => {
    if (path === '/auth/refresh') return { status: 200, body: newA };
    if (path === '/auth/logout') return { status: 200, body: { success: true } };
    if (authorization(init) === `Bearer ${oldA.accessToken}`) return unauthorized;
    retryStarted.resolve();
    return retried.promise;
  });

  const pending = client.fetch('/auth/me', {}, oldA);
  await retryStarted.promise;
  await client.logout(oldA.refreshToken);
  retried.resolve(authenticatedResult({ headers: { Authorization: `Bearer ${newA.accessToken}` } }));
  const result = await pending;
  const response = NextResponse.json(result.body, { status: result.status });
  applyAuthenticatedFetchCookies(response, result);
  assertCleared(response);
});

test('cookie application rechecks logout even after fetch already returned', { timeout: 5000 }, async () => {
  let renewals = 0;
  const client = createAuthenticatedBackendClient(async (path, init) => {
    if (path === '/auth/refresh') {
      renewals += 1;
      return { status: 200, body: newA };
    }
    if (path === '/auth/logout') return { status: 200, body: { success: true } };
    return authorization(init) === `Bearer ${oldA.accessToken}`
      ? unauthorized
      : authenticatedResult(init);
  });

  const result = await client.fetch('/auth/me', {}, oldA);
  assert.equal(result.status, 200);
  await client.logout(oldA.refreshToken);
  const response = NextResponse.json(result.body);
  applyAuthenticatedFetchCookies(response, result);
  assertCleared(response);

  const staleRequest = await client.fetch('/auth/me', {}, oldA);
  assert.equal(staleRequest.shouldClearCookies, true);
  assert.equal(renewals, 1);
});

test('logout of refreshed credentials invalidates responses carrying the old cookie', { timeout: 5000 }, async () => {
  const client = createAuthenticatedBackendClient(async (path, init) => {
    if (path === '/auth/refresh') return { status: 200, body: newA };
    if (path === '/auth/logout') return { status: 200, body: { success: true } };
    return authorization(init) === `Bearer ${oldA.accessToken}`
      ? unauthorized
      : authenticatedResult(init);
  });

  const result = await client.fetch('/auth/me', {}, oldA);
  await client.logout(newA.refreshToken);
  const response = NextResponse.json(result.body);
  applyAuthenticatedFetchCookies(response, result);
  assertCleared(response);
});

test('a failed backend logout still invalidates local renewal state', { timeout: 5000 }, async () => {
  const client = createAuthenticatedBackendClient(async (path, init) => {
    if (path === '/auth/refresh') return { status: 200, body: newA };
    if (path === '/auth/logout') throw new Error('Network unavailable');
    return authorization(init) === `Bearer ${oldA.accessToken}`
      ? unauthorized
      : authenticatedResult(init);
  });

  const result = await client.fetch('/auth/me', {}, oldA);
  assert.equal((await client.logout(oldA.refreshToken)).status, 503);
  const response = NextResponse.json(result.body);
  applyAuthenticatedFetchCookies(response, result);
  assertCleared(response);
});

test('renewal retries the same POST payload and preserves headers with new authorization', { timeout: 5000 }, async () => {
  const requests: Array<{ path: string; init?: RequestInit }> = [];
  const client = createAuthenticatedBackendClient(async (path, init) => {
    requests.push({ path, init });
    if (path === '/auth/refresh') return { status: 200, body: newA };
    return authorization(init) === `Bearer ${oldA.accessToken}`
      ? unauthorized
      : authenticatedResult(init);
  });
  const body = JSON.stringify({ answer: { optionKey: 'B' } });
  const result = await client.fetch('/attempts/a/questions/q/answer', {
    method: 'POST',
    body,
    headers: new Headers({ 'Content-Type': 'application/json', 'X-Request-Id': 'request-a' }),
  }, oldA);

  assert.equal(result.status, 200);
  const answers = requests.filter(({ path }) => path !== '/auth/refresh');
  assert.equal(answers.length, 2);
  for (const request of answers) {
    assert.equal(request.init?.method, 'POST');
    assert.equal(request.init?.body, body);
    assert.equal(new Headers(request.init?.headers).get('X-Request-Id'), 'request-a');
    assert.equal(new Headers(request.init?.headers).get('Content-Type'), 'application/json');
  }
  assert.equal(authorization(answers[0].init), `Bearer ${oldA.accessToken}`);
  assert.equal(authorization(answers[1].init), `Bearer ${newA.accessToken}`);
});

test('completed renewal is reusable only during its configured grace period', { timeout: 5000 }, async () => {
  let now = 1000;
  let renewals = 0;
  const client = createAuthenticatedBackendClient(async (path, init) => {
    if (path === '/auth/refresh') {
      renewals += 1;
      return { status: 200, body: newA };
    }
    return authorization(init) === `Bearer ${oldA.accessToken}`
      ? unauthorized
      : authenticatedResult(init);
  }, { refreshCacheTtlMs: 100, now: () => now });

  assert.equal((await client.fetch('/auth/me', {}, oldA)).status, 200);
  now += 99;
  assert.equal((await client.fetch('/auth/me', {}, oldA)).status, 200);
  assert.equal(renewals, 1);
  now += 2;
  assert.equal((await client.fetch('/auth/me', {}, oldA)).status, 200);
  assert.equal(renewals, 2);
});

test('capacity does not evict an active renewal and expired entries admit another session', { timeout: 5000 }, async () => {
  let now = 1000;
  const firstRenewal = deferred<BackendResult>();
  const renewalStarted = deferred<void>();
  const renewals: string[] = [];
  const client = createAuthenticatedBackendClient(async (path, init) => {
    if (path === '/auth/refresh') {
      const token = refreshToken(init);
      renewals.push(token);
      if (token === oldA.refreshToken) {
        renewalStarted.resolve();
        return firstRenewal.promise;
      }
      return { status: 200, body: newB };
    }
    return [`Bearer ${newA.accessToken}`, `Bearer ${newB.accessToken}`].includes(authorization(init) ?? '')
      ? authenticatedResult(init)
      : unauthorized;
  }, { maxRefreshEntries: 1, refreshCacheTtlMs: 100, now: () => now });

  const a = client.fetch('/auth/me', {}, oldA);
  await renewalStarted.promise;
  const b = await client.fetch('/auth/me', {}, oldB);
  assert.equal(b.status, 503);
  assert.notEqual(b.shouldClearCookies, true);
  assert.deepEqual(renewals, [oldA.refreshToken]);
  firstRenewal.resolve({ status: 200, body: newA });
  assert.equal((await a).status, 200);

  now += 101;
  assert.equal((await client.fetch('/auth/me', {}, oldB)).status, 200);
  assert.deepEqual(renewals, [oldA.refreshToken, oldB.refreshToken]);
});

test('a request that does not receive 401 never renews or changes cookies', { timeout: 5000 }, async () => {
  let requests = 0;
  const client = createAuthenticatedBackendClient(async (path, init) => {
    requests += 1;
    assert.equal(path, '/me/attempts');
    return authenticatedResult(init);
  });
  const result = await client.fetch('/me/attempts', {}, oldA);
  assert.equal(result.status, 200);
  assert.equal(requests, 1);
  const response = NextResponse.json(result.body);
  applyAuthenticatedFetchCookies(response, result);
  assert.equal(response.cookies.get(ACCESS_TOKEN_COOKIE), undefined);
  assert.equal(response.cookies.get(REFRESH_TOKEN_COOKIE), undefined);
});

test('an expired access token without a refresh token clears the local session', { timeout: 5000 }, async () => {
  let requests = 0;
  const client = createAuthenticatedBackendClient(async (path) => {
    requests += 1;
    assert.notEqual(path, '/auth/refresh');
    return unauthorized;
  });
  const result = await client.fetch('/auth/me', {}, { accessToken: oldA.accessToken });
  assert.equal(result.status, 401);
  assert.equal(result.shouldClearCookies, true);
  assert.equal(requests, 1);
  const response = NextResponse.json(result.body);
  applyAuthenticatedFetchCookies(response, result);
  assertCleared(response);
});

test('the real HTTP adapter forwards authorization, content type and the POST body on both attempts', { timeout: 5000 }, async (context) => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const mockFetch = context.mock.method(globalThis, 'fetch', async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const url = String(input);
    calls.push({ url, init });
    const headers = new Headers(init?.headers);
    if (url.endsWith('/auth/refresh')) {
      assert.equal(headers.get('Content-Type'), 'application/json');
      assert.equal(refreshToken(init), oldA.refreshToken);
      return new Response(JSON.stringify(newA), { status: 200 });
    }
    if (headers.get('Authorization') === `Bearer ${oldA.accessToken}`) {
      return new Response(JSON.stringify(unauthorized.body), { status: 401 });
    }
    return new Response(JSON.stringify({ authorization: headers.get('Authorization') }), { status: 200 });
  });
  try {
    const client = createAuthenticatedBackendClient(backendFetch);
    const body = JSON.stringify({ answer: { selectedOption: 'B' } });
    const result = await client.fetch('/attempts/a/questions/q/answer', {
      method: 'POST',
      body,
      headers: new Headers({ 'X-Request-Id': 'request-adapter' }),
    }, oldA);

    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { authorization: `Bearer ${newA.accessToken}` });
    const attempts = calls.filter(({ url }) => !url.endsWith('/auth/refresh'));
    assert.equal(attempts.length, 2);
    for (const attempt of attempts) {
      const headers = new Headers(attempt.init?.headers);
      assert.equal(headers.get('Content-Type'), 'application/json');
      assert.equal(headers.get('X-Request-Id'), 'request-adapter');
      assert.equal(attempt.init?.body, body);
      assert.equal(attempt.init?.method, 'POST');
      assert.equal(attempt.init?.cache, 'no-store');
    }
    assert.equal(authorization(attempts[0].init), `Bearer ${oldA.accessToken}`);
    assert.equal(authorization(attempts[1].init), `Bearer ${newA.accessToken}`);
  } finally {
    mockFetch.mock.restore();
  }
});

test('a request already in flight retains its renewal result even when its 401 arrives after the grace period', { timeout: 5000 }, async () => {
  let now = 1000;
  let renewals = 0;
  const slowInitial = deferred<BackendResult>();
  const slowStarted = deferred<void>();
  const client = createAuthenticatedBackendClient(async (path, init) => {
    if (path === '/auth/refresh') {
      renewals += 1;
      return { status: 200, body: newA };
    }
    if (authorization(init) === `Bearer ${oldA.accessToken}`) {
      if (path === '/slow') {
        slowStarted.resolve();
        return slowInitial.promise;
      }
      return unauthorized;
    }
    return authenticatedResult(init);
  }, { refreshCacheTtlMs: 100, now: () => now });

  const slow = client.fetch('/slow', {}, oldA);
  await slowStarted.promise;
  assert.equal((await client.fetch('/fast', {}, oldA)).status, 200);
  now += 101;
  slowInitial.resolve(unauthorized);
  const late = await slow;

  assert.equal(late.status, 200);
  assert.deepEqual(late.refreshedTokens, newA);
  assert.notEqual(late.shouldClearCookies, true);
  assert.equal(renewals, 1);
});

test('credentials rotated successfully are persisted even if the authenticated retry fails', { timeout: 5000 }, async () => {
  for (const failure of ['network', 'backend'] as const) {
    let renewals = 0;
    const client = createAuthenticatedBackendClient(async (path, init) => {
      if (path === '/auth/refresh') {
        renewals += 1;
        return { status: 200, body: newA };
      }
      if (authorization(init) === `Bearer ${oldA.accessToken}`) return unauthorized;
      assert.equal(authorization(init), `Bearer ${newA.accessToken}`);
      if (failure === 'network') throw new Error('Temporary network failure');
      return { status: 500, body: { message: 'Temporary backend failure' } };
    });
    const result = await client.fetch('/me/attempts', {}, oldA);
    assert.equal(result.status, failure === 'network' ? 503 : 500);
    assert.equal(renewals, 1);
    assert.notEqual(result.shouldClearCookies, true);
    const response = NextResponse.json(result.body, { status: result.status });
    applyAuthenticatedFetchCookies(response, result);
    assertCookies(response, newA);
  }
});

test('binary media retries through the same session coordinator and forwards only the media response headers', { timeout: 5000 }, async (context) => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const media = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69]);
  const path = '/attempts/attempt-1/questions/question-1/media/audio';
  const mockFetch = context.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/auth/refresh')) return new Response(JSON.stringify(newA), { status: 200 });
    if (authorization(init) === `Bearer ${oldA.accessToken}`) return new Response(JSON.stringify(unauthorized.body), { status: 401 });
    return new Response(media, {
      status: 206, headers: {
        'Content-Type': 'audio/wav', 'Content-Length': '12', 'Content-Range': 'bytes 0-11/128',
        'Accept-Ranges': 'bytes', 'Set-Cookie': 'untrusted=forbidden', 'Location': 'https://example.invalid',
      },
    });
  });
  try {
    const client = createAuthenticatedBackendClient(backendFetch);
    const result = await client.fetch(path, { headers: { Range: 'bytes=0-11' } }, oldA);
    assert.equal(result.status, 206);
    assert.deepEqual(result.binary, media);
    assert.equal(result.body, null);
    assert.deepEqual(result.refreshedTokens, newA);
    assert.deepEqual(result.mediaHeaders, {
      'Content-Type': 'audio/wav', 'Content-Length': '12', 'Content-Range': 'bytes 0-11/128', 'Accept-Ranges': 'bytes',
    });
    const attempts = calls.filter(({ url }) => !url.endsWith('/auth/refresh'));
    assert.equal(attempts.length, 2);
    assert.ok(attempts.every(({ init }) => new Headers(init?.headers).get('Range') === 'bytes=0-11'));
    assert.equal(authorization(attempts[0].init), `Bearer ${oldA.accessToken}`);
    assert.equal(authorization(attempts[1].init), `Bearer ${newA.accessToken}`);
  } finally { mockFetch.mock.restore(); }
});

test('media errors remain JSON and preserve the controlled unsatisfied range header', { timeout: 5000 }, async (context) => {
  const mockFetch = context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ message: 'Range not satisfiable' }), {
    status: 416, headers: { 'Content-Type': 'application/json', 'Content-Range': 'bytes */128', 'Set-Cookie': 'not-forwarded=1' },
  }));
  try {
    const result = await backendFetch('/attempts/a/questions/q/media/audio');
    assert.deepEqual(result, { status: 416, body: { message: 'Range not satisfiable' }, mediaHeaders: { 'Content-Range': 'bytes */128' } });
  } finally { mockFetch.mock.restore(); }
});

test('unexpected media types and inconsistent byte lengths produce a safe gateway error', { timeout: 5000 }, async (context) => {
  for (const headers of [
    { 'Content-Type': 'text/html', 'Content-Length': '3' },
    { 'Content-Type': 'image/svg+xml', 'Content-Length': '8' },
    { 'Content-Type': 'image/svg+xml', 'Content-Length': '99999999' },
  ]) {
    const mockFetch = context.mock.method(globalThis, 'fetch', async () => new Response('svg', { status: 200, headers }));
    try {
      const result = await backendFetch('/attempts/a/questions/q/media/image');
      assert.equal(result.status, 502);
      assert.equal(result.binary, undefined);
      assert.deepEqual(result.body, { message: 'Mídia temporariamente indisponível.' });
    } finally { mockFetch.mock.restore(); }
  }
});


test('quizMediaUrl accepts only attempt-owned relative media paths', () => {
  assert.equal(quizMediaUrl('/attempts/attempt-1/questions/question-1/media/image'), '/api/backend/attempts/attempt-1/questions/question-1/media/image');
  for (const path of ['https://example.test/image.svg', '//example.test/x', '/attempts/a/questions/q/media/image?token=secret', '/attempts/a/questions/q/media/image#fragment', '/attempts/../questions/q/media/image', '/attempts/a/questions/q/media/document', '/attempts/a/questions/q/media/%69mage', '/api/backend/attempts/a/questions/q/media/image']) {
    assert.equal(quizMediaUrl(path), null);
  }
});

test('client errors retain the HTTP status needed to recover a confirmed quiz answer', async (context) => {
  const mockFetch = context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ message: 'Already confirmed' }), { status: 409 }));
  try {
    await assert.rejects(confirmQuizAnswer('a', 'q', 'B'), (error: unknown) => error instanceof ApiError && error.status === 409 && error.message === 'Already confirmed');
  } finally { mockFetch.mock.restore(); }
});


test('simulation and quiz errors share the status contract during mixed journeys', async (context) => {
  const mocked = context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ message: 'Temporary limit' }), { status: 429 }));
  try {
    await assert.rejects(startAttempt('s'), (error: unknown) => error instanceof ApiError && error instanceof ApiRequestError && error.status === 429);
  } finally { mocked.mock.restore(); }
});

test('changing session aborts a pending simulation read and prevents a late response from escaping', async (context) => {
  const response = deferred<Response>();
  let signal: AbortSignal | undefined;
  const mocked = context.mock.method(globalThis, 'fetch', async (_input: unknown, init?: RequestInit) => {
    signal = init?.signal ?? undefined;
    // Even transports that deliver a response after cancellation cannot expose it.
    return response.promise;
  });
  try {
    const pending = getSimulationAttempt('previous-user-attempt');
    assert.equal(signal?.aborted, false);
    cancelPendingSessionRequests();
    assert.equal(signal?.aborted, true);
    response.resolve(new Response(JSON.stringify({ id: 'previous-user-attempt', simulationId: 's', status: 'IN_PROGRESS' })));
    await assert.rejects(pending, (error: unknown) => error instanceof DOMException && error.name === 'AbortError');
  } finally { mocked.mock.restore(); cancelPendingSessionRequests(); }
});
