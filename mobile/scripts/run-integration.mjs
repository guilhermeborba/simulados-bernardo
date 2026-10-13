import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createFixture } from "../../tests/e2e/fixture.mjs";

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (!process.env.E2E_API_DIR)
  throw new Error(
    "E2E_API_DIR must explicitly identify the compatible API checkout.",
  );
const apiRoot = resolve(process.env.E2E_API_DIR);
if (!existsSync(resolve(apiRoot, "dist/src/main.js")))
  throw new Error(
    "Build the compatible API before the mobile integration proof.",
  );
const requireApi = createRequire(resolve(apiRoot, "package.json"));
const { PrismaClient } = requireApi("@prisma/client");
const { hash } = requireApi("bcryptjs");
const suffix = randomBytes(8).toString("hex");
const schema = `mobile_regression_${suffix}`;
const temporaryDirectory = mkdtempSync(
  resolve(tmpdir(), "simulados-mobile-proof-"),
);
const children = new Set();
let containerName;
let prisma;
let mailServer;
let cleanupPromise;
let failure;
const mailMessages = [];

function command(binary, args, options = {}) {
  const result = spawnSync(binary, args, { encoding: "utf8", ...options });
  if (result.status !== 0)
    throw new Error(`${binary} failed; check the isolated proof environment.`);
  return result.stdout.trim();
}
function start(binary, args, options) {
  const child = spawn(binary, args, {
    stdio: ["ignore", "ignore", "inherit"],
    ...options,
  });
  children.add(child);
  return child;
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  const force = setTimeout(() => child.kill("SIGKILL"), 3000);
  await exited;
  clearTimeout(force);
}
async function mailCapture() {
  mailServer = createServer(async (request, response) => {
    const path = new URL(request.url, "http://127.0.0.1");
    response.setHeader("Content-Type", "application/json");
    const send = (status, body) => {
      response.statusCode = status;
      response.end(JSON.stringify(body));
    };
    if (request.method === "GET" && path.pathname === "/messages") {
      const email = path.searchParams.get("email");
      return send(
        200,
        mailMessages.filter(
          (message) => !email || [].concat(message.to).includes(email),
        ),
      );
    }
    if (request.method !== "POST" || path.pathname !== "/emails")
      return send(404, { message: "Synthetic endpoint not found." });
    let source = "";
    for await (const part of request) {
      source += part;
      if (source.length > 20_000)
        return send(413, { message: "Synthetic payload too large." });
    }
    let message;
    try {
      message = JSON.parse(source);
    } catch {
      return send(400, { message: "Invalid synthetic payload." });
    }
    const recipients = [].concat(message.to || []);
    if (
      !recipients.length ||
      recipients.some((email) => !/@example\.test$/.test(email))
    )
      return send(400, { message: "Synthetic recipients only." });
    mailMessages.push(message);
    return send(200, { id: `synthetic-mobile-message-${mailMessages.length}` });
  });
  mailServer.listen(0, "127.0.0.1");
  await once(mailServer, "listening");
  return `http://127.0.0.1:${mailServer.address().port}`;
}
function cleanup() {
  if (cleanupPromise) return cleanupPromise;
  cleanupPromise = (async () => {
    const errors = [];
    async function attempt(label, action) {
      try {
        await action();
      } catch {
        errors.push(new Error(label));
      }
    }
    await Promise.all(
      [...children].map((child) =>
        attempt("Stopping an isolated proof process failed", () => stop(child)),
      ),
    );
    if (mailServer)
      await attempt(
        "Stopping synthetic mail failed",
        () =>
          new Promise((done, reject) =>
            mailServer.close((error) => (error ? reject(error) : done())),
          ),
      );
    if (prisma) {
      await attempt("Removing the isolated mobile schema failed", async () => {
        if (!/^mobile_regression_[a-f0-9]{16}$/.test(schema))
          throw new Error("Invalid mobile cleanup schema.");
        await prisma.$executeRawUnsafe(
          `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
        );
      });
      await attempt("Disconnecting isolated Prisma failed", () =>
        prisma.$disconnect(),
      );
    }
    if (containerName)
      await attempt("Removing the isolated mobile container failed", () =>
        command("docker", ["rm", "--force", containerName]),
      );
    await attempt("Removing temporary mobile proof files failed", () =>
      rmSync(temporaryDirectory, { recursive: true, force: true }),
    );
    if (errors.length)
      throw new AggregateError(errors, "Mobile proof cleanup failed");
  })();
  return cleanupPromise;
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    void cleanup()
      .catch(() => console.error("Mobile proof cleanup failed."))
      .finally(() => process.exit(signal === "SIGINT" ? 130 : 143));
  });

try {
  let databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    containerName = `simulados-mobile-regression-${suffix}`;
    command("docker", [
      "run",
      "--detach",
      "--rm",
      "--pull=never",
      "--name",
      containerName,
      "--tmpfs",
      "/var/lib/postgresql/data",
      "--publish",
      "127.0.0.1::5432",
      "--env",
      "POSTGRES_USER=simulados_regression_test",
      "--env",
      "POSTGRES_PASSWORD=synthetic-mobile-password",
      "--env",
      "POSTGRES_DB=simulados_regression_test",
      "postgres:16-alpine",
    ]);
    const mapping = command("docker", ["port", containerName, "5432/tcp"]);
    const port = /^127\.0\.0\.1:(\d+)$/.exec(mapping)?.[1];
    if (!port) throw new Error("Expected a random loopback PostgreSQL port.");
    databaseUrl = `postgresql://simulados_regression_test:synthetic-mobile-password@127.0.0.1:${port}/simulados_regression_test`;
    const deadline = Date.now() + 45_000;
    let ready = false;
    while (Date.now() < deadline) {
      if (
        spawnSync(
          "docker",
          [
            "exec",
            containerName,
            "pg_isready",
            "-U",
            "simulados_regression_test",
          ],
          { stdio: "ignore" },
        ).status === 0
      ) {
        ready = true;
        break;
      }
      await new Promise((done) => setTimeout(done, 200));
    }
    if (!ready)
      throw new Error("Disposable mobile PostgreSQL did not become ready.");
  }
  const url = new URL(databaseUrl);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !url.port ||
    decodeURIComponent(url.username) !== "simulados_regression_test" ||
    url.pathname !== "/simulados_regression_test" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "TEST_DATABASE_URL must identify the loopback test user/database and explicit port, without a query or fragment.",
    );
  }
  url.searchParams.set("schema", schema);
  const mailUrl = await mailCapture();
  // Let the OS choose the API port; a parent-owned listener reports readiness.
  const portServer = createServer();
  portServer.listen(0, "127.0.0.1");
  await once(portServer, "listening");
  const apiPort = portServer.address().port;
  await new Promise((done) => portServer.close(done));
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const apiEnvironment = {
    ...process.env,
    DATABASE_URL: url.href,
    NODE_ENV: "test",
    PORT: String(apiPort),
    FRONTEND_URL: "http://127.0.0.1:3000",
    JWT_ACCESS_SECRET: "synthetic-access-secret-mobile-proof",
    JWT_REFRESH_SECRET: "synthetic-refresh-secret-mobile-proof",
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "7d",
    PASSWORD_RESET_ENABLED: "true",
    RESEND_API_KEY: "synthetic-mobile-key",
    MAIL_FROM: "synthetic@example.test",
    RESEND_API_URL: `${mailUrl}/emails`,
    RATE_LIMIT_MAX: "10000",
    API_DOCS_ENABLED: "false",
  };
  prisma = new PrismaClient({ datasources: { db: { url: url.href } } });
  command(
    process.execPath,
    [requireApi.resolve("prisma/build/index.js"), "migrate", "deploy"],
    { cwd: apiRoot, env: apiEnvironment },
  );
  const fixture = await createFixture(prisma, hash, { apiRoot });
  const fixturePath = resolve(temporaryDirectory, "fixture.json");
  writeFileSync(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
  const api = start(process.execPath, [resolve(apiRoot, "dist/src/main.js")], {
    cwd: apiRoot,
    env: apiEnvironment,
  });
  const deadline = Date.now() + 60_000;
  let ready = false;
  while (Date.now() < deadline) {
    if (api.exitCode !== null)
      throw new Error("The isolated API exited before readiness.");
    try {
      if (
        (await fetch(`${apiUrl}/ready`, { signal: AbortSignal.timeout(1000) }))
          .ok
      ) {
        ready = true;
        break;
      }
    } catch {
      /* Startup is bounded; a failed server still fails the proof. */
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  if (!ready) throw new Error("The isolated API did not become ready.");
  console.log(
    "Testing mobile session core → real Nest API → isolated PostgreSQL (no native storage/device claim).",
  );
  const tests = start(
    process.execPath,
    ["--import", "tsx", "--test", "tests/integration/session.test.ts"],
    {
      cwd: mobileRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        E2E_API_DIR: apiRoot,
        E2E_API_URL: apiUrl,
        E2E_FIXTURE_PATH: fixturePath,
        E2E_MAIL_URL: mailUrl,
      },
    },
  );
  const [code] = await once(tests, "exit");
  if (code !== 0)
    throw new Error(
      `Mobile session integration failed (${code}); see the test output above.`,
    );
} catch (error) {
  // Database/transport libraries may include credentials in messages or causes.
  failure = new Error(
    "Mobile integration proof failed; inspect the isolated test results and environment.",
  );
  if (
    error instanceof Error &&
    /^(Mobile session integration failed|TEST_DATABASE_URL|Expected a random|Disposable mobile|The isolated API)/.test(
      error.message,
    )
  )
    failure = error;
} finally {
  try {
    await cleanup();
  } catch {
    if (!failure) failure = new Error("Mobile proof cleanup failed.");
  }
}
if (failure) throw failure;
