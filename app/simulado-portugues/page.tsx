import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesPortugues } from '@/data/questoes-portugues';

export const metadata = {
  title: 'Simulado de Português - 3º Ano',
  description: 'Simulado interativo de Português para alunos do 3º ano com gamificação e dicas pedagógicas.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado de Português"
      subtitle="3º Ano"
      emoji="📚"
      questions={questoesPortugues}
    />
  );
}
