import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesMatematicaAv1 } from '@/data/questoes-matematica-av1';

export const metadata = {
  title: 'Simulado AV1 de Matemática - 3º Ano',
  description: 'Simulado AV1 de Matemática para o 2º bimestre do 3º ano, com questões de geometria e sólidos geométricos.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="SIMULADO AV1 – MATEMÁTICA"
      subtitle="2º BIMESTRE · 3º ANO"
      emoji="📐"
      questions={questoesMatematicaAv1}
    />
  );
}
