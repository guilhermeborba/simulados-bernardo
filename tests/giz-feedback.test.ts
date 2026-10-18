import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiRequestError, startAttempt, submitAttemptAnswer, type ApiAttemptResult, type ApiQuestion } from '../lib/apiClient';
import { mapApiQuestion } from '../lib/questionMapper';
import { answerIsComplete, feedbackContent, makeAnswer, questionsFromResult, responseFeedback, restoreAnswers, type RunnerSnapshot } from '../lib/gizRunner';

const question: ApiQuestion = { id: 'q', type: 'MULTIPLE_CHOICE', statement: 'Enunciado', tip: null, funFact: null, points: '1', order: 1, options: [{ id: 'a', optionKey: 'A', text: 'Alternativa A', groupKey: null, order: 1 }], answer: null };
const feedback = { isCorrect: false, correctAnswer: { answer: 'A' }, tip: 'Relembre a pista.' };
function cached(body: Record<string, unknown> = { answer: 'B' }): RunnerSnapshot {
  return { version: 1, userId: 'u', attempt: { id: 'a', simulationId: 's', status: 'IN_PROGRESS', immediateFeedback: true }, questions: [question], answers: { q: { value: 'B', body, synced: true, feedback: { isCorrect: true, correctAnswer: { answer: 'B' } } } }, drafts: {}, spentMs: {}, currentIndex: 0, remainingMs: 45000, timerEnabled: true };
}

test('unconfirmed questions never acquire an answer from a feedback-shaped payload', () => {
  assert.deepEqual(restoreAnswers([{ ...question, feedback }]), {});
  assert.equal(responseFeedback({ isCorrect: false, correctAnswer: { answer: 'A' } }), undefined);
});

test('server confirmation and correction replace contradictory cached feedback', () => {
  const restored = restoreAnswers([{ ...question, answer: { answer: 'B' }, feedback }], cached());
  assert.equal(restored.q.synced, true);
  assert.equal(restored.q.feedback?.isCorrect, false);
  assert.deepEqual(restored.q.feedback?.correctAnswer, { answer: 'A' });
  assert.equal(restored.q.feedback?.tip, 'Relembre a pista.');
});

test('cached verdicts cannot be attached to a different server answer or explicit missing feedback', () => {
  assert.equal(restoreAnswers([{ ...question, answer: {} }], cached()).q.feedback, undefined);
  assert.equal(restoreAnswers([{ ...question, answer: { answer: 'B' }, feedback: null }], cached()).q.feedback, undefined);
  assert.equal(restoreAnswers([{ ...question, answer: { answer: 'B' } }], cached()).q.feedback?.isCorrect, true);
});

test('an unsynchronized offline response cannot carry a cached answer key', () => {
  const saved = cached(); saved.answers.q.synced = false;
  assert.equal(restoreAnswers([question], saved).q.feedback, undefined);
});

test('feedback parsing allowlists content and rejects array-shaped answer keys', () => {
  const parsed = responseFeedback({ feedback: { ...feedback, privateSnapshot: 'secret', explanation: 42 } });
  assert.equal(parsed?.explanation, undefined);
  assert.equal('privateSnapshot' in parsed!, false);
  assert.equal(responseFeedback({ feedback: { isCorrect: false, correctAnswer: ['A'] } })?.correctAnswer, undefined);
});

test('result option snapshots outrank mutable question data and missing legacy options remain absent', () => {
  const result: ApiAttemptResult = { attempt: { id: 'a', simulationId: 's', status: 'FINISHED', score: '0', maxScore: '1', percentage: '0', correctCount: 0, wrongCount: 1 }, questions: [{ id: 'q', type: 'MULTIPLE_CHOICE', statement: 'Enunciado salvo', tip: null, funFact: null, points: '1', order: 1, answer: {}, isCorrect: false, pointsEarned: '0', options: [{ ...question.options[0], text: 'Alternativa da tentativa' }] }] };
  assert.equal(questionsFromResult(result, [question])[0].options[0].text, 'Alternativa da tentativa');
  assert.equal(questionsFromResult(result, [question])[0].statement, 'Enunciado salvo');
  delete result.questions[0].options;
  assert.equal(questionsFromResult(result, [question])[0].options[0].text, 'Alternativa A');
  assert.deepEqual(questionsFromResult(result), []);
});

test('new starts opt into feedback and immutable-answer conflicts retain their status', async () => {
  const original = globalThis.fetch;
  let sent: RequestInit | undefined;
  globalThis.fetch = async (_input, init) => { sent = init; return new Response(JSON.stringify({ id: 'a', simulationId: 's', status: 'IN_PROGRESS' }), { status: 200 }); };
  try {
    await startAttempt('s');
    assert.deepEqual(JSON.parse(String(sent?.body)), { immediateFeedback: true });
    globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Already confirmed' }), { status: 409 });
    await assert.rejects(() => submitAttemptAnswer('a', 'q', { answer: 'B' }), (error) => error instanceof ApiRequestError && error.status === 409);
  } finally { globalThis.fetch = original; }
});


test('explicit null redacts cached hint or curiosity while omitted fields retain legacy fallback', () => {
  const redacted = responseFeedback({ feedback: { isCorrect: false, correctAnswer: { answer: 'A' }, tip: null, funFact: null, explanation: null } });
  const omitted = responseFeedback({ feedback: { isCorrect: false, correctAnswer: { answer: 'A' } } });
  assert.equal(redacted?.tip, null);
  assert.equal(redacted?.funFact, null);
  assert.equal(redacted?.explanation, null);
  assert.equal(feedbackContent(redacted?.tip, 'Stale cached hint'), null);
  assert.equal(feedbackContent(redacted?.funFact, 'Stale cached curiosity'), null);
  assert.equal(feedbackContent(omitted?.tip, 'Actual legacy hint'), 'Actual legacy hint');
  assert.equal(feedbackContent(omitted?.funFact, 'Actual legacy curiosity'), 'Actual legacy curiosity');
});


test('TEXT classification preserves literal maps, requires every item and survives direct result snapshots', () => {
  const textQuestion: ApiQuestion = { ...question, type: 'CLASSIFICATION', classificationMode: 'TEXT', options: [
    { id: 'a', optionKey: 'a', text: 'Primeira palavra', groupKey: null, order: 1 },
    { id: 'b', optionKey: 'b', text: 'Segunda palavra', groupKey: null, order: 2 },
  ] };
  const mapped = mapApiQuestion(textQuestion);
  assert.equal(mapped.classificationMode, 'TEXT');
  assert.equal(answerIsComplete(mapped, { a: 'substantivo', b: ' ' }), false);
  assert.equal(answerIsComplete(mapped, { a: 'substantivo', b: 5 }), false);
  const literal = { a: '  Nome Próprio  ', b: 'Nome Comum' };
  assert.equal(answerIsComplete(mapped, literal), true);
  assert.deepEqual(makeAnswer(mapped, literal).body, literal);
  assert.deepEqual(makeAnswer(mapped, literal, true).body, {});
  assert.equal(answerIsComplete(mapApiQuestion({ ...textQuestion, classificationMode: undefined }), literal), false);
  const result: ApiAttemptResult = { attempt: { id: 'a', simulationId: 's', status: 'FINISHED', score: '0', maxScore: '1', percentage: '0', correctCount: 0, wrongCount: 1 }, questions: [{ ...textQuestion, answer: literal, isCorrect: false, pointsEarned: '0', correctAnswer: { a: 'próprio', b: 'comum' } }] };
  const source = questionsFromResult(result);
  assert.equal(source.length, 1);
  assert.equal(mapApiQuestion(source[0]).classificationMode, 'TEXT');
  assert.deepEqual(source[0].answer, literal);
});
