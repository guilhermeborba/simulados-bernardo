import { readFileSync } from 'node:fs';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH!, 'utf8')) as {
  publicQuiz: string;
  quizSegments: Record<string, string>;
  quizAnswers: string[];
  collectionQuizzes: string[];
};
const password = 'Synthetic-password-42';
let accountIndex = 0;
async function register(request: APIRequestContext) {
  const email = `collections-browser-${Date.now()}-${++accountIndex}@example.test`;
  const response = await request.post('/api/auth/register', { data: { name: 'Aluno de coleções', email, password } });
  expect(response.ok()).toBeTruthy();
  return { email, id: (await response.json()).user.id as string };
}
async function preference(page: Page, schoolYear: number) {
  const segment = schoolYear < 0 ? 'INFANTIL' : schoolYear === 0 ? 'ENFERMAGEM' : schoolYear <= 5 ? 'FUNDAMENTAL_I' : schoolYear <= 9 ? 'FUNDAMENTAL_II' : 'MEDIO';
  expect((await page.request.patch('/api/backend/me/learning-preferences', { data: { segment, schoolYear } })).ok()).toBeTruthy();
}
async function collection(page: Page) {
  await page.goto('/colecao');
  await expect(page.getByRole('heading', { name: 'Itens da coleção', exact: true })).toBeVisible();
}
async function finish(request: APIRequestContext, quizId: string) {
  const start = await request.post(`/api/backend/quizzes/${quizId}/attempts`);
  expect(start.ok()).toBeTruthy();
  const attempt = await start.json();
  const questions = await (await request.get(`/api/backend/attempts/${attempt.id}/questions`)).json();
  for (const [index, question] of questions.entries()) {
    expect((await request.post(`/api/backend/attempts/${attempt.id}/questions/${question.id}/answer`, { data: { answer: { optionKey: fixture.quizAnswers[index] } } })).ok()).toBeTruthy();
  }
  const done = await request.post(`/api/backend/attempts/${attempt.id}/finish`);
  expect(done.ok()).toBeTruthy();
  return await done.json();
}
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
}
const style = (page: Page) => page.getByRole('combobox', { name: 'Estilo de apresentação', exact: true });
const item = (page: Page, name: string) => page.getByRole('radio', { name, exact: true });
const preview = (page: Page, form: 'Bolinha' | 'Capelo' | 'Selo de progresso') => page.getByRole('img', { name: new RegExp(`Prévia da personalização: ${form},`) });
const save = (page: Page) => page.getByRole('button', { name: 'Salvar personalização', exact: true });
async function login(page: Page, email: string) {
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('coleção inicial protege a rota, bloqueia itens não ganhos e adapta AUTO às 15 faixas', async ({ page }) => {
  await page.goto('/colecao');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fcolecao$/);
  await register(page.request);
  await preference(page, -1);
  await collection(page);
  await expect(page.getByRole('heading', { name: 'Minha coleção', exact: true })).toBeVisible();
  await expect(item(page, 'Início')).toBeChecked();
  for (const title of ['Primeiro passo', 'Explorador', 'Constância', 'Missão', 'Horizonte']) await expect(item(page, title)).toBeDisabled();
  await item(page, 'Início').focus();
  await page.keyboard.press('ArrowRight');
  await expect(item(page, 'Início')).toBeChecked();
  expect((await (await page.request.get('/api/backend/me/avatar')).json()).selection).toEqual({ itemId: 'inicio', style: 'AUTO' });
  await accessible(page);
  for (const year of [-1, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0]) {
    await preference(page, year);
    await page.reload();
    await expect(style(page)).toHaveValue('AUTO');
    await expect(preview(page, year < 0 ? 'Bolinha' : year !== 0 && year <= 5 ? 'Capelo' : 'Selo de progresso')).toBeVisible();
    await expect(item(page, 'Início')).toBeChecked();
    await expect(page.getByRole('heading', { name: year !== 0 && year <= 5 ? 'Minha coleção' : 'Coleções e progresso', exact: true })).toBeVisible();
  }
  await style(page).selectOption('MASCOT');
  await expect(preview(page, 'Capelo')).toBeVisible();
  await save(page).click();
  await expect(page.getByText('Personalização salva na sua conta.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(style(page)).toHaveValue('MASCOT');
  await expect(preview(page, 'Capelo')).toBeVisible();
  await accessible(page);
});

test('primeira conclusão desbloqueia personalização e a mesma seleção é restaurada em outro navegador', async ({ page, browser }, testInfo) => {
  const account = await register(page.request);
  await preference(page, -2);
  const result = await finish(page.request, fixture.publicQuiz);
  expect(result.reward.xpAwarded).toBe(10);
  await collection(page);
  await expect(item(page, 'Primeiro passo')).toBeEnabled();
  await item(page, 'Primeiro passo').check();
  await style(page).selectOption('SEAL');
  await expect(preview(page, 'Selo de progresso')).toBeVisible();
  await save(page).click();
  await expect(page.getByText('Personalização salva na sua conta.', { exact: true })).toBeVisible();
  const persisted = await (await page.request.get('/api/backend/me/avatar')).json();
  expect(persisted.selection).toEqual({ itemId: 'primeiro-passo', style: 'SEAL' });
  await page.reload();
  await expect(item(page, 'Primeiro passo')).toBeChecked();
  await expect(style(page)).toHaveValue('SEAL');
  const anotherContext = await browser.newContext({ baseURL: process.env.E2E_WEB_URL, viewport: page.viewportSize()! });
  try {
    expect((await anotherContext.request.post('/api/auth/login', { data: { email: account.email, password } })).ok()).toBeTruthy();
    const anotherPage = await anotherContext.newPage();
    await collection(anotherPage);
    await expect(item(anotherPage, 'Primeiro passo')).toBeChecked();
    await expect(style(anotherPage)).toHaveValue('SEAL');
    expect((await (await anotherContext.request.get('/api/backend/me/avatar')).json()).selection).toEqual(persisted.selection);
  } finally {
    await anotherContext.close();
  }
  expect((await (await page.request.get('/api/backend/me/learning-home')).json()).xp.total).toBe(10);
  expect(Number((await (await page.request.get(`/api/backend/attempts/${result.attempt.id}/result`)).json()).attempt.score)).toBe(3);
  await accessible(page);
  if (process.env.QUIZ_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.QUIZ_SCREENSHOT_DIR}/collection-${testInfo.project.name}.png`, fullPage: true });
});

test('troca de conta esconde itens e conquistas anteriores e login recupera a seleção salva', async ({ page }) => {
  const first = await register(page.request);
  await finish(page.request, fixture.publicQuiz);
  expect((await page.request.patch('/api/backend/me/avatar', { data: { itemId: 'primeiro-passo', style: 'SEAL' } })).ok()).toBeTruthy();
  await collection(page);
  await expect(item(page, 'Primeiro passo')).toBeChecked();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  const second = await register(page.request);
  await collection(page);
  await expect(item(page, 'Início')).toBeChecked();
  await expect(item(page, 'Primeiro passo')).toBeDisabled();
  await expect(style(page)).toHaveValue('AUTO');
  const clean = await (await page.request.get('/api/backend/me/achievements')).json();
  expect(clean.achievements.every((row: { earnedAt: string | null }) => row.earnedAt === null)).toBeTruthy();
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(second.id);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await login(page, first.email);
  await collection(page);
  await expect(item(page, 'Primeiro passo')).toBeChecked();
  await expect(style(page)).toHaveValue('SEAL');
  await accessible(page);
});

test('falha de catálogo permite tentar novamente sem seleção local fictícia', async ({ page }) => {
  await register(page.request);
  let fail = true;
  await page.route('**/api/backend/me/avatar', route => fail ? route.abort('failed') : route.continue());
  await page.goto('/colecao');
  const retry = page.getByRole('button', { name: 'Tentar novamente', exact: true });
  await expect(retry).toBeVisible();
  await expect(item(page, 'Início')).toHaveCount(0);
  fail = false;
  await retry.click();
  await expect(item(page, 'Início')).toBeChecked();
  await expect(retry).toHaveCount(0);
  await accessible(page);
});

test('resposta atrasada da coleção anterior não restaura itens nem cookies na nova conta', async ({ page, request }) => {
  await register(page.request);
  await finish(page.request, fixture.publicQuiz);
  expect((await page.request.patch('/api/backend/me/avatar', { data: { itemId: 'primeiro-passo', style: 'SEAL' } })).ok()).toBeTruthy();
  const oldAvatar = await (await page.request.get('/api/backend/me/avatar')).json();
  const oldCookies = await page.context().cookies();
  const next = await register(request);
  let release!: () => void;
  let intercepted!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { intercepted = resolve; });
  let intercept = true;
  await page.route('**/api/backend/me/avatar', async route => {
    if (!intercept) return route.continue();
    intercept = false; intercepted(); await pending;
    try {
      await route.fulfill({ status: 200, contentType: 'application/json',
        headers: { 'set-cookie': oldCookies.map(cookie => `${cookie.name}=${cookie.value}; Path=/; HttpOnly; SameSite=Lax`).join('\n') },
        body: JSON.stringify(oldAvatar),
      });
    } catch { /* Account changes cancel the old account's outstanding request. */ }
  });
  await page.goto('/colecao');
  await started;
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await login(page, next.email);
  await collection(page);
  await expect(item(page, 'Início')).toBeChecked();
  release();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(next.id);
  await expect(item(page, 'Início')).toBeChecked();
  await expect(item(page, 'Primeiro passo')).toBeDisabled();
  await expect(style(page)).toHaveValue('AUTO');
});

test('salvamento da conta anterior termina sem substituir a coleção da nova sessão', async ({ page, request }) => {
  await register(page.request);
  await finish(page.request, fixture.publicQuiz);
  await collection(page);
  const oldCookies = await page.context().cookies();
  const next = await register(request);
  let release!: () => void;
  let intercepted!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { intercepted = resolve; });
  await page.route('**/api/backend/me/avatar', async route => {
    if (route.request().method() !== 'PATCH') return route.continue();
    const completed = await route.fetch();
    const oldAvatar = await completed.json();
    intercepted(); await pending;
    try {
      await route.fulfill({ status: 200, contentType: 'application/json',
        headers: { 'set-cookie': oldCookies.map(cookie => `${cookie.name}=${cookie.value}; Path=/; HttpOnly; SameSite=Lax`).join('\n') },
        body: JSON.stringify(oldAvatar),
      });
    } catch { /* Completion cannot restore an abandoned account's state. */ }
  });
  await item(page, 'Primeiro passo').check();
  await style(page).selectOption('SEAL');
  await save(page).click();
  await started;
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await login(page, next.email);
  await collection(page);
  release();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(next.id);
  await expect(item(page, 'Início')).toBeChecked();
  await expect(item(page, 'Primeiro passo')).toBeDisabled();
  await expect(page.getByText('Personalização salva na sua conta.', { exact: true })).toHaveCount(0);
});

test('erro ao salvar mantém a escolha para tentar novamente e não simula persistência', async ({ page }) => {
  await register(page.request);
  await finish(page.request, fixture.publicQuiz);
  await collection(page);
  let fail = true;
  await page.route('**/api/backend/me/avatar', route => route.request().method() === 'PATCH' && fail ? route.abort('failed') : route.continue());
  await item(page, 'Primeiro passo').check();
  await style(page).selectOption('SEAL');
  await save(page).click();
  await expect(page.getByText('Não foi possível salvar sua personalização. Sua escolha foi mantida para tentar novamente.', { exact: true })).toBeVisible();
  await expect(item(page, 'Primeiro passo')).toBeChecked();
  await expect(style(page)).toHaveValue('SEAL');
  await expect(save(page)).toBeEnabled();
  expect((await (await page.request.get('/api/backend/me/avatar')).json()).selection).toEqual({ itemId: 'inicio', style: 'AUTO' });
  await expect(page.getByText('Personalização salva na sua conta.', { exact: true })).toHaveCount(0);
  fail = false;
  await save(page).click();
  await expect(page.getByText('Personalização salva na sua conta.', { exact: true })).toBeVisible();
  expect((await (await page.request.get('/api/backend/me/avatar')).json()).selection).toEqual({ itemId: 'primeiro-passo', style: 'SEAL' });
  await page.reload();
  await expect(item(page, 'Primeiro passo')).toBeChecked();
  await expect(style(page)).toHaveValue('SEAL');
  await accessible(page);
});
