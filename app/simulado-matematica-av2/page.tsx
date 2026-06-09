import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesMatematicaAv2 } from '@/data/questoes-matematica-av2';

export const metadata = {
  title: 'Simulado AV2 - Matemática 2º Bimestre - 3º Ano',
  description: 'Simulado de Matemática AV2 para alunos do 3º ano, 2º bimestre com 30 questões sobre geometria e multiplicação.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado AV2 — Matemática"
      subtitle="2º Bimestre — 3º Ano"
      emoji="🧮"
      questions={questoesMatematicaAv2}
    />
  );
}
