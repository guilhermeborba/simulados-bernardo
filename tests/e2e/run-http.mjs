import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFixture } from './fixture.mjs';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const apiRoot = resolve(process.env.E2E_API_DIR || resolve(webRoot, 'api'));
if (!existsSync(resolve(apiRoot, 'dist/src/main.js')) || !existsSync(resolve(webRoot, '.next/BUILD_ID'))) {
  throw new Error('Build both the web and API first; E2E_API_DIR must point to the API checkout.');
}
const requireApi = createRequire(resolve(apiRoot, 'package.json'));
const { PrismaClient } = requireApi('@prisma/client');
const { hash } = requireApi('bcryptjs');
const suffix = randomBytes(8).toString('hex');
const schema = `web_regression_${suffix}`;
const temporaryDirectory = mkdtempSync(resolve(tmpdir(), 'simulados-web-e2e-'));
const children = new Set();
let containerName;
let prisma;
let cleanupPromise;
let runFailure;

function command(binary, args, options = {}) {
  const result = spawnSync(binary, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`${binary} failed: ${result.stderr || result.error || 'nonzero exit'}`);
  return result.stdout.trim();
}
async function unusedPort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((done) => server.close(done));
  return port;
}
async function waitForReady(url, child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) throw new Error('Server exited before readiness.');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch { /* Startup is polled; server failures still fail the test. */ }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`Timed out waiting for ${new URL(url).pathname}`);
}
function start(binary, args, options) {
  const child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'inherit'], ...options });
  children.add(child);
  return child;
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  const exited = once(child, 'exit');
  const force = setTimeout(() => child.kill('SIGKILL'), 3000);
  await exited;
  clearTimeout(force);
}
function cleanup() {
  if (cleanupPromise) return cleanupPromise;
  cleanupPromise = (async () => {
    const errors = [];
    async function attempt(label, action) {
      try { await action(); }
      catch (cause) { errors.push(new Error(label, { cause })); }
    }
    await Promise.all([...children].map((child) => attempt('Stopping test process failed', () => stop(child))));
    if (prisma) {
      await attempt('Removing the isolated schema failed', async () => {
        // Only this run's random schema is removed. Existing schemas are untouched.
        if (!/^web_regression_[a-f0-9]{16}$/.test(schema)) throw new Error('Invalid cleanup schema.');
        await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      });
      await attempt('Disconnecting Prisma failed', () => prisma.$disconnect());
    }
    if (containerName) {
      await attempt('Removing the test container failed', () => command('docker', ['rm', '--force', containerName]));
    }
    await attempt('Removing the temporary directory failed', () => rmSync(temporaryDirectory, { recursive: true, force: true }));
    if (errors.length) throw new AggregateError(errors, 'Some e2e cleanup steps failed');
  })();
  return cleanupPromise;
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void cleanup().catch((error) => console.error(error)).finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
  });
}

try {
  let databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    containerName = `simulados-web-regression-${suffix}`;
    command('docker', ['run', '--detach', '--rm', '--name', containerName,
      '--tmpfs', '/var/lib/postgresql/data', '--publish', '127.0.0.1::5432',
      '--env', 'POSTGRES_USER=simulados_regression_test', '--env', 'POSTGRES_PASSWORD=synthetic-test-password',
      '--env', 'POSTGRES_DB=simulados_regression_test', 'postgres:16-alpine']);
    const port = command('docker', ['port', containerName, '5432/tcp']).split(':').at(-1);
    databaseUrl = `postgresql://simulados_regression_test:synthetic-test-password@127.0.0.1:${port}/simulados_regression_test`;
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      const ready = spawnSync('docker', ['exec', containerName, 'pg_isready', '-U', 'simulados_regression_test'], { stdio: 'ignore' });
      if (ready.status === 0) break;
      await new Promise((done) => setTimeout(done, 200));
    }
  }
  const url = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
      || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      || !url.port || decodeURIComponent(url.username) !== 'simulados_regression_test'
      || url.pathname !== '/simulados_regression_test' || url.search || url.hash) {
    throw new Error('TEST_DATABASE_URL must use a loopback host, explicit port and test user/database simulados_regression_test, without URL query parameters or fragment.');
  }
  url.searchParams.set('schema', schema);
  const apiPort = await unusedPort();
  const webPort = await unusedPort();
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const webUrl = `http://127.0.0.1:${webPort}`;
  const apiEnvironment = {
    ...process.env, DATABASE_URL: url.href, NODE_ENV: 'test', PORT: String(apiPort), FRONTEND_URL: webUrl,
    JWT_ACCESS_SECRET: 'synthetic-access-secret-web-regression', JWT_REFRESH_SECRET: 'synthetic-refresh-secret-web-regression',
    JWT_ACCESS_EXPIRES_IN: '15m', JWT_REFRESH_EXPIRES_IN: '7d', RATE_LIMIT_MAX: '10000', API_DOCS_ENABLED: 'false',
  };
  prisma = new PrismaClient({ datasources: { db: { url: url.href } } });
  command(process.execPath, [requireApi.resolve('prisma/build/index.js'), 'migrate', 'deploy'], { cwd: apiRoot, env: apiEnvironment });
  const fixture = await createFixture(prisma, hash, { apiRoot });
  const fixturePath = resolve(temporaryDirectory, 'fixture.json');
  writeFileSync(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
  const api = start(process.execPath, [resolve(apiRoot, 'dist/src/main.js')], { cwd: apiRoot, env: apiEnvironment });
  await waitForReady(`${apiUrl}/ready`, api);
  const requireWeb = createRequire(resolve(webRoot, 'package.json'));
  const web = start(process.execPath, [requireWeb.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(webPort)], {
    cwd: webRoot, env: { ...process.env, NODE_ENV: 'production', BACKEND_API_URL: apiUrl, NEXT_TELEMETRY_DISABLED: '1' },
  });
  await waitForReady(`${webUrl}/login`, web);
  console.log('Testing production Next → BFF → real Nest API → isolated PostgreSQL schema.');
  const testArguments = process.argv.includes('--browser')
    ? [requireWeb.resolve('@playwright/test/cli'), 'test', '--config', 'playwright.config.ts']
    : ['--test', 'tests/e2e/regression.test.mjs', 'tests/e2e/quiz-regression.test.mjs', 'tests/e2e/learning-home-regression.test.mjs', 'tests/e2e/collection-regression.test.mjs'];
  const tests = start(process.execPath, testArguments, {
    cwd: webRoot, stdio: 'inherit', env: { ...process.env, E2E_WEB_URL: webUrl, E2E_FIXTURE_PATH: fixturePath },
  });
  const [code] = await once(tests, 'exit');
  if (code !== 0) throw new Error(`${process.argv.includes('--browser') ? 'Browser' : 'HTTP'} regression failed with exit code ${code}; see the test output above.`);
} catch (error) {
  runFailure = error;
} finally {
  try { await cleanup(); }
  catch (cleanupFailure) {
    if (runFailure) console.error('Additional cleanup failure:', cleanupFailure);
    else runFailure = cleanupFailure;
  }
}
if (runFailure) throw runFailure;
