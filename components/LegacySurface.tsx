'use client';
import { usePathname } from 'next/navigation';
import '@/app/legacy-learning.css';

const preservedRoutes = ['/aprender', '/quizzes', '/quiz', '/progresso', '/colecao', '/acompanhamento', '/esqueci-senha'];
export default function LegacySurface({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const preserved = preservedRoutes.some(route => pathname === route || pathname?.startsWith(`${route}/`));
  return preserved ? <div className="legacy-learning">{children}</div> : <>{children}</>;
}
