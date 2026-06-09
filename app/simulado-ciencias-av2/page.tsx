import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesCienciasAv2 } from '@/data/questoes-ciencias-av2';

export const metadata = {
  title: 'Simulado AV2 - Ciências 2º Bimestre - 3º Ano',
  description: 'Simulado de Ciências AV2 para alunos do 3º ano, 2º bimestre com 30 questões sobre o solo, minerais e conservação.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado AV2 — Ciências"
      subtitle="2º Bimestre — 3º Ano"
      emoji="🌱"
      questions={questoesCienciasAv2}
    />
  );
}
