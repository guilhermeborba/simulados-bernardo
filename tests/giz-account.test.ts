import assert from 'node:assert/strict';
import { test } from 'node:test';
import { passwordError, safeReturnTo } from '../lib/gizAccountApi';
import { getTheme, getTimerDefault, readPreference, setTheme, setTimerDefault, writePreference } from '../lib/gizPreferences';

test('return destinations preserve invitations while refusing external or normalized control redirects', () => {
  assert.equal(safeReturnTo('/convite?t=invitation'), '/convite?t=invitation');
  assert.equal(safeReturnTo('/simulado/one?attempt=two'), '/simulado/one?attempt=two');
  for (const value of [null, 'https://example.com', '//example.com', '/\\example.com', '/\t/example.com', '/\n/example.com']) {
    assert.equal(safeReturnTo(value), null);
  }
});

test('passwords honor both minimum characters and the backend bcrypt byte boundary', () => {
  assert.ok(passwordError('1234567'));
  assert.equal(passwordError('12345678'), undefined);
  assert.equal(passwordError('a'.repeat(72)), undefined);
  assert.ok(passwordError('a'.repeat(73)));
  assert.equal(passwordError('😀'.repeat(18)), undefined);
  assert.ok(passwordError('😀'.repeat(19)));
});

test('server rendering can read preferences without browser globals', () => {
  assert.equal(getTheme(), 'auto');
  assert.equal(getTimerDefault(), true);
  assert.equal(readPreference('missing', 'fallback'), 'fallback');
  assert.equal(writePreference('missing', 'value'), false);
});

test('blocked browser storage keeps timer preferences for the current visit', () => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } },
    dispatchEvent() {},
  } });
  try {
    assert.equal(setTimerDefault(false), false);
    assert.equal(getTimerDefault(), false);
  } finally { Reflect.deleteProperty(globalThis, 'window'); }
});

test('malformed stored preferences fall back safely and valid theme changes apply to the document', () => {
  const storage = new Map<string, string>([['giz:theme', '"unknown"'], ['giz:timer', '"false"'], ['giz:bad', '{broken']]);
  const dataset: Record<string, string> = {};
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: { getItem(key: string) { return storage.get(key) ?? null; }, setItem(key: string, value: string) { storage.set(key, value); } },
    dispatchEvent() {},
  } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    documentElement: { dataset, removeAttribute(name: string) { if (name === 'data-theme') delete dataset.theme; } },
  } });
  try {
    assert.equal(getTheme(), 'auto');
    setTimerDefault(true);
    storage.set('giz:timer', '"false"');
    assert.equal(getTimerDefault(), true);
    assert.equal(readPreference('bad', 42), 42);
    assert.equal(setTheme('dark'), true);
    assert.equal(dataset.theme, 'dark');
    assert.equal(getTheme(), 'dark');
    setTheme('auto');
    assert.equal(dataset.theme, undefined);
  } finally {
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'document');
  }
});


test('a full storage quota uses the newest in-memory value instead of an old stored preference', () => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: { getItem() { return 'true'; }, setItem() { throw new Error('Quota exceeded'); } },
    dispatchEvent() {},
  } });
  try {
    assert.equal(writePreference('quota-test', false), false);
    assert.equal(readPreference('quota-test', true), false);
  } finally { Reflect.deleteProperty(globalThis, 'window'); }
});
