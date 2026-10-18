import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH, 'utf8'));
const baseUrl = process.env.E2E_WEB_URL;
const password = 'Synthetic-password-42';

class Session {
  cookies = new Map();
  async request(path, { method = 'GET', body, status = 200, headers = {}, binary = false } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method, redirect: 'manual', signal: AbortSignal.timeout(15000),
      headers: {
        ...(this.cookies.size ? { Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; ') } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [name, value] = cookie.split(';')[0].split('=');
      if (/Max-Age=0(?:;|$)/i.test(cookie)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    assert.equal(response.status, status, `${method} ${path}`);
    return { body: binary ? Buffer.from(await response.arrayBuffer()) : await response.json(), response };
  }
}
function noPrivateFields(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    assert.ok(!['correctAnswer', 'answerValue', 'answerKey', 'officialAnswers', 'assetId', 'sha256', 'passwordHash', 'accessToken', 'refreshToken'].includes(key), `Private field exposed: ${key}`);
    noPrivateFields(nested);
  }
}
const student = new Session();
const other = new Session();
let attempt;
let questions;
let confirmed;
let finished;
const questionPath = () => `/api/backend/attempts/${attempt.id}/questions`;

describe('Jornada HTTP de quiz com BFF, mídia autenticada e preferências', { concurrency: false }, () => {
  test('catálogo é autenticado, cobre as 15 faixas e expõe somente a versão publicada mais recente', async () => {
    await new Session().request('/api/backend/quizzes/available', { status: 401 });
    for (const [session, name, email] of [[student, 'Quiz estudante', 'quiz-student@example.test'], [other, 'Quiz outra conta', 'quiz-other@example.test']]) {
      await session.request('/api/auth/register', { method: 'POST', body: { name, email, password } });
    }
    const catalog = (await student.request('/api/backend/quizzes/available')).body;
    assert.ok(catalog.some((row) => row.id === fixture.publicQuiz));
    for (const id of [fixture.privateQuiz, fixture.draftQuiz, fixture.archivedQuiz, fixture.deletedQuiz, fixture.oldQuiz]) {
      assert.ok(!catalog.some((row) => row.id === id));
    }
    noPrivateFields(catalog);
    for (const [year, id] of Object.entries(fixture.quizSegments)) {
      const filtered = (await student.request(`/api/backend/quizzes/available?schoolYear=${year}`)).body;
      assert.ok(filtered.some((row) => row.id === id));
      assert.ok(filtered.every((row) => row.schoolYear === Number(year)));
    }
    await student.request('/api/backend/quizzes', { method: 'POST', body: {}, status: 404 });
    await student.request(`/api/backend/quizzes/${fixture.publicQuiz}`, { status: 404 });
    await student.request(`/api/backend/quizzes/${fixture.draftQuiz}/attempts`, { method: 'POST', status: 404 });
    assert.ok(!(await student.request('/api/backend/simulations/available')).body.some((row) => row.id === fixture.publicQuiz));
  });

  test('preferências são persistidas por conta e não mudam a disponibilidade curricular', async () => {
    const defaults = { segment: null, schoolYear: null, audioEnabled: false, motionEnabled: true };
    assert.deepEqual((await student.request('/api/backend/me/learning-preferences')).body, defaults);
    const changed = { segment: 'INFANTIL', schoolYear: -1, audioEnabled: true, motionEnabled: false };
    assert.deepEqual((await student.request('/api/backend/me/learning-preferences', { method: 'PATCH', body: changed })).body, changed);
    assert.deepEqual((await student.request('/api/backend/me/learning-preferences')).body, changed);
    assert.deepEqual((await other.request('/api/backend/me/learning-preferences')).body, defaults);
    assert.ok((await student.request('/api/backend/quizzes/available')).body.some((row) => row.id === fixture.publicQuiz));
    await student.request('/api/backend/me/learning-preferences', { method: 'PATCH', body: { segment: 'INFANTIL', schoolYear: 10 }, status: 400 });
    await student.request('/api/backend/me/learning-preferences', { method: 'PATCH', body: { audioEnabled: 'true' }, status: 400 });
    await student.request('/api/backend/me/learning-preferences', { method: 'PATCH', body: { role: 'ADMIN' }, status: 400 });
    assert.deepEqual((await student.request('/api/backend/me/learning-preferences')).body, changed);
  });

  test('início e retomada mantêm os snapshots sem revelar feedback antecipado', async () => {
    attempt = (await student.request(`/api/backend/quizzes/${fixture.publicQuiz}/attempts`, { method: 'POST', status: 201 })).body;
    assert.equal(attempt.simulation.activityKind, 'QUIZ');
    assert.equal(attempt.contentVersion, 2);
    const resumed = (await student.request(`/api/backend/quizzes/${fixture.publicQuiz}/attempts`, { method: 'POST', status: 201 })).body;
    assert.equal(resumed.id, attempt.id);
    assert.equal((await student.request(`/api/backend/attempts/${attempt.id}`)).body.id, attempt.id);
    questions = (await student.request(questionPath())).body;
    assert.equal(questions.length, 2);
    assert.ok(questions.every((row) => row.answer === null && row.confirmedAt === null && row.feedback === null && !('explanation' in row) && !('funFact' in row)));
    noPrivateFields(questions);
    assert.match(questions[0].media.image.url, new RegExp(`^/attempts/${attempt.id}/questions/${questions[0].id}/media/image$`));
    await other.request(questionPath(), { status: 403 });
    await student.request(`/api/backend/attempts/${attempt.id}/result`, { status: 400 });
  });

  test('SVG e WAV atravessam o mesmo BFF com autenticação, cache privado e ranges', async () => {
    const imagePath = `/api/backend${questions[0].media.image.url}`;
    const audioPath = `/api/backend${questions[0].media.audio.url}`;
    const image = await student.request(imagePath, { binary: true });
    assert.match(image.body.toString(), /<svg/);
    assert.equal(image.response.headers.get('content-type'), 'image/svg+xml');
    assert.equal(image.response.headers.get('cache-control'), 'private, no-store');
    assert.equal(image.response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(image.response.headers.get('content-security-policy'), /sandbox/);
    const audio = await student.request(audioPath, { headers: { Range: 'bytes=0-11' }, status: 206, binary: true });
    assert.equal(audio.body.length, 12);
    assert.equal(audio.body.toString('ascii', 0, 4), 'RIFF');
    assert.equal(audio.body.toString('ascii', 8, 12), 'WAVE');
    assert.equal(audio.response.headers.get('content-type'), 'audio/wav');
    assert.match(audio.response.headers.get('content-range'), /^bytes 0-11\/\d+$/);
    assert.equal(audio.response.headers.get('accept-ranges'), 'bytes');
    const invalid = await student.request(audioPath, { headers: { Range: 'bytes=100-10' }, status: 416 });
    assert.match(invalid.response.headers.get('content-range'), /^bytes \*\/\d+$/);
    noPrivateFields(invalid.body);
    await other.request(imagePath, { status: 403 });
    await new Session().request(imagePath, { status: 401 });
    await student.request(`${imagePath}?token=forbidden`, { status: 404 });
    await student.request(imagePath.replace('/media/image', '/media/document'), { status: 404 });
    await student.request(imagePath, { method: 'POST', status: 404 });
  });

  test('confirmar uma opção retorna feedback estável e rejeita a troca após confirmar', async () => {
    const path = `${questionPath()}/${questions[0].id}/answer`;
    confirmed = (await student.request(path, { method: 'POST', body: { answer: { optionKey: 'B' } }, status: 201 })).body;
    assert.equal(confirmed.feedback.isCorrect, true);
    assert.equal(confirmed.feedback.pointsEarned, 1);
    assert.equal(confirmed.feedback.explanation, 'O balão do meio é vermelho.');
    assert.ok(confirmed.confirmedAt);
    noPrivateFields(confirmed);
    const duplicate = (await student.request(path, { method: 'POST', body: { answer: { optionKey: 'B' } }, status: 201 })).body;
    assert.deepEqual(duplicate, confirmed);
    await student.request(path, { method: 'POST', body: { answer: { optionKey: 'A' } }, status: 409 });
    const restored = (await student.request(questionPath())).body;
    assert.deepEqual(restored[0].answer, { optionKey: 'B' });
    assert.deepEqual(restored[0].feedback, confirmed.feedback);
    assert.equal(restored[1].feedback, null);
    await student.request(`/api/backend/attempts/${attempt.id}/finish`, { method: 'POST', status: 400 });
  });

  test('resultado completo, repetição e histórico preservam pontuação ponderada e separam simulados', async () => {
    await student.request(`${questionPath()}/${questions[1].id}/answer`, { method: 'POST', status: 201, body: { answer: { optionKey: 'B' } } });
    finished = (await student.request(`/api/backend/attempts/${attempt.id}/finish`, { method: 'POST', status: 201 })).body;
    assert.equal(finished.attempt.status, 'FINISHED');
    assert.equal(Number(finished.attempt.score), 3);
    assert.equal(Number(finished.attempt.percentage), 100);
    assert.equal(finished.attempt.correctCount, 2);
    assert.deepEqual((await student.request(`/api/backend/attempts/${attempt.id}/result`)).body, finished);
    assert.deepEqual((await student.request(`/api/backend/attempts/${attempt.id}/finish`, { method: 'POST', status: 201 })).body, finished);
    noPrivateFields(finished);
    const history = (await student.request('/api/backend/me/quiz-attempts')).body;
    assert.equal(history.filter((row) => row.id === attempt.id).length, 1);
    assert.equal(history.find((row) => row.id === attempt.id).status, 'FINISHED');
    assert.deepEqual((await student.request('/api/backend/me/attempts')).body, []);
    assert.equal((await student.request('/api/backend/me/pontuacao')).body.simulados, 0);
    assert.deepEqual((await other.request('/api/backend/me/quiz-attempts')).body, []);
    await other.request(`/api/backend/attempts/${attempt.id}/result`, { status: 403 });
  });

  test('convite dá acesso ao quiz privado e à mídia apenas para a conta vinculada', async () => {
    await student.request(`/api/backend/quizzes/${fixture.privateQuiz}/attempts`, { method: 'POST', status: 404 });
    await student.request('/api/backend/me/turmas/join', { method: 'POST', body: { token: fixture.inviteToken } });
    assert.ok((await student.request('/api/backend/quizzes/available')).body.some((row) => row.id === fixture.privateQuiz));
    assert.ok(!(await other.request('/api/backend/quizzes/available')).body.some((row) => row.id === fixture.privateQuiz));
    const privateAttempt = (await student.request(`/api/backend/quizzes/${fixture.privateQuiz}/attempts`, { method: 'POST', status: 201 })).body;
    const privateQuestions = (await student.request(`/api/backend/attempts/${privateAttempt.id}/questions`)).body;
    await student.request(`/api/backend${privateQuestions[0].media.image.url}`, { binary: true });
    await other.request(`/api/backend${privateQuestions[0].media.image.url}`, { status: 403 });
  });

  test('refresh simultâneo de mídia, catálogo e preferências preserva isolamento; logout encerra sessão', async () => {
    student.cookies.set('sb_access_token', 'expired-for-quiz-regression');
    other.cookies.set('sb_access_token', 'expired-for-quiz-regression');
    const results = await Promise.all([
      student.request(`/api/backend${questions[0].media.audio.url}`, { headers: { Range: 'bytes=0-11' }, status: 206, binary: true }),
      student.request('/api/backend/me/learning-preferences'),
      student.request('/api/backend/quizzes/available'),
      other.request('/api/backend/me/learning-preferences'),
    ]);
    assert.equal(results[0].body.toString('ascii', 0, 4), 'RIFF');
    assert.equal(results[1].body.audioEnabled, true);
    assert.equal(results[3].body.audioEnabled, false);
    assert.notEqual(student.cookies.get('sb_refresh_token'), other.cookies.get('sb_refresh_token'));
    await student.request('/api/auth/logout', { method: 'POST' });
    assert.equal(student.cookies.size, 0);
    await student.request(`/api/backend${questions[0].media.image.url}`, { status: 401 });
    assert.equal((await other.request('/api/auth/me')).body.email, 'quiz-other@example.test');
  });
});
