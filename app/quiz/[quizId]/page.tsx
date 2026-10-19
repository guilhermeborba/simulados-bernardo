import { Suspense } from 'react';
import QuizRunner from '@/components/QuizRunner';
import PracticeShell from '@/components/giz/PracticeShell';

export const metadata = { title: 'Quiz rápido — Giz' };

export default function QuizPage({ params }: { params: { quizId: string } }) {
  return <PracticeShell title="Quiz rápido" flow backHref="/quizzes">
    <Suspense fallback={<p role="status">Carregando quiz...</p>}>
      <QuizRunner quizId={params.quizId} />
    </Suspense>
  </PracticeShell>;
}
