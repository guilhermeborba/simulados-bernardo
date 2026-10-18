import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { MobileSessionClient, type SessionSnapshot } from './core/session';
import { createNativeCredentialStore } from './platform/secure-store';
import { nativeFetch } from './platform/native-fetch';
import { environment } from './config';
const Context = createContext<{ client: MobileSessionClient; session: SessionSnapshot; foreground: number } | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new MobileSessionClient({ baseUrl: environment.apiOrigin, store: createNativeCredentialStore(), fetch: nativeFetch, allowInsecureHttp: __DEV__ }));
  const [session, setSession] = useState(client.getSnapshot);
  const [foreground, setForeground] = useState(0);
  useEffect(() => {
    const unsubscribe = client.subscribe(() => setSession(client.getSnapshot()));
    void client.restore().catch(() => undefined);
    const state = AppState.addEventListener('change', next => {
      if (next !== 'active') return;
      const snapshot = client.getSnapshot();
      if (snapshot.status === 'authenticated') void client.request('/auth/me').finally(() => setForeground(n => n + 1)).catch(() => undefined);
      else if (snapshot.status === 'retry-required') void client.restore().catch(() => undefined);
    });
    return () => { unsubscribe(); state.remove(); };
  }, [client]);
  return <Context.Provider value={{ client, session, foreground }}>{children}</Context.Provider>;
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('Sessão indisponível.');
  return value;
}
