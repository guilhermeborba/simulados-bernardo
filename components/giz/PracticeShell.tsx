'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell, Button } from './ui';
import '@/app/legacy-learning.css';
import './practice.css';

const sections = [
  ['/pratica', 'Visão geral'],
  ['/quizzes', 'Quizzes'],
  ['/quizzes/historico', 'Histórico'],
  ['/progresso', 'Habilidades'],
  ['/colecao', 'Coleção'],
] as const;

/** Quizzes, XP, missions, skills and collection live here, inside the Giz shell. */
export default function PracticeShell({ title, subtitle, children, flow = false, backHref }: { title: string; subtitle?: string; children: ReactNode; flow?: boolean; backHref?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const current = sections.map(([href]) => href).filter(href => pathname === href || pathname.startsWith(`${href}/`)).sort((a, b) => b.length - a.length)[0];
  // Switching accounts from a practice page must not leave the previous student's data on screen.
  const signOut = user ? <Button variant="text" type="button" onClick={() => { void logout().catch(() => undefined).finally(() => router.push('/login')); }}>Sair</Button> : undefined;
  return <AppShell title={title} subtitle={subtitle} flow={flow} backHref={backHref} actions={signOut}>
    {!flow && <nav aria-label="Seções da prática" className="giz-chips practice-nav">{sections.map(([href, label]) => <Link key={href} href={href} className="chip" aria-current={current === href ? 'page' : undefined}>{label}</Link>)}</nav>}
    <div className="legacy-learning practice-surface">{children}</div>
  </AppShell>;
}
