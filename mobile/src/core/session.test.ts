import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApiError,
  ApiNetworkError,
  ApiResponseError,
  CredentialStorageError,
  MobileSessionClient,
  RequestCancelledError,
  SecureCredentialStore,
  SessionChangedError,
  SessionRequiredError,
} from "./session";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const secret = (value: string) => `${value}-${"x".repeat(24)}`;
const pair = (label: string) => ({
  accessToken: secret(`access-${label}`),
  refreshToken: secret(`refresh-${label}`),
  user: {
    id: label,
    name: `Aluno ${label}`,
    email: `${label}@example.test`,
    role: "STUDENT",
    status: "ACTIVE",
  },
});
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
class MemoryStore implements SecureCredentialStore {
  value: string | null = null;
  writes: string[] = [];
  clears = 0;
  async read() {
    return this.value;
  }
  async write(value: string) {
    this.writes.push(value);
    this.value = value;
  }
  async clear() {
    this.clears += 1;
    this.value = null;
  }
}
type Handler = (
  path: string,
  init: RequestInit,
) => Promise<Response> | Response;
function transport(handler: Handler): typeof fetch {
  return ((input: string | URL | Request, init?: RequestInit) =>
    handler(
      new URL(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      ).pathname,
      init ?? {},
    )) as typeof fetch;
}
function client(handler: Handler, store = new MemoryStore()) {
  return {
    store,
    client: new MobileSessionClient({
      baseUrl: "https://api.example.test",
      store,
      fetch: transport(handler),
    }),
  };
}
function auth(init: RequestInit) {
  return new Headers(init.headers).get("authorization");
}
function body(init: RequestInit) {
  return JSON.parse(String(init.body));
}

void test("access stays in memory; restore rotates only the secure refresh and publishes no secrets", async () => {
  const store = new MemoryStore();
  const first = client(
    (path) =>
      path === "/auth/login" ? json(pair("one")) : json({ success: true }),
    store,
  ).client;
  let notifications = 0;
  const unsubscribe = first.subscribe(() => {
    notifications += 1;
  });
  await first.login({ email: "one@example.test", password: "test-password" });
  assert.equal(store.value, pair("one").refreshToken);
  assert.equal(first.getSnapshot().status, "authenticated");
  assert.equal("accessToken" in first.getSnapshot(), false);
  assert.equal(JSON.stringify(first.getSnapshot()).includes("refresh"), false);
  assert.ok(Object.isFrozen(first.getSnapshot()));
  assert.ok(Object.isFrozen(first.getSnapshot().user));
  unsubscribe();
  const before = notifications;
  const second = client((path, init) => {
    assert.equal(path, "/auth/refresh");
    assert.deepEqual(body(init), { refreshToken: pair("one").refreshToken });
    assert.equal(auth(init), null);
    return json(pair("two"));
  }, store).client;
  await second.restore();
  assert.equal(store.value, pair("two").refreshToken);
  assert.equal(second.getSnapshot().user?.id, "two");
  assert.equal(notifications, before);
});

void test("empty secure storage restores signed-out without a network call", async () => {
  const { client: session } = client(() => {
    throw new Error("must not call");
  });
  assert.equal((await session.restore()).status, "signed-out");
  await assert.rejects(session.request("/auth/me"), SessionRequiredError);
});

void test("concurrent bootstrap shares one read and one refresh", async () => {
  const entered = deferred<void>();
  const gate = deferred<Response>();
  const store = new MemoryStore();
  store.value = pair("old").refreshToken;
  let calls = 0;
  const { client: session } = client(() => {
    calls += 1;
    entered.resolve();
    return gate.promise;
  }, store);
  const first = session.restore();
  const second = session.restore();
  assert.equal(first, second);
  await entered.promise;
  gate.resolve(json(pair("new")));
  await Promise.all([first, second]);
  assert.equal(calls, 1);
});

void test("concurrent 401 responses share a refresh and each explicit 401 gets one retry", async () => {
  const refreshEntered = deferred<void>();
  const gate = deferred<Response>();
  let refreshes = 0;
  let oldCalls = 0;
  let newCalls = 0;
  const { client: session } = client((path, init) => {
    if (path === "/auth/login") return json(pair("old"));
    if (path === "/auth/refresh") {
      refreshes += 1;
      refreshEntered.resolve();
      return gate.promise;
    }
    if (auth(init) === `Bearer ${pair("old").accessToken}`) {
      oldCalls += 1;
      return json({}, 401);
    }
    newCalls += 1;
    return json({ ok: true });
  });
  await session.login({ email: "old@example.test", password: "test-password" });
  const requests = Array.from({ length: 8 }, () =>
    session.request("/students/me"),
  );
  await refreshEntered.promise;
  gate.resolve(json(pair("new")));
  assert.deepEqual(
    await Promise.all(requests),
    Array.from({ length: 8 }, () => ({ ok: true })),
  );
  assert.equal(refreshes, 1);
  assert.equal(oldCalls, 8);
  assert.equal(newCalls, 8);
});

void test("a late 401 for an old access reuses the new access without another rotation", async () => {
  const lateEntered = deferred<void>();
  const late = deferred<Response>();
  let refreshes = 0;
  const { client: session } = client((path, init) => {
    if (path === "/auth/login") return json(pair("old"));
    if (path === "/auth/refresh") {
      refreshes += 1;
      return json(pair("new"));
    }
    if (
      path === "/late" &&
      auth(init) === `Bearer ${pair("old").accessToken}`
    ) {
      lateEntered.resolve();
      return late.promise;
    }
    return auth(init) === `Bearer ${pair("old").accessToken}`
      ? json({}, 401)
      : json({ ok: true });
  });
  await session.login({ email: "old@example.test", password: "test-password" });
  const delayed = session.request("/late");
  await lateEntered.promise;
  await session.request("/early");
  late.resolve(json({}, 401));
  assert.deepEqual(await delayed, { ok: true });
  assert.equal(refreshes, 1);
});

void test("403 and a committed mutation whose response was lost are not automatically retried", async () => {
  let mutationCalls = 0;
  let refreshes = 0;
  const { client: session } = client((path) => {
    if (path === "/auth/login") return json(pair("one"));
    if (path === "/auth/refresh") {
      refreshes += 1;
      return json(pair("two"));
    }
    if (path === "/forbidden") return json({}, 403);
    mutationCalls += 1;
    throw new Error("response lost after commit");
  });
  await session.login({ email: "one@example.test", password: "test-password" });
  await assert.rejects(
    session.request("/forbidden"),
    (error: unknown) => error instanceof ApiError && error.status === 403,
  );
  await assert.rejects(
    session.request("/attempts/a/answers", { method: "POST", body: "{}" }),
    ApiNetworkError,
  );
  assert.equal(mutationCalls, 1);
  assert.equal(refreshes, 0);
  assert.equal(session.getSnapshot().status, "authenticated");
});

void test("a mutation with explicit 401 is repeated once, with the same payload", async () => {
  const payloads: string[] = [];
  let refreshes = 0;
  const { client: session } = client((path, init) => {
    if (path === "/auth/login") return json(pair("old"));
    if (path === "/auth/refresh") {
      refreshes += 1;
      return json(pair("new"));
    }
    payloads.push(String(init.body));
    return payloads.length === 1 ? json({}, 401) : json({ saved: true });
  });
  await session.login({ email: "one@example.test", password: "test-password" });
  assert.deepEqual(
    await session.request("/attempts/a/answers", {
      method: "POST",
      body: '{"choice":"A"}',
    }),
    { saved: true },
  );
  assert.deepEqual(payloads, ['{"choice":"A"}', '{"choice":"A"}']);
  assert.equal(refreshes, 1);
});

for (const failure of ["network", "server"] as const)
  void test(`refresh ${failure} failure preserves the secure credential for explicit retry`, async () => {
    const store = new MemoryStore();
    store.value = pair("old").refreshToken;
    let calls = 0;
    const { client: session } = client(() => {
      calls += 1;
      if (calls === 1) {
        if (failure === "network") throw new Error("offline");
        return json({}, 503);
      }
      return json(pair("new"));
    }, store);
    await assert.rejects(
      session.restore(),
      failure === "network" ? ApiNetworkError : ApiError,
    );
    assert.equal(session.getSnapshot().status, "retry-required");
    assert.equal(store.value, pair("old").refreshToken);
    await session.restore();
    assert.equal(session.getSnapshot().status, "authenticated");
    assert.equal(store.value, pair("new").refreshToken);
  });

void test("lost refresh success cannot be recovered: later rejection clears old credential and requires login", async () => {
  const store = new MemoryStore();
  store.value = pair("old").refreshToken;
  let committed = false;
  const { client: session } = client((path) => {
    if (path === "/auth/logout") return json({ success: true });
    if (!committed) {
      committed = true;
      throw new Error("success lost");
    }
    return json({}, 401);
  }, store);
  await assert.rejects(session.restore(), ApiNetworkError);
  assert.equal(store.value, pair("old").refreshToken);
  await assert.rejects(
    session.restore(),
    (error: unknown) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(store.value, null);
  assert.equal(session.getSnapshot().status, "signed-out");
});

void test("a second 401 after refresh stops retrying and removes the rejected session", async () => {
  let protectedCalls = 0;
  let refreshes = 0;
  const { client: session, store } = client((path) => {
    if (path === "/auth/login") return json(pair("one"));
    if (path === "/auth/refresh") {
      refreshes += 1;
      return json(pair("two"));
    }
    if (path === "/auth/logout") return json({ success: true });
    protectedCalls += 1;
    return json({}, 401);
  });
  await session.login({ email: "one@example.test", password: "test-password" });
  await assert.rejects(
    session.request("/auth/me"),
    (error: unknown) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(protectedCalls, 2);
  assert.equal(refreshes, 1);
  assert.equal(store.value, null);
});

void test("logout clears locally even when the server is unreachable", async () => {
  const { client: session, store } = client((path) =>
    path === "/auth/login"
      ? json(pair("one"))
      : Promise.reject(new Error("offline")),
  );
  await session.login({ email: "one@example.test", password: "test-password" });
  await session.logout();
  assert.equal(store.value, null);
  assert.equal(session.getSnapshot().user, null);
  assert.equal(session.getSnapshot().status, "signed-out");
});

void test("late login success after logout is revoked and cannot persist or reopen the session", async () => {
  const entered = deferred<void>();
  const gate = deferred<Response>();
  const revoked: string[] = [];
  const { client: session, store } = client((path, init) => {
    if (path === "/auth/login") {
      entered.resolve();
      return gate.promise;
    }
    revoked.push(body(init).refreshToken);
    return json({ success: true });
  });
  const pending = session.login({
    email: "old@example.test",
    password: "test-password",
  });
  const rejected = assert.rejects(pending, SessionChangedError);
  await entered.promise;
  await session.logout();
  gate.resolve(json(pair("old")));
  await rejected;
  assert.equal(store.value, null);
  assert.equal(store.writes.length, 0);
  assert.equal(session.getSnapshot().status, "signed-out");
  assert.deepEqual(revoked, [pair("old").refreshToken]);
});

void test("logout racing refresh revokes both the old chain and the observed late successor", async () => {
  const entered = deferred<void>();
  const gate = deferred<Response>();
  const revoked: string[] = [];
  const { client: session, store } = client((path, init) => {
    if (path === "/auth/login") return json(pair("old"));
    if (path === "/auth/refresh") {
      entered.resolve();
      return gate.promise;
    }
    if (path === "/auth/logout") {
      revoked.push(body(init).refreshToken);
      return json({ success: true });
    }
    return json({}, 401);
  });
  await session.login({ email: "old@example.test", password: "test-password" });
  const pending = session.request("/auth/me");
  const rejected = assert.rejects(pending, SessionChangedError);
  await entered.promise;
  await session.logout();
  gate.resolve(json(pair("new")));
  await rejected;
  assert.equal(store.value, null);
  assert.deepEqual(
    revoked.sort(),
    [pair("old").refreshToken, pair("new").refreshToken].sort(),
  );
});

void test("a secure write already in flight completes before the ordered logout clear", async () => {
  const entered = deferred<void>();
  const gate = deferred<void>();
  const store = new MemoryStore();
  store.write = async (value: string) => {
    entered.resolve();
    await gate.promise;
    store.value = value;
  };
  const { client: session } = client(
    (path) =>
      path === "/auth/login" ? json(pair("old")) : json({ success: true }),
    store,
  );
  const pending = session.login({
    email: "old@example.test",
    password: "test-password",
  });
  const rejected = assert.rejects(pending, SessionChangedError);
  await entered.promise;
  const leaving = session.logout();
  assert.equal(session.getSnapshot().status, "signed-out");
  gate.resolve();
  await Promise.all([leaving, rejected]);
  assert.equal(store.value, null);
});

void test("an older login response cannot overwrite a newer account or its secure refresh", async () => {
  const entered = deferred<void>();
  const gate = deferred<Response>();
  const revoked: string[] = [];
  const { client: session, store } = client((path, init) => {
    if (path === "/auth/logout") {
      revoked.push(body(init).refreshToken);
      return json({ success: true });
    }
    if (body(init).email.startsWith("old")) {
      entered.resolve();
      return gate.promise;
    }
    return json(pair("new"));
  });
  const old = session.login({
    email: "old@example.test",
    password: "test-password",
  });
  const rejected = assert.rejects(old, SessionChangedError);
  await entered.promise;
  await session.login({ email: "new@example.test", password: "test-password" });
  gate.resolve(json(pair("old")));
  await rejected;
  assert.equal(session.getSnapshot().user?.id, "new");
  assert.equal(store.value, pair("new").refreshToken);
  assert.deepEqual(revoked, [pair("old").refreshToken]);
});

void test("failure to persist a new credential revokes it and never publishes authenticated", async () => {
  const store = new MemoryStore();
  store.write = async () => {
    throw new Error("keystore unavailable");
  };
  const revoked: string[] = [];
  const states: string[] = [];
  const { client: session } = client((path, init) => {
    if (path === "/auth/login") return json(pair("one"));
    revoked.push(body(init).refreshToken);
    return json({ success: true });
  }, store);
  session.subscribe(() => states.push(session.getSnapshot().status));
  await assert.rejects(
    session.login({ email: "one@example.test", password: "test-password" }),
    CredentialStorageError,
  );
  assert.equal(store.value, null);
  assert.equal(session.getSnapshot().user, null);
  assert.equal(states.includes("authenticated"), false);
  assert.ok(revoked.includes(pair("one").refreshToken));
});

void test("a clear failure exposes storage-error while access is immediately removed", async () => {
  const store = new MemoryStore();
  const { client: session } = client(() => json(pair("one")), store);
  await session.login({ email: "one@example.test", password: "test-password" });
  store.clear = async () => {
    throw new Error("keystore unavailable");
  };
  await assert.rejects(session.logout(), CredentialStorageError);
  assert.equal(session.getSnapshot().status, "storage-error");
  assert.equal(session.getSnapshot().user, null);
  await assert.rejects(session.request("/auth/me"), SessionRequiredError);
});

void test("public recovery has no bearer/cookies and does not replace or log out the active account", async () => {
  const { client: session, store } = client((path, init) => {
    if (path === "/auth/login") return json(pair("one"));
    assert.equal(auth(init), null);
    assert.equal(new Headers(init.headers).get("cookie"), null);
    assert.equal(init.credentials, "omit");
    assert.equal(init.redirect, "error");
    return json({ success: true });
  });
  await session.login({ email: "one@example.test", password: "test-password" });
  const snapshot = session.getSnapshot();
  await session.publicRequest("/auth/reset-password", {
    method: "POST",
    body: "{}",
    headers: { authorization: "Bearer injected", cookie: "session=injected" },
  });
  assert.equal(session.getSnapshot(), snapshot);
  assert.equal(store.value, pair("one").refreshToken);
  await assert.rejects(
    session.publicRequest("/auth/login", { method: "POST", body: "{}" }),
    /Rota pública/,
  );
});

void test("base URL validation and relative-only paths prevent sending credentials to another origin", async () => {
  for (const baseUrl of [
    "http://api.example.test",
    "https://u:p@api.example.test",
    "https://api.example.test/path",
    "https://api.example.test/?x=1",
    "https://api.example.test/#x",
  ]) {
    assert.throws(
      () => new MobileSessionClient({ baseUrl, store: new MemoryStore() }),
    );
  }
  assert.doesNotThrow(
    () =>
      new MobileSessionClient({
        baseUrl: "http://192.168.1.20:3333",
        allowInsecureHttp: true,
        store: new MemoryStore(),
      }),
  );
  let calls = 0;
  const { client: session } = client(() => {
    calls += 1;
    return json(pair("one"));
  });
  await session.login({ email: "one@example.test", password: "test-password" });
  for (const path of [
    "https://evil.test/a",
    "//evil.test/a",
    "/\\evil.test/a",
    "/x#token=secret",
  ])
    await assert.rejects(session.request(path));
  assert.equal(calls, 1);
});

void test("redirects are rejected and a transport response from a different URL is refused", async () => {
  let variant = 0;
  const { client: session } = client((path) => {
    if (path === "/auth/login") return json(pair("one"));
    if (variant === 0)
      return new Response(null, {
        status: 302,
        headers: { location: "https://evil.test" },
      });
    const response = json({ secret: "should not return" });
    Object.defineProperty(response, "url", { value: "https://evil.test/data" });
    return response;
  });
  await session.login({ email: "one@example.test", password: "test-password" });
  await assert.rejects(session.request("/data"), ApiResponseError);
  variant = 1;
  await assert.rejects(session.request("/data"), ApiResponseError);
});

void test("a protected response arriving after account change never escapes to the caller", async () => {
  const entered = deferred<void>();
  const gate = deferred<Response>();
  const { client: session } = client((path, init) => {
    if (path === "/auth/logout") return json({ success: true });
    if (path === "/auth/login")
      return json(pair(body(init).email.startsWith("old") ? "old" : "new"));
    entered.resolve();
    return gate.promise;
  });
  await session.login({ email: "old@example.test", password: "test-password" });
  const pending = session.request("/old-student-data");
  const rejected = assert.rejects(pending, SessionChangedError);
  await entered.promise;
  await session.login({ email: "new@example.test", password: "test-password" });
  gate.resolve(json({ childName: "Old child" }));
  await rejected;
  assert.equal(session.getSnapshot().user?.id, "new");
});

void test("bounded authenticated media rejects MIME mismatch and streams over the byte budget", async () => {
  let variant = 0;
  const { client: session } = client((path) => {
    if (path === "/auth/login") return json(pair("one"));
    if (variant === 0)
      return new Response("<svg/>", {
        headers: { "content-type": "image/svg+xml; charset=utf-8" },
      });
    if (variant === 1)
      return new Response("bad", { headers: { "content-type": "text/html" } });
    return new Response(new Uint8Array(32), {
      headers: { "content-type": "image/svg+xml", "content-length": "2" },
    });
  });
  await session.login({ email: "one@example.test", password: "test-password" });
  const media = await session.requestBytes("/quizzes/q/media/m", {
    maxBytes: 10,
    contentTypes: ["image/svg+xml"],
  });
  assert.equal(new TextDecoder().decode(media.bytes), "<svg/>");
  assert.equal(media.contentType, "image/svg+xml");
  variant = 1;
  await assert.rejects(
    session.requestBytes("/media/m", {
      maxBytes: 10,
      contentTypes: ["image/svg+xml"],
    }),
    ApiResponseError,
  );
  variant = 2;
  await assert.rejects(
    session.requestBytes("/media/m", {
      maxBytes: 10,
      contentTypes: ["image/svg+xml"],
    }),
    ApiResponseError,
  );
});

void test("logout cancels a pending media stream and no old account bytes are returned", async () => {
  const entered = deferred<void>();
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2]));
      entered.resolve();
    },
    cancel() {
      cancelled = true;
    },
  });
  const { client: session } = client((path) =>
    path === "/auth/login"
      ? json(pair("one"))
      : path === "/auth/logout"
        ? json({ success: true })
        : new Response(stream, { headers: { "content-type": "audio/wav" } }),
  );
  await session.login({ email: "one@example.test", password: "test-password" });
  const pending = session.requestBytes("/media/a", {
    maxBytes: 20,
    contentTypes: ["audio/wav"],
  });
  const rejected = assert.rejects(pending, SessionChangedError);
  await entered.promise;
  // Let the response reach its reader before invalidating the generation.
  await new Promise<void>((resolve) => setImmediate(resolve));
  await session.logout();
  await rejected;
  assert.equal(cancelled, true);
});

void test("an already aborted request never reaches the transport", async () => {
  let calls = 0;
  const { client: session } = client(() => {
    calls += 1;
    return json(pair("one"));
  });
  await session.login({ email: "one@example.test", password: "test-password" });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    session.request("/data", { signal: controller.signal }),
    RequestCancelledError,
  );
  assert.equal(calls, 1);
});

void test("an invalid stored credential is removed before requiring a fresh login", async () => {
  const store = new MemoryStore();
  store.value = "invalid";
  const { client: session } = client(() => json({ success: true }), store);
  await assert.rejects(session.restore(), SessionRequiredError);
  assert.equal(session.getSnapshot().status, "signed-out");
  assert.equal(store.value, null);
});

void test("media body timeout rejects partial bytes and cancels the stream", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([1]));
    },
    cancel() {
      cancelled = true;
    },
  });
  const session = new MobileSessionClient({
    baseUrl: "https://api.example.test",
    requestTimeoutMs: 20,
    store: new MemoryStore(),
    fetch: transport((path) =>
      path === "/auth/login"
        ? json(pair("one"))
        : new Response(stream, { headers: { "content-type": "audio/wav" } }),
    ),
  });
  await session.login({ email: "one@example.test", password: "test-password" });
  await assert.rejects(
    session.requestBytes("/media/a", {
      maxBytes: 20,
      contentTypes: ["audio/wav"],
    }),
    ApiNetworkError,
  );
  assert.equal(cancelled, true);
});

void test("server failure on a mutation does not cause retry or token rotation", async () => {
  let mutations = 0;
  const { client: session } = client((path) => {
    if (path === "/auth/login") return json(pair("one"));
    assert.equal(path, "/attempts/a/finish");
    mutations += 1;
    return json({}, 503);
  });
  await session.login({ email: "one@example.test", password: "test-password" });
  await assert.rejects(
    session.request("/attempts/a/finish", { method: "POST", body: "{}" }),
    (error: unknown) => error instanceof ApiError && error.status === 503,
  );
  assert.equal(mutations, 1);
  assert.equal(session.getSnapshot().status, "authenticated");
});

function stalledJsonBody() {
  const reading = deferred<void>();
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"partial":'));
    },
    pull() {
      reading.resolve();
    },
    cancel() {
      cancelled = true;
    },
  });
  return {
    response: new Response(stream, {
      headers: { "content-type": "application/json" },
    }),
    reading: reading.promise,
    cancelled: () => cancelled,
  };
}

void test("login with received headers and a stalled JSON body times out instead of hanging signing-in", async () => {
  const stalled = stalledJsonBody();
  const store = new MemoryStore();
  const session = new MobileSessionClient({
    baseUrl: "https://api.example.test",
    store,
    requestTimeoutMs: 25,
    fetch: transport(() => stalled.response),
  });
  const pending = session.login({
    email: "one@example.test",
    password: "test-password",
  });
  const rejected = assert.rejects(pending, ApiNetworkError);
  await stalled.reading;
  await rejected;
  assert.equal(stalled.cancelled(), true);
  assert.equal(session.getSnapshot().status, "signed-out");
  assert.equal(store.value, null);
});

void test("a stalled refresh JSON body preserves the old credential, then a committed rotation rejection requires login", async () => {
  const stalled = stalledJsonBody();
  const store = new MemoryStore();
  store.value = pair("old").refreshToken;
  let refreshes = 0;
  const session = new MobileSessionClient({
    baseUrl: "https://api.example.test",
    store,
    requestTimeoutMs: 25,
    fetch: transport((path) => {
      if (path === "/auth/logout") return json({ success: true });
      refreshes += 1;
      return refreshes === 1 ? stalled.response : json({}, 401);
    }),
  });
  const pending = session.restore();
  const rejected = assert.rejects(pending, ApiNetworkError);
  await stalled.reading;
  await rejected;
  assert.equal(stalled.cancelled(), true);
  assert.equal(session.getSnapshot().status, "retry-required");
  assert.equal(store.value, pair("old").refreshToken);
  await assert.rejects(
    session.restore(),
    (error: unknown) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(store.value, null);
  assert.equal(session.getSnapshot().status, "signed-out");
});

void test("logout cancels a JSON body after headers and prevents the old account result or error escaping", async () => {
  const stalled = stalledJsonBody();
  const { client: session, store } = client((path) =>
    path === "/auth/login"
      ? json(pair("one"))
      : path === "/auth/logout"
        ? json({ success: true })
        : stalled.response,
  );
  await session.login({ email: "one@example.test", password: "test-password" });
  const pending = session.request("/students/me");
  const rejected = assert.rejects(pending, SessionChangedError);
  await stalled.reading;
  await session.logout();
  await rejected;
  assert.equal(stalled.cancelled(), true);
  assert.equal(store.value, null);
  assert.equal(session.getSnapshot().user, null);
});

void test("logout cancels an in-flight login JSON body without reopening the session", async () => {
  const stalled = stalledJsonBody();
  const { client: session, store } = client(() => stalled.response);
  const pending = session.login({
    email: "one@example.test",
    password: "test-password",
  });
  const rejected = assert.rejects(pending, SessionChangedError);
  await stalled.reading;
  await session.logout();
  await rejected;
  assert.equal(stalled.cancelled(), true);
  assert.equal(store.value, null);
  assert.equal(session.getSnapshot().status, "signed-out");
});

void test("aborting a public recovery JSON body leaves the active account untouched", async () => {
  const stalled = stalledJsonBody();
  const controller = new AbortController();
  const { client: session, store } = client((path) =>
    path === "/auth/login" ? json(pair("one")) : stalled.response,
  );
  await session.login({ email: "one@example.test", password: "test-password" });
  const snapshot = session.getSnapshot();
  const pending = session.publicRequest("/auth/forgot-password", {
    method: "POST",
    body: "{}",
    signal: controller.signal,
  });
  const rejected = assert.rejects(pending, RequestCancelledError);
  await stalled.reading;
  controller.abort();
  await rejected;
  assert.equal(stalled.cancelled(), true);
  assert.equal(session.getSnapshot(), snapshot);
  assert.equal(store.value, pair("one").refreshToken);
});

void test("JSON buffering enforces 2 MiB even when content-length understates the streamed body", async () => {
  const { client: session } = client((path) =>
    path === "/auth/login"
      ? json(pair("one"))
      : new Response(new Uint8Array(2 * 1024 * 1024 + 1), {
          headers: {
            "content-type": "application/json",
            "content-length": "1",
          },
        }),
  );
  await session.login({ email: "one@example.test", password: "test-password" });
  await assert.rejects(session.request("/students/me"), ApiResponseError);
  assert.equal(session.getSnapshot().status, "authenticated");
});

void test("registration adopts the real API session and persists only its secure refresh", async () => {
  const calls: string[] = [];
  const current=client((path,init)=>{
    calls.push(path);
    if (path==='/auth/register') {
      assert.deepEqual(body(init),{name:'Pessoa de teste',email:'qa@example.test',password:'qa-password',inviteToken:'invitation-synthetic-12345'});
      return json(pair('registered'),201);
    }
    return json({success:true});
  });
  await current.client.register({name:'Pessoa de teste',email:'qa@example.test',password:'qa-password',inviteToken:'invitation-synthetic-12345'});
  assert.equal(current.client.getSnapshot().status,'authenticated');
  assert.equal(current.client.getSnapshot().user?.id,'registered');
  assert.equal(current.store.value,pair('registered').refreshToken);
  assert.deepEqual(calls,['/auth/register']);
});
void test("successful reset explicitly ends the local session even when remote logout is unavailable", async () => {
  const current=client((path)=>{
    if(path==='/auth/login')return json(pair('reset-user'));
    if(path==='/auth/reset-password')return json({success:true});
    if(path==='/auth/logout')throw new Error('offline after reset');
    throw new Error('Unexpected path');
  });
  await current.client.login({email:'qa@example.test',password:'old-password'});
  await current.client.publicRequest('/auth/reset-password',{method:'POST',body:JSON.stringify({token:'a'.repeat(43),password:'new-password'})});
  await current.client.logout();
  assert.equal(current.client.getSnapshot().status,'signed-out');
  assert.equal(current.client.getSnapshot().user,null);
  assert.equal(current.store.value,null);
});
