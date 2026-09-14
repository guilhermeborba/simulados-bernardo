export type Trilha = 'basica' | 'tecnico';

/**
 * Curso técnico não tem ano escolar. O banco grava esses simulados com
 * schoolYear 0, e é por esse valor que a listagem deles é feita.
 */
export const TECNICO_SCHOOL_YEAR = 0;

const STORAGE_KEY = 'simulados:trilha';
const BLOQUEIO_KEY = 'simulados:trilha:bloqueada';

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

/**
 * Quem entra por um convite de turma já é direcionado para a trilha básica
 * e não deve ver a opção de trocar para o curso técnico.
 */
export function bloquearTrocaDeTrilha() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BLOQUEIO_KEY, '1');
  } catch {
    // idem
  }
}

export function isTrocaDeTrilhaBloqueada(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(BLOQUEIO_KEY) === '1';
  } catch {
    return false;
  }
}

export const TRILHA_LABELS: Record<Trilha, string> = {
  basica: 'Ensino Fundamental e Médio',
  tecnico: 'Cursos Técnicos',
};
