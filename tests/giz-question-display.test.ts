import assert from 'node:assert/strict';
import { test } from 'node:test';
import { displayAnswerValue } from '../lib/gizQuestionDisplay';
import { buildAnswerBody, parseStoredAnswer } from '../lib/questionMapper';

test('legacy boolean selections and authorized keys display alongside current V/F values', () => {
  const stored = { a: true, b: false, c: 'true', d: 'false', e: 'v', f: 'F' };
  assert.deepEqual(displayAnswerValue('true_false_multiple', stored), { a: 'V', b: 'F', c: 'V', d: 'F', e: 'V', f: 'F' });
  assert.deepEqual(stored, { a: true, b: false, c: 'true', d: 'false', e: 'v', f: 'F' });
  assert.deepEqual(buildAnswerBody('true_false_multiple', parseStoredAnswer('true_false_multiple', stored)), stored);
});

test('display normalization preserves unrelated types and unknown values without fabricating answers', () => {
  const matching = { a: 'true', b: 'false' };
  assert.equal(displayAnswerValue('matching', matching), matching);
  assert.deepEqual(displayAnswerValue('true_false_multiple', { a: 'unrecognized', b: null }), { a: 'unrecognized', b: null });
  assert.equal(displayAnswerValue('true_false_multiple', undefined), undefined);
});
