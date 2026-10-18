import { useEffect, useState } from 'react';
import type { ApiAttemptResult, ApiQuestion } from '../../../packages/api-contracts/src';
import { ApiNetworkError, SessionChangedError } from '../core/session';
import { useSession } from '../session-context';
import { failure } from '../data';
import { QUESTION_TIME_MS, restoreAnswers, type RunnerSnapshot } from './model';
import { readProgress, saveProgress } from './storage';

export function useAttemptResult(attemptId: string) {
  const { client, session } = useSession();
  const [snapshot, setSnapshot] = useState<RunnerSnapshot | null>(null);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const userId = session.user?.id;
    if (!userId || session.status !== 'authenticated') return;
    let active = true;
    const generation = session.generation;
    setSnapshot(null); setError(''); setLoading(true);
    void (async () => {
      try {
        const result = await client.request<ApiAttemptResult>(`/attempts/${encodeURIComponent(attemptId)}/result`);
        if (!active || generation !== client.getSnapshot().generation) return;
        const cached = readProgress(userId, result.attempt.simulationId, attemptId);
        let source = cached?.questions ?? [];
        // New result snapshots include their own options. Legacy results may need
        // the questions endpoint; that optional enrichment must not hide a result.
        if (result.questions.some(question => !Array.isArray(question.options))) {
          try { source = await client.request<ApiQuestion[]>(`/attempts/${encodeURIComponent(attemptId)}/questions`); }
          catch (cause) { if (cause instanceof SessionChangedError) throw cause; }
        }
        if (!active || generation !== client.getSnapshot().generation) return;
        const questions: ApiQuestion[] = result.questions.map(question => ({
          id: question.id,
          type: question.type,
          statement: question.statement,
          tip: question.tip,
          funFact: question.funFact,
          points: question.points,
          order: question.order,
          answer: question.answer,
          options: question.options ?? source.find(item => item.id === question.id)?.options ?? [],
          theme: question.theme,
          feedback: question.feedback !== undefined ? question.feedback : source.find(item => item.id === question.id)?.feedback,
          confirmedAt: question.confirmedAt ?? source.find(item => item.id === question.id)?.confirmedAt,
        })).sort((a, b) => a.order - b.order);
        const next: RunnerSnapshot = { version: 1, userId, attempt: result.attempt, questions, answers: restoreAnswers(questions, cached), drafts: cached?.drafts ?? {}, spentMs: cached?.spentMs ?? {}, currentIndex: 0, remainingMs: QUESTION_TIME_MS, timerEnabled: cached?.timerEnabled ?? true, result };
        saveProgress(next); setSnapshot(next); setOffline(false);
      } catch (cause) {
        if (!active || generation !== client.getSnapshot().generation || cause instanceof SessionChangedError) return;
        const cached = cause instanceof ApiNetworkError ? readProgress(userId, undefined, attemptId) : null;
        if (cached?.result) { setSnapshot(cached); setOffline(true); } else setError(failure(cause));
      } finally { if (active && generation === client.getSnapshot().generation) setLoading(false); }
    })();
    return () => { active = false; };
  }, [client, session.generation, session.user?.id, session.status, attemptId, revision]);
  return { snapshot: snapshot?.userId === session.user?.id ? snapshot : null, error, offline, loading, reload: () => setRevision(value => value + 1) };
}
