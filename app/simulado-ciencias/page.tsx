import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesCiencias } from '@/data/questoes-ciencias';

export const metadata = {
  title: 'Simulado de Ciências - 3º Ano',
  description: 'Simulado interativo de Ciências para alunos do 3º ano com gamificação e dicas pedagógicas.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado de Ciências"
      subtitle="3º Ano"
      emoji="🔬"
      questions={questoesCiencias}
    />
  );
}
