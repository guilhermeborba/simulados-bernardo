import assert from 'node:assert/strict';
import test from 'node:test';
import * as web from '../lib/gizCatalog';
import * as mobile from '../mobile/src/core/catalog';
import { schoolYearLabel } from '../lib/gizTrack';

const sim = (id: string, discipline: string, schoolYear: number, bimester: number, assessment: string, extra: Partial<{ title: string; turmaId: string; slug: string }> = {}) => ({ id, title: extra.title ?? `Simulado de ${discipline}`, schoolYear, bimester, assessment, turmaId: extra.turmaId ?? null, discipline: { name: discipline, slug: extra.slug ?? null } });
const catalog = [
  sim('geo-1-1', 'Geografia', 3, 1, 'AV1', { slug: 'geografia' }),
  sim('geo-2-1', 'Geografia', 3, 2, 'AV1', { slug: 'geografia' }),
  sim('mat-1-2', 'Matemática', 3, 1, 'AV2', { slug: 'matematica' }),
  sim('por-1-2', 'Português', 3, 1, 'AV2', { slug: 'portugues', title: 'Simulado de Português - 1º Bimestre AV2', turmaId: 'turma-3' }),
  sim('arte-6', 'Arte', 3, 1, 'AV1', { slug: 'arte' }),
  sim('cie-5', 'Ciências', 5, 4, 'AV2', { slug: 'ciencias' }),
  sim('inf-4', 'O eu, o outro e o nós', -1, 0, 'UNICO', { slug: 'infantil-eu-outro-nos' }),
];
const attempts = [
  { id: 'empty', simulationId: 'geo-1-1', status: 'IN_PROGRESS', finishedAt: null },
  { id: 'done', simulationId: 'geo-1-1', status: 'FINISHED', finishedAt: '2026-10-20T10:00:00Z', correctCount: 25 },
  { id: 'open', simulationId: 'mat-1-2', status: 'IN_PROGRESS', finishedAt: null },
];
const answered = { empty: 0, open: 12 };
const choice = (patch: Partial<web.CatalogChoice> = {}): web.CatalogChoice => ({ discipline: null, year: 3, bimester: null, assessment: null, search: '', ...patch });

test('web and Expo apply the same catalog rules', () => {
  const choices = [choice(), choice({ discipline: 'geografia', bimester: 2 }), choice({ search: 'matematica' }), choice({ year: -1 }), choice({ assessment: 'AV2', search: 'bimestre av2' })];
  for (const item of choices) assert.deepEqual(catalog.filter(s => mobile.matchesChoice(s, item)), catalog.filter(s => web.matchesChoice(s, item)), JSON.stringify(item));
  assert.deepEqual(mobile.catalogSubjects(catalog), web.catalogSubjects(catalog));
  for (const track of ['kids', 'escola', 'tecnico'] as const) {
    assert.deepEqual(mobile.catalogYears(track, catalog), web.catalogYears(track, catalog));
    for (const profile of [null, 4, 9]) assert.equal(mobile.defaultCatalogYear(track, catalog, profile), web.defaultCatalogYear(track, catalog, profile));
  }
  for (const s of catalog) assert.deepEqual(mobile.simulationStatus(s.id, attempts, answered), web.simulationStatus(s.id, attempts, answered));
  const stateOf = (s: { id: string }) => web.simulationStatus(s.id, attempts, answered).state;
  assert.deepEqual(mobile.sortCatalog(catalog, stateOf, s => Boolean(s.turmaId)).map(s => s.id), web.sortCatalog(catalog, stateOf, s => Boolean(s.turmaId)).map(s => s.id));
  for (const year of [-2, -1, 1, 3, 9, 10, 12]) {
    assert.equal(mobile.yearShortLabel(year), web.yearShortLabel(year));
    assert.equal(mobile.yearWithArticle(year, true), web.yearWithArticle(year, true));
  }
  assert.equal(mobile.availableYearsText([3, 4]), web.availableYearsText([3, 4]));
  const full = choice({ discipline: 'geografia', year: 4, bimester: 2, assessment: 'AV1' });
  assert.deepEqual(mobile.catalogChips(full, 3, mobile.catalogSubjects(catalog), schoolYearLabel), web.catalogChips(full, 3, web.catalogSubjects(catalog), schoolYearLabel));
  assert.equal(mobile.sheetChoiceCount(full, 3), web.sheetChoiceCount(full, 3));
});

test('subjects keep the prototype order, then the others alphabetically', () => {
  assert.deepEqual(web.catalogSubjects(catalog.filter(s => s.schoolYear === 3)).map(s => s.name), ['Geografia', 'Matemática', 'Português', 'Arte']);
  assert.equal(web.catalogSubjects([sim('x', 'Língua Portuguesa', 3, 1, 'AV1')])[0].slug, 'lingua-portuguesa');
});

test('the year starts at the profile year, else the 3º ano in Kids or the first year with content', () => {
  assert.equal(web.defaultCatalogYear('kids', catalog, null), 3);
  assert.equal(web.defaultCatalogYear('kids', catalog, 5), 5);
  assert.equal(web.defaultCatalogYear('kids', catalog, 9), 3, 'a year from another track is ignored');
  assert.equal(web.defaultCatalogYear('escola', [sim('h', 'História', 7, 1, 'AV1')], null), 7);
  assert.deepEqual(web.catalogYears('kids', catalog), [-1, 1, 2, 3, 4, 5]);
  assert.deepEqual(web.catalogYears('tecnico', []), [0]);
});

test('years read like the children say them', () => {
  assert.deepEqual([3, 10, -1].map(year => web.yearShortLabel(year)), ['3º', '1ª', '4 anos']);
  assert.deepEqual([3, 10, -1].map(year => web.yearWithArticle(year)), ['do 3º ano', 'da 1ª série', 'de 4 anos']);
  assert.deepEqual([3, 10].map(year => web.yearWithArticle(year, true)), ['ao 3º ano', 'à 1ª série']);
  assert.equal(web.availableYearsText([3]), 'Por enquanto, temos simulados do 3º ano.');
  assert.equal(web.availableYearsText([3, 4, 5]), 'Por enquanto, temos simulados do 3º ano, do 4º ano e do 5º ano.');
  assert.equal(web.availableYearsText([1, 2, 3, 4]), 'Escolha outro ano para ver os simulados.');
});

test('steps combine, and the search ignores accents and case', () => {
  const ids = (item: web.CatalogChoice) => catalog.filter(s => web.matchesChoice(s, item)).map(s => s.id);
  assert.deepEqual(ids(choice()), ['geo-1-1', 'geo-2-1', 'mat-1-2', 'por-1-2', 'arte-6']);
  assert.deepEqual(ids(choice({ discipline: 'geografia', bimester: 2 })), ['geo-2-1']);
  assert.deepEqual(ids(choice({ assessment: 'AV2' })), ['mat-1-2', 'por-1-2']);
  assert.deepEqual(ids(choice({ search: '  MATEMATICA ' })), ['mat-1-2']);
  assert.deepEqual(ids(choice({ search: 'bimestre av2' })), ['por-1-2'], 'the free title is searched too');
  assert.deepEqual(ids(choice({ year: 4 })), []);
});

test('each simulation has one state with its progress text', () => {
  const geo = web.simulationStatus('geo-1-1', attempts, answered);
  assert.equal(geo.state, 'done', 'an empty newer attempt does not hide a finished one');
  assert.equal(web.statusText(geo, 30), '25 de 30 certas');
  const mat = web.simulationStatus('mat-1-2', attempts, answered);
  assert.equal(mat.state, 'progress');
  assert.equal(web.statusText(mat, 30), '12 de 30 respondidas');
  assert.equal(web.simulationStatus('mat-1-2', attempts, { open: -1 }).state, 'progress', 'unreadable answers still count as started');
  assert.equal(web.statusText(web.simulationStatus('mat-1-2', attempts, { open: -1 }), 30), '30 questões');
  assert.equal(web.simulationStatus('mat-1-2', attempts, { open: 0 }).state, 'new', 'an attempt without answers is still new');
  assert.equal(web.statusText(web.simulationStatus('geo-2-1', attempts, answered), 30), '30 questões');
  assert.equal(web.isFinished({ status: 'IN_PROGRESS' }), false);
});

test('results come in progress, new and done order, the turma first, then subject and period', () => {
  const stateOf = (s: { id: string }) => web.simulationStatus(s.id, attempts, answered).state;
  const year3 = catalog.filter(s => s.schoolYear === 3);
  assert.deepEqual(web.sortCatalog(year3, stateOf, s => Boolean(s.turmaId)).map(s => s.id), ['mat-1-2', 'por-1-2', 'geo-2-1', 'arte-6', 'geo-1-1']);
});

test('chips, the clear button and the phone counter follow what moved from the default', () => {
  const subjects = web.catalogSubjects(catalog);
  assert.deepEqual(web.catalogChips(choice(), 3, subjects, schoolYearLabel), []);
  assert.equal(web.hasChoices(choice(), 3), false);
  assert.equal(web.hasChoices(choice({ search: 'geo' }), 3), true);
  assert.deepEqual(web.catalogChips(choice({ discipline: 'geografia', year: 4, bimester: 2, assessment: 'AV1' }), 3, subjects, schoolYearLabel).map(chip => chip.label), ['Geografia', '4º ano', '2º bimestre', 'AV1']);
  assert.equal(web.sheetChoiceCount(choice({ discipline: 'geografia', bimester: 2 }), 3), 1);
  assert.equal(web.sheetChoiceCount(choice({ year: 4, bimester: 2, assessment: 'AV1' }), 3), 3);
});

test('choices travel in the address without the search, and bad values are dropped', () => {
  assert.equal(web.catalogQuery(choice({ discipline: 'geografia', bimester: 2, assessment: 'AV1', search: 'Bia' }), 3), 'd=geografia&b=2&a=1');
  assert.equal(web.catalogQuery(choice({ year: 4 }), 3), 'ano=4');
  assert.equal(web.catalogQuery(choice(), 3), '');
  assert.deepEqual(web.parseCatalogParams(new URLSearchParams('d=geografia&ano=4&b=2&a=1')), { discipline: 'geografia', year: 4, bimester: 2, assessment: 'AV1' });
  assert.deepEqual(web.parseCatalogParams(new URLSearchParams('ano=40&b=7&a=3&d=')), { discipline: null, year: null, bimester: null, assessment: null });
  assert.deepEqual(web.parseCatalogParams(new URLSearchParams('ano=0')), { discipline: null, year: 0, bimester: null, assessment: null });
});
