import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Browser-only fixtures. No request in this audit reaches an API or database.
const origin = process.env.GIZ_AUDIT_URL || 'http://127.0.0.1:3398';
const output = resolve(process.env.GIZ_AUDIT_OUTPUT || 'test-results/giz-acceptance');
mkdirSync(output, { recursive: true });
const simulation = { id: 'audit-simulation', title: 'Geografia: lugares e paisagens', subtitle: '3º ano · 1º bimestre', schoolYear: 3, bimester: 1, assessment: 'AV1', totalQuestions: 2, discipline: { id: 'geo', name: 'Geografia', slug: 'geografia' } };
const score = { media: 50, simulados: 1, diasSeguidos: 1, melhorSimulado: null };
const attempt = { id: 'audit-attempt', simulationId: simulation.id, status: 'IN_PROGRESS', immediateFeedback: true };
const questions = [1, 2].map(n => ({ id: `audit-question-${n}`, type: 'MULTIPLE_CHOICE', statement: `Questão ${n}: qual elemento faz parte da paisagem?`, points: '1', order: n, answer: null, feedback: null, options: ['A', 'B', 'C', 'D'].map((key, i) => ({ id: `o${n}${key}`, optionKey: key, text: ['Um rio', 'Uma ideia', 'Uma lembrança', 'Uma conversa'][i], groupKey: null, order: i + 1 })) }));
const feedback = { isCorrect: true, correctAnswer: { answer: 'A' }, tip: null, funFact: 'Os rios ajudam a formar paisagens.', explanation: null };
const result = { attempt: { ...attempt, status: 'FINISHED', score: '2', maxScore: '2', percentage: '100', correctCount: 2, wrongCount: 0 }, questions: questions.map(q => ({ ...q, answer: { answer: 'A' }, correctAnswer: { answer: 'A' }, isCorrect: true, pointsEarned: '1', funFact: feedback.funFact })), topics: [{ theme: 'Paisagens', correct: 2, total: 2 }], unclassifiedQuestions: 0 };
const publicPaths = ['/login', '/registro', '/recuperar-senha', '/redefinir-senha', '/sobre'];
const paths = [...publicPaths, '/trilha', '/', '/simulados', `/simulados/${simulation.id}`, '/historico', '/ranking', '/eu', '/pais', '/simulados/novo', '/convite', `/simulado/${simulation.id}?attemptId=${attempt.id}&timer=0`, `/simulado/${simulation.id}?attemptId=${attempt.id}&view=result`, `/simulado/${simulation.id}?attemptId=${attempt.id}&view=review`];
async function setup(context, path, state = 'ready', track = 'kids') {
  await context.addCookies([{ name: 'sb_refresh_token', value: 'synthetic-browser-only', url: origin }]);
  await context.addInitScript(({ track, offline }) => {
    localStorage.setItem('giz:track', track);
    localStorage.setItem('giz:theme', '"light"');
    if (offline) Object.defineProperty(navigator, 'onLine', { get: () => false });
  }, { track, offline: state === 'offline' });
  await context.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const p = url.pathname;
    if (p === '/api/auth/me') return route.fulfill({ json: publicPaths.includes(path) ? null : { id: 'audit-user', name: 'Aluno de Teste', email: 'audit@example.test', role: 'STUDENT' } });
    if (p.includes('learning-preferences')) return route.fulfill({ status: 404, json: {} });
    if (state === 'loading') return route.fulfill({ json: await new Promise(done => setTimeout(() => done([]), 5000)) });
    if (state === 'offline') return route.abort('internetdisconnected');
    if (state === 'error') return route.fulfill({ status: 503, json: { message: 'Falha sintética de aceite.' } });
    if (p.endsWith('/simulations/available')) return route.fulfill({ json: state === 'empty' ? [] : [simulation] });
    if (p.endsWith('/me/attempts') || p.endsWith('/me/turmas')) return route.fulfill({ json: [] });
    if (p.endsWith('/me/pontuacao')) return route.fulfill({ json: score });
    if (p.endsWith('/me/achievements')) return route.fulfill({ json: { achievements: [], stats: { completedQuizzes: 0, topics: 0, completedMissions: 0, totalXp: 0 } } });
    if (p.endsWith('/answer')) return route.fulfill({ json: { confirmedAt: '2026-10-19T12:00:00.000Z', feedback } });
    if (p.endsWith('/result') || p.endsWith('/finish')) return route.fulfill({ json: result });
    if (p.endsWith('/questions')) return route.fulfill({ json: questions });
    if (p.endsWith(`/attempts/${attempt.id}`)) return route.fulfill({ json: attempt });
    return route.fulfill({ status: 404, json: { message: 'Endpoint ausente no cenário controlado.' } });
  });
}
const browser = await chromium.launch();
const report = [];
try {
  for (const width of [360, 390, 768, 1024, 1440]) {
    for (const scale of [1, 2]) {
      for (const path of paths) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        await setup(context, path);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(origin + path);
        await page.locator('h1').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(200);
        await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale * 100}%`; }, scale);
        await page.waitForTimeout(50);
        const metrics = await page.evaluate(() => {
          const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
          const controls = [...document.querySelectorAll('a,button,input,select,summary')].filter(visible).filter(el => !el.classList.contains('skip-link'));
          const small = controls.map(el => {
            const target = el.matches('input[type=radio],input[type=checkbox]') && el.closest('label') ? el.closest('label') : el;
            const r = target.getBoundingClientRect();
            return { tag: el.tagName, text: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || '').trim().slice(0, 60), width: Math.round(r.width), height: Math.round(r.height) };
          }).filter(r => r.width < 48 || r.height < 48);
          return { overflow: document.documentElement.scrollWidth > innerWidth, h1Count: document.querySelectorAll('h1').length, focus: document.activeElement?.tagName, smallTargets: small, navigationItems: document.querySelectorAll('nav[aria-label="Principal"] a').length };
        });
        let axe = [];
        // Full rules on both font sizes at the narrowest and widest layouts.
        if (width === 360 || width === 1440) {
          const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
          axe = scan.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
        }
        report.push({ path, width, scale, ...metrics, axe, errors });
        if (scale === 1 && [390, 1440].includes(width)) await page.screenshot({ path: resolve(output, `${width}-${path.replace(/[^a-z0-9]/gi, '_')}.png`), fullPage: true });
        await context.close();
      }
      console.log(`Layout ${width}px / texto ${scale * 100}% concluído`);
    }
  }
  for (const state of ['empty', 'error', 'offline', 'loading']) {
    for (const path of ['/', '/simulados', '/historico', '/ranking', '/eu']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await setup(context, path, state);
      const page = await context.newPage();
      await page.goto(origin + path);
      await page.waitForTimeout(300);
      report.push({ state, path, width: 390, status: (await page.locator('[role=status],[role=alert]').allTextContents()).join(' ').trim(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await setup(context, '/simulado/');
  const page = await context.newPage();
  await page.goto(`${origin}/simulado/${simulation.id}?attemptId=${attempt.id}&timer=0`);
  await page.getByRole('heading', { name: questions[0].statement }).waitFor();
  await page.keyboard.press('a'); await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: 'Resposta certa!', exact: true }).waitFor();
  const feedbackFocused = await page.evaluate(() => document.activeElement?.textContent === 'Resposta certa!');
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: questions[1].statement }).waitFor();
  const nextFocused = await page.evaluate(() => document.activeElement?.tagName === 'H1');
  await page.getByRole('button', { name: 'Sair do simulado', exact: true }).filter({ visible: true }).focus(); await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
  const escaped = await page.getByRole('dialog').count() === 0;
  report.push({ keyboard: { feedbackFocused, nextFocused, escaped } });
  await context.close();
} finally {
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
const failures = report.filter(r => r.overflow || r.errors?.length || r.axe?.length || r.smallTargets?.length || r.focus && r.focus !== 'H1' || r.h1Count !== undefined && r.h1Count !== 1 || r.keyboard && Object.values(r.keyboard).some(v => !v));
console.log(`${report.length} cenários; ${failures.length} com pendências. Relatório: ${output}/report.json`);
if (failures.length) process.exitCode = 1;
