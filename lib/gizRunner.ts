import type { ApiAttempt, ApiAttemptResult, ApiQuestion } from './apiClient';
import { buildAnswerBody, mapApiQuestion, parseStoredAnswer, type TemplateQuestion } from './questionMapper';

export const QUESTION_TIME_MS = 45_000;
export const SESSION_USER_KEY = 'giz:session-user';

export interface AnswerFeedback {
  isCorrect: boolean;
  correctAnswer?: Record<string, unknown>;
  tip?: string | null;
  funFact?: string | null;
  explanation?: string | null;
}

export interface RunnerAnswer {
  value: unknown;
  body: Record<string, unknown>;
  synced: boolean;
  feedback?: AnswerFeedback;
}

export interface RunnerSnapshot {
  version: 1;
  userId: string;
  attempt: ApiAttempt;
  questions: ApiQuestion[];
  answers: Record<string, RunnerAnswer>;
  drafts: Record<string, unknown>;
  spentMs: Record<string, number>;
  currentIndex: number;
  remainingMs: number;
  timerEnabled: boolean;
  result?: ApiAttemptResult;
}

export function attemptStorageKey(userId: string, attemptId: string) {
  return `giz:attempt:${userId}:${attemptId}`;
}

export function resumeStorageKey(userId: string, simulationId: string) {
  return `giz:resume:${userId}:${simulationId}`;
}

export function readSnapshot(userId: string, simulationId: string, attemptId?: string | null): RunnerSnapshot | null {
  try {
    const id = attemptId || localStorage.getItem(resumeStorageKey(userId, simulationId));
    if (!id) return null;
    const raw = localStorage.getItem(attemptStorageKey(userId, id));
    if (!raw) return null;
    const stored = JSON.parse(raw) as RunnerSnapshot;
    if (stored.version !== 1 || stored.userId !== userId || stored.attempt?.id !== id || stored.attempt.simulationId !== simulationId || !Array.isArray(stored.questions) || !stored.answers || !stored.drafts || !stored.spentMs) return null;
    return stored;
  } catch {
    return null;
  }
}

/** A failed browser write must be visible: it cannot be called "saved offline". */
export function persistSnapshot(snapshot: RunnerSnapshot): boolean {
  try {
    localStorage.setItem(attemptStorageKey(snapshot.userId, snapshot.attempt.id), JSON.stringify(snapshot));
    const key = resumeStorageKey(snapshot.userId, snapshot.attempt.simulationId);
    if (snapshot.result) {
      if (localStorage.getItem(key) === snapshot.attempt.id) localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, snapshot.attempt.id);
    }
    return true;
  } catch {
    return false;
  }
}

export function restoreAnswers(questions: ApiQuestion[], cached?: RunnerSnapshot | null): Record<string, RunnerAnswer> {
  const answers: Record<string, RunnerAnswer> = {};
  for (const question of questions) {
    if (question.answer !== null && question.answer !== undefined) {
      const value = parseStoredAnswer(mapApiQuestion(question).type, question.answer);
      answers[question.id] = {
        value: value ?? -1,
        body: typeof question.answer === 'object' ? question.answer as Record<string, unknown> : {},
        synced: true,
        feedback: responseFeedback({ feedback: question.feedback }) ??
          (!('feedback' in question) && equivalentAnswerBodies(question.answer, cached?.answers[question.id]?.body) ? cached?.answers[question.id]?.feedback : undefined),
      };
    } else if (cached?.answers[question.id]) {
      const restored = cached.answers[question.id];
      answers[question.id] = restored.synced || !restored.feedback ? restored : { ...restored, feedback: undefined };
    }
  }
  return answers;
}

export function answerIsComplete(question: TemplateQuestion, value: unknown): boolean {
  if (question.type === 'multiple_choice') return typeof value === 'string' && Boolean(question.options?.some((option) => option.id === value));
  if (!value || typeof value !== 'object') return false;
  const values = value as Record<string, unknown>;
  if (question.type === 'matching') return Boolean(question.pairs?.length) && question.pairs!.every((pair) => pair.right.some((option) => option.id === values[pair.left.id]));
  const allowed = question.type === 'classification' ? ['C', 'P'] : ['V', 'F'];
  return Boolean(question.items?.length) && question.items!.every((item) => allowed.includes(String(values[item.id])));
}

export function makeAnswer(question: TemplateQuestion, value: unknown, blank = false): RunnerAnswer {
  // The existing simulation API records blank answers as {}. Keep -1 locally,
  // rather than sending a sentinel that its correction contract does not use.
  return { value: blank ? -1 : value, body: blank ? {} : buildAnswerBody(question.type, value), synced: false };
}

/** Only real server feedback can produce a correctness state before finishing. */
export function responseFeedback(response: unknown): AnswerFeedback | undefined {
  if (!response || typeof response !== 'object') return undefined;
  const feedback = (response as { feedback?: unknown }).feedback;
  if (!feedback || typeof feedback !== 'object' || typeof (feedback as { isCorrect?: unknown }).isCorrect !== 'boolean') return undefined;
  const raw = feedback as Record<string, unknown>;
  return {
    isCorrect: raw.isCorrect as boolean,
    correctAnswer: isRecord(raw.correctAnswer) ? { ...raw.correctAnswer } : undefined,
    tip: raw.tip === null ? null : typeof raw.tip === 'string' ? raw.tip : undefined,
    funFact: raw.funFact === null ? null : typeof raw.funFact === 'string' ? raw.funFact : undefined,
    explanation: raw.explanation === null ? null : typeof raw.explanation === 'string' ? raw.explanation : undefined,
  };
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

/** Canonical maps can arrive with different key order after a replay. */
export function equivalentAnswerBodies(left: unknown, right: unknown): boolean {
  if (!isRecord(left) || !isRecord(right)) return false;
  const ordered = (body: Record<string, unknown>) => JSON.stringify(Object.keys(body).sort().map((key) => [key, body[key]]));
  return ordered(left) === ordered(right);
}

/** A completed result can carry its own option snapshot. Older APIs use the
 * question endpoint as a fallback; absent alternatives are never fabricated. */
export function questionsFromResult(result: ApiAttemptResult, fallback: ApiQuestion[] = []): ApiQuestion[] {
  return result.questions.flatMap((question) => {
    const source = fallback.find((item) => item.id === question.id);
    const options = Array.isArray(question.options) ? question.options : source?.options;
    if (!options) return [];
    return [{ id: question.id, type: question.type, statement: question.statement, tip: question.tip, funFact: question.funFact, points: question.points, order: question.order, options, answer: question.answer }];
  }).sort((left, right) => left.order - right.order);
}

/** Explicit null is a server redaction; only an omitted field uses old content. */
export function feedbackContent(value: string | null | undefined, fallback: string | null): string | null {
  return value === undefined ? fallback : value;
}

export function isBlankAnswer(value: unknown): boolean {
  if (value === -1 || value === null || value === undefined || value === '') return true;
  if (typeof value !== 'object') return false;
  return Object.keys(value as Record<string, unknown>).length === 0;
}

export async function getAttemptDetails(attemptId: string): Promise<ApiAttempt> {
  const response = await fetch(`/api/backend/attempts/${encodeURIComponent(attemptId)}`, { cache: 'no-store' });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'Não foi possível abrir esta tentativa.');
  return body as ApiAttempt;
}
