import assert from "node:assert/strict";
import test from "node:test";
import { createCredentialStore, NativeCredentialError } from "./secure-store";

const token = "refresh-token-test-without-real-secret";
function fixture() {
  let value: string | null = null;
  let marker = true;
  let failRemoval = false;
  let ignoreRemoval = false;
  const store = createCredentialStore({
    get: async () => value,
    set: async (next) => {
      value = next;
    },
    remove: async () => {
      if (failRemoval) throw new Error("native error must not escape");
      if (!ignoreRemoval) value = null;
    },
    hasInstallMarker: async () => marker,
    createInstallMarker: async () => {
      marker = true;
    },
  });
  return {
    store,
    value: () => value,
    retained: () => {
      value = JSON.stringify({ version: 1, refreshToken: token });
      marker = false;
    },
    corrupt: (raw: string) => {
      value = raw;
    },
    fail: () => {
      failRemoval = true;
    },
    ignore: () => {
      ignoreRemoval = true;
    },
  };
}

test("only one versioned refresh credential is persisted and access/user data are absent", async () => {
  const { store, value } = fixture();
  await store.write(token);
  assert.deepEqual(JSON.parse(value()!), { version: 1, refreshToken: token });
  assert.equal(await store.read(), token);
  await store.clear();
  assert.equal(value(), null);
});

test("a missing installation marker clears retained Keychain credentials and requires login", async () => {
  const f = fixture();
  f.retained();
  assert.equal(await f.store.read(), null);
  assert.equal(f.value(), null);
  await f.store.write(token);
  assert.equal(await f.store.read(), token);
});

test("malformed or unexpected credential schema is removed instead of restored", async () => {
  const f = fixture();
  for (const raw of [
    "not-json",
    "null",
    "[]",
    JSON.stringify({ version: 1, refreshToken: token, accessToken: token }),
  ]) {
    f.corrupt(raw);
    assert.equal(await f.store.read(), null);
    assert.equal(f.value(), null);
  }
});

test("failed removal is reported without exposing native details", async () => {
  const f = fixture();
  await f.store.write(token);
  f.fail();
  await assert.rejects(
    f.store.clear(),
    (error: unknown) =>
      error instanceof NativeCredentialError &&
      !error.message.includes("native error"),
  );
});

test("a removal that leaves a credential behind cannot report successful logout", async () => {
  const f = fixture();
  await f.store.write(token);
  f.ignore();
  await assert.rejects(f.store.clear(), NativeCredentialError);
});
