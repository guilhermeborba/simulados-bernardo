import { useSyncExternalStore } from 'react';
import { isTrilha, salvarTrilha, type Trilha } from './trilha';

export type GizTrack = 'kids' | 'escola' | 'tecnico';
export const GIZ_TRACKS: readonly GizTrack[] = ['kids', 'escola', 'tecnico'];

export const TRACK_INFO: Record<GizTrack, { name: string; audience: string; pitch: string }> = {
  kids: { name: 'Giz Kids', audience: 'Educação Infantil e Fundamental I', pitch: 'Simulados para aprender com dicas e curiosidades.' },
  escola: { name: 'Giz Escola', audience: 'Fundamental II e Ensino Médio', pitch: 'Simulados por disciplina, bimestre e avaliação.' },
  tecnico: { name: 'Giz Técnico', audience: 'Cursos técnicos', pitch: 'Simulados para revisar o conteúdo do curso.' },
};

const STORAGE_KEY = 'giz:track';
const TRACK_EVENT = 'giz:track';

export function isGizTrack(value: unknown): value is GizTrack {
  return value === 'kids' || value === 'escola' || value === 'tecnico';
}

/** Técnico is stored as schoolYear 0 and Educação Infantil as negative sentinels (see lib/trilha.ts). */
export function trackOfSchoolYear(schoolYear: number): GizTrack {
  if (schoolYear === 0) return 'tecnico';
  return schoolYear >= 6 ? 'escola' : 'kids';
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

const legacyTrack: Partial<Record<Trilha, GizTrack>> = { infantil: 'kids', tecnico: 'tecnico' };

/** A stored choice wins; legacy choices that map to a single Giz track are migrated. */
export function resolveStoredTrack(stored: string | null, legacy: string | null): GizTrack | null {
  if (isGizTrack(stored)) return stored;
  return isTrilha(legacy) ? legacyTrack[legacy] ?? null : null;
}

export function readTrack(): GizTrack | null {
  if (typeof window === 'undefined') return null;
  try {
    return resolveStoredTrack(window.localStorage.getItem(STORAGE_KEY), window.localStorage.getItem('simulados:trilha'));
  } catch {
    return null;
  }
}

export function applyTrack(track: GizTrack | null) {
  if (typeof document === 'undefined') return;
  if (track) document.documentElement.dataset.track = track;
  else document.documentElement.removeAttribute('data-track');
}

export function saveTrack(track: GizTrack) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, track);
  } catch {
    // Restricted storage: the choice lasts for this page only.
  }
  salvarTrilha(track === 'tecnico' ? 'tecnico' : 'basica');
  applyTrack(track);
  window.dispatchEvent(new Event(TRACK_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(TRACK_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(TRACK_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** `undefined` while rendering on the server or hydrating; `null` when no track was chosen. */
export function useGizTrack(): GizTrack | null | undefined {
  return useSyncExternalStore(subscribe, readTrack, () => undefined);
}
