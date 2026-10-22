import { compareSchoolYears, subjectOf, SUBJECT_ORDER, type GizSubject, type GizTrack } from './gizTrack';

/**
 * Catalog choices in four steps. Only the year always has a value; an empty step means "all".
 * Kept free of React; mobile/src/core/catalog.ts mirrors it for Expo and tests/giz-catalog.test.ts checks they agree.
 */
type CatalogSimulation = { id: string; title: string; schoolYear: number; bimester: number; assessment: string; turmaId?: string | null; discipline: { name: string; slug?: string | null } };
type CatalogAttempt = { id: string; simulationId: string; status: string; finishedAt?: string | null; correctCount?: number };
export type CatalogChoice = { discipline: string | null; year: number; bimester: number | null; assessment: string | null; search: string };
export type SimulationState = 'new' | 'progress' | 'done';
export type SimulationStatus = { state: SimulationState; attempt?: CatalogAttempt; answered?: number; correct?: number };
export type CatalogSubject = { slug: string; name: string; subject: GizSubject | null };

export const CATALOG_PAGE = 6;
export const BIMESTERS = [1, 2, 3, 4] as const;
export const ASSESSMENTS = [{ value: 'AV1', note: '1ª avaliação' }, { value: 'AV2', note: '2ª avaliação' }] as const;
export const STATE_BADGE = { new: ['new', 'Novo'], progress: ['soft', 'Em andamento'], done: ['ok', 'Concluído'] } as const;
/** Years offered in each track even before they have content, so a child can find their own. */
const TRACK_YEARS: Record<GizTrack, number[]> = { kids: [1, 2, 3, 4, 5], escola: [6, 7, 8, 9, 10, 11, 12], tecnico: [0] };
/** The prototype's child is in the 3º ano: Kids starts there when the profile has no year. */
const KIDS_DEFAULT_YEAR = 3;

export function isFinished(attempt: { status: string; finishedAt?: string | null }) {
  return Boolean(attempt.finishedAt) || ['COMPLETED', 'FINISHED'].includes(attempt.status);
}

/** Accents and case do not matter when a child types a subject. */
export function normalizeSearch(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export function disciplineKey(discipline: { name: string; slug?: string | null }) {
  return discipline.slug || normalizeSearch(discipline.name).replace(/\s+/g, '-');
}

/** Subjects with their own colors first, in the prototype's order, then the others alphabetically. */
export function catalogSubjects(simulations: CatalogSimulation[]): CatalogSubject[] {
  const byKey = new Map<string, CatalogSubject>();
  for (const simulation of simulations) {
    const slug = disciplineKey(simulation.discipline);
    if (!byKey.has(slug)) byKey.set(slug, { slug, name: simulation.discipline.name, subject: subjectOf(simulation.discipline) });
  }
  return Array.from(byKey.values()).sort(compareSubjects);
}

function subjectRank(subject: GizSubject | null) {
  return subject ? SUBJECT_ORDER.indexOf(subject) : SUBJECT_ORDER.length;
}
function compareSubjects(a: { name: string; subject: GizSubject | null }, b: { name: string; subject: GizSubject | null }) {
  return subjectRank(a.subject) - subjectRank(b.subject) || a.name.localeCompare(b.name, 'pt-BR');
}

export function catalogYears(track: GizTrack, simulations: CatalogSimulation[]) {
  return Array.from(new Set([...TRACK_YEARS[track], ...simulations.map(simulation => simulation.schoolYear)])).sort(compareSchoolYears);
}

/** The profile year (from the turma) when it belongs to the track; otherwise the 3º ano in Kids, or the first year with content. */
export function defaultCatalogYear(track: GizTrack, simulations: CatalogSimulation[], profileYear: number | null) {
  const years = catalogYears(track, simulations);
  if (profileYear !== null && years.includes(profileYear)) return profileYear;
  if (track === 'kids') return KIDS_DEFAULT_YEAR;
  return years.find(year => simulations.some(simulation => simulation.schoolYear === year)) ?? years[0];
}

/** Short text inside the year circle: "3º", "1ª"; infantil keeps "4 anos". */
export function yearShortLabel(year: number) {
  if (year < 0) return `${3 - year} anos`;
  return year >= 10 ? `${year - 9}ª` : `${year}º`;
}

/** "do 3º ano", "da 1ª série", "de 4 anos" — and "ao", "à", "a" with `to`. */
export function yearWithArticle(year: number, to = false) {
  if (year < 0) return `${to ? 'a' : 'de'} ${3 - year} anos`;
  if (year >= 10) return `${to ? 'à' : 'da'} ${year - 9}ª série`;
  return `${to ? 'ao' : 'do'} ${year}º ano`;
}

/** What the "chegam em breve" card says about the years that already have simulations. */
export function availableYearsText(years: number[]) {
  if (!years.length) return '';
  if (years.length > 3) return 'Escolha outro ano para ver os simulados.';
  return `Por enquanto, temos simulados ${years.map(year => yearWithArticle(year)).join(', ').replace(/, ([^,]*)$/, ' e $1')}.`;
}

export function matchesChoice(simulation: CatalogSimulation, choice: CatalogChoice) {
  const search = normalizeSearch(choice.search);
  return simulation.schoolYear === choice.year
    && (!choice.discipline || disciplineKey(simulation.discipline) === choice.discipline)
    && (!choice.bimester || simulation.bimester === choice.bimester)
    && (!choice.assessment || simulation.assessment === choice.assessment)
    && (!search || normalizeSearch(`${simulation.discipline.name} ${simulation.title}`).includes(search));
}

/**
 * An unfinished attempt with saved answers is in progress; otherwise the latest finished attempt counts.
 * `answered` maps unfinished attempts to their saved answers (-1 when unreadable); attempts come newest first.
 */
export function simulationStatus(simulationId: string, attempts: CatalogAttempt[], answered: Record<string, number>): SimulationStatus {
  const own = attempts.filter(attempt => attempt.simulationId === simulationId);
  const open = own.find(attempt => !isFinished(attempt) && answered[attempt.id] !== 0);
  if (open) return { state: 'progress', attempt: open, answered: answered[open.id] > 0 ? answered[open.id] : undefined };
  const done = own.find(isFinished);
  if (done) return { state: 'done', attempt: done, correct: typeof done.correctCount === 'number' ? done.correctCount : undefined };
  return { state: 'new' };
}

/** "12 de 30 respondidas", "25 de 30 certas" or "30 questões". */
export function statusText(status: SimulationStatus, totalQuestions: number) {
  if (status.state === 'progress' && status.answered !== undefined) return `${status.answered} de ${totalQuestions} respondidas`;
  if (status.state === 'done' && status.correct !== undefined) return `${status.correct} de ${totalQuestions} certas`;
  return `${totalQuestions} questões`;
}

const STATE_ORDER: Record<SimulationState, number> = { progress: 0, new: 1, done: 2 };
/** In progress, then new, then done; inside each group the turma's own first, then subject, bimester and assessment. */
export function sortCatalog<T extends CatalogSimulation>(simulations: T[], stateOf: (simulation: T) => SimulationState, fromTurma: (simulation: T) => boolean) {
  const subject = (simulation: T) => ({ name: simulation.discipline.name, subject: subjectOf(simulation.discipline) });
  return [...simulations].sort((a, b) => STATE_ORDER[stateOf(a)] - STATE_ORDER[stateOf(b)]
    || Number(fromTurma(b)) - Number(fromTurma(a))
    || compareSubjects(subject(a), subject(b))
    || a.bimester - b.bimester
    || a.assessment.localeCompare(b.assessment));
}

/** Choices shown as removable chips; the search stays in its own field. */
export function catalogChips(choice: CatalogChoice, defaultYear: number, subjects: CatalogSubject[], yearLabel: (year: number) => string) {
  const chips: { key: 'discipline' | 'year' | 'bimester' | 'assessment'; label: string }[] = [];
  if (choice.discipline) chips.push({ key: 'discipline', label: subjects.find(subject => subject.slug === choice.discipline)?.name ?? choice.discipline });
  if (choice.year !== defaultYear) chips.push({ key: 'year', label: yearLabel(choice.year) });
  if (choice.bimester) chips.push({ key: 'bimester', label: `${choice.bimester}º bimestre` });
  if (choice.assessment) chips.push({ key: 'assessment', label: choice.assessment });
  return chips;
}

export function hasChoices(choice: CatalogChoice, defaultYear: number) {
  return Boolean(choice.discipline || choice.bimester || choice.assessment || choice.search.trim() || choice.year !== defaultYear);
}

/** Steps 2 to 4 away from their default, for the phone's counter. */
export function sheetChoiceCount(choice: CatalogChoice, defaultYear: number) {
  return Number(choice.year !== defaultYear) + Number(Boolean(choice.bimester)) + Number(Boolean(choice.assessment));
}

/** Choices kept in the address as ?d=geografia&ano=4&b=2&a=1 (never the search, which a child may fill with anything). */
export type CatalogParams = { discipline: string | null; year: number | null; bimester: number | null; assessment: string | null };
export function parseCatalogParams(params: { get(name: string): string | null }): CatalogParams {
  const number = (name: string) => { const value = Number(params.get(name)); return Number.isInteger(value) && params.get(name) !== null ? value : null; };
  const bimester = number('b'); const assessment = number('a'); const year = number('ano');
  return {
    discipline: params.get('d')?.trim() || null,
    year: year !== null && year >= -2 && year <= 12 ? year : null,
    bimester: bimester !== null && (BIMESTERS as readonly number[]).includes(bimester) ? bimester : null,
    assessment: assessment === 1 || assessment === 2 ? `AV${assessment}` : null,
  };
}
export function catalogQuery(choice: CatalogChoice, defaultYear: number) {
  const entries: [string, string][] = [];
  if (choice.discipline) entries.push(['d', choice.discipline]);
  if (choice.year !== defaultYear) entries.push(['ano', String(choice.year)]);
  if (choice.bimester) entries.push(['b', String(choice.bimester)]);
  if (choice.assessment) entries.push(['a', choice.assessment.replace('AV', '')]);
  return entries.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
}
