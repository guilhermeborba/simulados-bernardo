import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH, 'utf8'));
const baseUrl = process.env.E2E_WEB_URL;
const password = 'Synthetic-password-42';
const achievementIds = ['FIRST_QUIZ', 'THREE_TOPICS', 'FIVE_QUIZZES', 'FIRST_MISSION', 'XP_100'];
const itemIds = ['inicio', 'primeiro-passo', 'explorador', 'constancia', 'missao', 'horizonte'];

class Session {
  cookies = new Map();
  async request(path, { method = 'GET', body, status = 200, headers = {} } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method, redirect: 'manual', signal: AbortSignal.timeout(15_000),
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
    const payload = await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(payload)}`);
    return payload;
  }
}
async function register(session, email) {
  await session.request('/api/auth/register', { method: 'POST', body: { name: 'Aluno sintético de coleções', email, password } });
}
function noPrivateFields(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    assert.ok(!['correctAnswer', 'answerValue', 'answerKey', 'officialAnswers', 'passwordHash', 'accessToken', 'refreshToken', 'tokenHash', 'activityKey', 'disciplineId', 'studentId', 'userId'].includes(key), `Private field exposed: ${key}`);
    noPrivateFields(nested);
  }
}
async function complete(session, quizId, correct = true) {
  const attempt = await session.request(`/api/backend/quizzes/${quizId}/attempts`, { method: 'POST', status: 201 });
  const questions = await session.request(`/api/backend/attempts/${attempt.id}/questions`);
  for (const [index, question] of questions.entries()) {
    await session.request(`/api/backend/attempts/${attempt.id}/questions/${question.id}/answer`, {
      method: 'POST', status: 201, body: { answer: { optionKey: correct ? fixture.quizAnswers[index] : 'A' } },
    });
  }
  return await session.request(`/api/backend/attempts/${attempt.id}/finish`, { method: 'POST', status: 201 });
}
const achievements = session => session.request('/api/backend/me/achievements');
const avatar = session => session.request('/api/backend/me/avatar');
const earnedIds = value => value.achievements.filter(row => row.earnedAt !== null).map(row => row.id).sort();
const ownedIds = value => value.items.filter(row => row.owned).map(row => row.id).sort();
const student = new Session();
const other = new Session();
let firstEarnedAt;
let firstResult;
let selection;

describe('Coleções HTTP: conquistas verificadas no servidor e personalização por conta', { concurrency: false }, () => {
  test('catálogos exigem autenticação, iniciam sem progresso e servem todas as 15 faixas', async () => {
    await new Session().request('/api/backend/me/achievements', { status: 401 });
    await new Session().request('/api/backend/me/avatar', { status: 401 });
    await register(student, 'collection-student@example.test');
    await register(other, 'collection-other@example.test');
    const initial = await achievements(student);
    assert.deepEqual(initial.achievements.map(row => row.id), achievementIds);
    assert.deepEqual(initial.stats, { completedQuizzes: 0, topics: 0, completedMissions: 0, totalXp: 0 });
    assert.ok(initial.achievements.every(row => row.progress === 0 && row.earnedAt === null));
    const initialAvatar = await avatar(student);
    assert.deepEqual(initialAvatar.selection, { itemId: 'inicio', style: 'AUTO' });
    assert.deepEqual(initialAvatar.items.map(row => row.id), itemIds);
    assert.deepEqual(ownedIds(initialAvatar), ['inicio']);
    assert.equal(initialAvatar.items.find(row => row.id === 'inicio').unlockedAt, null);
    for (const year of [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const segment = year < 0 ? 'INFANTIL' : year === 0 ? 'ENFERMAGEM' : year <= 5 ? 'FUNDAMENTAL_I' : year <= 9 ? 'FUNDAMENTAL_II' : 'MEDIO';
      await student.request('/api/backend/me/learning-preferences', { method: 'PATCH', body: { segment, schoolYear: year } });
      assert.deepEqual(await avatar(student), initialAvatar);
      assert.deepEqual(await achievements(student), initial);
    }
    noPrivateFields(initial); noPrivateFields(initialAvatar);
  });

  test('itens bloqueados e DTOs inválidos não alteram a seleção', async () => {
    const before = await avatar(student);
    await student.request('/api/backend/me/avatar', { method: 'PATCH', body: { itemId: 'explorador', style: 'SEAL' }, status: 403 });
    for (const body of [{ style: 'ADMIN' }, { style: null }, { itemId: null }, { itemId: 42 }, { itemId: 'inicio', owned: true }, { userId: 'other' }]) {
      await student.request('/api/backend/me/avatar', { method: 'PATCH', body, status: 400 });
    }
    assert.deepEqual(await avatar(student), before);
  });

  test('primeira conclusão ganha conquista mesmo com nota zero; reenvio e nova versão não duplicam progresso', async () => {
    firstResult = await complete(student, fixture.collectionQuizzes[0], false);
    assert.equal(Number(firstResult.attempt.score), 0);
    assert.equal(Number(firstResult.attempt.percentage), 0);
    assert.equal(firstResult.reward.xpAwarded, 10);
    assert.deepEqual(await student.request(`/api/backend/attempts/${firstResult.attempt.id}/finish`, { method: 'POST', status: 201 }), firstResult);
    const initial = await achievements(student);
    assert.deepEqual(earnedIds(initial), ['FIRST_QUIZ']);
    assert.deepEqual(initial.stats, { completedQuizzes: 1, topics: 1, completedMissions: 0, totalXp: 10 });
    firstEarnedAt = initial.achievements.find(row => row.id === 'FIRST_QUIZ').earnedAt;
    assert.ok(firstEarnedAt);
    assert.deepEqual(ownedIds(await avatar(student)), ['inicio', 'primeiro-passo']);
    const repeated = await complete(student, fixture.collectionQuizzes[0]);
    assert.equal(repeated.reward.reason, 'ALREADY_REWARDED');
    assert.deepEqual(await achievements(student), initial);
    const version = await complete(student, fixture.collectionNewVersion);
    assert.equal(version.reward.reason, 'ALREADY_REWARDED');
    assert.deepEqual(await achievements(student), initial);
    assert.deepEqual(await student.request(`/api/backend/attempts/${firstResult.attempt.id}/result`), firstResult);
    assert.equal((await student.request('/api/backend/me/pontuacao')).simulados, 0);
    assert.deepEqual(await student.request('/api/backend/me/attempts'), []);
  });

  test('três temas e cinco atividades desbloqueiam itens sem modificar o XP, com seleção persistente em nova sessão', async () => {
    for (const quizId of fixture.collectionQuizzes.slice(1)) {
      const result = await complete(student, quizId);
      assert.equal(Number(result.attempt.score), 3);
      assert.equal(result.reward.xpAwarded, 10);
    }
    const current = await achievements(student);
    assert.deepEqual(current.stats, { completedQuizzes: 5, topics: 3, completedMissions: 0, totalXp: 50 });
    assert.deepEqual(earnedIds(current), ['FIRST_QUIZ', 'FIVE_QUIZZES', 'THREE_TOPICS']);
    assert.equal(current.achievements.find(row => row.id === 'FIRST_QUIZ').earnedAt, firstEarnedAt);
    assert.deepEqual(ownedIds(await avatar(student)), ['constancia', 'explorador', 'inicio', 'primeiro-passo']);
    selection = await student.request('/api/backend/me/avatar', { method: 'PATCH', body: { itemId: 'explorador', style: 'SEAL' } });
    assert.deepEqual(selection.selection, { itemId: 'explorador', style: 'SEAL' });
    assert.ok(selection.updatedAt);
    const freshBrowser = new Session();
    await freshBrowser.request('/api/auth/login', { method: 'POST', body: { email: 'collection-student@example.test', password } });
    assert.deepEqual(await avatar(freshBrowser), selection);
    assert.deepEqual(await achievements(freshBrowser), current);
    noPrivateFields(current); noPrivateFields(selection);
  });

  test('concluir missão após o teto diário ainda concede conquista sem XP extra e conserva itens já ganhos', async () => {
    const result = await complete(student, fixture.quizSegments['3']);
    assert.equal(result.reward.xpAwarded, 0);
    assert.equal(result.reward.reason, 'DAILY_LIMIT');
    const current = await achievements(student);
    assert.deepEqual(current.stats, { completedQuizzes: 6, topics: 4, completedMissions: 1, totalXp: 50 });
    assert.deepEqual(earnedIds(current), ['FIRST_MISSION', 'FIRST_QUIZ', 'FIVE_QUIZZES', 'THREE_TOPICS']);
    assert.ok((await avatar(student)).items.find(row => row.id === 'missao').owned);
    assert.deepEqual((await avatar(student)).selection, selection.selection);
    assert.equal((await student.request('/api/backend/me/learning-home?schoolYear=3')).xp.total, 50);
    assert.equal(Number((await student.request(`/api/backend/attempts/${firstResult.attempt.id}/result`)).attempt.score), 0);
    noPrivateFields(current);
  });

  test('PATCH de origem externa é rejeitado e não modifica itens ou cookies da conta', async () => {
    const before = await avatar(student);
    await student.request('/api/backend/me/avatar', { method: 'PATCH', body: { itemId: 'inicio' }, headers: { Origin: 'https://external.example.test' }, status: 403 });
    assert.deepEqual(await avatar(student), before);
    const changed = await student.request('/api/backend/me/avatar', { method: 'PATCH', body: { style: 'MASCOT' }, headers: { Origin: baseUrl } });
    assert.deepEqual(changed.selection, { itemId: 'explorador', style: 'MASCOT' });
    assert.equal((await student.request('/api/auth/me')).email, 'collection-student@example.test');
  });

  test('outra conta mantém coleção inicial e logout impede novas alterações', async () => {
    const outsider = await achievements(other);
    assert.deepEqual(outsider.stats, { completedQuizzes: 0, topics: 0, completedMissions: 0, totalXp: 0 });
    assert.deepEqual(earnedIds(outsider), []);
    assert.deepEqual((await avatar(other)).selection, { itemId: 'inicio', style: 'AUTO' });
    await other.request('/api/backend/me/avatar', { method: 'PATCH', body: { itemId: 'primeiro-passo' }, status: 403 });
    await student.request('/api/auth/logout', { method: 'POST' });
    await student.request('/api/backend/me/avatar', { method: 'PATCH', body: { itemId: 'inicio' }, status: 401 });
    const denied = await fetch(`${baseUrl}/colecao`, { redirect: 'manual' });
    assert.equal(denied.status, 307);
    assert.match(denied.headers.get('location'), /\/login\?returnTo=%2Fcolecao$/);
    noPrivateFields(outsider);
  });
});
