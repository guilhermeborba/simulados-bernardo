import test from "node:test";
import assert from "node:assert/strict";
import {
  readEntryLink,
  readPublicAppPath,
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

test("invite supports the current web t parameter without accepting extra keys", () => {
  assert.deepEqual(readEntryLink(`${origin}/convite?t=${token}`, origin), {kind:"invite",token});
  assert.equal(readEntryLink(`${origin}/convite?t=${token}&token=${token}`, origin), null);
});

test("custom navigation accepts only the active development/internal scheme and never secrets", () => {
 for (const active of ['simuladosbernardoproof','simuladosbernardointernal']) {
  assert.equal(readPublicAppPath(`${active}://profile`,active),'/profile');
  assert.equal(readPublicAppPath(`${active}:///history`,active),'/history');
  assert.equal(readPublicAppPath(`${active==='simuladosbernardoproof'?'simuladosbernardointernal':'simuladosbernardoproof'}://profile`,active),null);
  for (const suffix of ['?token=secret','#token=secret','?ordinary=value','#anchor']) assert.equal(readPublicAppPath(`${active}://profile${suffix}`,active),null);
  assert.equal(readPublicAppPath(`${active}://user:secret@profile`,active),null);
  assert.equal(readPublicAppPath(`${active}://profile:123`,active),null);
  assert.equal(readPublicAppPath(`${active}://entry`,active),null);
  for(const route of ['quizzes','progress','oversight','learning','practice-history','official-simulations']) assert.equal(readPublicAppPath(`${active}://${route}`,active),`/${route}`);
 }
});
