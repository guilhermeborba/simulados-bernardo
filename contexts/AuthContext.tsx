'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  getMe,
  cancelPendingSessionRequests,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  AuthUser,
} from '@/lib/apiClient';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  getSessionGeneration: () => number;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    inviteToken?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const generation = useRef(0);
  const bootstrap = useRef<AbortController | null>(null);
  const mutations = useRef<Promise<unknown>>(Promise.resolve());
  const getSessionGeneration = useCallback(() => generation.current, []);

  useEffect(() => {
    const controller = new AbortController();
    bootstrap.current = controller;
    const current = generation.current;
    const isCurrent = () => !controller.signal.aborted && current === generation.current;
    getMe(controller.signal)
      .then(value => { if (isCurrent()) setUser(value); })
      .catch(() => { if (isCurrent()) setUser(null); })
      .finally(() => { if (isCurrent()) setIsLoading(false); });
    return () => { controller.abort(); };
  }, []);

  const changeSession = useCallback(async (operation: () => Promise<AuthUser | null>) => {
    const current = ++generation.current;
    cancelPendingSessionRequests();
    bootstrap.current?.abort();
    setUser(null);
    setIsLoading(true);
    // Cookie-changing requests run in order; the latest action owns client state.
    const task = mutations.current.catch(() => undefined).then(async () => {
      if (current !== generation.current) throw new Error('A sessão foi alterada. Tente novamente.');
      try {
        const value = await operation();
        if (current !== generation.current) throw new Error('A sessão foi alterada. Tente novamente.');
        setUser(value);
      } finally {
        if (current === generation.current) setIsLoading(false);
      }
    });
    mutations.current = task.catch(() => undefined);
    await task;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await changeSession(async () => (await apiLogin(email, password)).user);
  }, [changeSession]);

  const register = useCallback(
    async (name: string, email: string, password: string, inviteToken?: string) => {
      await changeSession(async () => (await apiRegister(name, email, password, inviteToken)).user);
    }, [changeSession],
  );

  const logout = useCallback(async () => {
    await changeSession(async () => { await apiLogout(); return null; });
  }, [changeSession]);

  return (
    <AuthContext.Provider value={{ user, isLoading, getSessionGeneration, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
