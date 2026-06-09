import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesGeografiaAv2 } from '@/data/questoes-geografia-av2';

export const metadata = {
  title: 'Simulado AV2 - Geografia 2º Bimestre - 3º Ano',
  description: 'Simulado de Geografia AV2 para alunos do 3º ano, 2º bimestre com 30 questões sobre extrativismo, pecuária e paisagens.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado AV2 — Geografia"
      subtitle="2º Bimestre — 3º Ano"
      emoji="🗺️"
      questions={questoesGeografiaAv2}
    />
  );
}
