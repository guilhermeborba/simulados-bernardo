import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { MobileSessionClient, type SessionSnapshot } from "./core/session";
import { createNativeCredentialStore } from "./platform/secure-store";
import { nativeFetch } from "./platform/native-fetch";
import { MobileMediaCache } from "./platform/media";
import { environment } from "./config";
const Context = createContext<{
  client: MobileSessionClient;
  session: SessionSnapshot;
  media: MobileMediaCache;
  foreground: number;
  cleanupError: string | null;
  cleanupMedia: () => Promise<boolean>;
} | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new MobileSessionClient({
        baseUrl: environment.apiOrigin,
        store: createNativeCredentialStore(),
        fetch: nativeFetch,
        allowInsecureHttp: __DEV__,
      }),
  );
  const [media] = useState(() => new MobileMediaCache(client));
  const [session, setSession] = useState(client.getSnapshot);
  const [foreground, setForeground] = useState(0);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const cleanupMedia = useCallback(async () => {
    try {
      await media.clear();
      setCleanupError(null);
      return true;
    } catch {
      setCleanupError(
        "Não foi possível limpar toda a mídia temporária. Tente a limpeza novamente.",
      );
      return false;
    }
  }, [media]);
  const last = useRef(session.generation);
  useEffect(() => {
    const unsubscribe = client.subscribe(() => {
      const value = client.getSnapshot();
      if (value.generation !== last.current) {
        last.current = value.generation;
        void cleanupMedia();
      }
      setSession(value);
    });
    void client.restore().catch(() => undefined);
    const state = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        void cleanupMedia();
        return;
      }
      const snapshot = client.getSnapshot();
      if (snapshot.status === "authenticated")
        void client
          .request("/auth/me")
          .then(() => setForeground((n) => n + 1))
          .catch(() => setForeground((n) => n + 1));
      else if (snapshot.status === "retry-required")
        void client.restore().catch(() => undefined);
    });
    return () => {
      unsubscribe();
      state.remove();
      void media.clear().catch(() => undefined);
    };
  }, [client, media, cleanupMedia]);
  return (
    <Context.Provider
      value={{ client, session, media, foreground, cleanupError, cleanupMedia }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("Sessão indisponível.");
  return value;
}
