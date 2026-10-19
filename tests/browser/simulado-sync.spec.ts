import { expect, test } from '@playwright/test';

// Synthetic responses stay inside this browser context and never reach a database.
test('retomada com resposta pendente permite recuperar um 503 sem ficar presa em Conferindo', async ({ page, context, baseURL }) => {
  const attempt = { id: 'giz-sync-attempt', simulationId: 'giz-sync-simulation', status: 'IN_PROGRESS', immediateFeedback: true };
  const question = {
    id: 'giz-sync-question', type: 'MULTIPLE_CHOICE', statement: 'Qual é a resposta retomada?',
    tip: null, funFact: null, points: '1', order: 1, answer: null, feedback: null,
    options: [
      { id: 'giz-sync-option-a', optionKey: 'A', text: 'Resposta A', groupKey: null, order: 1 },
      { id: 'giz-sync-option-b', optionKey: 'B', text: 'Resposta B', groupKey: null, order: 2 },
    ],
  };
  const snapshot = {
    version: 1, userId: 'giz-sync-user', attempt, questions: [question],
    answers: { [question.id]: { value: 'A', body: { answer: 'A' }, synced: false } },
    drafts: {}, spentMs: {}, currentIndex: 0, remainingMs: 45000, timerEnabled: true,
  };
  await context.addCookies([{ name: 'sb_refresh_token', value: 'synthetic-browser-only', url: baseURL! }]);
  await page.addInitScript((saved) => {
    sessionStorage.setItem('giz:session-user', saved.userId);
    localStorage.setItem(`giz:attempt:${saved.userId}:${saved.attempt.id}`, JSON.stringify(saved));
  }, snapshot);
  let submissions = 0;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { id: snapshot.userId, name: 'Aluno sintético', email: 'sync@example.test', role: 'STUDENT' } });
    if (path === `/api/backend/attempts/${attempt.id}`) return route.fulfill({ json: attempt });
    if (path === `/api/backend/attempts/${attempt.id}/questions`) return route.fulfill({ json: [question] });
    if (path.endsWith(`/questions/${question.id}/answer`)) {
      submissions++;
      expect(route.request().postDataJSON()).toEqual({ answer: { answer: 'A' } });
      if (submissions === 1) return route.fulfill({ status: 503, json: { message: 'Servidor indisponível. Tente sincronizar novamente.' } });
      return route.fulfill({ json: { confirmedAt: '2026-10-18T12:00:00.000Z', feedback: { isCorrect: true, correctAnswer: { answer: 'A' }, tip: null, funFact: 'Correção recebida do servidor.', explanation: null } } });
    }
    return route.fulfill({ status: 404, json: { message: 'Unexpected synthetic route' } });
  });
  await page.goto(`/simulado/${attempt.simulationId}?attemptId=${attempt.id}&timer=1`);
  await expect(page.getByRole('heading', { name: question.statement, exact: true })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Servidor indisponível' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Conferindo…', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tentar sincronizar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resposta certa!', exact: true })).toBeVisible();
  await expect(page.getByText('Correção recebida do servidor.', { exact: true })).toBeVisible();
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ver resultado', exact: true }).filter({ visible: true })).toBeEnabled();
  expect(submissions).toBe(2);
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), `giz:attempt:${snapshot.userId}:${attempt.id}`);
  expect(saved.answers[question.id].synced).toBe(true);
});


test('classificação TEXT confirma texto literal, retoma o feedback e revisa pelo snapshot completo', async ({ page, context, baseURL }) => {
  const attempt = { id: 'giz-text-attempt', simulationId: 'giz-text-simulation', status: 'IN_PROGRESS', immediateFeedback: true };
  const question = {
    id: 'giz-text-question', type: 'CLASSIFICATION', classificationMode: 'TEXT', statement: 'Classifique as palavras com texto.',
    tip: null, funFact: null, points: '1', order: 1,
    options: [
      { id: 'giz-text-option-a', optionKey: 'a', text: 'Palavra A', groupKey: null, order: 1 },
      { id: 'giz-text-option-b', optionKey: 'b', text: 'Palavra B', groupKey: null, order: 2 },
    ],
  };
  const literal = { a: '  Minha Classe  ', b: 'Outra Classe' };
  const feedback = { isCorrect: false, correctAnswer: { a: 'Substantivo próprio', b: 'Substantivo comum' }, tip: 'Observe o nome de cada palavra.', funFact: null, explanation: null };
  let answer: Record<string, string> | null = null;
  let finished = false;
  let readsAfterFinish = 0;
  await context.addCookies([{ name: 'sb_refresh_token', value: 'synthetic-browser-only', url: baseURL! }]);
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { id: 'giz-text-user', name: 'Aluno sintético', email: 'text@example.test', role: 'STUDENT' } });
    if (path === `/api/backend/simulations/${attempt.simulationId}/attempts`) {
      expect(route.request().postDataJSON()).toEqual({ immediateFeedback: true });
      return route.fulfill({ json: attempt });
    }
    if (path === `/api/backend/attempts/${attempt.id}`) return route.fulfill({ json: { ...attempt, status: finished ? 'FINISHED' : 'IN_PROGRESS' } });
    if (path === `/api/backend/attempts/${attempt.id}/questions`) {
      if (finished) { readsAfterFinish++; return route.fulfill({ status: 503, json: { message: 'Result snapshots must work independently.' } }); }
      return route.fulfill({ json: [{ ...question, answer, feedback: answer ? feedback : null }] });
    }
    if (path.endsWith(`/questions/${question.id}/answer`)) {
      expect(route.request().postDataJSON()).toEqual({ answer: literal });
      answer = literal;
      return route.fulfill({ json: { confirmedAt: '2026-10-18T12:00:00.000Z', feedback } });
    }
    if (path === `/api/backend/attempts/${attempt.id}/finish` || path === `/api/backend/attempts/${attempt.id}/result`) {
      finished = true;
      return route.fulfill({ json: {
        attempt: { ...attempt, status: 'FINISHED', score: '0', maxScore: '1', percentage: '0', correctCount: 0, wrongCount: 1 },
        questions: [{ ...question, answer: literal, tip: feedback.tip, correctAnswer: feedback.correctAnswer, isCorrect: false, pointsEarned: '0' }],
        topics: [], unclassifiedQuestions: 1,
      } });
    }
    return route.fulfill({ status: 404, json: { message: 'Unexpected synthetic route' } });
  });
  await page.goto(`/simulado/${attempt.simulationId}?timer=0`);
  await expect(page.getByRole('heading', { name: question.statement, exact: true })).toBeVisible();
  await expect(page.locator('main').getByRole('radio')).toHaveCount(0);
  await expect(page.getByText('Substantivo próprio', { exact: false })).toHaveCount(0);
  const confirm = page.getByRole('button', { name: 'Confirmar', exact: true }).filter({ visible: true });
  await page.getByLabel('Palavra A', { exact: true }).fill(literal.a);
  await expect(confirm).toBeDisabled();
  await page.getByLabel('Palavra B', { exact: true }).fill(literal.b);
  await confirm.click();
  await expect(page.getByRole('heading', { name: 'Quase! Vamos olhar a dica?', exact: true })).toBeVisible();
  await expect(page.getByText(feedback.tip, { exact: true })).toBeVisible();
  await expect(page.getByText('Substantivo próprio', { exact: false })).toBeVisible();
  await page.goto(`/simulado/${attempt.simulationId}?attemptId=${attempt.id}&timer=0`);
  await expect(page.getByLabel('Palavra A, sua resposta', { exact: true })).toHaveValue(literal.a);
  await expect(page.getByLabel('Palavra A, sua resposta', { exact: true })).toBeDisabled();
  await expect(page.getByText(feedback.tip, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver resultado', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'Revisar respostas', exact: false })).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/simulado/${attempt.simulationId}?attemptId=${attempt.id}&view=review`);
  await expect(page.getByRole('heading', { name: 'Vamos rever juntos?', exact: true })).toBeVisible();
  await expect(page.getByLabel('Palavra A, sua resposta', { exact: true })).toHaveValue(literal.a);
  await expect(page.getByLabel('Palavra B, sua resposta', { exact: true })).toHaveValue(literal.b);
  await expect(page.getByText('Substantivo próprio', { exact: false })).toBeVisible();
  await expect(page.getByText('Substantivo comum', { exact: false })).toBeVisible();
  expect(readsAfterFinish).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
