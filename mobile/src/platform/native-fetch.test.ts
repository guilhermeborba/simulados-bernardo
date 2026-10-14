import assert from "node:assert/strict";
import test from "node:test";
import { createNativeFetch } from "./native-fetch";

test("native adapter forces redirect rejection and cookie omission before transport", async () => {
  let observed: RequestInit | undefined;
  const adapter = createNativeFetch(async () => async (_input, init) => {
    observed = init;
    return new Response("{}");
  });
  await adapter("https://api.example.test/me", {
    credentials: "include",
    redirect: "follow",
    headers: {
      authorization: "Bearer sample",
      cookie: "other-session",
      cookie2: "other-session",
    },
  });
  assert.equal(observed?.redirect, "error");
  assert.equal(observed?.credentials, "omit");
  assert.equal(new Headers(observed?.headers).get("cookie"), null);
  assert.equal(new Headers(observed?.headers).get("cookie2"), null);
  assert.equal(
    new Headers(observed?.headers).get("authorization"),
    "Bearer sample",
  );
});

test("native adapter never falls back after native transport rejects a redirect", async () => {
  const adapter = createNativeFetch(async () => async () => {
    throw new Error("redirect rejected");
  });
  await assert.rejects(
    adapter("https://api.example.test/me"),
    /redirect rejected/,
  );
});

test("native adapter rejects implicit Request credentials and non-network URLs before loading transport", async () => {
  let calls = 0;
  const adapter = createNativeFetch(async () => {
    calls++;
    return globalThis.fetch;
  });
  for (const value of [
    "file:///private/session",
    "https://user:pass@api.example.test/",
    "https://api.example.test/#token",
  ]) {
    await assert.rejects(adapter(value), TypeError);
  }
  await assert.rejects(
    adapter(new Request("https://api.example.test/")),
    TypeError,
  );
  assert.equal(calls, 0);
});
