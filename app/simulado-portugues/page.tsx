'use client';

import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesPortugues } from '@/data/questoes-portugues';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const year = searchParams.get('year') || 'terceiro';
  const bimestre = searchParams.get('bimestre') || '1';
  const assessment = searchParams.get('assessment') || 'AV2';

  const questions = (questoesPortugues as any)[year]?.[bimestre]?.[assessment] || [];

  return (
    <SimuladoTemplate
      title={`Simulado de Português - ${bimestre}º Bimestre ${assessment}`}
      subtitle="3º Ano"
      emoji="📚"
      questions={questions}
    />
  );
}
