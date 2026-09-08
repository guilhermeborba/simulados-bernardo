export type Trilha = 'basica' | 'tecnico';

/**
 * Curso técnico não tem ano escolar. O banco grava esses simulados com
 * schoolYear 0, e é por esse valor que a listagem deles é feita.
 */
export const TECNICO_SCHOOL_YEAR = 0;

const STORAGE_KEY = 'simulados:trilha';

export function isTrilha(value: unknown): value is Trilha {
  return value === 'basica' || value === 'tecnico';
}

/** Trilha escolhida na última visita, para não perguntar de novo toda vez. */
export function lerTrilhaSalva(): Trilha | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isTrilha(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function salvarTrilha(trilha: Trilha) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, trilha);
  } catch {
    // Modo privativo / storage bloqueado: perder a memória da trilha é
    // aceitável, quebrar a navegação não.
  }
}

export function esquecerTrilha() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem
  }
}

export const TRILHA_LABELS: Record<Trilha, string> = {
  basica: 'Ensino Fundamental e Médio',
  tecnico: 'Cursos Técnicos',
};
