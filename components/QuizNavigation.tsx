'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './QuizCatalog.module.css';

export default function QuizNavigation({ current }: { current: 'catalog' | 'history' | 'runner' }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <nav className={styles.navigation} aria-label="Navegação dos quizzes">
      <Link href="/" className={styles.brand}><span className={styles.brandMark} aria-hidden="true">B</span><span>Simulados Bernardo</span></Link>
      <div className={styles.navLinks}>
        <Link href="/quizzes" aria-current={current === 'catalog' ? 'page' : undefined}>Quizzes</Link>
        {user?.role === 'STUDENT' && <Link href="/quizzes/historico" aria-current={current === 'history' ? 'page' : undefined}>Meu histórico</Link>}
        {user && <button type="button" onClick={() => { void logout().catch(() => undefined).finally(() => router.push('/login')); }}>Sair</button>}
      </div>
    </nav>
  );
}
