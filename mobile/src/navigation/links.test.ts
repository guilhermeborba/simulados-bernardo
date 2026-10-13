import test from "node:test";
import assert from "node:assert/strict";
import {
  readEntryLink,
  receiveEntryLink,
  peekEntryLink,
  forgetEntryLink,
} from "./links.js";
const origin = "https://study.example.test";
const token = "a".repeat(43);
test("reset accepts only the configured origin and fragment; query/duplicate/foreign schemes fail", () => {
  assert.deepEqual(
    readEntryLink(`${origin}/redefinir-senha#token=${token}`, origin),
    { kind: "password-reset", token },
  );
  for (const path of [
    `${origin}/redefinir-senha?token=${token}`,
    `${origin}/redefinir-senha#token=${token}&token=${token}`,
    `https://evil.example/redefinir-senha#token=${token}`,
    `simuladosbernardoproof://redefinir-senha#token=${token}`,
    `${origin}/redefinir-senha#token=bad`,
    `${origin}/redefinir-senha#token=${token}&extra=x`,
  ])
    assert.equal(readEntryLink(path, origin), null);
});
test("invite accepts one token on exact path; no duplicate, suffix or userinfo", () => {
  assert.deepEqual(readEntryLink(`${origin}/convite?token=${token}`, origin), {
    kind: "invite",
    token,
  });
  for (const path of [
    `${origin}/convite/other?token=${token}`,
    `${origin}/convite?token=${token}&token=${token}`,
    `https://user@study.example.test/convite?token=${token}`,
    `${origin}/convite?token=${token}#ignored`,
  ])
    assert.equal(readEntryLink(path, origin), null);
});
test("new link replaces memory and cleanup drops it without route parameters", () => {
  receiveEntryLink({ kind: "password-reset", token });
  const initial = peekEntryLink();
  receiveEntryLink({ kind: "invite", token: "b".repeat(43) });
  assert.ok(peekEntryLink().revision > initial.revision);
  forgetEntryLink();
  assert.equal(peekEntryLink().entry, null);
});
