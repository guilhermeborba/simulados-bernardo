// Mirrors lib/gizTrack.ts on the web (Metro cannot bundle code outside mobile/); tests/giz-track.test.ts checks they agree.
export type GizTrack = 'kids' | 'escola' | 'tecnico';
export const GIZ_TRACKS: readonly GizTrack[] = ['kids', 'escola', 'tecnico'];

export const TRACK_INFO: Record<GizTrack, { name: string; audience: string; pitch: string }> = {
  kids: { name: 'Giz Kids', audience: 'Educação Infantil e Fundamental I', pitch: 'Simulados para aprender com dicas e curiosidades.' },
  escola: { name: 'Giz Escola', audience: 'Fundamental II e Ensino Médio', pitch: 'Simulados por disciplina, bimestre e avaliação.' },
  tecnico: { name: 'Giz Técnico', audience: 'Cursos técnicos', pitch: 'Simulados para revisar o conteúdo do curso.' },
};

export function isGizTrack(value: unknown): value is GizTrack {
  return value === 'kids' || value === 'escola' || value === 'tecnico';
}

/** Técnico is stored as schoolYear 0 and Educação Infantil as negative sentinels. */
export function trackOfSchoolYear(schoolYear: number): GizTrack {
  if (schoolYear === 0) return 'tecnico';
  return schoolYear >= 6 ? 'escola' : 'kids';
}

/** Turma members follow their class's school year; a turma without one gives no hint. */
export function trackOfTurmas(turmas: ReadonlyArray<{ schoolYear?: number | null }>): GizTrack | null {
  const year = turmas.find(turma => typeof turma.schoolYear === 'number')?.schoolYear;
  return typeof year === 'number' ? trackOfSchoolYear(year) : null;
}

export function schoolYearLabel(schoolYear: number): string {
  if (schoolYear === 0) return 'Curso técnico';
  if (schoolYear < 0) return `${3 - schoolYear} anos`;
  if (schoolYear >= 10) return `${schoolYear - 9}ª série`;
  return `${schoolYear}º ano`;
}

/** Técnico courses have a single exam (bimester 0, assessment UNICO), so the period is omitted. */
export function periodLabel(bimester: number, assessment: string): string {
  return [bimester > 0 ? `${bimester}º bimestre` : null, assessment === 'UNICO' ? null : assessment].filter(Boolean).join(' · ');
}

/** 4 anos, 5 anos, 1º ano … 3ª série, then técnico. */
export function compareSchoolYears(a: number, b: number): number {
  const rank = (year: number) => (year === 0 ? 100 : year < 0 ? -10 - year : year);
  return rank(a) - rank(b);
}

/** Subjects with their own tile colors (<subject>-bg/-ink) and icon; others use the neutral book tile. */
export type GizSubject = 'geo' | 'his' | 'mat' | 'por' | 'cie';
const SUBJECTS: ReadonlyArray<[GizSubject, RegExp, string]> = [['geo', /geografia/, 'geografia'], ['his', /historia/, 'historia'], ['mat', /matematica/, 'matematica'], ['por', /portugu/, 'portugues'], ['cie', /ciencias/, 'ciencias']];
/** The order subjects are offered in the catalog. */
export const SUBJECT_ORDER: readonly GizSubject[] = SUBJECTS.map(([key]) => key);
export function subjectOf(discipline: { name: string; slug?: string | null }): GizSubject | null {
  const text = `${discipline.slug ?? ''} ${discipline.name}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return SUBJECTS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}
export function subjectIcon(subject: GizSubject | null): string {
  return SUBJECTS.find(([key]) => key === subject)?.[2] ?? 'book';
}
