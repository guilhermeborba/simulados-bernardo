import type { ApiAttempt, ApiAttemptResult, ApiQuestion } from '../../../packages/api-contracts/src';
import { buildAnswerBody, mapApiQuestion, parseStoredAnswer, type TemplateQuestion } from './questions';

export const QUESTION_TIME_MS = 45_000;

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

export function restoreAnswers(questions: ApiQuestion[], cached?: RunnerSnapshot | null): Record<string, RunnerAnswer> {
  const answers: Record<string, RunnerAnswer> = {};
  for (const question of questions) {
    if (question.answer !== null && question.answer !== undefined) {
      const value = parseStoredAnswer(mapApiQuestion(question).type, question.answer);
      answers[question.id] = {
        value: value ?? -1,
        body: typeof question.answer === 'object' ? question.answer as Record<string, unknown> : {},
        synced: true,
        feedback: responseFeedback(question) ?? (
          question.feedback === undefined && equivalentAnswerBodies(question.answer, cached?.answers[question.id]?.body)
            ? cached?.answers[question.id]?.feedback : undefined
        ),
      };
    } else if (cached?.answers[question.id]) {
      const local = cached.answers[question.id];
      answers[question.id] = local.synced && question.feedback === undefined
        ? local : { ...local, feedback: undefined };
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
    correctAnswer: authorizedCorrectAnswer(raw.correctAnswer),
    tip: typeof raw.tip === 'string' || raw.tip === null ? raw.tip : undefined,
    funFact: typeof raw.funFact === 'string' || raw.funFact === null ? raw.funFact : undefined,
    explanation: typeof raw.explanation === 'string' || raw.explanation === null ? raw.explanation : undefined,
  };
}

export function isBlankAnswer(value: unknown): boolean {
  if (value === -1 || value === null || value === undefined || value === '') return true;
  if (typeof value !== 'object') return false;
  return Object.keys(value as Record<string, unknown>).length === 0;
}


/** Correct answers must come from an authorized API projection, never from option text or hints. */
export function authorizedCorrectAnswer(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([key, item]) => key.length > 0 && typeof item === 'string')
    ? Object.fromEntries(entries) : undefined;
}

export function equivalentAnswerBodies(left: unknown, right: unknown): boolean {
  function ordered(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(ordered);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, ordered(item)]));
    return value;
  }
  return JSON.stringify(ordered(left)) === JSON.stringify(ordered(right));
}

export function authorizedAnswerLines(question: TemplateQuestion | null, body: unknown): string[] {
  const answer = authorizedCorrectAnswer(body);
  if (!answer) return [];
  if (question?.type === 'multiple_choice' || (!question && typeof answer.answer === 'string')) {
    const id = String(answer.answer ?? '');
    const option = question?.options?.find(item => item.id === id);
    return id ? [option ? `${id} — ${option.text}` : `Alternativa ${id}`] : [];
  }
  return Object.entries(answer).map(([key, value]) => {
    const pair = question?.pairs?.find(item => item.left.id === key);
    if (pair) return `${pair.left.text}: ${pair.right.find(item => item.id === value)?.text ?? String(value)}`;
    const label = question?.items?.find(item => item.id === key)?.text ?? key;
    const description = question?.type === 'true_false_multiple' ? value === 'V' ? 'Verdadeiro' : value === 'F' ? 'Falso' : String(value) : String(value);
    return `${label}: ${description}`;
  });
}
