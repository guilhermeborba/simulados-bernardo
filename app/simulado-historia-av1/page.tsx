import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesHistoriaAv1 } from '@/data/questoes-historia-av1';

export const metadata = {
  title: 'Simulado AV1 - História 2º Bimestre - 3º Ano',
  description: 'Simulado AV1 de História para o 2º bimestre do 3º ano com questões sobre diversidade nas cidades, cultura e convivência.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="SIMULADO AV1 — HISTÓRIA"
      subtitle="2º Bimestre — 3º Ano"
      emoji="📖"
      questions={questoesHistoriaAv1}
    />
  );
}
