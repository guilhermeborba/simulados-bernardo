import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH, 'utf8'));
const baseUrl = process.env.E2E_WEB_URL;
const password = 'Synthetic-password-42';
class Session {
  cookies = new Map();
  async request(path, { method = 'GET', body, status = 200, headers = {} } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method, redirect: 'manual', signal: AbortSignal.timeout(15_000),
      headers: { ...(this.cookies.size ? { Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; ') } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [name, value] = cookie.split(';')[0].split('=');
      if (/Max-Age=0(?:;|$)/i.test(cookie)) this.cookies.delete(name); else this.cookies.set(name, value);
    }
    const payload = await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(payload)}`);
    return payload;
  }
}
const register = (session, email) => session.request('/api/auth/register', { method: 'POST', body: { name: 'Aluno sintético de revisão', email, password } });
const progress = (session, year = 3) => session.request(`/api/backend/me/learning-progress?schoolYear=${year}`);
const skill = (result, year = 3) => result.skills.find(row => row.code === fixture.progressSkills[String(year)].code);
const startReview = (session, quizId = fixture.reviewCurrent) => session.request('/api/backend/me/review-attempts', { method: 'POST', status: 201, body: { quizId } });
const questions = (session, id) => session.request(`/api/backend/attempts/${id}/questions`);
const finish = (session, id) => session.request(`/api/backend/attempts/${id}/finish`, { method: 'POST', status: 201 });
async function confirmAll(session, id, firstWrong = false) {
  const rows = await questions(session, id);
  for (const [index, question] of rows.entries()) {
    await session.request(`/api/backend/attempts/${id}/questions/${question.id}/answer`, {
      method: 'POST', status: 201, body: { answer: { optionKey: firstWrong && index === 0 ? 'A' : 'B' } },
    });
  }
  return rows;
}
async function normal(session, quizId, firstWrong = false) {
  const attempt = await session.request(`/api/backend/quizzes/${quizId}/attempts`, { method: 'POST', status: 201 });
  assert.equal(attempt.practiceMode, 'NORMAL');
  await confirmAll(session, attempt.id, firstWrong);
  return finish(session, attempt.id);
}
function noPrivateFields(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    assert.ok(!['correctAnswer', 'answerValue', 'answerKey', 'officialAnswers', 'passwordHash', 'accessToken', 'refreshToken', 'tokenHash', 'assetId', 'sha256', 'reviewedBy', 'userId'].includes(key), `Private field exposed: ${key}`);
    noPrivateFields(nested);
  }
}
const student = new Session();
const other = new Session();
let first;
let review;
let normalOpen;
let rewardsBefore;
let collectionBefore;
let reviewResult;

describe('Habilidades e revisão HTTP: evidências distintas, acesso atual e prática sem recompensa', { concurrency: false }, () => {
  test('progresso e revisão exigem autenticação e DTOs não aceitam identidade ou seleção de perguntas pelo cliente', async () => {
    const visitor = new Session();
    await visitor.request('/api/backend/me/learning-progress', { status: 401 });
    await visitor.request('/api/backend/me/review-attempts', { method: 'POST', body: { quizId: fixture.reviewCurrent }, status: 401 });
    await register(student, 'progress-review-student@example.test');
    await register(other, 'progress-review-other@example.test');
    for (const query of ['schoolYear=99', 'schoolYear=banana', 'userId=other']) await student.request(`/api/backend/me/learning-progress?${query}`, { status: 400 });
    for (const body of [{}, { quizId: null }, { quizId: 3 }, { quizId: fixture.reviewCurrent, questionIds: [] }, { quizId: fixture.reviewCurrent, studentId: 'other' }]) {
      await student.request('/api/backend/me/review-attempts', { method: 'POST', body, status: 400 });
    }
    const initial = await progress(student);
    assert.equal(initial.schoolYear, 3);
    assert.equal(initial.inProgressReview, null);
    assert.deepEqual(initial.reviewSuggestions, []);
    assert.ok(initial.skills.every(row => row.firstResponse.questions === 0 && row.review.responses === 0));
    noPrivateFields(initial);
    await student.request('/api/backend/me/review-attempts', { method: 'POST', body: { quizId: fixture.reviewCurrent }, status: 404 });
  });

  test('todas as 15 faixas exibem classificação e quantidade de evidências sem inferir domínio', async () => {
    const segments = new Session();
    await register(segments, 'progress-review-segments@example.test');
    for (const [year, quizId] of Object.entries(fixture.progressQuizzes)) {
      assert.equal((await progress(segments, year)).schoolYear, Number(year));
      await normal(segments, quizId, true);
      const value = await progress(segments, year);
      const classified = skill(value, year);
      assert.ok(classified);
      assert.equal(classified.title, fixture.progressSkills[year].title);
      assert.equal(classified.schoolYear, Number(year));
      assert.deepEqual(classified.firstResponse, { questions: 2, correct: 1 });
      assert.deepEqual(classified.repeat, { responses: 0, correct: 0 });
      assert.deepEqual(classified.review, { responses: 0, correct: 0, differentQuestions: 0 });
      assert.equal(classified.evidence, 'INSUFFICIENT');
      assert.ok(value.reviewSuggestions.some(row => row.quizId === quizId));
      assert.ok(value.reviewSuggestions.every(row => row.schoolYear === Number(year) && row.questionCount > 0 && row.questionCount <= 5));
      noPrivateFields(value);
    }
  });

  test('primeira resposta e repetição são separadas por atividade lógica; sugestão usa a versão publicada atual', async () => {
    first = await normal(student, fixture.reviewOld, true);
    assert.equal(first.reward.xpAwarded, 10);
    const repeated = await normal(student, fixture.reviewOld, true);
    assert.equal(repeated.reward.reason, 'ALREADY_REWARDED');
    const value = await progress(student);
    assert.deepEqual(skill(value).firstResponse, { questions: 2, correct: 1 });
    assert.deepEqual(skill(value).repeat, { responses: 2, correct: 1 });
    assert.equal(skill(value).evidence, 'INSUFFICIENT');
    const recommendation = value.reviewSuggestions.find(row => row.quizId === fixture.reviewCurrent);
    assert.ok(recommendation);
    assert.equal(recommendation.contentVersion, 2);
    assert.equal(recommendation.questionCount, 5);
    assert.equal(recommendation.hasRepeatedQuestions, false);
    const alternative = value.reviewSuggestions.find(row => row.quizId === fixture.progressQuizzes['3']);
    assert.ok(alternative, 'A different published quiz with the same reviewed skill should be recommended.');
    assert.equal(alternative.questionCount, 2);
    assert.equal(alternative.hasRepeatedQuestions, false);
    assert.ok(!value.reviewSuggestions.some(row => row.quizId === fixture.reviewOld));
    assert.deepEqual(await student.request(`/api/backend/attempts/${first.attempt.id}/result`), first);
    assert.deepEqual((await progress(other)).reviewSuggestions, []);
    rewardsBefore = await student.request('/api/backend/me/learning-home?schoolYear=3');
    collectionBefore = await student.request('/api/backend/me/achievements');
    noPrivateFields(value);
  });

  test('revisão seleciona até cinco perguntas diferentes do mesmo quiz e retoma sem substituir rodada normal', async () => {
    review = await startReview(student);
    assert.equal(review.practiceMode, 'REVIEW');
    assert.equal(review.simulationId, fixture.reviewCurrent);
    assert.equal(review.contentVersion, 2);
    assert.equal((await startReview(student)).id, review.id);
    const rows = await questions(student, review.id);
    assert.equal(rows.length, 5);
    assert.ok(rows.every(row => row.originKey.startsWith('cor-nova-') && row.practicedBefore === false));
    assert.ok(rows.every(row => row.feedback === null && row.answer === null));
    noPrivateFields(rows);
    await other.request(`/api/backend/attempts/${review.id}/questions`, { status: 403 });
    normalOpen = await student.request(`/api/backend/quizzes/${fixture.reviewCurrent}/attempts`, { method: 'POST', status: 201 });
    assert.equal(normalOpen.practiceMode, 'NORMAL');
    assert.notEqual(normalOpen.id, review.id);
    assert.equal((await questions(student, normalOpen.id)).length, 7);
    assert.equal((await progress(student)).inProgressReview.id, review.id);
    assert.equal((await student.request('/api/backend/me/learning-home?schoolYear=3')).inProgress.id, normalOpen.id);
  });

  test('conclusão de revisão é idempotente, não altera XP/missões/conquistas e conserva histórico de simulados separado', async () => {
    await confirmAll(student, review.id);
    reviewResult = await finish(student, review.id);
    assert.equal(reviewResult.attempt.practiceMode, 'REVIEW');
    assert.equal(Number(reviewResult.attempt.score), 5);
    assert.deepEqual(reviewResult.reward, { xpAwarded: 0, reason: 'REVIEW', day: null });
    assert.deepEqual(await finish(student, review.id), reviewResult);
    assert.deepEqual(await student.request(`/api/backend/attempts/${review.id}/result`), reviewResult);
    const home = await student.request('/api/backend/me/learning-home?schoolYear=3');
    assert.deepEqual(home.xp, rewardsBefore.xp);
    assert.deepEqual(home.missions, rewardsBefore.missions);
    assert.deepEqual(await student.request('/api/backend/me/achievements'), collectionBefore);
    const value = await progress(student);
    assert.deepEqual(skill(value).firstResponse, { questions: 2, correct: 1 });
    assert.deepEqual(skill(value).repeat, { responses: 2, correct: 1 });
    assert.deepEqual(skill(value).review, { responses: 5, correct: 5, differentQuestions: 5 });
    assert.equal(skill(value).evidence, 'INSUFFICIENT');
    assert.equal(value.inProgressReview, null);
    const history = await student.request('/api/backend/me/quiz-attempts');
    assert.equal(history.filter(row => row.id === review.id && row.practiceMode === 'REVIEW').length, 1);
    assert.equal(history.filter(row => row.practiceMode === 'NORMAL').length, 3);
    assert.deepEqual(await student.request('/api/backend/me/attempts'), []);
    assert.equal((await student.request('/api/backend/me/pontuacao')).simulados, 0);
    noPrivateFields(value); noPrivateFields(reviewResult);
  });

  test('repetição na revisão é identificada como prática e não vira primeira resposta', async () => {
    const second = await startReview(student);
    assert.notEqual(second.id, review.id);
    const rows = await questions(student, second.id);
    assert.ok(rows.length > 0 && rows.length <= 5);
    assert.ok(rows.every(row => row.practicedBefore === true));
    await confirmAll(student, second.id);
    const result = await finish(student, second.id);
    assert.equal(result.reward.reason, 'REVIEW');
    const value = await progress(student);
    assert.deepEqual(skill(value).firstResponse, { questions: 2, correct: 1 });
    assert.deepEqual(skill(value).repeat, { responses: 2, correct: 1 });
    assert.equal(skill(value).review.responses, 5 + rows.length);
    assert.equal(skill(value).evidence, 'INSUFFICIENT');
    assert.deepEqual(await student.request(`/api/backend/attempts/${review.id}/result`), reviewResult);
  });

  test('pergunta já respondida em revisão continua repetição ao concluir a versão completa do quiz', async () => {
    await confirmAll(student, normalOpen.id);
    const completed = await finish(student, normalOpen.id);
    assert.equal(completed.attempt.practiceMode, 'NORMAL');
    assert.equal(completed.reward.reason, 'ALREADY_REWARDED');
    const value = await progress(student);
    assert.deepEqual(skill(value).firstResponse, { questions: 2, correct: 1 });
    assert.deepEqual(skill(value).repeat, { responses: 9, correct: 8 });
    assert.equal(skill(value).evidence, 'INSUFFICIENT');
    assert.deepEqual(await student.request(`/api/backend/attempts/${review.id}/result`), reviewResult);
    noPrivateFields(value);
  });

  test('rascunhos, arquivados, excluídos e conteúdo de turma não autorizado não permitem iniciar revisão', async () => {
    for (const quizId of [fixture.reviewDraft, fixture.reviewArchived, fixture.reviewDeleted, fixture.reviewPrivate]) {
      await student.request('/api/backend/me/review-attempts', { method: 'POST', body: { quizId }, status: 404 });
    }
    await student.request('/api/backend/me/turmas/join', { method: 'POST', body: { token: fixture.inviteToken } });
    await normal(student, fixture.reviewPrivate, true);
    const value = await progress(student);
    assert.ok(value.reviewSuggestions.some(row => row.quizId === fixture.reviewPrivate));
    assert.ok(!(await progress(other)).reviewSuggestions.some(row => row.quizId === fixture.reviewPrivate));
    const privateReview = await startReview(student, fixture.reviewPrivate);
    assert.equal(privateReview.practiceMode, 'REVIEW');
    await other.request(`/api/backend/attempts/${privateReview.id}/questions`, { status: 403 });
    await other.request('/api/backend/me/review-attempts', { method: 'POST', body: { quizId: fixture.reviewPrivate }, status: 404 });
    noPrivateFields(value);
  });

  test('BFF bloqueia início de origem externa e rota de progresso retorna ao login após logout', async () => {
    await student.request('/api/backend/me/review-attempts', {
      method: 'POST', body: { quizId: fixture.reviewCurrent }, status: 403, headers: { Origin: 'https://external.example.test' },
    });
    await student.request('/api/auth/logout', { method: 'POST' });
    await student.request('/api/backend/me/learning-progress', { status: 401 });
    const denied = await fetch(`${baseUrl}/progresso`, { redirect: 'manual' });
    assert.equal(denied.status, 307);
    assert.match(denied.headers.get('location'), /\/login\?returnTo=%2Fprogresso$/);
  });
});
