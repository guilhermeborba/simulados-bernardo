import assert from "node:assert/strict";
import test from "node:test";
import { publicScreenPath } from "./public-path";

test("each installed variant accepts its own ordinary links", () => {
  for (const scheme of [
    "simuladosbernardoproof",
    "simuladosbernardointernal",
  ]) {
    for (const screen of [
      "quizzes",
      "profile",
      "progress",
      "simulations",
      "history",
    ])
      assert.equal(
        publicScreenPath(`${scheme}://${screen}`, scheme),
        `/${screen}`,
      );
  }
});
test("foreign variants, secrets and unknown screens go to the neutral route", () => {
  for (const path of [
    "simuladosbernardoproof://profile",
    "simuladosbernardointernal://profile?token=secret",
    "simuladosbernardointernal://profile#secret",
    "simuladosbernardointernal://user:secret@profile",
    "simuladosbernardointernal://unknown",
    "invalid",
  ])
    assert.equal(publicScreenPath(path, "simuladosbernardointernal"), "/");
});
test("missing configuration fails closed; configured scheme arrays work", () => {
  assert.equal(
    publicScreenPath("simuladosbernardoproof://profile", undefined),
    "/",
  );
  assert.equal(
    publicScreenPath("simuladosbernardointernal://profile", [
      "simuladosbernardointernal",
    ]),
    "/profile",
  );
});
