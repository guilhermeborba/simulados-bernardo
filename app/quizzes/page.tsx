import QuizCatalog from '@/components/QuizCatalog';
import PracticeShell from '@/components/giz/PracticeShell';

export const metadata = { title: 'Quizzes — Giz', description: 'Quizzes curtos, com explicações e temas para todas as faixas de ensino.' };

export default function QuizzesPage() { return <PracticeShell title="Quizzes" subtitle="Uma pergunta de cada vez"><QuizCatalog /></PracticeShell>; }
