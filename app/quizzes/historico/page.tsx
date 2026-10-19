import QuizHistory from '@/components/QuizHistory';
import PracticeShell from '@/components/giz/PracticeShell';

export const metadata = { title: 'Histórico de quizzes — Giz' };

export default function QuizHistoryPage() { return <PracticeShell title="Histórico de quizzes"><QuizHistory /></PracticeShell>; }
