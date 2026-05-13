import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesCienciasAv1 } from '@/data/questoes-ciencias-av1';

export const metadata = {
  title: 'Simulado AV1 - Ciências 2º Bimestre - 3º Ano',
  description: 'Simulado interativo de Ciências AV1 para alunos do 3º ano com gamificação e dicas pedagógicas.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado AV1 — Ciências"
      subtitle="2º Bimestre — 3º Ano"
      emoji="🔬"
      questions={questoesCienciasAv1}
    />
  );
}