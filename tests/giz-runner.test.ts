import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ApiQuestion } from '../lib/apiClient';
import { attemptStorageKey, persistSnapshot, readSnapshot, restoreAnswers, resumeStorageKey, type RunnerSnapshot } from '../lib/gizRunner';

const question: ApiQuestion = { id: 'q', type: 'MULTIPLE_CHOICE', statement: 'Enunciado', tip: null, funFact: null, points: '1', order: 1, options: [{ id: 'a', optionKey: 'A', text: 'Alternativa', groupKey: null, order: 1 }], answer: null };
const snapshot = (userId = 'u', attemptId = 'a'): RunnerSnapshot => ({ version: 1, userId, attempt: { id: attemptId, simulationId: 's', status: 'IN_PROGRESS' }, questions: [question], answers: { q: { value: 'A', body: { answer: 'A' }, synced: false } }, drafts: {}, spentMs: {}, currentIndex: 0, remainingMs: 45000, timerEnabled: true });

function storage() {
  const entries = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key) } });
  return entries;
}

test('offline answer survives a server question without a submitted answer', () => {
  const cached = snapshot();
  assert.deepEqual(restoreAnswers([question], cached).q, cached.answers.q);
});

test('server confirmation wins over a stale offline queue, including a blank answer', () => {
  const restored = restoreAnswers([{ ...question, answer: {} }], snapshot());
  assert.equal(restored.q.value, -1);
  assert.equal(restored.q.synced, true);
  assert.deepEqual(restored.q.body, {});
});

test('cache cannot be read as another user, attempt, or simulation', () => {
  const entries = storage();
  const data = snapshot();
  assert.equal(persistSnapshot(data), true);
  assert.equal(readSnapshot('other-user', 's', 'a'), null);
  assert.equal(readSnapshot('u', 'other-simulation', 'a'), null);
  assert.equal(readSnapshot('u', 's', 'other-attempt'), null);
  entries.set(attemptStorageKey('other-user', 'a'), JSON.stringify(data));
  assert.equal(readSnapshot('other-user', 's', 'a'), null);
  assert.equal(readSnapshot('u', 's', 'a')?.userId, 'u');
});

test('finishing an older cached attempt never removes a newer resume pointer', () => {
  const entries = storage();
  const older = snapshot('u', 'older');
  persistSnapshot(older);
  persistSnapshot(snapshot('u', 'newer'));
  persistSnapshot({ ...older, result: { attempt: { ...older.attempt, score: '0', maxScore: '1', percentage: '0', correctCount: 0, wrongCount: 1 }, questions: [] } });
  assert.equal(entries.get(resumeStorageKey('u', 's')), 'newer');
});

test('storage failure is reported instead of claiming durable offline progress', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { setItem() { throw new Error('Quota exceeded'); } } });
  assert.equal(persistSnapshot(snapshot()), false);
});
