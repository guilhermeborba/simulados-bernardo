import SimuladoTemplate from '@/components/SimuladoTemplate';
import { questoesEnfermagem } from '@/data/questoes-enfermagem';

export const metadata = {
  title: 'Simulado — Fundamentos, Ética e Legislação em Enfermagem',
  description: 'Simulado do Curso Técnico em Enfermagem com 75 questões sobre história da Enfermagem, Código de Ética, teorias de Enfermagem, entidades de classe e Lei do Exercício Profissional.',
};

export default function Page() {
  return (
    <SimuladoTemplate
      title="Simulado — Fundamentos, Ética e Legislação em Enfermagem"
      subtitle="Curso Técnico em Enfermagem — 75 questões"
      emoji="🩺"
      questions={questoesEnfermagem}
    />
  );
}
