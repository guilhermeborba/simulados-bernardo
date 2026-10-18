import type { ApiLearningPreferences } from './apiClient';
import { tierForSchoolYear, type Tier } from './tier';

export type QuizSegment = NonNullable<ApiLearningPreferences['segment']>;

export interface QuizSegmentConfig {
  value: QuizSegment;
  label: string;
  shortLabel: string;
  description: string;
  years: readonly number[];
  tier: Tier;
}

export const QUIZ_SEGMENTS: readonly QuizSegmentConfig[] = [
  { value: 'INFANTIL', label: 'Educação Infantil', shortLabel: 'Infantil', description: 'Descobrir e brincar', years: [-1, -2], tier: 'ludico' },
  { value: 'FUNDAMENTAL_I', label: 'Fundamental I', shortLabel: '1º ao 5º ano', description: 'Aprender a cada descoberta', years: [1, 2, 3, 4, 5], tier: 'ludico' },
  { value: 'FUNDAMENTAL_II', label: 'Fundamental II', shortLabel: '6º ao 9º ano', description: 'Explorar novas ideias', years: [6, 7, 8, 9], tier: 'jovem' },
  { value: 'MEDIO', label: 'Ensino Médio', shortLabel: 'Ensino Médio', description: 'Conectar conceitos', years: [10, 11, 12], tier: 'exame' },
  { value: 'ENFERMAGEM', label: 'Técnico em Enfermagem', shortLabel: 'Enfermagem', description: 'Revisar conhecimentos', years: [0], tier: 'exame' },
];

export function quizSegmentForYear(schoolYear: number): QuizSegment | null {
  return QUIZ_SEGMENTS.find((segment) => segment.years.includes(schoolYear))?.value ?? null;
}

export function quizYearLabel(schoolYear: number): string {
  if (schoolYear === -1) return '4 anos';
  if (schoolYear === -2) return '5 anos';
  if (schoolYear === 0) return 'Técnico em Enfermagem';
  if (schoolYear >= 10 && schoolYear <= 12) return `${schoolYear - 9}ª série do Médio`;
  return `${schoolYear}º ano`;
}

export function quizTierForPreferences(preferences: ApiLearningPreferences): Tier {
  if (preferences.schoolYear !== null) return tierForSchoolYear(preferences.schoolYear);
  return QUIZ_SEGMENTS.find((segment) => segment.value === preferences.segment)?.tier ?? 'ludico';
}

export function quizAudiencePatch(segment: QuizSegment | null): Pick<ApiLearningPreferences, 'segment' | 'schoolYear'> {
  // Both filters travel together: a previous year must never remain attached to a new segment.
  return { segment, schoolYear: null };
}

export function quizYearPatch(schoolYear: number | null, segment: QuizSegment | null): Pick<ApiLearningPreferences, 'segment' | 'schoolYear'> {
  return schoolYear === null
    ? { segment, schoolYear: null }
    : { segment: quizSegmentForYear(schoolYear), schoolYear };
}
