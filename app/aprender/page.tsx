import SelectionScreen from '@/components/SelectionScreen';
import LearningEntry from '@/components/LearningEntry';

export const metadata = {
  title: 'Giz — Aprender hoje',
  description: 'Continue sua prática, descubra missões e acompanhe seu progresso em quizzes e simulados',
};

export default function Home() {
  return <main><LearningEntry /><div id="simulados"><SelectionScreen /></div></main>;
}
