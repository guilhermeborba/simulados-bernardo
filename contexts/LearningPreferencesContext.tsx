'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { getLearningPreferences, updateLearningPreferences as savePreferences, type ApiLearningPreferences } from '@/lib/apiClient';
import { useAuth } from './AuthContext';

export const DEFAULT_LEARNING_PREFERENCES: ApiLearningPreferences = {
  segment: null,
  schoolYear: null,
  audioEnabled: false,
  motionEnabled: true,
};

interface PreferencesState {
  ownerId: string | null;
  preferences: ApiLearningPreferences;
  isLoading: boolean;
  pendingSaves: number;
  error: string | null;
}

interface LearningPreferencesValue {
  preferences: ApiLearningPreferences;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updatePreferences: (patch: Partial<ApiLearningPreferences>) => Promise<void>;
  reload: () => Promise<void>;
}

const LearningPreferencesContext = createContext<LearningPreferencesValue | null>(null);

export function LearningPreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, getSessionGeneration } = useAuth();
  const sessionGeneration = getSessionGeneration();
  const userId = authLoading ? null : user?.id ?? null;
  const [state, setState] = useState<PreferencesState>({ ownerId: null, preferences: DEFAULT_LEARNING_PREFERENCES, isLoading: true, pendingSaves: 0, error: null });
  const account = useRef({ id: userId, epoch: 0, sessionGeneration });
  const queue = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);

  // Invalidate old-account responses before effects run; never expose another account's settings.
  if (account.current.id !== userId || account.current.sessionGeneration !== sessionGeneration) {
    account.current = { id: userId, epoch: account.current.epoch + 1, sessionGeneration };
    queue.current = Promise.resolve();
  }

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const isCurrent = useCallback((id: string, epoch: number) => mounted.current && account.current.id === id && account.current.epoch === epoch && account.current.sessionGeneration === getSessionGeneration(), [getSessionGeneration]);

  const reload = useCallback(async () => {
    const { id, epoch } = account.current;
    if (!id) return;
    setState((previous) => ({ ...previous, ownerId: id, isLoading: true, error: null }));
    const task = queue.current.catch(() => undefined).then(async () => {
      if (!isCurrent(id, epoch)) return;
      try {
        const preferences = await getLearningPreferences();
        if (isCurrent(id, epoch)) setState((previous) => ({ ...previous, ownerId: id, preferences, isLoading: false, error: null }));
      } catch {
        if (isCurrent(id, epoch)) setState((previous) => ({ ...previous, isLoading: false, error: 'Não foi possível carregar suas preferências. Tente novamente.' }));
      }
    });
    queue.current = task;
    await task;
  }, [isCurrent]);

  useEffect(() => {
    setState({ ownerId: userId, preferences: DEFAULT_LEARNING_PREFERENCES, isLoading: Boolean(userId), pendingSaves: 0, error: null });
    if (userId) void reload();
  }, [userId, sessionGeneration, reload]);

  const updatePreferences = useCallback(async (patch: Partial<ApiLearningPreferences>) => {
    const { id, epoch } = account.current;
    if (!id) throw new Error('Entre na sua conta para salvar as preferências.');
    setState((previous) => ({ ...previous, pendingSaves: previous.pendingSaves + 1, error: null }));
    const task = queue.current.catch(() => undefined).then(async () => {
      if (!isCurrent(id, epoch)) return;
      try {
        const preferences = await savePreferences(patch);
        if (isCurrent(id, epoch)) setState((previous) => ({ ...previous, preferences, error: null }));
      } catch (error) {
        if (isCurrent(id, epoch)) setState((previous) => ({ ...previous, error: 'Não foi possível salvar a alteração. Suas preferências anteriores foram mantidas.' }));
        throw error;
      } finally {
        if (isCurrent(id, epoch)) setState((previous) => ({ ...previous, pendingSaves: Math.max(0, previous.pendingSaves - 1) }));
      }
    });
    queue.current = task.catch(() => undefined);
    await task;
  }, [isCurrent]);

  const belongsToCurrentUser = state.ownerId === userId;
  const value: LearningPreferencesValue = {
    preferences: belongsToCurrentUser ? state.preferences : DEFAULT_LEARNING_PREFERENCES,
    isLoading: authLoading || (userId !== null && (!belongsToCurrentUser || state.isLoading)),
    isSaving: belongsToCurrentUser && state.pendingSaves > 0,
    error: belongsToCurrentUser ? state.error : null,
    updatePreferences,
    reload,
  };

  useEffect(() => {
    document.documentElement.dataset.learningMotion = value.preferences.motionEnabled ? 'on' : 'off';
    return () => { delete document.documentElement.dataset.learningMotion; };
  }, [value.preferences.motionEnabled]);

  return <LearningPreferencesContext.Provider value={value}>{children}</LearningPreferencesContext.Provider>;
}

export function useLearningPreferences(): LearningPreferencesValue {
  const value = useContext(LearningPreferencesContext);
  if (!value) throw new Error('useLearningPreferences must be used within a LearningPreferencesProvider');
  return value;
}
