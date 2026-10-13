import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH, 'utf8'));
const baseUrl = process.env.E2E_WEB_URL;
const mailUrl = process.env.E2E_MAIL_URL;
const apiUrl = process.env.E2E_API_URL;
let adminToken;
async function fixtureAdminMutation(path, method = 'DELETE', body) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${adminToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(response.status, method === 'DELETE' ? 204 : 201);
}
const password = 'Synthetic-password-42';
class Session {
  cookies = new Map();
  async request(
    path,
    { method = 'GET', body, status = 200, headers = {} } = {},
  ) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      redirect: 'manual',
      signal: AbortSignal.timeout(20_000),
      headers: {
        ...(this.cookies.size
          ? {
              Cookie: [...this.cookies]
                .map(([key, value]) => `${key}=${value}`)
                .join('; '),
            }
          : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [name, value] = cookie.split(';')[0].split('=');
      if (/Max-Age=0(?:;|$)/i.test(cookie)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    const payload = response.status === 204 ? null : await response.json();
    assert.equal(
      response.status,
      status,
      `${method} ${path}: ${JSON.stringify(payload)}`,
    );
    return payload;
  }
}
const login = (session, email, pass = password) =>
  session.request('/api/auth/login', {
    method: 'POST',
    body: { email, password: pass },
  });
const register = (session, email) =>
  session.request('/api/auth/register', {
    method: 'POST',
    body: { name: 'Conta de recuperação sintética', email, password },
  });
const forgot = (session, email, options = {}) =>
  session.request('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
    status: 202,
    ...options,
  });
const reset = (session, token, pass, options = {}) =>
  session.request('/api/auth/reset-password', {
    method: 'POST',
    body: { token, password: pass },
    ...options,
  });
async function messages(email) {
  return await (
    await fetch(`${mailUrl}/messages?email=${encodeURIComponent(email)}`)
  ).json();
}
function tokenFrom(message) {
  const source = `${message.html || ''}\n${message.text || ''}`;
  const token = source.match(
    /redefinir-senha#token=([A-Za-z0-9_-]{43})(?:["\s<]|&|$)/,
  )?.[1];
  assert.ok(
    token,
    'Synthetic delivery must contain a fragment link, never a query token.',
  );
  assert.ok(!source.includes('redefinir-senha?token='));
  return token;
}
function safe(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    assert.ok(
      ![
        'passwordHash',
        'tokenHash',
        'officialAnswers',
        'answerValue',
        'correctAnswer',
        'answer',
        'feedback',
        'accessToken',
        'refreshToken',
      ].includes(key),
      `Private field exposed: ${key}`,
    );
    safe(nested);
  }
}
const actors = fixture.oversight.http;
const admin = new Session(),
  teacher = new Session(),
  guardian = new Session(),
  outsider = new Session(),
  learner = new Session();

describe(
  'Acompanhamento somente leitura e recuperação Resend simulada (Next → Nest → PostgreSQL)',
  { concurrency: false },
  () => {
    test('roster autenticado mostra vínculos atuais, sem e-mail, senhas ou turmas de outro professor', async () => {
      const provisioning = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fixture.admin.email, password }),
      });
      assert.equal(provisioning.status, 200);
      adminToken = (await provisioning.json()).accessToken;
      await login(admin, fixture.admin.email);
      await login(teacher, actors.teacher.email);
      await login(guardian, actors.guardian.email);
      await login(outsider, actors.outsideGuardian.email);
      await login(learner, actors.student.email);
      const rows = await teacher.request('/api/backend/me/oversight-students');
      assert.deepEqual(rows, [
        {
          id: actors.student.id,
          name: actors.student.name,
          schoolYear: 3,
          turmas: [actors.turma],
        },
      ]);
      assert.equal(JSON.stringify(rows).includes(actors.student.email), false);
      safe(rows);
      assert.deepEqual(
        await outsider.request('/api/backend/me/oversight-students'),
        [],
      );
      await learner.request('/api/backend/me/oversight-students', {
        status: 403,
      });
      await new Session().request('/api/backend/me/oversight-students', {
        status: 401,
      });
    });
    test('professor recebe somente simulados públicos e da turma atribuída, com prática distinta e sem gabarito', async () => {
      const summary = await teacher.request(
        `/api/backend/reports/student/${actors.student.id}/summary`,
      );
      assert.equal(summary.totalFinishedAttempts, 2);
      const byDiscipline = await teacher.request(
        `/api/backend/reports/student/${actors.student.id}/by-discipline`,
      );
      assert.equal(byDiscipline[0].attempts, 2);
      const progress = await teacher.request(
        `/api/backend/students/${actors.student.id}/learning-progress?schoolYear=3`,
      );
      assert.deepEqual(Object.keys(progress).sort(), [
        'schoolYear',
        'skills',
        'unclassifiedQuestions',
      ]);
      assert.equal(progress.skills.length, 2);
      assert.ok(
        progress.skills.every(
          (skill) =>
            skill.evidence === 'INSUFFICIENT' &&
            skill.firstResponse.questions === 2 &&
            skill.review.responses === 0,
        ),
      );
      assert.ok(
        !JSON.stringify([summary, byDiscipline, progress]).includes('externo'),
      );
      safe(summary);
      safe(byDiscipline);
      safe(progress);
      const full = await guardian.request(
        `/api/backend/students/${actors.student.id}/learning-progress?schoolYear=3`,
      );
      assert.equal(full.skills.length, 3);
      assert.equal(
        (
          await guardian.request(
            `/api/backend/reports/student/${actors.student.id}/summary`,
          )
        ).totalFinishedAttempts,
        3,
      );
      await outsider.request(
        `/api/backend/students/${actors.student.id}/learning-progress?schoolYear=3`,
        { status: 403 },
      );
      await outsider.request(
        `/api/backend/reports/student/${actors.student.id}/summary`,
        { status: 403 },
      );
      await teacher.request(
        `/api/backend/students/${actors.student.id}/learning-progress?schoolYear=99`,
        { status: 400 },
      );
    });
    test('vínculo permite leitura e não concede respostas de quiz nem autoria de tentativas', async () => {
      const quiz = actors.activities.find((row) => row.scope === 'externo');
      for (const session of [teacher, guardian]) {
        await session.request(
          `/api/backend/attempts/${quiz.attemptId}/questions`,
          { status: 403 },
        );
        await session.request(`/api/backend/quizzes/${quiz.id}/attempts`, {
          method: 'POST',
          status: 403,
        });
        await session.request('/api/backend/students/me', {
          method: 'PATCH',
          body: { schoolYear: 5 },
          status: 404,
        });
        await session.request(
          `/api/backend/turmas/${actors.turma.id}/teachers`,
          {
            method: 'POST',
            body: { teacherId: actors.teacher.id },
            status: 404,
          },
        );
      }
    });
    test('revogação administrativa de professor e responsável invalida imediatamente roster e URLs diretas', async () => {
      await fixtureAdminMutation(
        `/turmas/${actors.turma.id}/teachers/${actors.teacher.id}`,
      );
      assert.deepEqual(
        await teacher.request('/api/backend/me/oversight-students'),
        [],
      );
      await teacher.request(
        `/api/backend/students/${actors.student.id}/learning-progress?schoolYear=3`,
        { status: 403 },
      );
      await teacher.request(
        `/api/backend/reports/student/${actors.student.id}/summary`,
        { status: 403 },
      );
      await fixtureAdminMutation(
        `/guardians/${actors.guardian.id}/students/${actors.student.id}`,
      );
      assert.deepEqual(
        await guardian.request('/api/backend/me/oversight-students'),
        [],
      );
      await guardian.request(
        `/api/backend/reports/student/${actors.student.id}/by-discipline`,
        { status: 403 },
      );
    });
    test('recuperação retorna mensagem uniforme, não autentica e não revela existência ou link na resposta', async () => {
      const account = new Session(),
        visitor = new Session();
      const email = 'recovery-http-success@example.test';
      await register(account, email);
      const existing = await forgot(visitor, email);
      const missing = await forgot(
        visitor,
        'recovery-http-missing@example.test',
      );
      assert.deepEqual(existing, missing);
      safe(existing);
      assert.equal(visitor.cookies.size, 0);
      assert.ok(!JSON.stringify(existing).includes(email));
      assert.ok(!JSON.stringify(existing).includes('token'));
      const sent = await messages(email);
      assert.equal(sent.length, 1);
      const token = tokenFrom(sent[0]);
      const cooldown = await forgot(visitor, email);
      assert.deepEqual(cooldown, existing);
      assert.equal((await messages(email)).length, 1);
      await reset(visitor, token, 'Changed-synthetic-password-58');
      assert.equal(visitor.cookies.size, 0);
      await account.request('/api/auth/me', { status: 401 });
      await new Session().request('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        status: 401,
      });
    });
    test('senha nova invalida sessões anteriores e link usado, sem auto-login', async () => {
      const old = new Session(),
        second = new Session(),
        visitor = new Session();
      const email = 'recovery-http-sessions@example.test';
      const changed = 'New-synthetic-password-93';
      await register(old, email);
      await login(second, email);
      await forgot(visitor, email);
      const token = tokenFrom((await messages(email))[0]);
      const result = await reset(visitor, token, changed);
      safe(result);
      assert.equal(visitor.cookies.size, 0);
      await old.request('/api/auth/me', { status: 401 });
      await second.request('/api/auth/me', { status: 401 });
      await old.request('/api/backend/me/learning-progress?schoolYear=3', {
        status: 401,
      });
      await reset(visitor, token, 'Another-synthetic-password-64', {
        status: 400,
      });
      await new Session().request('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        status: 401,
      });
      const renewed = new Session();
      await login(renewed, email, changed);
      assert.ok(renewed.cookies.size > 0);
    });
    test('duas confirmações concorrentes do mesmo link alteram a senha uma única vez', async () => {
      const email = 'recovery-http-concurrency@example.test',
        session = new Session(),
        visitor = new Session();
      await register(session, email);
      await forgot(visitor, email);
      const token = tokenFrom((await messages(email))[0]);
      const payloads = [
        'Concurrent-synthetic-password-11',
        'Concurrent-synthetic-password-22',
      ];
      const responses = await Promise.all(
        payloads.map((password) =>
          fetch(`${baseUrl}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
          }),
        ),
      );
      assert.deepEqual(
        responses.map((response) => response.status).sort(),
        [200, 400],
      );
      for (const response of responses) safe(await response.json());
      const acceptedPassword =
        payloads[responses.findIndex((response) => response.status === 200)];
      await login(new Session(), email, acceptedPassword);
      await session.request('/api/auth/me', { status: 401 });
    });
    test('falha simulada do provedor mantém resposta uniforme e nenhum link utilizável', async () => {
      const email = 'recovery-http-delivery-failure@example.test',
        account = new Session(),
        visitor = new Session();
      await register(account, email);
      await fetch(`${mailUrl}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fail: true }),
      });
      const result = await forgot(visitor, email);
      assert.deepEqual(
        result,
        await forgot(visitor, 'recovery-http-failure-missing@example.test'),
      );
      const captured = await messages(email);
      assert.equal(captured.length, 1);
      await reset(
        visitor,
        tokenFrom(captured[0]),
        'Never-applied-password-46',
        { status: 400 },
      );
      await login(new Session(), email);
      await forgot(visitor, email);
      assert.equal((await messages(email)).length, 1);
    });
    test('DTOs e Origin bloqueiam forjamento, tokens inválidos e senhas truncadas por bytes UTF-8', async () => {
      const visitor = new Session();
      for (const body of [
        {},
        { email: 'bad' },
        { email: 'someone@example.test', userId: actors.student.id },
      ]) {
        await visitor.request('/api/auth/forgot-password', {
          method: 'POST',
          body,
          status: 400,
        });
      }
      for (const body of [
        { token: 'short', password },
        { token: 'a'.repeat(43), password: '1234567' },
        { token: 'a'.repeat(43), password: 'é'.repeat(37) },
        { token: 'a'.repeat(43), password, userId: actors.student.id },
      ]) {
        await visitor.request('/api/auth/reset-password', {
          method: 'POST',
          body,
          status: 400,
        });
      }
      await reset(visitor, 'a'.repeat(43), password, { status: 400 });
      await forgot(visitor, 'recovery-http-origin@example.test', {
        status: 403,
        headers: { Origin: 'https://external.example.test' },
      });
      await reset(visitor, 'a'.repeat(43), password, {
        status: 403,
        headers: { Origin: 'https://external.example.test' },
      });
      await teacher.request(`/api/backend/turmas/${actors.turma.id}/teachers`, {
        method: 'POST',
        body: { teacherId: actors.teacher.id },
        status: 404,
      });
    });
  },
);
