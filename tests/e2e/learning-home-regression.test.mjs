import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH, 'utf8'));
const baseUrl = process.env.E2E_WEB_URL;
const password = 'Synthetic-password-42';

class Session {
  cookies = new Map();
  async request(path, { method = 'GET', body, status = 200 } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method, redirect: 'manual', signal: AbortSignal.timeout(15_000),
      headers: {
        ...(this.cookies.size ? { Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; ') } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
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
  await session.request('/api/auth/register', { method: 'POST', body: { name: 'Aluno sintético de missões', email, password } });
}
function noPrivateFields(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    assert.ok(!['correctAnswer', 'answerValue', 'answerKey', 'officialAnswers', 'passwordHash', 'accessToken', 'refreshToken', 'tokenHash'].includes(key), `Sensitive field exposed: ${key}`);
    noPrivateFields(nested);
  }
}
async function prepareAttempt(session, quizId) {
  const attempt = await session.request(`/api/backend/quizzes/${quizId}/attempts`, { method: 'POST', status: 201 });
  const questions = await session.request(`/api/backend/attempts/${attempt.id}/questions`);
  for (const [index, question] of questions.entries()) {
    await session.request(`/api/backend/attempts/${attempt.id}/questions/${question.id}/answer`, {
      method: 'POST', status: 201, body: { answer: { optionKey: fixture.quizAnswers[index] } },
    });
  }
  return attempt;
}
const finish = (session, id) => session.request(`/api/backend/attempts/${id}/finish`, { method: 'POST', status: 201 });
const student = new Session();
const other = new Session();
let attempt;

describe('Aprender hoje HTTP com missões e XP no servidor', { concurrency: false }, () => {
  test('home e missões exigem autenticação, cobrem 15 faixas e ocultam curadoria indisponível', async () => {
    await new Session().request('/api/backend/me/learning-home', { status: 401 });
    await new Session().request('/api/backend/me/missions', { status: 401 });
    await register(student, 'learning-home-student@example.test');
    await register(other, 'learning-home-other@example.test');
    for (const [year, expected] of Object.entries(fixture.missionsByYear)) {
      const home = await student.request(`/api/backend/me/learning-home?schoolYear=${year}`);
      assert.equal(home.xp.total, 0);
      assert.equal(home.xp.today, 0);
      assert.equal(home.xp.dailyLimit, 50);
      assert.equal(home.xp.perQuiz, 10);
      assert.match(home.xp.day, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(home.inProgress, null);
      assert.deepEqual(home.missions.map(row => row.id).sort(), expected.map(row => row.id).sort());
      assert.ok(home.missions.every(row => row.schoolYear === Number(year) && row.status === 'AVAILABLE' && row.completedActivities === 0));
      assert.equal(home.suggestedQuiz.schoolYear, Number(year));
      assert.ok(home.missions.every(row => row.startsAt === fixture.missionWeek.startsAt && row.endsAt === fixture.missionWeek.endsAt));
      noPrivateFields(home);
      const missions = await student.request(`/api/backend/me/missions?schoolYear=${year}`);
      assert.deepEqual(missions, home.missions);
    }
    const all = await student.request('/api/backend/me/missions');
    for (const hidden of [fixture.privateMission, fixture.draftMission, fixture.expiredMission]) {
      assert.ok(!all.some(row => row.id === hidden));
    }
    await student.request('/api/backend/me/learning-home?schoolYear=99', { status: 400 });
    await student.request('/api/backend/me/missions?schoolYear=banana', { status: 400 });
    await student.request('/api/backend/missions', { method: 'POST', body: {}, status: 404 });
  });

  test('a faixa salva escolhe missões sem mudar permissões; quiz em andamento é retomável', async () => {
    await student.request('/api/backend/me/learning-preferences', { method: 'PATCH', body: { segment: 'FUNDAMENTAL_I', schoolYear: 3 } });
    assert.deepEqual((await student.request('/api/backend/me/learning-home')).missions.map(row => row.id).sort(), fixture.missionsByYear['3'].map(row => row.id).sort());
    attempt = await student.request(`/api/backend/quizzes/${fixture.publicQuiz}/attempts`, { method: 'POST', status: 201 });
    const home = await student.request('/api/backend/me/learning-home');
    assert.equal(home.inProgress.id, attempt.id);
    assert.equal(home.inProgress.status, 'IN_PROGRESS');
    assert.equal(home.xp.total, 0);
    assert.ok(home.missions.every(row => row.completedActivities === 0));
    noPrivateFields(home);
    assert.equal((await other.request('/api/backend/me/learning-home?schoolYear=3')).inProgress, null);
  });

  test('concluir concede 10 XP uma vez, grava progresso e mantém nota/ranking de simulados', async () => {
    const prepared = await prepareAttempt(student, fixture.publicQuiz);
    assert.equal(prepared.id, attempt.id);
    const result = await finish(student, attempt.id);
    assert.deepEqual(result.reward, { xpAwarded: 10, reason: 'AWARDED', day: (await student.request('/api/backend/me/learning-home')).xp.day });
    assert.equal(Number(result.attempt.score), 3);
    assert.equal(Number(result.attempt.percentage), 100);
    assert.deepEqual(await finish(student, attempt.id), result);
    assert.deepEqual(await student.request(`/api/backend/attempts/${attempt.id}/result`), result);
    noPrivateFields(result);
    const home = await student.request('/api/backend/me/learning-home');
    assert.deepEqual({ total: home.xp.total, today: home.xp.today }, { total: 10, today: 10 });
    assert.equal(home.inProgress, null);
    const mission = home.missions.find(row => row.id === fixture.missionsByYear['3'][0].id);
    assert.equal(mission.status, 'IN_PROGRESS');
    assert.equal(mission.completedActivities, 1);
    assert.equal(mission.totalActivities, 2);
    assert.equal(mission.activities.find(row => row.activityKey === 'jornada-web').attemptId, attempt.id);
    assert.equal((await student.request('/api/backend/me/pontuacao')).simulados, 0);
    assert.deepEqual(await student.request('/api/backend/me/attempts'), []);
    assert.equal((await other.request('/api/backend/me/learning-home?schoolYear=3')).xp.total, 0);
  });

  test('segunda atividade conclui as duas missões sem bônus extra; prática repetida segue livre', async () => {
    const second = await prepareAttempt(student, fixture.quizSegments['3']);
    const result = await finish(student, second.id);
    assert.equal(result.reward.xpAwarded, 10);
    let home = await student.request('/api/backend/me/learning-home');
    assert.ok(home.missions.every(row => row.status === 'COMPLETED' && row.completedActivities === row.totalActivities));
    assert.equal(home.xp.total, 20);
    const repeated = await prepareAttempt(student, fixture.publicQuiz);
    assert.notEqual(repeated.id, attempt.id);
    const repeatedResult = await finish(student, repeated.id);
    assert.equal(repeatedResult.reward.reason, 'ALREADY_REWARDED');
    assert.equal(repeatedResult.reward.xpAwarded, 0);
    assert.equal(Number(repeatedResult.attempt.score), 3);
    assert.deepEqual(await finish(student, repeated.id), repeatedResult);
    home = await student.request('/api/backend/me/learning-home');
    assert.equal(home.xp.total, 20);
    assert.equal(home.xp.today, 20);
  });

  test('convite libera somente a missão da turma e não mistura progresso entre alunos', async () => {
    await student.request('/api/backend/me/turmas/join', { method: 'POST', body: { token: fixture.inviteToken } });
    const home = await student.request('/api/backend/me/learning-home?schoolYear=3');
    const mission = home.missions.find(row => row.id === fixture.privateMission);
    assert.ok(mission);
    assert.equal(mission.activities[0].quizId, fixture.privateQuiz);
    assert.equal(mission.completedActivities, 0);
    const otherHome = await other.request('/api/backend/me/learning-home?schoolYear=3');
    assert.ok(!otherHome.missions.some(row => row.id === fixture.privateMission));
    assert.ok(otherHome.missions.every(row => row.completedActivities === 0));
    assert.equal(otherHome.xp.total, 0);
    noPrivateFields(home);
  });

  test('seis conclusões simultâneas respeitam teto diário e os reenvios não repetem XP', async () => {
    const capped = new Session();
    await register(capped, 'learning-home-capped@example.test');
    const attempts = [];
    for (const year of [-2, -1, 0, 1, 2, 3]) attempts.push(await prepareAttempt(capped, fixture.quizSegments[String(year)]));
    const results = await Promise.all(attempts.map(row => finish(capped, row.id)));
    assert.equal(results.reduce((sum, row) => sum + row.reward.xpAwarded, 0), 50);
    assert.equal(results.filter(row => row.reward.reason === 'AWARDED').length, 5);
    assert.equal(results.filter(row => row.reward.reason === 'DAILY_LIMIT').length, 1);
    for (const [index, row] of attempts.entries()) assert.deepEqual(await finish(capped, row.id), results[index]);
    const home = await capped.request('/api/backend/me/learning-home?schoolYear=3');
    assert.equal(home.xp.total, 50);
    assert.equal(home.xp.today, 50);
    assert.equal((await capped.request('/api/backend/me/pontuacao')).simulados, 0);
  });

  test('perfil fornece faixa inicial sem escrever preferências e a escolha explícita prevalece', async () => {
    const profiled = new Session();
    await profiled.request('/api/auth/login', { method: 'POST', body: { email: fixture.profileStudent.email, password } });
    const home = await profiled.request('/api/backend/me/learning-home');
    assert.equal(home.schoolYear, 10);
    assert.deepEqual(home.missions.map(row => row.id).sort(), fixture.missionsByYear['10'].map(row => row.id).sort());
    assert.equal((await profiled.request('/api/backend/me/learning-preferences')).schoolYear, null);
    assert.equal((await profiled.request('/api/backend/me/learning-home?schoolYear=0')).schoolYear, 0);
    assert.equal((await profiled.request('/api/backend/me/learning-preferences')).schoolYear, null);
    await profiled.request('/api/backend/me/learning-preferences', { method: 'PATCH', body: { segment: 'ENFERMAGEM', schoolYear: 0 } });
    assert.equal((await profiled.request('/api/backend/me/learning-home')).schoolYear, 0);
    noPrivateFields(home);
  });
});
