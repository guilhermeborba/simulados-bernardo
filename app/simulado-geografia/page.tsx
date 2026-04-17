import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesGeografia } from '@/data/questoes-geografia';

export const metadata = {
  title: 'Simulado de Geografia - 3º Ano',
  description: 'Simulado interativo de Geografia para alunos do 3º ano com 30 questões sobre mapas, espaço urbano e rural.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado de Geografia"
      subtitle="3º Ano"
      emoji="🌍"
      questions={questoesGeografia}
    />
  );
}
