/**
 * Faixa visual do simulado.
 *
 * O nome descreve o tratamento, não o público, porque uma mesma faixa pode
 * atender mais de um público (Ensino Médio e Cursos Técnicos compartilham
 * o tratamento de prova).
 *
 * - ludico  → Educação Infantil e Fundamental 1 (visual atual)
 * - jovem   → Fundamental 2
 * - exame   → Ensino Médio e Cursos Técnicos
 */
export type Tier = 'ludico' | 'jovem' | 'exame';

export const DEFAULT_TIER: Tier = 'ludico';

/**
 * Deriva a faixa a partir do ano escolar da simulação.
 *
 * Cursos técnicos são gravados com schoolYear 0 (não têm ano escolar), e por
 * isso caem na mesma faixa do Ensino Médio.
 */
export function tierForSchoolYear(schoolYear: number | null | undefined): Tier {
  if (schoolYear === null || schoolYear === undefined) {
    return DEFAULT_TIER;
  }

  if (schoolYear >= 1 && schoolYear <= 5) {
    return 'ludico';
  }

  if (schoolYear >= 6 && schoolYear <= 9) {
    return 'jovem';
  }

  return 'exame';
}
