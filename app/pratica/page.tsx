import LearningEntry from '@/components/LearningEntry';
import PracticeShell from '@/components/giz/PracticeShell';

export const metadata = { title: 'Prática — Giz', description: 'Quizzes rápidos, missões da semana, XP e sua coleção.' };

export default function PracticePage() {
  return <PracticeShell title="Prática" subtitle="Quizzes, missões e sua coleção"><LearningEntry /></PracticeShell>;
}
