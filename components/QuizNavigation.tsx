'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './QuizCatalog.module.css';

/** Header for guardian/teacher oversight; students navigate through the Giz shell. */
export default function QuizNavigation({ current }: { current: 'oversight' }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <nav className={styles.navigation} aria-label="Navegação do acompanhamento">
      <Link href="/" className={styles.brand}><span className={styles.brandMark} aria-hidden="true">g</span><span>Giz</span></Link>
      <div className={styles.navLinks}>
        {user && ['GUARDIAN', 'TEACHER', 'ADMIN'].includes(user.role) && <Link href="/acompanhamento" aria-current={current === 'oversight' ? 'page' : undefined}>Acompanhamento</Link>}
        {user && <button type="button" onClick={() => { void logout().catch(() => undefined).finally(() => router.push('/login')); }}>Sair</button>}
      </div>
    </nav>
  );
}
