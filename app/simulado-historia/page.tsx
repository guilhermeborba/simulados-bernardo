import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesHistoria } from '@/data/questoes-historia';

export const metadata = {
  title: 'Simulado de História - 3º Ano',
  description: 'Simulado interativo de História para alunos do 3º ano com gamificação e dicas pedagógicas.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado de História"
      subtitle="3º Ano"
      emoji="🏛️"
      questions={questoesHistoria}
    />
  );
}
