import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readJournal, writeJournal, type JournalFiles } from './journal';

const valid = (value: unknown): value is { confirmed: number } => Boolean(value && typeof value === 'object' && typeof (value as { confirmed?: unknown }).confirmed === 'number');
function memory() {
  const slots: [string | null, string | null] = [null, null];
  let fail = false;
  const files: JournalFiles = { read: (slot) => slots[slot], write(slot, text) {
    // Mimic create({overwrite:true}) truncation followed by a failing write.
    slots[slot] = '';
    if (fail) { slots[slot] = text.slice(0, 17); throw new Error('Quota or IO failure'); }
    slots[slot] = text;
  } };
  return { files, slots, failNext: () => { fail = true; }, recover: () => { fail = false; } };
}

test('partial write after truncation preserves the previous complete checkpoint', () => {
  const device = memory();
  assert.equal(writeJournal(device.files, { confirmed: 12 }, valid), true);
  device.failNext();
  assert.equal(writeJournal(device.files, { confirmed: 13 }, valid), false);
  assert.deepEqual(readJournal(device.files, valid), { confirmed: 12 });
  device.recover();
  assert.equal(writeJournal(device.files, { confirmed: 13 }, valid), true);
  assert.deepEqual(readJournal(device.files, valid), { confirmed: 13 });
});

test('corrupt latest checkpoint falls back to the previous slot', () => {
  const device = memory();
  writeJournal(device.files, { confirmed: 12 }, valid);
  writeJournal(device.files, { confirmed: 13 }, valid);
  device.slots[1] = '{broken';
  assert.deepEqual(readJournal(device.files, valid), { confirmed: 12 });
});

test('a completed attempt tombstone stays distinguishable from a missing pointer', () => {
  const device = memory();
  const pointer = (value: unknown): value is { attemptId: string | null } => Boolean(value && typeof value === 'object' && ('attemptId' in value) && ((value as { attemptId: unknown }).attemptId === null || typeof (value as { attemptId: unknown }).attemptId === 'string'));
  writeJournal(device.files, { attemptId: 'attempt' }, pointer);
  writeJournal(device.files, { attemptId: null }, pointer);
  assert.deepEqual(readJournal(device.files, pointer), { attemptId: null });
});
