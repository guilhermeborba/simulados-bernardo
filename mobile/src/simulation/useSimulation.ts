import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { ApiAttempt, ApiAttemptResult, ApiQuestion } from '../../../packages/api-contracts/src';
import { ApiError, ApiNetworkError, SessionChangedError } from '../core/session';
import { useSession } from '../session-context';
import { useTheme } from '../theme';
import { failure } from '../data';
import { answerIsComplete, makeAnswer, QUESTION_TIME_MS, responseFeedback, restoreAnswers, type RunnerSnapshot } from './model';
import { mapApiQuestion } from './questions';
import { readProgress, saveProgress } from './storage';

export function useSimulation(simulationId: string, attemptId?: string, timerChoice?: string) {
  const { client, session, foreground } = useSession();
  const { timer } = useTheme();
  const [snapshot, setSnapshot] = useState<RunnerSnapshot | null>(null);
  const state = useRef<RunnerSnapshot | null>(null);
  const owner = useRef({ userId: session.user?.id, generation: session.generation });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(false);
  const focused = useRef(false);
  const appState = useRef(AppState.currentState);
  const lastTick = useRef(Date.now());
  const [announcement, setAnnouncement] = useState('');
  const activeLoad = useRef(0);
  const syncFlight = useRef<Promise<void> | null>(null);
  const confirmRef = useRef<(blank?: boolean) => void>(() => undefined);

  function valid() {
    const current = client.getSnapshot();
    return current.generation === owner.current.generation && current.user?.id === owner.current.userId;
  }
  function commit(next: RunnerSnapshot) {
    if (!valid() || next.userId !== owner.current.userId) return;
    state.current = next;
    setSnapshot(next);
    setStorageOk(saveProgress(next));
  }

  async function synchronize() {
    if (syncFlight.current) return syncFlight.current;
    const work = (async () => {
      const initial = state.current;
      const generation = client.getSnapshot().generation;
      if (!initial || initial.result || !valid()) return;
      for (const question of initial.questions) {
        const latest = state.current;
        if (!valid() || client.getSnapshot().generation !== generation || !latest || latest.attempt.id !== initial.attempt.id) return;
        const answer = latest.answers[question.id];
        if (!answer || answer.synced) continue;
        let response: unknown;
        try {
          response = await client.request(`/attempts/${encodeURIComponent(initial.attempt.id)}/questions/${encodeURIComponent(question.id)}/answer`, { method: 'POST', body: JSON.stringify({ answer: answer.body }) });
        } catch (cause) {
          if (!(cause instanceof ApiError) || cause.status !== 409) throw cause;
          // Another confirmation won. Restore its authorized receipt and feedback,
          // rather than retrying a different answer or colouring the local draft.
          const refreshed = await client.request<ApiQuestion[]>(`/attempts/${encodeURIComponent(initial.attempt.id)}/questions`);
          const latestState = state.current;
          if (!valid() || client.getSnapshot().generation !== generation || !latestState || latestState.attempt.id !== initial.attempt.id) return;
          const restored = restoreAnswers(refreshed, latestState);
          if (!restored[question.id]?.synced) throw cause;
          commit({ ...latestState, questions: refreshed.sort((a, b) => a.order - b.order), answers: restored });
          continue;
        }
        const updated = state.current;
        if (!valid() || client.getSnapshot().generation !== generation || !updated || updated.attempt.id !== initial.attempt.id) return;
        commit({ ...updated, answers: { ...updated.answers, [question.id]: { ...answer, synced: true, feedback: responseFeedback(response) } } });
      }
      if (valid()) { setOffline(false); setError(''); }
    })();
    syncFlight.current = work;
    try { await work; } finally { if (syncFlight.current === work) syncFlight.current = null; }
  }

  async function load() {
    const userId = session.user?.id;
    if (!userId || session.status !== 'authenticated') return;
    const load = ++activeLoad.current;
    owner.current = { userId, generation: session.generation };
    state.current = null;
    setSnapshot(null);
    setLoading(true);
    setError('');
    try {
      const attempt = attemptId ? await client.request<ApiAttempt>(`/attempts/${encodeURIComponent(attemptId)}`) : await client.request<ApiAttempt>(`/simulations/${encodeURIComponent(simulationId)}/attempts`, { method: 'POST', body: JSON.stringify({ immediateFeedback: true }) });
      if (attempt.simulationId !== simulationId) throw new Error('Esta tentativa pertence a outro simulado.');
      const questions = (await client.request<ApiQuestion[]>(`/attempts/${encodeURIComponent(attempt.id)}/questions`)).sort((a, b) => a.order - b.order);
      const cached = readProgress(userId, simulationId, attempt.id);
      const answers = restoreAnswers(questions, cached);
      const firstOpen = questions.findIndex((question) => !answers[question.id]);
      const result = attempt.status === 'FINISHED' ? await client.request<ApiAttemptResult>(`/attempts/${encodeURIComponent(attempt.id)}/result`) : undefined;
      if (load !== activeLoad.current || !valid()) return;
      commit({ version: 1, userId, attempt, questions, answers, drafts: cached?.drafts ?? {}, spentMs: cached?.spentMs ?? {}, currentIndex: Math.min(Math.max(cached?.currentIndex ?? (firstOpen < 0 ? questions.length - 1 : firstOpen), 0), Math.max(questions.length - 1, 0)), remainingMs: QUESTION_TIME_MS, timerEnabled: timerChoice === '0' ? false : timerChoice === '1' ? true : cached?.timerEnabled ?? timer, result });
      setOffline(false);
      void synchronize().catch((cause) => { if (valid()) { setOffline(cause instanceof ApiNetworkError); setError(failure(cause)); } });
    } catch (cause) {
      if (load !== activeLoad.current || !valid() || cause instanceof SessionChangedError) return;
      const cached = cause instanceof ApiNetworkError ? readProgress(userId, simulationId, attemptId) : null;
      if (cached) { commit({ ...cached, remainingMs: QUESTION_TIME_MS }); setOffline(true); }
      else { setError(failure(cause)); setOffline(cause instanceof ApiNetworkError); }
    } finally {
      if (load === activeLoad.current && valid()) { setLoading(false); lastTick.current = Date.now(); }
    }
  }

  useEffect(() => {
    void load();
    return () => { activeLoad.current += 1; state.current = null; };
    // Do not restart an active attempt when optional theme preferences load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationId, attemptId, session.generation, session.user?.id, session.status]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    lastTick.current = Date.now();
    return () => { focused.current = false; };
  }, []));

  useEffect(() => {
    if (foreground > 0 && state.current && !state.current.result) void synchronize().catch((cause) => { if (valid()) { setOffline(cause instanceof ApiNetworkError); setError(failure(cause)); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foreground]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => { appState.current = next; lastTick.current = Date.now(); });
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(Math.max(now - lastTick.current, 0), 1500);
      lastTick.current = now;
      const current = state.current;
      if (!focused.current || appState.current !== 'active' || pauseRef.current || !current || current.result || !valid()) return;
      const question = current.questions[current.currentIndex];
      if (!question || current.answers[question.id]) return;
      const remainingMs = current.timerEnabled ? Math.max(0, current.remainingMs - elapsed) : current.remainingMs;
      const previous = Math.ceil(current.remainingMs / 1000);
      const seconds = Math.ceil(remainingMs / 1000);
      if (current.timerEnabled && previous > 30 && seconds <= 30) setAnnouncement('Faltam 30 segundos.');
      if (current.timerEnabled && previous > 10 && seconds <= 10) setAnnouncement('Faltam 10 segundos.');
      commit({ ...current, remainingMs, spentMs: { ...current.spentMs, [question.id]: (current.spentMs[question.id] ?? 0) + elapsed } });
      if (current.timerEnabled && remainingMs === 0) confirmRef.current(true);
    }, 1000);
    return () => { subscription.remove(); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(value: unknown) {
    const current = state.current;
    if (!current) return;
    const question = current.questions[current.currentIndex];
    if (!question || current.answers[question.id]) return;
    commit({ ...current, drafts: { ...current.drafts, [question.id]: value } });
  }
  function confirm(blank = false) {
    const current = state.current;
    if (!current) return;
    const question = current.questions[current.currentIndex];
    if (!question || current.answers[question.id]) return;
    const mapped = mapApiQuestion(question);
    const value = current.drafts[question.id];
    if (!blank && !answerIsComplete(mapped, value)) return;
    const now = Date.now();
    const partial = !focused.current || appState.current !== 'active' || pauseRef.current ? 0 : Math.min(Math.max(now - lastTick.current, 0), 1500);
    lastTick.current = now;
    commit({ ...current, spentMs: { ...current.spentMs, [question.id]: (current.spentMs[question.id] ?? 0) + partial }, answers: { ...current.answers, [question.id]: makeAnswer(mapped, value, blank) } });
    setError('');
    void synchronize().catch((cause) => { if (valid()) { setOffline(cause instanceof ApiNetworkError); if (!(cause instanceof ApiNetworkError)) setError(failure(cause)); } });
  }
  confirmRef.current = confirm;
  function next() {
    const current = state.current;
    if (!current || current.currentIndex >= current.questions.length - 1) return;
    commit({ ...current, currentIndex: current.currentIndex + 1, remainingMs: QUESTION_TIME_MS });
    setAnnouncement('');
    lastTick.current = Date.now();
  }
  function pause(value: boolean) {
    pauseRef.current = value;
    setPaused(value);
    if (!value && state.current) commit({ ...state.current, remainingMs: QUESTION_TIME_MS });
    lastTick.current = Date.now();
  }
  async function sync() {
    setBusy(true);
    try { await synchronize(); } catch (cause) { if (valid()) { setOffline(cause instanceof ApiNetworkError); setError(failure(cause)); } }
    finally { if (valid()) setBusy(false); }
  }
  async function ensureSaved(): Promise<boolean> {
    if (storageOk) return true;
    await sync();
    return Boolean(state.current && Object.values(state.current.answers).every((answer) => answer.synced));
  }
  async function finish(): Promise<string | null> {
    const current = state.current;
    const generation = client.getSnapshot().generation;
    if (!current || busy) return null;
    setBusy(true);
    try {
      await synchronize();
      if (!valid() || client.getSnapshot().generation !== generation || state.current?.questions.some((question) => !state.current?.answers[question.id]?.synced)) return null;
      let result: ApiAttemptResult;
      try { result = await client.request(`/attempts/${encodeURIComponent(current.attempt.id)}/finish`, { method: 'POST' }); }
      catch (cause) {
        if (cause instanceof SessionChangedError || client.getSnapshot().generation !== generation) return null;
        try { result = await client.request(`/attempts/${encodeURIComponent(current.attempt.id)}/result`); } catch { throw cause; }
      }
      if (!valid() || client.getSnapshot().generation !== generation || !state.current || state.current.attempt.id !== current.attempt.id) return null;
      commit({ ...state.current, attempt: result.attempt, result });
      return current.attempt.id;
    } catch (cause) {
      if (valid()) { setOffline(cause instanceof ApiNetworkError); setError(cause instanceof ApiNetworkError ? 'Seu progresso está guardado. Conecte-se para ver o resultado.' : failure(cause)); }
      return null;
    } finally { if (valid()) setBusy(false); }
  }
  return { snapshot: snapshot?.userId === session.user?.id ? snapshot : null, loading, error, offline, storageOk, busy, paused, announcement, choose, confirm, next, pause, sync, ensureSaved, finish, reload: load };
}
