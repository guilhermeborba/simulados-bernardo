import assert from "node:assert/strict";
import test from "node:test";
import { buildEnvironment } from "./build-environment.cjs";

test("development and internal installations have isolated identities", () => {
  const dev = buildEnvironment({});
  const internal = buildEnvironment({ MOBILE_APP_ENV: "internal",
    EXPO_PUBLIC_API_URL: "https://api.example.com",
    EXPO_PUBLIC_WEB_ORIGIN: "https://example.com" });
  assert.notEqual(dev.identifier, internal.identifier);
  assert.notEqual(dev.scheme, internal.scheme);
});

test("internal builds require both HTTPS origins before prebuild/export", () => {
  for (const raw of [undefined, "http://api.example.com", "https://api.example.invalid",
    "https://localhost", "https://api.example.com/path", "https://user:secret@example.com",
    "https://api.example.com?token=secret"]) {
    assert.throws(() => buildEnvironment({ MOBILE_APP_ENV: "internal",
      EXPO_PUBLIC_API_URL: raw, EXPO_PUBLIC_WEB_ORIGIN: "https://example.com" }),
      (error: Error) => !error.message.includes("secret"));
  }
  assert.throws(() => buildEnvironment({ MOBILE_APP_ENV: "internal",
    EXPO_PUBLIC_API_URL: "https://api.example.com" }));
});

test("unknown environments and malformed development origins fail explicitly", () => {
  assert.throws(() => buildEnvironment({ MOBILE_APP_ENV: "production" }));
  assert.throws(() => buildEnvironment({ EXPO_PUBLIC_API_URL: "not-a-url" }));
  assert.doesNotThrow(() => buildEnvironment({ EXPO_PUBLIC_API_URL: "http://127.0.0.1:3333" }));
});

test("Giz preserves the existing EAS development and internal application identities", () => {
 const dev=buildEnvironment({});
 const internal=buildEnvironment({MOBILE_APP_ENV:'internal',EXPO_PUBLIC_API_URL:'https://api.example.com',EXPO_PUBLIC_WEB_ORIGIN:'https://example.com'});
 assert.equal(dev.identifier,'com.simuladosbernardo.proof');
 assert.equal(dev.scheme,'simuladosbernardoproof');
 assert.equal(internal.identifier,'com.simuladosbernardo.proof.internal');
 assert.equal(internal.scheme,'simuladosbernardointernal');
 assert.match(dev.name,/Giz Kids/);
});
