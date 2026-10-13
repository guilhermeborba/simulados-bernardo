import SelectionScreen from '@/components/SelectionScreen';
import LearningEntry from '@/components/LearningEntry';

export const metadata = {
  title: 'Simulados Bernardo — Quizzes e simulados',
  description: 'Escolha quizzes rápidos ou simulados e acompanhe sua prática',
};

export default function Home() {
  return <main><LearningEntry /><div id="simulados"><SelectionScreen /></div></main>;
}
