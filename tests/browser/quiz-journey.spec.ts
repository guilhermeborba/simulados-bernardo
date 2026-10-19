import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fixture = JSON.parse(readFileSync(process.env.E2E_FIXTURE_PATH!, 'utf8')) as { publicQuiz: string; privateQuiz: string; publicSimulation: string; quizSegments: Record<string, string> };
const password = 'Synthetic-password-42';
let accountIndex = 0;
async function register(page: Page) {
  const email = `browser-${Date.now()}-${++accountIndex}@example.test`;
  const response = await page.request.post('/api/auth/register', { data: { name: 'Aluno de navegador', email, password } });
  expect(response.ok()).toBeTruthy();
  return email;
}
async function openQuiz(page: Page, quizId = fixture.publicQuiz) {
  await page.goto(`/quiz/${quizId}`);
  await expect(page.getByRole('heading', { name: 'Qual balão é vermelho?' })).toBeVisible();
  await expect(page).toHaveURL(/\?attempt=/);
}
async function revealCatalogQuiz(page: Page, quizId: string) {
  await expect(page.getByLabel('Ano ou idade')).toBeEnabled();
  await expect(page.getByText(/^\d+ quiz(?:zes)? disponíve(?:l|is)/)).toBeVisible();
  const target = page.locator(`a[href="/quiz/${quizId}"]`);
  for (let index = 0; index < 10 && !(await target.count()); index++) {
    const more = page.getByRole('button', { name: 'Mostrar mais quizzes', exact: true });
    if (!(await more.count())) break;
    await more.click();
  }
  await expect(target).toBeVisible();
}
async function confirmFirst(page: Page) {
  await page.getByRole('radio', { name: 'O balão vermelho', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
  await expect(page.getByText('O balão do meio é vermelho.', { exact: true })).toBeVisible();
}
async function setPreference(page: Page, name: string, checked: boolean) {
  const checkbox = page.getByLabel(name, { exact: true });
  await expect(checkbox).toBeEnabled();
  if (await checkbox.isChecked() !== checked) await checkbox.click();
  await expect(checkbox).toBeChecked({ checked });
  await expect(checkbox).toBeEnabled();
}
function attemptId(page: Page) { return new URL(page.url()).searchParams.get('attempt')!; }
async function assertAccessible(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
}

test('selecionar, confirmar, recarregar, concluir e consultar o histórico preserva a tentativa', async ({ page }, testInfo) => {
  let questionReads = 0;
  page.on('request', request => { if (/\/api\/backend\/attempts\/[^/]+\/questions$/.test(request.url())) questionReads++; });
  await register(page);
  await page.goto('/quizzes');
  await expect(page.getByLabel('Ano ou idade')).toBeEnabled();
  await page.getByLabel('Ano ou idade').selectOption('3');
  await revealCatalogQuiz(page, fixture.publicQuiz);
  await page.getByRole('link', { name: 'Começar quiz: Quiz sintético jornada-web', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Qual balão é vermelho?' })).toBeVisible();
  await expect(page).toHaveURL(/\?attempt=/);
  const id = attemptId(page);
  await page.getByRole('radio', { name: 'O balão azul', exact: true }).check();
  await page.getByRole('radio', { name: 'O balão vermelho', exact: true }).check();
  const before = await (await page.request.get(`/api/backend/attempts/${id}/questions`)).json();
  expect(before[0].feedback).toBeNull();
  await confirmFirst(page);
  expect(questionReads).toBe(1);
  await expect(page.getByRole('radio', { name: 'O balão azul', exact: true })).toBeDisabled();
  await assertAccessible(page);
  if (process.env.QUIZ_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.QUIZ_SCREENSHOT_DIR}/quiz-feedback-${testInfo.project.name}.png`, fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Quanto é 2 + 3?' })).toBeVisible();
  expect(attemptId(page)).toBe(id);
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
  await expect(page.getByText('O balão do meio é vermelho.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Próxima pergunta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirmar resposta', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: '5', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
  await expect(page.getByText('Dois mais três formam cinco.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Concluir quiz', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quiz concluído', exact: true })).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Quiz concluído', exact: true })).toBeVisible();
  expect(attemptId(page)).toBe(id);
  await assertAccessible(page);
  await page.getByRole('link', { name: 'Ver meu histórico de quizzes', exact: true }).click();
  await expect(page.getByText('Quiz sintético jornada-web', { exact: true })).toBeVisible();
  const history = await (await page.request.get('/api/backend/me/quiz-attempts')).json();
  expect(history.filter((row: { id: string }) => row.id === id)).toHaveLength(1);
  expect(await (await page.request.get('/api/backend/me/attempts')).json()).toEqual([]);
});

test('perda da resposta HTTP mantém escolha e permite repetir confirmação e conclusão', async ({ page }) => {
  await register(page); await openQuiz(page);
  let loseConfirmation = true;
  await page.route('**/api/backend/attempts/*/questions/*/answer', async route => {
    if (!loseConfirmation) return route.continue();
    loseConfirmation = false;
    await route.fetch();
    await route.abort('failed');
  });
  await page.getByRole('radio', { name: 'O balão vermelho', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('sua escolha está preservada');
  await expect(page.getByRole('radio', { name: 'O balão vermelho', exact: true })).toBeChecked();
  const id = attemptId(page);
  const first = (await (await page.request.get(`/api/backend/attempts/${id}/questions`)).json())[0];
  await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
  await expect(page.getByText('O balão do meio é vermelho.', { exact: true })).toBeVisible();
  const repeated = (await (await page.request.get(`/api/backend/attempts/${id}/questions`)).json())[0];
  expect(repeated.confirmedAt).toBe(first.confirmedAt);
  await page.getByRole('button', { name: 'Próxima pergunta', exact: true }).click();
  await page.getByRole('radio', { name: '5', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
  await expect(page.getByText('Dois mais três formam cinco.', { exact: true })).toBeVisible();
  let loseFinish = true;
  await page.route('**/api/backend/attempts/*/finish', async route => {
    if (!loseFinish) return route.continue();
    loseFinish = false; await route.fetch(); await route.abort('failed');
  });
  await page.getByRole('button', { name: 'Concluir quiz', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('suas respostas já estão salvas');
  const saved = await (await page.request.get(`/api/backend/attempts/${id}/result`)).json();
  await page.getByRole('button', { name: 'Concluir quiz', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quiz concluído', exact: true })).toBeVisible();
  expect(await (await page.request.get(`/api/backend/attempts/${id}/result`)).json()).toEqual(saved);
});

test('mídia com falha permite ler descrição/transcrição e concluir sem áudio automático', async ({ page }, testInfo) => {
  await register(page);
  await page.request.patch('/api/backend/me/learning-preferences', { data: { segment: 'INFANTIL', schoolYear: -1, audioEnabled: true, motionEnabled: false } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/backend/attempts/*/questions/*/media/*', route => route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"Unavailable"}' }));
  await openQuiz(page, fixture.quizSegments['-1']);
  await expect(page.getByText('Descrição da imagem', { exact: true })).toBeVisible();
  const audio = page.locator('audio');
  await expect(audio).not.toHaveAttribute('autoplay');
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBeTruthy();
  await audio.evaluate((element: HTMLAudioElement) => element.load());
  await expect(page.getByText('O áudio não está disponível. Continue pela transcrição.', { exact: true })).toBeVisible();
  await expect(page.getByText('Qual balão é vermelho? A: O balão azul. B: O balão vermelho. C: O balão amarelo.', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-learning-motion', 'off');
  await assertAccessible(page);
  if (process.env.QUIZ_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.QUIZ_SCREENSHOT_DIR}/quiz-infantil-${testInfo.project.name}.png`, fullPage: true });
  await confirmFirst(page);
  await page.getByRole('button', { name: 'Próxima pergunta', exact: true }).click();
  await page.getByRole('radio', { name: '5', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir quiz', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quiz concluído', exact: true })).toBeVisible();
});

test('catálogo cobre as 15 faixas, filtros persistem e uma segunda conta conserva defaults', async ({ page }, testInfo) => {
  const email = await register(page);
  await page.goto('/quizzes');
  await expect(page.getByLabel('Ano ou idade')).toBeEnabled();
  for (const year of [-1, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0]) {
    await page.getByRole('button', { name: /Todas as faixas/ }).click();
    await expect(page.getByLabel('Ano ou idade')).toBeEnabled();
    await page.getByLabel('Ano ou idade').selectOption(String(year));
    await revealCatalogQuiz(page, fixture.quizSegments[String(year)]);
    expect(await (await page.request.get('/api/backend/me/learning-preferences')).json()).toMatchObject({ schoolYear: year });
  }
  await assertAccessible(page);
  if (process.env.QUIZ_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.QUIZ_SCREENSHOT_DIR}/quiz-catalog-${testInfo.project.name}.png`, fullPage: true });
  await page.getByText('Som e movimento', { exact: true }).click();
  await setPreference(page, 'Habilitar áudio das questões', true);
  await expect(page.getByLabel('Permitir animações')).toBeEnabled();
  await setPreference(page, 'Permitir animações', false);
  await expect(page.getByLabel('Permitir animações')).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel('Ano ou idade')).toHaveValue('0');
  await page.getByText('Som e movimento', { exact: true }).click();
  await expect(page.getByLabel('Habilitar áudio das questões')).toBeChecked();
  await expect(page.getByLabel('Permitir animações')).not.toBeChecked();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await register(page);
  await page.goto('/quizzes');
  await expect(page.getByLabel('Ano ou idade')).toHaveValue('');
  await page.getByText('Som e movimento', { exact: true }).click();
  await expect(page.getByLabel('Habilitar áudio das questões')).not.toBeChecked();
  await expect(page.getByLabel('Permitir animações')).toBeChecked();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.goto('/login?returnTo=%2F');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar$/, exact: false }).click();
  // Without a Giz track the home sends the student on to /trilha.
  await expect(page).toHaveURL(/\/(trilha)?$/);
  await page.goto('/quizzes');
  await expect(page.getByLabel('Ano ou idade')).toHaveValue('0');
});

test('links de retomada preservam query no login e alternativas funcionam por teclado', async ({ page }) => {
  const email = await register(page);
  const initial = await (await page.request.post(`/api/backend/quizzes/${fixture.publicQuiz}/attempts`)).json();
  await page.request.post('/api/auth/logout');
  const deepLink = `/quiz/${fixture.publicQuiz}?attempt=${initial.id}`;
  await page.goto(deepLink);
  await expect(page).toHaveURL(/\/login\?/);
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe(deepLink);
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page.getByRole('heading', { name: 'Qual balão é vermelho?' })).toBeVisible();
  expect(attemptId(page)).toBe(initial.id);
  const blue = page.getByRole('radio', { name: 'O balão azul', exact: true });
  await blue.focus();
  await page.keyboard.press('Space');
  await expect(blue).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'O balão vermelho', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('O balão do meio é vermelho.', { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Resposta correta' })).toBeFocused();
});

test('quiz privado e tentativa de outro quiz não expõem perguntas', async ({ page }) => {
  await register(page);
  await page.goto(`/quiz/${fixture.privateQuiz}`);
  await expect(page.locator('main').getByRole('alert')).toContainText('não está disponível para sua conta');
  await expect(page.getByRole('radio')).toHaveCount(0);
  const simulation = await (await page.request.post(`/api/backend/simulations/${fixture.publicSimulation}/attempts`)).json();
  await page.goto(`/quiz/${fixture.publicQuiz}?attempt=${simulation.id}`);
  await expect(page.locator('main').getByRole('alert')).toContainText('não pertence ao quiz escolhido');
  await expect(page.getByRole('radio')).toHaveCount(0);
});

test('consulta inicial atrasada não sobrescreve uma nova sessão', async ({ page }) => {
  await register(page);
  const previousUser = await (await page.request.get('/api/auth/me')).json();
  const email = `session-next-${Date.now()}-${++accountIndex}@example.test`;
  const created = await page.request.post('/api/auth/register', { data: { name: 'Conta atual de teste', email, password } });
  expect(created.ok()).toBeTruthy();
  await page.request.patch('/api/backend/me/learning-preferences', { data: { segment: 'ENFERMAGEM', schoolYear: 0 } });
  let release!: () => void;
  let intercepted!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { intercepted = resolve; });
  let delayed = true;
  await page.route('**/api/auth/me', async route => {
    if (!delayed) return route.continue();
    delayed = false; intercepted(); await pending;
    try { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(previousUser) }); }
    catch { /* The superseded bootstrap request is deliberately aborted. */ }
  });
  await page.goto('/login?returnTo=%2Fhistorico');
  await started;
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page.getByRole('heading', { name: 'Histórico', exact: true })).toBeVisible();
  release();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.getByRole('heading', { name: 'Histórico', exact: true })).toBeVisible();
  expect((await (await page.request.get('/api/auth/me')).json()).name).toBe('Conta atual de teste');
  await page.locator('a[href="/eu"]').filter({ visible: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Conta atual de teste', exact: true })).toBeVisible();
  await page.goto('/pratica');
  await page.locator('a[href="/quizzes"]').first().click();
  await expect(page.getByLabel('Ano ou idade')).toHaveValue('0');
});

test('desativar áudio e trocar de pergunta pausa o elemento anterior', async ({ page }) => {
  await register(page);
  await page.request.patch('/api/backend/me/learning-preferences', { data: { segment: 'INFANTIL', schoolYear: -1, audioEnabled: true } });
  await openQuiz(page, fixture.quizSegments['-1']);
  const rememberAndPlay = async () => page.locator('audio').evaluate(async (element: HTMLAudioElement) => {
    (window as unknown as { previousQuizAudio: HTMLAudioElement }).previousQuizAudio = element;
    element.loop = true; await element.play();
  });
  const previousPaused = () => page.evaluate(() => (window as unknown as { previousQuizAudio: HTMLAudioElement }).previousQuizAudio.paused);
  await rememberAndPlay();
  expect(await previousPaused()).toBeFalsy();
  await page.getByText('Som e movimento', { exact: true }).click();
  await setPreference(page, 'Habilitar áudio das questões', false);
  await expect(page.locator('audio')).toHaveCount(0);
  expect(await previousPaused()).toBeTruthy();
  await expect(page.getByLabel('Habilitar áudio das questões')).toBeEnabled();
  await setPreference(page, 'Habilitar áudio das questões', true);
  await expect(page.locator('audio')).toHaveCount(1);
  await rememberAndPlay();
  await confirmFirst(page);
  await page.getByRole('button', { name: 'Próxima pergunta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quanto é 2 + 3?' })).toBeVisible();
  expect(await previousPaused()).toBeTruthy();
});


for (const [label, year, tier] of [['Fundamental II', 6, 'jovem'], ['Ensino Médio', 10, 'exame'], ['Técnico', 0, 'exame']] as const) {
  test(`${label}: resposta incorreta, retomada e conclusão mantêm conteúdo e apresentação`, async ({ page }) => {
    await register(page); await openQuiz(page, fixture.quizSegments[String(year)]);
    await expect(page.locator('main[data-tier]')).toHaveAttribute('data-tier', tier);
    await expect(page.getByText('Vamos descobrir juntos!', { exact: false })).toHaveCount(0);
    await page.getByRole('radio', { name: 'O balão azul', exact: true }).check();
    await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Vamos aprender com esta resposta', exact: true })).toBeVisible();
    await assertAccessible(page);
    const id = attemptId(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Quanto é 2 + 3?' })).toBeVisible();
    expect(attemptId(page)).toBe(id);
    await page.getByRole('radio', { name: '5', exact: true }).check();
    await page.getByRole('button', { name: 'Confirmar resposta', exact: true }).click();
    await expect(page.getByText('Dois mais três formam cinco.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Concluir quiz', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Quiz concluído', exact: true })).toBeVisible();
    const result = await (await page.request.get(`/api/backend/attempts/${id}/result`)).json();
    expect(result.attempt).toMatchObject({ id, correctCount: 1, wrongCount: 1, status: 'FINISHED' });
  });
}

test('resposta antiga de preferências não sobrescreve cookies da nova conta', async ({ page, request }) => {
  await register(page);
  const oldCookies = await page.context().cookies();
  const email = `cookies-next-${Date.now()}-${++accountIndex}@example.test`;
  const created = await request.post('/api/auth/register', { data: { name: 'Conta seguinte', email, password } });
  expect(created.ok()).toBeTruthy();
  const nextUser = (await created.json()).user;
  await request.patch('/api/backend/me/learning-preferences', { data: { segment: 'ENFERMAGEM', schoolYear: 0 } });
  let release!: () => void;
  let intercepted!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { intercepted = resolve; });
  let delayed = true;
  await page.route('**/api/backend/me/learning-preferences', async route => {
    if (!delayed || route.request().method() !== 'GET') return route.continue();
    delayed = false; intercepted(); await pending;
    try {
      await route.fulfill({ status: 200, contentType: 'application/json',
        headers: { 'set-cookie': oldCookies.map(cookie => `${cookie.name}=${cookie.value}; Path=/; HttpOnly; SameSite=Lax`).join('\n') },
        body: JSON.stringify({ segment: 'FUNDAMENTAL_I', schoolYear: 3, audioEnabled: true, motionEnabled: true }),
      });
    } catch { /* A previous session's request must have been aborted. */ }
  });
  await page.goto('/login?returnTo=%2Fquizzes'); await started;
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page.getByLabel('Ano ou idade')).toHaveValue('0');
  release();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(nextUser.id);
  await expect(page.getByLabel('Ano ou idade')).toHaveValue('0');
});
