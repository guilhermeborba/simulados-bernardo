import assert from 'node:assert/strict';
import test from 'node:test';
import { compareSchoolYears, resolveStoredTrack, schoolYearLabel, trackOfSchoolYear } from '../lib/gizTrack';

test('every stored school year belongs to exactly one track', () => {
  assert.equal(trackOfSchoolYear(-2), 'kids');
  assert.equal(trackOfSchoolYear(-1), 'kids');
  for (const year of [1, 2, 3, 4, 5]) assert.equal(trackOfSchoolYear(year), 'kids');
  for (const year of [6, 7, 8, 9, 10, 11, 12]) assert.equal(trackOfSchoolYear(year), 'escola');
  assert.equal(trackOfSchoolYear(0), 'tecnico');
});

test('labels follow how students name their year', () => {
  assert.equal(schoolYearLabel(-1), '4 anos');
  assert.equal(schoolYearLabel(-2), '5 anos');
  assert.equal(schoolYearLabel(3), '3º ano');
  assert.equal(schoolYearLabel(9), '9º ano');
  assert.equal(schoolYearLabel(10), '1ª série');
  assert.equal(schoolYearLabel(12), '3ª série');
  assert.equal(schoolYearLabel(0), 'Curso técnico');
});

test('years sort numerically, infantil first and técnico last', () => {
  assert.deepEqual([12, 2, 0, 10, -2, 9, -1, 1].sort(compareSchoolYears), [-1, -2, 1, 2, 9, 10, 12, 0]);
});

test('a Giz choice wins and only unambiguous legacy choices migrate', () => {
  assert.equal(resolveStoredTrack('escola', 'tecnico'), 'escola');
  assert.equal(resolveStoredTrack(null, 'tecnico'), 'tecnico');
  assert.equal(resolveStoredTrack(null, 'infantil'), 'kids');
  assert.equal(resolveStoredTrack(null, 'basica'), null);
  assert.equal(resolveStoredTrack('outra', null), null);
});
