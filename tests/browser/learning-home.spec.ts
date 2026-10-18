import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH!, 'utf8')) as {
  publicQuiz: string;
  quizSegments: Record<string, string>;
  quizAnswers: string[];
  missionsByYear: Record<string, { id: string; title: string }[]>;
  privateMission: string;
  profileStudent: { id: string; email: string; schoolYear: number };
};
const password = 'Synthetic-password-42';
let accountIndex = 0;
async function register(page: Page) {
  const email = `missions-browser-${Date.now()}-${++accountIndex}@example.test`;
  const response = await page.request.post('/api/auth/register', { data: { name: 'Aluno de missões', email, password } });
  expect(response.ok()).toBeTruthy();
  return { email, id: (await response.json()).user.id as string };
}
async function chooseYear(page: Page, year = 3) {
  const select = page.getByRole('combobox', { name: 'Ano ou idade para as missões', exact: true });
  await expect(select).toBeEnabled();
  await select.selectOption(String(year));
  for (const row of fixture.missionsByYear[String(year)]) await expect(page.getByRole('heading', { name: row.title, exact: true })).toBeVisible();
}
async function home(page: Page, year = 3) {
  await page.goto('/aprender');
  await expect(page.getByRole('heading', { name: 'Aprender hoje', exact: true })).toBeVisible();
  await chooseYear(page, year);
}
async function finishThroughApi(page: Page, quizId: string) {
  const start = await page.request.post(`/api/backend/quizzes/${quizId}/attempts`);
  expect(start.ok()).toBeTruthy();
  const attempt = await start.json();
  const questions = await (await page.request.get(`/api/backend/attempts/${attempt.id}/questions`)).json();
  for (const [index, question] of questions.entries()) {
    const confirmed = await page.request.post(`/api/backend/attempts/${attempt.id}/questions/${question.id}/answer`, { data: { answer: { optionKey: fixture.quizAnswers[index] } } });
    expect(confirmed.ok()).toBeTruthy();
  }
  const finished = await page.request.post(`/api/backend/attempts/${attempt.id}/finish`);
  expect(finished.ok()).toBeTruthy();
  return await finished.json();
}
async function assertAccessible(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
}
const xpTotal = (page: Page) => page.getByRole('region', { name: 'Seu XP', exact: true }).locator('dd').first();

test('Aprender hoje cobre duas missões para cada faixa e mantém navegação acessível', async ({ page }, testInfo) => {
  await page.goto('/aprender');
  await assertAccessible(page);
  await register(page);
  await home(page);
  await expect(page.getByRole('heading', { name: 'Missões da semana', exact: true })).toBeVisible();
  for (const year of [-1, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0]) {
    await chooseYear(page, year);
    const saved = await (await page.request.get('/api/backend/me/learning-preferences')).json();
    expect(saved.schoolYear).toBe(year);
    const state = await (await page.request.get('/api/backend/me/learning-home')).json();
    expect(state.missions.map((row: { id: string }) => row.id).sort()).toEqual(fixture.missionsByYear[String(year)].map(row => row.id).sort());
    expect(state.xp).toMatchObject({ total: 0, today: 0, perQuiz: 10, dailyLimit: 50 });
  }
  await expect(page.locator('a[href="/quizzes"]').first()).toBeVisible();
  await chooseYear(page, 3);
  await assertAccessible(page);
  if (process.env.QUIZ_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.QUIZ_SCREENSHOT_DIR}/learning-home-${testInfo.project.name}.png`, fullPage: true });
  await chooseYear(page, 0);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Ano ou idade para as missões', exact: true })).toHaveValue('0');
});

test('retomar pela home mantém resposta confirmada, concede XP uma vez e atualiza missões', async ({ page }) => {
  await register(page);
  await home(page);
  await page.getByRole('link', { name: 'Começar atividade: Quiz sintético jornada-web', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Qual balão é vermelho?', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\?attempt=/);
  const id = new URL(page.url()).searchParams.get('attempt')!;
  await page.getByRole('radio', { name: 'O balão vermelho', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
  await expect(page.getByText('O balão do meio é vermelho.', { exact: true })).toBeVisible();
  await page.goto('/aprender');
  const resume = page.getByRole('link', { name: 'Continuar quiz: Quiz sintético jornada-web', exact: true });
  await expect(resume).toBeVisible();
  await expect(resume).toHaveAttribute('href', `/quiz/${fixture.publicQuiz}?attempt=${id}`);
  await resume.click();
  await expect(page.getByRole('heading', { name: 'Quanto é 2 + 3?', exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('attempt')).toBe(id);
  await page.getByRole('radio', { name: '5', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir quiz', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quiz concluído', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '+10 XP pela prática', exact: true })).toBeVisible();
  const saved = await (await page.request.get(`/api/backend/attempts/${id}/result`)).json();
  expect(saved.reward).toMatchObject({ xpAwarded: 10, reason: 'AWARDED' });
  await page.reload();
  await expect(page.getByRole('heading', { name: '+10 XP pela prática', exact: true })).toBeVisible();
  expect(await (await page.request.post(`/api/backend/attempts/${id}/finish`)).json()).toEqual(saved);
  await home(page);
  await expect(xpTotal(page)).toHaveText('10');
  let state = await (await page.request.get('/api/backend/me/learning-home')).json();
  expect(state.xp).toMatchObject({ total: 10, today: 10 });
  expect(state.missions.find((row: { id: string }) => row.id === fixture.missionsByYear['3'][0].id)).toMatchObject({ status: 'IN_PROGRESS', completedActivities: 1, totalActivities: 2 });
  await expect(page.getByRole('link', { name: 'Rever atividade: Quiz sintético jornada-web', exact: true })).toBeVisible();
  await finishThroughApi(page, fixture.quizSegments['3']);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Ano ou idade para as missões', exact: true })).toHaveValue('3');
  state = await (await page.request.get('/api/backend/me/learning-home')).json();
  expect(state.xp).toMatchObject({ total: 20, today: 20 });
  expect(state.missions.every((row: { status: string }) => row.status === 'COMPLETED')).toBeTruthy();
  await expect(xpTotal(page)).toHaveText('20');
  await expect(page.getByText('✓ Missão concluída', { exact: true })).toHaveCount(2);
  await assertAccessible(page);
});

test('XP e progresso da primeira conta não aparecem ao entrar em outra conta', async ({ page }) => {
  const first = await register(page);
  await finishThroughApi(page, fixture.publicQuiz);
  await home(page);
  await expect(xpTotal(page)).toHaveText('10');
  expect((await (await page.request.get('/api/backend/me/learning-home')).json()).xp.total).toBe(10);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  const second = await register(page);
  await home(page);
  await expect(xpTotal(page)).toHaveText('0');
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(second.id);
  const state = await (await page.request.get('/api/backend/me/learning-home')).json();
  expect(state.xp).toMatchObject({ total: 0, today: 0 });
  expect(state.inProgress).toBeNull();
  expect(state.missions.every((row: { completedActivities: number }) => row.completedActivities === 0)).toBeTruthy();
  await expect(page.getByRole('link', { name: 'Rever atividade: Quiz sintético jornada-web', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.goto('/login?returnTo=%2Faprender');
  await page.getByLabel('E-mail', { exact: true }).fill(first.email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page).toHaveURL(/\/aprender$/);
  await expect(page.getByRole('link', { name: 'Rever atividade: Quiz sintético jornada-web', exact: true })).toBeVisible();
  await expect(xpTotal(page)).toHaveText('10');
  expect((await (await page.request.get('/api/backend/me/learning-home')).json()).xp.total).toBe(10);
});

test('resposta atrasada da home anterior não troca XP nem cookies da nova conta', async ({ page, request }) => {
  await register(page);
  await finishThroughApi(page, fixture.publicQuiz);
  await home(page);
  const oldCookies = await page.context().cookies();
  const oldHome = await (await page.request.get('/api/backend/me/learning-home?schoolYear=4')).json();
  const email = `missions-next-${Date.now()}-${++accountIndex}@example.test`;
  const created = await request.post('/api/auth/register', { data: { name: 'Nova conta de missões', email, password } });
  expect(created.ok()).toBeTruthy();
  const currentUser = (await created.json()).user;
  expect((await request.patch('/api/backend/me/learning-preferences', { data: { segment: 'ENFERMAGEM', schoolYear: 0 } })).ok()).toBeTruthy();
  let release!: () => void;
  let intercepted!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { intercepted = resolve; });
  await page.route('**/api/backend/me/learning-home?schoolYear=4', async route => {
    intercepted(); await pending;
    try {
      await route.fulfill({ status: 200, contentType: 'application/json',
        headers: { 'set-cookie': oldCookies.map(cookie => `${cookie.name}=${cookie.value}; Path=/; HttpOnly; SameSite=Lax`).join('\n') },
        body: JSON.stringify(oldHome),
      });
    } catch { /* Logging out aborts the previous account's outstanding request. */ }
  });
  await page.getByRole('combobox', { name: 'Ano ou idade para as missões', exact: true }).selectOption('4');
  await started;
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/login?returnTo=%2Faprender');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page.getByRole('combobox', { name: 'Ano ou idade para as missões', exact: true })).toHaveValue('0');
  await expect(xpTotal(page)).toHaveText('0');
  release();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(currentUser.id);
  await expect(xpTotal(page)).toHaveText('0');
  await expect(page.getByRole('heading', { name: fixture.missionsByYear['0'][0].title, exact: true })).toBeVisible();
});

test('repetir o quiz preserva a nota e comunica a prática sem novo XP', async ({ page }) => {
  await register(page);
  await finishThroughApi(page, fixture.publicQuiz);
  const repeated = await finishThroughApi(page, fixture.publicQuiz);
  expect(repeated.reward).toMatchObject({ xpAwarded: 0, reason: 'ALREADY_REWARDED' });
  expect(Number(repeated.attempt.score)).toBe(3);
  await page.goto(`/quiz/${fixture.publicQuiz}?attempt=${repeated.attempt.id}`);
  await expect(page.getByRole('heading', { name: 'Quiz concluído', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Prática registrada', exact: true })).toBeVisible();
  await expect(page.getByText('Este quiz já registrou XP no dia desta conclusão. Praticar novamente ajuda a revisar o que você aprendeu.', { exact: true })).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await assertAccessible(page);
  await home(page);
  expect((await (await page.request.get('/api/backend/me/learning-home')).json()).xp.total).toBe(10);
});

test('falha ao carregar aprendizado permite tentar novamente e acessar o catálogo', async ({ page }) => {
  await register(page);
  let fail = true;
  await page.route('**/api/backend/me/learning-home*', route => fail ? route.abort('failed') : route.continue());
  await page.goto('/aprender');
  await expect(page.getByRole('heading', { name: 'Aprender hoje', exact: true })).toBeVisible();
  const retry = page.getByRole('button', { name: 'Tentar novamente', exact: true });
  await expect(retry).toBeVisible();
  await expect(page.locator('a[href="/quizzes"]').first()).toBeVisible();
  fail = false;
  await retry.click();
  await expect(page.getByRole('heading', { name: 'Missões da semana', exact: true })).toBeVisible();
  await chooseYear(page);
  await expect(retry).toHaveCount(0);
  await assertAccessible(page);
});

test('faixa do perfil aparece na primeira visita sem salvar preferências automaticamente', async ({ page }) => {
  await page.goto('/login?returnTo=%2Faprender');
  await page.getByLabel('E-mail', { exact: true }).fill(fixture.profileStudent.email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page.getByRole('heading', { name: 'Aprender hoje', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Ano ou idade para as missões', exact: true })).toHaveValue('10');
  await expect(page.getByRole('heading', { name: fixture.missionsByYear['10'][0].title, exact: true })).toBeVisible();
  expect((await (await page.request.get('/api/backend/me/learning-preferences')).json()).schoolYear).toBeNull();
  await assertAccessible(page);
});
