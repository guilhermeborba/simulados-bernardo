import type { SecureCredentialStore } from "../core/session";

export const CREDENTIAL_KEY = "simulados-bernardo.refresh.v1";
const INSTALL_MARKER = "simulados-bernardo-install-v1";
const MARKER_VALUE = "simulados-bernardo-install-v1";

interface CredentialDependencies {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
  remove(): Promise<void>;
  hasInstallMarker(): Promise<boolean>;
  createInstallMarker(): Promise<void>;
}

export class NativeCredentialError extends Error {
  constructor() {
    super("Não foi possível proteger a sessão neste dispositivo.");
    this.name = "NativeCredentialError";
  }
}

/** Exported for storage-failure tests; the application uses the native factory. */
export function createCredentialStore(
  dependencies: CredentialDependencies,
): SecureCredentialStore {
  let queue: Promise<unknown> = Promise.resolve();
  const ordered = <T>(job: () => Promise<T>): Promise<T> => {
    const result = queue.then(job).catch(() => {
      throw new NativeCredentialError();
    });
    queue = result.catch(() => undefined);
    return result;
  };
  const remove = async () => {
    await dependencies.remove();
    // A reported deletion must be observable before the client reports logout.
    if ((await dependencies.get()) !== null) throw new NativeCredentialError();
  };
  const ensureInstall = async () => {
    if (await dependencies.hasInstallMarker()) return true;
    // Cache is excluded from backup. If iOS retained a Keychain value after a
    // reinstall, or the OS purged cache, require login instead of auto-restoring.
    await remove();
    await dependencies.createInstallMarker();
    return false;
  };
  return {
    read: () =>
      ordered(async () => {
        if (!(await ensureInstall())) return null;
        const raw = await dependencies.get();
        if (raw === null) return null;
        try {
          const record: unknown = JSON.parse(raw);
          if (!record || typeof record !== "object" || Array.isArray(record))
            throw new Error();
          const value = record as Record<string, unknown>;
          if (
            Object.keys(value).sort().join(",") !== "refreshToken,version" ||
            value.version !== 1 ||
            typeof value.refreshToken !== "string" ||
            value.refreshToken.length < 20 ||
            value.refreshToken.length > 16_384
          )
            throw new Error();
          return value.refreshToken;
        } catch {
          await remove();
          return null;
        }
      }),
    write: (refreshToken) =>
      ordered(async () => {
        if (
          typeof refreshToken !== "string" ||
          refreshToken.length < 20 ||
          refreshToken.length > 16_384
        ) {
          throw new NativeCredentialError();
        }
        await ensureInstall();
        await dependencies.set(JSON.stringify({ version: 1, refreshToken }));
      }),
    clear: () => ordered(remove),
  };
}

export function createNativeCredentialStore(): SecureCredentialStore {
  let modules:
    | Promise<{
        secure: typeof import("expo-secure-store");
        marker: import("expo-file-system").File;
      }>
    | undefined;
  const native = () =>
    (modules ??= Promise.all([
      import("expo-secure-store"),
      import("expo-file-system"),
    ]).then(([secure, files]) => ({
      secure,
      marker: new files.File(files.Paths.cache, INSTALL_MARKER),
    })));
  return createCredentialStore({
    async get() {
      const { secure } = await native();
      return secure.getItemAsync(CREDENTIAL_KEY, {
        keychainAccessible: secure.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    },
    async set(value) {
      const { secure } = await native();
      await secure.setItemAsync(CREDENTIAL_KEY, value, {
        keychainAccessible: secure.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    },
    async remove() {
      const { secure } = await native();
      await secure.deleteItemAsync(CREDENTIAL_KEY);
    },
    async hasInstallMarker() {
      const { marker } = await native();
      return marker.exists && (await marker.text()) === MARKER_VALUE;
    },
    async createInstallMarker() {
      const { marker } = await native();
      marker.create({ overwrite: true, intermediates: true });
      marker.write(MARKER_VALUE);
    },
  });
}
