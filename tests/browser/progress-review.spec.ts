import { readFileSync } from 'node:fs';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH!, 'utf8')) as {
  progressQuizzes: Record<string, string>;
  progressSkills: Record<string, { code: string; title: string }>;
  reviewOld: string; reviewCurrent: string; reviewTitle: string;
};
const password = 'Synthetic-password-42';
let accountIndex = 0;
async function register(request: APIRequestContext) {
  const email = `progress-browser-${Date.now()}-${++accountIndex}@example.test`;
  const response = await request.post('/api/auth/register', { data: { name: 'Aluno de revisão', email, password } });
  expect(response.ok()).toBeTruthy();
  return { email, id: (await response.json()).user.id as string };
}
async function preference(request: APIRequestContext, schoolYear: number) {
  const segment = schoolYear < 0 ? 'INFANTIL' : schoolYear === 0 ? 'ENFERMAGEM' : schoolYear <= 5 ? 'FUNDAMENTAL_I' : schoolYear <= 9 ? 'FUNDAMENTAL_II' : 'MEDIO';
  expect((await request.patch('/api/backend/me/learning-preferences', { data: { segment, schoolYear } })).ok()).toBeTruthy();
}
async function normal(request: APIRequestContext, quizId = fixture.reviewOld) {
  const start = await request.post(`/api/backend/quizzes/${quizId}/attempts`);
  expect(start.ok()).toBeTruthy();
  const attempt = await start.json();
  const rows = await (await request.get(`/api/backend/attempts/${attempt.id}/questions`)).json();
  for (const [index, question] of rows.entries()) {
    expect((await request.post(`/api/backend/attempts/${attempt.id}/questions/${question.id}/answer`, { data: { answer: { optionKey: index === 0 ? 'A' : 'B' } } })).ok()).toBeTruthy();
  }
  const done = await request.post(`/api/backend/attempts/${attempt.id}/finish`);
  expect(done.ok()).toBeTruthy();
  return await done.json();
}
async function progress(page: Page) {
  await page.goto('/progresso');
  await expect(page.getByRole('heading', { name: 'Registros por habilidade', exact: true })).toBeVisible();
}
const yearPicker = (page: Page) => page.getByRole('combobox', { name: 'Ano ou idade para o progresso', exact: true });
const begin = (page: Page) => page.getByRole('button', { name: `Começar revisão: ${fixture.reviewTitle}`, exact: true });
const skillCard = (page: Page, year = 3) => page.getByRole('article', { name: fixture.progressSkills[String(year)].title, exact: true });
const attemptId = (page: Page) => new URL(page.url()).searchParams.get('attempt')!;
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
}
async function login(page: Page, email: string) {
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page).toHaveURL(/\/trilha$/);
}
async function confirm(page: Page, keyboard = false) {
  const blue = page.getByRole('radio', { name: 'Azul de teste', exact: true });
  if (keyboard) {
    await blue.focus(); await page.keyboard.press('Space'); await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Vermelho de teste', exact: true })).toBeChecked();
    await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).focus();
    await page.keyboard.press('Enter');
  } else {
    await page.getByRole('radio', { name: 'Vermelho de teste', exact: true }).check();
    await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
  }
  await expect(page.getByText('A alternativa B representa a cor vermelha neste exemplo sintético.', { exact: true })).toBeVisible();
}

test('progresso protege a rota e apresenta evidências insuficientes nas 15 faixas sem misturar repetições', async ({ page }, testInfo) => {
  await page.goto('/progresso');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fprogresso$/);
  await register(page.request);
  await progress(page);
  await expect(page.getByRole('heading', { name: 'Vamos escolher sua faixa?', exact: true })).toBeVisible();
  await accessible(page);
  for (const year of [-1, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0]) {
    await expect(yearPicker(page)).toBeEnabled();
    await yearPicker(page).selectOption(String(year));
    await expect.poll(async () => (await (await page.request.get('/api/backend/me/learning-preferences')).json()).schoolYear).toBe(year);
    await expect(page.getByRole('heading', { name: 'Ainda não há registros classificados nesta faixa.', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: year < 0 ? 'Minhas descobertas' : 'Habilidades e revisão', exact: true })).toBeVisible();
    await normal(page.request, fixture.progressQuizzes[String(year)]);
    await page.reload();
    const card = skillCard(page, year);
    await expect(card.getByText('Evidência insuficiente', { exact: true })).toBeVisible();
    await expect(card.getByText('1 / 2 corretas', { exact: true })).toBeVisible();
    await expect(card.getByText('0 / 0 corretas', { exact: true })).toHaveCount(2);
    const value = await (await page.request.get(`/api/backend/me/learning-progress?schoolYear=${year}`)).json();
    expect(value.skills.find((row: { code: string }) => row.code === fixture.progressSkills[String(year)].code)).toMatchObject({
      schoolYear: year, firstResponse: { questions: 2, correct: 1 }, repeat: { responses: 0, correct: 0 },
      review: { responses: 0, correct: 0, differentQuestions: 0 }, evidence: 'INSUFFICIENT',
    });
    expect((await (await page.request.get('/api/backend/me/learning-preferences')).json()).schoolYear).toBe(year);
  }
  await accessible(page);
  await yearPicker(page).selectOption('3');
  await expect(skillCard(page)).toBeVisible();
  if (process.env.QUIZ_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.QUIZ_SCREENSHOT_DIR}/progress-${testInfo.project.name}.png`, fullPage: true });
});

test('revisão por teclado prioriza perguntas diferentes, retoma e conclui sem XP ou progresso de missão', async ({ page }) => {
  await register(page.request); await preference(page.request, 3);
  await normal(page.request); await normal(page.request);
  const homeBefore = await (await page.request.get('/api/backend/me/learning-home?schoolYear=3')).json();
  const achievementsBefore = await (await page.request.get('/api/backend/me/achievements')).json();
  await progress(page);
  await expect(skillCard(page).getByText('1 / 2 corretas', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('article').filter({ has: begin(page) }).getByText('Perguntas diferentes para praticar', { exact: true })).toBeVisible();
  await begin(page).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Qual cor aparece na nova imagem de teste 1?', exact: true })).toBeVisible();
  const id = attemptId(page);
  await expect(page.getByText('Pergunta diferente nesta revisão · registrada como prática de revisão.', { exact: true })).toBeVisible();
  await confirm(page, true);
  await expect(page.getByRole('status').filter({ hasText: 'Resposta correta' })).toBeFocused();
  await accessible(page);
  await progress(page);
  const resume = page.getByRole('link', { name: `Continuar revisão: ${fixture.reviewTitle}`, exact: true });
  await expect(resume).toHaveAttribute('href', `/quiz/${fixture.reviewCurrent}?attempt=${id}`);
  await resume.click();
  await expect(page.getByRole('heading', { name: 'Qual cor aparece na nova imagem de teste 2?', exact: true })).toBeVisible();
  expect(attemptId(page)).toBe(id);
  for (let index = 2; index <= 5; index++) {
    await confirm(page);
    if (index < 5) await page.getByRole('button', { name: 'Próxima pergunta', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Concluir revisão', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revisão concluída', exact: true })).toBeVisible();
  const result = await (await page.request.get(`/api/backend/attempts/${id}/result`)).json();
  expect(result.reward).toEqual({ xpAwarded: 0, reason: 'REVIEW', day: null });
  expect(result.attempt).toMatchObject({ practiceMode: 'REVIEW', correctCount: 5 });
  expect(await (await page.request.post(`/api/backend/attempts/${id}/finish`)).json()).toEqual(result);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Revisão concluída', exact: true })).toBeVisible();
  await accessible(page);
  const after = await (await page.request.get('/api/backend/me/learning-home?schoolYear=3')).json();
  expect(after.xp).toEqual(homeBefore.xp); expect(after.missions).toEqual(homeBefore.missions);
  expect(await (await page.request.get('/api/backend/me/achievements')).json()).toEqual(achievementsBefore);
  expect(await (await page.request.get('/api/backend/me/attempts')).json()).toEqual([]);
  await progress(page);
  const card = skillCard(page);
  await expect(card.getByText('5 / 5 corretas', { exact: true })).toBeVisible();
  await expect(card.getByText('Evidência insuficiente', { exact: true })).toBeVisible();
  await page.goto('/quizzes/historico');
  await page.getByRole('button', { name: 'Revisões', exact: true }).click();
  await expect(page.getByText('Revisão orientada · sem XP, missões ou itens', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Quiz · prática livre', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Quizzes', exact: true }).click();
  await expect(page.getByText('Revisão orientada · sem XP, missões ou itens', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Quiz · prática livre', { exact: true })).toHaveCount(2);
  await accessible(page);
  await progress(page); await begin(page).click();
  await expect(page.getByText('Pergunta já praticada · repetir ajuda a revisar e não conta como uma primeira resposta.', { exact: true })).toBeVisible();
});

test('perda da resposta ao preparar revisão permite retomar a mesma tentativa sem duplicá-la', async ({ page }) => {
  await register(page.request); await preference(page.request, 3); await normal(page.request);
  let savedId: string | null = null;
  let lose = true;
  await page.route('**/api/backend/me/review-attempts', async route => {
    if (!lose) return route.continue();
    lose = false;
    const created = await route.fetch(); savedId = (await created.json()).id;
    await route.abort('failed');
  });
  await progress(page); await begin(page).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Não foi possível preparar a revisão');
  await expect(begin(page)).toBeEnabled();
  await begin(page).click();
  await expect(page.getByRole('heading', { name: 'Qual cor aparece na nova imagem de teste 1?', exact: true })).toBeVisible();
  expect(attemptId(page)).toBe(savedId);
  const history = await (await page.request.get('/api/backend/me/quiz-attempts')).json();
  expect(history.filter((row: { practiceMode: string }) => row.practiceMode === 'REVIEW')).toHaveLength(1);
});

test('falha no progresso permite tentar novamente sem fabricar evidências ou sugestões', async ({ page }) => {
  await register(page.request); await preference(page.request, 3); await normal(page.request);
  let fail = true;
  await page.route('**/api/backend/me/learning-progress*', route => fail ? route.abort('failed') : route.continue());
  await page.goto('/progresso');
  const retry = page.getByRole('button', { name: 'Tentar novamente', exact: true });
  await expect(retry).toBeVisible();
  await expect(skillCard(page)).toHaveCount(0); await expect(begin(page)).toHaveCount(0);
  fail = false; await retry.click();
  await expect(skillCard(page)).toBeVisible(); await expect(begin(page)).toBeEnabled();
  await expect(retry).toHaveCount(0); await accessible(page);
});

test('resposta atrasada do progresso da conta anterior não restaura dados ou cookies após troca de conta', async ({ page, request }) => {
  await register(page.request); await preference(page.request, 3); await normal(page.request);
  const oldValue = await (await page.request.get('/api/backend/me/learning-progress?schoolYear=3')).json();
  const oldCookies = await page.context().cookies();
  const next = await register(request); await preference(request, 0);
  let release!: () => void; let intercepted!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { intercepted = resolve; });
  let delay = true;
  await page.route('**/api/backend/me/learning-progress*', async route => {
    if (!delay) return route.continue();
    delay = false; intercepted(); await pending;
    try { await route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'set-cookie': oldCookies.map(cookie => `${cookie.name}=${cookie.value}; Path=/; HttpOnly; SameSite=Lax`).join('\n') }, body: JSON.stringify(oldValue) }); }
    catch { /* Changing account aborts the abandoned account's request. */ }
  });
  await page.goto('/progresso'); await started;
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login/); await login(page, next.email); await progress(page);
  await expect(yearPicker(page)).toHaveValue('0');
  await expect(page.getByRole('heading', { name: 'Ainda não há registros classificados nesta faixa.', exact: true })).toBeVisible();
  release();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(next.id);
  await expect(skillCard(page)).toHaveCount(0); await expect(yearPicker(page)).toHaveValue('0');
});

test('início atrasado da revisão anterior não redireciona nem troca a nova conta', async ({ page, request }) => {
  await register(page.request); await preference(page.request, 3); await normal(page.request);
  const oldCookies = await page.context().cookies();
  const next = await register(request); await preference(request, 0);
  let release!: () => void; let intercepted!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { intercepted = resolve; });
  await page.route('**/api/backend/me/review-attempts', async route => {
    const completed = await route.fetch(); const oldAttempt = await completed.json();
    intercepted(); await pending;
    try { await route.fulfill({ status: 201, contentType: 'application/json',
      headers: { 'set-cookie': oldCookies.map(cookie => `${cookie.name}=${cookie.value}; Path=/; HttpOnly; SameSite=Lax`).join('\n') }, body: JSON.stringify(oldAttempt) }); }
    catch { /* Completion cannot navigate an abandoned account's new session. */ }
  });
  await progress(page); await begin(page).click(); await started;
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login/); await login(page, next.email); await progress(page);
  release();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page).toHaveURL(/\/progresso$/); await expect(yearPicker(page)).toHaveValue('0');
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(next.id);
  await expect(page.getByRole('link', { name: `Continuar revisão: ${fixture.reviewTitle}`, exact: true })).toHaveCount(0);
});
