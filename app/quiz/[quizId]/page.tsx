import { Suspense } from 'react';
import localFont from 'next/font/local';
import QuizRunner from '@/components/QuizRunner';

const jakarta = localFont({ src: '../../fonts/plusjakartasans-latin.woff2', weight: '500 700', variable: '--font-jakarta', display: 'swap' });
const serif = localFont({ src: '../../fonts/sourceserif4-latin.woff2', weight: '400 600', variable: '--font-serif', display: 'swap' });
const plex = localFont({ src: '../../fonts/ibmplexsans-latin.woff2', weight: '400 600', variable: '--font-plex', display: 'swap' });

export const metadata = { title: 'Quiz rápido — Simulados Bernardo' };

export default function QuizPage({ params }: { params: { quizId: string } }) {
  return <div className={`${jakarta.variable} ${serif.variable} ${plex.variable}`}>
    <Suspense fallback={<p role="status" className="page-shell">Carregando quiz...</p>}>
      <QuizRunner quizId={params.quizId} />
    </Suspense>
  </div>;
}
