import assert from 'node:assert/strict';
import test from 'node:test';
import { compareSchoolYears, periodLabel, resolveStoredTrack, trackOfTurmas, schoolYearLabel, trackOfSchoolYear, TRACK_INFO } from '../lib/gizTrack';
import * as mobile from '../mobile/src/core/track';

test('web and Expo classify and label every school year the same way', () => {
  const years = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  for (const year of years) {
    assert.equal(mobile.trackOfSchoolYear(year), trackOfSchoolYear(year), `track of ${year}`);
    assert.equal(mobile.schoolYearLabel(year), schoolYearLabel(year), `label of ${year}`);
  }
  assert.deepEqual([...years].sort(mobile.compareSchoolYears), [...years].sort(compareSchoolYears));
  assert.deepEqual(mobile.TRACK_INFO, TRACK_INFO);
  for (const [bimester, assessment] of [[1, 'AV1'], [4, 'AV2'], [0, 'UNICO']] as const) assert.equal(mobile.periodLabel(bimester, assessment), periodLabel(bimester, assessment));
});

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

test('technical courses omit the period they do not have', () => {
  assert.equal(periodLabel(2, 'AV1'), '2º bimestre · AV1');
  assert.equal(periodLabel(0, 'UNICO'), '');
});

test('a turma decides the track of its members', () => {
  assert.equal(trackOfTurmas([{ schoolYear: 3 }]), 'kids');
  assert.equal(trackOfTurmas([{ schoolYear: null }, { schoolYear: 9 }]), 'escola');
  assert.equal(trackOfTurmas([{ schoolYear: null }]), null);
  assert.equal(trackOfTurmas([]), null);
  for (const turmas of [[{ schoolYear: 3 }], [{ schoolYear: 11 }], [{}]]) assert.equal(mobile.trackOfTurmas(turmas), trackOfTurmas(turmas));
});
