/** Native session ownership. A transport must reject redirects, including on native. */
export interface SecureCredentialStore {
  read(): Promise<string | null>;
  write(refreshToken: string): Promise<void>;
  clear(): Promise<void>;
}

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "GUARDIAN" | "TEACHER" | "ADMIN";
  status: "ACTIVE";
}

export type SessionStatus =
  | "signed-out"
  | "restoring"
  | "signing-in"
  | "authenticated"
  | "retry-required"
  | "storage-error";

export interface SessionSnapshot {
  readonly status: SessionStatus;
  readonly user: Readonly<MobileUser> | null;
  readonly generation: number;
}

export interface MobileSessionOptions {
  baseUrl: string;
  store: SecureCredentialStore;
  fetch?: typeof fetch;
  /** Explicit development opt-in for local API / physical device LAN testing. */
  allowInsecureHttp?: boolean;
  requestTimeoutMs?: number;
}

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(
      status === 401
        ? "Sua sessão precisa ser renovada."
        : "Não foi possível concluir a solicitação.",
    );
    this.name = "ApiError";
  }
}
export class ApiNetworkError extends Error {
  constructor() {
    super("Não foi possível conectar. Tente novamente.");
    this.name = "ApiNetworkError";
  }
}
export class CredentialStorageError extends Error {
  constructor() {
    super("Não foi possível proteger a sessão neste dispositivo.");
    this.name = "CredentialStorageError";
  }
}
export class SessionChangedError extends Error {
  constructor() {
    super("A sessão mudou durante a solicitação.");
    this.name = "SessionChangedError";
  }
}
export class SessionRequiredError extends Error {
  constructor() {
    super("Entre na sua conta para continuar.");
    this.name = "SessionRequiredError";
  }
}
export class RequestCancelledError extends Error {
  constructor() {
    super("Solicitação cancelada.");
    this.name = "RequestCancelledError";
  }
}
export class ApiResponseError extends Error {
  constructor() {
    super("A API retornou uma resposta inválida.");
    this.name = "ApiResponseError";
  }
}

interface Credentials {
  accessToken: string;
  refreshToken: string;
  user: MobileUser;
}
const publicPaths = new Set(["/auth/forgot-password", "/auth/reset-password"]);
const internalAuthPaths = new Set([
  ...publicPaths,
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/register",
]);

function token(value: unknown): value is string {
  return typeof value === "string" && value.length >= 20;
}
function credentials(value: unknown): Credentials {
  if (!value || typeof value !== "object") throw new ApiResponseError();
  const pair = value as Partial<Credentials>;
  const user = pair.user;
  if (
    !token(pair.accessToken) ||
    !token(pair.refreshToken) ||
    !user ||
    typeof user.id !== "string" ||
    !user.id ||
    typeof user.name !== "string" ||
    typeof user.email !== "string" ||
    user.status !== "ACTIVE" ||
    !["STUDENT", "GUARDIAN", "TEACHER", "ADMIN"].includes(user.role)
  )
    throw new ApiResponseError();
  return {
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: "ACTIVE",
    },
  };
}

export class MobileSessionClient {
  private readonly base: URL;
  private readonly transport: typeof fetch;
  private readonly timeoutMs: number;
  private generation = 0;
  private sessionAbort = new AbortController();
  private access: string | null = null;
  private refresh: string | null = null;
  private snapshot: SessionSnapshot = Object.freeze({
    status: "signed-out",
    user: null,
    generation: 0,
  });
  private readonly listeners = new Set<() => void>();
  private storeQueue: Promise<void> = Promise.resolve();
  private refreshFlight: { generation: number; promise: Promise<void> } | null =
    null;
  private restoreFlight: Promise<SessionSnapshot> | null = null;

  constructor(private readonly options: MobileSessionOptions) {
    this.base = new URL(options.baseUrl);
    if (
      !["https:", "http:"].includes(this.base.protocol) ||
      (this.base.protocol === "http:" && !options.allowInsecureHttp) ||
      this.base.username ||
      this.base.password ||
      this.base.search ||
      this.base.hash ||
      this.base.pathname !== "/"
    )
      throw new Error(
        "Configure uma origem de API válida; HTTP exige habilitação local explícita.",
      );
    this.transport = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.requestTimeoutMs ?? 15_000;
    if (
      !Number.isInteger(this.timeoutMs) ||
      this.timeoutMs < 1 ||
      this.timeoutMs > 120_000
    )
      throw new Error("Tempo limite inválido.");
  }

  getSnapshot = (): SessionSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private publish(
    status: SessionStatus,
    user: MobileUser | null = this.snapshot.user,
  ) {
    this.snapshot = Object.freeze({
      status,
      user: user ? Object.freeze({ ...user }) : null,
      generation: this.generation,
    });
    for (const listener of this.listeners) listener();
  }
  private current(generation: number) {
    if (generation !== this.generation) throw new SessionChangedError();
  }
  private begin(status: SessionStatus) {
    this.generation += 1;
    this.sessionAbort.abort();
    this.sessionAbort = new AbortController();
    this.access = null;
    this.refresh = null;
    this.refreshFlight = null;
    this.restoreFlight = null;
    this.publish(status, null);
    return this.generation;
  }
  /** One ordered queue also covers a write already started before logout. */
  private stored<T>(
    generation: number,
    operation: () => Promise<T>,
  ): Promise<T> {
    const job = this.storeQueue.then(async () => {
      this.current(generation);
      return operation();
    });
    this.storeQueue = job.then(
      () => undefined,
      () => undefined,
    );
    return job;
  }

  private address(path: string): URL {
    if (
      typeof path !== "string" ||
      !path.startsWith("/") ||
      path.startsWith("//") ||
      path.includes("\\") ||
      path.includes("#")
    )
      throw new Error("Use apenas caminhos relativos da API.");
    const url = new URL(path, this.base);
    if (url.origin !== this.base.origin)
      throw new Error("Origem da API inválida.");
    return url;
  }

  private async send(
    path: string,
    init: RequestInit = {},
    access?: string,
    sessionSignal?: AbortSignal,
    retainIssuedResponse = false,
  ): Promise<Response> {
    const url = this.address(path);
    const controller = new AbortController();
    const sources = [init.signal, sessionSignal].filter(
      (signal): signal is AbortSignal => Boolean(signal),
    );
    const abort = () => controller.abort();
    for (const signal of sources) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener("abort", abort, { once: true });
    }
    const timer = setTimeout(abort, this.timeoutMs);
    const headers = new Headers(init.headers);
    // Credentials are exclusively owned by this client, including for public calls.
    headers.delete("authorization");
    headers.delete("cookie");
    if (access) headers.set("authorization", `Bearer ${access}`);
    if (init.body && !headers.has("content-type"))
      headers.set("content-type", "application/json");
    try {
      if (controller.signal.aborted) throw new RequestCancelledError();
      const response = await this.transport(url.href, {
        ...init,
        headers,
        credentials: "omit",
        redirect: "error",
        signal: controller.signal,
      });
      if (!retainIssuedResponse && sources.some((signal) => signal.aborted))
        throw new RequestCancelledError();
      if (
        response.redirected ||
        (response.status >= 300 && response.status < 400) ||
        (response.url && new URL(response.url).href !== url.href)
      )
        throw new ApiResponseError();
      return response;
    } catch (error) {
      if (
        error instanceof ApiResponseError ||
        error instanceof RequestCancelledError
      )
        throw error;
      if (sources.some((signal) => signal.aborted))
        throw new RequestCancelledError();
      throw new ApiNetworkError();
    } finally {
      clearTimeout(timer);
      for (const signal of sources) signal.removeEventListener("abort", abort);
    }
  }
  /** JSON shares the same finite body lifetime as media; never buffer more than 2 MiB. */
  private async json<T>(
    response: Response,
    signals: readonly (AbortSignal | null | undefined)[] = [],
    observeLateCredentials = false,
  ): Promise<T> {
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      throw new ApiError(response.status);
    }
    if (response.status === 204) {
      void response.body?.cancel().catch(() => undefined);
      return undefined as T;
    }
    const maxBytes = 2 * 1024 * 1024;
    const length = response.headers.get("content-length");
    if (
      length !== null &&
      (!/^\d+$/.test(length) ||
        !Number.isSafeInteger(Number(length)) ||
        Number(length) > maxBytes)
    ) {
      void response.body?.cancel().catch(() => undefined);
      throw new ApiResponseError();
    }
    if (!response.body || typeof response.body.getReader !== "function")
      throw new ApiResponseError();
    const reader = response.body.getReader();
    const sources = signals.filter((signal): signal is AbortSignal =>
      Boolean(signal),
    );
    let interruption: Error | null = null;
    let interrupt!: (error: Error) => void;
    const interrupted = new Promise<never>((_, reject) => {
      interrupt = reject;
    });
    // Attach immediately: cancellation can precede the first asynchronous read.
    void interrupted.catch(() => undefined);
    const cancelReader = () => {
      void reader.cancel().catch(() => undefined);
    };
    const stop = (error: Error) => {
      interruption ??= error;
      interrupt(interruption);
      cancelReader();
    };
    const aborted = () => stop(new RequestCancelledError());
    for (const signal of sources) {
      // An already completed auth response observed after logout still contains a
      // successor we can revoke. It gets a bounded read, never a session commit.
      if (signal.aborted) {
        if (!observeLateCredentials) aborted();
      } else signal.addEventListener("abort", aborted, { once: true });
    }
    const timer = setTimeout(() => stop(new ApiNetworkError()), this.timeoutMs);
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      for (;;) {
        if (interruption) throw interruption;
        const chunk = await Promise.race([reader.read(), interrupted]);
        if (interruption) throw interruption;
        if (chunk.done) break;
        total += chunk.value.byteLength;
        if (total > maxBytes) throw new ApiResponseError();
        chunks.push(chunk.value);
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      try {
        return JSON.parse(new TextDecoder().decode(bytes)) as T;
      } catch {
        throw new ApiResponseError();
      }
    } catch (error) {
      if (
        error instanceof ApiResponseError ||
        error instanceof RequestCancelledError ||
        error instanceof ApiNetworkError
      )
        throw error;
      throw new ApiNetworkError();
    } finally {
      clearTimeout(timer);
      for (const signal of sources)
        signal.removeEventListener("abort", aborted);
      cancelReader();
      try {
        reader.releaseLock();
      } catch {
        /* A native cancelled read can settle after the deadline. */
      }
    }
  }
  private async revoke(refreshToken: string | null) {
    if (!refreshToken) return;
    try {
      await this.send("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      /* Local removal never depends on a remote response. */
    }
  }
  private async end(generation: number, status: SessionStatus = "signed-out") {
    this.current(generation);
    const old = this.refresh;
    const next = this.begin(status);
    const revocation = this.revoke(old);
    try {
      await this.stored(next, () => this.options.store.clear());
      this.current(next);
    } catch (error) {
      if (error instanceof SessionChangedError) throw error;
      if (next === this.generation) this.publish("storage-error", null);
      throw new CredentialStorageError();
    } finally {
      await revocation;
    }
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<SessionSnapshot> {
    const old = this.refresh;
    const generation = this.begin("signing-in");
    const sessionSignal = this.sessionAbort.signal;
    void this.revoke(old);
    try {
      try {
        await this.stored(generation, () => this.options.store.clear());
      } catch (error) {
        if (error instanceof SessionChangedError) throw error;
        throw new CredentialStorageError();
      }
      this.current(generation);
      const response = await this.send(
        "/auth/login",
        { method: "POST", body: JSON.stringify(input) },
        undefined,
        sessionSignal,
        true,
      );
      const pair = credentials(
        await this.json<unknown>(response, [sessionSignal], true),
      );
      await this.accept(pair, generation);
      return this.snapshot;
    } catch (error) {
      if (
        generation !== this.generation ||
        error instanceof CredentialStorageError
      ) {
        if (
          error instanceof CredentialStorageError &&
          generation === this.generation
        )
          this.publish("storage-error", null);
        throw error instanceof CredentialStorageError
          ? error
          : new SessionChangedError();
      }
      this.publish("signed-out", null);
      throw error;
    }
  }

  restore(): Promise<SessionSnapshot> {
    if (this.restoreFlight) return this.restoreFlight;
    if (this.snapshot.status === "authenticated")
      return Promise.resolve(this.snapshot);
    const generation = this.refresh ? this.generation : this.begin("restoring");
    const work = (async () => {
      try {
        if (!this.refresh) {
          let stored: string | null;
          try {
            stored = await this.stored(generation, () =>
              this.options.store.read(),
            );
          } catch (error) {
            if (error instanceof SessionChangedError) throw error;
            this.publish("storage-error", null);
            throw new CredentialStorageError();
          }
          this.current(generation);
          if (!stored) {
            this.publish("signed-out", null);
            return this.snapshot;
          }
          if (!token(stored)) {
            await this.end(generation);
            throw new SessionRequiredError();
          }
          this.refresh = stored;
        }
        await this.renew(generation);
        this.current(generation);
        return this.snapshot;
      } catch (error) {
        if (
          generation !== this.generation &&
          !(error instanceof ApiError && error.status === 401) &&
          !(error instanceof CredentialStorageError) &&
          !(error instanceof SessionRequiredError)
        )
          throw new SessionChangedError();
        throw error;
      }
    })();
    this.restoreFlight = work;
    void work
      .finally(() => {
        if (this.restoreFlight === work) this.restoreFlight = null;
      })
      .catch(() => undefined);
    return work;
  }

  private async accept(pair: Credentials, generation: number) {
    if (generation !== this.generation) {
      await this.revoke(pair.refreshToken);
      throw new SessionChangedError();
    }
    try {
      await this.stored(generation, () =>
        this.options.store.write(pair.refreshToken),
      );
    } catch (error) {
      const revocation = this.revoke(pair.refreshToken);
      if (generation === this.generation) {
        try {
          await this.end(generation);
        } catch {
          /* Snapshot records a failure to clear secure storage. */
        }
      }
      await revocation;
      if (error instanceof SessionChangedError) throw error;
      throw new CredentialStorageError();
    }
    if (generation !== this.generation) {
      await this.revoke(pair.refreshToken);
      throw new SessionChangedError();
    }
    this.access = pair.accessToken;
    this.refresh = pair.refreshToken;
    this.publish("authenticated", pair.user);
  }

  private renew(generation: number): Promise<void> {
    this.current(generation);
    if (this.refreshFlight?.generation === generation)
      return this.refreshFlight.promise;
    const refreshToken = this.refresh;
    if (!refreshToken) return Promise.reject(new SessionRequiredError());
    this.access = null;
    const sessionSignal = this.sessionAbort.signal;
    const work = (async () => {
      try {
        const response = await this.send(
          "/auth/refresh",
          { method: "POST", body: JSON.stringify({ refreshToken }) },
          undefined,
          sessionSignal,
          true,
        );
        const pair = credentials(
          await this.json<unknown>(response, [sessionSignal], true),
        );
        await this.accept(pair, generation);
      } catch (error) {
        if (error instanceof CredentialStorageError) throw error;
        if (generation !== this.generation) throw new SessionChangedError();
        if (error instanceof ApiError && error.status === 401) {
          await this.end(generation);
          throw error;
        }
        // The old credential survives transport / 5xx failures. A committed rotation
        // with a lost response cannot be reconstructed; a later 401 requires login.
        this.publish("retry-required");
        throw error;
      }
    })();
    this.refreshFlight = { generation, promise: work };
    void work
      .finally(() => {
        if (this.refreshFlight?.promise === work) this.refreshFlight = null;
      })
      .catch(() => undefined);
    return work;
  }

  private async authenticatedResponse(
    path: string,
    init: RequestInit = {},
  ): Promise<{
    response: Response;
    generation: number;
    sessionSignal: AbortSignal;
  }> {
    const url = this.address(path);
    if (internalAuthPaths.has(url.pathname))
      throw new Error(
        "Use os métodos de sessão ou publicRequest para autenticação.",
      );
    const generation = this.generation;
    const sessionSignal = this.sessionAbort.signal;
    if (!this.access) await this.renew(generation);
    this.current(generation);
    let usedAccess = this.access!;
    let response: Response;
    try {
      response = await this.send(path, init, usedAccess, sessionSignal);
    } catch (error) {
      this.current(generation);
      throw error;
    }
    this.current(generation);
    if (response.status === 401) {
      if (!this.access || usedAccess === this.access)
        await this.renew(generation);
      this.current(generation);
      usedAccess = this.access!;
      try {
        response = await this.send(path, init, usedAccess, sessionSignal);
      } catch (error) {
        this.current(generation);
        throw error;
      }
      this.current(generation);
      if (response.status === 401 && usedAccess === this.access) {
        await this.end(generation);
        throw new ApiError(401);
      }
    }
    return { response, generation, sessionSignal };
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const { response, generation, sessionSignal } =
      await this.authenticatedResponse(path, init);
    try {
      const result = await this.json<T>(response, [sessionSignal, init.signal]);
      this.current(generation);
      if (init.signal?.aborted) throw new RequestCancelledError();
      return result;
    } catch (error) {
      this.current(generation);
      throw error;
    }
  }

  /** Consume authorized media within a byte budget before exposing it to the UI. */
  async requestBytes(
    path: string,
    limits: { maxBytes: number; contentTypes: readonly string[] },
    init: RequestInit = {},
  ): Promise<{ bytes: Uint8Array; contentType: string }> {
    if (
      !Number.isSafeInteger(limits.maxBytes) ||
      limits.maxBytes < 1 ||
      limits.maxBytes > 10_000_000 ||
      !limits.contentTypes.length
    )
      throw new Error("Limite de mídia inválido.");
    const { response, generation, sessionSignal } =
      await this.authenticatedResponse(path, init);
    this.current(generation);
    if (!response.ok) throw new ApiError(response.status);
    const contentType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!limits.contentTypes.includes(contentType))
      throw new ApiResponseError();
    const length = response.headers.get("content-length");
    if (
      length !== null &&
      (!/^\d+$/.test(length) ||
        !Number.isSafeInteger(Number(length)) ||
        Number(length) > limits.maxBytes)
    )
      throw new ApiResponseError();
    // expo/fetch supplies a readable stream. An unbounded arrayBuffer fallback
    // would allocate the whole download before checking a misleading length.
    if (!response.body || typeof response.body.getReader !== "function")
      throw new ApiResponseError();
    const reader = response.body.getReader();
    let timedOut = false;
    const aborted = () => {
      void reader.cancel().catch(() => undefined);
    };
    sessionSignal.addEventListener("abort", aborted, { once: true });
    init.signal?.addEventListener("abort", aborted, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      aborted();
    }, this.timeoutMs);
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      for (;;) {
        this.current(generation);
        if (init.signal?.aborted) throw new RequestCancelledError();
        const chunk = await reader.read();
        this.current(generation);
        if (init.signal?.aborted) throw new RequestCancelledError();
        if (timedOut) throw new ApiNetworkError();
        if (chunk.done) break;
        total += chunk.value.byteLength;
        if (total > limits.maxBytes) throw new ApiResponseError();
        chunks.push(chunk.value);
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      this.current(generation);
      return { bytes, contentType };
    } catch (error) {
      this.current(generation);
      if (
        error instanceof ApiResponseError ||
        error instanceof RequestCancelledError
      )
        throw error;
      throw new ApiNetworkError();
    } finally {
      clearTimeout(timer);
      sessionSignal.removeEventListener("abort", aborted);
      init.signal?.removeEventListener("abort", aborted);
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }

  /** Recovery calls neither require nor modify the active account. */
  async publicRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = this.address(path);
    if (!publicPaths.has(url.pathname))
      throw new Error("Rota pública não permitida.");
    return this.json<T>(await this.send(path, init), [init.signal]);
  }

  async logout(): Promise<void> {
    await this.end(this.generation);
  }
}
