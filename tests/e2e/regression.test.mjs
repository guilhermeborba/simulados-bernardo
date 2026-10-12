import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, test } from 'node:test';

const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH, 'utf8'));
const baseUrl = process.env.E2E_WEB_URL;
const require = createRequire(import.meta.url);
const { mapApiQuestion, buildAnswerBody, parseStoredAnswer } = require('../../.test-build/lib/questionMapper.js');
const password = 'Synthetic-password-42';

class BrowserSession {
  cookies = new Map();
  async request(path, { method = 'GET', body, status = 200, html = false } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method, redirect: 'manual', signal: AbortSignal.timeout(15_000),
      headers: {
        ...(this.cookies.size ? { Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; ') } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      const [name, value] = cookie.split(';')[0].split('=');
      if (/Max-Age=0(?:;|$)/i.test(cookie)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    assert.equal(response.status, status, `${method} ${path}`);
    const payload = html ? await response.text() : await response.json();
    return { body: payload, response, setCookies };
  }
}
function noOfficialAnswers(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    assert.ok(!['correctAnswer', 'answerValue', 'answerKey', 'passwordHash', 'tokenHash', 'accessToken', 'refreshToken'].includes(key), `Sensitive field ${key} exposed`);
    noOfficialAnswers(nested);
  }
}
const alice = new BrowserSession();
const bob = new BrowserSession();
let aliceId;
let bobId;
let attemptId;
let questions;

// The flows are intentionally sequential, matching the user's lifecycle.
describe('Regressão HTTP web com API e PostgreSQL reais', { concurrency: false }, () => {
  test('middleware protege histórico e simulado; fontes locais e páginas compiladas respondem', async () => {
    const response = await fetch(`${baseUrl}/historico`, { redirect: 'manual' });
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get('location')).pathname, '/login');
    const sim = await fetch(`${baseUrl}/simulado/${fixture.publicSimulation}`, { redirect: 'manual' });
    assert.equal(sim.status, 307);
    for (const path of ['/login', '/registro', '/convite']) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 200);
      assert.ok((await response.text()).includes('<html'));
    }
    const home = await fetch(baseUrl);
    const html = await home.text();
    const fonts = [...html.matchAll(/href="([^\"]+\.woff2)"/g)].map((match) => match[1]);
    assert.ok(fonts.length >= 2, 'Root fonts are preloaded locally');
    for (const path of fonts) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 200);
      const data = new Uint8Array(await response.arrayBuffer());
      assert.equal(Buffer.from(data.subarray(0, 4)).toString(), 'wOF2');
    }
    assert.ok(!html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com'));
  });

  test('registro e login criam cookies seguros sem retornar tokens no JSON', async () => {
    for (const [session, name, email] of [[alice, 'Aluna sintética', 'alice@example.test'], [bob, 'Aluno sintético', 'bob@example.test']]) {
      const result = await session.request('/api/auth/register', { method: 'POST', body: { name, email, password } });
      noOfficialAnswers(result.body);
      assert.equal(result.body.user.email, email);
      assert.equal(result.body.user.role, 'STUDENT');
      assert.equal(result.setCookies.length, 2);
      for (const cookie of result.setCookies) {
        assert.match(cookie, /HttpOnly/i);
        assert.match(cookie, /Secure/i);
        assert.match(cookie, /SameSite=Lax/i);
      }
    }
    aliceId = (await alice.request('/api/auth/me')).body.id;
    bobId = (await bob.request('/api/auth/me')).body.id;
    assert.notEqual(aliceId, bobId);
    const invalid = new BrowserSession();
    await invalid.request('/api/auth/login', { method: 'POST', body: { email: 'alice@example.test', password: 'Wrong-password' }, status: 401 });
    assert.equal(invalid.cookies.size, 0);
    const login = await alice.request('/api/auth/login', { method: 'POST', body: { email: 'alice@example.test', password } });
    assert.equal(login.body.user.id, aliceId);
    noOfficialAnswers(login.body);
  });

  test('catálogo preserva sentinelas/faixas e esconde rascunhos, arquivados, excluídos e turma privada', async () => {
    const catalog = (await alice.request('/api/backend/simulations/available')).body;
    assert.ok(catalog.some((simulation) => simulation.id === fixture.publicSimulation));
    for (const hidden of [fixture.privateSimulation, fixture.draft, fixture.archived, fixture.deleted]) {
      assert.ok(!catalog.some((simulation) => simulation.id === hidden));
    }
    noOfficialAnswers(catalog);
    for (const [year, id] of Object.entries(fixture.segments)) {
      const filtered = (await alice.request(`/api/backend/simulations/available?schoolYear=${year}`)).body;
      assert.ok(filtered.some((simulation) => simulation.id === id), `Missing schoolYear ${year}`);
      assert.ok(filtered.every((simulation) => simulation.schoolYear === Number(year)));
    }
    await alice.request(`/api/backend/simulations/${fixture.draft}/attempts`, { method: 'POST', status: 404 });
    await alice.request(`/api/backend/simulations/${fixture.privateSimulation}/attempts`, { method: 'POST', status: 404 });
    await alice.request('/api/backend/users', { status: 404 });
  });

  test('início/retomada mantém tentativa, suporta os quatro tipos e não revela gabarito', async () => {
    const started = await alice.request(`/api/backend/simulations/${fixture.publicSimulation}/attempts`, { method: 'POST', status: 201 });
    attemptId = started.body.id;
    assert.equal(started.body.status, 'IN_PROGRESS');
    const resumed = await alice.request(`/api/backend/simulations/${fixture.publicSimulation}/attempts`, { method: 'POST', status: 201 });
    assert.equal(resumed.body.id, attemptId);
    questions = (await alice.request(`/api/backend/attempts/${attemptId}/questions`)).body;
    assert.deepEqual(questions.map((question) => question.type), ['MULTIPLE_CHOICE', 'TRUE_FALSE_MULTIPLE', 'MATCHING', 'CLASSIFICATION']);
    noOfficialAnswers(questions);
    assert.ok(questions.every((question) => question.answer === null));
    const mapped = questions.map(mapApiQuestion);
    assert.deepEqual(mapped[0].options.map((option) => option.id), ['A', 'B']);
    assert.deepEqual(mapped[1].items.map((item) => item.id), ['a', 'b']);
    assert.deepEqual(mapped[2].pairs.map((pair) => [pair.left.id, pair.right.map((option) => option.id)]), [['a', ['2', '3']], ['b', ['2', '3']]]);
    assert.deepEqual(mapped[3].items.map((item) => item.id), ['a', 'b']);
    await alice.request(`/api/backend/attempts/${attemptId}/result`, { status: 400 });
    await bob.request(`/api/backend/attempts/${attemptId}/questions`, { status: 403 });
    await bob.request(`/api/backend/attempts/${attemptId}/finish`, { method: 'POST', status: 403 });
    await bob.request(`/api/backend/attempts/${attemptId}/result`, { status: 403 });
    await alice.request(`/simulado/${fixture.publicSimulation}`, { html: true });
  });

  test('respostas são editáveis, persistem por tipo e retornam na retomada sem correção antecipada', async () => {
    const mapped = questions.map(mapApiQuestion);
    const rawAnswers = ['A', { a: true, b: false }, { a: '2', b: '3' }, { a: 'C', b: 'P' }];
    const save = (index, raw) => alice.request(`/api/backend/attempts/${attemptId}/questions/${questions[index].id}/answer`, {
      method: 'POST', status: 201, body: { answer: buildAnswerBody(mapped[index].type, raw) },
    });
    await save(0, 'B');
    for (const [index, answer] of rawAnswers.entries()) {
      const saved = (await save(index, answer)).body;
      assert.equal(saved.isCorrect, null);
      assert.equal(saved.pointsEarned, null);
      noOfficialAnswers(saved);
    }
    await bob.request(`/api/backend/attempts/${attemptId}/questions/${questions[0].id}/answer`, {
      method: 'POST', status: 403, body: { answer: { answer: 'B' } },
    });
    const resumed = await alice.request(`/api/backend/simulations/${fixture.publicSimulation}/attempts`, { method: 'POST', status: 201 });
    assert.equal(resumed.body.id, attemptId);
    const restored = (await alice.request(`/api/backend/attempts/${attemptId}/questions`)).body;
    noOfficialAnswers(restored);
    assert.deepEqual(restored.map((question, index) => parseStoredAnswer(mapped[index].type, question.answer)), rawAnswers);
    const history = (await alice.request('/api/backend/me/attempts')).body;
    assert.equal(history.filter((row) => row.id === attemptId).length, 1);
    assert.equal(history.find((row) => row.id === attemptId).status, 'IN_PROGRESS');
  });

  test('finalização corrige no servidor, resultado/histórico ficam consistentes e bloqueiam edição', async () => {
    const finished = (await alice.request(`/api/backend/attempts/${attemptId}/finish`, { method: 'POST', status: 201 })).body;
    assert.equal(finished.attempt.status, 'FINISHED');
    assert.equal(Number(finished.attempt.score), 4);
    assert.equal(Number(finished.attempt.percentage), 100);
    assert.equal(finished.attempt.correctCount, 4);
    assert.equal(finished.attempt.wrongCount, 0);
    assert.ok(finished.questions.every((question) => question.isCorrect && Number(question.pointsEarned) === 1));
    noOfficialAnswers(finished);
    const result = (await alice.request(`/api/backend/attempts/${attemptId}/result`)).body;
    assert.deepEqual(result, finished);
    await alice.request(`/api/backend/attempts/${attemptId}/questions/${questions[0].id}/answer`, { method: 'POST', status: 400, body: { answer: { answer: 'B' } } });
    const history = (await alice.request('/api/backend/me/attempts')).body;
    assert.equal(history.find((row) => row.id === attemptId).status, 'FINISHED');
    assert.equal((await bob.request('/api/backend/me/attempts')).body.length, 0);
    const summary = (await alice.request('/api/backend/me/pontuacao')).body;
    assert.equal(summary.simulados, 1);
    assert.equal(summary.media, 100);
    await alice.request('/historico', { html: true });
  });

  test('convite concede acesso somente ao membro, mantém idempotência e catálogo privado', async () => {
    const joined = (await alice.request('/api/backend/me/turmas/join', { method: 'POST', body: { token: fixture.inviteToken } })).body;
    assert.equal(joined.turma.id, fixture.turmaId);
    assert.equal(joined.alreadyMember, false);
    const repeated = (await alice.request('/api/backend/me/turmas/join', { method: 'POST', body: { token: fixture.inviteToken } })).body;
    assert.equal(repeated.alreadyMember, true);
    assert.equal((await alice.request('/api/backend/me/turmas')).body[0].id, fixture.turmaId);
    assert.ok((await alice.request('/api/backend/simulations/available')).body.some((simulation) => simulation.id === fixture.privateSimulation));
    assert.ok(!(await bob.request('/api/backend/simulations/available')).body.some((simulation) => simulation.id === fixture.privateSimulation));
    const privateAttempt = (await alice.request(`/api/backend/simulations/${fixture.privateSimulation}/attempts`, { method: 'POST', status: 201 })).body;
    assert.equal((await alice.request(`/api/backend/attempts/${privateAttempt.id}/questions`)).body.length, 1);
    await bob.request(`/api/backend/attempts/${privateAttempt.id}/questions`, { status: 403 });
    await bob.request('/api/backend/me/turmas/join', { method: 'POST', status: 404, body: { token: 'invalid-synthetic-token-with-valid-length' } });
  });

  test('refresh concorrente mantém identidades por conta e logout remove cookies', async () => {
    // An invalid access token forces the real backend's 401/refresh path without waiting 15 minutes.
    alice.cookies.set('sb_access_token', 'expired-for-regression');
    bob.cookies.set('sb_access_token', 'expired-for-regression');
    const results = await Promise.all([
      alice.request('/api/auth/me'), alice.request('/api/backend/me/attempts'), bob.request('/api/auth/me'),
    ]);
    assert.equal(results[0].body.id, aliceId);
    assert.equal(results[2].body.id, bobId);
    assert.notEqual(alice.cookies.get('sb_refresh_token'), bob.cookies.get('sb_refresh_token'));
    for (const result of results) noOfficialAnswers(result.body);
    const logout = await alice.request('/api/auth/logout', { method: 'POST' });
    assert.equal(logout.body.success, true);
    assert.equal(alice.cookies.size, 0);
    await alice.request('/api/auth/me', { status: 401 });
    assert.equal((await bob.request('/api/auth/me')).body.id, bobId);
  });
});
