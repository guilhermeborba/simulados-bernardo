import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesHistoriaAv2 } from '@/data/questoes-historia-av2';

export const metadata = {
  title: 'Simulado AV2 - História 2º Bimestre - 3º Ano',
  description: 'Simulado de História AV2 para alunos do 3º ano, 2º bimestre com 30 questões sobre culturas e organização das cidades.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado AV2 — História"
      subtitle="2º Bimestre — 3º Ano"
      emoji="📖"
      questions={questoesHistoriaAv2}
    />
  );
}
