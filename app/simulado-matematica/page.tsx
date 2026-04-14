import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesMathematica } from '@/data/questoes-matematica';

export const metadata = {
  title: 'Simulado de Matemática - 3º Ano',
  description: 'Simulado interativo de Matemática para alunos do 3º ano com gamificação e dicas pedagógicas.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado de Matemática"
      subtitle="3º Ano"
      emoji="🔢"
      questions={questoesMathematica}
    />
  );
}
