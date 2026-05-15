import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesGeografiaAv1 } from '@/data/questoes-geografia-av1';

export const metadata = {
  title: 'Simulado AV1 - Geografia 2º Bimestre - 3º Ano',
  description: 'Simulado AV1 de Geografia para o 2º bimestre do 3º ano sobre agricultura, pecuária e sistemas agrícolas.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="SIMULADO AV1 — GEOGRAFIA"
      subtitle="2º Bimestre — 3º Ano"
      emoji="🌎"
      questions={questoesGeografiaAv1}
    />
  );
}
