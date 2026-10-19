import { readFileSync } from 'node:fs';
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Account = { id: string; name: string; email: string };
type Family = {
  student: Account;
  teacher: Account;
  guardian: Account;
  outsideGuardian: Account;
  turma: { id: string; name: string; slug: string };
};
const fixture = JSON.parse(
  readFileSync(process.env.E2E_FIXTURE_PATH!, 'utf8'),
) as { admin: Account; oversight: Record<string, Family> };
const password = 'Synthetic-password-42';
let accountIndex = 0;
async function register(request: APIRequestContext) {
  const email = `recovery-browser-${Date.now()}-${++accountIndex}@example.test`;
  const response = await request.post('/api/auth/register', {
    data: { name: 'Aluno sintético de recuperação', email, password },
  });
  expect(response.ok()).toBeTruthy();
  return { email, id: (await response.json()).user.id as string };
}
async function login(
  page: Page,
  account: Account,
  destination = /\/acompanhamento$/,
) {
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill(account.email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page).toHaveURL(destination);
}
async function logout(page: Page) {
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
}
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
}
async function fixtureMutation(request: APIRequestContext, path: string) {
  const login = await request.post(`${process.env.E2E_API_URL}/auth/login`, {
    data: { email: fixture.admin.email, password },
  });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).accessToken;
  expect(
    (
      await request.delete(`${process.env.E2E_API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).status(),
  ).toBe(204);
}
async function mailToken(request: APIRequestContext, email: string) {
  const response = await request.get(
    `${process.env.E2E_MAIL_URL}/messages?email=${encodeURIComponent(email)}`,
  );
  expect(response.ok()).toBeTruthy();
  const messages = await response.json();
  const text = messages
    .map(
      (message: { text?: string; html?: string }) =>
        `${message.text || ''}\n${message.html || ''}`,
    )
    .join('\n');
  const token = text.match(/redefinir-senha#token=([A-Za-z0-9_-]{43})/)?.[1];
  expect(token).toBeDefined();
  expect(text).not.toContain('redefinir-senha?token=');
  return token!;
}
async function newLink(request: APIRequestContext, email: string) {
  expect(
    (
      await request.post('/api/auth/forgot-password', { data: { email } })
    ).status(),
  ).toBe(202);
  return mailToken(request, email);
}
async function resetForm(
  page: Page,
  token: string,
  replacement: string,
  confirmation = replacement,
) {
  await page.goto(`/redefinir-senha#token=${token}`);
  await expect(
    page.getByRole('heading', { name: 'Redefinir minha senha', exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/redefinir-senha$/);
  await page.getByLabel('Nova senha', { exact: true }).fill(replacement);
  await page
    .getByLabel('Confirmar nova senha', { exact: true })
    .fill(confirmation);
}
const assessment = (page: Page) =>
  page.getByRole('region', { name: 'Simulados concluídos', exact: true });
const practice = (page: Page) =>
  page.getByRole('region', { name: 'Prática por habilidade', exact: true });
const studentSelect = (page: Page) =>
  page.getByRole('combobox', { name: 'Aluno para acompanhar', exact: true });
const yearSelect = (page: Page) =>
  page.getByRole('combobox', {
    name: 'Ano ou idade para as habilidades',
    exact: true,
  });
const assessmentCount = (page: Page) =>
  assessment(page)
    .locator('dl > div')
    .filter({ has: page.getByText('Simulados concluídos', { exact: true }) })
    .locator('dd');

test('acompanhamento protege rota, respeita papel e separa simulados de prática com teclado e acessibilidade', async ({
  page,
}, testInfo) => {
  const family = fixture.oversight[testInfo.project.name];
  await page.goto('/acompanhamento');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Facompanhamento$/);
  const student = await register(page.request);
  await page.goto('/acompanhamento');
  await expect(
    page.getByText(
      'Esta área está disponível para responsáveis, professores e administradores com acesso aos alunos.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(studentSelect(page)).toHaveCount(0);
  expect(
    (await page.request.get('/api/backend/me/oversight-students')).status(),
  ).toBe(403);
  await page.request.post('/api/auth/logout');
  let fail = true;
  await page.route('**/api/backend/me/oversight-students', (route) => {
    if (fail) {
      fail = false;
      return route.abort('failed');
    }
    return route.continue();
  });
  await login(page, family.teacher);
  await expect(
    page.getByRole('button', { name: 'Tentar novamente', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  await expect(studentSelect(page)).toHaveValue(family.student.id);
  await expect(assessmentCount(page)).toHaveText('2');
  await expect(practice(page).getByRole('article')).toHaveCount(2);
  await expect(
    practice(page).getByText('Evidência insuficiente', { exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByText(family.turma.name, { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText(`Habilidade privada externa ${testInfo.project.name}`, {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /Começar revisão/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: /Continuar revisão/ }),
  ).toHaveCount(0);
  await yearSelect(page).selectOption('0');
  await expect(
    practice(page).getByRole('heading', {
      name: 'Ainda não há registros classificados nesta faixa.',
      exact: true,
    }),
  ).toBeVisible();
  await expect(assessmentCount(page)).toHaveText('2');
  await yearSelect(page).selectOption('3');
  await expect(practice(page).getByRole('article')).toHaveCount(2);
  await accessible(page);
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(
    family.teacher.id,
  );
  if (process.env.QUIZ_SCREENSHOT_DIR)
    await page.screenshot({
      path: `${process.env.QUIZ_SCREENSHOT_DIR}/oversight-${testInfo.project.name}.png`,
      fullPage: true,
    });
  await logout(page);
  await login(page, family.guardian);
  await expect(assessmentCount(page)).toHaveText('3');
  await expect(practice(page).getByRole('article')).toHaveCount(3);
  await expect(
    page.getByRole('article', {
      name: `Habilidade privada externa ${testInfo.project.name}`,
      exact: true,
    }),
  ).toBeVisible();
  await accessible(page);
  expect(student.id).not.toBe(family.student.id);
});

test('revogar professor ou responsável remove dados e seleção ao atualizar acompanhamento', async ({
  page,
}, testInfo) => {
  const family = fixture.oversight[testInfo.project.name];
  await login(page, family.teacher);
  await expect(assessmentCount(page)).toHaveText('2');
  await fixtureMutation(
    page.request,
    `/turmas/${family.turma.id}/teachers/${family.teacher.id}`,
  );
  await page
    .getByRole('button', { name: 'Atualizar acompanhamento', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Nenhum aluno disponível', exact: true }),
  ).toBeVisible();
  await expect(studentSelect(page)).toHaveCount(0);
  await expect(assessment(page)).toHaveCount(0);
  await expect(practice(page)).toHaveCount(0);
  expect(
    (
      await page.request.get(
        `/api/backend/students/${family.student.id}/learning-progress?schoolYear=3`,
      )
    ).status(),
  ).toBe(403);
  await accessible(page);
  await logout(page);
  await login(page, family.guardian);
  await expect(assessmentCount(page)).toHaveText('3');
  await fixtureMutation(
    page.request,
    `/guardians/${family.guardian.id}/students/${family.student.id}`,
  );
  await page
    .getByRole('button', { name: 'Atualizar acompanhamento', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Nenhum aluno disponível', exact: true }),
  ).toBeVisible();
  await expect(practice(page)).toHaveCount(0);
  expect(
    (
      await page.request.get(
        `/api/backend/reports/student/${family.student.id}/summary`,
      )
    ).status(),
  ).toBe(403);
  await accessible(page);
});

test('recuperação por teclado usa fragmento privado, encerra sessões antigas e exige novo login', async ({
  page,
}, testInfo) => {
  const account = await register(page.request);
  await page.request.post('/api/auth/logout');
  await page.goto('/login');
  await page
    .getByRole('link', { name: 'Esqueci a senha', exact: true })
    .click();
  await expect(page).toHaveURL(/\/recuperar-senha$/);
  await page.getByLabel('E-mail', { exact: true }).fill(account.email);
  await page.getByRole('button', { name: 'Enviar link', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Se o e-mail estiver cadastrado, você vai receber o link.');
  await accessible(page);
  const token = await mailToken(page.request, account.email);
  // Login an old session before the public reset; the reset endpoint must not renew it.
  expect(
    (
      await page.request.post('/api/auth/login', {
        data: { email: account.email, password },
      })
    ).ok(),
  ).toBeTruthy();
  const replacement = 'Browser-changed-password-28';
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'GET') requests.push(request.url());
  });
  await resetForm(page, token, replacement);
  expect(
    requests.every((url) => !url.includes(token) && !url.includes('token=')),
  ).toBeTruthy();
  await page
    .getByRole('button', { name: 'Salvar nova senha', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText(
    'Senha alterada. Entre na sua conta com a nova senha.',
  );
  await accessible(page);
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveCount(0);
  expect((await page.request.get('/api/auth/me')).status()).toBe(401);
  const visitor = await page
    .context()
    .browser()!
    .newContext({ baseURL: process.env.E2E_WEB_URL });
  try {
    expect((await visitor.request.get('/api/auth/me')).status()).toBe(401);
  } finally {
    await visitor.close();
  }
  await page
    .getByRole('link', { name: 'Entrar na minha conta', exact: true })
    .click();
  await page.getByLabel('E-mail', { exact: true }).fill(account.email);
  await page.getByLabel('Senha', { exact: true }).fill(replacement);
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page).toHaveURL(/\/trilha$/);
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(
    account.id,
  );
  if (process.env.QUIZ_SCREENSHOT_DIR) {
    await page.goto('/esqueci-senha');
    await page.screenshot({
      path: `${process.env.QUIZ_SCREENSHOT_DIR}/recovery-${testInfo.project.name}.png`,
      fullPage: true,
    });
  }
});

test('links ausentes e usados exibem recuperação; confirmação e limites Unicode não consomem um link válido', async ({
  page,
}) => {
  await page.goto('/redefinir-senha');
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'Abra o link completo',
  );
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveCount(0);
  await accessible(page);
  const account = await register(page.request);
  await page.request.post('/api/auth/logout');
  const token = await newLink(page.request, account.email);
  let submissions = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/auth/reset-password')
      submissions++;
  });
  await resetForm(page, token, 'Valid-password-12', 'Different-password-12');
  await page
    .getByRole('button', { name: 'Salvar nova senha', exact: true })
    .click();
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'A confirmação precisa ser igual',
  );
  for (const invalid of ['é'.repeat(37), '🙂'.repeat(7)]) {
    await page.getByLabel('Nova senha', { exact: true }).fill(invalid);
    await page
      .getByLabel('Confirmar nova senha', { exact: true })
      .fill(invalid);
    await page
      .getByRole('button', { name: 'Salvar nova senha', exact: true })
      .click();
    await expect(page.locator('main').getByRole('alert')).toContainText(
      'pelo menos 8 caracteres e até 72 bytes',
    );
  }
  expect(submissions).toBe(0);
  const valid = '🙂'.repeat(8);
  await page.getByLabel('Nova senha', { exact: true }).fill(valid);
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill(valid);
  await page
    .getByRole('button', { name: 'Salvar nova senha', exact: true })
    .click();
  await expect(page.getByRole('status')).toHaveText(
    'Senha alterada. Entre na sua conta com a nova senha.',
  );
  expect(submissions).toBe(1);
  await resetForm(page, token, 'Never-accepted-password-82');
  await page
    .getByRole('button', { name: 'Salvar nova senha', exact: true })
    .click();
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'Este link é inválido, expirou ou já foi usado',
  );
  await accessible(page);
  expect(
    (
      await page.request.post('/api/auth/login', {
        data: { email: account.email, password: valid },
      })
    ).ok(),
  ).toBeTruthy();
});

test('falhas de rede permitem tentar novamente sem fabricar envio nem conclusão de recuperação', async ({
  page,
}) => {
  const account = await register(page.request);
  await page.request.post('/api/auth/logout');
  let failed = false;
  await page.route('**/api/auth/forgot-password', (route) => {
    if (!failed) {
      failed = true;
      return route.abort('failed');
    }
    return route.continue();
  });
  await page.goto('/esqueci-senha');
  await expect(page).toHaveURL(/\/recuperar-senha$/);
  await page.getByLabel('E-mail', { exact: true }).fill(account.email);
  await page.getByRole('button', { name: 'Enviar link', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'Não foi possível',
  );
  await page.getByRole('button', { name: 'Enviar link', exact: true }).click();
  await expect(page.getByRole('status')).toBeVisible();
  const token = await mailToken(page.request, account.email);
  let failReset = true;
  await page.route('**/api/auth/reset-password', (route) => {
    if (failReset) {
      failReset = false;
      return route.abort('failed');
    }
    return route.continue();
  });
  await resetForm(page, token, 'Retried-browser-password-36');
  await page
    .getByRole('button', { name: 'Salvar nova senha', exact: true })
    .click();
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'Não foi possível alterar',
  );
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveValue(
    'Retried-browser-password-36',
  );
  await page
    .getByRole('button', { name: 'Salvar nova senha', exact: true })
    .click();
  await expect(page.getByRole('status')).toHaveText(
    'Senha alterada. Entre na sua conta com a nova senha.',
  );
  await accessible(page);
});

test('resposta atrasada de acompanhamento não restaura aluno ou cookies depois de trocar de conta', async ({
  page,
}, testInfo) => {
  const family = fixture.oversight[`late-${testInfo.project.name}`];
  await login(page, family.guardian);
  await expect(assessmentCount(page)).toHaveText('3');
  const oldCookies = await page.context().cookies();
  const oldProgress = await (
    await page.request.get(
      `/api/backend/students/${family.student.id}/learning-progress?schoolYear=3`,
    )
  ).json();
  let release!: () => void, intercepted!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    intercepted = resolve;
  });
  let delay = true;
  await page.route(
    `**/api/backend/students/${family.student.id}/learning-progress*`,
    async (route) => {
      if (!delay) return route.continue();
      delay = false;
      intercepted();
      await pending;
      try {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'set-cookie': oldCookies
              .map(
                (cookie) =>
                  `${cookie.name}=${cookie.value}; Path=/; HttpOnly; SameSite=Lax`,
              )
              .join('\n'),
          },
          body: JSON.stringify(oldProgress),
        });
      } catch {
        /* Logout aborts the abandoned request. */
      }
    },
  );
  await page
    .getByRole('button', { name: 'Atualizar acompanhamento', exact: true })
    .click();
  await started;
  await logout(page);
  await login(page, family.outsideGuardian);
  await expect(
    page.getByRole('heading', { name: 'Nenhum aluno disponível', exact: true }),
  ).toBeVisible();
  release();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect((await (await page.request.get('/api/auth/me')).json()).id).toBe(
    family.outsideGuardian.id,
  );
  await expect(studentSelect(page)).toHaveCount(0);
  await expect(practice(page)).toHaveCount(0);
  await expect(
    page.getByText(family.student.name, { exact: false }),
  ).toHaveCount(0);
});

test('trocar o link durante o salvamento descarta a confirmação antiga e preserva o formulário do novo link', async ({
  page,
  request,
}) => {
  const first = await register(page.request);
  await page.request.post('/api/auth/logout');
  const second = await register(request);
  const firstToken = await newLink(page.request, first.email);
  const secondToken = await newLink(request, second.email);
  let release!: () => void;
  let intercepted!: () => void;
  let drained!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    intercepted = resolve;
  });
  const completed = new Promise<void>((resolve) => {
    drained = resolve;
  });
  let delay = true;
  await page.route('**/api/auth/reset-password', async (route) => {
    if (!delay) return route.continue();
    delay = false;
    const saved = await route.fetch();
    expect(saved.status()).toBe(200);
    const receipt = await saved.json();
    intercepted();
    await pending;
    try {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(receipt),
      });
    } catch {
      /* Capturing the next fragment aborts the previous request. */
    } finally {
      drained();
    }
  });
  await resetForm(page, firstToken, 'First-link-password-26');
  await page
    .getByRole('button', { name: 'Salvar nova senha', exact: true })
    .click();
  await started;
  await page.goto(`/redefinir-senha#token=${secondToken}`);
  await expect(page).toHaveURL(/\/redefinir-senha$/);
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveValue('');
  await expect(
    page.getByLabel('Confirmar nova senha', { exact: true }),
  ).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Salvar nova senha', exact: true }),
  ).toBeEnabled();
  release();
  await completed;
  await expect(
    page.getByText('Senha alterada. Entre na sua conta com a nova senha.', {
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByLabel('Nova senha', { exact: true })
    .fill('Second-link-password-37');
  await page
    .getByLabel('Confirmar nova senha', { exact: true })
    .fill('Second-link-password-37');
  await page
    .getByRole('button', { name: 'Salvar nova senha', exact: true })
    .click();
  await expect(page.getByRole('status')).toHaveText(
    'Senha alterada. Entre na sua conta com a nova senha.',
  );
  expect(
    (
      await request.post('/api/auth/login', {
        data: { email: first.email, password: 'First-link-password-26' },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.post('/api/auth/login', {
        data: { email: second.email, password: 'Second-link-password-37' },
      })
    ).ok(),
  ).toBeTruthy();
});
