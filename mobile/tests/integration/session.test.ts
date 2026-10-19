import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  ApiError,
  ApiNetworkError,
  ApiResponseError,
  MobileSessionClient,
  SessionChangedError,
  type SecureCredentialStore,
} from "../../src/core/session.js";

import { mapApiQuestion } from '../../src/simulation/questions';
import { answerIsComplete, makeAnswer, restoreAnswers } from '../../src/simulation/model';
import type { ApiAttempt, ApiAttemptResult, ApiQuestion } from '../../../packages/api-contracts/src';

if (
  !process.env.E2E_API_URL ||
  !process.env.E2E_FIXTURE_PATH ||
  !process.env.E2E_MAIL_URL
) {
  throw new Error(
    "Run this suite through the isolated mobile integration harness.",
  );
}
const apiUrl = process.env.E2E_API_URL;
const mailUrl = process.env.E2E_MAIL_URL;
const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH, "utf8"));
const password = "Synthetic-password-42";

/** Protocol double only: this does not exercise Keychain, Keystore or an actual install. */
class MemoryStore implements SecureCredentialStore {
  value: string | null = null;
  writes = 0;
  async read() {
    return this.value;
  }
  async write(value: string) {
    this.value = value;
    this.writes += 1;
  }
  async clear() {
    this.value = null;
  }
}
function client(store = new MemoryStore(), transport: typeof fetch = fetch) {
  return new MobileSessionClient({
    baseUrl: apiUrl,
    allowInsecureHttp: true,
    store,
    fetch: transport,
  });
}
async function api(
  path: string,
  method = "GET",
  body?: unknown,
  authorization?: string,
  status = 200,
): Promise<any> {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  // Do not include auth response bodies in assertion messages or test output.
  assert.equal(response.status, status, `${method} ${path} status`);
  return response.status === 204 ? undefined : response.json();
}
async function account() {
  const email = `mobile-${randomUUID()}@example.test`;
  const registered = await api(
    "/auth/register",
    "POST",
    { name: "Aluno da prova mobile", email, password },
    undefined,
    201,
  );
  assert.equal(registered.user.role, "STUDENT");
  assert.equal(Object.hasOwn(registered.user, "passwordHash"), false);
  return { email, id: registered.user.id };
}
async function signed(transport: typeof fetch = fetch) {
  const actor = await account();
  const store = new MemoryStore();
  const session = client(store, transport);
  await session.login({ email: actor.email, password });
  return { session, store, actor };
}
const jsonPost = (body?: unknown): RequestInit => ({
  method: "POST",
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
function privateFieldsAbsent(value: unknown) {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    assert.equal(
      [
        "passwordHash",
        "tokenHash",
        "accessToken",
        "refreshToken",
        "correctAnswer",
        "officialAnswers",
        "answerKey",
        "answerValue",
        "assetId",
        "sha256",
      ].includes(key),
      false,
      `Private field: ${key}`,
    );
    privateFieldsAbsent(nested);
  }
}
function status(expected: number) {
  return (error: unknown) =>
    error instanceof ApiError && error.status === expected;
}
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

// Fetch/credential doubles model network faults; every accepted request still crosses
// the real Nest guards, DTOs, services and PostgreSQL transactions.
describe(
  "Mobile session protocol against real Nest/PostgreSQL, without browser cookies",
  { concurrency: false, timeout: 180_000 },
  () => {
    test("Bearer calls expose a safe snapshot and a new client restores from the saved refresh credential", async () => {
      let bearerCalls = 0;
      const transport: typeof fetch = async (url, init) => {
        const headers = new Headers(init?.headers);
        assert.equal(headers.has("cookie"), false);
        assert.equal(init?.credentials, "omit");
        if (headers.has("authorization")) bearerCalls += 1;
        return fetch(url, init);
      };
      const { session, store, actor } = await signed(transport);
      const me = await session.request<{ id: string }>("/auth/me");
      assert.equal(me.id, actor.id);
      assert.ok(bearerCalls > 0);
      privateFieldsAbsent(session.getSnapshot());
      assert.equal(session.getSnapshot().status, "authenticated");
      const successor = client(store, transport);
      await successor.restore();
      assert.equal(successor.getSnapshot().user?.id, actor.id);
      assert.equal(
        (await successor.request<{ id: string }>("/auth/me")).id,
        actor.id,
      );
      assert.equal(store.writes, 2);
      await successor.logout();
      assert.equal(store.value, null);
    });

    test("TEXT classification uses the real mode, protects the answer key, preserves raw requests and supports canonical replay/result/legacy", async () => {
      const posted:string[]=[];
      const transport:typeof fetch=async(input,init)=>{
        if(String(input).endsWith('/answer')&&typeof init?.body==='string')posted.push(init.body);
        return fetch(input,init);
      };
      const {session}=await signed(transport);
      const simulationId=fixture.textClassificationSimulation;
      const attempt=await session.request<ApiAttempt>(`/simulations/${simulationId}/attempts`,jsonPost({immediateFeedback:true}));
      const questions=await session.request<ApiQuestion[]>(`/attempts/${attempt.id}/questions`);
      assert.equal(questions.length,1);
      assert.equal(questions[0].classificationMode,'TEXT');
      privateFieldsAbsent(questions);
      const mapped=mapApiQuestion(questions[0]);
      assert.equal(answerIsComplete(mapped,{one:'Primeiro'}),false);
      const raw={one:'  PRIMEIRO  ',two:'segundo'};
      const answer=makeAnswer(mapped,raw);
      assert.strictEqual(answer.body,raw);
      const path=`/attempts/${attempt.id}/questions/${questions[0].id}/answer`;
      const receipt=await session.request<{feedback:{isCorrect:boolean;correctAnswer:Record<string,unknown>}}>(path,jsonPost({answer:answer.body}));
      assert.equal(posted[0],JSON.stringify({answer:raw}));
      assert.equal(receipt.feedback.isCorrect,true);
      assert.deepEqual(receipt.feedback.correctAnswer,{one:'Primeiro',two:'Segundo'});
      const replay=await session.request(path,jsonPost({answer:{one:'primeiro',two:'  SEGUNDO  '}}));
      assert.deepEqual(replay,receipt);
      const confirmed=await session.request<ApiQuestion[]>(`/attempts/${attempt.id}/questions`);
      assert.equal(restoreAnswers(confirmed)[questions[0].id].feedback?.isCorrect,true);
      const result=await session.request<ApiAttemptResult>(`/attempts/${attempt.id}/finish`,jsonPost());
      assert.equal(result.questions[0].classificationMode,'TEXT');
      assert.equal(result.questions[0].options?.length,2);
      assert.deepEqual(result.questions[0].correctAnswer,receipt.feedback.correctAnswer);
      assert.deepEqual(await session.request(path,jsonPost({answer:raw})),receipt);
      await assert.rejects(session.request(path,jsonPost({answer:{one:'Segundo',two:'Primeiro'}})),status(409));
      const legacy=await session.request<ApiAttempt>(`/simulations/${simulationId}/attempts`,jsonPost());
      assert.equal(legacy.immediateFeedback===true,false);
      const legacyQuestions=await session.request<ApiQuestion[]>(`/attempts/${legacy.id}/questions`);
      assert.equal(legacyQuestions[0].classificationMode,'TEXT');
      const legacyBody={one:' Primeiro ',two:'Segundo'};
      await session.request(`/attempts/${legacy.id}/questions/${legacyQuestions[0].id}/answer`,jsonPost({answer:legacyBody}));
      const restored=await session.request<ApiQuestion[]>(`/attempts/${legacy.id}/questions`);
      assert.deepEqual(restored[0].answer,legacyBody);
      assert.equal(restoreAnswers(restored)[legacyQuestions[0].id].feedback,undefined);
      const legacyResult=await session.request<ApiAttemptResult>(`/attempts/${legacy.id}/finish`,jsonPost());
      assert.equal(legacyResult.questions[0].classificationMode,'TEXT');
      assert.equal(legacyResult.questions[0].correctAnswer,undefined);
      await session.logout();
    });

    test("all 15 school-year values use the same catalogue, home/progress and account preference contracts", async () => {
      const { session } = await signed();
      for (const [year, quizId] of Object.entries(fixture.quizSegments)) {
        const schoolYear = Number(year);
        const segment =
          schoolYear < 0
            ? "INFANTIL"
            : schoolYear === 0
              ? "ENFERMAGEM"
              : schoolYear <= 5
                ? "FUNDAMENTAL_I"
                : schoolYear <= 9
                  ? "FUNDAMENTAL_II"
                  : "MEDIO";
        const preferences = await session.request<{ schoolYear: number }>(
          "/me/learning-preferences",
          {
            method: "PATCH",
            body: JSON.stringify({
              segment,
              schoolYear,
              audioEnabled: false,
              motionEnabled: false,
            }),
          },
        );
        assert.equal(preferences.schoolYear, schoolYear);
        const rows = await session.request<
          Array<{ id: string; schoolYear: number }>
        >(`/quizzes/available?schoolYear=${year}`);
        assert.ok(rows.some((row) => row.id === quizId));
        assert.ok(rows.every((row) => row.schoolYear === schoolYear));
        const home = await session.request<{ schoolYear: number }>(
          `/me/learning-home?schoolYear=${year}`,
        );
        const progress = await session.request<{ schoolYear: number }>(
          `/me/learning-progress?schoolYear=${year}`,
        );
        assert.equal(home.schoolYear, schoolYear);
        assert.equal(progress.schoolYear, schoolYear);
        privateFieldsAbsent([rows, home, progress]);
      }
      await assert.rejects(
        session.request("/me/learning-preferences", {
          method: "PATCH",
          body: JSON.stringify({ segment: "INFANTIL", schoolYear: 10 }),
        }),
        status(400),
      );
      assert.equal(session.getSnapshot().status, "authenticated");
      await session.logout();
    });

    test("two simultaneous real 401s including a late response share one refresh rotation", async () => {
      let expiredAccess: string | null = null;
      let initialCalls = 0;
      let rotations = 0;
      const renewed = gate();
      const transport: typeof fetch = async (url, init) => {
        const path = new URL(String(url)).pathname;
        const response = await fetch(url, init);
        if (path === "/auth/login" && response.ok) {
          const pair = await response.json();
          // Real signature/claims with an expired date, solely in this synthetic
          // API environment. Both 401s are decided by the actual Nest JWT guard.
          const [header, encoded] = pair.accessToken.split(".");
          const payload = JSON.parse(
            Buffer.from(encoded, "base64url").toString("utf8"),
          );
          payload.iat = 1;
          payload.exp = 2;
          const signedInput = `${header}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
          const signature = createHmac(
            "sha256",
            "synthetic-access-secret-mobile-proof",
          )
            .update(signedInput)
            .digest("base64url");
          expiredAccess = `${signedInput}.${signature}`;
          pair.accessToken = expiredAccess;
          return new Response(JSON.stringify(pair), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (path === "/auth/refresh") {
          rotations += 1;
          renewed.release();
        }
        if (
          path === "/auth/me" &&
          new Headers(init?.headers).get("authorization") ===
            `Bearer ${expiredAccess}`
        ) {
          const requestNumber = ++initialCalls;
          if (requestNumber === 2) await renewed.promise;
        }
        return response;
      };
      const { session, store, actor } = await signed(transport);
      const before = store.value;
      const users = await Promise.all([
        session.request<{ id: string }>("/auth/me"),
        session.request<{ id: string }>("/auth/me"),
      ]);
      assert.ok(users.every((user) => user.id === actor.id));
      assert.equal(rotations, 1);
      assert.equal(
        store.value === before,
        false,
        "Rotation must persist a successor, without logging either credential.",
      );
      await session.logout();
    });

    test("a committed refresh with a lost response preserves storage until the next real 401 requires login", async () => {
      const { store, actor, session: previous } = await signed();
      const predecessor = store.value;
      let lose = true;
      const transport: typeof fetch = async (url, init) => {
        const response = await fetch(url, init);
        if (
          new URL(String(url)).pathname === "/auth/refresh" &&
          lose &&
          response.status === 200
        ) {
          lose = false;
          await response.arrayBuffer();
          throw new TypeError(
            "Synthetic response loss after the server transaction committed.",
          );
        }
        return response;
      };
      const restored = client(store, transport);
      await assert.rejects(restored.restore(), ApiNetworkError);
      assert.equal(restored.getSnapshot().status, "retry-required");
      assert.equal(store.value === predecessor, true);
      await assert.rejects(restored.restore(), status(401));
      assert.equal(restored.getSnapshot().status, "signed-out");
      assert.equal(store.value, null);
      await restored.login({ email: actor.email, password });
      assert.equal(
        (await restored.request<{ id: string }>("/auth/me")).id,
        actor.id,
      );
      await restored.logout();
      await previous.logout();
    });

    test("an old account response held during login cannot change the new account snapshot or preferences", async () => {
      const responseReady = gate(),
        release = gate();
      let hold = true;
      const transport: typeof fetch = async (url, init) => {
        const response = await fetch(url, init);
        if (
          new URL(String(url)).pathname === "/me/learning-preferences" &&
          hold
        ) {
          hold = false;
          responseReady.release();
          await release.promise;
        }
        return response;
      };
      const { session } = await signed(transport);
      const other = await account();
      const pending = session.request("/me/learning-preferences").then(
        () => null,
        (error) => error,
      );
      await responseReady.promise;
      await session.login({ email: other.email, password });
      release.release();
      assert.ok((await pending) instanceof SessionChangedError);
      assert.equal(session.getSnapshot().user?.id, other.id);
      assert.equal(
        (await session.request<{ segment: null }>("/me/learning-preferences"))
          .segment,
        null,
      );
      await session.logout();
    });

    test("logout during a committed refresh removes local credentials and revokes the delayed successor chain", async () => {
      const responseReady = gate(),
        release = gate();
      let successor: string | null = null;
      let inject401 = true;
      const transport: typeof fetch = async (url, init) => {
        const path = new URL(String(url)).pathname;
        if (path === "/auth/me" && inject401) {
          inject401 = false;
          const headers = new Headers(init?.headers);
          headers.set("authorization", "Bearer synthetic-invalid-access");
          return fetch(url, { ...init, headers });
        }
        const response = await fetch(url, init);
        if (path === "/auth/refresh" && response.ok) {
          successor = (await response.clone().json()).refreshToken;
          responseReady.release();
          await release.promise;
        }
        return response;
      };
      const { session, store } = await signed(transport);
      const pending = session.request("/auth/me").then(
        () => null,
        (error) => error,
      );
      await responseReady.promise;
      await session.logout();
      release.release();
      assert.ok((await pending) instanceof SessionChangedError);
      assert.equal(store.value, null);
      assert.equal(session.getSnapshot().status, "signed-out");
      assert.ok(successor);
      await api(
        "/auth/refresh",
        "POST",
        { refreshToken: successor },
        undefined,
        401,
      );
    });

    test("lost confirmation and finish responses can be retried without duplicate result, XP or mission progress", async () => {
      let lostConfirmation: any;
      let lostResult: any;
      let loseConfirmation = true,
        loseFinish = true;
      const transport: typeof fetch = async (url, init) => {
        const response = await fetch(url, init);
        const path = new URL(String(url)).pathname;
        if (
          init?.method === "POST" &&
          path.endsWith("/answer") &&
          response.status === 201 &&
          loseConfirmation
        ) {
          loseConfirmation = false;
          lostConfirmation = await response.json();
          throw new TypeError("Synthetic lost confirmed response.");
        }
        if (
          init?.method === "POST" &&
          path.endsWith("/finish") &&
          response.status === 201 &&
          loseFinish
        ) {
          loseFinish = false;
          lostResult = await response.json();
          throw new TypeError("Synthetic lost saved result.");
        }
        return response;
      };
      const { session } = await signed(transport);
      const attempt = await session.request<{ id: string }>(
        `/quizzes/${fixture.publicQuiz}/attempts`,
        jsonPost(),
      );
      assert.equal(
        (
          await session.request<{ id: string }>(
            `/quizzes/${fixture.publicQuiz}/attempts`,
            jsonPost(),
          )
        ).id,
        attempt.id,
      );
      const questions = await session.request<
        Array<{ id: string; feedback: null; answer: null }>
      >(`/attempts/${attempt.id}/questions`);
      assert.ok(
        questions.every(
          (question) => question.feedback === null && question.answer === null,
        ),
      );
      privateFieldsAbsent(questions);
      const answerPath = `/attempts/${attempt.id}/questions/${questions[0].id}/answer`;
      await assert.rejects(
        session.request(answerPath, jsonPost({ answer: { optionKey: "B" } })),
        ApiNetworkError,
      );
      const repeated = await session.request(
        answerPath,
        jsonPost({ answer: { optionKey: "B" } }),
      );
      assert.deepEqual(repeated, lostConfirmation);
      await assert.rejects(
        session.request(answerPath, jsonPost({ answer: { optionKey: "A" } })),
        status(409),
      );
      await assert.rejects(
        session.request(`/attempts/${attempt.id}/finish`, jsonPost()),
        status(400),
      );
      for (const question of questions.slice(1))
        await session.request(
          `/attempts/${attempt.id}/questions/${question.id}/answer`,
          jsonPost({ answer: { optionKey: "B" } }),
        );
      await assert.rejects(
        session.request(`/attempts/${attempt.id}/finish`, jsonPost()),
        ApiNetworkError,
      );
      const before = await session.request("/me/learning-home?schoolYear=3");
      const result: any = await session.request(
        `/attempts/${attempt.id}/finish`,
        jsonPost(),
      );
      assert.deepEqual(result, lostResult);
      assert.equal(result.reward.xpAwarded, 10);
      assert.deepEqual(
        await session.request(`/attempts/${attempt.id}/result`),
        result,
      );
      assert.deepEqual(
        await session.request("/me/learning-home?schoolYear=3"),
        before,
      );
      privateFieldsAbsent(result);
      await session.logout();
    });

    test("REVIEW uses saved evidence, retains an independent normal attempt and awards no XP, missions or items", async () => {
      const { session } = await signed();
      const normal: any = await session.request(
        `/quizzes/${fixture.reviewOld}/attempts`,
        jsonPost(),
      );
      const questions: any[] = await session.request(
        `/attempts/${normal.id}/questions`,
      );
      for (const [index, question] of questions.entries())
        await session.request(
          `/attempts/${normal.id}/questions/${question.id}/answer`,
          jsonPost({ answer: { optionKey: index === 0 ? "A" : "B" } }),
        );
      await session.request(`/attempts/${normal.id}/finish`, jsonPost());
      const progress: any = await session.request(
        "/me/learning-progress?schoolYear=3",
      );
      assert.ok(
        progress.reviewSuggestions.some(
          (row: any) => row.quizId === fixture.reviewCurrent,
        ),
      );
      const review: any = await session.request(
        "/me/review-attempts",
        jsonPost({ quizId: fixture.reviewCurrent }),
      );
      assert.equal(review.practiceMode, "REVIEW");
      const openNormal: any = await session.request(
        `/quizzes/${fixture.reviewCurrent}/attempts`,
        jsonPost(),
      );
      assert.notEqual(openNormal.id, review.id);
      const beforeHome: any = await session.request(
        "/me/learning-home?schoolYear=3",
      );
      const beforeItems = await session.request("/me/achievements");
      const rows: any[] = await session.request(
        `/attempts/${review.id}/questions`,
      );
      assert.ok(rows.length > 0 && rows.length <= 5);
      for (const row of rows)
        await session.request(
          `/attempts/${review.id}/questions/${row.id}/answer`,
          jsonPost({ answer: { optionKey: "B" } }),
        );
      const result: any = await session.request(
        `/attempts/${review.id}/finish`,
        jsonPost(),
      );
      assert.deepEqual(result.reward, {
        xpAwarded: 0,
        reason: "REVIEW",
        day: null,
      });
      assert.deepEqual(
        await session.request(`/attempts/${review.id}/finish`, jsonPost()),
        result,
      );
      const afterHome: any = await session.request(
        "/me/learning-home?schoolYear=3",
      );
      assert.deepEqual(afterHome.xp, beforeHome.xp);
      assert.deepEqual(afterHome.missions, beforeHome.missions);
      assert.deepEqual(await session.request("/me/achievements"), beforeItems);
      assert.deepEqual(await session.request("/me/attempts"), []);
      await session.logout();
    });

    test("protected SVG/WAV support authenticated ranges, limits and textual fallback metadata", async () => {
      const { session } = await signed();
      const { session: outsider } = await signed();
      const attempt: any = await session.request(
        `/quizzes/${fixture.publicQuiz}/attempts`,
        jsonPost(),
      );
      const rows: any[] = await session.request(
        `/attempts/${attempt.id}/questions`,
      );
      const media = rows[0].media;
      assert.ok(media.image.alt && media.audio.transcript);
      const image = await session.requestBytes(media.image.url, {
        maxBytes: 2 * 1024 * 1024,
        contentTypes: ["image/svg+xml"],
      });
      assert.match(new TextDecoder().decode(image.bytes), /<svg/);
      assert.equal(image.contentType, "image/svg+xml");
      const audio = await session.requestBytes(
        media.audio.url,
        { maxBytes: 12, contentTypes: ["audio/wav"] },
        { headers: { Range: "bytes=0-11" } },
      );
      assert.equal(audio.bytes.length, 12);
      assert.equal(
        new TextDecoder().decode(audio.bytes.subarray(0, 4)),
        "RIFF",
      );
      assert.equal(
        new TextDecoder().decode(audio.bytes.subarray(8, 12)),
        "WAVE",
      );
      await assert.rejects(
        session.requestBytes(media.image.url, {
          maxBytes: 1,
          contentTypes: ["image/svg+xml"],
        }),
        ApiResponseError,
      );
      await assert.rejects(
        session.requestBytes(
          media.audio.url,
          { maxBytes: 8 * 1024 * 1024, contentTypes: ["audio/wav"] },
          { headers: { Range: "bytes=100-10" } },
        ),
        status(416),
      );
      await assert.rejects(
        outsider.requestBytes(media.image.url, {
          maxBytes: 2 * 1024 * 1024,
          contentTypes: ["image/svg+xml"],
        }),
        status(403),
      );
      assert.equal(outsider.getSnapshot().status, "authenticated");
      await session.logout();
      await outsider.logout();
    });

    test("teacher and guardian receive different current scopes; teacher revocation removes access without a refresh loop", async () => {
      const actors = fixture.oversight.mobile;
      const teacher = client(),
        guardian = client(),
        admin = client();
      await teacher.login({ email: actors.teacher.email, password });
      await guardian.login({ email: actors.guardian.email, password });
      await admin.login({ email: fixture.admin.email, password });
      const roster: any[] = await teacher.request("/me/oversight-students");
      assert.equal(roster.length, 1);
      assert.equal(roster[0].id, actors.student.id);
      assert.deepEqual(roster[0].turmas, [actors.turma]);
      const teacherProgress: any = await teacher.request(
        `/students/${actors.student.id}/learning-progress?schoolYear=3`,
      );
      const guardianProgress: any = await guardian.request(
        `/students/${actors.student.id}/learning-progress?schoolYear=3`,
      );
      assert.equal(teacherProgress.skills.length, 2);
      assert.equal(guardianProgress.skills.length, 3);
      assert.equal(JSON.stringify(teacherProgress).includes("externo"), false);
      privateFieldsAbsent([roster, teacherProgress, guardianProgress]);
      await assert.rejects(
        teacher.request(`/quizzes/${fixture.publicQuiz}/attempts`, jsonPost()),
        status(403),
      );
      await admin.request(
        `/turmas/${actors.turma.id}/teachers/${actors.teacher.id}`,
        { method: "DELETE" },
      );
      assert.deepEqual(await teacher.request("/me/oversight-students"), []);
      await assert.rejects(
        teacher.request(
          `/students/${actors.student.id}/learning-progress?schoolYear=3`,
        ),
        status(403),
      );
      assert.equal(teacher.getSnapshot().status, "authenticated");
      assert.equal(
        (
          await guardian.request<any>(
            `/students/${actors.student.id}/learning-progress?schoolYear=3`,
          )
        ).skills.length,
        3,
      );
      await teacher.logout();
      await guardian.logout();
      await admin.logout();
    });

    test("current inactive status invalidates an earlier installation access and refresh pair", async () => {
      const { session, store, actor } = await signed();
      const admin = client();
      await admin.login({ email: fixture.admin.email, password });
      await admin.request(`/users/${actor.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "INACTIVE" }),
      });
      await assert.rejects(
        session.request("/me/learning-preferences"),
        status(401),
      );
      assert.equal(session.getSnapshot().status, "signed-out");
      assert.equal(store.value, null);
      await admin.logout();
    });

    test("recovery sends no credential, uses a synthetic fragment link and invalidates both existing sessions after reset", async () => {
      const { session, actor, store } = await signed();
      const secondStore = new MemoryStore(),
        second = client(secondStore);
      await second.login({ email: actor.email, password });
      await session.publicRequest(
        "/auth/forgot-password",
        jsonPost({ email: actor.email }),
      );
      const messages = await (
        await fetch(
          `${mailUrl}/messages?email=${encodeURIComponent(actor.email)}`,
        )
      ).json();
      assert.equal(messages.length, 1);
      const source = String(messages[0].text || messages[0].html);
      const token =
        /redefinir-senha#token=([A-Za-z0-9_-]{43})(?:["\s<]|&|$)/.exec(
          source,
        )?.[1];
      assert.ok(token, "The synthetic delivery must carry a fragment token.");
      assert.equal(source.includes("redefinir-senha?token="), false);
      const newPassword = "Synthetic-mobile-reset-87";
      await session.publicRequest(
        "/auth/reset-password",
        jsonPost({ token, password: newPassword }),
      );
      // Recovery changes neither the local active account nor credentials by itself.
      assert.equal(session.getSnapshot().user?.id, actor.id);
      await assert.rejects(session.request("/auth/me"), status(401));
      await assert.rejects(second.request("/auth/me"), status(401));
      assert.equal(store.value, null);
      assert.equal(secondStore.value, null);
      await session.login({ email: actor.email, password: newPassword });
      assert.equal(
        (await session.request<{ id: string }>("/auth/me")).id,
        actor.id,
      );
      await session.logout();
    });
  },
);
